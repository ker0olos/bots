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

  // aggregate the media by populating any references to other media/character objects
  const media = await packs.aggregate<Media>({ media: results[0] });

  const titles = packs.titlesToArray(media);

  const message = new discord.Message();

  message.addEmbed(
    new discord.Embed()
      .setTitle(titles.shift()!)
      .setAuthor({ name: utils.capitalize(media.type!)! })
      .setDescription(media.description)
      .setColor(media.coverImage?.color)
      .setImage({
        default: true,
        url: packs.imagesToArray(media.coverImage, 'large-first')?.[0],
      })
      .setFooter({
        text: titles.length > 0 ? media.title!.native : undefined,
      }),
  );

  media.characters?.edges!.slice(0, 2).forEach((character) => {
    const embed = new discord.Embed()
      .setTitle(character.node!.name!.full)
      .setDescription(character.node!.description)
      .setColor(character.node.image?.color ?? media?.coverImage?.color)
      .setThumbnail({
        default: true,
        url: packs.imagesToArray(character.node.image, 'small-first')?.[0],
      })
      .setFooter(
        {
          text: [
            utils.capitalize(character.node!.gender!),
            character.node!.age,
          ].filter(Boolean).join(', '),
        },
      );

    message.addEmbed(embed);
  });

  const mainGroup: discord.Component[] = [];
  const secondaryGroup: discord.Component[] = [];
  const additionalGroup: discord.Component[] = [];

  if (media.trailer?.site === 'youtube') {
    const component = new discord.Component()
      .setUrl(`https://youtu.be/${media.trailer?.id}`)
      .setLabel('Trailer');

    mainGroup.push(component);
  }

  media.externalLinks?.forEach((link) => {
    if (
      !['youtube', 'crunchyroll', 'official site', 'webtoon'].includes(
        link.site.toLowerCase(),
      )
    ) {
      return;
    }

    const component = new discord.Component()
      .setLabel(link.site)
      .setUrl(link.url);

    mainGroup.push(component);
  });

  media.relations?.edges.forEach((relation) => {
    const component = new discord.Component();

    const label = packs.titlesToArray(relation.node, 60)[0];

    switch (relation.relationType) {
      case MediaRelation.Prequel:
      case MediaRelation.Parent:
      case MediaRelation.Contains:
      case MediaRelation.Sequel:
      case MediaRelation.SideStory:
      case MediaRelation.SpinOff: {
        component
          .setLabel(`${label} (${utils.capitalize(relation.relationType!)})`)
          .setId(discord.join('media', `${media.packId}:${relation.node.id!}`));

        secondaryGroup.push(component);
        break;
      }
      case MediaRelation.Adaptation: {
        component
          .setLabel(`${label} (${utils.capitalize(relation.node.type!)})`)
          .setId(discord.join('media', `${media.packId}:${relation.node.id!}`));

        secondaryGroup.push(component);
        break;
      }
      default:
        break;
    }

    switch (relation.node.format) {
      case MediaFormat.Music: {
        if (relation.node.externalLinks?.[0]?.url) {
          component
            .setLabel(label)
            .setUrl(relation.node.externalLinks[0].url);

          additionalGroup.push(component);
        }
        break;
      }
      default:
        break;
    }
  });

  message.addComponents(mainGroup);
  message.addComponents(secondaryGroup);
  message.addComponents(additionalGroup);

  return message;
}

function disaggregatedMediaDebugEmbed(media: Media | DisaggregatedMedia) {
  const titles = packs.titlesToArray(media);

  return new discord.Embed()
    .setTitle(titles.shift()!)
    .setDescription(titles.join('\n'))
    .setColor(media.coverImage?.color)
    .setThumbnail({
      default: true,
      url: packs.imagesToArray(media.coverImage, 'small-first')?.[0],
    })
    .addField({ name: 'Id', value: `${media.packId}:${media.id}` })
    .addField({
      name: 'Type',
      value: `${utils.capitalize(media.type!)}`,
      inline: true,
    })
    .addField({
      name: 'Format',
      value: `${utils.capitalize(media.format!)}`,
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
    .addEmbed(
      new discord.Embed()
        .setTitle(character.name!.full)
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
              character!.age,
            ].filter(Boolean).join(', '),
          },
        ),
    );

  const group: discord.Component[] = [];

  character.media?.edges?.forEach((relation) => {
    const label = packs.titlesToArray(relation.node, 60)[0];

    const component = new discord.Component()
      .setLabel(`${label} (${utils.capitalize(relation.node.format!)})`)
      .setId(discord.join('media', `${character.packId}:${relation.node.id!}`));

    group.push(component);
  });

  message.addComponents(group);

  return message;
}

function characterDebugEmbed(character: Character) {
  const media = character.media?.edges?.[0];

  const role = media?.characterRole;
  const popularity = character.popularity || media?.node.popularity || 0;

  const rating = new Rating({
    popularity,
    role: character.popularity ? undefined : role,
  });

  const embed = new discord.Embed()
    .setTitle(character.name!.full)
    .setDescription(character.name!.alternative?.join('\n'))
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
export async function themes(
  { search }: {
    search?: string;
  },
) {
  const results = await packs.media({ search });

  if (!results.length) {
    throw new Error('404');
  }

  // aggregate the media by populating any references to other media/character objects
  const media = await packs.aggregate<Media>({ media: results[0] });

  const message = new discord.Message();

  media.relations?.edges.forEach((relation) => {
    if (
      relation.node.format === MediaFormat.Music &&
      relation.node.externalLinks?.[0]?.url
    ) {
      const component = new discord.Component()
        .setLabel(
          (relation.node.title!.english || relation.node.title!.romaji ||
            relation.node.title!.native)!,
        )
        .setUrl(relation.node.externalLinks[0].url);

      message.addComponents([component]);
    }
  });

  if (message.componentsCount() <= 0) {
    throw new Error('404');
  }

  return message;
}
