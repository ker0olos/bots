// deno-lint-ignore-file no-explicit-any

import { assertEquals, assertThrows } from '$std/assert/mod.ts';

import { FakeTime } from '$std/testing/time.ts';

import { assertSpyCalls, returnsNext, stub } from '$std/testing/mock.ts';

import utils from '~/src/utils.ts';

import packs from '~/src/packs.ts';
import trade from '~/src/trade.ts';

import config from '~/src/config.ts';

import db from '~/db/mod.ts';

import { Character, CharacterRole, MediaType } from '~/src/types.ts';

import { NonFetalError } from '~/src/errors.ts';

Deno.test('give', async (test) => {
  await test.step('normal', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      description: 'description',
      name: {
        english: 'title',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { inventory: 'inventory' } as any,
        { inventory: 'targetInventory' } as any,
      ]),
    );

    const tradeCharactersStub = stub(
      db,
      'giveCharacters',
      () => ({}) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.give({
        token: 'test_token',
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharactersIds: ['anilist:1'],
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
          embeds: [
            {
              type: 'rich',
              description: 'Gift sent to <@target_id>!',
            },
          ],
        },
      );

      assertEquals(
        fetchStub.calls[1].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token',
      );

      assertEquals(fetchStub.calls[1].args[1]?.method, 'POST');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[1].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          content: '<@target_id>',
          attachments: [],
          components: [
            {
              components: [
                {
                  custom_id: 'character=anilist:1=1',
                  label: '/character',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'like=anilist:1',
                  label: '/like',
                  style: 2,
                  type: 2,
                },
              ],
              type: 1,
            },
          ],
          embeds: [
            {
              type: 'rich',
              description: '<@user_id> sent you a gift',
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media',
                  value: '**title**',
                },
                {
                  name: '\u200B',
                  value: '<:add:1099004747123523644>',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      charactersStub.restore();
      getInventoryStub.restore();
      tradeCharactersStub.restore();
    }
  });

  await test.step('not found', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      description: 'description',
      name: {
        english: 'title',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media',
            },
          },
        }],
      },
    };

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { inventory: 'inventory' } as any,
        { inventory: 'targetInventory' } as any,
      ]),
    );

    const tradeCharactersStub = stub(
      db,
      'giveCharacters',
      () => {
        throw new NonFetalError('NOT_OWNED');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const timeStub = new FakeTime();

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.give({
        token: 'test_token',
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharactersIds: ['anilist:1', 'anilist:1'],
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
          embeds: [
            {
              type: 'rich',
              description: 'Some of those characters changed hands',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      charactersStub.restore();
      getInventoryStub.restore();
      tradeCharactersStub.restore();
    }
  });

  await test.step('not owned', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      description: 'description',
      name: {
        english: 'title',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media',
            },
          },
        }],
      },
    };

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { inventory: 'inventory' } as any,
        { inventory: 'targetInventory' } as any,
      ]),
    );

    const tradeCharactersStub = stub(
      db,
      'giveCharacters',
      () => {
        throw new NonFetalError('NOT_OWNED');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const timeStub = new FakeTime();

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.give({
        token: 'test_token',
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharactersIds: ['anilist:1', 'anilist:1'],
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
          embeds: [
            {
              type: 'rich',
              description: 'Some of those characters changed hands',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      charactersStub.restore();
      getInventoryStub.restore();
      tradeCharactersStub.restore();
    }
  });

  await test.step('in party', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      description: 'description',
      name: {
        english: 'title',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media',
            },
          },
        }],
      },
    };

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { inventory: 'inventory' } as any,
        { inventory: 'targetInventory' } as any,
      ]),
    );

    const tradeCharactersStub = stub(
      db,
      'giveCharacters',
      () => {
        throw new NonFetalError('CHARACTER_IN_PARTY');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const timeStub = new FakeTime();

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.give({
        token: 'test_token',
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharactersIds: ['anilist:1', 'anilist:1'],
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
          embeds: [
            {
              type: 'rich',
              description:
                'Some of those characters are currently in your party',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      charactersStub.restore();
      getInventoryStub.restore();
      tradeCharactersStub.restore();
    }
  });
});

Deno.test('trade', async (test) => {
  await test.step('normal', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'title',
      },
      description: 'description',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media',
            },
          },
        }],
      },
    };

    const character2: Character = {
      id: '2',
      packId: 'anilist',
      name: {
        english: 'title 2',
      },
      description: 'description 2',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '3',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media 2',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { inventory: 'inventory' } as any,
        { inventory: 'targetInventory' } as any,
      ]),
    );

    const tradeCharactersStub = stub(
      db,
      'tradeCharacters',
      () => ({}) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character, character2]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.accepted({
        token: 'test_token',
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharactersIds: ['anilist:1', 'anilist:1'],
        takeCharactersIds: ['anilist:2', 'anilist:2'],
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
          content: '<@user_id>',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description: '<@target_id> accepted your offer',
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media 2',
                  value: '**title 2**',
                },
                {
                  name: '\u200B',
                  value: '<:add:1099004747123523644>',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media 2',
                  value: '**title 2**',
                },
                {
                  name: '\u200B',
                  value: '<:add:1099004747123523644>',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media',
                  value: '**title**',
                },
                {
                  name: '\u200B',
                  value: '<:remove:1099004424111792158>',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media',
                  value: '**title**',
                },
                {
                  name: '\u200B',
                  value: '<:remove:1099004424111792158>',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
            },
          ],
        },
      );

      assertEquals(
        fetchStub.calls[1].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token',
      );

      assertEquals(fetchStub.calls[1].args[1]?.method, 'POST');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[1].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          content: '<@user_id> your offer was accepted!',
          attachments: [],
          components: [],
          embeds: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      charactersStub.restore();
      getInventoryStub.restore();
      tradeCharactersStub.restore();
    }
  });

  await test.step('not found', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'title',
      },
      description: 'description',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media',
            },
          },
        }],
      },
    };

    const character2: Character = {
      id: '2',
      packId: 'anilist',
      name: {
        english: 'title 2',
      },
      description: 'description 2',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '3',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media 2',
            },
          },
        }],
      },
    };

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { inventory: 'inventory' } as any,
        { inventory: 'targetInventory' } as any,
      ]),
    );

    const tradeCharactersStub = stub(
      db,
      'tradeCharacters',
      () => {
        throw new NonFetalError('CHARACTER_NOT_FOUND');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const timeStub = new FakeTime();

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character, character2]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.accepted({
        token: 'test_token',
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',

        giveCharactersIds: ['anilist:1', 'anilist:1'],
        takeCharactersIds: ['anilist:2', 'anilist:2'],
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
          embeds: [
            {
              type: 'rich',
              description: 'Some of those characters changed hands',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      charactersStub.restore();
      getInventoryStub.restore();
      tradeCharactersStub.restore();
    }
  });

  await test.step('not owned', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'title',
      },
      description: 'description',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media',
            },
          },
        }],
      },
    };

    const character2: Character = {
      id: '2',
      packId: 'anilist',
      name: {
        english: 'title 2',
      },
      description: 'description 2',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '3',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media 2',
            },
          },
        }],
      },
    };

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { inventory: 'inventory' } as any,
        { inventory: 'targetInventory' } as any,
      ]),
    );

    const tradeCharactersStub = stub(
      db,
      'tradeCharacters',
      () => {
        throw new NonFetalError('CHARACTER_NOT_OWNED');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const timeStub = new FakeTime();

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character, character2]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.accepted({
        token: 'test_token',
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharactersIds: ['anilist:1', 'anilist:1'],
        takeCharactersIds: ['anilist:2', 'anilist:2'],
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
          embeds: [
            {
              type: 'rich',
              description: 'Some of those characters changed hands',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      charactersStub.restore();
      getInventoryStub.restore();
      tradeCharactersStub.restore();
    }
  });

  await test.step('in party', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'title',
      },
      description: 'description',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media',
            },
          },
        }],
      },
    };

    const character2: Character = {
      id: '2',
      packId: 'anilist',
      name: {
        english: 'title 2',
      },
      description: 'description 2',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '3',
            packId: 'anilist',
            type: MediaType.Anime,
            title: {
              english: 'media 2',
            },
          },
        }],
      },
    };

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { inventory: 'inventory' } as any,
        { inventory: 'targetInventory' } as any,
      ]),
    );

    const tradeCharactersStub = stub(
      db,
      'tradeCharacters',
      () => {
        throw new NonFetalError('CHARACTER_IN_PARTY');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const timeStub = new FakeTime();

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character, character2]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.accepted({
        token: 'test_token',
        userId: 'user_id',
        targetId: 'target_id',
        guildId: 'guild_id',
        giveCharactersIds: ['anilist:1', 'anilist:1'],
        takeCharactersIds: ['anilist:2', 'anilist:2'],
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
          embeds: [
            {
              type: 'rich',
              description: 'Some of those characters are currently in parties',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      charactersStub.restore();
      getInventoryStub.restore();
      tradeCharactersStub.restore();
    }
  });
});

