// deno-lint-ignore-file no-explicit-any

import { assertEquals, assertRejects } from '$std/assert/mod.ts';

import { assertSpyCalls, returnsNext, stub } from '$std/testing/mock.ts';
import { assertMonochromeSnapshot } from '~/tests/utils.test.ts';

import { FakeTime } from '$std/testing/time.ts';

import utils from '~/src/utils.ts';

import packs from '~/src/packs.ts';
import gacha from '~/src/gacha.ts';

import config from '~/src/config.ts';

import Rating from '~/src/rating.ts';

import merge from '~/src/merge.ts';

import db from '~/db/mod.ts';

import searchIndex, { IndexedCharacter } from '~/search-index/mod.ts';

import {
  Character,
  CharacterRole,
  Media,
  MediaFormat,
  MediaType,
} from '~/src/types.ts';

import { NonFetalError, PoolError } from '~/src/errors.ts';

Deno.test('auto merge', async (test) => {
  await test.step('5 ones', async (test) => {
    const characters = Array(25).fill({}).map((_, i) => ({
      rating: 1,
      characterId: `id:${i}`,
    }));

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 2);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      5,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('25 ones', async (test) => {
    const characters = Array(25).fill({}).map((_, i) => ({
      rating: 1,
      id: `id:${i}`,
    }));

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 3);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      25,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('5 twos', async (test) => {
    const characters = Array(25).fill({}).map((_, i) => ({
      rating: 2,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    }));

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 3);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      5,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('20 ones + 1 two', async (test) => {
    const characters = Array(20).fill({}).map((_, i) => ({
      rating: 1,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    })).concat(
      [{
        rating: 2,
        characterId: `id:20`,
        mediaId: 'media_id',
        user: { discordId: 'user_id' },
      }],
    );

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 3);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      20,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      1,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('625 ones', async (test) => {
    const characters = Array(625).fill({}).map((
      _,
      i,
    ) => ({
      rating: 1,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    })).concat(
      [{
        rating: 4,
        characterId: `id:20`,
        mediaId: 'media_id',
        user: { discordId: 'user_id' },
      }],
    );

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 5);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      625,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('500 ones + 5 threes', async (test) => {
    const characters = Array(500).fill({}).map((
      _,
      i,
    ) => ({
      rating: 1,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    })).concat(
      Array(25).fill({}).map((
        _,
        i,
      ) => ({
        rating: 3,
        characterId: `id:${i}`,
        mediaId: 'media_id',
        user: { discordId: 'user_id' },
      })),
    );

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 5);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      500,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      5,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('5 fours', async (test) => {
    const characters = Array(25).fill({}).map((
      _,
      i,
    ) => ({
      rating: 4,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    }));

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 5);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      5,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('5 fives', async () => {
    const characters = Array(25).fill({}).map((_, i) => ({
      rating: 5,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    }));

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 5);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      5,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('4 fours + 1 five', async () => {
    const characters = Array(4).fill({}).map((_, i) => ({
      rating: 4,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    }));

    characters.push({
      rating: 5,
      characterId: 'id:4',
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    });

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 5);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      4,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      1,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('4 fives + 1 four', async () => {
    const characters = Array(4).fill({}).map((_, i) => ({
      rating: 5,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    }));

    characters.push({
      rating: 4,
      characterId: 'id:4',
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    });

    const { sacrifices } = merge.getSacrifices(characters as any, 'target', 5);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      1,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      4,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('min', async (test) => {
    const characters = Array(25).fill({}).map((_, i) => ({
      rating: 1,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    }));

    const { sacrifices, target } = merge.getSacrifices(
      characters as any,
      'min',
    );

    assertEquals(target, 2);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      5,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });

  await test.step('max', async (test) => {
    const characters = Array(25).fill({}).map((_, i) => ({
      rating: 1,
      characterId: `id:${i}`,
      mediaId: 'media_id',
      user: { discordId: 'user_id' },
    }));

    const { sacrifices, target } = merge.getSacrifices(
      characters as any,
      'max',
    );

    assertEquals(target, 3);

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 1).length,
      25,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 2).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 3).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 4).length,
      0,
    );

    assertEquals(
      sacrifices.filter(({ rating }) => rating === 5).length,
      0,
    );

    await assertMonochromeSnapshot(test, sacrifices);
  });
});

Deno.test('synthesis confirmed', async (test) => {
  await test.step('normal', async () => {
    const media: Media = {
      id: '2',
      packId: 'anilist',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 150_000,
      title: {
        english: 'title',
      },
      images: [{ url: 'media_image_url' }],
    };

    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'name',
      },
      images: [{ url: 'character_image_url' }],
      media: {
        edges: [{
          role: CharacterRole.Supporting,
          node: media,
        }],
      },
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

    const getInstanceInventoriesStub = stub(
      db,
      'getActiveUsersIfLiked',
      () => [] as any,
    );

    const addCharacterStub = stub(
      db,
      'addCharacter',
      () => ({ ok: true }) as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const poolStub = stub(
      searchIndex,
      'pool',
      () =>
        Promise.resolve([
          new IndexedCharacter(
            'anilist:1',
            '',
            [],
            [],
            0,
            2,
            CharacterRole.Main,
          ),
        ]),
    );

    const synthesisStub = stub(
      merge,
      'getFilteredCharacters',
      () =>
        Promise.resolve([
          {
            characterId: 'anilist:1',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            rating: 1,
          },
          {
            characterId: 'anilist:5',
            rating: 1,
          },
        ] as any),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = merge.confirmed({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        target: 2,
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
            title: 'title',
            image: {
              url: 'http://localhost:8000/external/media_image_url?size=medium',
            },
          }],
          components: [],
          attachments: [],
        },
      );

      await timeStub.nextAsync();

      assertEquals(
        fetchStub.calls[1].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[1].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[1].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/stars/2.gif',
            },
          }],
          components: [],
          attachments: [],
        },
      );

      await timeStub.nextAsync();

      assertEquals(
        fetchStub.calls[2].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[2].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[2].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          attachments: [],
          embeds: [{
            type: 'rich',
            description: new Rating({ stars: 2 }).emotes,
            fields: [{
              name: 'title',
              value: '**name**',
            }],
            image: {
              url: 'http://localhost:8000/external/character_image_url',
            },
          }],
          components: [{
            type: 1,
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
          }],
        },
      );

      await timeStub.runMicrotasks();
    } finally {
      delete config.appId;
      delete config.origin;

      charactersStub.restore();
      fetchStub.restore();
      synthesisStub.restore();
      poolStub.restore();
      timeStub.restore();
      listStub.restore();
      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
      addCharacterStub.restore();
    }
  });

  await test.step('liked', async () => {
    const media: Media = {
      id: '2',
      packId: 'anilist',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 150_000,
      title: {
        english: 'title',
      },
      images: [{
        url: 'media_image_url',
      }],
    };

    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'name',
      },
      images: [{ url: 'character_image_url' }],
      media: {
        edges: [{
          role: CharacterRole.Supporting,
          node: media,
        }],
      },
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

    const getInstanceInventoriesStub = stub(
      db,
      'getActiveUsersIfLiked',
      () => Promise.resolve(['another_user_id']),
    );

    const addCharacterStub = stub(
      db,
      'addCharacter',
      () => ({ ok: true }) as any,
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const poolStub = stub(
      searchIndex,
      'pool',
      () =>
        Promise.resolve([
          new IndexedCharacter(
            'anilist:1',
            '',
            [],
            [],
            0,
            2,
            CharacterRole.Main,
          ),
        ]),
    );

    const synthesisStub = stub(
      merge,
      'getFilteredCharacters',
      () =>
        Promise.resolve([
          {
            characterId: 'anilist:1',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            rating: 1,
          },
          {
            characterId: 'anilist:5',
            rating: 1,
          },
        ] as any),
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = merge.confirmed({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        target: 2,
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
            title: 'title',
            image: {
              url: 'http://localhost:8000/external/media_image_url?size=medium',
            },
          }],
          components: [],
          attachments: [],
        },
      );

      await timeStub.nextAsync();

      assertEquals(
        fetchStub.calls[1].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[1].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[1].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/stars/2.gif',
            },
          }],
          components: [],
          attachments: [],
        },
      );

      await timeStub.nextAsync();

      assertEquals(
        fetchStub.calls[2].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token/messages/@original',
      );

      assertEquals(fetchStub.calls[2].args[1]?.method, 'PATCH');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[2].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          attachments: [],
          embeds: [{
            type: 'rich',
            description: new Rating({ stars: 2 }).emotes,
            fields: [{
              name: 'title',
              value: '**name**',
            }],
            image: {
              url: 'http://localhost:8000/external/character_image_url',
            },
          }],
          components: [{
            type: 1,
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
          }],
        },
      );

      await timeStub.runMicrotasks();

      assertEquals(
        fetchStub.calls[3].args[0],
        'https://discord.com/api/v10/webhooks/app_id/test_token',
      );

      assertEquals(fetchStub.calls[3].args[1]?.method, 'POST');

      assertEquals(
        JSON.parse(
          (fetchStub.calls[3].args[1]?.body as FormData)?.get(
            'payload_json',
          ) as any,
        ),
        {
          components: [],
          attachments: [],
          content: '<@another_user_id>',
          embeds: [
            {
              type: 'rich',
              description:
                '<@user_id>\n\n<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'title',
                  value: '**name**',
                },
              ],
              thumbnail: {
                url:
                  'http://localhost:8000/external/character_image_url?size=thumbnail',
              },
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      charactersStub.restore();

      fetchStub.restore();
      synthesisStub.restore();
      poolStub.restore();
      timeStub.restore();
      listStub.restore();
      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
      addCharacterStub.restore();
    }
  });

  await test.step('not enough sacrifices', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(utils, 'fetchWithRetry', () => undefined as any);

    const synthesisStub = stub(
      merge,
      'getFilteredCharacters',
      () =>
        Promise.resolve([
          {
            characterId: 'anilist:1',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            rating: 1,
          },
        ] as any),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = merge.confirmed({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',

        target: 2,
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
          embeds: [{
            type: 'rich',
            description:
              'You only have **4 out the 5** sacrifices needed for 2<:smolstar:1107503653956374638>',
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      synthesisStub.restore();
      timeStub.restore();
    }
  });

  await test.step('pool error', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const gachaStub = stub(
      gacha,
      'rngPull',
      () =>
        Promise.reject(
          new PoolError(),
        ),
    );

    const synthesisStub = stub(
      merge,
      'getFilteredCharacters',
      () =>
        Promise.resolve([
          {
            characterId: 'anilist:1',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            rating: 1,
          },
          {
            characterId: 'anilist:5',
            rating: 1,
          },
        ] as any),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = merge.confirmed({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',

        target: 2,
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
          embeds: [{
            type: 'rich',
            description:
              'There are no more 2<:smolstar:1107503653956374638>characters left',
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      synthesisStub.restore();
      gachaStub.restore();
      timeStub.restore();
    }
  });
});

Deno.test('/merge', async (test) => {
  await test.step('normal', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        images: [{ url: 'image_url' }],
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: {
              id: 'anime',
              type: MediaType.Anime,
              title: {
                english: 'media title',
              },
            },
          }],
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        images: [{ url: 'image_url' }],
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: {
              id: 'anime',
              type: MediaType.Anime,
              title: {
                english: 'media title',
              },
            },
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
        images: [{ url: 'image_url' }],
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: {
              id: 'anime',
              type: MediaType.Anime,
              title: {
                english: 'media title',
              },
            },
          }],
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
        images: [{ url: 'image_url' }],
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

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { likes: [] } }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            rating: 1,
          },
          {
            characterId: 'anilist:5',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.synthesis = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = await merge.synthesize({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        mode: 'target',
        target: 2,
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
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'synthesis=user_id=2',
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
          }],
          embeds: [
            {
              type: 'rich',
              description: 'Sacrifice **5** characters?',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'media title',
                  value: '1<:smolstar:1107503653956374638>character 1',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=preview',
              },
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'media title',
                  value: '1<:smolstar:1107503653956374638>character 2',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=preview',
              },
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'media title',
                  value: '1<:smolstar:1107503653956374638>character 3',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>character 4',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>character 5',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=preview',
              },
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.synthesis;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      charactersStub.restore();

      getGuildStub.restore();
      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('with nicknames', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
        images: [{ url: 'image_url' }],
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

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { likes: [] } }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            image: 'custom_image_url',
            nickname: 'nickname 1',
            characterId: 'anilist:1',
            rating: 1,
          },
          {
            image: 'custom_image_url',
            nickname: 'nickname 2',
            characterId: 'anilist:2',
            rating: 1,
          },
          {
            image: 'custom_image_url',
            nickname: 'nickname 3',
            characterId: 'anilist:3',
            rating: 1,
          },
          {
            image: 'custom_image_url',
            nickname: 'nickname 4',
            characterId: 'anilist:4',
            rating: 1,
          },
          {
            image: 'custom_image_url',
            nickname: 'nickname 5',
            characterId: 'anilist:5',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.synthesis = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = await merge.synthesize({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        mode: 'target',
        target: 2,
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
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'synthesis=user_id=2',
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
          }],
          embeds: [
            {
              type: 'rich',
              description: 'Sacrifice **5** characters?',
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>nickname 1',
              thumbnail: {
                url:
                  'http://localhost:8000/external/custom_image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>nickname 2',
              thumbnail: {
                url:
                  'http://localhost:8000/external/custom_image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>nickname 3',
              thumbnail: {
                url:
                  'http://localhost:8000/external/custom_image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>nickname 4',
              thumbnail: {
                url:
                  'http://localhost:8000/external/custom_image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>nickname 5',
              thumbnail: {
                url:
                  'http://localhost:8000/external/custom_image_url?size=preview',
              },
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.synthesis;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      charactersStub.restore();

      getGuildStub.restore();
      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('disabled media', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
        images: [{ url: 'image_url' }],
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
        images: [{ url: 'image_url' }],
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

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { likes: [] } }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            mediaId: 'anilist:m',
            characterId: 'anilist:1',
            rating: 1,
          },
          {
            mediaId: 'anilist:m',
            characterId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            rating: 1,
          },
          {
            characterId: 'anilist:5',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    const isDisabledStub = stub(
      packs,
      'isDisabled',
      (id) => id === 'anilist:m',
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';
    config.synthesis = true;

    try {
      const message = await merge.synthesize({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        mode: 'target',
        target: 2,
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
          components: [{
            type: 1,
            components: [
              {
                custom_id: 'synthesis=user_id=2',
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
          }],
          embeds: [
            {
              type: 'rich',
              description: 'Sacrifice **5** characters?',
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>character 3',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>character 4',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '1<:smolstar:1107503653956374638>character 5',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=preview',
              },
            },
            {
              type: 'rich',
              description: '_+2 others..._',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.synthesis;

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      charactersStub.restore();

      getGuildStub.restore();
      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('filter (party)', async () => {
    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
      ] as any),
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
          user: { likes: [] },
          party: {
            member1: {
              characterId: 'anilist:1',
            },
            member2: {
              characterId: 'anilist:2',
            },
            member3: {
              characterId: 'anilist:3',
            },
            member4: {
              characterId: 'anilist:4',
            },
            member5: {
              characterId: 'anilist:5',
            },
          },
        }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:5',
            mediaId: 'pack-id:2',
            rating: 1,
          },
          {
            characterId: 'anilist:6',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:7',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:8',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:9',
            mediaId: 'pack-id:1',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    config.synthesis = true;

    try {
      await assertRejects(
        () =>
          merge.synthesize({
            token: 'test_token',
            userId: 'user_id',
            guildId: 'guild_id',
            mode: 'target',
            target: 2,
          }),
        NonFetalError,
        'You only have **4 out the 5** sacrifices needed for 2<:smolstar:1107503653956374638>',
      );
    } finally {
      delete config.synthesis;

      fetchStub.restore();
      listStub.restore();

      getGuildStub.restore();
      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('filter (liked characters)', async () => {
    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
      ] as any),
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
          party: {},
          user: {
            likes: [
              { characterId: 'anilist:1' },
              { characterId: 'anilist:2' },
              { characterId: 'anilist:3' },
              { characterId: 'anilist:4' },
              { characterId: 'anilist:5' },
            ],
          },
        }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:5',
            mediaId: 'pack-id:2',
            rating: 1,
          },
          {
            characterId: 'anilist:6',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:7',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:8',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:9',
            mediaId: 'pack-id:1',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    config.synthesis = true;

    try {
      await assertRejects(
        () =>
          merge.synthesize({
            token: 'test_token',
            userId: 'user_id',
            guildId: 'guild_id',
            mode: 'target',
            target: 2,
          }),
        NonFetalError,
        'You only have **4 out the 5** sacrifices needed for 2<:smolstar:1107503653956374638>',
      );
    } finally {
      delete config.synthesis;

      fetchStub.restore();
      listStub.restore();

      getGuildStub.restore();
      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('filter (liked media)', async () => {
    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
      ] as any),
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
          party: {},
          user: {
            likes: [{ mediaId: 'pack-id:1' }],
          },
        }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:5',
            mediaId: 'pack-id:1',
            rating: 1,
          },
          {
            characterId: 'anilist:6',
            mediaId: 'pack-id:2',
            rating: 1,
          },
          {
            characterId: 'anilist:7',
            mediaId: 'pack-id:2',
            rating: 1,
          },
          {
            characterId: 'anilist:8',
            mediaId: 'pack-id:2',
            rating: 1,
          },
          {
            characterId: 'anilist:9',
            mediaId: 'pack-id:2',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    config.synthesis = true;

    try {
      await assertRejects(
        () =>
          merge.synthesize({
            token: 'test_token',
            userId: 'user_id',
            guildId: 'guild_id',
            mode: 'target',
            target: 2,
          }),
        NonFetalError,
        'You only have **4 out the 5** sacrifices needed for 2<:smolstar:1107503653956374638>',
      );
    } finally {
      delete config.synthesis;

      fetchStub.restore();
      listStub.restore();

      getGuildStub.restore();
      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('not enough', async () => {
    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        {
          ok: true,
          text: (() =>
            Promise.resolve(JSON.stringify({
              data: {
                getUserInventory: {
                  user: {},
                  characters: [],
                },
              },
            }))),
        } as any,
        undefined,
      ]),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { likes: [] } }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () => [] as any,
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    config.synthesis = true;

    try {
      await assertRejects(
        () =>
          merge.synthesize({
            token: 'test_token',
            userId: 'user_id',
            guildId: 'guild_id',
            mode: 'target',
            target: 5,
          }),
        NonFetalError,
        'You only have **0 out the 5** sacrifices needed for 5<:smolstar:1107503653956374638>',
      );
    } finally {
      delete config.synthesis;

      fetchStub.restore();
      listStub.restore();

      getGuildStub.restore();
      getInventoryStub.restore();

      getUserCharactersStub.restore();
    }
  });

  await test.step('under maintenance', async () => {
    config.synthesis = false;

    try {
      await assertRejects(
        () =>
          merge.synthesize({
            token: 'test_token',
            userId: 'user_id',
            guildId: 'guild_id',
            mode: 'target',
            target: 2,
          }),
        NonFetalError,
        'Merging is under maintenance, try again later!',
      );
    } finally {
      delete config.synthesis;
    }
  });
});
