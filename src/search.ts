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

const musicUrlRegex = /youtube|youtu\.be|spotify/i;

const externalLinksRegex =
  /youtube|crunchyroll|official site|tapas|webtoon|amazon/i;

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

  if (debug) {
    return new discord.Message().addEmbed(
      disaggregatedMediaDebugEmbed(results[0]),
    );
  }

  const message = new discord.Message();

  // aggregate the media by populating any references to other media/character objects
  const media = await packs.aggregate<Media>({ media: results[0] });

  const titles = packs.aliasToArray(media.title);

  const title = titles.shift();

  if (!title) {
    throw new Error('404');
  }

  message.addEmbed(
    new discord.Embed()
      .setTitle(title)
      .setAuthor({ name: packs.formatToString(media.format) })
      .setDescription(media.description)
      .setColor(media.coverImage?.color)
      .setImage({
        default: true,
        url: packs.imagesToArray(media.coverImage, 'large-first')?.[0],
      })
      .setFooter({
        text: title !== media.title.native ? media.title.native : undefined,
      }),
  );

  packs.sortCharacters(media.characters?.edges)
    ?.slice(0, 2)
    .forEach((edge) => {
      const alias = packs.aliasToArray(edge.node.name);

      const embed = new discord.Embed()
        .setTitle(alias[0])
        .setDescription(edge.node.description)
        .setColor(edge.node.image?.color ?? media?.coverImage?.color)
        .setThumbnail({
          default: true,
          url: packs.imagesToArray(edge.node.image, 'small-first')?.[0],
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

  const linksGroup: discord.Component[] = [];
  const musicGroup: discord.Component[] = [];

  if (media.trailer?.site === 'youtube') {
    const component = new discord.Component()
      .setUrl(`https://youtu.be/${media.trailer?.id}`)
      .setLabel('Trailer');

    linksGroup.push(component);
  }

  media.externalLinks?.forEach((link) => {
    if (!externalLinksRegex.test(link.site)) {
      return;
    }

    const component = new discord.Component()
      .setLabel(link.site)
      .setUrl(link.url);

    linksGroup.push(component);
  });

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
          .setId(discord.join('media', `${media.packId}:${media.id}`));

        linksGroup.push(component);
      }
    });

  return message.addComponents([...linksGroup, ...musicGroup]);
}

function disaggregatedMediaDebugEmbed(
  media: Media | DisaggregatedMedia,
): discord.Embed {
  const titles = packs.aliasToArray(media.title);

  return new discord.Embed()
    .setTitle(titles.shift())
    .setDescription(titles.join('\n'))
    .setColor(media.coverImage?.color)
    .setThumbnail({
      default: true,
      url: packs.imagesToArray(media.coverImage, 'small-first')?.[0],
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

  const alias = packs.aliasToArray(character.name);

  const message = new discord.Message()
    .addEmbed(
      new discord.Embed()
        .setTitle(alias[0])
        .setDescription(character.description)
        .setColor(character.image?.color)
        .setImage({
          default: true,
          url: packs.imagesToArray(character.image, 'large-first')?.[0],
        })
        .setFooter(
          {
            text: [
              utils.capitalize(character.gender),
              character.age,
            ].filter(Boolean).join(', '),
          },
        ),
    );

  const group: discord.Component[] = [];

  packs.sortMedia(character.media?.edges)
    ?.forEach(({ node: media }) => {
      const label = packs.mediaToString({ media });

      const component = new discord.Component()
        .setLabel(label)
        .setId(
          discord.join('media', `${character.packId}:${media.id}`),
        );

      group.push(component);
    });

  return message.addComponents(group);
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
    .setColor(character.image?.color)
    .setThumbnail({
      default: true,
      url: packs.imagesToArray(character.image, 'small-first')?.[0],
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
