import config from '~/src/config.ts';

import * as discord from '~/src/discord.ts';

import packs from '~/src/packs.ts';
import user from '~/src/user.ts';
import gacha from '~/src/gacha.ts';

import i18n from '~/src/i18n.ts';
import utils from '~/src/utils.ts';

import db from '~/db/mod.ts';

import { NonFetalError, PoolError } from '~/src/errors.ts';

import type { Character } from '~/src/types.ts';

import type * as Schema from '~/db/schema.ts';

import type { WithId } from 'mongodb';

type CharacterWithId = WithId<Schema.Character>;

async function getFilteredCharacters(
  { userId, guildId }: { userId: string; guildId: string },
): Promise<WithId<CharacterWithId>[]> {
  const { user, party } = await db.getInventory(guildId, userId);

  const characters = await db.getUserCharacters(userId, guildId);

  const partyIds = [
    party.member1?.characterId,
    party.member2?.characterId,
    party.member3?.characterId,
    party.member4?.characterId,
    party.member5?.characterId,
  ];

  const likesCharactersIds = user.likes
    ?.map(({ characterId }) => characterId)
    .filter(utils.nonNullable);

  const likesMediaIds = user.likes
    ?.map(({ mediaId }) => mediaId)
    .filter(utils.nonNullable);

  return characters
    .filter((char) => {
      if (
        partyIds.includes(char.characterId) ||
        likesCharactersIds.includes(char.characterId) ||
        likesMediaIds.includes(char.mediaId)
      ) {
        return false;
      }

      return true;
    });
}

