import * as discord from '~/src/discord.ts';

import search, { idPrefix } from '~/src/search.ts';

import i18n from '~/src/i18n.ts';
import user from '~/src/user.ts';
import party from '~/src/party.ts';
import packs from '~/src/packs.ts';
import utils from '~/src/utils.ts';
import gacha from '~/src/gacha.ts';
import trade from '~/src/trade.ts';
import steal from '~/src/steal.ts';
import shop from '~/src/shop.ts';
import stats from '~/src/stats.ts';
import battle from '~/src/battle.ts';
import tower from '~/src/tower.ts';
import help from '~/src/help.ts';
import chat from '~/src/chat.ts';

import _skills, { skills } from '~/src/skills.ts';

import merge from '~/src/merge.ts';

import * as communityAPI from '~/src/communityAPI.ts';

import config, { initConfig } from '~/src/config.ts';

import { NonFetalError, NoPermissionError } from '~/src/errors.ts';

import type { SkillCategory, SkillKey } from '~/src/types.ts';

export const handler = async (r: Request) => {
  const { origin } = new URL(r.url);

  const { error } = await utils.validateRequest(r, {
    POST: {
      headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
    },
  });

  if (error) {
    return utils.json(
      { error: error.message },
      { status: error.status },
    );
  }

  // deno-lint-ignore no-non-null-assertion
  const signature = r.headers.get('X-Signature-Ed25519')!;

  // deno-lint-ignore no-non-null-assertion
  const timestamp = r.headers.get('X-Signature-Timestamp')!;

  const { valid, body } = utils.verifySignature({
    publicKey: config.publicKey,
    body: await r.text(),
    signature,
    timestamp,
  });

  if (!valid) {
    return utils.json(
      { error: 'Invalid request' },
      { status: 401 },
    );
  }

  const interaction = new discord.Interaction<string | number | boolean>(body);

  const {
    name,
    type,
    locale,
    guildLocale,
    token,
    guildId,
    focused,
    member,
    options,
    subcommand,
    customType,
    customValues,
  } = interaction;

  const ts = Date.now() - parseInt(timestamp) * 1000;

  // exceeded time limit set by discord (3 seconds)
  if (ts >= 2800) {
    return Response.error();
  }

  if (type === discord.InteractionType.Ping) {
    return discord.Message.pong();
  }

  if (!config.global) {
    const message = new discord.Message()
      .setFlags(discord.MessageFlags.Ephemeral)
      .addEmbed(
        new discord.Embed().setDescription(
          i18n.get('global-maintenance', locale),
        ),
      );

    if (config.notice) {
      message.addEmbed(
        new discord.Embed()
          .setDescription(config.notice.replaceAll('\\n', '\n')),
      );
    }

    return message.send();
  }

  config.origin = origin;

  if (guildId) {
    user.cachedGuilds[guildId] = {
      // deno-lint-ignore no-non-null-assertion
      locale: guildLocale!,
    };
  }

  if (member?.user?.id) {
    // cache the user's locale into a global variable
    user.cachedUsers[member.user.id] = {
      // deno-lint-ignore no-non-null-assertion
      locale: locale!,
    };
  }

  try {
    switch (type) {
      case discord.InteractionType.Partial: {
        if (!name) {
          break;
        }

        // suggest media
        if (
          (
            [
              'search',
              'anime',
              'manga',
              'media',
              'series',
              'found',
              'owned',
              'likeall',
              'unlikeall',
            ]
              .includes(name)
          ) ||
          (
            ['collection', 'coll', 'mm'].includes(name) &&
            subcommand === 'media'
          )
        ) {
          // deno-lint-ignore no-non-null-assertion
          const search = options[focused!] as string;

          const message = new discord.Message(
            discord.MessageType.Suggestions,
          );

          if (search) {
            const results = await packs._searchManyMedia({
              search,
              guildId,
            });

            results
              .forEach((media) => {
                message.addSuggestions({
                  name: media.title[0],
                  value: `${idPrefix}${media.id}`,
                });
              });
          }

          return message.send();
        }

        // suggest characters
        if (
          [
            'character',
            'p',
            'party',
            'team',
            'give',
            'gift',
            'trade',
            'offer',
            'steal',
            'nick',
            'image',
            'custom',
            'like',
            'unlike',
            'stats',
            'chat',
            'talk',
          ].includes(name) || (
            // deno-lint-ignore no-non-null-assertion
            name === 'skills' && ['acquire', 'upgrade'].includes(subcommand!) &&
            focused === 'character'
          )
        ) {
          // deno-lint-ignore no-non-null-assertion
          const search = options[focused!] as string;

          const message = new discord.Message(
            discord.MessageType.Suggestions,
          );

          if (search) {
            const results = await packs._searchManyCharacters({
              search,
              guildId,
            });

            results
              .forEach((character) => {
                message.addSuggestions({
                  name: character.mediaTitle?.length
                    ? `${character.name[0]} (${character.mediaTitle[0]})`
                    : character.name[0],
                  value: `${idPrefix}${character.id}`,
                });
              });
          }

          return message.send();
        }

        // suggest installed community packs
        if (
          // deno-lint-ignore no-non-null-assertion
          name === 'packs' && ['uninstall'].includes(subcommand!)
        ) {
          // deno-lint-ignore no-non-null-assertion
          const id = options[focused!] as string;

          const message = new discord.Message(
            discord.MessageType.Suggestions,
          );

          let list = await packs.all({
            filter: true,
            guildId,
          });

          const distance: Record<string, number> = {};

          // sort suggestion based on distance
          list.forEach(({ manifest }) => {
            const d = utils.distance(manifest.id, id);

            if (manifest.title) {
              const d2 = utils.distance(manifest.title, id);

              if (d < d2) {
                distance[manifest.id] = d2;
                return;
              }
            }

            distance[manifest.id] = d;
          });

          list = list.sort((a, b) =>
            distance[b.manifest.id] - distance[a.manifest.id]
          );

          list?.forEach(({ manifest }) => {
            message.addSuggestions({
              name: `${manifest.title ?? manifest.id}`,
              value: manifest.id,
            });
          });

          return message.send();
        }

        // suggest acquirable character skills
        if (
          // deno-lint-ignore no-non-null-assertion
          name === 'skills' && ['acquire', 'upgrade'].includes(subcommand!) &&
          focused === 'skill'
        ) {
          // deno-lint-ignore no-non-null-assertion
          const name = options[focused!] as string;

          const message = new discord.Message(
            discord.MessageType.Suggestions,
          );

          const distance: Record<string, number> = {};

          let _skills = Object.entries(skills);

          // sort suggestion based on distance
          _skills.forEach(([skillKey, skill]) => {
            const skillName = i18n.get(skill.key, locale);

            const d = utils.distance(skill.key, name);
            const d2 = utils.distance(skillName, name);

            if (d > d2) {
              distance[skillKey] = d2;
            } else {
              distance[skillKey] = d;
            }
          });

          _skills = _skills.sort((a, b) => distance[b[0]] - distance[a[0]]);

          _skills?.forEach(([skillKey, skill]) => {
            const skillName = i18n.get(skill.key, locale);

            message.addSuggestions({
              name: skillName,
              value: skillKey,
            });
          });

          return message.send();
        }

        break;
      }
      case discord.InteractionType.Command:
        switch (name) {
          case 'search':
          case 'anime':
          case 'manga':
          case 'media':
          case 'series': {
            const title = options['title'] as string;

            if (options['characters']) {
              return search.mediaCharacters({
                token,
                guildId,
                index: 0,
                search: title,
                userId: member.user.id,
                id: title.startsWith(idPrefix)
                  ? title.substring(idPrefix.length)
                  : undefined,
              }).send();
            }

            return search.media({
              token,
              guildId,
              search: title,
              debug: Boolean(options['debug']),
              id: title.startsWith(idPrefix)
                ? title.substring(idPrefix.length)
                : undefined,
            })
              .send();
          }
          case 'character': {
            const name = options['name'] as string;

            return search.character({
              token,
              guildId,
              search: name,
              debug: Boolean(options['debug']),
              id: name.startsWith(idPrefix)
                ? name.substring(idPrefix.length)
                : undefined,
            }).send();
          }
          case 'party':
          case 'team':
          case 'p': {
            const spot = options['spot'] as 1 | 2 | 3 | 4 | 5;
            const character = options['name'] as string;

            // deno-lint-ignore no-non-null-assertion
            switch (subcommand!) {
              case 'assign':
                return party.assign({
                  token,
                  spot,
                  userId: member.user.id,
                  guildId,
                  search: character,
                  id: character.startsWith(idPrefix)
                    ? character.substring(idPrefix.length)
                    : undefined,
                }).send();
              case 'swap':
                return party.swap({
                  token,
                  guildId,
                  userId: member.user.id,
                  a: options['a'] as 1 | 2 | 3 | 4 | 5,
                  b: options['b'] as 1 | 2 | 3 | 4 | 5,
                }).send();
              case 'remove':
                return party.remove({
                  token,
                  spot,
                  guildId,
                  userId: member.user.id,
                }).send();
              default: {
                const user = options['user'] as string ?? member.user.id;

                return party.view({
                  token,
                  guildId,
                  userId: user,
                }).send();
              }
            }
          }
          case 'collection':
          case 'coll':
          case 'mm': {
            const userId = options['user'] as string ?? member.user.id;

            // deno-lint-ignore no-non-null-assertion
            switch (subcommand!) {
              case 'show': {
                return user.showcase({
                  token,
                  userId,
                  guildId,
                  index: 0,
                  nick: userId !== member.user.id,
                }).send();
              }
              case 'stars':
              case 'media': {
                const title = options['title'] as string;
                const rating = options['rating'] as number;
                const picture = options['picture'] as boolean;

                return user.list({
                  token,
                  userId,
                  guildId,
                  index: 0,
                  rating,
                  search: title,
                  id: title?.startsWith(idPrefix)
                    ? title?.substring(idPrefix.length)
                    : undefined,
                  nick: userId !== member.user.id,
                  picture,
                }).send();
              }
              case 'sum': {
                return user.sum({
                  token,
                  userId,
                  guildId,
                  nick: userId !== member.user.id,
                }).send();
              }
              default:
                break;
            }
            break;
          }
          case 'like':
          case 'protect':
          case 'wish':
          case 'unlike': {
            const search = options['name'] as string;

            return user.like({
              token,
              search,
              guildId,

              userId: member.user.id,
              undo: name === 'unlike',
              id: search.startsWith(idPrefix)
                ? search.substring(idPrefix.length)
                : undefined,
            })
              .send();
          }
          case 'likeall':
          case 'unlikeall': {
            const search = options['title'] as string;

            return user.likeall({
              token,
              search,
              guildId,

              userId: member.user.id,
              undo: name === 'unlikeall',
              id: search.startsWith(idPrefix)
                ? search.substring(idPrefix.length)
                : undefined,
            })
              .send();
          }
          case 'likes':
          case 'likeslist': {
            const userId = options['user'] as string ?? member.user.id;

            const filter = options['filter'] as boolean | undefined;

            return user.likeslist({
              token,
              guildId,
              userId,
              index: 0,
              nick: userId !== member.user.id,
              filter,
            }).send();
          }
          case 'found':
          case 'owned': {
            const title = options['title'] as string;

            return search.mediaFound({
              token,
              guildId,
              index: 0,
              search: title,
              userId: member.user.id,
              id: title.startsWith(idPrefix)
                ? title.substring(idPrefix.length)
                : undefined,
            })
              .send();
          }
          case 'trade':
          case 'offer':
          case 'give':
          case 'gift': {
            const giveCharacters = [
              options['give'] as string,
              options['give2'] as string,
              options['give3'] as string,
            ].filter(utils.nonNullable);

            const takeCharacters = [
              options['take'] as string,
              options['take2'] as string,
              options['take3'] as string,
            ].filter(utils.nonNullable);

            const message = trade.pre({
              token,
              guildId,
              userId: member.user.id,
              targetId: options['user'] as string,
              give: giveCharacters,
              take: takeCharacters,
            });

            if (!takeCharacters?.length) {
              message.setFlags(discord.MessageFlags.Ephemeral);
            }

            return message.send();
          }
          case 'steal': {
            const search = options['name'] as string;

            return steal.pre({
              token,
              guildId,
              userId: member.user.id,
              search,
              id: search.startsWith(idPrefix)
                ? search.substring(idPrefix.length)
                : undefined,
            })
              .setFlags(discord.MessageFlags.Ephemeral)
              .send();
          }
          case 'now':
          case 'tu': {
            return (await user.now({
              userId: member.user.id,
              guildId,
            }))
              .send();
          }
          case 'guaranteed':
          case 'gacha':
          case 'pull':
          case 'w':
          case 'q': {
            const stars = options['stars'] as number | undefined;

            return gacha
              .start({
                token,
                guildId,
                guarantee: stars,
                quiet: name === 'q',
                userId: member.user.id,
              })
              .send();
          }
          case 'nick': {
            const name = options['character'] as string;

            const nick = options['new_nick'] as string | undefined;

            return user.nick({
              nick,
              token,
              guildId,
              search: name,
              userId: member.user.id,
              id: name.startsWith(idPrefix)
                ? name.substring(idPrefix.length)
                : undefined,
            }).send();
          }
          case 'image':
          case 'custom': {
            const name = options['character'] as string;

            const image = options['new_image'] as string | undefined;

            return user.image({
              image,
              token,
              guildId,

              search: name,
              userId: member.user.id,
              id: name.startsWith(idPrefix)
                ? name.substring(idPrefix.length)
                : undefined,
            }).send();
          }
          case 'synthesize':
          case 'merge': {
            const target = options['target'] as number;

            return (await merge.synthesize({
              token,
              guildId,
              userId: member.user.id,
              mode: 'target',
              target,
            })).send();
          }
          case 'automerge': {
            // deno-lint-ignore no-non-null-assertion
            switch (subcommand!) {
              case 'min':
              case 'max':
                return (await merge.synthesize({
                  token,
                  guildId,
                  userId: member.user.id,
                  mode: subcommand,
                })).send();
              default:
                break;
            }
            break;
          }
          case 'shop':
          case 'buy': {
            //deno-lint-ignore no-non-null-assertion
            switch (subcommand!) {
              case 'guaranteed':
                return shop.guaranteed({
                  userId: member.user.id,
                  stars: options['stars'] as number,
                }).send();
              case 'normal':
                return shop.normal({
                  userId: member.user.id,
                  amount: options['amount'] as number,
                }).send();
              case 'keys':
                return shop.keys({
                  userId: member.user.id,
                  amount: options['amount'] as number,
                }).send();
              default:
                break;
            }
            break;
          }
          case 'chat':
          case 'talk': {
            const name = options['name'] as string;
            const message = options['message'] as string;

            return chat.run({
              token,
              message,
              guildId,
              search: name,
              member,
              id: name.startsWith(idPrefix)
                ? name.substring(idPrefix.length)
                : undefined,
            }).send();
          }
          case 'installed':
          case 'packs': {
            //deno-lint-ignore no-non-null-assertion
            switch (subcommand!) {
              default:
              case 'installed': {
                return (await packs.pages({
                  guildId,
                  userId: member.user.id,
                })).send();
              }
              case 'install': {
                const id = options['id'] as string;

                return (await packs.install({
                  id,
                  guildId,
                  userId: member.user.id,
                }))
                  .send();
              }
              case 'uninstall': {
                const list = await packs.all({
                  filter: true,
                  guildId,
                });

                const pack = list.find(({ manifest }) =>
                  manifest.id === options['id'] as string
                );

                if (!pack) {
                  throw new Error('404');
                }

                return packs.uninstallDialog({
                  userId: member.user.id,
                  pack,
                })
                  .send();
              }
              case 'disable builtins': {
                return (await packs.disableBuiltins({
                  userId: member.user.id,
                  guildId,
                })).send();
              }
            }
            break;
          }
          case 'help':
          case 'start':
          case 'guide':
          case 'wiki':
          case 'tuto': {
            const index = options['page'] as number || 0;

            return help.pages({ userId: member.user.id, index }).send();
          }
          case 'stats': {
            const character = options['name'] as string;

            return stats.view({
              token,
              guildId,
              character,
              userId: member.user.id,
            }).send();
          }
          case 'skills': {
            // deno-lint-ignore no-non-null-assertion
            switch (subcommand!) {
              case 'showall': {
                const category = options['category'] as SkillCategory;

                return _skills.all(0, category, locale).send();
              }
              case 'upgrade':
              case 'acquire': {
                const skillKey = options['skill'] as SkillKey;
                const character = options['character'] as string;

                return _skills.preAcquire({
                  token,
                  skillKey,
                  guildId,
                  character,
                  userId: member.user.id,
                }).send();
              }
              default:
                break;
            }
            break;
          }
          case 'bt':
          case 'battle': {
            //deno-lint-ignore no-non-null-assertion
            switch (subcommand!) {
              case 'tower': {
                return tower.view({
                  token,
                  guildId,
                  userId: member.user.id,
                })
                  .send();
              }
              case 'challenge': {
                return battle.challengeTower({
                  token,
                  guildId,
                  user: member.user,
                })
                  .send();
              }
              // case 'friend':
              default: { // default is used to respond to users context-menu "Battle" option
                //   const targetId = options['versus'] as string ??
                //     options['user'] as string;
                break;
              }
            }
            break;
          }
          case 'reclear': {
            return (await tower.reclear({
              token,
              guildId,
              userId: member.user.id,
            })).send();
          }
          case 'history':
          case 'logs': {
            const userId = options['user'] as string ?? member.user.id;

            return user.logs({
              token,
              guildId,
              userId,
              nick: userId !== member.user.id,
            }).send();
          }
          default: {
            break;
          }
        }
        break;
      case discord.InteractionType.Component:
        switch (customType) {
          case 'media': {
            // deno-lint-ignore no-non-null-assertion
            const id = customValues![0];

            return search.media({ id, guildId, token })
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'character': {
            // deno-lint-ignore no-non-null-assertion
            const id = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const type = customValues![1];

            return search.character({
              id,
              token,
              guildId,
            })
              .setType(
                type === '1'
                  ? discord.MessageType.New
                  : discord.MessageType.Update,
              )
              .send();
          }
          case 'mcharacters': {
            // deno-lint-ignore no-non-null-assertion
            const mediaId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const index = parseInt(customValues![1]);

            return search.mediaCharacters({
              token,
              index,
              userId: member.user.id,
              guildId,
              id: mediaId,
            })
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'list': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            const mediaId = customValues?.[1] || undefined;

            // deno-lint-ignore no-non-null-assertion
            const rating = parseInt(customValues![2]);

            // deno-lint-ignore no-non-null-assertion
            const picture = customValues![3] === '1';

            // deno-lint-ignore no-non-null-assertion
            const index = parseInt(customValues![4]);

            return user.list({
              token,
              index,
              guildId,
              userId,
              rating,
              id: mediaId,
              picture,
            })
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'showcase': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const index = parseInt(customValues![1]);

            return user.showcase({
              token,
              index,
              guildId,
              userId,
            })
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'like': {
            // deno-lint-ignore no-non-null-assertion
            const id = customValues![0];

            return user.like({
              id,
              token,
              guildId,
              mention: true,
              userId: member.user.id,
              undo: false,
            })
              .send();
          }
          case 'likes': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const filter = customValues![1] === '1';

            // deno-lint-ignore no-non-null-assertion
            const index = parseInt(customValues![2]);

            return user.likeslist({
              index,
              token,
              userId,
              guildId,
              filter,
            })
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'found': {
            // deno-lint-ignore no-non-null-assertion
            const id = customValues![0];
            // deno-lint-ignore no-non-null-assertion
            const index = parseInt(customValues![1]);

            return search.mediaFound({
              id,
              token,
              guildId,
              userId: member.user.id,
              index,
            })
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'q':
          case 'pull':
          case 'gacha': {
            // deno-lint-ignore no-non-null-assertion
            const stars = utils.parseInt(customValues![1]);

            return gacha
              .start({
                token,
                guildId,
                mention: true,
                guarantee: stars,
                quiet: customType === 'q',
                userId: member.user.id,
              }).send();
          }
          case 'now': {
            return (await user.now({
              mention: true,
              userId: member.user.id,
              guildId,
            })).send();
          }
          case 'help': {
            // deno-lint-ignore no-non-null-assertion
            const index = parseInt(customValues![1]);

            return help.pages({ userId: member.user.id, index })
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'buy': {
            // deno-lint-ignore no-non-null-assertion
            const item = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![1];

            // deno-lint-ignore no-non-null-assertion
            const value = parseInt(customValues![2]);

            if (userId === member.user.id) {
              switch (item) {
                case 'bguaranteed':
                  return shop.guaranteed({
                    userId: member.user.id,
                    stars: value,
                  })
                    .setType(discord.MessageType.Update)
                    .send();
                case 'guaranteed':
                  return (await shop.confirmGuaranteed({
                    userId: member.user.id,
                    stars: value,
                  }))
                    .setType(discord.MessageType.Update)
                    .send();
                case 'keys':
                  return (await shop.confirmKeys({
                    guildId,
                    userId: member.user.id,
                    amount: value,
                  }))
                    .setType(discord.MessageType.Update)
                    .send();
                case 'normal':
                  return (await shop.confirmNormal({
                    guildId,
                    userId: member.user.id,
                    amount: value,
                  }))
                    .setType(discord.MessageType.Update)
                    .send();
                default:
                  break;
              }
            }

            throw new NoPermissionError();
          }
          case 'give': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const targetId = customValues![1];

            // deno-lint-ignore no-non-null-assertion
            const giveCharactersIds = customValues![2].split('&');

            if (userId === member.user.id) {
              return trade.give({
                token,
                userId,
                guildId,

                targetId: targetId,
                giveCharactersIds,
              })
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'trade': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const targetId = customValues![1];

            // deno-lint-ignore no-non-null-assertion
            const giveCharactersIds = customValues![2].split('&');

            // deno-lint-ignore no-non-null-assertion
            const takeCharactersIds = customValues![3].split('&');

            if (targetId === member.user.id) {
              return trade.accepted({
                token,
                guildId,

                userId,
                targetId,
                giveCharactersIds,
                takeCharactersIds,
              })
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'synthesis': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const target = parseInt(customValues![1]);

            if (userId === member.user.id) {
              return merge.confirmed({
                token,
                target,
                guildId,

                userId: member.user.id,
              })
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'steal': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const characterId = customValues![1];

            // deno-lint-ignore no-non-null-assertion
            const chance = parseInt(customValues![2]);

            if (userId === member.user.id) {
              return steal.attempt({
                token,
                guildId,
                userId: member.user.id,
                characterId,
                pre: chance,
              })
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'reply': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const characterId = customValues![1];

            // deno-lint-ignore no-non-null-assertion
            const characterName = customValues![2];

            if (userId === member.user.id) {
              return new discord.Message(discord.MessageType.Modal)
                .setId('reply', userId, characterId)
                .setTitle(i18n.get('reply-to', locale, characterName))
                .addComponents([
                  new discord.Component(discord.ComponentType.TextInput)
                    .setId('message')
                    .setLabel(i18n.get('message', locale))
                    .setMinLength(1)
                    .setMaxLength(2048)
                    .setStyle(2),
                ])
                .send();
            }

            throw new NoPermissionError();
          }
          case 'stats': {
            // deno-lint-ignore no-non-null-assertion
            const characterId = customValues![0];

            return stats.view({
              token,
              guildId,
              character: `${idPrefix}${characterId}`,
              userId: member.user.id,
            })
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'cacquire': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const characterId = customValues![1];

            // deno-lint-ignore no-non-null-assertion
            const skillKey = customValues![2] as SkillKey;

            if (userId === member.user.id) {
              return (await _skills.acquire({
                guildId,
                characterId,
                userId,
                skillKey,
              }))
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'passign': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const characterId = customValues![1];

            if (userId === member.user.id) {
              return party.assign({
                token,
                userId: member.user.id,
                guildId,
                id: characterId,
              })
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'sbattle': {
            // deno-lint-ignore no-non-null-assertion
            const id = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![1];

            if (userId === member.user.id) {
              battle.skipBattle(id);

              return discord.Message.spinner(true)
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'skills': {
            // deno-lint-ignore no-non-null-assertion
            const category = customValues![0] as SkillCategory;

            // deno-lint-ignore no-non-null-assertion
            const index = parseInt(customValues![1]);

            return _skills.all(index, category, locale)
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'treclear': {
            return (await tower.reclear({
              token,
              guildId,
              userId: member.user.id,
            }))
              .setType(discord.MessageType.New)
              .send();
          }
          case 'tchallenge': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            return battle.challengeTower({ token, guildId, user: member.user })
              .setType(
                userId === member.user.id
                  ? discord.MessageType.Update
                  : discord.MessageType.New,
              )
              .send();
          }
          case 'install': {
            // deno-lint-ignore no-non-null-assertion
            const id = customValues![0];

            return (await packs.install({
              id,
              guildId,
              userId: member.user.id,
            }))
              .send();
          }
          case 'disable-builtins': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            if (userId === member.user.id) {
              return (await packs.confirmDisableBuiltins({
                guildId,
                userId: member.user.id,
              }))
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'uninstall': {
            // deno-lint-ignore no-non-null-assertion
            const id = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![1];

            if (userId === member.user.id) {
              return (await packs.uninstall({
                id,
                guildId,
                userId: member.user.id,
              }))
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          case 'cancel': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const targetId = customValues![1];

            if (userId && !targetId && userId !== member.user.id) {
              throw new NoPermissionError();
            }

            if (
              userId && targetId && ![userId, targetId].includes(member.user.id)
            ) {
              throw new NoPermissionError();
            }

            return new discord.Message()
              .setContent('')
              .addEmbed(new discord.Embed().setDescription(
                targetId === member.user.id
                  ? i18n.get('declined', locale)
                  : i18n.get('cancelled', locale),
              ))
              .setType(discord.MessageType.Update)
              .send();
          }
          default:
            break;
        }
        break;
      case discord.InteractionType.Modal:
        switch (customType) {
          case 'reply': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const characterId = customValues![1];

            const message = options['message'] as string;

            if (userId === member.user.id) {
              return chat.run({
                token,
                message,
                guildId,
                member,
                id: characterId,
                continue: true,
              })
                .setType(discord.MessageType.Update)
                .send();
            }

            throw new NoPermissionError();
          }
          default:
            break;
        }
        break;
      default:
        break;
    }
  } catch (err) {
    if (
      err.response?.status === 404 || err?.message === '404' ||
      err.message?.toLowerCase?.() === 'not found'
    ) {
      return new discord.Message()
        .setContent('')
        .setFlags(discord.MessageFlags.Ephemeral)
        .addEmbed(
          new discord.Embed().setDescription(
            i18n.get('found-nothing', locale),
          ),
        ).send();
    }

    if (err instanceof NonFetalError) {
      return new discord.Message()
        .setFlags(discord.MessageFlags.Ephemeral)
        .setContent('')
        .setType(discord.MessageType.New)
        .addEmbed(new discord.Embed().setDescription(err.message))
        .send();
    }

    if (err instanceof NoPermissionError) {
      return new discord.Message()
        .setContent('')
        .setFlags(discord.MessageFlags.Ephemeral)
        .addEmbed(
          new discord.Embed().setDescription(
            i18n.get('invalid-permission', locale),
          ),
        ).send();
    }

    if (!config.sentry) {
      throw err;
    }

    const refId = utils.captureException(err, {
      extra: { ...interaction },
    });

    return discord.Message.internal(refId).send();
  }

  return new discord.Message().setContent(
    i18n.get('unimplemented', locale),
  )
    .setFlags(discord.MessageFlags.Ephemeral)
    .send();
};

export async function start(): Promise<void> {
  await initConfig();

  utils.initSentry(config.sentry);

  utils.serve({
    '/': handler,
    '/api/user': communityAPI.user,
    '/api/publish': communityAPI.publish,
    '/api/popular': communityAPI.popular,
    '/api/pack/:packId+': communityAPI.pack,
    '/external/*': utils.handleProxy,
    '/assets/:filename+': utils.serveStatic('../assets/public', {
      baseUrl: import.meta.url,
    }),
    '/invite': () =>
      Response.redirect(
        `https://discord.com/api/oauth2/authorize?client_id=${config.appId}&scope=applications.commands%20bot`,
      ),
    '/robots.txt': () => {
      return new Response(
        'User-agent: *\nDisallow: /',
        { headers: { 'content-type': 'text/plain' } },
      );
    },
  });
}

if (import.meta.main) {
  await start();
}
