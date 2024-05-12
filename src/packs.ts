import _anilistManifest from '~/packs/anilist/manifest.json' with {
  type: 'json',
};

import * as _anilist from '~/packs/anilist/mod.ts';

import * as discord from '~/src/discord.ts';

import user from '~/src/user.ts';
import utils from '~/src/utils.ts';

import searchIndex from '~/search-index/mod.ts';

import i18n from '~/src/i18n.ts';

import config from '~/src/config.ts';

import db from '~/db/mod.ts';

import {
  Alias,
  Character,
  CharacterRole,
  DisaggregatedCharacter,
  DisaggregatedMedia,
  Manifest,
  Media,
  MediaFormat,
  MediaRelation,
} from '~/src/types.ts';

import { NonFetalError } from '~/src/errors.ts';

import type { Pack } from '~/db/schema.ts';

const anilistManifest = _anilistManifest as Manifest;

const cachedGuilds: Record<string, {
  packs: Pack[];
  disables: Map<string, boolean>;
  builtinsDisabled?: boolean;
  excluded?: boolean;
}> = {};

const packs = {
  ensureId,
  aggregate,
  aliasToArray,
  all,
  findById,
  confirmDisableBuiltins,
  cachedGuilds,
  characters,
  aggregatedCharacters,
  disableBuiltins,
  formatToString,
  install,
  isDisabled,
  media,
  mediaCharacters,
  mediaToString,
  packEmbed,
  pages,
  _searchManyCharacters,
  _searchManyMedia,
  searchManyCharacters,
  searchManyMedia,
  searchOneCharacter,
  searchOneMedia,
  uninstall,
  uninstallDialog,
};

async function all(
  { guildId, filter }: { guildId: string; filter?: boolean },
): Promise<(Pack[])> {
  // deno-lint-ignore no-explicit-any
  const animePack = { manifest: anilistManifest, _id: '_' } as any as Pack;

  let cachedGuild = packs.cachedGuilds[guildId];

  if (!cachedGuild) {
    const guild = await db.getGuild(guildId);

    const _packs = guild.packs;

    cachedGuild = packs.cachedGuilds[guildId] = {
      packs: _packs,
      builtinsDisabled: guild.builtinsDisabled,
      excluded: guild.excluded,
      disables: new Map(),
    };

    _packs
      .forEach((pack) => {
        pack.manifest.conflicts?.forEach((id) => {
          cachedGuild.disables.set(id, true);
        });
      });
  }

  const _packs = cachedGuild.packs;

  if (!config.communityPacks) {
    if (filter || cachedGuild.builtinsDisabled) {
      return [];
    }

    return [animePack];
  }

  if (filter || cachedGuild.builtinsDisabled) {
    return _packs;
  }

  return [animePack, ..._packs];
}

function isDisabled(id: string, guildId: string): boolean {
  return packs.cachedGuilds[guildId]?.disables?.has(id);
}

function packEmbed(pack: Pack): discord.Embed {
  const embed = new discord.Embed()
    .setFooter({ text: pack.manifest.author })
    .setDescription(pack.manifest.description)
    .setThumbnail({
      url: pack.manifest.image,
      default: false,
      proxy: false,
    })
    .setTitle(pack.manifest.title ?? pack.manifest.id);

  return embed;
}

function uninstallDialog(
  { pack, userId }: { pack: Pack; userId: string },
): discord.Message {
  const locale = user.cachedUsers[userId]?.locale;

  const message = new discord.Message()
    .addEmbed(packEmbed(pack));

  return discord.Message.dialog({
    userId,
    message,
    type: 'uninstall',
    confirm: discord.join(pack.manifest.id, userId),
    description: i18n.get('uninstall-pack-confirmation', locale),
  });
}

async function pages(
  { userId, guildId }: { guildId: string; userId: string },
): Promise<discord.Message> {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  if (!config.communityPacks) {
    throw new NonFetalError(
      i18n.get('maintenance-packs', locale),
    );
  }

  const list = (await packs.all({ guildId })).toReversed();

  const embed = new discord.Embed();

  if (list.length) {
    embed.setDescription(
      list.map(({ manifest }, i) => {
        let s = `\`${manifest.id}\``;

        if (manifest.title) {
          s = `${manifest.title} | ${s}`;
        }

        return `${i + 1}. ${s}`;
      }).join('\n'),
    );
  } else {
    embed.setDescription(i18n.get('no-packs-installed', locale));
  }

  return new discord.Message().addEmbed(embed);
}

