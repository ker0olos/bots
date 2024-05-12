import config from '~/src/config.ts';

import packs from '~/src/packs.ts';

import { default as srch } from '~/src/search.ts';

import i18n from '~/src/i18n.ts';
import utils from '~/src/utils.ts';

import user from '~/src/user.ts';

import db from '~/db/mod.ts';

import * as discord from '~/src/discord.ts';

import { Character, DisaggregatedCharacter } from '~/src/types.ts';

import { NonFetalError } from '~/src/errors.ts';

import type * as Schema from '~/db/schema.ts';

export const PARTY_PROTECTION_PERIOD = 4;

function getInactiveDays(inventory?: Partial<Schema.Inventory>): number {
  const lastPull = inventory?.lastPull
    ? new Date(inventory.lastPull)
    : undefined;

  return !lastPull
    ? Number.MAX_SAFE_INTEGER
    : utils.diffInDays(new Date(), lastPull);
}

function getChances(character: Schema.Character, inactiveDays: number): number {
  let chance = 0;

  switch (character.rating) {
    case 5:
      chance = 1;
      break;
    case 4:
      chance = 3;
      break;
    case 3:
      chance = 15;
      break;
    case 2:
      chance = 25;
      break;
    case 1:
      chance = 50;
      break;
    default:
      break;
  }

  if (inactiveDays > 30) {
    chance += 90;
  } else if (inactiveDays >= 14) {
    chance += 50;
  } else if (inactiveDays >= 7) {
    chance += 25;
  }

  return Math.min(chance, 90);
}

