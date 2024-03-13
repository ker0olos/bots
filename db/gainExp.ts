// deno-lint-ignore-file

import database from '~/db/mod.ts';

import type * as Schema from './schema.ts';

export const MAX_LEVEL = 10;

type Status = {
  levelUp: number;
  skillPoints: number;
  statPoints: number;
  exp: number;
  expToLevel: number;
};

export const experienceToNextLevel = (level?: number): number => {
  return (level || 0) * 10;
};

export function distributeNewStats(
  combat: Schema.CharacterCombat,
  newStatPoints: number,
  levelUp: number,
): Schema.CharacterCombat {
  const { baseStats } = combat;

  const baseStatsSum = baseStats.attack + baseStats.defense + baseStats.speed;

  if (baseStatsSum === 0) {
    throw new Error('');
  }

  const attackPercentage = baseStats.attack / baseStatsSum;
  const defensePercentage = baseStats.defense / baseStatsSum;
  const speedPercentage = baseStats.speed / baseStatsSum;

  let distributedAttack = Math.round(newStatPoints * attackPercentage);
  let distributedDefense = Math.round(newStatPoints * defensePercentage);
  let distributedSpeed = Math.round(newStatPoints * speedPercentage);

  let distributedSum = distributedAttack + distributedDefense +
    distributedSpeed;

  while (distributedSum > newStatPoints) {
    if (
      distributedAttack > distributedDefense &&
      distributedAttack > distributedSpeed
    ) {
      distributedAttack -= 1;
    } else if (
      distributedDefense > distributedAttack &&
      distributedDefense > distributedSpeed
    ) {
      distributedDefense -= 1;
    } else {
      distributedSpeed -= 1;
    }

    distributedSum = distributedAttack + distributedDefense +
      distributedSpeed;
  }

  while (distributedSum < newStatPoints) {
    if (
      distributedAttack < distributedDefense &&
      distributedAttack < distributedSpeed
    ) {
      distributedAttack += 1;
    } else if (
      distributedDefense < distributedAttack &&
      distributedDefense < distributedSpeed
    ) {
      distributedDefense += 1;
    } else {
      distributedSpeed += 1;
    }

    distributedSum = distributedAttack + distributedDefense +
      distributedSpeed;
  }

  combat.curStats.attack += distributedAttack;
  combat.curStats.defense += distributedDefense;
  combat.curStats.speed += distributedSpeed;

  combat.curStats.hp += 5 * levelUp;

  return combat;
}

export async function gainExp(
  userId: string,
  guildId: string,
  characterId: string,
  gainExp: number,
): Promise<Status> {
  const session = database.client.startSession();

  const status: Status = {
    levelUp: 0,
    skillPoints: 0,
    statPoints: 0,
    exp: 0,
    expToLevel: 0,
  };

  try {
    session.startTransaction();

    const character = await database.characters.findOneAndUpdate(
      { userId, guildId, characterId },
      { $inc: { 'combat.exp': gainExp } },
      { returnDocument: 'after' },
    );

    if (!character) {
      throw new Error();
    }

    if (character.combat.level < MAX_LEVEL) {
      while (
        character.combat.exp >= experienceToNextLevel(character.combat.level)
      ) {
        character.combat.exp -= experienceToNextLevel(character.combat.level);

        character.combat.level += 1;
        character.combat.skillPoints += 1;
        // character.combat.unclaimedStatsPoints! += 3;

        status.levelUp += 1;
        status.skillPoints += 1;
        status.statPoints += 3;

        // extra skill points based on level
        if (character.combat.level >= 10) {
          character.combat.skillPoints += 1;
          status.skillPoints += 1;

          // character.combat.unclaimedStatsPoints! += 3 * 2;
          status.statPoints += 3 * 2;
        } else if (character.combat.level >= 20) {
          character.combat.skillPoints += 2;
          status.skillPoints += 2;

          // character.combat.unclaimedStatsPoints! += 3 * 3;
          status.statPoints += 3 * 3;
        } else if (character.combat.level >= 40) {
          character.combat.skillPoints += 3;
          status.skillPoints += 3;

          // character.combat.unclaimedStatsPoints! += 3 * 5;
          status.statPoints += 3 * 5;
        }
      }
    }

    status.exp = character.combat.exp || 0;
    status.expToLevel = experienceToNextLevel(character.combat.level);

    // character leveled
    if (status.statPoints > 0) {
      character.combat = distributeNewStats(
        character.combat,
        status.statPoints,
        status.levelUp,
      );

      const update = await database.characters.updateOne(
        { userId, guildId, characterId },
        { $set: { combat: character.combat } },
      );

      if (!update.matchedCount) {
        throw new Error();
      }
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }

  return status;
}
