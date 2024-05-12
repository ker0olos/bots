// deno-lint-ignore-file no-explicit-any

import { assertEquals } from '$std/assert/mod.ts';

import { FakeTime } from '$std/testing/time.ts';

import { stub } from '$std/testing/mock.ts';

import utils from '~/src/utils.ts';

import packs from '~/src/packs.ts';
import party from '~/src/party.ts';

import config from '~/src/config.ts';

import db from '~/db/mod.ts';

import { Character, Media, MediaType } from '~/src/types.ts';

Deno.test('/party view', async (test) => {
  await test.step('normal', async () => {
    const media: Media[] = [
      {
        id: '0',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'name 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'name 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'name 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'name 5',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {
            member1: {
              characterId: 'anilist:1',
              mediaId: 'anilist:0',
              rating: 1,
              combat: {
                level: 1,
              },
            },
            member2: {
              characterId: 'anilist:2',
              mediaId: 'anilist:0',
              rating: 2,
              combat: {
                level: 2,
              },
            },
            member3: {
              characterId: 'anilist:3',
              mediaId: 'anilist:0',
              rating: 3,
              combat: {
                level: 3,
              },
            },
            member4: {
              characterId: 'anilist:4',
              mediaId: 'anilist:0',
              rating: 4,
              combat: {
                level: 4,
              },
            },
            member5: {
              characterId: 'anilist:5',
              mediaId: 'anilist:0',
              rating: 5,
              combat: {
                level: 5,
              },
            },
          },
        }) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.view({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 1**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 2**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 2' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 3**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 3' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 4**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 4' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 5**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 5' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098>',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      listStub.restore();
      fetchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getInventoryStub.restore();
    }
  });

  await test.step('custom', async () => {
    const media: Media[] = [
      {
        id: '0',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'name 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'name 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'name 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'name 5',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {
            member1: {
              characterId: 'anilist:1',
              mediaId: 'anilist:0',
              rating: 1,
              nickname: 'nickname 1',
              image: 'image 1',
            },
            member2: {
              characterId: 'anilist:2',
              mediaId: 'anilist:0',
              rating: 2,
              nickname: 'nickname 2',
              image: 'image 2',
            },
            member3: {
              characterId: 'anilist:3',
              mediaId: 'anilist:0',
              rating: 3,
              nickname: 'nickname 3',
              image: 'image 3',
            },
            member4: {
              characterId: 'anilist:4',
              mediaId: 'anilist:0',
              rating: 4,
              nickname: 'nickname 4',
              image: 'image 4',
            },
            member5: {
              characterId: 'anilist:5',
              mediaId: 'anilist:0',
              rating: 5,
              nickname: 'nickname 5',
              image: 'image 5',
            },
          },
        }) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.view({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 1**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%201?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 2**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%202?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 3**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%203?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 4**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%204?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 5**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%205?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098>',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      listStub.restore();
      fetchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getInventoryStub.restore();
    }
  });

  await test.step('unassigned members', async () => {
    const media: Media[] = [
      {
        id: '0',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'name 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'name 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'name 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'name 5',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {
            member1: {
              characterId: 'anilist:1',
              mediaId: 'anilist:0',
              rating: 1,
            },
            member2: {
              characterId: 'anilist:2',
              mediaId: 'anilist:0',
              rating: 2,
            },
            member5: {
              characterId: 'anilist:5',
              mediaId: 'anilist:0',
              rating: 5,
            },
          },
        }) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.view({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 1**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 2**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              description: 'Unassigned',
            },
            {
              type: 'rich',
              description: 'Unassigned',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 5**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098>',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      listStub.restore();
      fetchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getGuildStub.restore();
      getInventoryStub.restore();
    }
  });

  await test.step('disabled media', async () => {
    const media: Media = {
      id: '0',
      packId: 'anilist',
      type: MediaType.Anime,
      title: {
        english: 'title',
      },
    };

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'name 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'name 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'name 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'name 5',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {
            member1: {
              characterId: 'anilist:1',
              mediaId: 'anilist:0',
              rating: 1,
            },
            member2: {
              characterId: 'anilist:2',
              mediaId: 'anilist:0',
              rating: 2,
            },
            member3: {
              characterId: 'anilist:3',
              mediaId: 'anilist:0',
              rating: 3,
            },
            member4: {
              characterId: 'anilist:4',
              mediaId: 'anilist:0',
              rating: 4,
            },
            member5: {
              characterId: 'anilist:5',
              mediaId: 'anilist:0',
              rating: 5,
            },
          },
        }) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(
      packs,
      'isDisabled',
      (id) => id === 'anilist:0',
    );

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([media]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.view({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              description: 'This character was removed or disabled',
            },
            {
              type: 'rich',
              description: 'This character was removed or disabled',
            },
            {
              type: 'rich',
              description: 'This character was removed or disabled',
            },
            {
              type: 'rich',
              description: 'This character was removed or disabled',
            },
            {
              type: 'rich',
              description: 'This character was removed or disabled',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getGuildStub.restore();
      getInventoryStub.restore();
    }
  });
});

