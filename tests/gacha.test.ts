// deno-lint-ignore-file no-explicit-any

import {
  assertEquals,
  assertObjectMatch,
  assertRejects,
} from '$std/assert/mod.ts';

import { FakeTime } from '$std/testing/time.ts';

import { assertSpyCalls, returnsNext, stub } from '$std/testing/mock.ts';

import Rating from '~/src/rating.ts';

import gacha, { Pull } from '~/src/gacha.ts';

import utils from '~/src/utils.ts';
import packs from '~/src/packs.ts';

import config from '~/src/config.ts';

import db from '~/db/mod.ts';

import searchIndex, { IndexedCharacter } from '~/search-index/mod.ts';

import {
  Character,
  CharacterRole,
  Media,
  MediaFormat,
  MediaRelation,
  MediaType,
} from '~/src/types.ts';

import { NoPullsError } from '~/src/errors.ts';

Deno.test('adding character to inventory', async (test) => {
  await test.step('normal', async () => {
    const variables = {
      range: [2000, 3000],
      role: CharacterRole.Main,
    };

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
            2000,
            1,
            CharacterRole.Main,
          ),
        ]),
    );

    const rngStub = stub(
      utils,
      'rng',
      returnsNext([
        { value: variables.range, chance: NaN },
        { value: variables.role, chance: NaN },
      ]),
    );

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
      () =>
        Promise.resolve([{
          id: '1',
          packId: 'anilist',
          name: {
            english: 'name',
          },
          media: {
            edges: [{
              role: CharacterRole.Main,
              node: {
                id: 'anime',
                packId: 'anilist',
                popularity: 2500,
                type: MediaType.Anime,
                format: MediaFormat.TV,
                title: {
                  english: 'title',
                },
              },
            }],
          },
        }]),
    );

    try {
      assertObjectMatch(
        await gacha.rngPull({
          userId: 'user_id',
          guildId: 'guild_id',
        }),
        {
          character: {
            id: '1',
            packId: 'anilist',
            media: {
              edges: [
                {
                  node: {
                    format: MediaFormat.TV,
                    id: 'anime',
                    packId: 'anilist',
                    popularity: 2500,
                    title: {
                      english: 'title',
                    },
                    type: MediaType.Anime,
                  },
                  role: CharacterRole.Main,
                },
              ],
            },
            name: {
              english: 'name',
            },
          },
        },
      );

      assertSpyCalls(poolStub, 1);
    } finally {
      poolStub.restore();
      rngStub.restore();
      fetchStub.restore();
      listStub.restore();
      charactersStub.restore();
      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
      addCharacterStub.restore();
    }
  });

  await test.step('character exists', async () => {
    const variables = {
      range: [2000, 3000],
      role: CharacterRole.Main,
    };

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
            2000,
            1,
            CharacterRole.Main,
          ),
        ]),
    );

    const rngStub = stub(
      utils,
      'rng',
      returnsNext([
        { value: variables.range, chance: NaN },
        { value: variables.role, chance: NaN },
      ]),
    );

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
      () => {
        throw new Error('');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const charactersStub = stub(
      packs,
      'characters',
      () =>
        Promise.resolve([{
          id: '1',
          packId: 'anilist',
          name: {
            english: 'name',
          },
          media: {
            edges: [{
              role: CharacterRole.Main,
              node: {
                id: 'anime',
                packId: 'anilist',
                popularity: 2500,
                type: MediaType.Anime,
                format: MediaFormat.TV,
                title: {
                  english: 'title',
                },
              },
            }],
          },
        }]),
    );

    try {
      await assertRejects(
        async () =>
          await gacha.rngPull({
            userId: 'user_id',
            guildId: 'guild_id',
          }),
        Error,
        '',
      );

      assertSpyCalls(poolStub, 1);
    } finally {
      poolStub.restore();
      rngStub.restore();
      fetchStub.restore();
      listStub.restore();
      charactersStub.restore();
      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
      addCharacterStub.restore();
    }
  });

  await test.step('no pulls available', async () => {
    const variables = {
      range: [2000, 3000],
      role: CharacterRole.Main,
    };

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
            2000,
            1,
            CharacterRole.Main,
          ),
        ]),
    );

    const rngStub = stub(
      utils,
      'rng',
      returnsNext([
        { value: variables.range, chance: NaN },
        { value: variables.role, chance: NaN },
      ]),
    );

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
      () => {
        throw new NoPullsError(new Date('2023-02-07T01:00:55.222Z'));
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const charactersStub = stub(
      packs,
      'characters',
      () =>
        Promise.resolve([{
          id: '1',
          packId: 'anilist',
          name: {
            english: 'name',
          },
          media: {
            edges: [{
              role: CharacterRole.Main,
              node: {
                id: 'anime',
                packId: 'anilist',
                popularity: 2500,
                type: MediaType.Anime,
                format: MediaFormat.TV,
                title: {
                  english: 'title',
                },
              },
            }],
          },
        }]),
    );

    try {
      await assertRejects(
        async () =>
          await gacha.rngPull({
            userId: 'user_id',
            guildId: 'guild_id',
          }),
        NoPullsError,
        'NO_PULLS_AVAILABLE',
      );

      assertSpyCalls(poolStub, 1);
    } finally {
      poolStub.restore();
      rngStub.restore();
      fetchStub.restore();
      listStub.restore();
      charactersStub.restore();
      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
      addCharacterStub.restore();
    }
  });

  await test.step('no guarantees', async () => {
    const variables = {
      range: [2000, 3000],
      role: CharacterRole.Main,
    };

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
            2000,
            1,
            CharacterRole.Main,
          ),
        ]),
    );

    const rngStub = stub(
      utils,
      'rng',
      returnsNext([
        { value: variables.range, chance: NaN },
        { value: variables.role, chance: NaN },
      ]),
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const charactersStub = stub(
      packs,
      'characters',
      () =>
        Promise.resolve([{
          id: '1',
          packId: 'anilist',
          name: {
            english: 'name',
          },
          media: {
            edges: [{
              role: CharacterRole.Main,
              node: {
                id: 'anime',
                packId: 'anilist',
                popularity: 2500,
                type: MediaType.Anime,
                format: MediaFormat.TV,
                title: {
                  english: 'title',
                },
              },
            }],
          },
        }]),
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
      () => {
        throw new Error('403');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    try {
      await assertRejects(
        async () =>
          await gacha.rngPull({
            userId: 'user_id',
            guildId: 'guild_id',
            guarantee: 1,
          }),
        Error,
        '403',
      );

      assertSpyCalls(poolStub, 1);
    } finally {
      poolStub.restore();
      rngStub.restore();
      fetchStub.restore();
      listStub.restore();
      charactersStub.restore();
      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
      addCharacterStub.restore();
    }
  });
});

