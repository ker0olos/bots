import {
  captureException,
  init as initSentry,
} from 'https://raw.githubusercontent.com/timfish/sentry-deno/fb3c482d4e7ad6c4cf4e7ec657be28768f0e729f/src/mod.ts';

import {
  json,
  serve,
  serveStatic,
  validateRequest,
} from 'https://deno.land/x/sift@0.6.0/mod.ts';

import * as discord from './discord.ts';

import * as search from './search.ts';
import * as user from './user.ts';

import packs from './packs.ts';
import utils from './utils.ts';
import gacha from './gacha.ts';

import config, { initConfig } from './config.ts';

import { Character, ManifestType, Media } from './types.ts';

import { NonFetalError, NoPermissionError } from './errors.ts';

await initConfig();

const idPrefix = 'id=';

const handler = async (r: Request) => {
  const { origin } = new URL(r.url);

  initSentry({ dsn: config.sentry });

  const { error } = await validateRequest(r, {
    POST: {
      headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
    },
  });

  if (error) {
    return json(
      { error: error.message },
      { status: error.status },
    );
  }

  const signature = r.headers.get('X-Signature-Ed25519') || undefined;
  const timestamp = r.headers.get('X-Signature-Timestamp') || undefined;

  const { valid, body } = utils.verifySignature({
    publicKey: config.publicKey,
    body: await r.text(),
    signature,
    timestamp,
  });

  if (!valid) {
    return json(
      { error: 'Invalid request' },
      { status: 401 },
    );
  }

  const interaction = new discord.Interaction<string | number | boolean>(body);

  const {
    name,
    type,
    token,
    guildId,
    channelId,
    member,
    options,
    subcommand,
    customType,
    customValues,
  } = interaction;

  if (type === discord.InteractionType.Ping) {
    return discord.Message.pong();
  }

  config.origin = origin;

  try {
    switch (type) {
      case discord.InteractionType.Partial: {
        switch (name) {
          case 'search': // search
          case 'anime':
          case 'manga':
          case 'media':
          case 'music': // music also takes the same input
          case 'songs':
          case 'themes': {
            const query = options['query'] as string;

            const message = new discord.Message(
              discord.MessageType.Suggestions,
            );

            const results = await packs.searchMany<Media>(
              'media',
              query,
            );

            results?.forEach((media) => {
              message.addSuggestions({
                name: `${packs.aliasToArray(media.title)[0]}`,
                value: `${idPrefix}${media.packId}:${media.id}`,
              });
            });

            return message.send();
          }
          case 'character':
          case 'char': {
            const query = options['query'] as string;

            const message = new discord.Message(
              discord.MessageType.Suggestions,
            );

            const results = await packs.searchMany<Character>(
              'characters',
              query,
            );

            results?.forEach((character) => {
              message.addSuggestions({
                name: `${packs.aliasToArray(character.name)[0]}`,
                value: `${idPrefix}${character.packId}:${character.id}`,
              });
            });

            return message.send();
          }
        }
        break;
      }
      case discord.InteractionType.Command:
        switch (name) {
          case 'search':
          case 'anime':
          case 'manga':
          case 'media': {
            const query = options['query'] as string;

            return (await search.media({
              debug: Boolean(options['debug']),
              id: query.startsWith(idPrefix)
                ? query.substring(idPrefix.length)
                : undefined,
              search: query,
            }))
              .send();
          }
          case 'character':
          case 'char': {
            const query = options['query'] as string;

            return (await search.character({
              debug: Boolean(options['debug']),
              id: query.startsWith(idPrefix)
                ? query.substring(idPrefix.length)
                : undefined,
              search: query,
            }))
              .send();
          }
          case 'music':
          case 'songs':
          case 'themes': {
            const query = options['query'] as string;

            return (await search.music({
              id: query.startsWith(idPrefix)
                ? query.substring(idPrefix.length)
                : undefined,
              search: query,
            }))
              .send();
          }
          case 'now':
          case 'checklist':
          case 'cl':
          case 'tu': {
            return (await user.now({
              userId: member.user.id,
              guildId,
              channelId,
            }))
              .send();
          }
          case 'gacha':
          case 'pull':
          case 'roll':
          case 'w':
            return gacha
              .start({
                token,
                userId: member.user.id,
                guildId,
                channelId,
              })
              .send();
          case 'force_pull':
            return gacha
              .start({ token, characterId: options['id'] as string })
              .send();
          case 'collection':
          case 'list':
          case 'mm': {
            return (await user.collection({
              userId: member.user.id,
              guildId,
              channelId,
            }))
              .send();
          }
          case 'packs': {
            return packs.embed({
              // deno-lint-ignore no-non-null-assertion
              type: subcommand! as ManifestType,
            }).send();
          }
          case 'anilist': {
            // deno-lint-ignore no-non-null-assertion
            const message = await packs.anilist(subcommand!, interaction);

            // deno-lint-ignore no-non-null-assertion
            return message!.send();
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

            return (await search.media({ id }))
              .setType(discord.MessageType.Update)
              .send();
          }
          case 'mcharacter': {
            // deno-lint-ignore no-non-null-assertion
            const mediaId = customValues![0];

            // deno-lint-ignore no-non-null-assertion
            const index = parseInt(customValues![1]) || 0;

            return (await search.mediaCharacter({
              mediaId,
              index,
            }))
              .setType(discord.MessageType.Update)
              .send();
          }
          // case 'collection': {
          //   // deno-lint-ignore no-non-null-assertion
          //   const userId = customValues![0];
          //   // deno-lint-ignore no-non-null-assertion
          //   const characterRef = customValues![1];

          //   return (await user.collection({
          //     userId,
          //     guildId,
          //     channelId,
          //     on: characterRef,
          //   }))
          //     .setType(discord.MessageType.Update)
          //     .send();
          // }
          case 'gacha': {
            // deno-lint-ignore no-non-null-assertion
            const userId = customValues![0];

            // verify user id
            if (userId === member.user.id) {
              return gacha
                .start({
                  token,
                  userId: member.user.id,
                  guildId,
                  channelId,
                  messageType: discord.MessageType.Update,
                })
                .send();
            }

            throw new NoPermissionError();
          }
          case 'anchor': {
            // deno-lint-ignore no-non-null-assertion
            const type = customValues![0];
            // deno-lint-ignore no-non-null-assertion
            const id = customValues![1];
            // deno-lint-ignore no-non-null-assertion
            const anchor = customValues![2];
            // deno-lint-ignore no-non-null-assertion
            const action = customValues![3];

            switch (type) {
              case 'builtin':
              case 'manual': {
                return packs.embed({
                  anchor,
                  action,
                  type: type as ManifestType,
                }).setType(discord.MessageType.Update).send();
              }
              case 'collection': {
                return (await user.collection({
                  guildId,
                  channelId,
                  userId: id,
                  after: action === 'next' ? anchor : undefined,
                  before: action === 'prev' ? anchor : undefined,
                }))
                  .setType(discord.MessageType.Update)
                  .send();
              }
              default:
                break;
            }
            break;
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
        .setFlags(discord.MessageFlags.Ephemeral)
        .addEmbed(
          new discord.Embed().setDescription(
            'Found _nothing_ matching that query!',
          ),
        ).send();
    }

    if (err instanceof NonFetalError) {
      return new discord.Message()
        .setFlags(discord.MessageFlags.Ephemeral)
        .addEmbed(
          new discord.Embed().setDescription(err.message),
        ).send();
    }

    if (err instanceof NoPermissionError) {
      return new discord.Message()
        .setFlags(discord.MessageFlags.Ephemeral)
        .setContent('Forbidden')
        .send();
    }

    if (!config.sentry) {
      throw err;
    }

    const refId = captureException(err, {
      extra: { ...interaction },
    });

    return discord.Message.internal(refId).send();
  }

  return new discord.Message().setContent(`Unimplemented!`).send();
};

function cache(
  age: number,
  type?: string,
): (req: Request, res: Response) => Response {
  return (_: Request, response: Response): Response => {
    if (type) {
      response.headers.set('Content-Type', type);
    }
    response.headers.set('Cache-Control', `public, max-age=${age}`);
    return response;
  };
}

serve({
  '/': handler,
  '/external/*': utils.proxy,
  '/assets/:filename+': serveStatic('../assets/public', {
    baseUrl: import.meta.url,
    intervene: cache(604800),
  }),
  '/:filename+': serveStatic('../json', {
    baseUrl: import.meta.url,
    intervene: cache(86400, 'application/schema+json'),
  }),
});
