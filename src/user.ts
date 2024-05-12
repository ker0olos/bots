import config from '~/src/config.ts';

import db, { COSTS, MAX_KEYS, MAX_PULLS } from '~/db/mod.ts';

import i18n from '~/src/i18n.ts';
import utils from '~/src/utils.ts';
import packs from '~/src/packs.ts';

import Rating from '~/src/rating.ts';

import { default as srch } from '~/src/search.ts';

import * as discord from '~/src/discord.ts';

import {
  Character,
  CharacterRole,
  DisaggregatedCharacter,
  DisaggregatedMedia,
  Media,
} from '~/src/types.ts';

const cachedGuilds: Record<string, {
  locale: discord.AvailableLocales;
}> = {};

const cachedUsers: Record<string, {
  locale: discord.AvailableLocales;
}> = {};

async function now({
  userId,
  guildId,
  mention,
}: {
  userId: string;
  guildId: string;
  mention?: boolean;
}): Promise<discord.Message> {
  const locale = cachedUsers[userId]?.locale ??
    cachedGuilds[guildId]?.locale;

  const { user, ...inventory } = await db.rechargeConsumables(guildId, userId);

  const {
    availablePulls,
    keysTimestamp,
    availableKeys,
    stealTimestamp,
    rechargeTimestamp,
    lastPVE,
    floorsCleared,
  } = inventory;

  const { dailyTimestamp, availableTokens } = user;

  const message = new discord.Message();

  const recharge = utils.rechargeTimestamp(rechargeTimestamp);
  const dailyTokenRecharge = utils.rechargeDailyTimestamp(dailyTimestamp);
  const keysRecharge = utils.rechargeKeysTimestamp(keysTimestamp);
  const stealRecharge = utils.rechargeStealTimestamp(stealTimestamp);

  const showKeys = config.combat && utils.isWithin14Days(lastPVE);

  const guarantees = Array.from(new Set(user.guarantees ?? []))
    .sort((a, b) => b - a);

  message.addEmbed(
    new discord.Embed()
      .setTitle(`**${availablePulls}**`)
      .setDescription(`${
        guarantees
          .map((r) => `${r}${discord.emotes.smolStar}`)
          .join('')
      }`)
      .setFooter({
        text: availablePulls === 1
          ? i18n.get('available-pull', locale)
          : i18n.get('available-pulls', locale),
      }),
  );

  if (showKeys) {
    message.addEmbed(
      new discord.Embed()
        .setTitle(`**${availableKeys}**`)
        .setFooter({
          text: availableKeys === 1
            ? i18n.get('available-key', locale)
            : i18n.get('available-keys', locale),
        }),
    );
  }

  if (availableTokens) {
    message.addEmbed(
      new discord.Embed()
        .setTitle(`**${availableTokens}**`)
        .setFooter({
          text: availableTokens === 1
            ? i18n.get('daily-token', locale)
            : i18n.get('daily-tokens', locale),
        }),
    );
  }

  if (config.notice) {
    message.addEmbed(
      new discord.Embed()
        .setDescription(config.notice.replaceAll('\\n', '\n')),
    );
  }

  if (availablePulls < MAX_PULLS) {
    message.addEmbed(
      new discord.Embed()
        .setDescription(i18n.get('+1-pull', locale, `<t:${recharge}:R>`)),
    );
  }

  if (dailyTimestamp) {
    message.addEmbed(
      new discord.Embed()
        .setDescription(
          i18n.get('+1-token', locale, `<t:${dailyTokenRecharge}:R>`),
        ),
    );
  }

  // deno-lint-ignore no-non-null-assertion
  if (showKeys && availableKeys! < MAX_KEYS) {
    message.addEmbed(
      new discord.Embed()
        .setDescription(
          i18n.get('+1-key', locale, `<t:${keysRecharge}:R>`),
        ),
    );
  }

  if (stealTimestamp) {
    message.addEmbed(
      new discord.Embed()
        .setDescription(
          i18n.get(
            'steal-cooldown-ends',
            locale,
            `<t:${stealRecharge}:R>`,
          ),
        ),
    );
  }

  // components

  if (availablePulls > 0) {
    message.addComponents([
      // `/gacha` shortcut
      new discord.Component()
        .setId('gacha', userId)
        .setLabel('/gacha'),
    ]);
  }

  // deno-lint-ignore no-non-null-assertion
  if (showKeys && floorsCleared && availableKeys! > 0) {
    message.addComponents([
      // `/reclear` shortcut
      new discord.Component()
        .setId('treclear', userId)
        .setLabel('/reclear'),
    ]);
  }

  if (user.availableTokens && user.availableTokens >= COSTS.FIVE) {
    // `/buy guaranteed` 5 shortcut
    message.addComponents([
      new discord.Component()
        .setId('buy', 'bguaranteed', userId, '5')
        .setLabel(`/buy guaranteed 5`),
    ]);
  } else if (user.availableTokens && user.availableTokens >= COSTS.FOUR) {
    // `/buy guaranteed 4` shortcut
    message.addComponents([
      new discord.Component()
        .setId('buy', 'bguaranteed', userId, '4')
        .setLabel(`/buy guaranteed 4`),
    ]);
  }

  if (guarantees.length) {
    message.addComponents([
      // `/pull` shortcut
      new discord.Component()
        .setId('pull', userId, `${guarantees[0]}`)
        .setLabel(`/pull ${guarantees[0]}`),
    ]);
  }

  if (mention) {
    message
      .setContent(`<@${userId}>`)
      .setPing();
  }

  return message;
}

