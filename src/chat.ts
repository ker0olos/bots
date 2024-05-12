import packs from '~/src/packs.ts';

import utils from '~/src/utils.ts';

import _user from '~/src/user.ts';

import * as discord from '~/src/discord.ts';

import config from '~/src/config.ts';

import db from '~/db/mod.ts';

import { default as srch } from '~/src/search.ts';

import i18n from '~/src/i18n.ts';

import { NonFetalError } from '~/src/errors.ts';

import type { Character } from '~/src/types.ts';

const ACCOUNT_ID = Deno.env.get('CF_ACCOUNT_ID');
const API_TOKEN = Deno.env.get('CF_AI_TOKEN');

type ScopedPrompt = { role: 'system' | 'user' | 'assistant'; content: string };

type Bubble = {
  name: string;
  imageUrl?: string;
  message: string;
  user: boolean;
};

type Prompt = {
  messages: ScopedPrompt[];
};

enum LLM_MODEL {
  LLAMA3 = '@cf/meta/llama-3-8b-instruct',
  // LLAMA2 = '@cf/meta/llama-2-7b-chat-int8',
  // MISTRAL = '@hf/mistral/mistral-7b-instruct-v0.2',
  // GEMMA = '@hf/google/gemma-7b-it',
  // SUM = '@cf/facebook/bart-large-cnn',
}

const regex = /"response":"([^"]*)"/;

const getSkeleton = (): string => {
  const min = 2, max = 5;

  return Array(Math.floor(Math.random() * (max - min + 1)) + min)
    .fill(discord.emotes.skeleton)
    .join('');
};

