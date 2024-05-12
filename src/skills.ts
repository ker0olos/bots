// deno-lint-ignore-file no-non-null-assertion

import _user from '~/src/user.ts';

import i18n from '~/src/i18n.ts';
import config from '~/src/config.ts';
import utils from '~/src/utils.ts';

import packs from '~/src/packs.ts';

import search, { idPrefix } from '~/src/search.ts';

import db from '~/db/mod.ts';

import * as discord from '~/src/discord.ts';

import { NonFetalError } from '~/src/errors.ts';

import type {
  CharacterAdditionalStat,
  CharacterSkill,
  SkillCategory,
  SkillOutput,
} from '~/src/types.ts';

type SkillKey = keyof typeof skills;

const skills = {
  crit: {
    cost: 2,
    key: '~crit',
    descKey: '~crit-desc',
    categories: ['offensive'],
    activation: function ({
      lvl,
      attacking: char,
    }): SkillOutput {
      const [critChance, critDamageMultiplier] = this.stats!;

      const rng = Math.random() * 100;
      const isCrit = rng <= critChance.scale![lvl - 1];

      if (isCrit) {
        return {
          damage: Math.max(
            Math.round(
              char.attack * (critDamageMultiplier.scale![lvl - 1] / 100),
            ),
            1,
          ),
        };
      }

      return {};
    },
    max: 3,
    stats: [{
      key: '~crit-chance',
      scale: [0.5, 5, 15],
      suffix: '%',
    }, {
      key: '~crit-damage',
      scale: [30, 45, 60],
      suffix: '%',
    }],
  },
  speed: {
    key: '~speed-boost',
    descKey: '~speed-boost-desc',
    categories: ['buff', 'support'],
    cost: 1,
    max: Infinity,
    stats: [{
      key: '~boost',
      suffix: '%',
      factor: 1,
    }],
  },
  defense: {
    key: '~defense-boost',
    descKey: '~defense-boost-desc',
    categories: ['buff', 'support'],
    cost: 1,
    max: Infinity,
    stats: [{
      key: '~boost',
      suffix: '%',
      factor: 1,
    }],
  },
  slow: {
    key: '~slow-debuff',
    descKey: '~slow-debuff-desc',
    categories: ['debuff', 'support'],
    cost: 1,
    max: Infinity,
    stats: [{
      key: '~boost',
      suffix: '%',
      factor: 1,
    }],
  },
  enrage: {
    cost: 2,
    key: '~enrage',
    descKey: '~enrage-desc',
    categories: ['buff', 'offensive'],
    max: 3,
    stats: [{
      key: '~hp-remaining',
      scale: [5, 15, 25],
      suffix: '%',
    }, {
      key: '~boost',
      scale: [15, 25, 50],
      suffix: '%',
    }],
  },
  heal: {
    cost: 2,
    key: '~heal',
    descKey: '~heal-desc',
    categories: ['support', 'heal'],
    activation: function ({
      lvl,
      attacking: char,
    }): SkillOutput {
      const [healPercent] = this.stats!;

      return {
        heal: Math.max(
          Math.round(char.maxHP * (healPercent.scale![lvl - 1] / 100)),
          1,
        ),
      };
    },
    max: 3,
    stats: [{
      key: '~heal-amount',
      scale: [5, 15, 25],
      suffix: '%',
    }],
  },
  lifesteal: {
    cost: 2,
    key: '~lifesteal',
    descKey: '~lifesteal-desc',
    categories: ['heal', 'offensive'],
    activation: function ({ attacking, lvl, damage }): SkillOutput {
      const [stealPercent] = this.stats!;

      const missing = attacking.maxHP - attacking.hp;

      const heal = Math.round(damage! * (stealPercent.scale![lvl - 1] / 100));

      return {
        heal: Math.min(heal, missing),
      };
    },
    max: 3,
    stats: [{
      key: '~lifesteal-amount',
      scale: [10, 25, 50],
      suffix: '%',
    }],
  },
  stun: {
    cost: 2,
    key: '~stun',
    descKey: '~stun-desc',
    categories: ['offensive'],
    max: 3,
    activation: function ({ lvl }): SkillOutput {
      const [stunChance] = this.stats!;

      const rng = Math.random() * 100;
      const isStunned = rng <= stunChance.scale![lvl - 1];

      return {
        stun: isStunned,
      };
    },
    stats: [{
      key: '~stun-chance',
      scale: [5, 15, 80],
      suffix: '%',
    }],
  },
  chain: {
    cost: 10,
    key: '~chain',
    descKey: '~chain-desc',
    categories: ['offensive'],
    activation: function ({ combo, damage }): SkillOutput {
      const [chain2, chain3] = this.stats!;

      if (combo === 2) {
        return {
          damage: Math.max(Math.round(damage! * (chain2.scale![0] / 100)), 1),
        };
      } else if (combo === 3) {
        return {
          damage: Math.max(Math.round(damage! * (chain3.scale![0] / 100)), 1),
        };
      }

      return {};
    },
    max: 1,
    stats: [{
      key: '~chain-2-boost',
      scale: [25],
      suffix: '%',
    }, {
      key: '~chain-3-boost',
      scale: [50],
      suffix: '%',
    }],
  },
  grab: {
    cost: 5,
    key: '~sneak',
    descKey: '~sneak-desc',
    categories: ['offensive'],
    max: 1,
    stats: [],
  },
} satisfies Record<string, CharacterSkill>;

