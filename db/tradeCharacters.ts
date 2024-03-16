import db from '~/db/mod.ts';

import { newInventory } from '~/db/getInventory.ts';

import type * as Schema from '~/db/schema.ts';

export const STEAL_COOLDOWN_HOURS = 3 * 24;

export async function giveCharacters(
  {
    aUserId,
    bUserId,
    guildId,
    giveIds,
  }: {
    aUserId: string;
    bUserId: string;
    guildId: string;
    giveIds: string[];
  },
): Promise<void> {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    const giveCharacters = await db.characters().aggregate()
      .match({
        id: { $in: giveIds },
        userId: aUserId,
        guildId,
      })
      .lookup({
        localField: 'inventoryId',
        foreignField: '_id',
        from: 'inventories',
        as: 'inventory',
      })
      .toArray() as Schema.PopulatedCharacter[];

    if (giveCharacters.length !== giveIds.length) {
      throw new Error();
    }

    const aInventory = giveCharacters[0].inventory;

    const aParty = [
      aInventory.party.member1Id,
      aInventory.party.member2Id,
      aInventory.party.member3Id,
      aInventory.party.member4Id,
      aInventory.party.member5Id,
    ];

    if (
      giveCharacters
        .some((character) => aParty.includes(character._id))
    ) {
      throw new Error();
    }

    // deno-lint-ignore no-non-null-assertion
    const bInventory = (await db.inventories().findOneAndUpdate(
      { userId: bUserId, guildId },
      { $setOnInsert: newInventory(guildId, bUserId) },
      { upsert: true, returnDocument: 'after' },
    ))!;

    await db.characters().updateMany(
      { _id: { $in: giveCharacters.map(({ _id }) => _id) } },
      { $set: { userId: bUserId, inventoryId: bInventory._id } },
      { session },
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}

export async function tradeCharacters(
  {
    aUserId,
    bUserId,
    guildId,
    giveIds,
    takeIds,
  }: {
    aUserId: string;
    bUserId: string;
    guildId: string;
    giveIds: string[];
    takeIds: string[];
  },
): Promise<void> {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    // TODO can be grouped using aggregate
    //   {
    //     $match: {
    //       id: { $in: [...giveIds, ...takeIds] },
    //       guildId,
    //       $or: [
    //         { userId: aUserId },
    //         { userId: bUserId },
    //       ],
    //     },
    //  },
    //  {
    //     $group: {
    //       _id: "$userId",
    //       characters: {
    //         $push: {
    //           id: "$id",
    //           // Include any other fields you need from the characters
    //         },
    //       },
    //     },
    //  },
    //

    const giveCharacters = await db.characters().aggregate()
      .match({
        id: { $in: giveIds },
        userId: aUserId,
        guildId,
      })
      .lookup({
        localField: 'inventoryId',
        foreignField: '_id',
        from: 'inventories',
        as: 'inventory',
      })
      .toArray() as Schema.PopulatedCharacter[];

    const takeCharacters = await db.characters().aggregate()
      .match({
        id: { $in: takeIds },
        userId: bUserId,
        guildId,
      })
      .lookup({
        localField: 'inventoryId',
        foreignField: '_id',
        from: 'inventories',
        as: 'inventory',
      })
      .toArray() as Schema.PopulatedCharacter[];

    if (
      giveCharacters.length !== giveIds.length ||
      takeCharacters.length !== takeIds.length
    ) {
      throw new Error();
    }

    const aInventory = giveCharacters[0].inventory;
    const bInventory = takeCharacters[0].inventory;

    const aParty = [
      aInventory.party.member1Id,
      aInventory.party.member2Id,
      aInventory.party.member3Id,
      aInventory.party.member4Id,
      aInventory.party.member5Id,
    ];

    const bParty = [
      bInventory.party.member1Id,
      bInventory.party.member2Id,
      bInventory.party.member3Id,
      bInventory.party.member4Id,
      bInventory.party.member5Id,
    ];

    if (
      giveCharacters
        .some((character) => aParty.includes(character._id)) ||
      takeCharacters
        .some((character) => bParty.includes(character._id))
    ) {
      throw new Error();
    }

    const bulk: Parameters<ReturnType<typeof db.characters>['bulkWrite']>[0] =
      [];

    bulk.push(
      {
        updateMany: {
          filter: { _id: { $in: giveCharacters.map(({ _id }) => _id) } },
          update: { $set: { userId: bUserId, inventoryId: bInventory._id } },
        },
      },
    );

    bulk.push(
      {
        updateMany: {
          filter: { _id: { $in: takeCharacters.map(({ _id }) => _id) } },
          update: { $set: { userId: aUserId, inventoryId: aInventory._id } },
        },
      },
    );

    await db.characters().bulkWrite(bulk, { session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}

export async function stealCharacter(
  userId: string,
  guildId: string,
  characterId: string,
): Promise<void> {
  const session = db.client.startSession();

  try {
    session.startTransaction();

    const [character] = await db.characters().aggregate()
      .match({ characterId, guildId })
      .lookup({
        localField: 'inventoryId',
        foreignField: '_id',
        from: 'inventories',
        as: 'inventory',
      })
      .toArray() as Schema.PopulatedCharacter[];

    if (!character) {
      throw new Error('');
    }

    const partyMembers: (keyof typeof character.inventory.party)[] = [
      'member1Id',
      'member2Id',
      'member3Id',
      'member4Id',
      'member5Id',
    ];

    // if stealing a party member
    // we must remove hte character from the target user party
    // in the same transaction
    partyMembers.forEach(async (memberId) => {
      const target = character.inventory;

      if (character._id === target.party[memberId]) {
        await db.inventories().updateOne(
          { _id: target._id },
          { $unset: { [`party.${memberId}`]: '' } },
          { session },
        );
      }
    });

    const inventory = await db.inventories().findOneAndUpdate(
      { userId, guildId },
      { $set: { stealTimestamp: new Date() } },
      { session },
    );

    if (!inventory) {
      throw new Error();
    }

    await db.characters().updateOne({ _id: character._id }, {
      $set: { userId, inventoryId: inventory._id },
    });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}

export async function failSteal(
  guildId: string,
  userId: string,
): Promise<void> {
  await db.inventories().updateOne(
    { guildId, userId },
    {
      $setOnInsert: newInventory(guildId, userId),
      $set: { stealTimestamp: new Date() },
    },
    { upsert: true },
  );
}