function nick({
  token,
  userId,
  guildId,
  nick,
  search,
  id,
}: {
  token: string;
  userId: string;
  guildId: string;
  nick?: string;
  search?: string;
  id?: string;
}): discord.Message {
  const locale = cachedUsers[userId]?.locale ??
    cachedGuilds[guildId]?.locale;

  packs
    .characters(id ? { ids: [id], guildId } : { search, guildId })
    .then(async (results: (Character | DisaggregatedCharacter)[]) => {
      if (!results.length) {
        throw new Error('404');
      }

      const character = await packs.aggregate<Character>({
        guildId,
        character: results[0],
        end: 1,
      });

      const media = character.media?.edges?.[0]?.node;

      if (media && packs.isDisabled(`${media.packId}:${media.id}`, guildId)) {
        throw new Error('404');
      }

      const message = new discord.Message();

      const characterId = `${results[0].packId}:${results[0].id}`;

      try {
        const response = await db.setCharacterNickname(
          userId,
          guildId,
          characterId,
          nick,
        );

        const name = packs.aliasToArray(character.name)[0];

        const embed = srch.characterEmbed(character, {
          footer: true,
          rating: false,
          mode: 'thumbnail',
          description: false,
          media: { title: true },
          existing: {
            ...response,
            rating: undefined,
            nickname: nick,
          },
        });

        message
          .addEmbed(
            new discord.Embed().setDescription(
              !nick ? i18n.get('nickname-reset', locale, name) : i18n.get(
                'nickname-changed',
                locale,
                name,
                nick,
              ),
            ),
          )
          .addEmbed(embed);

        return message.patch(token);
      } catch (err) {
        const names = packs.aliasToArray(results[0].name);

        switch (err.message) {
          case 'CHARACTER_NOT_FOUND': {
            return message
              .addEmbed(
                new discord.Embed().setDescription(
                  i18n.get('character-hasnt-been-found', locale, names[0]),
                ),
              ).addComponents([
                new discord.Component()
                  .setId(`character`, characterId)
                  .setLabel('/character'),
              ])
              .patch(token);
          }
          case 'CHARACTER_NOT_OWNED':
            return message
              .addEmbed(
                new discord.Embed().setDescription(
                  i18n.get(
                    'character-not-owned-by-you',
                    locale,
                    names[0],
                  ),
                ),
              ).addComponents([
                new discord.Component()
                  .setId(`character`, characterId)
                  .setLabel('/character'),
              ])
              .patch(token);
          default:
            throw err;
        }
      }
    })
    .catch(async (err) => {
      if (err.message === '404') {
        return await new discord.Message()
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

  return discord.Message.spinner();
}

function image({
  token,
  userId,
  guildId,
  image,
  search,
  id,
}: {
  token: string;
  userId: string;
  guildId: string;
  image?: string;
  search?: string;
  id?: string;
}): discord.Message {
  const locale = cachedUsers[userId]?.locale ??
    cachedGuilds[guildId]?.locale;

  packs
    .characters(id ? { ids: [id], guildId } : { search, guildId })
    .then(async (results: (Character | DisaggregatedCharacter)[]) => {
      if (!results.length) {
        throw new Error('404');
      }

      const character = await packs.aggregate<Character>({
        guildId,
        character: results[0],
        end: 1,
      });

      const media = character.media?.edges?.[0]?.node;

      if (media && packs.isDisabled(`${media.packId}:${media.id}`, guildId)) {
        throw new Error('404');
      }

      const message = new discord.Message();

      const characterId = `${results[0].packId}:${results[0].id}`;

      try {
        const response = await db.setCharacterImage(
          userId,
          guildId,
          characterId,
          image,
        );

        const name = packs.aliasToArray(character.name)[0];

        const embed = srch.characterEmbed(character, {
          footer: true,
          rating: false,
          description: false,
          media: { title: true },
          existing: {
            ...response,
            rating: undefined,
            image,
          },
        });

        message
          .addEmbed(
            new discord.Embed().setDescription(
              !image ? i18n.get('image-reset', locale, name) : i18n.get(
                'image-changed',
                locale,
                name,
                // deno-lint-ignore no-non-null-assertion
                image!,
              ),
            ),
          )
          .addEmbed(embed);

        return message.patch(token);
      } catch (err) {
        const names = packs.aliasToArray(results[0].name);

        switch (err.message) {
          case 'CHARACTER_NOT_FOUND': {
            return message
              .addEmbed(
                new discord.Embed().setDescription(
                  i18n.get('character-hasnt-been-found', locale, names[0]),
                ),
              ).addComponents([
                new discord.Component()
                  .setId(`character`, characterId)
                  .setLabel('/character'),
              ])
              .patch(token);
          }
          case 'CHARACTER_NOT_OWNED':
            return message
              .addEmbed(
                new discord.Embed().setDescription(
                  i18n.get(
                    'character-not-owned-by-you',
                    locale,
                    names[0],
                  ),
                ),
              ).addComponents([
                new discord.Component()
                  .setId(`character`, characterId)
                  .setLabel('/character'),
              ])
              .patch(token);
          default:
            throw err;
        }
      }
    })
    .catch(async (err) => {
      if (err.message === '404') {
        return await new discord.Message()
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

  return discord.Message.spinner();
}

function like({
  token,
  userId,
  guildId,
  mention,
  search,
  undo,
  id,
}: {
  token: string;
  userId: string;
  guildId: string;
  undo: boolean;
  mention?: boolean;
  search?: string;
  id?: string;
}): discord.Message {
  const locale = cachedUsers[userId]?.locale ??
    cachedGuilds[guildId]?.locale;

  packs
    .characters(id ? { ids: [id], guildId } : { search, guildId })
    .then(async (results: (Character | DisaggregatedCharacter)[]) => {
      if (!results.length) {
        throw new Error('404');
      }

      const character = await packs.aggregate<Character>({
        guildId,
        character: results[0],
        end: 1,
      });

      const media = character.media?.edges?.[0]?.node;

      if (media && packs.isDisabled(`${media.packId}:${media.id}`, guildId)) {
        throw new Error('404');
      }

      const message = new discord.Message();

      const characterId = `${character.packId}:${character.id}`;

      try {
        const _ = !undo
          ? await db.likeCharacter(
            userId,
            characterId,
          )
          : await db.unlikeCharacter(
            userId,
            characterId,
          );

        message
          .addEmbed(
            new discord.Embed().setDescription(!undo ? 'Liked' : 'Unliked'),
          );

        if (mention) {
          message
            .setContent(`<@${userId}>`)
            .setPing();
        }

        const embed = srch.characterEmbed(character, {
          footer: true,
          description: false,
          mode: 'thumbnail',
          media: { title: true },
          rating: true,
        });

        message.addEmbed(embed);

        if (!undo) {
          message.addComponents([
            new discord.Component()
              .setId(`character`, characterId)
              .setLabel('/character'),
          ]);
        }

        return message.patch(token);
      } catch (err) {
        throw err;
      }
    })
    .catch(async (err) => {
      if (err.message === '404') {
        return await new discord.Message()
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

  return discord.Message.spinner();
}

function likeall({
  token,
  userId,
  guildId,
  search,
  undo,
  id,
}: {
  token: string;
  userId: string;
  guildId: string;
  undo: boolean;
  search?: string;
  id?: string;
}): discord.Message {
  const locale = cachedUsers[userId]?.locale ??
    cachedGuilds[guildId]?.locale;

  packs
    .media(id ? { ids: [id], guildId } : { search, guildId })
    .then(async (results: (Media | DisaggregatedMedia)[]) => {
      if (!results.length) {
        throw new Error('404');
      }

      const message = new discord.Message();

      const mediaId = `${results[0].packId}:${results[0].id}`;

      try {
        const _ = !undo
          ? await db.likeMedia(
            userId,
            mediaId,
          )
          : await db.unlikeMedia(
            userId,
            mediaId,
          );

        message
          .addEmbed(
            new discord.Embed().setDescription(!undo ? 'Liked' : 'Unliked'),
          );

        const media = await packs.aggregate<Media>({
          guildId,
          media: results[0],
        });

        const embed = srch.mediaEmbed(media, { mode: 'thumbnail' });

        message.addEmbed(embed);

        if (!undo) {
          message.addComponents([
            new discord.Component()
              .setId(`media`, mediaId)
              .setLabel(`/${media.type.toString().toLowerCase()}`),
          ]);
        }

        return message.patch(token);
      } catch (err) {
        throw err;
      }
    })
    .catch(async (err) => {
      if (err.message === '404') {
        return await new discord.Message()
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

  return discord.Message.spinner();
}

function list({
  token,
  userId,
  guildId,
  rating,
  search,
  id,
  index,
  nick,
  picture,
}: {
  token: string;
  index: number;
  userId: string;
  guildId: string;
  rating?: number;
  search?: string;
  id?: string;
  nick?: boolean;
  picture?: boolean;
}): discord.Message {
  const locale = cachedUsers[userId]?.locale ??
    cachedGuilds[guildId]?.locale;

  Promise.resolve()
    .then(async () => {
      const mongo = await db.newMongo().connect();

      const { user, ...inventory } = await db.getInventory(
        guildId,
        userId,
        mongo,
        true,
      );

      let characters = await db.getUserCharacters(userId, guildId, mongo, true);

      let length = 0;

      let embed = new discord.Embed();

      const message = new discord.Message();

      const members = [
        inventory.party.member1Id,
        inventory.party.member2Id,
        inventory.party.member3Id,
        inventory.party.member4Id,
        inventory.party.member5Id,
      ];

      let media: Media[] = [];

      if (rating) {
        characters = characters.filter((char) => char.rating === rating);
      }

      if (search || id) {
        const results = await packs
          .media(id ? { ids: [id], guildId } : { search, guildId });

        if (
          !results.length ||
          packs.isDisabled(`${results[0].packId}:${results[0].id}`, guildId)
        ) {
          throw new Error('404');
        }

        const parent = await packs.aggregate<Media>({
          guildId,
          media: results[0],
        });

        media = [
          parent,
          ...(parent.relations?.edges?.map(({ node }) => node) ?? []),
        ];

        const relationsIds = media.map(({ packId, id }) => `${packId}:${id}`);

        characters = characters
          .filter((char) => relationsIds.includes(char.mediaId))
          .sort((a, b) => {
            if (a.mediaId < b.mediaId) {
              return -1;
            }

            if (a.mediaId > b.mediaId) {
              return 1;
            }

            return b.rating - a.rating;
          });
      } else {
        characters = characters
          .sort((a, b) => b.rating - a.rating);
      }

      if (picture) {
        length = characters.length;

        const character = characters[index];

        const _character = await packs.characters({
          ids: [character.characterId],
          guildId,
        });

        const media = (await packs.aggregate<Character>({
          character: _character[0],
          guildId,
        })).media?.edges?.[0]?.node;

        const mediaTitle = media?.title
          ? utils.wrap(
            packs.aliasToArray(media.title)[0],
          )
          : undefined;

        if (
          !_character[0] || (
            media &&
            packs.isDisabled(`${media.packId}:${media.id}`, guildId)
          )
        ) {
          embed.setDescription(
            i18n.get(
              'character-disabled',
              locale,
            ),
          );
        } else {
          embed = srch.characterEmbed(_character[0], {
            media: { title: mediaTitle },
            existing: character,
          });
        }
      } else {
        const chunks = utils.chunks(characters, 5);

        if (!chunks.length) {
          message.addEmbed(embed.setDescription(
            nick
              ? (media.length
                ? i18n.get(
                  'user-empty-media-collection',
                  locale,
                  `<@${userId}>`,
                  packs.aliasToArray(media[0].title)[0],
                )
                : i18n.get(
                  'user-empty-collection',
                  locale,
                  `<@${userId}>`,
                  rating ? `${rating}${discord.emotes.smolStar}` : '',
                ))
              : (media.length
                ? i18n.get(
                  'you-empty-media-collection',
                  locale,
                  packs.aliasToArray(media[0].title)[0],
                )
                : i18n.get(
                  'you-empty-collection',
                  locale,
                  rating ? `${rating}${discord.emotes.smolStar}` : '',
                )),
          ));

          if (!nick) {
            message.addComponents([
              // `/gacha` shortcut
              new discord.Component()
                .setId('gacha', userId)
                .setLabel('/gacha'),
            ]);
          }

          return message.patch(token);
        }

        length = chunks.length;

        const _characters = await packs.characters({
          ids: chunks[index]?.map(({ characterId }) => characterId),
          guildId,
        });

        await Promise.all(chunks[index].map(async (existing) => {
          // deno-lint-ignore no-non-null-assertion
          const char = _characters.find((
            { packId, id },
          ) => (
            existing.characterId === `${packId}:${id}`
          ))!;

          if (!char) {
            return;
          }

          const media = (await packs.aggregate<Character>({
            character: char,
            guildId,
          })).media?.edges?.[0]?.node;

          const mediaTitle = media?.title
            ? utils.wrap(
              packs.aliasToArray(media.title)[0],
            )
            : undefined;

          const name = `${existing.rating}${discord.emotes.smolStar}${
            members.some((member) => Boolean(member) && member === existing._id)
              ? discord.emotes.member
              : user.likes?.some((like) =>
                  like.characterId === existing.characterId
                )
              ? `${discord.emotes.liked}`
              : ''
          } ${
            existing.nickname ?? utils.wrap(packs.aliasToArray(char.name)[0])
          }`;

          if (
            media &&
            packs.isDisabled(`${media.packId}:${media.id}`, guildId)
          ) {
            return;
          }

          embed.addField({
            inline: false,
            name: mediaTitle ? mediaTitle : name,
            value: mediaTitle ? name : undefined,
          });
        }));
      }

      await mongo.close();

      return discord.Message.page({
        index,
        type: 'list',
        target: discord.join(
          userId,
          media.length ? `${media[0].packId}:${media[0].id}` : '',
          `${rating ?? ''}`,
          picture ? '1' : '',
        ),
        total: length,
        message: message.addEmbed(embed),
        next: index + 1 < length,
        locale,
      }).patch(token);
    })
    .catch(async (err) => {
      if (err.message === '404') {
        return await new discord.Message()
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

  return discord.Message.spinner();
}

function likeslist({
  token,
  userId,
  guildId,
  index,
  nick,
  filter,
}: {
  token: string;
  index: number;
  userId: string;
  guildId: string;
  nick?: boolean;
  filter?: boolean;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale;

  Promise.resolve()
    .then(async () => {
      const user = await db.getUser(userId);

      const embed = new discord.Embed();

      const message = new discord.Message();

      let likes = user.likes ?? [];

      // sort so that all media likes are in the bottom of the list
      likes.sort((a, b) => {
        const aId = typeof a.characterId === 'string';
        const bId = typeof b.characterId === 'string';

        if (aId && !bId) {
          return -1;
        } else if (!aId && bId) {
          return 1;
        } else {
          return 0;
        }
      });

      const results = await db.findCharacters(
        guildId,
        likes.map(({ characterId }) => characterId)
          .filter(utils.nonNullable),
      );

      // filter out characters that are owned by the user
      if (filter) {
        likes = likes.filter((like, i) => {
          return like.characterId && results[i]?.userId !== userId;
        });
      }

      const chunks = utils.chunks(likes, 5);

      const [characters, media] = await Promise.all([
        await packs.characters({
          guildId,
          ids: chunks[index]?.map(({ characterId }) => characterId)
            .filter(utils.nonNullable),
        }),
        await packs.media({
          guildId,
          ids: chunks[index]?.map(({ mediaId }) => mediaId)
            .filter(utils.nonNullable),
        }),
      ]);

      if (!chunks.length) {
        if (index > 0) {
          embed.setDescription(
            'This page is empty',
          );
        } else {
          message.addEmbed(embed.setDescription(
            nick
              ? i18n.get('user-empty-likeslist', locale, `<@${userId}>`)
              : i18n.get('you-empty-likeslist', locale),
          ));

          return message.patch(token);
        }
      }

      await Promise.all(
        chunks[index].map(async (like) => {
          // deno-lint-ignore no-non-null-assertion
          const character = characters.find((
            { packId, id },
          ) => (
            like.characterId === `${packId}:${id}`
          ))!;

          if (!character) {
            return;
          }

          const existing = results.find((r) =>
            r?.characterId === `${character.packId}:${character.id}`
          );

          const char = await packs.aggregate<Character>({
            guildId,
            character,
            end: 1,
          });

          const rating = existing?.rating ??
            Rating.fromCharacter(char).stars;

          const media = char.media?.edges?.[0]?.node;

          const mediaTitle = media?.title
            ? utils.wrap(
              packs.aliasToArray(media.title)[0],
            )
            : undefined;

          const name = `${rating}${discord.emotes.smolStar} ${
            existing ? `<@${existing?.userId}> ` : ''
          }${utils.wrap(packs.aliasToArray(char.name)[0])}`;

          if (
            media &&
            packs.isDisabled(`${media.packId}:${media.id}`, guildId)
          ) {
            return;
          }

          embed.addField({
            inline: false,
            name: mediaTitle ? mediaTitle : name,
            value: mediaTitle ? name : undefined,
          });
        }),
      );

      media.forEach((media) => {
        const title = utils.wrap(packs.aliasToArray(media.title)[0]);

        embed.addField({
          inline: false,
          name: title,
          value: discord.emotes.all,
        });
      });

      return discord.Message.page({
        index,
        type: 'likes',
        target: discord.join(userId, filter ? '1' : '0'),
        total: chunks.length,
        message: message.addEmbed(embed),
        next: index + 1 < chunks.length,
        locale,
      }).patch(token);
    })
    .catch(async (err) => {
      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return discord.Message.spinner();
}

function sum({
  token,
  userId,
  guildId,
  // nick,
}: {
  token: string;
  userId: string;
  guildId: string;
  nick?: boolean;
}): discord.Message {
  const locale = cachedUsers[userId]?.locale;

  Promise.resolve()
    .then(async () => {
      const mongo = await db.newMongo().connect();

      const { user, ...inventory } = await db.getInventory(
        guildId,
        userId,
        mongo,
        true,
      );

      const likesCharactersIds = (user.likes ?? [])
        .map(({ characterId }) => characterId);

      const likesMediaIds = (user.likes ?? [])
        .map(({ mediaId }) => mediaId);

      const characters = await db.getUserCharacters(
        userId,
        guildId,
        mongo,
        true,
      );

      const partyIds = [
        inventory.party.member1Id,
        inventory.party.member2Id,
        inventory.party.member3Id,
        inventory.party.member4Id,
        inventory.party.member5Id,
      ];

      const embed = new discord.Embed();

      const sum: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      const sumProtected: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      const description: string[] = [];

      characters.forEach((char) => {
        const r = char.rating as keyof typeof sum;

        if (
          partyIds.includes(char._id) ||
          likesCharactersIds.includes(char.characterId) ||
          likesMediaIds.includes(char.mediaId)
        ) {
          sumProtected[r] += 1;
        }

        sum[r] += 1;
      });

      [1, 2, 3, 4, 5].forEach(
        (n) =>
          description.push(
            // deno-lint-ignore prefer-ascii
            `${n}${discord.emotes.smolStar} — **${sum[n]} ${sum[n] === 1
                ? i18n.get('character', locale)
                : i18n.get('characters', locale)
              // deno-lint-ignore prefer-ascii
            }** — ${sumProtected[n]} ${discord.emotes.liked}(${
              sum[n] - sumProtected[n]
            })`,
          ),
      );

      embed.setDescription(description.join('\n'));

      await mongo.close();

      new discord.Message()
        .addEmbed(embed).patch(token);
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

function showcase({
  token,
  userId,
  guildId,
  index,
  nick,
}: {
  token: string;
  index: number;
  userId: string;
  guildId: string;
  nick?: boolean;
}): discord.Message {
  const locale = cachedUsers[userId]?.locale ??
    cachedGuilds[guildId]?.locale;

  Promise.resolve()
    .then(async () => {
      const embed = new discord.Embed();

      const likedMedia: Record<string, boolean> = {};
      const ownedMedia: Record<string, string[]> = {};

      const mongo = await db.newMongo().connect();

      const user = await db.getUser(userId, mongo, true);

      const characters = await db.getUserCharacters(
        userId,
        guildId,
        mongo,
        true,
      );

      user.likes?.forEach(({ mediaId }) =>
        mediaId && (likedMedia[mediaId] = true)
      );

      characters.forEach(({ mediaId, characterId }) => {
        ownedMedia[mediaId] ??= [];
        ownedMedia[mediaId].push(characterId);
      });

      let media = await packs.media({
        guildId,
        ids: [
          ...Object.keys(likedMedia),
          ...Object.keys(ownedMedia),
        ],
      }) as DisaggregatedMedia[];

      media = media
        .map((media) => {
          const mediaId = `${media.packId}:${media.id}`;

          // filter background characters
          media.characters = media.characters?.filter(({ role }) =>
            role !== CharacterRole.Background
          ) ?? [];

          // filter background characters from owned character
          ownedMedia[mediaId] = ownedMedia[mediaId]?.filter((id) => {
            // deno-lint-ignore no-non-null-assertion
            const edge = media.characters!.find(({ characterId }) =>
              packs.ensureId(characterId, media.packId) === id
            );

            return edge && edge.role !== CharacterRole.Background;
          });

          return media;
        })
        // filter out any media with 0 characters
        .filter((m) => m.characters?.length);

      // shadow aggregate liked media relations
      // and add them into the liked media list
      media.forEach((media) => {
        const list = [
          `${media.packId}:${media.id}`,
          ...(media.relations ?? []).map(({ mediaId }) =>
            packs.ensureId(mediaId, media.packId)
          ),
        ];

        const anyIncludes = list.some((id) => likedMedia[id] || false);

        if (anyIncludes) list.forEach((id) => likedMedia[id] = true);
      });

      // sort by liked then owned amount
      media.sort((a, b) => {
        const aId = `${a.packId}:${a.id}`;
        const bId = `${b.packId}:${b.id}`;

        const aLiked = likedMedia[aId] || false;
        const bLiked = likedMedia[bId] || false;

        if (aLiked && !bLiked) return -1;
        if (!aLiked && bLiked) return 1;

        const aOwned = ownedMedia[aId]?.length ?? 0;
        const bOwned = ownedMedia[bId]?.length ?? 0;

        return bOwned - aOwned;
      });

      const chunks = utils.chunks(media, 5);

      if (!chunks.length) {
        const message = new discord.Message();

        message.addEmbed(
          new discord.Embed()
            .setDescription(
              nick
                ? i18n.get('user-empty-collection', locale, `<@${userId}>`, '')
                : i18n.get('you-empty-collection', locale, ''),
            ),
        );

        if (!nick) {
          message.addComponents([
            // `/gacha` shortcut
            new discord.Component()
              .setId('gacha', userId)
              .setLabel('/gacha'),
          ]);
        }

        return message.patch(token);
      }

      const mediaAllOwned = await db.getMediaCharacters(
        guildId,
        chunks[index].map(({ packId, id }) => `${packId}:${id}`),
      );

      await mongo.close();

      chunks[index].forEach((media) => {
        const id = `${media.packId}:${media.id}`;

        const title = packs.aliasToArray(media.title)[0];

        const liked = likedMedia[id] || false;

        const owned = ownedMedia[id]?.length ?? 0;
        // deno-lint-ignore no-non-null-assertion
        const total = media.characters!.length;

        const percent = Math.round((owned / total) * 100);

        // deno-lint-ignore prefer-ascii
        let formatted = `${percent}% — ${owned} / ${total}`;

        // TODO TEST
        const ownedByOthers = mediaAllOwned.filter((character) =>
          character.mediaId === id &&
          // deno-lint-ignore no-non-null-assertion
          media.characters!.some(({ characterId }) =>
            // TODO TEST
            packs.ensureId(characterId, media.packId) === character.characterId
          ) &&
          character.userId !== userId
        );

        if (ownedByOthers.length) {
          formatted = `${
            i18n.get('owned-by-others', locale, ownedByOthers.length)
          }\n${formatted}`;
        } else if (percent >= 100) {
          formatted = `~~${formatted}~~`;
        }

        embed.addField({
          inline: false,
          name: `${title} ${liked ? discord.emotes.liked : ''}`.trim(),
          value: formatted,
        });
      });

      const message = new discord.Message()
        .addEmbed(embed);

      return discord.Message.page({
        index,
        message,
        type: 'showcase',
        target: userId,
        total: chunks.length,
        next: index + 1 < chunks.length,
        locale,
      }).patch(token);
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

function logs({
  token,
  userId,
  guildId,
  nick,
}: {
  token: string;
  userId: string;
  guildId: string;
  nick?: boolean;
}): discord.Message {
  const locale = cachedUsers[userId]?.locale ??
    cachedGuilds[guildId]?.locale;

  Promise.resolve()
    .then(async () => {
      const message = new discord.Message();

      const characters = (await db.getUserCharacters(userId, guildId))
        .slice(-10);

      const names: string[] = [];

      const results = await packs.characters({
        guildId,
        ids: characters.map(({ characterId }) => characterId),
      });

      characters.toReversed().forEach((existing) => {
        const char = results.find(({ packId, id }) =>
          `${packId}:${id}` === existing.characterId
        );

        if (
          !char ||
          packs.isDisabled(existing.mediaId, guildId)
        ) {
          return;
        }

        const name = `${existing.rating}${discord.emotes.smolStar} ${
          existing.nickname ?? utils.wrap(packs.aliasToArray(char.name)[0])
        } <t:${utils.normalTimestamp(existing.createdAt)}:R>`;

        names.push(name);
      });

      if (names.length <= 0) {
        message.addEmbed(
          new discord.Embed()
            .setDescription(
              nick
                ? i18n.get('user-empty-collection', locale, `<@${userId}>`, '')
                : i18n.get('you-empty-collection', locale, ''),
            ),
        );

        return message.patch(token);
      }

      message.addEmbed(new discord.Embed()
        .setDescription(names.join('\n')));

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

const user = {
  cachedUsers,
  cachedGuilds,
  image,
  like,
  likeall,
  likeslist,
  showcase,
  list,
  logs,
  nick,
  now,
  sum,
};

export default user;
