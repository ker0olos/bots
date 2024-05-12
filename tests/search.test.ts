// deno-lint-ignore-file no-explicit-any

import { assertEquals, assertThrows } from '$std/assert/mod.ts';

import { stub } from '$std/testing/mock.ts';

import { FakeTime } from '$std/testing/time.ts';

import utils from '~/src/utils.ts';

import packs from '~/src/packs.ts';
import config from '~/src/config.ts';

import search from '~/src/search.ts';

import db from '~/db/mod.ts';

import {
  Character,
  CharacterRole,
  DisaggregatedCharacter,
  DisaggregatedMedia,
  Media,
  MediaFormat,
  MediaRelation,
  MediaType,
} from '~/src/types.ts';

Deno.test('/media', async (test) => {
  await test.step('normal', async () => {
    const media: DisaggregatedMedia = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
        romaji: 'romaji title',
        native: 'native title',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const timeStub = new FakeTime();

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
      getGuildStub.restore();
    }
  });

  await test.step('native title', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        native: 'native title',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'native title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'native title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
      getGuildStub.restore();
    }
  });

  await test.step('format header', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.Novel,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Novel',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();
    }
  });

  await test.step('external links', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      externalLinks: [
        { site: 'Crunchyroll', url: 'https://crunchyroll.com/title' },
        { site: 'Crunchyroll 2', url: 'crunchyroll.com/title' },
        { site: 'YouTube', url: 'https://www.youtube.com/video' },
        { site: 'FakeTube', url: 'https://faketube.net/video' },
      ],
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const sechStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [
            {
              type: 1,
              components: [
                {
                  url: 'https://crunchyroll.com/title',
                  label: 'Crunchyroll',
                  style: 5,
                  type: 2,
                },
                {
                  url: 'crunchyroll.com/title',
                  label: 'Crunchyroll 2',
                  style: 5,
                  type: 2,
                },
                {
                  url: 'https://www.youtube.com/video',
                  label: 'YouTube',
                  style: 5,
                  type: 2,
                },
              ],
            },
          ],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      sechStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();
    }
  });

  await test.step('default image', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      title: {
        english: 'english title',
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            image: {
              url: 'http://localhost:8000/external/',
            },
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();
    }
  });

  await test.step('youtube trailer', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      trailer: {
        site: 'youtube',
        id: 'video_id',
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [
            {
              type: 1,
              components: [
                {
                  url: 'https://youtu.be/video_id',
                  label: 'Trailer',
                  style: 5,
                  type: 2,
                },
              ],
            },
          ],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();
    }
  });

  await test.step('characters embeds', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      characters: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '5',
            packId: 'pack-id',
            name: {
              english: 'main character name',
            },
            description: 'main character description',
            images: [{
              url: 'main character url',
            }],
            gender: 'Male',
            age: '69',
          },
        }, {
          role: CharacterRole.Supporting,
          node: {
            id: '5',
            packId: 'pack-id',
            name: {
              english: 'supporting character name',
            },
            description: 'supporting character description',
            images: [{
              url: 'supporting character url',
            }],
          },
        }, {
          role: CharacterRole.Background,
          node: {
            id: '5',
            packId: 'pack-id',
            name: {
              english: 'background character name',
            },
            description: 'background character description',
            images: [{
              url: 'background character url',
            }],
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }, {
            type: 'rich',
            footer: {
              text: 'Male, 69',
            },
            fields: [{
              name: 'main character name',
              value: 'main character description',
            }],
            thumbnail: {
              url:
                'http://localhost:8000/external/main%20character%20url?size=thumbnail',
            },
          }, {
            type: 'rich',
            fields: [{
              name: 'supporting character name',
              value: 'supporting character description',
            }],
            thumbnail: {
              url:
                'http://localhost:8000/external/supporting%20character%20url?size=thumbnail',
            },
          }],
          components: [{
            type: 1,
            components: [{
              custom_id: 'mcharacters=pack-id:1=0',
              label: 'View Characters',
              style: 2,
              type: 2,
            }],
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();
    }
  });

  await test.step('media relations', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      relations: {
        edges: [{
          relation: MediaRelation.Sequel,
          node: {
            id: '5',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 0,
            title: {
              english: 'english title 2',
            },
          },
        }, {
          relation: MediaRelation.Prequel,
          node: {
            id: '10',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 0,
            title: {
              english: 'english title',
            },
          },
        }, {
          relation: MediaRelation.SideStory,
          node: {
            id: '15',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 0,
            title: {
              english: 'side story',
            },
          },
        }, {
          relation: MediaRelation.SpinOff,
          node: {
            id: '20',
            packId: 'pack-id',
            type: MediaType.Manga,
            format: MediaFormat.Manga,
            popularity: 0,
            title: {
              english: 'spin off',
            },
          },
        }, {
          relation: MediaRelation.Adaptation,
          node: {
            id: '25',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 0,
            title: {
              english: 'adaptation',
            },
          },
        }, {
          relation: MediaRelation.Adaptation,
          node: {
            id: '30',
            packId: 'pack-id',
            type: MediaType.Manga,
            format: MediaFormat.Manga,
            popularity: 0,
            title: {
              english: 'second adaptation',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const saarchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'media=pack-id:5',
                  label: 'english title 2 (Sequel)',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'media=pack-id:10',
                  label: 'english title (Prequel)',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'media=pack-id:15',
                  label: 'side story (Side Story)',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'media=pack-id:20',
                  label: 'spin off (Spin Off)',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      saarchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
    }
  });

  await test.step('media relations 2', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      relations: {
        edges: [{
          relation: MediaRelation.Contains,
          node: {
            id: '5',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 0,
            title: {
              english: 'child',
            },
          },
        }, {
          relation: MediaRelation.Parent,
          node: {
            id: '10',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 0,
            title: {
              english: 'parent',
            },
          },
        }, {
          relation: MediaRelation.Adaptation,
          node: {
            id: '15',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 0,
            title: {
              english: 'adaptation',
            },
          },
        }, {
          relation: MediaRelation.Other,
          node: {
            id: '20',
            packId: 'pack-id',
            type: MediaType.Manga,
            format: MediaFormat.Manga,
            popularity: 0,
            title: {
              english: 'other',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const sarrchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'media=pack-id:5',
                  label: 'child (Anime)',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'media=pack-id:10',
                  label: 'parent (Anime)',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'media=pack-id:15',
                  label: 'adaptation (Anime)',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'media=pack-id:20',
                  label: 'other (Manga)',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      sarrchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
    }
  });

  await test.step('media relations 3', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      relations: {
        edges: [{
          relation: MediaRelation.Other,
          node: {
            id: '5',
            packId: 'pack-id',
            type: MediaType.Anime,
            popularity: 0,
            title: {
              english: 'branch',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'media=pack-id:5',
                  label: 'branch',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
    }
  });

  await test.step('music relations', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      relations: {
        edges: [{
          relation: MediaRelation.Other,
          node: {
            id: '5',
            type: MediaType.Anime,
            format: MediaFormat.Music,
            popularity: 0,
            title: {
              english: 'op',
            },
            externalLinks: [{ site: 'Youtube', url: 'youtube_url' }],
          },
        }, {
          relation: MediaRelation.Other,
          node: {
            id: '10',
            type: MediaType.Anime,
            format: MediaFormat.Music,
            popularity: 0,
            title: {
              english: 'fk',
            },
            externalLinks: [{ site: 'Spotify', url: 'spotify_url' }],
          },
        }, {
          relation: MediaRelation.Other,
          node: {
            id: '15',
            type: MediaType.Anime,
            format: MediaFormat.Music,
            popularity: 0,
            title: {
              english: 'ed',
            },
            externalLinks: [{ site: 'FakeTube', url: 'faketube_url' }],
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const sarchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [
            {
              type: 1,
              components: [
                {
                  label: 'op',
                  url: 'youtube_url',
                  style: 5,
                  type: 2,
                },
                {
                  label: 'fk',
                  url: 'spotify_url',
                  style: 5,
                  type: 2,
                },
              ],
            },
          ],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      sarchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
    }
  });

  await test.step('relations sorting', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      relations: {
        edges: [{
          relation: MediaRelation.Other,
          node: {
            id: '5',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 0,
            title: {
              english: 'title',
            },
          },
        }, {
          relation: MediaRelation.Other,
          node: {
            id: '10',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 100,
            title: {
              english: 'title',
            },
          },
        }, {
          relation: MediaRelation.Other,
          node: {
            id: '15',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 50,
            title: {
              english: 'title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const sarchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'media=pack-id:5',
                  label: 'title (Anime)',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'media=pack-id:10',
                  label: 'title (Anime)',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'media=pack-id:15',
                  label: 'title (Anime)',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      sarchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
    }
  });

  await test.step('characters sorting', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
      },
      images: [{
        url: 'image_url',
      }],
      characters: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '5',
            name: {
              english: 'main character name',
            },
            popularity: 0,
          },
        }, {
          role: CharacterRole.Supporting,
          node: {
            id: '10',
            name: {
              english: 'supporting character name',
            },
            popularity: 100,
          },
        }, {
          role: CharacterRole.Background,
          node: {
            id: '15',
            name: {
              english: 'background character name',
            },
            popularity: 50,
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const sarchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            author: {
              name: 'Anime',
            },
            title: 'english title',
            description: 'long description',
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }, {
            type: 'rich',
            fields: [{
              name: 'main character name',
              value: '\u200B',
            }],
            thumbnail: {
              url: 'http://localhost:8000/external/?size=thumbnail',
            },
          }, {
            type: 'rich',
            fields: [{
              name: 'supporting character name',
              value: '\u200B',
            }],
            thumbnail: {
              url: 'http://localhost:8000/external/?size=thumbnail',
            },
          }],
          components: [{
            type: 1,
            components: [{
              custom_id: 'mcharacters=pack-id:1=0',
              label: 'View Characters',
              style: 2,
              type: 2,
            }],
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      sarchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
    }
  });

  await test.step('not found', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const sarchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(undefined),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'x'.repeat(100),
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description: 'Found _nothing_ matching that query!',
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      sarchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();
    }
  });

  await test.step('no titles', () => {
    const media: Media = {
      id: '1',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      title: {},
    };

    assertThrows(() => search.mediaMessage(media), Error, '404');
  });
});

Deno.test('/media debug', async (test) => {
  await test.step('normal', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      description: 'long description',
      popularity: 0,
      title: {
        english: 'english title',
        romaji: 'romaji title',
        native: 'native title',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
        debug: true,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description: 'romaji title\nnative title',
            fields: [
              {
                name: 'Id',
                value: 'pack-id:1',
              },
              {
                inline: true,
                name: 'Type',
                value: 'Anime',
              },
              {
                inline: true,
                name: 'Format',
                value: 'TV',
              },
              {
                inline: true,
                name: 'Popularity',
                value: '0',
              },
            ],
            thumbnail: {
              url: 'http://localhost:8000/external/image_url?size=thumbnail',
            },
            title: 'english title',
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();
    }
  });

  await test.step('default image', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      title: {
        english: 'english title',
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => (undefined as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const searchStub = stub(
      packs,
      'searchOneMedia',
      () => Promise.resolve(media),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.media({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'english title',
        debug: true,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            fields: [
              {
                name: 'Id',
                value: 'pack-id:1',
              },
              {
                inline: true,
                name: 'Type',
                value: 'Anime',
              },
              {
                inline: true,
                name: 'Format',
                value: 'TV',
              },
              {
                inline: true,
                name: 'Popularity',
                value: '0',
              },
            ],
            thumbnail: {
              url: 'http://localhost:8000/external/?size=thumbnail',
            },
            title: 'english title',
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();
    }
  });

  await test.step('no titles', () => {
    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    try {
      const media: Media = {
        id: '1',
        type: MediaType.Anime,
        format: MediaFormat.TV,
        title: {},
      };

      assertThrows(
        () => search.mediaDebugMessage(media),
        Error,
        '404',
      );
    } finally {
      getGuildStub.restore();
    }
  });
});

Deno.test('/character', async (test) => {
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
      () => undefined as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description:
              '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098>',
            fields: [
              {
                name: 'full name\n\u200B',
                value: 'long description',
              },
            ],
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
            footer: {
              text: 'Male, 420',
            },
          }],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'like=pack-id:1',
                label: '/like',
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
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('with owner', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
    };

    const timeStub = new FakeTime();

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          characterId: 'anilist:1',
          mediaId: 'media_id',
          rating: 3,
          userId: 'user_id',
        }) as any,
    );

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

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        search: 'full name',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description:
              '<@user_id>\n\n<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            fields: [
              {
                name: 'full name\n\u200B',
                value: 'long description',
              },
            ],
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'like=pack-id:1',
                label: '/like',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'stats=pack-id:1',
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
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('with gender', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      gender: 'female',
    };

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
      () => Promise.resolve(character),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description:
              '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            fields: [
              {
                name: 'full name\n\u200B',
                value: 'long description',
              },
            ],
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
            footer: {
              text: 'Female',
            },
          }],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'like=pack-id:1',
                label: '/like',
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
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('with age', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      age: '18+',
    };

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
      () => Promise.resolve(character),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = await search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description:
              '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            fields: [
              {
                name: 'full name\n\u200B',
                value: 'long description',
              },
            ],
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
            footer: {
              text: '18+',
            },
          }],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'like=pack-id:1',
                label: '/like',
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
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      listStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('with relations', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '5',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.Movie,
            popularity: 0,
            title: {
              english: 'movie',
            },
          },
        }],
      },
    };

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
      () => Promise.resolve(character),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description:
              '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            fields: [
              {
                name: 'full name\n\u200B',
                value: 'long description',
              },
            ],
            image: {
              url: 'http://localhost:8000/external/image_url',
            },
          }],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'like=pack-id:1',
                label: '/like',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'media=pack-id:5',
                label: 'movie (Movie)',
                style: 2,
                type: 2,
              },
            ],
          }],
        },
      );
    } finally {
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

  await test.step('default image', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      name: {
        english: 'full name',
      },
    };

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
      () => Promise.resolve(character),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description:
              '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
            fields: [
              {
                name: 'full name',
                value: '\u200B',
              },
            ],
            image: {
              url: 'http://localhost:8000/external/',
            },
          }],
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'like=pack-id:1',
                label: '/like',
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

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',
        search: 'x'.repeat(100),
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          embeds: [{
            type: 'rich',
            description: 'Found _nothing_ matching that query!',
          }],
          attachments: [],
          components: [],
        },
      );
    } finally {
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
});

