import utils from './utils.ts';

import Rating from './rating.ts';

import {
  Character,
  DisaggregatedCharacter,
  DisaggregatedMedia,
  Media,
  MediaFormat,
  MediaRelation,
  MediaType,
} from './types.ts';

import packs from './packs.ts';

import * as discord from './discord.ts';

const musicUrlRegex = /youtube|spotify/;

export async function media(
  { id, type, search, debug }: {
    id?: string;
    type?: MediaType;
    search?: string;
    debug?: boolean;
  },
): Promise<discord.Message> {
  const results: (Media | DisaggregatedMedia)[] = await packs.media(
    id ? { ids: [id] } : { search, type },
  );

  if (!results.length) {
    throw new Error('404');
  }

  // aggregate the media by populating any references to other media/characters
  const media = await packs.aggregate<Media>({ media: results[0] });

  const titles = packs.aliasToArray(media.title);

  if (!titles?.length) {
    throw new Error('404');
  }

  if (debug) {
    return new discord.Message().addEmbed(
      mediaDebugEmbed(media),
    );
  }

  const linksGroup: discord.Component[] = [];
  const musicGroup: discord.Component[] = [];

  // main media embed
  const message = new discord.Message().addEmbed(
    mediaEmbed(media, titles),
  );

  // character embeds
  packs.sortCharacters(media.characters?.edges)
    ?.slice(0, 2)
    .forEach((edge) => {
      const alias = packs.aliasToArray(edge.node.name);

      const embed = new discord.Embed()
        .setTitle(alias[0])
        .setDescription(edge.node.description)
        .setColor(media.image?.featured.color)
        .setThumbnail({
          default: true,
          url: edge.node.image?.featured.url,
        })
        .setFooter(
          {
            text: [
              utils.capitalize(edge.node.gender),
              edge.node.age,
            ].filter(Boolean).join(', '),
          },
        );

      message.addEmbed(embed);
    });

  if (media.trailer?.site === 'youtube') {
    const component = new discord.Component()
      .setUrl(`https://youtu.be/${media.trailer?.id}`)
      .setLabel('Trailer');

    linksGroup.push(component);
  }

  // link components
  media.externalLinks
    ?.forEach((link) => {
      const component = new discord.Component()
        .setLabel(link.site)
        .setUrl(link.url);

      linksGroup.push(component);
    });

  // view characters
  if (media?.characters?.edges.length) {
    linksGroup.push(
      new discord.Component().setLabel('View Characters').setId(
        'characters',
        `${media.packId}:${media.id}`,
        '0',
      ),
    );
  }

  // relation components
  packs.sortMedia(media.relations?.edges)
    ?.slice(0, 4)
    ?.forEach(({ node: media, relation }) => {
      const label = packs.mediaToString({
        media,
        relation,
      });

      // music links
      if (
        relation === MediaRelation.Other && media.format === MediaFormat.Music
      ) {
        if (
          musicGroup.length < 3 &&
          media.externalLinks?.[0]?.url &&
          musicUrlRegex.test(media.externalLinks?.[0]?.url)
        ) {
          const component = new discord.Component()
            .setLabel(label)
            .setUrl(media.externalLinks[0].url);

          musicGroup.push(component);
        }
        // relations buttons
      } else {
        const component = new discord.Component()
          .setLabel(label)
          .setId('media', `${media.packId}:${media.id}`);

        linksGroup.push(component);
      }
    });

  return message.addComponents([...linksGroup, ...musicGroup]);
}

export function mediaEmbed(media: Media, titles: string[]): discord.Embed {
  return new discord.Embed()
    .setTitle(titles[0])
    .setAuthor({ name: packs.formatToString(media.format) })
    .setDescription(media.description)
    .setColor(media.image?.featured.color)
    .setImage({
      default: true,
      url: media.image?.featured.url,
    })
    .setFooter({
      text: titles[0] !== media.title.native ? media.title.native : undefined,
    });
}

function mediaDebugEmbed(
  media: Media | DisaggregatedMedia,
): discord.Embed {
  const titles = packs.aliasToArray(media.title);

  return new discord.Embed()
    .setTitle(titles.shift())
    .setDescription(titles.join('\n'))
    .setColor(media.image?.featured.color)
    .setThumbnail({
      default: true,
      url: media.image?.featured.url,
    })
    .addField({ name: 'Id', value: `${media.packId}:${media.id}` })
    .addField({
      name: 'Type',
      value: `${utils.capitalize(media.type)}`,
      inline: true,
    })
    .addField({
      name: 'Format',
      value: `${utils.capitalize(media.format)}`,
      inline: true,
    })
    .addField({
      name: 'Popularity',
      value: `${utils.comma(media.popularity || 0)}`,
      inline: true,
    });
}