Deno.test('/give', async (test) => {
  await test.step('normal', async () => {
    const characterStub = stub(
      packs,
      'characters',
      returnsNext([
        Promise.resolve([{
          id: '1',
          packId: 'id',
          description: 'long description',
          name: {
            english: 'full name',
          },
          images: [{
            url: 'image_url',
          }],
        }]),
        Promise.resolve([{
          id: '2',
          packId: 'id',
          description: 'long description 2',
          name: {
            english: 'full name 2',
          },
          images: [{
            url: 'image_url2',
          }],
        }]),
      ]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const aggregateStub = stub(
      packs,
      'aggregate',
      ({ character }) => Promise.resolve(character),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { party: {}, user: { discordId: 'user-1' } } as any,
        { party: {}, user: { discordId: 'user-2' } } as any,
      ]),
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      returnsNext([
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
          {
            characterId: 'id:2',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
        [] as any,
      ]),
    );

    config.trading = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        targetId: 'another_user_id',
        give: ['id:1', 'id:2'],
        take: [],
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

      assertSpyCalls(fetchStub, 1);

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
          embeds: [
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:remove:1099004424111792158>',
                },
              ],
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url2?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name 2',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:remove:1099004424111792158>',
                },
              ],
            },
            {
              type: 'rich',
              description:
                'Are you sure you want to give **full name, full name 2** <:remove:1099004424111792158> to <@another_user_id> for free?',
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'give=user_id=another_user_id=id:1&id:2',
                  label: 'Confirm',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'cancel=user_id',
                  label: 'Cancel',
                  style: 4,
                  type: 2,
                },
              ],
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.trading;

      timeStub.restore();
      characterStub.restore();
      aggregateStub.restore();
      fetchStub.restore();

      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('gifting yourself', () => {
    const message = trade.pre({
      userId: 'user_id',
      guildId: 'guild_id',

      token: 'test_token',
      targetId: 'user_id',
      give: ['give_character_id'],
      take: [],
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        flags: 64,
        attachments: [],
        components: [],
        embeds: [{
          type: 'rich',
          description: "You can't gift yourself!",
        }],
      },
    });
  });

  await test.step('not owned', async () => {
    const characterStub = stub(
      packs,
      'characters',
      returnsNext([
        Promise.resolve([{
          id: '1',
          packId: 'id',
          description: 'long description',
          name: {
            english: 'full name',
          },
          images: [{
            url: 'image_url',
          }],
        }]),
        Promise.resolve([{
          id: '2',
          packId: 'id',
          description: 'long description 2',
          name: {
            english: 'full name 2',
          },
          images: [{
            url: 'image_url2',
          }],
        }]),
      ]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const aggregateStub = stub(
      packs,
      'aggregate',
      ({ character }) => Promise.resolve(character),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { party: {}, user: { discordId: 'user-1' } } as any,
        { party: {}, user: { discordId: 'user-2' } } as any,
      ]),
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      returnsNext([
        [] as any,
        [] as any,
      ]),
    );

    config.trading = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        targetId: 'another_user_id',
        give: ['id:1', 'id:2'],
        take: [],
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

      assertSpyCalls(fetchStub, 1);

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
          embeds: [
            {
              type: 'rich',
              description: "You don't own full name",
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
              ],
            },
            {
              type: 'rich',
              description: "You don't own full name 2",
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url2?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name 2',
                  value: '\u200B',
                },
              ],
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.trading;

      timeStub.restore();
      characterStub.restore();
      aggregateStub.restore();
      fetchStub.restore();

      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('in party', async () => {
    const characterStub = stub(
      packs,
      'characters',
      returnsNext([
        Promise.resolve([{
          id: '1',
          packId: 'id',
          description: 'long description',
          name: {
            english: 'full name',
          },
          images: [{
            url: 'image_url',
          }],
        }]),
        Promise.resolve([{
          id: '2',
          packId: 'id',
          description: 'long description 2',
          name: {
            english: 'full name 2',
          },
          images: [{
            url: 'image_url2',
          }],
        }]),
      ]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const aggregateStub = stub(
      packs,
      'aggregate',
      ({ character }) => Promise.resolve(character),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        {
          party: {
            member1: { characterId: 'id:1' },
            member5: { characterId: 'id:2' },
          },
          user: { discordId: 'user-1' },
        } as any,
        { party: {}, user: { discordId: 'user-2' } } as any,
      ]),
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      returnsNext([
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
          {
            characterId: 'id:2',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
        [] as any,
      ]),
    );

    config.trading = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        targetId: 'another_user_id',
        give: ['id:1', 'id:2'],
        take: [],
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

      assertSpyCalls(fetchStub, 1);

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
          embeds: [
            {
              type: 'rich',
              description: "full name is in your party and can't be traded",
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
              ],
            },
            {
              type: 'rich',
              description: "full name 2 is in your party and can't be traded",
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url2?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name 2',
                  value: '\u200B',
                },
              ],
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.trading;

      timeStub.restore();
      characterStub.restore();
      aggregateStub.restore();
      fetchStub.restore();

      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });
});