function getSacrifices(
  characters: CharacterWithId[],
  mode: 'target' | 'min' | 'max',
  target?: number,
  locale?: discord.AvailableLocales,
): { sacrifices: CharacterWithId[]; target: number } {
  // I'm sure there is a faster way to do this with just math
  // but i am not smart enough to figure it out
  // the important thing is that all the tests pass

  const split: Record<number, CharacterWithId[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  // separate each rating into its own array
  characters
    .toSorted((a, b) => a.rating - b.rating)
    .forEach((char) => {
      split[char.rating === 5 ? 4 : char.rating].push(char);
    });

  const possibilities: Record<number, CharacterWithId[][]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  [1, 2, 3, 4, 5].forEach((i) => {
    // break if target is possible
    if (target && possibilities[target].length) {
      return;
    }

    if (i > 1) {
      // since we need 5 characters from the previous rating
      // to make a new rating
      // divide the length of characters by 5 then floor it
      // to get how many new characters are possible to make
      const length = Math.floor(possibilities[i - 1].length / 5);

      possibilities[i].push(
        // split the previous possibilities into arrays of 5
        ...utils.chunks(possibilities[i - 1], 5)
          // only use the required amount of chunks
          .slice(0, length)
          // flatten them so all of them are Character[] instead of Character[][]
          .map((t) => t.flat()),
      );
    }

    // add the current ratings to the possibilities list
    possibilities[i].push(...split[i].map((c) => [c]));
  });

  switch (mode) {
    case 'min':
      [5, 4, 3, 2].forEach((n) => {
        const index = possibilities[n].findIndex((t) => t.length >= 5);

        if (index > -1) {
          target = n;
        }
      });
      break;
    case 'max':
      [2, 3, 4, 5].forEach((n) => {
        const index = possibilities[n].findIndex((t) => t.length >= 5);

        if (index > -1) {
          target = n;
        }
      });
      break;
    default:
      break;
  }

  if (!target) {
    throw new NonFetalError(
      i18n.get('merge-not-possible', locale),
    );
  }

  const index = possibilities[target].findIndex((t) => t.length >= 5);

  if (index === -1) {
    throw new NonFetalError(
      i18n.get(
        'merge-insufficient',
        locale,
        possibilities[target - 1].length,
        `${target}${discord.emotes.smolStar}`,
      ),
    );
  }

  return {
    target,
    sacrifices: possibilities[target][index],
  };
}

function characterPreview(
  character: Character,
  existing: Partial<CharacterWithId>,
): discord.Embed {
  const image = existing?.image
    ? { url: existing?.image }
    : character.images?.[0];

  const media = character.media?.edges?.[0]?.node;

  const name = `${existing.rating}${discord.emotes.smolStar}${
    utils.wrap(existing?.nickname ?? packs.aliasToArray(character.name)[0])
  }`;

  const embed = new discord.Embed()
    .setThumbnail({ preview: true, url: image?.url });

  if (media) {
    embed.addField({
      name: utils.wrap(packs.aliasToArray(media.title)[0]),
      value: name,
    });
  } else {
    embed.setDescription(name);
  }

  return embed;
}

async function synthesize({ token, userId, guildId, mode, target }: {
  token: string;
  userId: string;
  guildId: string;
  mode: 'target' | 'min' | 'max';
  target?: number;
}): Promise<discord.Message> {
  const locale = user.cachedUsers[userId]?.locale;

  if (!config.synthesis) {
    throw new NonFetalError(i18n.get('maintenance-merge', locale));
  }

  const message = new discord.Message();

  const characters = await synthesis.getFilteredCharacters({ userId, guildId });

  let { sacrifices, target: _target } = getSacrifices(
    characters,
    mode,
    target,
    locale,
  );

  sacrifices = sacrifices
    .sort((a, b) => b.rating - a.rating);

  // highlight the top characters
  const highlights = sacrifices
    .slice(0, 5);

  packs.characters({
    ids: highlights.map((char) => char.characterId),
    guildId,
  })
    .then(async (highlightedCharacters) => {
      message.addEmbed(
        new discord.Embed().setDescription(
          i18n.get('merge-sacrifice', locale, sacrifices.length),
        ),
      );

      for (const existing of highlights) {
        const index = highlightedCharacters
          .findIndex((char) =>
            existing.characterId === `${char.packId}:${char.id}`
          );

        if (index > -1) {
          const character = await packs.aggregate<Character>({
            character: highlightedCharacters[index],
            guildId,
          });

          const media = character?.media?.edges?.[0]?.node;

          if (
            (packs.isDisabled(existing.mediaId, guildId)) ||
            (media &&
              packs.isDisabled(`${media.packId}:${media.id}`, guildId))
          ) {
            highlightedCharacters.splice(index, 1);
            continue;
          }

          const embed = synthesis.characterPreview(character, existing);

          message.addEmbed(embed);
        }
      }

      if (sacrifices.length - highlightedCharacters.length) {
        message.addEmbed(
          new discord.Embed().setDescription(
            `_+${sacrifices.length - highlightedCharacters.length} others..._`,
          ),
        );
      }

      await discord.Message.dialog({
        userId,
        message,
        confirm: ['synthesis', userId, `${_target}`],
        locale,
      })
        .patch(token);
    })
    .catch(async (err) => {
      if (err instanceof NonFetalError) {
        return await new discord.Message()
          .addEmbed(new discord.Embed().setDescription(err.message))
          .patch(token);
      }

      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return discord.Message.spinner(true);
}

function confirmed({
  token,
  userId,
  guildId,
  target,
}: {
  token: string;
  userId: string;
  guildId: string;
  target: number;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale;

  synthesis.getFilteredCharacters({ userId, guildId })
    .then(async (characters) => {
      const { sacrifices } = getSacrifices(
        characters,
        'target',
        target,
        locale,
      );

      const pull = await gacha.rngPull({
        userId,
        guildId,
        guarantee: target,
        sacrifices: sacrifices.map(({ _id }) => _id),
      });

      return gacha.pullAnimation({
        token,
        guildId,
        userId,
        pull,
        components: false,
      });
    })
    .catch(async (err) => {
      if (err instanceof PoolError) {
        return await new discord.Message()
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get(
                'gacha-no-more-characters-left',
                locale,
                `${target}${discord.emotes.smolStar}`,
              ),
            ),
          ).patch(token);
      }

      if (err instanceof NonFetalError) {
        return await new discord.Message()
          .addEmbed(new discord.Embed().setDescription(err.message))
          .patch(token);
      }

      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return discord.Message.spinner();
}

const synthesis = {
  getFilteredCharacters,
  getSacrifices,
  characterPreview,
  synthesize,
  confirmed,
};

export default synthesis;