Deno.test('media embed', async (test) => {
  await test.step('normal', () => {
    const media: DisaggregatedMedia = {
      id: '1',
      description: 'long description',
      title: {
        english: 'full title',
      },
      images: [{
        url: 'image_url',
      }],
      popularity: 1_000_000,
      type: MediaType.Anime,
      format: MediaFormat.TV,
    };

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const embed = search.mediaEmbed(media);

      assertEquals(embed.json(), {
        type: 'rich',
        title: 'full title',
        description: 'long description',
        image: {
          url: 'http://localhost:8000/external/image_url',
        },
        author: {
          name: 'Anime',
        },
      });
    } finally {
      delete config.appId;
      delete config.origin;
    }
  });

  await test.step('minimized', () => {
    const media: DisaggregatedMedia = {
      id: '1',
      description: 'long description',
      title: {
        english: 'full title',
      },
      images: [{
        url: 'image_url',
      }],
      popularity: 1_000_000,
      type: MediaType.Anime,
      format: MediaFormat.TV,
    };

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const embed = search.mediaEmbed(media, { mode: 'thumbnail' });

      assertEquals(embed.json(), {
        type: 'rich',
        title: 'full title',
        description: 'long description',
        thumbnail: {
          url: 'http://localhost:8000/external/image_url?size=thumbnail',
        },
        author: {
          name: 'Anime',
        },
      });
    } finally {
      delete config.appId;
      delete config.origin;
    }
  });

  await test.step('default image', () => {
    const media: DisaggregatedMedia = {
      id: '1',
      description: 'long description',
      title: {
        english: 'full title',
      },
      popularity: 1_000_000,
      type: MediaType.Anime,
      format: MediaFormat.TV,
    };

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const embed = search.mediaEmbed(media);

      assertEquals(embed.json(), {
        type: 'rich',
        title: 'full title',
        description: 'long description',
        image: {
          url: 'http://localhost:8000/external/',
        },
        author: {
          name: 'Anime',
        },
      });
    } finally {
      delete config.appId;
      delete config.origin;
    }
  });
});

