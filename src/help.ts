import i18n from '~/src/i18n.ts';
import user from '~/src/user.ts';

import * as discord from '~/src/discord.ts';

import {
  COSTS,
  MAX_PULLS,
  RECHARGE_DAILY_TOKENS_HOURS,
  RECHARGE_MINS,
  STEAL_COOLDOWN_HOURS,
} from '~/db/mod.ts';

import { PARTY_PROTECTION_PERIOD } from '~/src/steal.ts';
import { RECHARGE_KEYS_MINS } from '~/db/mod.ts';

function pages(
  { userId, index }: { userId: string; index: number },
): discord.Message {
  const locale = user.cachedUsers[userId]?.locale;

  const pages = [
    new discord.Message()
      .addComponents([
        new discord.Component()
          .setId('gacha', userId)
          .setLabel('/gacha'),
        new discord.Component()
          .setId('now', userId)
          .setLabel('/now'),
        new discord.Component()
          .setLabel('GitHub')
          .setUrl('https://github.com/ker0olos/fable'),
        new discord.Component()
          .setLabel(i18n.get('support-server', locale))
          .setUrl('https://discord.gg/H69RVBxeYY'),
        new discord.Component()
          .setLabel(i18n.get('donate', locale))
          .setUrl('https://ko-fi.com/ker0olos'),
      ])
      .addEmbed(
        new discord.Embed()
          .setAuthor({ name: '1.' })
          .setTitle('`/gacha`')
          .setDescription([
            i18n.get('help-page1-before-anything', locale),
            '',
            i18n.get(
              'help-page1-you-get-n-every-t',
              locale,
              RECHARGE_MINS,
              MAX_PULLS,
            ),
            '',
            i18n.get('help-page1-characters-are-exclusive', locale),
            '',
            i18n.get(
              'help-page1-characters-vary',
              locale,
              discord.emotes.smolStar,
            ),
            '',
            i18n.get('help-page1-gacha-rates', locale, discord.emotes.smolStar),
            '',
            i18n.get('help-page1-footer', locale),
            discord.empty,
          ].join('\n'))
          .setFooter({ text: `${i18n.get('aliases', locale)}: /w, /q` }),
      ),
    new discord.Message()
      .addEmbed(
        new discord.Embed()
          .setAuthor({ name: '2.' })
          .setTitle('`/merge`')
          .setDescription([
            i18n.get('help-page2-sacrifice-characters', locale),
            '',
            i18n.get('help-page2-merge-protect', locale),
            '',
            i18n.get('help-page2-merging', locale),
            '',
            i18n.get('help-page2-auto-merging', locale),
            '',
            i18n.get(
              'help-page2-merge-example-1',
              locale,
              discord.emotes.smolStar,
            ),
            i18n.get(
              'help-page2-merge-example-2',
              locale,
              discord.emotes.smolStar,
            ),
            '',
            i18n.get('help-page2-footer', locale),
            discord.empty,
          ].join('\n'))
          .setFooter({ text: `${i18n.get('aliases', locale)}: /synthesis` }),
      ),
    new discord.Message()
      .addComponents([
        new discord.Component()
          .setId('cstars', '5', userId)
          .setLabel('/collection stars 5'),
        new discord.Component()
          .setId('cstars', '4', userId)
          .setLabel('/collection stars 4'),
      ])
      .addEmbed(
        new discord.Embed()
          .setAuthor({ name: '3.' })
          .setTitle('`/party`')
          .setDescription(
            [
              i18n.get('help-page3-party-required', locale),
              '',
              i18n.get('help-page3-party-presets-disclaimer', locale),
              '',
              i18n.get('help-page3-party-view', locale),
              '',
              i18n.get('help-page3-party-assign-1', locale),
              i18n.get('help-page3-party-assign-2', locale),
              '',
              i18n.get('help-page3-footer', locale),
              discord.empty,
            ].join('\n'),
          )
          .setFooter({ text: `${i18n.get('aliases', locale)}: /team, /p` }),
      ),
    new discord.Message()
      .addEmbed(
        new discord.Embed()
          .setAuthor({ name: i18n.get('help-page4-title', locale) })
          .setDescription([
            i18n.get('help-page4-negotiations', locale),
            '',
            i18n.get('help-page4-party-is-protected', locale),
            '',
            i18n.get('help-page4-inactive-users', locale),
            '',
            i18n.get(
              'help-page4-losing-protection',
              locale,
              PARTY_PROTECTION_PERIOD,
            ),
            '',
            i18n.get(
              'help-page4-steal-chance',
              locale,
              discord.emotes.smolStar,
            ),
            '',
            i18n.get(
              'help-page4-cooldown',
              locale,
              STEAL_COOLDOWN_HOURS / 24,
            ),
            '',
            i18n.get('help-page4-footer', locale),
            discord.empty,
          ].join('\n')),
      ),
    new discord.Message()
      .addEmbed(
        new discord.Embed()
          .setAuthor({ name: i18n.get('help-page10-title', locale) })
          .setDescription([
            i18n.get('help-page10-starting-points', locale),
            '',
            i18n.get('help-page10-stats-rng', locale),
            '',
            i18n.get('help-page10-attack', locale),
            '',
            i18n.get('help-page10-defense', locale),
            '',
            i18n.get('help-page10-speed', locale),
            '',
            i18n.get('help-page10-tower', locale),
            '',
            i18n.get('help-page10-reclear', locale),
            '',
            i18n.get('help-page10-distribution', locale),
            '',
            i18n.get('help-page10-keys', locale, RECHARGE_KEYS_MINS),
            discord.empty,
          ].join('\n')),
      ),
    new discord.Message()
      .addComponents([
        new discord.Component()
          .setId('buy', 'bguaranteed', userId, '5')
          .setLabel(`/buy guaranteed 5`),
      ])
      .addEmbed(
        new discord.Embed()
          .setAuthor({ name: i18n.get('help-page5-title', locale) })
          .setDescription([
            i18n.get('help-page5-shop', locale),
            '',
            i18n.get(
              'help-page5-daily-tokens',
              locale,
              RECHARGE_DAILY_TOKENS_HOURS,
            ),
            '',
            i18n.get('help-page5-buy-normal', locale, RECHARGE_MINS),
            '',
            i18n.get('help-page5-buy-guaranteed', locale),
            '',
            i18n.get('help-page5-example', locale, discord.emotes.smolStar),
            '',
            i18n.get(
              'help-page5-buy-3s',
              locale,
              discord.emotes.smolStar,
              COSTS.THREE,
            ),
            i18n.get(
              'help-page5-buy-4s',
              locale,
              discord.emotes.smolStar,
              COSTS.FOUR,
            ),
            i18n.get(
              'help-page5-buy-5s',
              locale,
              discord.emotes.smolStar,
              COSTS.FIVE,
            ),
            '',
            i18n.get('help-page5-footer', locale),
            discord.empty,
          ].join('\n'))
          .setFooter({ text: `${i18n.get('aliases', locale)}: /shop` }),
      ),
    new discord.Message()
      .addEmbed(
        new discord.Embed()
          .setAuthor({ name: i18n.get('help-page7-title', locale) })
          .setDescription([
            `- \`/gacha\` \`/w\`: _${i18n.get('/gacha', locale)}_`,
            `- \`/q\`: _${i18n.get('/q', locale)}_`,
            `- \`/pull\` \`/guaranteed\`: _${i18n.get('/pull', locale)}_`,
            '',
            `- \`/now\` \`/tu\`: _${i18n.get('/now', locale)}_`,
            `- \`/search\` \`/anime\` \`/manga\` \`/series\`: _${
              i18n.get('/search', locale)
            }_`,
            `- \`/character\`: _${i18n.get('/character', locale)}_`,
            '',
            `- \`/merge\` \`/synthesize\`: _${i18n.get('/merge', locale)}_`,
            '',
            `- \`/party view\` \`/team view\` \`/p view\`: _${
              i18n.get('/party view', locale)
            }_`,
            `- \`/party assign\` \`/team assign\` \`/p assign\`: _${
              i18n.get('/party assign', locale)
            }_`,
            `- \`/party swap\` \`/team swap\` \`/p swap\`: _${
              i18n.get('/party swap', locale)
            }_`,
            `- \`/party remove\` \`/team remove\` \`/p remove\`: _${
              i18n.get('/party remove', locale)
            }_`,
            '',
            `- \`/collection show\` \`/coll show\` \`/mm show\`: _${
              i18n.get('/coll show', locale)
            }_`,
            `- \`/collection stars\` \`/coll stars\` \`/mm stars\`: _${
              i18n.get('/coll stars', locale)
            }_`,
            `- \`/collection media\` \`/coll media\` \`/mm media\`: _${
              i18n.get('/coll media', locale)
            }_`,
            `- \`/collection sum\` \`/coll sum\` \`/mm sum\`: _${
              i18n.get('/coll sum', locale)
            }_`,
            '',
            `- \`/steal\`: _${i18n.get('/steal', locale)}_`,
            `- \`/trade\` \`/offer\`: _${i18n.get('/trade', locale)}_`,
            `- \`/give\` \`/gift\`: _${i18n.get('/give', locale)}_`,
            '',
            `- \`/chat\` \`/talk\`: _${i18n.get('/chat', locale)}_`,
            '',
            `- \`/battle tower\`: _${i18n.get('/battle tower', locale)}_`,
            `- \`/battle challenge\`: _${
              i18n.get('/battle challenge', locale)
            }_`,
            `- \`/reclear\`: _${i18n.get('/reclear', locale)}_`,
          ].join('\n')),
      ),
    new discord.Message()
      .addEmbed(
        new discord.Embed()
          .setAuthor({ name: i18n.get('help-page8-title', locale) })
          .setDescription([
            `- \`/nick\`: _${i18n.get('/nick', locale)}_`,
            `- \`/image\` \`/custom\`: _${i18n.get('/image', locale)}_`,
            '',
            `- \`/found\` \`/owned\`: _${i18n.get('/found', locale)}_`,
            '',
            `- \`/likeslist\`: _${i18n.get('/likeslist', locale)}_`,
            '',
            `- \`/like\` \`/protect\` \`/wish\`: _${
              i18n.get('/like', locale)
            }_`,
            `- \`/unlike\`: _${i18n.get('/unlike', locale)}_`,
            `- \`/likeall\`: _${i18n.get('/likeall', locale)}_`,
            `- \`/unlikeall\`: _${i18n.get('/unlikeall', locale)}_`,
            '',
            `- \`/buy normal\` \`/shop normal\`: _${
              i18n.get('/buy normal', locale)
            }_`,
            `- \`/buy guaranteed\` \`/shop guaranteed\`: _${
              i18n.get('/buy guaranteed', locale)
            }_`,
            '',
            `- \`/automerge min\`: _${i18n.get('/automerge min', locale)}_`,
            `- \`/automerge max\`: _${i18n.get('/automerge max', locale)}_`,
            '',
            `- \`/installed packs\`: _${i18n.get('/installed packs', locale)}_`,
            '',
            `- \`/logs\` \`/history\`: _${i18n.get('/logs', locale)}_`,
          ].join('\n')),
      ),
    new discord.Message()
      .addEmbed(
        new discord.Embed().setAuthor({
          name: i18n.get('help-page9-title', locale),
        })
          .setDescription([
            i18n.get('community-packs-permission', locale),
            `- \`/packs install\`: _${i18n.get('/packs install', locale)}_`,
            `- \`/packs uninstall\`: _${i18n.get('/packs uninstall', locale)}_`,
            `- \`/packs disable builtins\`: _${
              i18n.get('/packs disable builtins', locale)
            }_`,
            '',
            i18n.get('make-your-own-pack', locale),
          ].join('\n')),
      ),
  ];

  return discord.Message.page({
    message: pages[index],
    total: pages.length,
    type: 'help',
    next: index + 1 < pages.length,
    index,
    locale,
  });
}

const help = {
  pages,
};

export default help;