export async function character(
  { id, search, debug }: {
    id?: string;
    search?: string;
    debug?: boolean;
  },
): Promise<discord.Message> {
  const results: (Character | DisaggregatedCharacter)[] = await packs
    .characters(
      id ? { ids: [id] } : { search },
    );

  if (!results.length) {
    throw new Error('404');
  }

  // aggregate the media by populating any references to other media/character objects
  const character = await packs.aggregate<Character>({ character: results[0] });

  if (debug) {
    return new discord.Message().addEmbed(characterDebugEmbed(character));
  }

  const message = new discord.Message()
    .addEmbed(characterEmbed(character));

  const group: discord.Component[] = [];

  character.externalLinks
    ?.forEach((link) => {
      const component = new discord.Component()
        .setLabel(link.site)
        .setUrl(link.url);

      group.push(component);
    });

  packs.sortMedia(character.media?.edges)
    ?.slice(0, 4)
    ?.forEach(({ node: media }) => {
      const label = packs.mediaToString({ media });

      const component = new discord.Component()
        .setLabel(label)
        .setId('media', `${character.packId}:${media.id}`);

      group.push(component);
    });

  return message.addComponents(group);
}

export function characterEmbed(character: Character): discord.Embed {
  const alias = packs.aliasToArray(character.name);

  return new discord.Embed()
    .setTitle(alias[0])
    .setDescription(character.description)
    .setColor(character.image?.featured.color)
    .setImage({
      default: true,
      url: character.image?.featured.url,
    })
    .setFooter(
      {
        text: [
          utils.capitalize(character.gender),
          character.age,
        ].filter(Boolean).join(', '),
      },
    );
}

function characterDebugEmbed(character: Character): discord.Embed {
  const media = character.media?.edges?.[0];

  const role = media?.role;
  const popularity = character.popularity || media?.node.popularity || 0;

  const rating = new Rating({
    popularity,
    role: character.popularity ? undefined : role,
  });

  const titles = packs.aliasToArray(character.name);

  const embed = new discord.Embed()
    .setTitle(titles.splice(0, 1)[0])
    .setDescription(titles.join('\n'))
    .setColor(character.image?.featured.color)
    .setThumbnail({
      default: true,
      url: character.image?.featured.url,
    })
    .addField({ name: 'Id', value: `${character.packId}:${character.id}` })
    .addField({
      name: 'Rating',
      value: rating.emotes,
    })
    .addField({
      name: 'Gender',
      value: `${character.gender}`,
      inline: true,
    })
    .addField({ name: 'Age', value: `${character.age}`, inline: true })
    .addField({ name: 'Media', value: `${media?.node.id}`, inline: true })
    .addField({
      name: 'Role',
      value: `${utils.capitalize(role)}`,
      inline: true,
    })
    .addField({
      name: 'Popularity',
      value: `${utils.comma(popularity)}`,
      inline: true,
    });

  if (!media) {
    embed.addField({
      name: '**WARN**',
      value:
        'Character not available in gacha.\nAdd at least one media to the character.',
    });
  }

  return embed;
}

export async function music(
  { search }: {
    search?: string;
  },
): Promise<discord.Message> {
  const results = await packs.media({ search });

  if (!results.length) {
    throw new Error('404');
  }

  const message = new discord.Message();

  // aggregate the media by populating any references to other media/character objects
  const media = await packs.aggregate<Media>({ media: results[0] });

  const group: discord.Component[] = [];

  packs.sortMedia(media.relations?.edges)
    ?.forEach((edge) => {
      if (
        edge.relation === MediaRelation.Other &&
        edge.node.format === MediaFormat.Music &&
        edge.node.externalLinks?.[0]?.url &&
        musicUrlRegex.test(edge.node.externalLinks?.[0]?.url)
      ) {
        const label = packs.mediaToString({ media: edge.node });

        const component = new discord.Component()
          .setLabel(label)
          .setUrl(edge.node.externalLinks[0].url);

        group.push(component);
      }
    });

  if (group.length <= 0) {
    throw new Error('404');
  }

  return message.addComponents(group);
}
