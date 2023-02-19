import {
  BooleanExpr,
  CharacterExpr,
  Client,
  fql,
  GuildExpr,
  InstanceExpr,
  InventoryExpr,
  NullExpr,
  NumberExpr,
  RefExpr,
  StringExpr,
  TimeExpr,
  UserExpr,
} from './fql.ts';

export interface User {
  id: StringExpr;
  inventories: RefExpr[];
}

export interface Guild {
  id: StringExpr;
  instances: RefExpr[];
}

export interface Instance {
  main: BooleanExpr;
  inventories: RefExpr[];
  guild: RefExpr;
}

export interface Inventory {
  lastPull: TimeExpr | NullExpr;
  availablePulls: NumberExpr;
  rechargeTimestamp: TimeExpr | NullExpr;
  characters: RefExpr[];
  instance: RefExpr;
  user: RefExpr;
}

export interface CharacterNode {
  character: CharacterExpr;
  anchor: StringExpr;
}

export const MAX_PULLS = 5;
export const RECHARGE_MINS = 15;

export function getUser(id: StringExpr): UserExpr {
  return fql.Let({
    match: fql.Match(fql.Index('users_discord_id'), id),
  }, ({ match }) =>
    fql.If(
      fql.IsNonEmpty(match),
      // return existing user
      fql.Get(match),
      // create a new user then return it
      fql.Create<User>('user', {
        id,
        inventories: [],
      }),
    ));
}

export function getGuild(id: StringExpr): GuildExpr {
  return fql.Let({
    match: fql.Match(fql.Index('guilds_discord_id'), id),
  }, ({ match }) =>
    fql.If(
      fql.IsNonEmpty(match),
      // return existing guild
      fql.Get(match),
      // create a new guild then return it
      fql.Create<Guild>('guild', {
        id,
        instances: [],
      }),
    ));
}

export function getInstance(guild: GuildExpr): InstanceExpr {
  return fql.Let({
    match: fql.Select(['data', 'instances'], guild),
  }, ({ match }) =>
    fql.If(
      fql.IsNonEmpty(match),
      // return first instance in array
      // TODO support additional instances per guild
      fql.Get(fql.Select([0], match)),
      fql.Let(
        {
          // create a new instance
          createdInstance: fql.Create<Instance>('instance', {
            main: true,
            guild: fql.Ref(guild),
            inventories: [],
          }),
          // update the guild instances list
          updatedGuild: fql.Update<Guild>(fql.Ref(guild), {
            instances: [fql.Ref(fql.Var('createdInstance'))],
          }),
        },
        // return the created instance
        ({ createdInstance }) => createdInstance,
      ),
    ));
}

export function getInventory(
  { instance, user }: { instance: InstanceExpr; user: UserExpr },
): InventoryExpr {
  return fql.Let({
    match: fql.Match(
      fql.Index('inventories_instance_user'),
      fql.Ref(instance),
      fql.Ref(user),
    ),
  }, ({ match }) =>
    fql.If(
      fql.IsNonEmpty(match),
      fql.Get(match),
      fql.Let(
        {
          // create a new inventory
          createdInventory: fql.Create<Inventory>('inventory', {
            lastPull: fql.Null(),
            availablePulls: MAX_PULLS,
            rechargeTimestamp: fql.Null(),
            characters: [],
            instance: fql.Ref(instance),
            user: fql.Ref(user),
          }),
          // update the instance inventories list
          updatedInstance: fql.Update<Instance>(fql.Ref(instance), {
            inventories: fql.Append(
              fql.Ref(fql.Var('createdInventory')),
              fql.Select(['data', 'inventories'], instance),
            ),
          }),
          // update the user inventories list
          updatedUser: fql.Update<User>(fql.Ref(user), {
            inventories: fql.Append(
              fql.Ref(fql.Var('createdInventory')),
              fql.Select(['data', 'inventories'], user),
            ),
          }),
        },
        ({ createdInventory }) => createdInventory,
      ),
    ));
}