Deno.test('/party assign', async (test) => {
  await test.step('normal', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const assignCharacterStub = stub(
      db,
      'assignCharacter',
      () =>
        ({
          id: 'anilist:1',
          mediaId: 'anilist:0',
          rating: 2,
        }) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.assign({
        spot: 1,
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        id: 'anilist:1',
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
          embeds: [
            {
              type: 'rich',
              description: 'Assigned',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'name 1',
                  value: '\u200B',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
          ],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'character=anilist:1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'stats=anilist:1',
                label: '/stats',
                style: 2,
                type: 2,
              },
            ],
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getGuildStub.restore();
      assignCharacterStub.restore();
    }
  });

  await test.step('custom', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const assignCharacterStub = stub(
      db,
      'assignCharacter',
      () =>
        ({
          id: 'anilist:1',
          mediaId: 'anilist:0',
          rating: 2,
          nickname: 'nickname',
          image: 'image',
        }) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.assign({
        spot: 1,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'anilist:1',
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
          embeds: [
            {
              type: 'rich',
              description: 'Assigned',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'nickname',
                  value: '\u200B',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
          ],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'character=anilist:1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'stats=anilist:1',
                label: '/stats',
                style: 2,
                type: 2,
              },
            ],
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getGuildStub.restore();
      assignCharacterStub.restore();
    }
  });

  await test.step('character not found', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const assignCharacterStub = stub(
      db,
      'assignCharacter',
      () => {
        throw new Error('CHARACTER_NOT_FOUND');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.assign({
        spot: 1,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'anilist:1',
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
          embeds: [
            {
              type: 'rich',
              description: "name 1 hasn't been found by anyone yet",
            },
          ],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'character=anilist:1',
                label: '/character',
                style: 2,
                type: 2,
              },
            ],
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getGuildStub.restore();
      assignCharacterStub.restore();
    }
  });
});

Deno.test('/party swap', async (test) => {
  await test.step('normal', async () => {
    const media: Media[] = [
      {
        id: '0',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'name 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'name 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'name 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'name 5',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {
            member1: {
              characterId: 'anilist:2',
              mediaId: 'anilist:0',
              rating: 2,
            },
            member2: {
              characterId: 'anilist:1',
              mediaId: 'anilist:0',
              rating: 1,
            },
            member3: {
              characterId: 'anilist:3',
              mediaId: 'anilist:0',
              rating: 3,
            },
            member4: {
              characterId: 'anilist:4',
              mediaId: 'anilist:0',
              rating: 4,
            },
            member5: {
              characterId: 'anilist:5',
              mediaId: 'anilist:0',
              rating: 5,
            },
          },
        }) as any,
    );

    const swapSpotsStub = stub(
      db,
      'swapSpots',
      () => ({}) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.swap({
        a: 1,
        b: 2,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 1**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 2**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 3**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 4**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 5**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098>',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getInventoryStub.restore();
      swapSpotsStub.restore();
    }
  });

  await test.step('custom', async () => {
    const media: Media[] = [
      {
        id: '0',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'name 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'name 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'name 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'name 5',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {
            member1: {
              characterId: 'anilist:2',
              mediaId: 'anilist:0',
              rating: 2,
              nickname: 'nickname 2',
              image: 'image 2',
            },
            member2: {
              characterId: 'anilist:1',
              mediaId: 'anilist:0',
              rating: 1,
              nickname: 'nickname 1',
              image: 'image 1',
            },
            member3: {
              characterId: 'anilist:3',
              mediaId: 'anilist:0',
              rating: 3,
              nickname: 'nickname 3',
              image: 'image 3',
            },
            member4: {
              characterId: 'anilist:4',
              mediaId: 'anilist:0',
              rating: 4,
              nickname: 'nickname 4',
              image: 'image 4',
            },
            member5: {
              characterId: 'anilist:5',
              mediaId: 'anilist:0',
              rating: 5,
              nickname: 'nickname 5',
              image: 'image 5',
            },
          },
        }) as any,
    );

    const swapSpotsStub = stub(
      db,
      'swapSpots',
      () => ({}) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.swap({
        a: 1,
        b: 2,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 1**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%201?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 2**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%202?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 3**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%203?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 4**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%204?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname 5**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image%205?size=thumbnail',
              },
              footer: { text: 'LVL 1' },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098>',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getInventoryStub.restore();
      swapSpotsStub.restore();
    }
  });
});

Deno.test('/party remove', async (test) => {
  await test.step('normal', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {
            member1: {
              characterId: 'anilist:1',
              mediaId: 'anilist:0',
              rating: 2,
            },
          },
        }) as any,
    );

    const unassignCharacterStub = stub(
      db,
      'unassignCharacter',
      () => ({}) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.remove({
        spot: 1,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              description: 'Removed',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'name 1',
                  value: '\u200B',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
          ],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'character=anilist:1',
                label: '/character',
                style: 2,
                type: 2,
              },
            ],
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getInventoryStub.restore();
      unassignCharacterStub.restore();
    }
  });

  await test.step('custom', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {
            member1: {
              characterId: 'anilist:1',
              mediaId: 'anilist:0',
              rating: 2,
              nickname: 'nickname',
              image: 'image',
            },
          },
        }) as any,
    );

    const unassignCharacterStub = stub(
      db,
      'unassignCharacter',
      () => ({}) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.remove({
        spot: 1,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              description: 'Removed',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'nickname',
                  value: '\u200B',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            },
          ],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'character=anilist:1',
                label: '/character',
                style: 2,
                type: 2,
              },
            ],
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      getUserStub.restore();
      getInventoryStub.restore();
      unassignCharacterStub.restore();
    }
  });

  await test.step('empty spot', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name 1',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {} }) as any,
    );

    const unassignCharacterStub = stub(
      db,
      'unassignCharacter',
      () => undefined as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = party.remove({
        spot: 1,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              description:
                'There was no character assigned to this spot of the party',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();

      getUserStub.restore();
      getInventoryStub.restore();
      unassignCharacterStub.restore();

      mediaStub.restore();
      charactersStub.restore();
    }
  });
});