async function disableBuiltins(
  { userId, guildId }: { userId: string; guildId: string },
): Promise<discord.Message> {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  const embed = new discord.Embed();

  const guild = await db.getGuild(guildId);

  if (guild.builtinsDisabled) {
    embed
      .setDescription(i18n.get('disable-builtins-confirmed', locale));
    return new discord.Message().addEmbed(embed);
  }

  embed
    .setTitle(i18n.get('danger', locale))
    .setDescription(i18n.get('disable-builtins-confirmation', locale));

  return discord.Message.dialog({
    userId,
    message: new discord.Message().addEmbed(embed),
    confirm: ['disable-builtins', userId],
    locale,
  });
}

async function confirmDisableBuiltins(
  { userId, guildId }: { userId: string; guildId: string },
): Promise<discord.Message> {
  const locale = user.cachedUsers[userId]?.locale ??
    user.cachedGuilds[guildId]?.locale;

  const embed = new discord.Embed();

  await db.disableBuiltins(guildId);

  embed
    .setDescription(i18n.get('disable-builtins-confirmed', locale));

  return new discord.Message().addEmbed(embed);
}

async function install(
  { id, guildId, userId }: { id: string; guildId: string; userId: string },
): Promise<discord.Message> {
  const locale = user.cachedUsers[userId]?.locale;

  if (!config.communityPacks) {
    throw new NonFetalError(
      i18n.get('maintenance-packs', locale),
    );
  }

  const pack = await db.addPack(userId, guildId, id);

  if (!pack) {
    throw new Error('404');
  }

  // clear guild cache after uninstall
  delete cachedGuilds[guildId];

  const message = new discord.Message()
    .addEmbed(new discord.Embed().setDescription(
      i18n.get('installed', locale),
    ))
    .addEmbed(packEmbed(pack));

  return message;
}

async function uninstall(
  { guildId, userId, id }: { guildId: string; userId: string; id: string },
): Promise<discord.Message> {
  const locale = user.cachedUsers[userId]?.locale;

  if (!config.communityPacks) {
    throw new NonFetalError(
      i18n.get('maintenance-packs', locale),
    );
  }

  const pack = await db.removePack(guildId, id);

  if (!pack) {
    throw new Error('404');
  }

  // clear guild cache after uninstall
  delete cachedGuilds[guildId];

  const message = new discord.Message()
    .addEmbed(new discord.Embed().setDescription(
      i18n.get('uninstalled', locale),
    ))
    .addEmbed(
      new discord.Embed().setDescription(
        i18n.get('pack-characters-disabled', locale),
      ),
    )
    .addEmbed(packEmbed(pack));

  return message;
}

function parseId(
  literal: string,
  defaultPackId?: string,
): [string | undefined, string | undefined] {
  const split = /^([-_a-z0-9]+):([-_a-z0-9]+)$/.exec(literal);

  if (split?.length === 3) {
    const [, packId, id] = split;
    return [packId, id];
  } else if (defaultPackId && /^([-_a-z0-9]+)$/.test(literal)) {
    return [defaultPackId, literal];
  }

  return [undefined, undefined];
}

function ensureId(id: string, defaultPackId?: string): string {
  const valid = /^([-_a-z0-9]+):([-_a-z0-9]+)$/.test(id);

  if (!valid && defaultPackId && /^([-_a-z0-9]+)$/.test(id)) {
    return `${defaultPackId}:${id}`;
  }

  return id;
}

async function findById<T>(
  { key, ids, guildId, defaultPackId }: {
    key: 'media' | 'characters';
    ids: string[];
    guildId: string;
    defaultPackId?: string;
  },
): Promise<{ [key: string]: T }> {
  const anilistIds: string[] = [];

  const results: { [key: string]: T } = {};

  const list = await packs.all({ guildId });

  for (const literal of [...new Set(ids)]) {
    const [packId, id] = parseId(literal, defaultPackId);

    if (!packId || !id) {
      continue;
    }

    if (packId === 'anilist') {
      anilistIds.push(id);
    } else {
      const pack = list.find(({ manifest }) => manifest.id === packId);

      // search for the id in packs
      const match = (pack?.manifest[key]?.new as Array<
        DisaggregatedCharacter | DisaggregatedMedia
      >)?.find((m) => m.id === id);

      if (match) {
        results[literal] = (match.packId = packId, match) as T;
      }
    }
  }

  // if anilist pack is enabled
  // request the ids from anilist
  if (list.length && list[0]?.manifest.id === 'anilist') {
    const anilistResults = await _anilist[key](anilistIds);

    anilistIds.forEach((n) => {
      const i = anilistResults.findIndex((r) => `${r.id}` === `${n}`);

      if (i > -1) {
        results[`anilist:${n}`] = anilistResults[i] as T;
      }
    });
  }

  return results;
}