Deno.test('character embed', async (test) => {
  await test.step('normal', () => {
    const character: DisaggregatedCharacter = {
      id: '1',
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

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const embed = search.characterEmbed(character, {
        mode: 'full',
        description: true,
        footer: true,
        rating: false,
      });

      assertEquals(embed.json(), {
        type: 'rich',
        fields: [
          {
            name: 'full name\n\u200B',
            value: 'long description',
          },
        ],
        image: {
          url: 'http://localhost:8000/external/image_url',
        },
        footer: {
          text: 'Male, 420',
        },
      });
    } finally {
      delete config.appId;
      delete config.origin;
    }
  });

  await test.step('media title', () => {
    const character: Character = {
      id: '1',
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media_id',
            title: { english: 'media title' },
            type: MediaType.Anime,
          },
        }],
      },
    };

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const embed = search.characterEmbed(character, {
        mode: 'thumbnail',
        description: true,
        media: { title: true },
        footer: true,
        rating: false,
      });

      assertEquals(embed.json(), {
        type: 'rich',
        fields: [
          {
            name: 'media title',
            value: '**full name**',
          },
          {
            name: '\u200B',
            value: 'long description',
          },
        ],
        thumbnail: {
          url: 'http://localhost:8000/external/image_url?size=thumbnail',
        },
        footer: {
          text: 'Male, 420',
        },
      });
    } finally {
      delete config.appId;
      delete config.origin;
    }
  });

  await test.step('minimized', () => {
    const character: DisaggregatedCharacter = {
      id: '1',
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

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const embed = search.characterEmbed(character, {
        mode: 'thumbnail',
        description: false,
        footer: false,
        rating: false,
      });

      assertEquals(embed.json(), {
        fields: [
          {
            name: 'full name',
            value: '\u200B',
          },
        ],
        thumbnail: {
          url: 'http://localhost:8000/external/image_url?size=thumbnail',
        },
        type: 'rich',
      });
    } finally {
      delete config.appId;
      delete config.origin;
    }
  });

  await test.step('custom', () => {
    const character: DisaggregatedCharacter = {
      id: '1',
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

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const embed = search.characterEmbed(character, {
        mode: 'thumbnail',
        description: false,
        footer: false,
        rating: false,
        existing: {
          nickname: 'nickname',
          image: 'custom_image_url',
        },
      });

      assertEquals(embed.json(), {
        fields: [
          {
            name: 'nickname',
            value: '\u200B',
          },
        ],
        thumbnail: {
          url: 'http://localhost:8000/external/custom_image_url?size=thumbnail',
        },
        type: 'rich',
      });
    } finally {
      delete config.appId;
      delete config.origin;
    }
  });

  await test.step('default image', () => {
    const character: DisaggregatedCharacter = {
      id: '1',
      description: 'long description',
      name: {
        english: 'full name',
      },
      popularity: 1_000_000,
      age: '420',
      gender: 'male',
    };

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const embed = search.characterEmbed(character, {
        mode: 'thumbnail',
        description: false,
        footer: false,
        rating: false,
      });

      assertEquals(embed.json(), {
        fields: [
          {
            name: 'full name',
            value: '\u200B',
          },
        ],
        thumbnail: {
          url: 'http://localhost:8000/external/?size=thumbnail',
        },
        type: 'rich',
      });
    } finally {
      delete config.appId;
      delete config.origin;
    }
  });
});