// export function getCharacterNode(
//   { inventory, on, before, after }: {
//     inventory: InventoryExpr;
//     on?: string;
//     before?: string;
//     after?: string;
//   },
// ): CharacterNode {
//   return fql.Let({
//     characters: fql.Match(
//       fql.Index('characters_inventory'),
//       fql.Ref(inventory),
//     ),
//     character: fql.If(
//       fql.IsNonEmpty(fql.Var('characters')),
//       fql.If(
//         fql.IsNull(before),
//         fql.If(
//           fql.And(fql.IsNull(after), fql.IsNull(on)),
//           fql.Ref(fql.Get(fql.Var('characters'))),
//           fql.Let({
//             // after returns itself then a new item
//             match: fql.Paginate(fql.Var('characters'), {
//               after: fql.Id(
//                 'character',
//                 // deno-lint-ignore no-non-null-assertion
//                 fql.If(fql.IsNull(after), on!, after!),
//               ),
//               size: 2,
//             }),
//           }, ({ match }) => {
//             return fql.Select(
//               ['data', fql.If(fql.IsNull(after), 0, 1)],
//               match,
//               // or first item
//               fql.Ref(fql.Get(fql.Var('characters'))),
//             );
//           }),
//         ),
//         fql.Let({
//           // before doesn't return itself
//           match: fql.Paginate(fql.Var('characters'), {
//             // deno-lint-ignore no-non-null-assertion
//             before: fql.Id('character', before!),
//             size: 1,
//           }),
//         }, ({ match }) => {
//           return fql.Select(
//             ['data', 0],
//             match,
//             // or last item
//             fql.Ref(fql.Get(fql.Reverse(fql.Var('characters')))),
//           );
//         }),
//       ),
//       fql.Null(),
//     ),
//   }, ({ character }) => {
//     return {
//       character,
//       anchor: fql.Select(['id'], character, fql.Null()),
//     };
//   });
// }

export function rechargePulls(
  { inventory }: { inventory: InventoryExpr },
): InventoryExpr {
  return fql.Let(
    {
      rechargeTimestamp: fql.Select(
        ['data', 'rechargeTimestamp'],
        inventory,
        fql.Now(), // fallback
      ),
      currentPulls: fql.Select(['data', 'availablePulls'], inventory),
      newPulls: fql.Divide(
        fql.TimeDiffInMinutes(
          fql.Var('rechargeTimestamp'),
          fql.Now(),
        ),
        RECHARGE_MINS,
      ),
      rechargedPulls: fql.Min(
        MAX_PULLS,
        fql.Add(fql.Var('currentPulls'), fql.Var('newPulls')),
      ),
      diffPulls: fql.Subtract(
        fql.Var('rechargedPulls'),
        fql.Var('currentPulls'),
      ),
    },
    ({ rechargeTimestamp, diffPulls, rechargedPulls }) =>
      fql.Update<Inventory>(fql.Ref(inventory), {
        availablePulls: rechargedPulls,
        rechargeTimestamp: fql.If(
          fql.GTE(rechargedPulls, MAX_PULLS),
          fql.Null(),
          fql.TimeAddInMinutes(
            rechargeTimestamp,
            fql.Multiply(diffPulls, RECHARGE_MINS),
          ),
        ),
      }),
  );
}

export default function (client: Client): (() => Promise<void>)[] {
  return [
    fql.Indexer({
      client,
      unique: true,
      collection: 'user',
      name: 'users_discord_id',
      terms: [{ field: ['data', 'id'] }],
    }),
    fql.Indexer({
      client,
      unique: true,
      collection: 'guild',
      name: 'guilds_discord_id',
      terms: [{ field: ['data', 'id'] }],
    }),
    fql.Indexer({
      client,
      unique: true,
      collection: 'inventory',
      name: 'inventories_instance_user',
      terms: [{ field: ['data', 'instance'] }, { field: ['data', 'user'] }],
    }),
    fql.Indexer({
      client,
      unique: false,
      collection: 'character',
      name: 'characters_inventory',
      terms: [{ field: ['data', 'inventory'] }],
    }),
    fql.Resolver({
      client,
      name: 'get_user_inventory',
      lambda: (userId: string, guildId: string) => {
        return fql.Let(
          {
            user: getUser(userId),
            guild: getGuild(guildId),
            instance: getInstance(fql.Var('guild')),
            inventory: getInventory({
              user: fql.Var('user'),
              instance: fql.Var('instance'),
            }),
          },
          rechargePulls,
        );
      },
    }),
    // fql.Resolver({
    //   client,
    //   name: 'get_user_characters',
    //   lambda: (
    //     userId: string,
    //     guildId: string,
    //     on?: string,
    //     before?: string,
    //     after?: string,
    //   ) => {
    //     return fql.Let(
    //       {
    //         user: getUser(userId),
    //         guild: getGuild(guildId),
    //         instance: getInstance(fql.Var('guild')),
    //         inventory: getInventory({
    //           user: fql.Var('user'),
    //           instance: fql.Var('instance'),
    //         }),
    //       },
    //       ({ inventory }) =>
    //         getCharacterNode({
    //           inventory,
    //           on,
    //           before,
    //           after,
    //         }),
    //     );
    //   },
    // }),
  ];
}
