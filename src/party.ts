import config from '~/src/config.ts';

import i18n from '~/src/i18n.ts';
import utils from '~/src/utils.ts';

import user from '~/src/user.ts';
import packs from '~/src/packs.ts';

import Rating from '~/src/rating.ts';

import db from '~/db/mod.ts';

import { default as srch } from '~/src/search.ts';

import * as discord from '~/src/discord.ts';

import * as Schema from '~/db/schema.ts';

import type { Character } from '~/src/types.ts';

async function embed({ guildId, party, locale }: {
  guildId: string;
  party: Schema.Party;
  locale: discord.AvailableLocales;
}): Promise<discord.Message> {
  const message = new discord.Message();

  const ids = [
    party.member1?.characterId,
    party.member2?.characterId,
    party.member3?.characterId,
    party.member4?.characterId,
    party.member5?.characterId,
  ];

  const mediaIds = [
    party.member1?.mediaId,
    party.member2?.mediaId,
    party.member3?.mediaId,
    party.member4?.mediaId,
    party.member5?.mediaId,
  ];

  const members = [
    party.member1,
    party.member2,
    party.member3,
    party.member4,
    party.member5,
  ];

  const [media, characters] = await Promise.all([
    packs.media({ ids: mediaIds.filter(utils.nonNullable), guildId }),
    packs.characters({ ids: ids.filter(utils.nonNullable), guildId }),
  ]);

  ids.forEach((characterId, i) => {
    if (!characterId) {
      message.addEmbed(new discord.Embed()
        .setDescription(i18n.get('unassigned', locale)));

      return;
    }

    const character = characters.find(({ packId, id }) =>
      characterId === `${packId}:${id}`
    );

    const mediaIndex = media.findIndex(({ packId, id }) =>
      // deno-lint-ignore no-non-null-assertion
      mediaIds[i]! === `${packId}:${id}`
    );

    if (
      !character ||
      mediaIndex === -1 ||
      // deno-lint-ignore no-non-null-assertion
      packs.isDisabled(mediaIds[i]!, guildId)
    ) {
      return message.addEmbed(
        new discord.Embed().setDescription(
          i18n.get('character-disabled', locale),
        ),
      );
    }

    const embed = srch.characterEmbed(character, {
      mode: 'thumbnail',
      media: { title: packs.aliasToArray(media[mediaIndex].title)[0] },
      rating: new Rating({ stars: members[i]?.rating }),
      description: false,
      footer: false,
      existing: {
        image: members[i]?.image,
        nickname: members[i]?.nickname,
      },
    });

    embed.setFooter({
      text: `${i18n.get('lvl', locale)} ${members[i]?.combat?.level ?? 1}`,
    });

    message.addEmbed(embed);
  });

  return message;
}

function view({ token, userId, guildId }: {
  token: string;
  userId: string;
  guildId: string;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  Promise.resolve()
    .then(async () => {
      const { party } = await db.getInventory(guildId, userId);

      const message = await embed({ guildId, party, locale });

      return message.patch(token);
    })
    .catch(async (err) => {
      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return discord.Message.spinner(true);
}

function assign({
  token,
  spot,
  userId,
  guildId,
  search,
  id,
}: {
  token: string;
  userId: string;
  guildId: string;
  spot?: 1 | 2 | 3 | 4 | 5;
  search?: string;
  id?: string;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  packs
    .characters(id ? { ids: [id], guildId } : { search, guildId })
    .then(async (results) => {
      const character = await packs.aggregate<Character>({
        character: results[0],
        guildId,
        end: 1,
      });

      const media = character.media?.edges?.[0]?.node;

      if (
        !results.length ||
        (media && packs.isDisabled(`${media.packId}:${media.id}`, guildId))
      ) {
        throw new Error('404');
      }

      const message = new discord.Message();

      const characterId = `${character.packId}:${character.id}`;

      try {
        const response = await db.assignCharacter(
          userId,
          guildId,
          characterId,
          spot,
        );

        const embed = srch.characterEmbed(results[0], {
          mode: 'thumbnail',
          rating: new Rating({ stars: response.rating }),
          description: true,
          footer: false,
          existing: {
            image: response.image,
            nickname: response.nickname,
          },
        });

        return message
          .addEmbed(new discord.Embed()
            .setDescription(i18n.get('assigned', locale)))
          .addEmbed(embed)
          .addComponents([
            new discord.Component()
              .setLabel('/character')
              .setId(`character`, characterId),
            new discord.Component()
              .setLabel('/stats')
              .setId(`stats`, characterId),
          ]).patch(token);
      } catch {
        const names = packs.aliasToArray(results[0].name);

        return message.addEmbed(
          new discord.Embed().setDescription(
            i18n.get('character-hasnt-been-found', locale, names[0]),
          ),
        ).addComponents([
          new discord.Component()
            .setLabel('/character')
            .setId(`character`, characterId),
        ]).patch(token);
      }
    })
    .catch(async (err) => {
      if (err.message === '404') {
        await new discord.Message()
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get('found-nothing', locale),
            ),
          ).patch(token);
      }

      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return discord.Message.spinner(true);
}

function swap({ token, a, b, userId, guildId }: {
  token: string;
  a: 1 | 2 | 3 | 4 | 5;
  b: 1 | 2 | 3 | 4 | 5;
  userId: string;
  guildId: string;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  Promise.resolve()
    .then(async () => {
      const inventory = await db.getInventory(guildId, userId);

      await db.swapSpots(inventory, a, b);

      const t = inventory.party[`member${a}`];

      inventory.party[`member${a}`] = inventory.party[`member${b}`];
      inventory.party[`member${b}`] = t;

      return (await embed({ guildId, party: inventory.party, locale }))
        .patch(token);
    })
    .catch(async (err) => {
      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return discord.Message.spinner(true);
}

function remove({ token, spot, userId, guildId }: {
  token: string;
  spot: 1 | 2 | 3 | 4 | 5;
  userId: string;
  guildId: string;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  Promise.resolve()
    .then(async () => {
      const inventory = await db.getInventory(guildId, userId);

      const message = new discord.Message();

      const character = inventory.party[`member${spot}`];

      if (!character) {
        return message.addEmbed(
          new discord.Embed().setDescription(
            i18n.get('no-assigned-in-spot', locale),
          ),
        ).patch(token);
      }

      await db.unassignCharacter(userId, guildId, spot);

      const characters = await packs.characters({
        ids: [character.characterId],
        guildId,
      });

      if (
        !characters.length ||
        packs.isDisabled(character.mediaId, guildId)
      ) {
        return message
          .addEmbed(new discord.Embed().setDescription(`Removed #${spot}`))
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get('character-disabled', locale),
            ),
          ).patch(token);
      }

      const embed = srch.characterEmbed(characters[0], {
        mode: 'thumbnail',
        rating: new Rating({ stars: character.rating }),
        description: true,
        footer: false,
        existing: {
          image: character.image,
          nickname: character.nickname,
        },
      });

      return message
        .addEmbed(new discord.Embed().setDescription('Removed'))
        .addEmbed(embed)
        .addComponents([
          new discord.Component()
            .setLabel('/character')
            .setId(`character`, character.characterId),
        ]).patch(token);
    })
    .catch(async (err) => {
      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return discord.Message.spinner(true);
}

const party = {
  view,
  assign,
  swap,
  remove,
};

export default party;