Deno.test('/character debug', async (test) => {
  await test.step('no media', async () => {
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
      age: '420',
      gender: 'male',
      popularity: 1_000_000,
    };

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
      () => Promise.resolve(character),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
        debug: true,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              title: 'full name',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'Id',
                  value: 'pack-id:1',
                },
                {
                  name: 'Rating',
                  value: '5*',
                },
                {
                  inline: true,
                  name: 'Gender',
                  value: 'male',
                },
                {
                  inline: true,
                  name: 'Age',
                  value: '420',
                },
                {
                  inline: true,
                  name: 'Media',
                  value: 'undefined:undefined',
                },
                {
                  inline: true,
                  name: 'Role',
                  value: 'undefined',
                },
                {
                  inline: true,
                  name: 'Popularity',
                  value: '1,000,000',
                },
                {
                  name: '**WARN**',
                  value:
                    'Character not available in gacha.\nAdd at least one media to the character.',
                },
              ],
            },
          ],
        },
      );
    } finally {
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

  await test.step('no media nor popularity', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      age: '420',
      gender: 'male',
    };

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
      () => Promise.resolve(character),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
        debug: true,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              title: 'full name',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'Id',
                  value: 'pack-id:1',
                },
                {
                  name: 'Rating',
                  value: '1*',
                },
                {
                  inline: true,
                  name: 'Gender',
                  value: 'male',
                },
                {
                  inline: true,
                  name: 'Age',
                  value: '420',
                },
                {
                  inline: true,
                  name: 'Media',
                  value: 'undefined:undefined',
                },
                {
                  inline: true,
                  name: 'Role',
                  value: 'undefined',
                },
                {
                  inline: true,
                  name: 'Popularity',
                  value: '0',
                },
                {
                  name: '**WARN**',
                  value:
                    'Character not available in gacha.\nAdd at least one media to the character.',
                },
              ],
            },
          ],
        },
      );
    } finally {
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

  await test.step('with media', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      description: 'long description',
      name: {
        english: 'full name',
      },
      images: [{
        url: 'image_url',
      }],
      age: '420',
      gender: 'male',
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '5',
            packId: 'pack-id',
            type: MediaType.Anime,
            format: MediaFormat.TV,
            popularity: 10,
            title: {
              english: 'title',
            },
          },
        }],
      },
    };

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
      () => Promise.resolve(character),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
        debug: true,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              title: 'full name',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'Id',
                  value: 'pack-id:1',
                },
                {
                  name: 'Rating',
                  value: '1*',
                },
                {
                  inline: true,
                  name: 'Gender',
                  value: 'male',
                },
                {
                  inline: true,
                  name: 'Age',
                  value: '420',
                },
                {
                  inline: true,
                  name: 'Media',
                  value: 'pack-id:5',
                },
                {
                  inline: true,
                  name: 'Role',
                  value: 'Main',
                },
                {
                  inline: true,
                  name: 'Popularity',
                  value: '10',
                },
              ],
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      searchStub.restore();
      isDisabledStub.restore();
      timeStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('default image', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      name: {
        english: 'full name',
      },
    };

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
      () => Promise.resolve(character),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.character({
        token: 'test_token',
        guildId: 'guild_id',

        search: 'full name',
        debug: true,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              title: 'full name',
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              fields: [
                {
                  name: 'Id',
                  value: 'pack-id:1',
                },
                {
                  name: 'Rating',
                  value: '1*',
                },
                {
                  inline: true,
                  name: 'Gender',
                  value: 'undefined',
                },
                {
                  inline: true,
                  name: 'Age',
                  value: 'undefined',
                },
                {
                  inline: true,
                  name: 'Media',
                  value: 'undefined:undefined',
                },
                {
                  inline: true,
                  name: 'Role',
                  value: 'undefined',
                },
                {
                  inline: true,
                  name: 'Popularity',
                  value: '0',
                },
                {
                  name: '**WARN**',
                  value:
                    'Character not available in gacha.\nAdd at least one media to the character.',
                },
              ],
            },
          ],
        },
      );
    } finally {
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
});

