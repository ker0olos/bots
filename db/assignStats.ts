import {
  charactersByInstancePrefix,
  charactersByInventoryPrefix,
  charactersByMediaIdPrefix,
} from '~/db/indices.ts';

import { skills } from '~/src/skills.ts';

import db, { kv } from '~/db/mod.ts';

import utils from '~/src/utils.ts';

import { KvError } from '~/src/errors.ts';

import type * as Schema from '~/db/schema.ts';

import type { SkillKey } from '~/src/types.ts';

const newSkills = (rating: number): number => {
  switch (rating) {
    case 5:
      return 2;
    case 4:
      return 1;
    default:
      return 0;
  }
};

const newUnclaimed = (rating: number): number => {
  return 3 * rating;
};

export const randomStats = (
  total: number,
  seed?: string,
): Schema.CharacterStats => {
  let attack = 0;
  let defense = 0;
  let speed = 0;

  const rng = seed ? new utils.LehmerRNG(seed) : undefined;

  for (let i = 0; i < total; i++) {
    const rand = rng
      ? Math.floor(rng.nextFloat() * 3)
      : Math.floor(Math.random() * 3);

    if (rand === 0) {
      attack += 1;
    } else if (rand === 1) {
      defense += 1;
    } else {
      speed += 1;
    }
  }

  return {
    attack,
    defense,
    speed,
    hp: 10,
  };
};

export function ensureInitStats(character: Schema.Character): Schema.Character {
  if (character.combat?.baseStats !== undefined) {
    return character;
  }

  const total = newUnclaimed(character.rating);
  const slots = newSkills(character.rating);

  character.combat ??= {};
  character.combat.skills = {};

  character.combat.baseStats = randomStats(total);
  character.combat.curStats = { ...character.combat.baseStats };
  // character.combat.unclaimedStatsPoints ??= 0;

  const skillsPool = Object.keys(skills) as SkillKey[];

  for (let i = 0; i < slots; i++) {
    const randomSkillKey = skillsPool.splice(
      Math.floor(Math.random() * skillsPool.length),
      1,
    )[0];

    character.combat.skills[randomSkillKey] = { level: 1 };
  }

  return character;
}

export async function initStats(
  instance: Schema.Instance,
  characterId: string,
): Promise<{ character: Schema.Character; user: Schema.User }> {
  let retries = 0;

  while (retries < 5) {
    const response = await db.getValueAndTimestamp<Schema.Character>([
      ...charactersByInstancePrefix(instance._id),
      characterId,
    ]);

    if (!response?.value || !response.versionstamp) {
      throw new Error('CHARACTER_NOT_FOUND');
    }

    let character = response.value;

    const user = await db.getValue<Schema.User>(['users', character.user]);

    if (!user) {
      throw new Error('CHARACTER_NOT_FOUND');
    }

    //return if stats are already initialized
    if (character.combat?.baseStats !== undefined) {
      return { character, user };
    }

    character = ensureInitStats(character);

    const update = await kv.atomic()
      .check(response)
      .set(['characters', character._id], character)
      .set(
        [
          ...charactersByInstancePrefix(character.instance),
          character.id,
        ],
        character,
      )
      .set(
        [
          ...charactersByInventoryPrefix(character.inventory),
          character._id,
        ],
        character,
      )
      .set(
        [
          ...charactersByMediaIdPrefix(character.instance, character.mediaId),
          character._id,
        ],
        character,
      )
      .commit();

    if (update.ok) {
      return { character, user };
    }

    retries += 1;
  }

  throw new KvError('failed to update character');
}

// export async function upgradeStats(
//   inventory: Schema.Inventory,
//   characterId: string,
//   type: string,
//   amount: number,
// ): Promise<Schema.Character> {
//   let retries = 0;

//   while (retries < 5) {
//     const response = await db.getValueAndTimestamp<Schema.Character>([
//       ...charactersByInstancePrefix(inventory.instance),
//       characterId,
//     ]);

//     if (!response?.value || !response.versionstamp) {
//       throw new Error('CHARACTER_NOT_FOUND');
//     }

//     const character = response.value;

//     if (character.inventory !== inventory._id) {
//       throw new Error('CHARACTER_NOT_OWNED');
//     }

//     if (
//       !character.combat ||
//       !character.combat?.baseStats ||
//       !character.combat?.curStats
//     ) {
//       throw new Error('CHARACTER_NOT_INITIATED');
//     }

//     character.combat.unclaimedStatsPoints ??= 0;

//     switch (type) {
//       case 'atk':
//         character.combat.curStats.attack += amount;
//         break;
//       case 'def':
//         character.combat.curStats.defense += amount;
//         break;
//       case 'spd':
//         character.combat.curStats.speed += amount;
//         break;
//       default:
//         throw new Error('UNKNOWN_STAT_TYPE');
//     }

//     if (character.combat.unclaimedStatsPoints - amount < 0) {
//       throw new Error('NOT_ENOUGH_UNCLAIMED');
//     }

//     character.combat.unclaimedStatsPoints -= amount;

//     const update = await kv.atomic()
//       .check(response)
//       .set(['characters', character._id], character)
//       .set(
//         [
//           ...charactersByInstancePrefix(character.instance),
//           character.id,
//         ],
//         character,
//       )
//       .set(
//         [
//           ...charactersByInventoryPrefix(character.inventory),
//           character._id,
//         ],
//         character,
//       )
//       .set(
//         [
//           ...charactersByMediaIdPrefix(character.instance, character.mediaId),
//           character._id,
//         ],
//         character,
//       )
//       .commit();

//     if (update.ok) {
//       return character;
//     }

//     retries += 1;
//   }

//   throw new KvError('failed to update character');
// }
