import search, { idPrefix } from '~/src/search.ts';

import packs from '~/src/packs.ts';

import config from '~/src/config.ts';

import i18n from '~/src/i18n.ts';
import user from '~/src/user.ts';
import utils from '~/src/utils.ts';

import db from '~/db/mod.ts';

import * as discord from '~/src/discord.ts';

import { Character } from '~/src/types.ts';

import { NonFetalError } from '~/src/errors.ts';

function pre({ token, userId, guildId, targetId, give, take }: {
  token: string;
  userId: string;
  guildId: string;
  targetId: string;
  give: string[];
  take: string[];
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  // trading with yourself
  if (userId === targetId) {
    return new discord.Message()
      .setFlags(discord.MessageFlags.Ephemeral)
      .addEmbed(
        new discord.Embed().setDescription(
          take.length
            ? i18n.get('trade-with-yourself', locale)
            : i18n.get('gift-with-yourself', locale),
        ),
      );
  }

  if (!config.trading) {
    throw new NonFetalError(
      i18n.get('maintenance-trade', locale),
    );
  }

  Promise.all([
    ...give.map((char) =>
      packs.characters(
        char.startsWith(idPrefix)
          ? { ids: [char.substring(idPrefix.length)], guildId }
          : { search: char, guildId },
      ).then((r) => r[0])
    ),
    ...take.map((char) =>
      packs.characters(
        char.startsWith(idPrefix)
          ? { ids: [char.substring(idPrefix.length)], guildId }
          : { search: char, guildId },
      ).then((r) => r[0])
    ),
  ])
    // filter undefined results
    .then((results) => results.filter(utils.nonNullable))
    .then(async (results) => {
      const message = new discord.Message();

      if (
        results.length !== (give.length + take.length) ||
        results.some((char) =>
          packs.isDisabled(`${char.packId}:${char.id}`, guildId)
        )
      ) {
        throw new Error('404');
      }

      results = await Promise.all(
        results.map((character) =>
          packs.aggregate<Character>({
            guildId,
            character,
            end: 1,
          })
        ),
      );

      if (
        results.some((char) => {
          const media = (char as Character).media?.edges?.[0].node;

          if (
            media &&
            packs.isDisabled(`${media.packId}:${media.id}`, guildId)
          ) {
            return true;
          }

          return false;
        })
      ) {
        throw new Error('404');
      }

      let [giveCharacters, takeCharacters] = [
        results.slice(0, give.length),
        results.slice(give.length),
      ];

      let t: Record<string, (typeof giveCharacters[0])> = {};

      // filter repeated characters
      giveCharacters = (giveCharacters.forEach((char) => {
        t[`${char.packId}:${char.id}`] = char;
      }),
        Object.values(t));

      // filter repeated character
      takeCharacters = (t = {},
        takeCharacters.forEach((char) => {
          t[`${char.packId}:${char.id}`] = char;
        }),
        Object.values(t));

      const [giveIds, takeIds] = [
        giveCharacters.map(({ packId, id }) => `${packId}:${id}`),
        takeCharacters.map(({ packId, id }) => `${packId}:${id}`),
      ];

      const [giveNames, takeNames] = [
        giveCharacters.map(({ name }) => packs.aliasToArray(name)[0]),
        takeCharacters.map(({ name }) => packs.aliasToArray(name)[0]),
      ];

      const [userInventory, targetInventory] = await Promise.all([
        db.getInventory(guildId, userId),
        db.getInventory(guildId, targetId),
      ]);

      const giveCollection = await db.getUserCharacters(userId, guildId);

      const takeCollection = targetId && take.length
        ? (await db.getUserCharacters(targetId, guildId))
        : undefined;

      const giveEmbeds = giveCharacters.map((character) => {
        const i = giveCollection.findIndex(({ characterId }) =>
          `${character.packId}:${character.id}` === characterId
        );

        return search.characterEmbed(character, {
          footer: false,
          description: false,
          media: { title: true },
          mode: 'thumbnail',
          existing: i > -1
            ? {
              rating: giveCollection[i].rating,
              mediaId: giveCollection[i].mediaId,
            }
            : undefined,
        });
      });

      const giveParty = ([
        userInventory.party.member1?.characterId,
        userInventory.party.member2?.characterId,
        userInventory.party.member3?.characterId,
        userInventory.party.member4?.characterId,
        userInventory.party.member5?.characterId,
      ]
        .filter(utils.nonNullable))
        .filter((id) => giveIds.includes(id));

      const giveFilter = giveParty.length
        ? giveParty
        : giveIds.filter((id) =>
          !giveCollection.some((char) => char.characterId === id)
        );

      // not owned
      if (giveFilter.length) {
        giveFilter.forEach((characterId) => {
          const i = giveCharacters.findIndex(({ packId, id }) =>
            `${packId}:${id}` === characterId
          );

          message.addEmbed(
            new discord.Embed()
              .setDescription(
                giveParty.length
                  ? i18n.get('trade-you-party-member', locale, giveNames[i])
                  : i18n.get('trade-you-not-owned', locale, giveNames[i]),
              ),
          ).addEmbed(giveEmbeds[i]);
        });

        return await message.patch(token);
      }

      if (takeCollection) {
        const takeEmbeds = takeCharacters.map((character) => {
          const i = takeCollection.findIndex(({ characterId }) =>
            `${character.packId}:${character.id}` === characterId
          );

          return search.characterEmbed(character, {
            footer: false,
            description: false,
            media: { title: true },
            mode: 'thumbnail',
            existing: i > -1
              ? {
                rating: takeCollection[i].rating,
                mediaId: takeCollection[i].mediaId,
              }
              : {},
          });
        });

        const _takeParty = targetInventory.party;

        const takeParty = ([
          _takeParty.member1?.characterId,
          _takeParty.member2?.characterId,
          _takeParty.member3?.characterId,
          _takeParty.member4?.characterId,
          _takeParty.member5?.characterId,
        ]
          .filter(utils.nonNullable))
          .filter((id) => takeIds.includes(id));

        const takeFilter = takeParty.length
          ? takeParty
          : takeIds.filter((id) => {
            return !takeCollection.some((char) => char.characterId === id);
          });

        // not owned
        if (takeFilter.length) {
          takeFilter.forEach((characterId) => {
            const i = takeCharacters.findIndex(({ packId, id }) =>
              `${packId}:${id}` === characterId
            );

            message.addEmbed(
              new discord.Embed()
                .setDescription(
                  takeParty.length
                    ? i18n.get(
                      'trade-user-party-member',
                      locale,
                      takeNames[i],
                      `<@${targetId}>`,
                    )
                    : i18n.get(
                      'trade-user-not-owned',
                      locale,
                      `<@${targetId}>`,
                      takeNames[i],
                    ),
                ),
            ).addEmbed(takeEmbeds[i]);
          });

          return await message.patch(token);
        }

        takeEmbeds.forEach((embed) => {
          message.addEmbed(
            embed.addField({ value: `${discord.emotes.remove}` }),
          );
        });
      }

      giveEmbeds.forEach((embed) => {
        message.addEmbed(embed.addField({
          value: `${take.length ? discord.emotes.add : discord.emotes.remove}`,
        }));
      });

      if (takeCollection) {
        // const takeLiked = takeIds.filter((id) =>
        //   takeCollection.likes
        //     ?.map(({ characterId }) => characterId)
        //     .includes(id)
        // );

        await discord.Message.dialog({
          userId,
          targetId,
          message: message.setContent(`<@${targetId}>`),
          description: i18n.get(
            'trade-offer',
            locale,
            `<@${userId}>`,
            takeNames.join(', '),
            discord.emotes.remove,
            giveNames.join(', '),
            discord.emotes.add,
          ),
          confirm: [
            'trade',
            userId,
            targetId,
            giveIds.join('&'),
            takeIds.join('&'),
          ],
          confirmText: i18n.get('accept', locale),
          cancelText: i18n.get('decline', locale),
        }).patch(token);

        const followup = new discord.Message();

        // if (takeLiked!.length) {
        //   followup.addEmbed(new discord.Embed().setDescription(
        //     'Some of those characters are in your likeslist!',
        //   ));
        // }

        followup
          .setContent(
            i18n.get('trade-received-offer', locale, `<@${targetId}>`),
          )
          .followup(token);
      } else {
        await discord.Message.dialog({
          userId,
          message,
          description: i18n.get(
            'give',
            locale,
            giveNames.join(', '),
            discord.emotes.remove,
            `<@${targetId}>`,
          ),
          confirm: ['give', userId, targetId, giveIds.join('&')],
          locale,
        }).patch(token);
      }
    })
    .catch(async (err) => {
      if (err.message === '404') {
        return await new discord.Message()
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get('some-characters-disabled', locale),
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

function give({
  token,
  userId,
  targetId,
  giveCharactersIds,
  guildId,
}: {
  token: string;
  userId: string;
  targetId: string;
  giveCharactersIds: string[];
  guildId: string;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  Promise.resolve()
    .then(async () => {
      await db.giveCharacters({
        guildId,
        aUserId: userId,
        bUserId: targetId,
        giveIds: giveCharactersIds,
      });

      const results = await packs.characters({
        ids: giveCharactersIds,
        guildId,
      });

      const updateMessage = new discord.Message();

      const newMessage = new discord.Message().setContent(`<@${targetId}>`);

      updateMessage.addEmbed(
        new discord.Embed().setDescription(
          i18n.get('give-sent-to', locale, `<@${targetId}>`),
        ),
      );

      newMessage.addEmbed(
        new discord.Embed().setDescription(
          i18n.get('give-received', locale, `<@${userId}>`),
        ),
      );

      const giveCharacters = await Promise.all(
        giveCharactersIds.map((characterId) =>
          packs.aggregate<Character>({
            guildId,
            character: results.find(({ packId, id }) =>
              `${packId}:${id}` === characterId
            ),
            end: 1,
          })
        ),
      );

      giveCharacters.forEach((character) => {
        const embed = search.characterEmbed(character, {
          rating: true,
          mode: 'thumbnail',
          footer: false,
          description: false,
          media: { title: true },
        }).addField({ value: `${discord.emotes.add}` });

        newMessage.addEmbed(embed);
      });

      if (giveCharacters.length === 1) {
        const characterId = `${giveCharacters[0].packId}:${
          giveCharacters[0].id
        }`;

        newMessage.addComponents([
          new discord.Component()
            .setLabel('/character')
            .setId(`character`, characterId, '1'),
          new discord.Component()
            .setLabel('/like')
            .setId(`like`, characterId),
        ]);
      }

      await updateMessage.patch(token);

      return newMessage.followup(token);
    })
    .catch(async (err) => {
      if (err instanceof NonFetalError) {
        return await new discord.Message()
          .addEmbed(
            new discord.Embed()
              .setDescription(
                i18n.get(
                  err.message.includes('IN_PARTY')
                    ? 'give-you-party-members'
                    : 'character-no-longer-owned',
                  locale,
                ),
              ),
          )
          .setType(discord.MessageType.Update)
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

function accepted({
  token,
  userId,
  targetId,
  giveCharactersIds,
  takeCharactersIds,
  guildId,
}: {
  token: string;
  userId: string;
  targetId: string;
  giveCharactersIds: string[];
  takeCharactersIds: string[];
  guildId: string;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale;
  // const targetLocale = user.cachedUsers[targetId]?.locale;
  const guildLocale = user.cachedGuilds[guildId]?.locale;

  Promise.resolve()
    .then(async () => {
      const _ = await db.tradeCharacters({
        guildId,
        aUserId: userId,
        bUserId: targetId,
        giveIds: giveCharactersIds,
        takeIds: takeCharactersIds,
      });

      const results = await packs.characters({
        ids: [...giveCharactersIds, ...takeCharactersIds],
        guildId,
      });

      const updateMessage = new discord.Message();

      const newMessage = new discord.Message().setContent(
        i18n.get(
          'trade-offer-accepted',
          locale ?? guildLocale,
          `<@${userId}>`,
        ),
      );

      updateMessage.setContent(`<@${userId}>`);

      updateMessage.addEmbed(
        new discord.Embed().setDescription(
          i18n.get(
            'trade-offer-accepted2',
            locale ?? guildLocale,
            `<@${targetId}>`,
          ),
        ),
      );

      const giveCharacters = await Promise.all(
        giveCharactersIds.map((characterId) =>
          packs.aggregate<Character>({
            guildId,
            character: results.find(({ packId, id }) =>
              `${packId}:${id}` === characterId
            ),
            end: 1,
          })
        ),
      );

      const takeCharacters = await Promise.all(
        takeCharactersIds.map((characterId) =>
          packs.aggregate<Character>({
            guildId,
            character: results.find(({ packId, id }) =>
              `${packId}:${id}` === characterId
            ),
            end: 1,
          })
        ),
      );

      takeCharacters.forEach((character) => {
        const embed = search.characterEmbed(
          character,
          {
            rating: true,
            mode: 'thumbnail',
            footer: false,
            description: false,
            media: { title: true },
          },
        ).addField({ value: `${discord.emotes.add}` });

        updateMessage.addEmbed(embed);
      });

      giveCharacters.forEach((character) => {
        const embed = search.characterEmbed(
          character,
          {
            rating: true,
            mode: 'thumbnail',
            footer: false,
            description: false,
            media: { title: true },
          },
        ).addField({ value: `${discord.emotes.remove}` });

        updateMessage.addEmbed(embed);
      });

      await updateMessage.patch(token);

      return newMessage.followup(token);
    })
    .catch(async (err) => {
      if (err instanceof NonFetalError) {
        return await new discord.Message()
          .addEmbed(
            new discord.Embed()
              .setDescription(
                i18n.get(
                  err.message.includes('IN_PARTY')
                    ? 'trade-party-members'
                    : 'character-no-longer-owned',
                  locale,
                ),
              ),
          )
          .setType(discord.MessageType.Update)
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

const trade = {
  pre,
  give,
  accepted,
};

export default trade;