Deno.test('variables', () => {
  assertEquals(gacha.lowest, 1000);

  assertEquals(gacha.variables.roles, {
    10: CharacterRole.Main,
    70: CharacterRole.Supporting,
    20: CharacterRole.Background,
  });

  assertEquals(gacha.variables.ranges, {
    65: [1000, 50_000],
    22: [50_000, 100_000],
    9: [100_000, 200_000],
    3: [200_000, 400_000],
    1: [400_000, Infinity],
  });
});

Deno.test('rating', async (test) => {
  await test.step('1 star', () => {
    let rating = new Rating({
      role: CharacterRole.Background,
      popularity: 1000000,
    });

    assertEquals(rating.stars, 1);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );

    rating = new Rating({ role: CharacterRole.Main, popularity: 0 });

    assertEquals(rating.stars, 1);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );

    rating = new Rating({ popularity: 0 });

    assertEquals(rating.stars, 1);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );
  });

  await test.step('2 stars', () => {
    let rating = new Rating({
      role: CharacterRole.Supporting,
      popularity: 199999,
    });

    assertEquals(rating.stars, 2);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );

    rating = new Rating({
      popularity: 199999,
    });

    assertEquals(rating.stars, 2);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );
  });

  await test.step('3 stars', () => {
    let rating = new Rating({ role: CharacterRole.Main, popularity: 199999 });

    assertEquals(rating.stars, 3);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );

    rating = new Rating({ role: CharacterRole.Supporting, popularity: 250000 });

    assertEquals(rating.stars, 3);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );

    rating = new Rating({ popularity: 250000 });

    assertEquals(rating.stars, 3);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );
  });

  await test.step('4 stars', () => {
    let rating = new Rating({ role: CharacterRole.Main, popularity: 250000 });

    assertEquals(rating.stars, 4);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
    );

    rating = new Rating({ role: CharacterRole.Supporting, popularity: 500000 });

    assertEquals(rating.stars, 4);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
    );

    rating = new Rating({ popularity: 500000 });

    assertEquals(rating.stars, 4);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
    );
  });

  await test.step('5 stars', () => {
    let rating = new Rating({ role: CharacterRole.Main, popularity: 400000 });

    assertEquals(rating.stars, 5);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098>',
    );

    rating = new Rating({ popularity: 1000000 });

    assertEquals(rating.stars, 5);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098>',
    );
  });

  await test.step('fixed rating', () => {
    const rating = new Rating({
      stars: 1,
    });

    assertEquals(rating.stars, 1);
    assertEquals(
      rating.emotes,
      '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
    );
  });

  await test.step('defaults', async (test) => {
    await test.step('undefined popularity with role', () => {
      const rating = new Rating({
        role: CharacterRole.Main,

        popularity: undefined as any,
      });

      assertEquals(rating.stars, 1);
    });

    await test.step('undefined popularity', () => {
      const rating = new Rating({
        popularity: undefined as any,
      });

      assertEquals(rating.stars, 1);
    });
  });
});

