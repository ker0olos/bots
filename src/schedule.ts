import { titlesToArray } from './utils.ts';

import { STATUS } from './interface.ts';

import * as discord from './discord.ts';

import * as anilist from '../repos/anilist/index.ts';

export async function nextEpisode({ search }: { search: string }) {
  const anime = await anilist.getNextAiring({ search });

  const titles = titlesToArray(anime);

  const message = new discord.Message();

  switch (anime.status) {
    case STATUS.RELEASING:
      message.setContent(
        `The next episode of \`${titles.shift()}\` is <t:${
          anime.nextAiringEpisode!.airingAt
        }:R>.`,
      );
      break;
    case STATUS.NOT_YET_RELEASED:
      message.setContent(
        `\`${titles.shift()}\` is coming soon.`,
      );
      break;
    case STATUS.HIATUS:
      message.setContent(
        `\`${titles.shift()}\` is taking a short break.`,
      );
      break;
    case STATUS.FINISHED:
    case STATUS.CANCELLED:
      message.setContent(
        `Unfortunately, \`${titles.shift()}\` has already aired its final episode.`,
      );
      break;
    default:
      throw new Error('404');
  }

  return message;
}