async function runLLM(
  model: LLM_MODEL,
  input: Prompt,
  callback: (chunk: string, finished: boolean) => Promise<void>,
): Promise<void> {
  const response = await utils.fetchWithRetry(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`,
    {
      method: 'POST',
      headers: { 'authorization': `Bearer ${API_TOKEN}` },
      body: JSON.stringify({
        raw: true,
        stream: true,
        max_tokens: 256,
        ...input,
      }),
    },
  );

  const stream = response.body;

  if (!response.ok || !stream) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const chunks: string[] = [];

  for await (const chunk of stream) {
    const chunkString = new TextDecoder().decode(chunk);

    try {
      const data = JSON.parse(chunkString.substring(6)).response as string;

      chunks.push(data);
    } catch {
      // WORKAROUND sometimes cloudflare responds with invalid jsons
      const match = chunkString.match(regex);

      if (!match) {
        continue;
      }

      chunks.push(match[1]);
    }

    // callback the new text in chunks of 8 to avoid discord rate limits
    if (chunks.length >= 8) {
      await callback(chunks.join(''), false);
      chunks.length = 0;
    }
  }

  await callback(chunks.join(''), true);
}

function run(
  { token, guildId, member, search, id, message: userMessage }: {
    token: string;
    member: discord.Member;
    guildId: string;
    id?: string;
    search?: string;
    message: string;
    continue?: boolean;
  },
): discord.Message {
  const user = member.user;

  const locale = _user.cachedUsers[user.id]?.locale ??
    _user.cachedGuilds[guildId]?.locale;

  if (!config.chat) {
    throw new NonFetalError(
      i18n.get('maintenance-chat', locale),
    );
  }

  packs
    .characters(id ? { ids: [id], guildId } : { search, guildId })
    .then((results) => {
      if (!results.length) {
        throw new Error('404');
      }

      return Promise.all([
        // aggregate the media by populating any references to other media/character objects
        packs.aggregate<Character>({ guildId, character: results[0], end: 1 }),
        db.findCharacter(guildId, `${results[0].packId}:${results[0].id}`),
      ]);
    })
    .then(async ([character, existing]) => {
      // const characterId = `${character.packId}:${character.id}`;

      const media = character.media?.edges?.[0]?.node;

      if (
        (
          existing &&
          packs.isDisabled(existing.mediaId, guildId)
        ) ||
        (
          media &&
          packs.isDisabled(`${media.packId}:${media.id}`, guildId)
        )
      ) {
        throw new Error('404');
      }

      if (!existing || existing.userId !== user.id) {
        const message = new discord.Message();

        const embed = srch.characterEmbed(character, {
          description: true,
          footer: true,
          rating: false,
          media: { title: true },
          mode: 'thumbnail',
          userId: existing?.userId,
          existing: { rating: existing?.rating },
        });

        return await message
          .addEmbed(new discord.Embed().setDescription(
            i18n.get('chat-not-owned', locale),
          ))
          .addEmbed(embed)
          .patch(token);
      }

      const mediaTitle = media?.title
        ? packs.aliasToArray(media.title)[0]
        : undefined;

      const userName = user.display_name ?? user.global_name ?? user.username;
      const userImage = discord.getAvatar(member, guildId);

      const characterName = existing?.nickname ??
        packs.aliasToArray(character.name)[0];

      const characterImageUrl = existing?.image
        ? existing?.image
        : character.images?.[0]?.url;

      // const characterImage = await utils.proxy(
      //   characterImageUrl,
      //   ImageSize.Preview,
      // );

      let characterMessage = '';

      const characterData = [
        mediaTitle
          ? `You are ${characterName} from ${mediaTitle}`
          : `You are ${characterName}`,
        character.gender ? `You gender is ${character.gender}` : undefined,
        character.age ? `You age is ${character.age}` : undefined,
        character.description
          ? `Here is a small description about ${characterName}: ${character.description}`
          : undefined,
      ]
        .filter(utils.nonNullable)
        .join(' - ');

      const message = new discord.Message();

      const history = (await db.addChatMessage({
        guildId,
        userId: member.user.id,
        characterId: existing.characterId,
        role: 'user',
        content: userMessage,
      }))?.messages.slice(-10) ?? [];

      await chat.runLLM(LLM_MODEL.LLAMA3, {
        messages: [
          {
            role: 'system',
            content:
              `[INST]${characterData}; You are having a conversation with ${userName}, who is a stranger to you. Stay in your character as ${characterName}. Don't use emojis in your responses[/INST]`,
          },
          ...history,
          { role: 'user', content: userMessage },
        ],
      }, async (s, finished) => {
        characterMessage += s.replaceAll('\\n', '\n');
        characterMessage.trimStart();

        message.clearEmbeds();

        const bubbles: Bubble[] = [
          ...history.map(({ role, content }) => ({
            user: role === 'user',
            name: role === 'user' ? userName : characterName,
            imageUrl: role === 'user' ? userImage : characterImageUrl,
            message: content,
          })),
          {
            user: true,
            name: userName,
            imageUrl: userImage,
            message: userMessage,
          },
          {
            user: false,
            name: characterName,
            imageUrl: characterImageUrl,
            message: `${characterMessage}${finished ? '' : getSkeleton()}`,
          },
        ];

        for (const bubble of bubbles.slice(-5)) {
          const embed = new discord.Embed()
            .setAuthor({ name: bubble.name, icon_url: bubble.imageUrl })
            .setDescription(bubble.message);

          message.addEmbed(embed);
        }

        if (finished) {
          await db.addChatMessage({
            guildId,
            userId: member.user.id,
            characterId: existing.characterId,
            role: 'assistant',
            content: characterMessage,
          });

          message.addComponents([
            new discord.Component()
              .setId(
                'reply',
                user.id,
                `${character.packId}:${character.id}`,
                characterName,
              )
              .setLabel(i18n.get('reply', locale)),
          ]);
        }

        await message.patch(token);
      });
    })
    .catch(async (err) => {
      if (err.message === '404') {
        return await new discord.Message()
          .addEmbed(
            new discord.Embed().setDescription(
              i18n.get('found-nothing', locale),
            ),
          ).patch(token);
      }

      if (!config.sentry) {
        throw err;
      }

      const refId = utils.captureException(err);

      await discord.Message.internal(refId).patch(token);
    });

  return discord.Message.spinner(true);
}

const chat = { run, runLLM };

export default chat;