async function _searchManyCharacters(
  { search, guildId }: {
    search: string;
    guildId: string;
  },
): Promise<import('search-index').Character[]> {
  return await searchIndex.searchCharacters(search, guildId);
}

async function searchManyCharacters(
  { search, guildId }: {
    search: string;
    guildId: string;
  },
): Promise<(Character | DisaggregatedCharacter)[]> {
  const results = await _searchManyCharacters({
    search,
    guildId,
  });

  return Object.values(
    await packs.findById<Character | DisaggregatedCharacter>({
      ids: results.map((r) => r.id),
      key: 'characters',
      guildId,
    }),
  );
}

async function searchOneCharacter(
  { search, guildId }: {
    search: string;
    guildId: string;
  },
): Promise<Character | DisaggregatedCharacter | undefined> {
  const results = await _searchManyCharacters({
    search,
    guildId,
  });

  return Object.values(
    await packs.findById<Character | DisaggregatedCharacter>({
      ids: [results[0]?.id],
      key: 'characters',
      guildId,
    }),
  )[0];
}

async function _searchManyMedia(
  { search, guildId }: {
    search: string;
    guildId: string;
  },
): Promise<import('search-index').Media[]> {
  return await searchIndex.searchMedia(search, guildId);
}

async function searchManyMedia(
  { search, guildId }: {
    search: string;
    guildId: string;
  },
): Promise<(Media | DisaggregatedMedia)[]> {
  const results = await _searchManyMedia({
    search,
    guildId,
  });

  return Object.values(
    await packs.findById<Media | DisaggregatedMedia>({
      ids: results.map((r) => r.id),
      key: 'media',
      guildId,
    }),
  );
}

async function searchOneMedia(
  { search, guildId }: {
    search: string;
    guildId: string;
  },
): Promise<Media | DisaggregatedMedia | undefined> {
  const results = await _searchManyMedia({
    search,
    guildId,
  });

  return Object.values(
    await packs.findById<Media | DisaggregatedMedia>({
      ids: [results[0]?.id],
      key: 'media',
      guildId,
    }),
  )[0];
}

async function media({ ids, search, guildId }: {
  ids?: string[];
  search?: string;
  guildId: string;
}): Promise<(Media | DisaggregatedMedia)[]> {
  if (ids?.length) {
    // remove duplicates
    ids = Array.from(new Set(ids));

    const results = await packs.findById<Media | DisaggregatedMedia>(
      {
        ids,
        guildId,
        key: 'media',
      },
    );

    return Object.values(results);
  } else if (search) {
    const match = await packs.searchOneMedia(
      { search, guildId },
    );

    return match ? [match] : [];
  } else {
    return [];
  }
}

async function characters({ ids, search, guildId }: {
  ids?: string[];
  search?: string;
  guildId: string;
}): Promise<(Character | DisaggregatedCharacter)[]> {
  if (ids?.length) {
    // remove duplicates
    ids = Array.from(new Set(ids));

    const results = await packs.findById<Character | DisaggregatedCharacter>(
      {
        ids,
        guildId,
        key: 'characters',
      },
    );

    return Object.values(results);
  } else if (search) {
    const match = await packs.searchOneCharacter(
      { search, guildId },
    );

    return match ? [match] : [];
  } else {
    return [];
  }
}

async function aggregatedCharacters({ ids, search, guildId }: {
  ids?: string[];
  search?: string;
  guildId: string;
}): Promise<Character[]> {
  const characters = await packs.characters({ ids, search, guildId });

  const aggregatedCharacters = await Promise.all(
    characters.map((character) =>
      packs.aggregate<Character>({ character, guildId })
    ),
  );

  return aggregatedCharacters;
}

async function mediaCharacters({ id, search, guildId, index }: {
  id?: string;
  search?: string;
  guildId: string;
  index: number;
}): Promise<
  {
    media?: Media | DisaggregatedMedia;
    role?: CharacterRole;
    character?: DisaggregatedCharacter;
    total?: number;
    next: boolean;
  }