const format = (
  skill: CharacterSkill,
  locale?: discord.AvailableLocales,
  options?: { showcase?: boolean; lvl?: number },
): string => {
  const generateStatsString = (
    s: CharacterAdditionalStat,
    options?: { showcase?: boolean; lvl?: number },
  ): string => {
    const { scale, prefix, suffix, factor } = s;

    options ??= {};

    options.lvl ??= options.showcase
      ? skill.max === Infinity ? 10 : skill.max
      : 0;

    const i = !options.showcase
      ? Math.min(options.lvl + 1, skill.max)
      : options.lvl;

    const lvl = Array.isArray(scale)
      ? `${prefix ?? ''}${(scale[i - 1])}${suffix ?? ''}`
      : `${prefix ?? ''}${(factor! * i)}${suffix ?? ''}`;

    const prev = options.lvl && i > 1 && i < skill.max
      ? Array.isArray(scale)
        ? `${prefix ?? ''}${(scale[options.lvl - 1])}${suffix ?? ''}`
        : `${prefix ?? ''}${(factor! * options.lvl)}${suffix ?? ''}`
      : '';

    return prev && !options.showcase
      ? `${prev} ${discord.emotes.rightArrow} ${lvl}`
      : lvl;
  };

  const stats =
    skill.stats?.map((s, index) =>
      `${index + 1}. _${i18n.get(s.key, locale)} (${
        generateStatsString(s, options)
      })_`
    ) ?? [];

  let cost = '';

  if (options?.showcase) {
    cost = `(${skill.cost} ${
      i18n.get(
        skill.cost === 1 ? 'skill-point' : 'skill-points',
        locale,
      )
    })`;
  } else if (typeof skill.max === 'number' && options?.lvl === skill.max) {
    cost = `**(${i18n.get('lvl', locale)} ${i18n.get('max', locale)})**`;
  } else if (typeof options?.lvl === 'number' && !options?.showcase) {
    cost = `**(${
      i18n.get('lvl', locale)
    } ${options.lvl} ${discord.emotes.rightArrow} ${i18n.get('lvl', locale)} ${
      options.lvl + 1 === skill.max ? i18n.get('max', locale) : options.lvl + 1
    })**`;
  }

  return [
    `**${i18n.get(skill.key, locale)}** ${cost}`,
    `${i18n.get(skill.descKey, locale)}`,
    `${stats.join('\n')}`,
  ].join('\n');
};