function pre({ token, userId, guildId, search, id }: {
  token: string;
  userId: string;
  guildId: string;
  search?: string;
  id?: string;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  if (!config.stealing) {
    throw new NonFetalError(
      i18n.get('maintenance-steal', locale),
    );
  }

  packs
    .characters(id ? { ids: [id], guildId } : { search, guildId })
    .then(async (results: (Character | DisaggregatedCharacter)[]) => {
      if (!results.length) {
        throw new Error('404');
      }

      const { stealTimestamp } = await db.rechargeConsumables(guildId, userId);

      if (stealTimestamp) {
        throw new NonFetalError(
          i18n.get(
            'steal-cooldown',
            locale,
            `<t:${utils.rechargeStealTimestamp(stealTimestamp)}:R>`,
          ),
        );
      }

      return Promise.all([
        packs.aggregate<Character>({
          guildId,
          character: results[0],
          end: 1,
        }),
        db.findCharacter(
          guildId,
          `${results[0].packId}:${results[0].id}`,
        ),
      ]);
    })
    .then(([character, existing]) => {
      const message = new discord.Message();

      const characterId = `${character.packId}:${character.id}`;

      const characterName = packs.aliasToArray(character.name)[0];

      const media = character.media?.edges?.[0]?.node;

      if (!existing) {
        message.addEmbed(
          new discord.Embed().setDescription(
            i18n.get('character-hasnt-been-found', locale, characterName),
          ),
        );

        const embed = srch.characterEmbed(character, {
          footer: false,
          mode: 'thumbnail',
          description: false,
          media: { title: true },
        });

        message.addEmbed(embed);

        return message.patch(token);
      }

      if (
        (packs.isDisabled(existing.mediaId, guildId)) ||
        (
          media &&
          packs.isDisabled(`${media.packId}:${media.id}`, guildId)
        )
      ) {
        throw new Error('404');
      }

      if (existing.userId === userId) {
        throw new NonFetalError(i18n.get('stealing-from-yourself', locale));
      }

      const targetInventory = existing.inventory;

      const party = [
        targetInventory.party.member1Id,
        targetInventory.party.member2Id,
        targetInventory.party.member3Id,
        targetInventory.party.member4Id,
        targetInventory.party.member5Id,
      ];

      const inactiveDays = getInactiveDays(targetInventory);

      if (party.some((id) => id?.equals(existing._id))) {
        if (inactiveDays <= PARTY_PROTECTION_PERIOD) {
          message.addEmbed(
            new discord.Embed().setDescription(
              i18n.get(
                'stealing-party-member',
                locale,
                `<@${existing.userId}>`,
                characterName,
              ),
            ),
          );

          const embed = srch.characterEmbed(character, {
            footer: true,
            mode: 'thumbnail',
            description: false,
            media: { title: true },
            existing: { rating: existing.rating },
          });

          message.addEmbed(embed);

          return message.patch(token);
        }
      }

      const embed = srch.characterEmbed(character, {
        footer: true,
        rating: false,
        mode: 'thumbnail',
        description: false,
        media: { title: true },
        existing: {
          rating: existing.rating,
          mediaId: existing.mediaId,
        },
      });

      embed.setDescription(`<@${existing.userId}>`);

      message.addEmbed(embed);

      const chance = getChances(existing, inactiveDays);

      message.addEmbed(
        new discord.Embed().setDescription(
          i18n.get('steal-chance', locale, chance.toFixed(2)),
        ),
      );

      return discord.Message.dialog({
        userId,
        message,
        confirmText: i18n.get('attempt', locale),
        confirm: [
          'steal',
          userId,
          characterId,
          `${chance}`,
        ],
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

      if (err instanceof NonFetalError) {
        return await new discord.Message()
          .addEmbed(
            new discord.Embed()
              .setDescription(err.message),
          )
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

function attempt({
  token,
  userId,
  guildId,
  characterId,
  pre,
}: {
  token: string;
  userId: string;
  guildId: string;
  characterId: string;
  pre: number;
}): discord.Message {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  packs.characters({ ids: [characterId], guildId })
    .then(async (results) => {
      const message = new discord.Message();

      const character = await packs.aggregate<Character>({
        guildId,
        character: results[0],
        end: 1,
      });

      const characterName = packs.aliasToArray(character.name)[0];

      const { stealTimestamp } = await db.getInventory(guildId, userId);

      if (stealTimestamp) {
        throw new NonFetalError(
          i18n.get(
            'steal-cooldown',
            locale,
            `<t:${utils.rechargeStealTimestamp(stealTimestamp)}:R>`,
          ),
        );
      }

      const existing = await db.findCharacter(
        guildId,
        `${results[0].packId}:${results[0].id}`,
      );

      if (!existing) {
        message.addEmbed(
          new discord.Embed().setDescription(
            i18n.get('character-hasnt-been-found', locale, characterName),
          ),
        );

        return message.patch(token);
      }

      const targetInventory = existing.inventory;

      const inactiveDays = getInactiveDays(targetInventory);

      const chance = getChances(existing, inactiveDays);

      if (pre > chance) {
        throw new NonFetalError(
          i18n.get('steal-unexpected', locale, characterName),
        );
      }

      const success = utils.getRandomFloat() <= (chance / 100);

      // delay to build up anticipation
      await utils.sleep(5);

      // failed
      if (!success) {
        await db.failSteal(guildId, userId);

        message
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get('you-failed', locale),
            ),
          )
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get(
                'steal-try-again',
                locale,
                `<t:${utils.rechargeStealTimestamp(new Date())}:R>`,
              ),
            ),
          );

        return message.patch(token);
      }

      try {
        await db.stealCharacter(userId, guildId, characterId);

        const embed = srch.characterEmbed(character, {
          footer: false,
          mode: 'thumbnail',
          description: false,
          media: { title: true },
          existing: {
            rating: existing.rating,
            mediaId: existing.mediaId,
          },
        });

        embed.addField({
          value: `${discord.emotes.add}`,
        });

        message
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get('you-succeeded', locale),
            ),
          )
          .addEmbed(embed)
          .addComponents([
            new discord.Component()
              .setLabel('/character')
              .setId(`character`, characterId, '1'),
            new discord.Component()
              .setLabel('/like')
              .setId(`like`, characterId),
          ]);

        await message.patch(token);

        const followupMessage = new discord.Message()
          .setContent(`<@${existing.userId}>`)
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get('stolen-from-you', locale, characterName),
            ),
          );

        const followupEmbed = srch.characterEmbed(character, {
          footer: false,
          mode: 'thumbnail',
          description: false,
          media: { title: true },
          existing: {
            rating: existing.rating,
            mediaId: existing.mediaId,
          },
        });

        followupEmbed.addField({
          value: `${discord.emotes.remove}`,
        });

        await followupMessage
          .addEmbed(followupEmbed)
          .addComponents([
            new discord.Component()
              .setLabel('/character')
              .setId(`character`, characterId, '1'),
          ])
          .followup(token);
      } catch (err) {
        switch (err.message) {
          case 'CHARACTER_NOT_FOUND':
            throw new NonFetalError(
              i18n.get('character-hasnt-been-found', locale, characterName),
            );
          case 'CHARACTER_NOT_OWNED':
            throw new NonFetalError(
              i18n.get(
                'character-not-owned-by-you',
                locale,
                characterName,
              ),
            );
          default:
            throw err;
        }
      }
    })
    .catch(async (err) => {
      if (err instanceof NonFetalError) {
        return await new discord.Message()
          .addEmbed(
            new discord.Embed()
              .setDescription(err.message),
          )
          .patch(token);
      }

      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  const loading = new discord.Message()
    .addEmbed(
      new discord.Embed().setImage(
        { url: `${config.origin}/assets/steal.gif` },
      ),
    );

  return loading;
}

const steal = {
  pre,
  attempt,
  getChances,
  getInactiveDays,
};

export default steal;