> {
  const results: (Media | DisaggregatedMedia)[] = await packs
    .media(id ? { guildId, ids: [id] } : { search, guildId });

  if (!results.length) {
    throw new Error('404');
  }

  const media = await aggregate<Media>({ guildId, media: results[0] });

  const total = media.characters?.edges?.length ?? 0;

  const character = media.characters?.edges?.[index];

  return {
    total,
    media,
    role: character?.role,
    character: character?.node as DisaggregatedCharacter,
    next: index + 1 < total,
  };
}

async function aggregate<T>({ media, character, start, end, guildId }: {
  media?: Media | DisaggregatedMedia;
  character?: Character | DisaggregatedCharacter;
  start?: number;
  end?: number;
  guildId: string;
}): Promise<T> {
  start = start || 0;

  if (end) {
    end = start + (end || 1);
  }

  if (media) {
    if (
      (media.relations && 'edges' in media.relations) ||
      (media.characters && 'edges' in media.characters)
    ) {
      // is already aggregated
      // doesn't need to be aggregated return as is
      return media as T;
    }

    media = media as DisaggregatedMedia;

    const mediaIds = (media.relations instanceof Array
      ? media.relations.slice(start, end)
      : [])
      .map(({ mediaId }) =>
        mediaId
      );

    const characterIds = (media.characters instanceof Array
      ? media.characters.slice(start, end)
      : [])
      .map((
        { characterId },
      ) => characterId);

    const [mediaRefs, characterRefs] = await Promise.all([
      packs.findById<Media>({
        guildId,
        key: 'media',
        ids: mediaIds,
        defaultPackId: media.packId,
      }),
      packs.findById<Character>({
        guildId,
        key: 'characters',
        ids: characterIds,
        defaultPackId: media.packId,
      }),
    ]);

    const t: Media = {
      ...media,
      relations: {
        edges: media.relations?.slice(start, end)
          ?.map(({ relation, mediaId }) => ({
            relation,
            node: mediaRefs[mediaId],
          })).filter(({ node }) => Boolean(node)) ?? [],
      },
      characters: {
        edges: media.characters?.slice(start, end)
          ?.map(({ role, characterId }) => ({
            role,
            node: characterRefs[characterId],
          })).filter(({ node }) => Boolean(node)) ?? [],
      },
    };

    return t as T;
  } else if (character) {
    if (character.media && 'edges' in character.media) {
      // is anilist media or already aggregated
      // doesn't need to be aggregated return as is
      return character as T;
    }

    character = character as DisaggregatedCharacter;

    const mediaIds = (character.media instanceof Array
      ? character.media.slice(start, end)
      : [])
      .map(({ mediaId }) =>
        mediaId
      );

    const [mediaRefs] = [
      await packs.findById<Media>({
        guildId,
        key: 'media',
        ids: mediaIds,
        defaultPackId: character.packId,
      }),
    ];

    const t: Character = {
      ...character,
      media: {
        edges: character.media?.slice(start, end)
          ?.map(({ role, mediaId }) => ({
            role,
            node: mediaRefs[mediaId],
          })).filter(({ node }) => Boolean(node)) ?? [],
      },
    };

    return t as T;
  }

  throw new Error();
}

function aliasToArray(
  alias: Alias,
  max?: number,
): string[] {
  const set = new Set(
    [
      alias.english,
      alias.romaji,
      alias.native,
    ]
      .concat(alias.alternative ?? [])
      .filter(utils.nonNullable)
      .map((str) => max ? utils.truncate(str, max) : str),
  );

  return Array.from(set) as string[];
}

function formatToString(format?: MediaFormat): string {
  if (!format || format === MediaFormat.Music) {
    return '';
  }

  return utils.capitalize(
    format
      .replace(/TV_SHORT|OVA|ONA/, 'Short')
      .replace('VIDEO_GAME', 'Video Game')
      .replace('TV', 'Anime'),
  ) as string;
}

function mediaToString(
  { media, relation }: {
    media: Media | DisaggregatedMedia;
    relation?: MediaRelation;
  },
): string {
  const title = packs.aliasToArray(media.title, 40)[0];

  switch (relation) {
    case MediaRelation.Prequel:
    case MediaRelation.Sequel:
    case MediaRelation.SpinOff:
    case MediaRelation.SideStory:
      return [title, `(${utils.capitalize(relation)})`].join(' ');
    default: {
      const format = formatToString(media.format);

      if (!format) {
        return title;
      }

      return [title, `(${format})`].join(' ');
    }
  }
}

export default packs;
