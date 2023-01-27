import {
  captureException,
} from 'https://raw.githubusercontent.com/timfish/sentry-deno/fb3c482d4e7ad6c4cf4e7ec657be28768f0e729f/src/mod.ts';

import utils, { ImageSize } from './utils.ts';

import Rating from './rating.ts';

import config from './config.ts';

import { Character, CharacterRole, Media } from './types.ts';

import * as discord from './discord.ts';

import packs from './packs.ts';

export type Pull = {
  role?: CharacterRole;
  character: Character;
  media: Media;
  pool: number;
  rating: Rating;
  popularityGreater: number;
  popularityLesser?: number;
};

const lowest = 1000;

const variables = {
  roles: {
    10: CharacterRole.Main, // 10% for Main
    70: CharacterRole.Supporting, // 70% for Supporting
    20: CharacterRole.Background, // 20% for Background
  },
  ranges: {
    // whether you get from the far end or the near end
    // of those ranges is up to total RNG
    65: [lowest, 50_000], // 65% for 1K -> 50K
    22: [50_000, 100_000], // 22% for 50K -> 100K
    9: [100_000, 200_000], // 9% for 100K -> 200K
    3: [200_000, 400_000], // 3% for 200K -> 400K
    1: [400_000, NaN], // 1% for 400K -> inf
  },
};

/**
 * force a specific pull using an id
 */
async function forcePull(id: string): Promise<Pull> {
  const results = await packs.characters({ ids: [id] });

  if (!results.length) {
    throw new Error('404');
  }

  // aggregate the media by populating any references to other media/character objects
  const character = await packs.aggregate<Character>({ character: results[0] });

  const edge = character.media?.edges?.[0];

  if (!edge) {
    throw new Error('404');
  }

  const popularity = character.popularity || edge.node.popularity || lowest;

  return {
    pool: 1,
    character,
    media: edge.node,
    role: edge.role,
    popularityGreater: -1,
    popularityLesser: -1,
    rating: new Rating({
      popularity,
      role: character.popularity ? undefined : edge.role,
    }),
  };
}

/**
 * generate a pool of characters then pull one
 */
async function rngPull(): Promise<Pull> {
  // roll for popularity range that wil be used to generate the pool
  const range = utils.rng(gacha.variables.ranges);

  const role = range[0] === 0
    // include all roles in the pool
    ? undefined
    // one specific role for the whole pool
    : utils.rng(gacha.variables.roles);

  const pool = await packs.pool({ range, role });

  let rating: Rating | undefined = undefined;
  let character: Character | undefined = undefined;
  let media: Media | undefined = undefined;

  const inRange = (popularity: number): boolean =>
    popularity >= range[0] &&
    (isNaN(range[1]) || popularity <= range[1]);

  while (pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);

    const characterId = pool.splice(i, 1)[0].id;

    const results = await packs.characters({
      ids: [characterId],
    });

    // search will return empty if the character is disabled
    if (!results.length) {
      continue;
    }

    if (
      // if the character has specified popularity
      // and that specified popularity is not in range of
      // the pool parameters
      (typeof results[0].popularity === 'number' &&
        !inRange(results[0].popularity)) ||
      Array.isArray(results[0].media) &&
        // no media or
        // or role is not equal to the pool parameter
        (!results[0].media[0] || results[0].media[0].role !== role)
    ) {
      continue;
    }

    // aggregate will filter out any disabled media
    const candidate = await packs.aggregate<Character>({
      character: results[0],
    });

    const edge = candidate.media?.edges?.[0];

    // if no media
    if (!edge) {
      continue;
    }

    const popularity = candidate.popularity || edge.node.popularity || lowest;

    if (
      // check if character parameters match the pool parameters
      inRange(popularity) &&
      (!role || edge?.role === role)
    ) {
      media = edge.node;
      character = candidate;
      rating = new Rating({
        popularity,
        role: character.popularity ? undefined : edge.role,
      });
      break;
    }
  }

  if (!character || !media || !rating) {
    throw new Error(
      'failed to pull a character due to the pool not containing any characters that match the randomly chosen variables',
    );
  }

  return {
    role: role,
    media: media,
    rating: rating,
    character: character,
    pool: pool.length,
    popularityGreater: range[0],
    popularityLesser: range[1],
  };
}

/**
 * start the roll's animation
 */
function start(
  { token, id }: { token: string; id?: string },
): discord.Message {
  (id ? gacha.forcePull(id) : gacha.rngPull())
    .then(async (pull) => {
      const media = pull.media;

      const mediaTitles = packs.aliasToArray(media.title);

      let message = new discord.Message()
        .addEmbed(
          new discord.Embed()
            .setTitle(utils.wrap(mediaTitles[0]))
            .setImage({
              default: true,
              preferredSize: ImageSize.Medium,
              url: media.images?.[0].url,
            }),
        );

      await message.patch(token);

      await utils.sleep(4);

      message = new discord.Message()
        .addEmbed(
          new discord.Embed()
            .setImage({
              url: `${config.origin}/assets/stars/${pull.rating.stars}.gif`,
            }),
        );

      await message.patch(token);

      await utils.sleep(pull.rating.stars >= 5 ? 7 : 5);

      const characterAliases = packs.aliasToArray(pull.character.name);

      message = new discord.Message()
        .addEmbed(
          new discord.Embed()
            .setTitle(pull.rating.emotes)
            .addField({
              name: utils.wrap(mediaTitles[0]),
              value: `**${utils.wrap(characterAliases[0])}**`,
            })
            .setImage({
              default: true,
              preferredSize: ImageSize.Medium,
              url: pull.character.images?.[0].url,
            }),
        );

      await message.patch(token);
    })
    .catch(async (err) => {
      if (err?.response?.status === 404 || err?.message === '404') {
        return await new discord.Message().setContent(
          'Found _nothing_ matching that query!',
        ).patch(token);
      }

      if (!config.sentry) {
        throw err;
      }

      const refId = captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return new discord.Message()
    .addEmbed(
      new discord.Embed().setImage(
        { url: `${config.origin}/assets/spinner.gif` },
      ),
    );
}

const gacha = {
  variables,
  forcePull,
  rngPull,
  start,
};

export default gacha;