function preAcquire(
  { token, skillKey, guildId, character, userId }: {
    token: string;
    skillKey: SkillKey;
    guildId: string;
    character: string;
    userId: string;
  },
): discord.Message {
  if (!skills[skillKey]) {
    throw new Error('404');
  }

  packs.characters(
    character.startsWith(idPrefix)
      ? { ids: [character.substring(idPrefix.length)], guildId }
      : { search: character, guildId },
  )
    .then((results) => {
      if (
        !results.length ||
        packs.isDisabled(`${results[0].packId}:${results[0].id}`, guildId)
      ) {
        throw new Error('404');
      }

      return Promise.all([
        results[0],
        db.findCharacter(guildId, `${results[0].packId}:${results[0].id}`),
      ]);
    })
    .then(async ([character, existing]) => {
      const locale = _user.cachedUsers[userId]?.locale ??
        _user.cachedGuilds[guildId]?.locale;

      if (!existing) {
        const message = new discord.Message();

        const embed = search.characterEmbed(character, {
          mode: 'thumbnail',
          media: { title: false },
          description: false,
          footer: false,
        });

        embed.setFooter({
          text: i18n.get('not-fit-for-combat', locale),
        });

        message.addEmbed(embed);

        return await message.patch(token);
      }

      if (existing.userId !== userId) {
        const message = new discord.Message();

        const embed = search.characterEmbed(character, {
          mode: 'thumbnail',
          media: { title: false },
          description: false,
          footer: false,
          userId: existing.userId,
          existing: { rating: existing.rating },
        });

        message.addEmbed(
          new discord.Embed()
            .setDescription(i18n.get(
              'character-not-owned-by-you',
              locale,
              packs.aliasToArray(character.name)[0],
            )),
        );

        message.addEmbed(embed);

        return await message.patch(token);
      }

      const message = new discord.Message();

      const charId = `${character.packId}:${character.id}`;

      const embed = search.characterEmbed(character, {
        mode: 'thumbnail',
        media: { title: false },
        description: false,
        userId: undefined,
        footer: false,
        existing,
      });

      message.addEmbed(embed);

      const skill: CharacterSkill = skills[skillKey];

      const existingSkill = existing.combat.skills[skillKey];

      const maxed = skill.max <= (existingSkill?.level ?? 0);

      const formatted = format(skill, locale, {
        lvl: existingSkill?.level,
      });

      message.addEmbed(
        new discord.Embed()
          .setDescription(formatted),
      );

      if (maxed) {
        message.addEmbed(
          new discord.Embed()
            .setTitle(i18n.get('skill-is-maxed', locale)),
        );

        return await message.patch(token);
      }

      message.addEmbed(
        new discord.Embed()
          .setTitle(
            i18n.get(
              existingSkill?.level ? 'upgrade-skill' : 'acquire-skill',
              locale,
            ),
          )
          .setDescription(
            `${discord.emotes.remove} ${skill.cost} ${
              i18n.get(
                skill.cost === 1 ? 'skill-point' : 'skill-points',
                locale,
              )
            }`,
          ),
      );

      discord.Message.dialog({
        message,
        confirm: ['cacquire', userId, charId, skillKey],
        userId,
      });

      return await message.patch(token);
    })
    .catch(async (err) => {
      const locale = _user.cachedUsers[userId]?.locale ??
        _user.cachedGuilds[guildId]?.locale;

      if (
        err.response?.status === 404 || err?.message === '404' ||
        err.message?.toLowerCase?.() === 'not found'
      ) {
        return await new discord.Message()
          .addEmbed(new discord.Embed().setDescription(
            i18n.get('found-nothing', locale),
          )).patch(token);
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

  return discord.Message.spinner(true);
}

async function acquire(
  { skillKey, guildId, characterId, userId }: {
    skillKey: SkillKey;
    guildId: string;
    characterId: string;
    userId: string;
  },
): Promise<discord.Message> {
  const locale = _user.cachedUsers[userId]?.locale ??
    _user.cachedGuilds[guildId]?.locale;

  if (!skills[skillKey]) {
    throw new Error('404');
  }

  const skill = skills[skillKey];

  try {
    const existingSkill = await db.acquireSkill(
      userId,
      guildId,
      characterId,
      skillKey,
    );

    const formatted = format(skill, locale, {
      lvl: existingSkill.level - 1,
    });

    return new discord.Message()
      .addEmbed(
        new discord.Embed()
          .setTitle(
            i18n.get(
              existingSkill.level > 1 ? 'skill-upgraded' : 'skill-acquired',
              locale,
            ),
          ),
      )
      .addEmbed(
        new discord.Embed()
          .setDescription(formatted),
      );
  } catch (err) {
    if (err instanceof NonFetalError) {
      const message = err.message === 'failed'
        ? i18n.get('failed', locale)
        : err.message;

      return new discord.Message()
        .addEmbed(new discord.Embed().setDescription(message));
    }

    throw err;
  }
}

function all(
  index: number,
  category?: SkillCategory,
  locale?: discord.AvailableLocales,
): discord.Message {
  const message = new discord.Message();

  const __skills = Object.values(skills)
    .filter((skill) => {
      if (category && !(skill.categories as string[]).includes(category)) {
        return false;
      }
      return true;
    });

  const pages = utils.chunks(__skills, 3);

  const page = pages[index];

  const content = page
    .map((skill) => format(skill, locale, { showcase: true }))
    .join('\n\n');

  message.addEmbed(new discord.Embed().setDescription(content));

  return discord.Message.page({
    index,
    message,
    total: pages.length,
    type: 'skills',
    target: category ?? '',
    next: index + 1 < pages.length,
    locale,
  });
}

export { skills };

export default {
  preAcquire,
  acquire,
  all,
};