Deno.test('/trade', async (test) => {
  await test.step('normal', async () => {
    const character: Character = {
      id: '1',
      packId: 'id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const aggregateStub = stub(
      packs,
      'aggregate',
      ({ character }) => Promise.resolve(character),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { party: {}, user: { discordId: 'user-1' } } as any,
        { party: {}, user: { discordId: 'user-2' } } as any,
      ]),
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      returnsNext([
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
      ]),
    );

    config.trading = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        targetId: 'another_user_id',
        give: ['id:1'],
        take: ['id:1'],
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

      assertSpyCalls(fetchStub, 2);

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
          content: '<@another_user_id>',
          attachments: [],
          embeds: [
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:remove:1099004424111792158>',
                },
              ],
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:add:1099004747123523644>',
                },
              ],
            },
            {
              type: 'rich',
              description:
                '<@user_id> is offering that you lose **full name** <:remove:1099004424111792158> and get **full name** <:add:1099004747123523644>',
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'trade=user_id=another_user_id=id:1=id:1',
                  label: 'Accept',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'cancel=user_id=another_user_id',
                  label: 'Decline',
                  style: 4,
                  type: 2,
                },
              ],
            },
          ],
        },
      );

      assertEquals(
        fetchStub.calls[1].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token',
      );

      assertEquals(fetchStub.calls[1].args[1]?.method, 'POST');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[1].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          content: '<@another_user_id> you received an offer!',
          attachments: [],
          components: [],
          embeds: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.trading;

      timeStub.restore();
      characterStub.restore();
      aggregateStub.restore();
      fetchStub.restore();

      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('repeated characters', async () => {
    const character: Character = {
      id: '1',
      packId: 'id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const aggregateStub = stub(
      packs,
      'aggregate',
      ({ character }) => Promise.resolve(character),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { party: {}, user: { discordId: 'user-1' } } as any,
        { party: {}, user: { discordId: 'user-2' } } as any,
      ]),
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      returnsNext([
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
      ]),
    );

    config.trading = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.pre({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        targetId: 'another_user_id',
        give: ['id:1', 'id:1'],
        take: ['id:1', 'id:1'],
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

      assertSpyCalls(fetchStub, 2);

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
          content: '<@another_user_id>',
          attachments: [],
          embeds: [
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:remove:1099004424111792158>',
                },
              ],
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
                {
                  name: '\u200B',
                  value: '<:add:1099004747123523644>',
                },
              ],
            },
            {
              type: 'rich',
              description:
                '<@user_id> is offering that you lose **full name** <:remove:1099004424111792158> and get **full name** <:add:1099004747123523644>',
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'trade=user_id=another_user_id=id:1=id:1',
                  label: 'Accept',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'cancel=user_id=another_user_id',
                  label: 'Decline',
                  style: 4,
                  type: 2,
                },
              ],
            },
          ],
        },
      );

      assertEquals(
        fetchStub.calls[1].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token',
      );

      assertEquals(fetchStub.calls[1].args[1]?.method, 'POST');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[1].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          content: '<@another_user_id> you received an offer!',
          attachments: [],
          components: [],
          embeds: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.trading;

      timeStub.restore();
      characterStub.restore();
      aggregateStub.restore();
      fetchStub.restore();

      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('not owned', async () => {
    const character: Character = {
      id: '1',
      packId: 'id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const aggregateStub = stub(
      packs,
      'aggregate',
      ({ character }) => Promise.resolve(character),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { party: {}, user: { discordId: 'user-1' } } as any,
        { party: {}, user: { discordId: 'user-2' } } as any,
      ]),
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      returnsNext([
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
        [] as any,
      ]),
    );

    config.trading = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.pre({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        targetId: 'another_user_id',
        give: ['id:1'],
        take: ['id:1'],
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

      assertSpyCalls(fetchStub, 1);

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
          embeds: [
            {
              type: 'rich',
              description: "<@another_user_id> doesn't own full name",
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
              ],
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.trading;

      timeStub.restore();
      characterStub.restore();
      aggregateStub.restore();
      fetchStub.restore();

      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('in party', async () => {
    const character: Character = {
      id: '1',
      packId: 'id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const aggregateStub = stub(
      packs,
      'aggregate',
      ({ character }) => Promise.resolve(character),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      returnsNext([
        { party: {}, user: { discordId: 'user-1' } } as any,
        {
          party: {
            member1: { characterId: 'id:1' },
          },
          user: { discordId: 'user-2' },
        } as any,
      ]),
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      returnsNext([
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
        [
          {
            characterId: 'id:1',
            mediaId: 'media_id',
            rating: 2,
          },
        ] as any,
      ]),
    );

    config.trading = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        targetId: 'another_user_id',
        give: ['id:1'],
        take: ['od:1'],
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

      assertSpyCalls(fetchStub, 1);

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
          embeds: [
            {
              type: 'rich',
              description:
                "full name is in <@another_user_id>'s party and can't be traded",
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
              ],
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.trading;

      timeStub.restore();
      characterStub.restore();
      aggregateStub.restore();
      fetchStub.restore();

      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('trading with yourself', () => {
    const message = trade.pre({
      userId: 'user_id',
      guildId: 'guild_id',
      token: 'test_token',
      targetId: 'user_id',
      give: ['id:1'],
      take: ['id:1'],
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        flags: 64,
        attachments: [],
        components: [],
        embeds: [{
          type: 'rich',
          description: "You can't trade with yourself!",
        }],
      },
    });
  });

  await test.step('disabled', async () => {
    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    config.trading = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = trade.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        targetId: 'another_user_id',
        give: ['id:1'],
        take: ['id:1'],
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

      assertSpyCalls(fetchStub, 1);

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
          embeds: [
            {
              type: 'rich',
              description:
                'Some of those characters do not exist or are disabled',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.trading;

      timeStub.restore();
      characterStub.restore();
      fetchStub.restore();
    }
  });

  await test.step('under maintenance', () => {
    config.trading = false;

    try {
      assertThrows(
        () =>
          trade.pre({
            userId: 'user_id',
            guildId: 'guild_id',

            token: 'test_token',
            targetId: 'another_user_id',
            give: ['character_id'],
            take: [],
          }),
        NonFetalError,
        'Trading is under maintenance, try again later!',
      );
    } finally {
      delete config.trading;
    }
  });
});