Deno.test('media characters', async (test) => {
  await test.step('normal', async () => {
    const characterStub = stub(
      packs,
      'mediaCharacters',
      () =>
        Promise.resolve({
          next: true,
          media: {
            id: '1',
            packId: 'pack-id',
            type: MediaType.Anime,
            popularity: 200_000,
            title: {
              english: 'title',
            },
          },
          character: {
            id: '2',
            packId: 'pack-id',
            name: {
              english: 'name',
            },
          },
        }),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

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

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaCharacters({
        token: 'test_token',
        id: 'pack-id:1',
        userId: 'user_id',
        guildId: 'guild_id',
        index: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          components: [{
            type: 1,
            components: [
              {
                custom_id: '_',
                disabled: true,
                label: '1',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'mcharacters=pack-id:1=1=next',
                label: 'Next',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id:2',
                label: '/like',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'media=pack-id:1',
                label: '/anime',
                style: 2,
                type: 2,
              },
            ],
          }],
          embeds: [
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'name',
                  value: '\u200B',
                },
              ],
              image: {
                url: 'http://localhost:8000/external/',
              },
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      characterStub.restore();
      listStub.restore();
      isDisabledStub.restore();

      timeStub.restore();
      fetchStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('with owner', async () => {
    const characterStub = stub(
      packs,
      'mediaCharacters',
      () =>
        Promise.resolve({
          next: true,
          media: {
            id: '1',
            packId: 'pack-id',
            type: MediaType.Manga,
            title: {
              english: 'title',
            },
          },
          character: {
            id: '2',
            packId: 'pack-id',
            name: {
              english: 'name',
            },
          },
        }),
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
        ({
          characterId: 'pack-id:2',
          mediaId: 'media_id',
          rating: 3,
          userId: 'user_id',
        }) as any,
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaCharacters({
        token: 'test_token',
        id: 'pack-id:1',
        userId: 'user_id',
        guildId: 'guild_id',
        index: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          components: [{
            type: 1,
            components: [
              {
                custom_id: '_',
                disabled: true,
                label: '1',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'mcharacters=pack-id:1=1=next',
                label: 'Next',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id:2',
                label: '/like',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'media=pack-id:1',
                label: '/manga',
                style: 2,
                type: 2,
              },
            ],
          }],
          embeds: [
            {
              type: 'rich',
              description:
                '<@user_id>\n\n<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'name',
                  value: '\u200B',
                },
              ],
              image: {
                url: 'http://localhost:8000/external/',
              },
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      characterStub.restore();
      listStub.restore();
      isDisabledStub.restore();

      fetchStub.restore();
      timeStub.restore();
      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('disabled media', async () => {
    const characterStub = stub(
      packs,
      'mediaCharacters',
      () =>
        Promise.resolve({
          next: false,
          media: {
            id: '1',
            type: MediaType.Anime,
            title: {
              english: 'title',
            },
          },
          character: {
            id: '2',
            name: {
              english: 'name',
            },
          },
        }),
    );

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

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => true);

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaCharacters({
        token: 'test_token',
        id: 'pack-id:1',
        userId: 'user_id',
        guildId: 'guild_id',
        index: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              description: 'Found _nothing_ matching that query!',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      characterStub.restore();
      listStub.restore();
      isDisabledStub.restore();

      timeStub.restore();
      fetchStub.restore();

      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('no characters', async () => {
    const characterStub = stub(
      packs,
      'mediaCharacters',
      () =>
        Promise.resolve({
          next: false,
          media: {
            id: '1',
            type: MediaType.Anime,
            title: {
              english: 'title',
            },
          },
        }),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => ({
        ok: true,
        text: () => undefined as any,
      } as any),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaCharacters({
        token: 'test_token',
        id: 'pack-id:1',
        userId: 'user_id',
        guildId: 'guild_id',
        index: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              description: 'title contains no characters',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      characterStub.restore();
      listStub.restore();
    }
  });

  await test.step('no more characters', async () => {
    const characterStub = stub(
      packs,
      'mediaCharacters',
      () =>
        Promise.resolve({
          next: false,
          media: {
            id: '1',
            type: MediaType.Anime,
            title: {
              english: 'title',
            },
          },
        }),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaCharacters({
        token: 'test_token',
        id: 'pack-id:1',
        userId: 'user_id',
        guildId: 'guild_id',
        index: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              description: 'title contains no characters',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      characterStub.restore();
      listStub.restore();

      timeStub.restore();
      fetchStub.restore();
    }
  });

  await test.step('not found', async () => {
    const characterStub = stub(
      packs,
      'mediaCharacters',
      () =>
        Promise.resolve({
          next: false,
        }),
    );

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaCharacters({
        token: 'test_token',
        id: 'pack-id:1',
        userId: 'user_id',
        guildId: 'guild_id',
        index: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              description: 'Found _nothing_ matching that query!',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      characterStub.restore();
      timeStub.restore();
      fetchStub.restore();
    }
  });
});

Deno.test('/found', async (test) => {
  await test.step('normal', async () => {
    const media: Media[] = [
      {
        id: '3',
        packId: 'anilist',
        type: MediaType.Manga,
        title: {
          english: 'title',
        },
        popularity: 0,
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'name 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

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

    const getMediaCharactersStub = stub(
      db,
      'getMediaCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            mediaId: 'anilist:3',
            rating: 2,
            userId: 'another_user_id',
          },
          {
            characterId: 'anilist:2',
            mediaId: 'anilist:3',
            rating: 4,
            userId: 'another_user_id',
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaFound({
        index: 0,
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        id: 'anilist:3',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'found=anilist:3=0=prev',
                label: 'Prev',
                style: 2,
                type: 2,
              },
              {
                custom_id: '_',
                disabled: true,
                label: '1/1',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'found=anilist:3=0=next',
                label: 'Next',
                style: 2,
                type: 2,
              },
            ],
          }],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title',
                  value:
                    '2<:smolstar:1107503653956374638> <@another_user_id> name',
                },
                {
                  inline: false,
                  name: 'title',
                  value:
                    '4<:smolstar:1107503653956374638> <@another_user_id> name 2',
                },
              ],
            },
          ],
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

      getGuildStub.restore();

      getMediaCharactersStub.restore();
    }
  });

  await test.step('relation groups', async () => {
    const media: Media[] = [
      {
        id: '4',
        packId: 'anilist',
        type: MediaType.Manga,
        title: {
          english: 'title',
        },
        popularity: 100,
        relations: {
          edges: [{
            relation: MediaRelation.Contains,
            node: {
              id: '5',
              packId: 'anilist',
              type: MediaType.Manga,
              title: {
                english: 'title 2',
              },
              popularity: 0,
            },
          }],
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'name',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'name 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            // deno-lint-ignore no-non-null-assertion
            node: media[0].relations!.edges[0].node,
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'name 3',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

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

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const getMediaCharactersStub = stub(
      db,
      'getMediaCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            mediaId: 'anilist:4',
            rating: 2,
            userId: 'another_user_id',
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            rating: 4,
            userId: 'another_user_id',
          },
          {
            characterId: 'anilist:2',
            mediaId: 'anilist:5',
            rating: 4,
            userId: 'another_user_id',
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaFound({
        index: 0,
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        id: 'anilist:4',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'found=anilist:4=0=prev',
                label: 'Prev',
                style: 2,
                type: 2,
              },
              {
                custom_id: '_',
                disabled: true,
                label: '1/1',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'found=anilist:4=0=next',
                label: 'Next',
                style: 2,
                type: 2,
              },
            ],
          }],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title',
                  value:
                    '2<:smolstar:1107503653956374638> <@another_user_id> name',
                },
                {
                  inline: false,
                  name: 'title 2',
                  value:
                    '4<:smolstar:1107503653956374638> <@another_user_id> name 2',
                },
                {
                  inline: false,
                  name: 'title',
                  value:
                    '4<:smolstar:1107503653956374638> <@another_user_id> name 3',
                },
              ],
            },
          ],
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

      getGuildStub.restore();

      getMediaCharactersStub.restore();
    }
  });

  await test.step('media disabled', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => true);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaFound({
        index: 0,
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        id: 'anilist:2',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              description: 'Found _nothing_ matching that query!',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      mediaStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
    }
  });

  await test.step('no characters', async () => {
    const media: Media = {
      id: '2',
      packId: 'anilist',
      type: MediaType.Manga,
      title: {
        english: 'title',
      },
      popularity: 0,
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([media]),
    );

    const getMediaCharactersStub = stub(
      db,
      'getMediaCharacters',
      () => [] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = search.mediaFound({
        index: 0,
        token: 'test_token',
        guildId: 'guild_id',
        userId: 'user_id',
        id: 'anilist:2',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/spinner.gif',
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
              description: 'No one has found any title characters',
            },
          ],
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

      getGuildStub.restore();

      getMediaCharactersStub.restore();
    }
  });
});
