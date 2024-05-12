// deno-lint-ignore-file no-explicit-any

import { assertEquals, assertThrows } from '$std/assert/mod.ts';

import { stub } from '$std/testing/mock.ts';

import { FakeTime } from '$std/testing/time.ts';

import utils from '~/src/utils.ts';

import chat from '~/src/chat.ts';
import packs from '~/src/packs.ts';
import config from '~/src/config.ts';

import db from '~/db/mod.ts';

import { NonFetalError } from '~/src/errors.ts';

import type { DisaggregatedCharacter } from '~/src/types.ts';

Deno.test('/chat', async (test) => {
  await test.step('normal', async () => {
    const character: DisaggregatedCharacter = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      popularity: 1000,
      age: '420',
      gender: 'male',
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const searchStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => Promise.resolve({ rating: 5, userId: 'user_id' } as any),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const chatStub = stub(chat, 'runLLM', (_, __, callback) => {
      callback('t', true);
      return Promise.resolve();
    });

    const addChatMessageStub = stub(
      db,
      'addChatMessage',
      () => Promise.resolve(null),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.chat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = chat.run({
        token: 'test_token',
        member: {
          user: {
            id: 'user_id',
            avatar: 'avatar_id',
            display_name: 'username',
          },
        } as any,
        guildId: 'guild_id',
        search: 'full name',
        message: 'test message',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner3.gif',
            },
          }],
        },
      });

      await timeStub.runMicrotasks();

      assertEquals(
        fetchStub.calls[0].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[0].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[0].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          attachments: [],
          components: [
            {
              type: 1,
              components: [{
                custom_id: 'reply=user_id=pack-id:1=full name',
                label: 'Reply',
                style: 2,
                type: 2,
              }],
            },
          ],
          embeds: [
            {
              type: 'rich',
              author: {
                icon_url:
                  'https://cdn.discordapp.com/avatars/user_id/avatar_id.png',
                name: 'username',
              },
              description: 'test message',
            },
            {
              type: 'rich',
              author: {
                icon_url: 'image_url',
                name: 'full name',
              },
              description: 't',
            },
          ],
        },
      );
    } finally {
      delete config.chat;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
      chatStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
      addChatMessageStub.restore();
    }
  });

  await test.step('with some history', async () => {
    const character: DisaggregatedCharacter = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      popularity: 1000,
      age: '420',
      gender: 'male',
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const searchStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => Promise.resolve({ rating: 5, userId: 'user_id' } as any),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const chatStub = stub(chat, 'runLLM', (_, __, callback) => {
      callback('t', true);
      return Promise.resolve();
    });

    const addChatMessageStub = stub(
      db,
      'addChatMessage',
      () =>
        Promise.resolve({
          messages: [
            { role: 'user', content: 'hello' },
            { role: 'assistant', content: 'hi hello' },
          ],
        } as any),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.chat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = chat.run({
        token: 'test_token',
        member: {
          user: {
            id: 'user_id',
            avatar: 'avatar_id',
            display_name: 'username',
          },
        } as any,
        guildId: 'guild_id',
        search: 'full name',
        message: 'test message',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner3.gif',
            },
          }],
        },
      });

      await timeStub.runMicrotasks();

      assertEquals(
        fetchStub.calls[0].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[0].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[0].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          attachments: [],
          components: [
            {
              type: 1,
              components: [{
                custom_id: 'reply=user_id=pack-id:1=full name',
                label: 'Reply',
                style: 2,
                type: 2,
              }],
            },
          ],
          embeds: [
            {
              type: 'rich',
              author: {
                icon_url:
                  'https://cdn.discordapp.com/avatars/user_id/avatar_id.png',
                name: 'username',
              },
              description: 'hello',
            },
            {
              type: 'rich',
              author: {
                icon_url: 'image_url',
                name: 'full name',
              },
              description: 'hi hello',
            },
            {
              type: 'rich',
              author: {
                icon_url:
                  'https://cdn.discordapp.com/avatars/user_id/avatar_id.png',
                name: 'username',
              },
              description: 'test message',
            },
            {
              type: 'rich',
              author: {
                icon_url: 'image_url',
                name: 'full name',
              },
              description: 't',
            },
          ],
        },
      );
    } finally {
      delete config.chat;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
      chatStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
      addChatMessageStub.restore();
    }
  });

  await test.step('disabled media', async () => {
    const character: DisaggregatedCharacter = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      popularity: 1000,
      age: '420',
      gender: 'male',
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const searchStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => Promise.resolve({ rating: 5, userId: 'user_id' } as any),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => true as any);

    config.chat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = chat.run({
        token: 'test_token',
        member: {
          user: {
            id: 'user_id',
            avatar: 'avatar_id',
            display_name: 'username',
          },
        } as any,
        guildId: 'guild_id',
        search: 'full name',
        message: 'test message',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner3.gif',
            },
          }],
        },
      });

      await timeStub.runMicrotasks();

      assertEquals(
        fetchStub.calls[0].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[0].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[0].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          components: [],
          attachments: [],
          embeds: [{
            type: 'rich',
            description: 'Found _nothing_ matching that query!',
          }],
        },
      );
    } finally {
      delete config.chat;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('not owned', async () => {
    const character: DisaggregatedCharacter = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      popularity: 1_000_000,
      age: '420',
      gender: 'male',
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const searchStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        Promise.resolve({
          rating: 4,
          userId: 'another_user_id',
        } as any),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.chat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = chat.run({
        token: 'test_token',
        member: {
          user: {
            id: 'user_id',
            avatar: 'avatar_id',
            display_name: 'username',
          },
        } as any,
        guildId: 'guild_id',
        search: 'full name',
        message: 'test message',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner3.gif',
            },
          }],
        },
      });

      await timeStub.runMicrotasks();

      assertEquals(
        fetchStub.calls[0].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[0].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[0].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          components: [],
          attachments: [],
          embeds: [
            {
              type: 'rich',
              description: "**You can't chat with a character you don't own!**",
            },
            {
              type: 'rich',
              description: '<@another_user_id>',
              fields: [
                {
                  name: 'full name',
                  value: 'long description',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              footer: {
                text: 'Male, 420',
              },
            },
          ],
        },
      );
    } finally {
      delete config.chat;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('not found', async () => {
    const timeStub = new FakeTime();

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => undefined as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const searchStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(undefined),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.chat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = chat.run({
        token: 'test_token',
        member: {
          user: {
            id: 'user_id',
            avatar: 'avatar_id',
            display_name: 'username',
          },
        } as any,
        guildId: 'guild_id',
        search: 'x'.repeat(100),
        message: 'test message',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner3.gif',
            },
          }],
        },
      });

      await timeStub.runMicrotasks();

      assertEquals(
        fetchStub.calls[0].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[0].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[0].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            description: 'Found _nothing_ matching that query!',
          }],
        },
      );
    } finally {
      delete config.chat;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('under maintenance', () => {
    config.chat = false;

    try {
      assertThrows(
        () =>
          chat.run({
            token: 'test_token',
            member: {
              user: {
                id: 'user_id',
                avatar: 'avatar_id',
                display_name: 'username',
              },
            } as any,
            guildId: 'guild_id',
            search: 'full name',
            message: 'test message',
          }),
        NonFetalError,
        'Chat is under maintenance, try again later!',
      );
    } finally {
      delete config.chat;
    }
  });
});