Deno.test('/gacha', async (test) => {
  await test.step('normal', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 100,
      title: {
        english: 'title',
      },
      images: [{
        url: 'media_image_url',
      }],
    };

    const character: Character = {
      id: '2',
      packId: 'pack-id-2',
      name: {
        english: 'name',
      },
      images: [{
        url: 'character_image_url',
      }],
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: media,
        }],
      },
    };

    const pull: Pull = {
      media,
      character,
      rating: new Rating({ popularity: 100 }),
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

    const pullStub = stub(
      gacha,
      'rngPull',
      returnsNext([Promise.resolve(pull)]),
    );

    config.gacha = true;
    config.combat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
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

      assertSpyCalls(fetchStub, 2);

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
              url: 'http://localhost:8000/assets/stars/1.gif',
            },
          }],
          components: [],
          attachments: [],
        },
      );

      await timeStub.nextAsync();

      assertSpyCalls(fetchStub, 3);

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
            description: new Rating({ popularity: 100 }).emotes,
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
                custom_id: 'gacha=user_id',
                label: '/gacha',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'character=pack-id-2:2=1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'stats=pack-id-2:2',
                label: '/stats',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id-2:2',
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
      delete config.gacha;
      delete config.combat;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();

      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
    }
  });

  await test.step('fallback', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 100,
      title: {
        english: 'title',
      },
      images: [{
        url: 'media_image_url',
      }],
      relations: {
        edges: [],
      },
    };

    const character: Character = {
      id: '2',
      packId: 'pack-id-2',
      name: {
        english: 'name',
      },
      images: [{
        url: 'character_image_url',
      }],
      media: {
        edges: [{
          role: CharacterRole.Main,
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

    const pullStub = stub(
      gacha,
      'rangePool',
      // deno-lint-ignore require-await
      async () =>
        Promise.resolve({
          pool: [],
          validate: () => false,
        }),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => [character] as any,
    );

    const pullFallbackStub = stub(
      gacha,
      'rangeFallbackPool',
      // deno-lint-ignore require-await
      async () => Promise.resolve([character]) as any,
    );

    const addCharacterStub = stub(
      db,
      'addCharacter',
      // deno-lint-ignore require-await
      async () => undefined,
    );

    config.gacha = true;
    config.combat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
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
          components: [],
          attachments: [],
          embeds: [{
            type: 'rich',
            title: 'title',
            image: {
              url: 'http://localhost:8000/external/media_image_url?size=medium',
            },
          }],
        },
      );

      await timeStub.nextAsync();

      assertSpyCalls(fetchStub, 2);

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
          components: [],
          attachments: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/stars/1.gif',
            },
          }],
        },
      );

      await timeStub.nextAsync();
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
            description: new Rating({ popularity: 100 }).emotes,
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
                custom_id: 'gacha=user_id',
                label: '/gacha',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'character=pack-id-2:2=1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'stats=pack-id-2:2',
                label: '/stats',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id-2:2',
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
      delete config.gacha;
      delete config.combat;

      timeStub.restore();
      pullStub.restore();
      pullFallbackStub.restore();
      fetchStub.restore();
      charactersStub.restore();
      getGuildStub.restore();
      addCharacterStub.restore();
      getInstanceInventoriesStub.restore();
    }
  });

  await test.step('mention', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 100,
      title: {
        english: 'title',
      },
      images: [{
        url: 'media_image_url',
      }],
    };

    const character: Character = {
      id: '2',
      packId: 'pack-id-2',
      name: {
        english: 'name',
      },
      images: [{
        url: 'character_image_url',
      }],
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: media,
        }],
      },
    };

    const pull: Pull = {
      media,
      character,
      rating: new Rating({ popularity: 100 }),
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

    const pullStub = stub(
      gacha,
      'rngPull',
      returnsNext([Promise.resolve(pull)]),
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
        mention: true,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          content: '<@user_id>',
          allowed_mentions: { parse: [] },
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
          content: '<@user_id>',
          allowed_mentions: { parse: [] },
          components: [],
          attachments: [],
          embeds: [{
            type: 'rich',
            title: 'title',
            image: {
              url: 'http://localhost:8000/external/media_image_url?size=medium',
            },
          }],
        },
      );

      await timeStub.nextAsync();

      assertSpyCalls(fetchStub, 2);

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
          content: '<@user_id>',
          allowed_mentions: { parse: [] },
          components: [],
          attachments: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/stars/1.gif',
            },
          }],
        },
      );

      await timeStub.nextAsync();

      assertSpyCalls(fetchStub, 3);

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
          content: '<@user_id>',
          allowed_mentions: { parse: [] },
          attachments: [],
          embeds: [{
            type: 'rich',
            description: new Rating({ popularity: 100 }).emotes,
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
                custom_id: 'gacha=user_id',
                label: '/gacha',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'character=pack-id-2:2=1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id-2:2',
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
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();

      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
    }
  });

  await test.step('quiet', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 100,
      title: {
        english: 'title',
      },
      images: [{
        url: 'media_image_url',
      }],
    };

    const character: Character = {
      id: '2',
      packId: 'pack-id-2',
      name: {
        english: 'name',
      },
      images: [{
        url: 'character_image_url',
      }],
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: media,
        }],
      },
    };

    const pull: Pull = {
      media,
      character,
      rating: new Rating({ popularity: 100 }),
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

    const pullStub = stub(
      gacha,
      'rngPull',
      returnsNext([Promise.resolve(pull)]),
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        quiet: true,
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
          attachments: [],
          embeds: [{
            type: 'rich',
            description: new Rating({ popularity: 100 }).emotes,
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
                custom_id: 'q=user_id',
                label: '/q',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'character=pack-id-2:2=1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id-2:2',
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
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();

      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
    }
  });

  await test.step('likes (character)', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 100,
      title: {
        english: 'title',
      },
      images: [{
        url: 'media_image_url',
      }],
    };

    const character: Character = {
      id: '2',
      packId: 'pack-id-2',
      name: {
        english: 'name',
      },
      images: [{
        url: 'character_image_url',
      }],
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: media,
        }],
      },
    };

    const pull: Pull = {
      media,
      character,
      rating: new Rating({ popularity: 100 }),
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

    const pullStub = stub(
      gacha,
      'rngPull',
      returnsNext([Promise.resolve(pull)]),
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
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

      assertSpyCalls(fetchStub, 2);

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
              url: 'http://localhost:8000/assets/stars/1.gif',
            },
          }],
          components: [],
          attachments: [],
        },
      );

      await timeStub.nextAsync();

      assertSpyCalls(fetchStub, 3);

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
            description: new Rating({ popularity: 100 }).emotes,
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
                custom_id: 'gacha=user_id',
                label: '/gacha',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'character=pack-id-2:2=1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id-2:2',
                label: '/like',
                style: 2,
                type: 2,
              },
            ],
          }],
        },
      );

      await timeStub.runMicrotasks();

      assertSpyCalls(fetchStub, 4);

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
                '<@user_id>\n\n<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
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
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();

      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
    }
  });

  await test.step('likes (media)', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 100,
      title: {
        english: 'title',
      },
      images: [{
        url: 'media_image_url',
      }],
    };

    const character: Character = {
      id: '2',
      packId: 'pack-id-2',
      name: {
        english: 'name',
      },
      images: [{
        url: 'character_image_url',
      }],
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: media,
        }],
      },
    };

    const pull: Pull = {
      media,
      character,
      rating: new Rating({ popularity: 100 }),
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

    const pullStub = stub(
      gacha,
      'rngPull',
      returnsNext([Promise.resolve(pull)]),
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
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

      assertSpyCalls(fetchStub, 2);

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
              url: 'http://localhost:8000/assets/stars/1.gif',
            },
          }],
          components: [],
          attachments: [],
        },
      );

      await timeStub.nextAsync();

      assertSpyCalls(fetchStub, 3);

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
            description: new Rating({ popularity: 100 }).emotes,
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
                custom_id: 'gacha=user_id',
                label: '/gacha',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'character=pack-id-2:2=1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id-2:2',
                label: '/like',
                style: 2,
                type: 2,
              },
            ],
          }],
        },
      );

      await timeStub.runMicrotasks();

      assertSpyCalls(fetchStub, 4);

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
                '<@user_id>\n\n<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
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
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();

      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
    }
  });

  await test.step('likes (relation)', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      format: MediaFormat.TV,
      popularity: 100,
      title: {
        english: 'title',
      },
      images: [{
        url: 'media_image_url',
      }],
      relations: {
        edges: [{
          relation: MediaRelation.Parent,
          node: {
            id: '5',
            packId: 'pack-id',
            type: MediaType.Anime,
            title: {
              english: 'title',
            },
          },
        }],
      },
    };

    const character: Character = {
      id: '2',
      packId: 'pack-id-2',
      name: {
        english: 'name',
      },
      images: [{
        url: 'character_image_url',
      }],
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: media,
        }],
      },
    };

    const pull: Pull = {
      media,
      character,
      rating: new Rating({ popularity: 100 }),
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

    const pullStub = stub(
      gacha,
      'rngPull',
      returnsNext([Promise.resolve(pull)]),
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
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

      assertSpyCalls(fetchStub, 2);

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
              url: 'http://localhost:8000/assets/stars/1.gif',
            },
          }],
          components: [],
          attachments: [],
        },
      );

      await timeStub.nextAsync();

      assertSpyCalls(fetchStub, 3);

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
            description: new Rating({ popularity: 100 }).emotes,
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
                custom_id: 'gacha=user_id',
                label: '/gacha',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'character=pack-id-2:2=1',
                label: '/character',
                style: 2,
                type: 2,
              },
              {
                custom_id: 'like=pack-id-2:2',
                label: '/like',
                style: 2,
                type: 2,
              },
            ],
          }],
        },
      );

      await timeStub.runMicrotasks();

      assertSpyCalls(fetchStub, 4);

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
                '<@user_id>\n\n<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
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
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();

      getGuildStub.restore();
      getInstanceInventoriesStub.restore();
    }
  });

  await test.step('no pulls available', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const pullStub = stub(
      gacha,
      'rngPull',
      // deno-lint-ignore require-await
      async () => {
        throw new NoPullsError(new Date('2023-02-07T00:53:09.199Z'));
      },
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              description: "You don't have any more pulls!",
            },
            { type: 'rich', description: '_+1 pull <t:1675732989:R>_' },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();
    }
  });

  await test.step('no guaranteed', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const pullStub = stub(
      gacha,
      'rngPull',
      // deno-lint-ignore require-await
      async () => {
        throw new Error('403');
      },
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        guarantee: 5,
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
            components: [{
              custom_id: 'buy=bguaranteed=user_id=5',
              label: '/buy guaranteed 5',
              style: 2,
              type: 2,
            }],
          }],
          embeds: [
            {
              type: 'rich',
              description:
                'You don`t have any 5<:smolstar:1107503653956374638>pulls',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();
    }
  });

  await test.step('no more characters', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const pullStub = stub(
      gacha,
      'rangePool',
      // deno-lint-ignore require-await
      async () =>
        Promise.resolve({
          pool: [],
          validate: () => false,
        }),
    );

    const pullFallbackStub = stub(
      gacha,
      'rangeFallbackPool',
      // deno-lint-ignore require-await
      async () => Promise.resolve([]),
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
        token: 'test_token',
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
          embeds: [
            {
              type: 'rich',
              description: 'There are no more characters left in this range',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      pullFallbackStub.restore();
      fetchStub.restore();
    }
  });

  await test.step('no more guaranteed characters', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const pullStub = stub(
      gacha,
      'guaranteedPool',
      // deno-lint-ignore require-await
      async () =>
        Promise.resolve({
          pool: [],
          validate: () => false,
        }),
    );

    config.gacha = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = gacha.start({
        token: 'test_token',
        guildId: 'guild_id',
        guarantee: 5,
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
          embeds: [
            {
              type: 'rich',
              description:
                'There are no more 5<:smolstar:1107503653956374638>characters left',
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.gacha;

      timeStub.restore();
      pullStub.restore();
      fetchStub.restore();
    }
  });
});
