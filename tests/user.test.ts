// deno-lint-ignore-file no-explicit-any prefer-ascii

import { assertEquals } from '$std/assert/mod.ts';

import { FakeTime } from '$std/testing/time.ts';

import { stub } from '$std/testing/mock.ts';

import utils from '~/src/utils.ts';

import user from '~/src/user.ts';
import packs from '~/src/packs.ts';

import config from '~/src/config.ts';

import db from '~/db/mod.ts';

import {
  type Character,
  CharacterRole,
  type Media,
  MediaFormat,
  MediaRelation,
  MediaType,
} from '~/src/types.ts';
import { DisaggregatedMedia } from '~/src/types.ts';

Deno.test('/now', async (test) => {
  await test.step('with pulls', async () => {
    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 5,
          stealTimestamp: null,
          rechargeTimestamp: null,
          user: {},
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**5**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'gacha=user_id',
                  label: '/gacha',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('no pulls', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 0,
          stealTimestamp: null,
          rechargeTimestamp: time,
          user: {},
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**0**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
          ],
          components: [],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('no pulls with mention', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 0,
          stealTimestamp: null,
          rechargeTimestamp: time,
          user: {},
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
        mention: true,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          content: '<@user_id>',
          allowed_mentions: { parse: [] },
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**0**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
          ],
          components: [],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with keys (no cleared floors)', async () => {
    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 5,
          stealTimestamp: null,
          rechargeTimestamp: null,
          availableKeys: 5,
          lastPVE: new Date(),
          user: {},
        }) as any,
    );

    config.appId = 'app_id';
    config.combat = true;

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**5**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            {
              type: 'rich',
              title: '**5**',
              footer: {
                text: 'Available Keys',
              },
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'gacha=user_id',
                  label: '/gacha',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
        },
      });
    } finally {
      delete config.appId;
      delete config.combat;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with keys (1 floor cleared)', async () => {
    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 5,
          stealTimestamp: null,
          rechargeTimestamp: null,
          availableKeys: 5,
          lastPVE: new Date(),
          floorsCleared: 1,
          user: {},
        }) as any,
    );

    config.appId = 'app_id';
    config.combat = true;

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**5**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            {
              type: 'rich',
              title: '**5**',
              footer: {
                text: 'Available Keys',
              },
            },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'gacha=user_id',
                  label: '/gacha',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'treclear=user_id',
                  label: '/reclear',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
        },
      });
    } finally {
      delete config.appId;
      delete config.combat;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('no keys', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 0,
          availableKeys: 0,
          stealTimestamp: null,
          rechargeTimestamp: time,
          keysTimestamp: time,
          lastPVE: new Date(),
          user: {},
        }) as any,
    );

    config.appId = 'app_id';
    config.combat = true;

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**0**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            {
              type: 'rich',
              title: '**0**',
              footer: {
                text: 'Available Keys',
              },
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
            { type: 'rich', description: '_+1 key <t:1675569706:R>_' },
          ],
          components: [],
        },
      });
    } finally {
      delete config.appId;
      delete config.combat;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with 1 token', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 0,
          stealTimestamp: null,
          rechargeTimestamp: time,
          user: {
            availableTokens: 1,
          },
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**0**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            {
              type: 'rich',
              title: '**1**',
              footer: {
                text: 'Daily Token',
              },
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
          ],
          components: [],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with 4 tokens', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 0,
          stealTimestamp: null,
          rechargeTimestamp: time,
          user: {
            availableTokens: 4,
          },
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**0**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            {
              type: 'rich',
              title: '**4**',
              footer: {
                text: 'Daily Tokens',
              },
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
          ],
          components: [],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with 28 tokens', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 4,
          stealTimestamp: null,
          rechargeTimestamp: time,
          user: { availableTokens: 28 },
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**4**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            {
              type: 'rich',
              title: '**28**',
              footer: {
                text: 'Daily Tokens',
              },
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
          ],
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
                custom_id: 'buy=bguaranteed=user_id=5',
                label: '/buy guaranteed 5',
                style: 2,
                type: 2,
              },
            ],
          }],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with 27 tokens', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 4,
          stealTimestamp: null,
          rechargeTimestamp: time,
          user: { availableTokens: 27 },
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**4**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            {
              type: 'rich',
              title: '**27**',
              footer: {
                text: 'Daily Tokens',
              },
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
          ],
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
                custom_id: 'buy=bguaranteed=user_id=4',
                label: '/buy guaranteed 4',
                style: 2,
                type: 2,
              },
            ],
          }],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with guarantees', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 4,
          stealTimestamp: null,
          rechargeTimestamp: time,
          user: {
            availableTokens: 5,
            guarantees: [5, 5, 4, 4, 3],
          },
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**4**',
              footer: {
                text: 'Available Pulls',
              },
              description:
                '5<:smolstar:1107503653956374638>4<:smolstar:1107503653956374638>3<:smolstar:1107503653956374638>',
            },
            {
              type: 'rich',
              title: '**5**',
              footer: {
                text: 'Daily Tokens',
              },
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
          ],
          components: [{
            type: 1,
            components: [
              {
                style: 2,
                type: 2,
                custom_id: 'gacha=user_id',
                label: '/gacha',
              },
              {
                style: 2,
                type: 2,
                custom_id: 'pull=user_id=5',
                label: '/pull 5',
              },
            ],
          }],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with steal cooldown', async () => {
    const timestamp = new Date('2023-02-05T03:21:46.253Z');

    const timeStub = new FakeTime(timestamp);

    timestamp.setDate(timestamp.getDate() + 2);

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 5,
          stealTimestamp: timestamp,
          rechargeTimestamp: null,
          user: {},
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**5**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },

            {
              type: 'rich',
              description: '_Steal cooldown ends <t:1675999306:R>_',
            },
          ],
          components: [{
            type: 1,
            components: [
              {
                type: 2,
                style: 2,
                custom_id: 'gacha=user_id',
                label: '/gacha',
              },
            ],
          }],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
      timeStub.restore();
    }
  });

  await test.step('with notice', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 0,
          stealTimestamp: null,
          rechargeTimestamp: time,
          user: {},
        }) as any,
    );

    config.appId = 'app_id';

    config.notice = '**test**\\n_message_';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**0**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            {
              description: '**test**\n_message_',
              type: 'rich',
            },
            { type: 'rich', description: '_+1 pull <t:1675569106:R>_' },
          ],
          components: [],
        },
      });
    } finally {
      delete config.appId;

      delete config.notice;

      rechargeConsumablesStub.restore();
    }
  });

  await test.step('with daily tokens cooldown', async () => {
    const time = new Date('2023-02-05T03:21:46.253Z');

    const rechargeConsumablesStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          availablePulls: 5,
          user: {
            dailyTimestamp: time,
          },
        }) as any,
    );

    config.appId = 'app_id';

    try {
      const message = await user.now({
        userId: 'user_id',
        guildId: 'guild_id',
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          embeds: [
            {
              type: 'rich',
              title: '**5**',
              footer: {
                text: 'Available Pulls',
              },
              description: undefined,
            },
            { type: 'rich', description: '_+1 daily token <t:1675610506:R>_' },
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'gacha=user_id',
                  label: '/gacha',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
        },
      });
    } finally {
      delete config.appId;

      rechargeConsumablesStub.restore();
    }
  });
});

Deno.test('/nick', async (test) => {
  await test.step('changed', async () => {
    const media: Media = {
      id: '2',
      type: MediaType.Anime,
      packId: 'anilist',
      format: MediaFormat.TV,
      popularity: 0,
      title: {
        english: 'title',
      },
    };

    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'name 1',
      },
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

    const setCharacterNicknameStub = stub(
      db,
      'setCharacterNickname',
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.nick({
        token: 'test_token',
        userId: 'user',
        guildId: 'guild_id',
        id: 'anilist:1',
        nick: 'new_nickname',
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
              description:
                "name 1's nickname has been changed to **new_nickname**",
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**new_nickname**',
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

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      characterStub.restore();
      setCharacterNicknameStub.restore();
    }
  });

  await test.step('reset', async () => {
    const media: Media = {
      id: '2',
      type: MediaType.Anime,
      packId: 'anilist',
      format: MediaFormat.TV,
      popularity: 0,
      title: {
        english: 'title',
      },
    };

    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'name 1',
      },
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

    const setCharacterNicknameStub = stub(
      db,
      'setCharacterNickname',
      () =>
        ({
          id: 'anilist:1',
          mediaId: 'anilist:0',
          image: 'image_url',
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.nick({
        token: 'test_token',
        userId: 'user',
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
              description: "name 1's nickname has been reset",
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 1**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
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
      characterStub.restore();
      setCharacterNicknameStub.restore();
    }
  });

  await test.step('not found', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const setCharacterNicknameStub = stub(
      db,
      'setCharacterNickname',
      () => {
        throw new Error('CHARACTER_NOT_FOUND');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.nick({
        token: 'test_token',
        userId: 'user',
        guildId: 'guild_id',
        id: 'anilist:1',
        nick: 'new_nick',
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
              description: 'Found _nothing_ matching that query!',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      setCharacterNicknameStub.restore();
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

    const setCharacterNicknameStub = stub(
      db,
      'setCharacterNickname',
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.nick({
        token: 'test_token',
        userId: 'user',
        guildId: 'guild_id',

        id: 'anilist:1',
        nick: 'new_nick',
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
      characterStub.restore();
      setCharacterNicknameStub.restore();
    }
  });

  await test.step('character not owned', async () => {
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

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const setCharacterNicknameStub = stub(
      db,
      'setCharacterNickname',
      () => {
        throw new Error('CHARACTER_NOT_OWNED');
      },
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.nick({
        token: 'test_token',
        userId: 'user',
        guildId: 'guild_id',
        id: 'anilist:1',
        nick: 'new_nick',
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
              description: 'name 1 is not owned by you',
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
      characterStub.restore();
      setCharacterNicknameStub.restore();
    }
  });
});

Deno.test('/image', async (test) => {
  await test.step('changed', async () => {
    const media: Media = {
      id: '2',
      type: MediaType.Anime,
      packId: 'anilist',
      format: MediaFormat.TV,
      popularity: 0,
      title: {
        english: 'title',
      },
    };

    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'name 1',
      },
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

    const setCharacterImageStub = stub(
      db,
      'setCharacterImage',
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.image({
        token: 'test_token',
        userId: 'user',
        guildId: 'guild_id',
        id: 'anilist:1',
        image: 'new_image',
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
              description: "name 1's image has been **changed**",
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**name 1**',
                },
              ],
              image: {
                url: 'http://localhost:8000/external/new_image',
              },
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
      characterStub.restore();
      setCharacterImageStub.restore();
    }
  });

  await test.step('reset', async () => {
    const media: Media = {
      id: '2',
      type: MediaType.Anime,
      packId: 'anilist',
      format: MediaFormat.TV,
      popularity: 0,
      title: {
        english: 'title',
      },
    };

    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'name 1',
      },
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

    const setCharacterImageStub = stub(
      db,
      'setCharacterImage',
      () =>
        ({
          id: 'anilist:1',
          mediaId: 'anilist:0',
          nickname: 'nickname',
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.image({
        token: 'test_token',
        userId: 'user',
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
              description: "name 1's image has been reset",
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**nickname**',
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

      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      timeStub.restore();
      mediaStub.restore();
      characterStub.restore();
      setCharacterImageStub.restore();
    }
  });

  await test.step('not found', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const setCharacterImageStub = stub(
      db,
      'setCharacterImage',
      () => {
        throw new Error('CHARACTER_NOT_FOUND');
      },
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const charactersStub = stub(
      packs,
      'characters',
      () => Promise.resolve([]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.image({
        token: 'test_token',
        userId: 'user',
        guildId: 'guild_id',
        id: 'anilist:1',
        image: 'new_image',
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
              description: 'Found _nothing_ matching that query!',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      timeStub.restore();
      mediaStub.restore();
      charactersStub.restore();
      setCharacterImageStub.restore();
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

    const setCharacterImageStub = stub(
      db,
      'setCharacterImage',
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.image({
        token: 'test_token',
        userId: 'user',
        guildId: 'guild_id',
        id: 'anilist:1',
        image: 'new_image',
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
      characterStub.restore();
      setCharacterImageStub.restore();
    }
  });

  await test.step('character not owned', async () => {
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

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const setCharacterImageStub = stub(
      db,
      'setCharacterImage',
      () => {
        throw new Error('CHARACTER_NOT_OWNED');
      },
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve([]),
    );

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.image({
        token: 'test_token',
        userId: 'user',
        guildId: 'guild_id',
        id: 'anilist:1',
        image: 'new_image',
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
              description: 'name 1 is not owned by you',
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
      characterStub.restore();
      setCharacterImageStub.restore();
    }
  });
});

Deno.test('/collection stars', async (test) => {
  await test.step('normal', async () => {
    const media: Media[] = [
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 3',
        },
      },
      {
        id: '8',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 4',
        },
      },
      {
        id: '10',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 5',
        },
      },
      {
        id: '12',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 6',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[1],
          }],
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '7',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[3],
          }],
        },
      },
      {
        id: '9',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[4],
          }],
        },
      },
      {
        id: '11',
        packId: 'anilist',
        name: {
          english: 'character 6',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[5],
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
            mediaId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            rating: 2,
          },
          {
            characterId: 'anilist:5',
            mediaId: 'anilist:6',
            rating: 3,
          },
          {
            characterId: 'anilist:7',
            mediaId: 'anilist:8',
            rating: 4,
          },
          {
            characterId: 'anilist:9',
            mediaId: 'anilist:10',
            rating: 5,
          },
          {
            characterId: 'anilist:11',
            mediaId: 'anilist:12',
            rating: 1,
          },
        ] as any,
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        rating: 1,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id==1==0=prev',
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
                  custom_id: 'list=user_id==1==0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title 1',
                  value: '1<:smolstar:1107503653956374638> character 1',
                },
                {
                  inline: false,
                  name: 'title 6',
                  value: '1<:smolstar:1107503653956374638> character 6',
                },
              ],
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
      mediaStub.restore();
      characterStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('picture full view', async () => {
    const media: Media[] = [
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 3',
        },
      },
      {
        id: '8',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 4',
        },
      },
      {
        id: '10',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 5',
        },
      },
      {
        id: '12',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 6',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        description: 'small description',
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[1],
          }],
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '7',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[3],
          }],
        },
      },
      {
        id: '9',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[4],
          }],
        },
      },
      {
        id: '11',
        packId: 'anilist',
        name: {
          english: 'character 6',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[5],
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
            mediaId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            rating: 2,
          },
          {
            characterId: 'anilist:5',
            mediaId: 'anilist:6',
            rating: 3,
          },
          {
            characterId: 'anilist:7',
            mediaId: 'anilist:8',
            rating: 4,
          },
          {
            characterId: 'anilist:9',
            mediaId: 'anilist:10',
            rating: 5,
          },
          {
            characterId: 'anilist:11',
            mediaId: 'anilist:12',
            rating: 1,
          },
        ] as any,
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        rating: 1,
        picture: true,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id==1=1=1=prev',
                  label: 'Prev',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: '_',
                  disabled: true,
                  label: '1/2',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'list=user_id==1=1=1=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'title 1',
                  value: '**character 1**',
                },
                {
                  name: '\u200b',
                  value: 'small description',
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

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      mediaStub.restore();
      characterStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('with nicknames', async () => {
    const media: Media[] = [
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 3',
        },
      },
      {
        id: '8',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 4',
        },
      },
      {
        id: '10',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 5',
        },
      },
      {
        id: '12',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 6',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[1],
          }],
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '7',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[3],
          }],
        },
      },
      {
        id: '9',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[4],
          }],
        },
      },
      {
        id: '11',
        packId: 'anilist',
        name: {
          english: 'character 6',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[5],
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
            mediaId: 'anilist:2',
            nickname: 'nickname 1',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            nickname: 'nickname 2',
            rating: 2,
          },
          {
            characterId: 'anilist:5',
            mediaId: 'anilist:6',
            nickname: 'nickname 3',
            rating: 3,
          },
          {
            characterId: 'anilist:7',
            mediaId: 'anilist:8',
            nickname: 'nickname 4',
            rating: 4,
          },
          {
            characterId: 'anilist:9',
            mediaId: 'anilist:10',
            nickname: 'nickname 5',
            rating: 5,
          },
          {
            characterId: 'anilist:11',
            mediaId: 'anilist:12',
            nickname: 'nickname 6',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        rating: 1,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id==1==0=prev',
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
                  custom_id: 'list=user_id==1==0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title 1',
                  value: '1<:smolstar:1107503653956374638> nickname 1',
                },
                {
                  inline: false,
                  name: 'title 6',
                  value: '1<:smolstar:1107503653956374638> nickname 6',
                },
              ],
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
      mongoClientStub.restore();

      characterStub.restore();
      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('with likes', async () => {
    const media: Media[] = [
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 3',
        },
      },
      {
        id: '8',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 4',
        },
      },
      {
        id: '10',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 5',
        },
      },
      {
        id: '12',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 6',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[1],
          }],
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '7',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[3],
          }],
        },
      },
      {
        id: '9',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[4],
          }],
        },
      },
      {
        id: '11',
        packId: 'anilist',
        name: {
          english: 'character 6',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[5],
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
              { mediaId: 'anilist:12' },
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
            mediaId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            rating: 2,
          },
          {
            characterId: 'anilist:5',
            mediaId: 'anilist:6',
            rating: 3,
          },
          {
            characterId: 'anilist:7',
            mediaId: 'anilist:8',
            rating: 4,
          },
          {
            characterId: 'anilist:9',
            mediaId: 'anilist:10',
            rating: 5,
          },
          {
            characterId: 'anilist:11',
            mediaId: 'anilist:12',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        rating: 1,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id==1==0=prev',
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
                  custom_id: 'list=user_id==1==0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title 1',
                  value:
                    '1<:smolstar:1107503653956374638><:liked:1110491720375873567> character 1',
                },
                {
                  inline: false,
                  name: 'title 6',
                  value: '1<:smolstar:1107503653956374638> character 6',
                },
              ],
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
      characterStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('with likes and party', async () => {
    const media: Media[] = [
      {
        id: '0',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
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
          english: 'character 2',
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({
        likes: [
          { characterId: 'anilist:1' },
          { characterId: 'anilist:2' },
        ],
      } as any),
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
            member1Id: '1',
          },
          user: {
            likes: [
              { characterId: 'anilist:1' },
              { characterId: 'anilist:2' },
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
            _id: '1',
            characterId: 'anilist:1',
            mediaId: 'anilist:0',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            mediaId: 'anilist:0',
            rating: 1,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        rating: 1,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id==1==0=prev',
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
                  custom_id: 'list=user_id==1==0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title 1',
                  value:
                    '1<:smolstar:1107503653956374638><:partymember:1135706921312206921> character 1',
                },
                {
                  inline: false,
                  name: 'title 1',
                  value:
                    '1<:smolstar:1107503653956374638><:liked:1110491720375873567> character 2',
                },
              ],
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
      characterStub.restore();
      mongoClientStub.restore();

      getUserStub.restore();
      getGuildStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('media disabled', async () => {
    const media: Media[] = [
      {
        id: '1',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '2',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[1],
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
            characterId: 'anilist:3',
            mediaId: 'anilist:1',
            rating: 1,
          },
          {
            characterId: 'anilist:4',
            mediaId: 'anilist:2',
            rating: 2,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(
      packs,
      'isDisabled',
      (id) => id === 'anilist:1',
    );

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
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
              components: [
                {
                  custom_id: 'list=user_id====0=prev',
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
                  custom_id: 'list=user_id====0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title 2',
                  value: '2<:smolstar:1107503653956374638> character 2',
                },
              ],
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
      characterStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('no characters (Dave)', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        nick: true,
        userId: 'another_user_id',
        guildId: 'guild_id',
        token: 'test_token',
        rating: 5,
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
          embeds: [{
            type: 'rich',
            description:
              "<@another_user_id> doesn't have any 5<:smolstar:1107503653956374638>characters",
          }],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('no characters (Self)', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
      () => ({ party: {}, user: { likes: [] } }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
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
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        rating: 5,
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
              custom_id: 'gacha=user_id',
              label: '/gacha',
              style: 2,
              type: 2,
            }],
          }],
          embeds: [{
            type: 'rich',
            description:
              "You don't have any 5<:smolstar:1107503653956374638>characters",
          }],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();

      getUserStub.restore();
      getGuildStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });
});

Deno.test('/collection media', async (test) => {
  await test.step('normal', async () => {
    const media: Media[] = [
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[1],
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
            mediaId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            rating: 2,
          },
        ] as any,
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id=anilist:2===0=prev',
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
                  custom_id: 'list=user_id=anilist:2===0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title 1',
                  value: '1<:smolstar:1107503653956374638> character 1',
                },
              ],
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
      mediaStub.restore();
      characterStub.restore();
      mongoClientStub.restore();

      getUserCharactersStub.restore();
      getInventoryStub.restore();
    }
  });

  await test.step('with nicknames', async () => {
    const media: Media[] = [
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
            mediaId: 'anilist:2',
            nickname: 'nickname 1',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            nickname: 'nickname 2',
            rating: 2,
          },
        ] as any,
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id=anilist:2===0=prev',
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
                  custom_id: 'list=user_id=anilist:2===0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title 1',
                  value: '1<:smolstar:1107503653956374638> nickname 1',
                },
              ],
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
      mediaStub.restore();
      characterStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('with relations', async () => {
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
          english: 'character 1',
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
          english: 'character 2',
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
          english: 'character 3',
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
            mediaId: 'anilist:4',
            rating: 1,
          },
          {
            characterId: 'anilist:2',
            mediaId: 'anilist:5',
            rating: 2,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            rating: 4,
          },
        ] as any,
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id=anilist:4===0=prev',
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
                  custom_id: 'list=user_id=anilist:4===0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title',
                  value: '4<:smolstar:1107503653956374638> character 3',
                },
                {
                  inline: false,
                  name: 'title',
                  value: '1<:smolstar:1107503653956374638> character 1',
                },
                {
                  inline: false,
                  name: 'title 2',
                  value: '2<:smolstar:1107503653956374638> character 2',
                },
              ],
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
      mediaStub.restore();
      characterStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('picture full view', async () => {
    const media: Media[] = [
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        description: 'small description',
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[1],
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
            mediaId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            rating: 2,
          },
        ] as any,
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'anilist:2',
        picture: true,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'list=user_id=anilist:2==1=0=prev',
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
                  custom_id: 'list=user_id=anilist:2==1=0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'title 1',
                  value: '**character 1**',
                },
                {
                  name: '\u200b',
                  value: 'small description',
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

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      mediaStub.restore();
      characterStub.restore();
      mongoClientStub.restore();

      getUserCharactersStub.restore();
      getInventoryStub.restore();
    }
  });

  await test.step('media disabled', async () => {
    const media: Media[] = [
      {
        id: '2',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[0],
          }],
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: media[1],
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

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
      () => ({ party: {}, user: { likes: [] } }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            mediaId: 'anilist:2',
            rating: 1,
          },
          {
            characterId: 'anilist:3',
            mediaId: 'anilist:4',
            rating: 2,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(
      packs,
      'isDisabled',
      () => true,
    );

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();

      mongoClientStub.restore();
      getUserStub.restore();
      getGuildStub.restore();
      mediaStub.restore();
      characterStub.restore();
      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('no characters (Dave)', async () => {
    const media: Media[] = [
      {
        id: '2',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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
      () => ({ party: {}, user: { likes: [] } }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () => [] as any,
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'another_user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'anilist:2',
        nick: true,
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
              description:
                "<@another_user_id> doesn't have any characters from title 1",
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
      mediaStub.restore();
      characterStub.restore();
      mongoClientStub.restore();

      getUserStub.restore();
      getGuildStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('no characters (Self)', async () => {
    const media: Media[] = [
      {
        id: '2',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
      },
      {
        id: '4',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
      },
    ];

    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
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

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.list({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'gacha=user_id',
                  label: '/gacha',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              description: "You don't have any characters from title 1",
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
      mediaStub.restore();
      characterStub.restore();
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });
});

Deno.test('/collection sum', async (test) => {
  await test.step('normal', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({
        likes: [],
      } as any),
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
            _id: '1',
            characterId: 'anilist:1',
            mediaId: 'anilist:0',
            rating: 1,
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
      const message = user.sum({
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

      const t = [
        '1<:smolstar:1107503653956374638> — **1 character** — 0 <:liked:1110491720375873567>(1)',
        '2<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '3<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '4<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '5<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
      ];

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
              description: t.join('\n'),
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
      mongoClientStub.restore();

      getUserStub.restore();
      getGuildStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('with liked characters', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {},
          user: { likes: [{ characterId: 'anilist:1' }] },
        }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            _id: '1',
            characterId: 'anilist:1',
            mediaId: 'anilist:0',
            rating: 1,
          },
          {
            _id: '2',
            characterId: 'anilist:2',
            mediaId: 'anilist:0',
            rating: 1,
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
      const message = user.sum({
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

      const t = [
        '1<:smolstar:1107503653956374638> — **2 characters** — 1 <:liked:1110491720375873567>(1)',
        '2<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '3<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '4<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '5<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
      ];

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
              description: t.join('\n'),
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
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('with liked media', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {},
          user: { likes: [{ mediaId: 'anilist:0' }] },
        }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            _id: '1',
            characterId: 'anilist:1',
            mediaId: 'anilist:0',
            rating: 1,
          },
          {
            _id: '2',
            characterId: 'anilist:2',
            mediaId: 'anilist:10',
            rating: 1,
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
      const message = user.sum({
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

      const t = [
        '1<:smolstar:1107503653956374638> — **2 characters** — 1 <:liked:1110491720375873567>(1)',
        '2<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '3<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '4<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '5<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
      ];

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
              description: t.join('\n'),
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
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('with likes and party', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: { member1Id: '1' },
          user: { likes: [{ characterId: 'anilist:2' }] },
        }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          {
            _id: '1',
            characterId: 'anilist:1',
            mediaId: 'anilist:0',
            rating: 1,
          },
          {
            _id: '2',
            characterId: 'anilist:2',
            mediaId: 'anilist:0',
            rating: 1,
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
      const message = user.sum({
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

      const t = [
        '1<:smolstar:1107503653956374638> — **2 characters** — 2 <:liked:1110491720375873567>(0)',
        '2<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '3<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '4<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
        '5<:smolstar:1107503653956374638> — **0 characters** — 0 <:liked:1110491720375873567>(0)',
      ];

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
              description: t.join('\n'),
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
      mongoClientStub.restore();

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });
});

Deno.test('/collection show', async (test) => {
  await test.step('normal', async () => {
    const media: DisaggregatedMedia[] = [
      {
        id: '1',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
        characters: [{ role: CharacterRole.Main, characterId: 'anilist:11' }],
      },
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
        characters: [{ role: CharacterRole.Main, characterId: 'anilist:12' }],
      },
      {
        id: '3',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 3',
        },
        characters: [{ role: CharacterRole.Main, characterId: 'anilist:13' }],
      },
      {
        id: '4',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 4',
        },
        characters: [{ role: CharacterRole.Main, characterId: 'anilist:14' }],
      },
      {
        id: '5',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 5',
        },
        characters: [{ role: CharacterRole.Main, characterId: 'anilist:15' }],
      },
      {
        id: '6',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 6',
        },
        characters: [{ role: CharacterRole.Main, characterId: 'anilist:16' }],
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({ likes: [] }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          { characterId: 'anilist:11', mediaId: 'anilist:1' },
          { characterId: 'anilist:12', mediaId: 'anilist:2' },
          { characterId: 'anilist:13', mediaId: 'anilist:3' },
          { characterId: 'anilist:14', mediaId: 'anilist:4' },
          { characterId: 'anilist:15', mediaId: 'anilist:5' },
          { characterId: 'anilist:15', mediaId: 'anilist:6' },
        ] as any,
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

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.showcase({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
            components: [{
              custom_id: 'showcase=user_id=1=prev',
              label: 'Prev',
              style: 2,
              type: 2,
            }, {
              custom_id: '_',
              disabled: true,
              label: '1/2',
              style: 2,
              type: 2,
            }, {
              custom_id: 'showcase=user_id=1=next',
              label: 'Next',
              style: 2,
              type: 2,
            }],
          }],
          embeds: [
            {
              type: 'rich',
              fields: [{
                inline: false,
                name: 'title 1',
                value: '~~100% — 1 / 1~~',
              }, {
                inline: false,
                name: 'title 2',
                value: '~~100% — 1 / 1~~',
              }, {
                inline: false,
                name: 'title 3',
                value: '~~100% — 1 / 1~~',
              }, {
                inline: false,
                name: 'title 4',
                value: '~~100% — 1 / 1~~',
              }, {
                inline: false,
                name: 'title 5',
                value: '~~100% — 1 / 1~~',
              }],
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
      mediaStub.restore();
      getUserStub.restore();
      getUserCharactersStub.restore();
      mongoClientStub.restore();
      getMediaCharactersStub.restore();
    }
  });

  await test.step('sort by owned', async () => {
    const media: DisaggregatedMedia[] = [
      {
        id: '1',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
        characters: [
          { role: CharacterRole.Main, characterId: 'anilist:11' },
          { role: CharacterRole.Main, characterId: 'anilist:12' },
          { role: CharacterRole.Main, characterId: 'anilist:13' },
        ],
      },
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
        characters: [
          { role: CharacterRole.Main, characterId: 'anilist:14' },
          { role: CharacterRole.Main, characterId: 'anilist:15' },
        ],
      },
      {
        id: '3',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 3',
        },
        characters: [
          { role: CharacterRole.Main, characterId: 'anilist:16' },
          { role: CharacterRole.Main, characterId: 'anilist:17' },
        ],
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({ likes: [] }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          { characterId: 'anilist:11', mediaId: 'anilist:1' },
          { characterId: 'anilist:14', mediaId: 'anilist:2' },
          { characterId: 'anilist:15', mediaId: 'anilist:2' },
          { characterId: 'anilist:16', mediaId: 'anilist:3' },
        ] as any,
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

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.showcase({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
            components: [{
              custom_id: 'showcase=user_id=0=prev',
              label: 'Prev',
              style: 2,
              type: 2,
            }, {
              custom_id: '_',
              disabled: true,
              label: '1/1',
              style: 2,
              type: 2,
            }, {
              custom_id: 'showcase=user_id=0=next',
              label: 'Next',
              style: 2,
              type: 2,
            }],
          }],
          embeds: [
            {
              type: 'rich',
              fields: [{
                inline: false,
                name: 'title 2',
                value: '~~100% — 2 / 2~~',
              }, {
                inline: false,
                name: 'title 1',
                value: '33% — 1 / 3',
              }, {
                inline: false,
                name: 'title 3',
                value: '50% — 1 / 2',
              }],
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
      mediaStub.restore();
      getUserStub.restore();
      getUserCharactersStub.restore();
      mongoClientStub.restore();
      getMediaCharactersStub.restore();
    }
  });

  await test.step('sort by liked then owned', async () => {
    const media: DisaggregatedMedia[] = [
      {
        id: '1',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
        characters: [
          { role: CharacterRole.Main, characterId: 'anilist:11' },
        ],
      },
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
        characters: [
          { role: CharacterRole.Main, characterId: 'anilist:12' },
          { role: CharacterRole.Main, characterId: 'anilist:13' },
          { role: CharacterRole.Main, characterId: 'anilist:14' },
        ],
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () =>
        ({
          likes: [
            { mediaId: 'anilist:1' },
          ],
        }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          { characterId: 'anilist:11', mediaId: 'anilist:1' },
          { characterId: 'anilist:12', mediaId: 'anilist:2' },
          { characterId: 'anilist:13', mediaId: 'anilist:2' },
          { characterId: 'anilist:14', mediaId: 'anilist:2' },
        ] as any,
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

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.showcase({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
            components: [{
              custom_id: 'showcase=user_id=0=prev',
              label: 'Prev',
              style: 2,
              type: 2,
            }, {
              custom_id: '_',
              disabled: true,
              label: '1/1',
              style: 2,
              type: 2,
            }, {
              custom_id: 'showcase=user_id=0=next',
              label: 'Next',
              style: 2,
              type: 2,
            }],
          }],
          embeds: [
            {
              type: 'rich',
              fields: [{
                inline: false,
                name: 'title 1 <:liked:1110491720375873567>',
                value: '~~100% — 1 / 1~~',
              }, {
                inline: false,
                name: 'title 2',
                value: '~~100% — 3 / 3~~',
              }],
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
      mediaStub.restore();
      getUserStub.restore();
      getUserCharactersStub.restore();
      mongoClientStub.restore();
      getMediaCharactersStub.restore();
    }
  });

  await test.step('aggregate liked media relations', async () => {
    const media: DisaggregatedMedia[] = [
      {
        id: '1',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
        popularity: 2000,
        characters: [{ role: CharacterRole.Main, characterId: 'anilist:11' }],
        relations: [{ relation: MediaRelation.Parent, mediaId: '2' }],
      },
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
        popularity: 1000,
        characters: [{ role: CharacterRole.Main, characterId: 'anilist:12' }],
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () =>
        ({
          likes: [
            { mediaId: 'anilist:1' },
          ],
        }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          { characterId: 'anilist:11', mediaId: 'anilist:1' },
          { characterId: 'anilist:12', mediaId: 'anilist:2' },
        ] as any,
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

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.showcase({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
            components: [{
              custom_id: 'showcase=user_id=0=prev',
              label: 'Prev',
              style: 2,
              type: 2,
            }, {
              custom_id: '_',
              disabled: true,
              label: '1/1',
              style: 2,
              type: 2,
            }, {
              custom_id: 'showcase=user_id=0=next',
              label: 'Next',
              style: 2,
              type: 2,
            }],
          }],
          embeds: [
            {
              type: 'rich',
              fields: [{
                inline: false,
                name: 'title 1 <:liked:1110491720375873567>',
                value: '~~100% — 1 / 1~~',
              }, {
                inline: false,
                name: 'title 2 <:liked:1110491720375873567>',
                value: '~~100% — 1 / 1~~',
              }],
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
      mediaStub.restore();
      getUserStub.restore();
      mongoClientStub.restore();
      getUserCharactersStub.restore();
      getMediaCharactersStub.restore();
    }
  });

  await test.step('filter out background characters', async () => {
    const media: DisaggregatedMedia[] = [
      {
        id: '1',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
        characters: [
          { role: CharacterRole.Supporting, characterId: 'anilist:11' },
          { role: CharacterRole.Main, characterId: 'anilist:12' },
          { role: CharacterRole.Background, characterId: 'anilist:13' },
          { role: CharacterRole.Background, characterId: 'anilist:14' },
        ],
      },
      {
        id: '2',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 2',
        },
        characters: [
          { role: CharacterRole.Main, characterId: 'anilist:15' },
          { role: CharacterRole.Background, characterId: 'anilist:16' },
        ],
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({ likes: [] }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          { characterId: 'anilist:11', mediaId: 'anilist:1' },
          { characterId: 'anilist:12', mediaId: 'anilist:1' },
          { characterId: 'anilist:13', mediaId: 'anilist:1' },
          { characterId: 'anilist:16', mediaId: 'anilist:2' },
        ] as any,
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

    const mediaStub = stub(
      packs,
      'media',
      () => Promise.resolve(media),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.showcase({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
            components: [{
              custom_id: 'showcase=user_id=0=prev',
              label: 'Prev',
              style: 2,
              type: 2,
            }, {
              custom_id: '_',
              disabled: true,
              label: '1/1',
              style: 2,
              type: 2,
            }, {
              custom_id: 'showcase=user_id=0=next',
              label: 'Next',
              style: 2,
              type: 2,
            }],
          }],
          embeds: [
            {
              type: 'rich',
              fields: [{
                inline: false,
                name: 'title 1',
                value: '~~100% — 2 / 2~~',
              }, {
                inline: false,
                name: 'title 2',
                value: '0% — 0 / 1',
              }],
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
      mediaStub.restore();
      getUserStub.restore();
      getUserCharactersStub.restore();
      mongoClientStub.restore();
      getMediaCharactersStub.restore();
    }
  });

  await test.step('owned by others', async () => {
    const media: DisaggregatedMedia[] = [
      {
        id: '1',
        packId: 'anilist',
        type: MediaType.Anime,
        title: {
          english: 'title 1',
        },
        characters: [
          { role: CharacterRole.Main, characterId: 'anilist:11' },
          { role: CharacterRole.Main, characterId: 'anilist:12' },
          { role: CharacterRole.Background, characterId: 'anilist:13' },
        ],
      },
    ];

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({ likes: [] }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () =>
        [
          { characterId: 'anilist:11', mediaId: 'anilist:1' },
        ] as any,
    );

    const getMediaCharactersStub = stub(
      db,
      'getMediaCharacters',
      () =>
        [
          {
            characterId: 'anilist:11',
            mediaId: 'anilist:1',
            userId: 'user_id',
          },
          {
            characterId: 'anilist:12',
            mediaId: 'anilist:1',
            userId: 'another_ser_id',
          },
          {
            characterId: 'anilist:13',
            mediaId: 'anilist:1',
            userId: 'another_ser_id',
          },
        ] as any,
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

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.showcase({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
            components: [{
              custom_id: 'showcase=user_id=0=prev',
              label: 'Prev',
              style: 2,
              type: 2,
            }, {
              custom_id: '_',
              disabled: true,
              label: '1/1',
              style: 2,
              type: 2,
            }, {
              custom_id: 'showcase=user_id=0=next',
              label: 'Next',
              style: 2,
              type: 2,
            }],
          }],
          embeds: [
            {
              type: 'rich',
              fields: [{
                inline: false,
                name: 'title 1',
                value: '_1 owned by other users!_\n50% — 1 / 2',
              }],
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
      mediaStub.restore();
      getUserStub.restore();
      getUserCharactersStub.restore();
      mongoClientStub.restore();
      getMediaCharactersStub.restore();
    }
  });

  await test.step('no logs (Self)', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({ likes: [] }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () => [] as any,
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
      const message = user.showcase({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
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
              components: [
                {
                  custom_id: 'gacha=user_id',
                  label: '/gacha',
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
              description: "You don't have any characters",
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
      mongoClientStub.restore();
      getUserStub.restore();
      getUserCharactersStub.restore();
      getMediaCharactersStub.restore();
    }
  });

  await test.step('no logs (Dave)', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const mongoClientStub = stub(
      db,
      'newMongo',
      () =>
        ({
          connect: () => ({
            close: () => undefined,
          }),
        }) as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({ likes: [] }) as any,
    );

    const getUserCharactersStub = stub(
      db,
      'getUserCharacters',
      () => [] as any,
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
      const message = user.showcase({
        userId: 'another_user_id',
        guildId: 'guild_id',
        token: 'test_token',
        index: 0,
        nick: true,
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
              description: "<@another_user_id> doesn't have any characters",
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
      mongoClientStub.restore();
      getUserStub.restore();
      getUserCharactersStub.restore();
      getMediaCharactersStub.restore();
    }
  });
});

Deno.test('/like', async (test) => {
  await test.step('normal', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      name: {
        english: 'character',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            type: MediaType.Anime,
            title: {
              english: 'title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const likeCharacterStub = stub(
      db,
      'likeCharacter',
      () => '' as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const listStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.like({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        search: 'character',
        undo: false,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'character=pack-id:1',
                  label: '/character',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              description: 'Liked',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**character**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
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

      getUserStub.restore();
      likeCharacterStub.restore();
    }
  });

  await test.step('normal (mentioned)', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      name: {
        english: 'character',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            type: MediaType.Anime,
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
      () => undefined as any,
    );

    const listStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const likeCharacterStub = stub(
      db,
      'likeCharacter',
      () => '' as any,
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.like({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        search: 'character',
        mention: true,
        undo: false,
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
          allowed_mentions: { parse: [] },
          attachments: [],
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'character=pack-id:1',
                  label: '/character',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          content: '<@user_id>',
          embeds: [
            {
              type: 'rich',
              description: 'Liked',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**character**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
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

      getUserStub.restore();
      likeCharacterStub.restore();
    }
  });

  await test.step('undo', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      name: {
        english: 'character',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            type: MediaType.Anime,
            title: {
              english: 'title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const likeCharacterStub = stub(
      db,
      'unlikeCharacter',
      () => '' as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const listStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.like({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        search: 'character',
        undo: true,
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
              description: 'Unliked',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**character**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
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

      getUserStub.restore();
      likeCharacterStub.restore();
    }
  });

  await test.step('undo (exists)', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      name: {
        english: 'character',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            type: MediaType.Anime,
            title: {
              english: 'title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const likeCharacterStub = stub(
      db,
      'unlikeCharacter',
      () => '' as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const listStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.like({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        search: 'character',
        undo: true,
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
              description: 'Unliked',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**character**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
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

      getUserStub.restore();
      likeCharacterStub.restore();
    }
  });

  await test.step('undo (owned)', async () => {
    const character: Character = {
      id: '1',
      packId: 'pack-id',
      name: {
        english: 'character',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            type: MediaType.Anime,
            title: {
              english: 'title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const likeCharacterStub = stub(
      db,
      'unlikeCharacter',
      () => '' as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const listStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(character),
    );

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.like({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        search: 'character',
        undo: true,
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
              description: 'Unliked',
            },
            {
              type: 'rich',
              fields: [
                {
                  name: 'title',
                  value: '**character**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/?size=thumbnail',
              },
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
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

      getUserStub.restore();
      likeCharacterStub.restore();
    }
  });

  await test.step('not found', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const listStub = stub(
      packs,
      'searchOneCharacter',
      () => Promise.resolve(undefined),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.like({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        search: 'character',
        undo: false,
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

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
    }
  });
});

Deno.test('/likeall', async (test) => {
  await test.step('normal', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      title: {
        english: 'title',
      },
    };

    const timeStub = new FakeTime();

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const likeMediaStub = stub(
      db,
      'likeMedia',
      () => '' as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
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
      const message = user.likeall({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        search: 'title',
        undo: false,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'media=pack-id:1',
                  label: '/anime',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              description: 'Liked',
            },
            {
              type: 'rich',
              title: 'title',
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
      searchStub.restore();
      isDisabledStub.restore();
      listStub.restore();
      getGuildStub.restore();

      getUserStub.restore();
      likeMediaStub.restore();
    }
  });

  await test.step('normal (undo)', async () => {
    const media: Media = {
      id: '1',
      packId: 'pack-id',
      type: MediaType.Anime,
      title: {
        english: 'title',
      },
    };

    const timeStub = new FakeTime();

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => 'user' as any,
    );

    const likeMediaStub = stub(
      db,
      'unlikeMedia',
      () => '' as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
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
      const message = user.likeall({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        search: 'title',
        undo: true,
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
              description: 'Unliked',
            },
            {
              type: 'rich',
              title: 'title',
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
      sarchStub.restore();
      isDisabledStub.restore();
      listStub.restore();

      getGuildStub.restore();

      getUserStub.restore();
      likeMediaStub.restore();
    }
  });

  await test.step('not found', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => '' as any,
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
      const message = user.likeall({
        userId: 'user_id',
        guildId: 'guild_id',

        token: 'test_token',
        search: 'title',
        undo: false,
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

      timeStub.restore();
      fetchStub.restore();
      sarchStub.restore();
      isDisabledStub.restore();
      listStub.restore();
      getGuildStub.restore();
    }
  });
});

Deno.test('/likeslist', async (test) => {
  await test.step('normal', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        name: {
          english: 'character 6',
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
      () => ({
        likes: [
          { characterId: 'anilist:1' },
          { characterId: 'anilist:2' },
          { characterId: 'anilist:3' },
          { characterId: 'anilist:4' },
          { characterId: 'anilist:5' },
          { characterId: 'anilist:6' },
          { characterId: 'anilist:7' },
          { characterId: 'anilist:8' },
          { characterId: 'anilist:9' },
        ],
      } as any),
    );

    const findCharactersStub = stub(
      db,
      'findCharacters',
      () => [] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.likeslist({
        index: 0,
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
              components: [
                {
                  custom_id: 'likes=user_id=0=1=prev',
                  label: 'Prev',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: '_',
                  disabled: true,
                  label: '1/2',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'likes=user_id=0=1=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: '1<:smolstar:1107503653956374638> character 1',
                  value: '\u200B',
                },
                {
                  inline: false,
                  name: '1<:smolstar:1107503653956374638> character 2',
                  value: '\u200B',
                },
                {
                  inline: false,
                  name: '1<:smolstar:1107503653956374638> character 3',
                  value: '\u200B',
                },
                {
                  inline: false,
                  name: '1<:smolstar:1107503653956374638> character 4',
                  value: '\u200B',
                },
                {
                  inline: false,
                  name: '1<:smolstar:1107503653956374638> character 5',
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

      timeStub.restore();
      fetchStub.restore();
      listStub.restore();
      isDisabledStub.restore();
      characterStub.restore();
      getUserStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('normal (exists)', async () => {
    const character: Character = {
      id: '1',
      packId: 'anilist',
      name: {
        english: 'character',
      },
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: '2',
            packId: 'anilist',
            type: MediaType.Anime,
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
      () => undefined as any,
    );

    const getUserStub = stub(
      db,
      'getUser',
      () => ({
        likes: [
          { characterId: 'anilist:1' },
        ],
      } as any),
    );

    const getGuildStub = stub(
      db,
      'getGuild',
      () => 'guild' as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            rating: 3,
            userId: 'another_user_id',
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.likeslist({
        index: 0,
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
              components: [
                {
                  custom_id: 'likes=user_id=0=0=prev',
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
                  custom_id: 'likes=user_id=0=0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title',
                  value:
                    '3<:smolstar:1107503653956374638> <@another_user_id> character',
                },
              ],
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
      characterStub.restore();
      getUserStub.restore();
      getGuildStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('normal (filtered)', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: {
              id: '1',
              packId: 'anilist',
              type: MediaType.Anime,
              title: {
                english: 'title 1',
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
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: {
              id: '2',
              packId: 'anilist',
              type: MediaType.Anime,
              title: {
                english: 'title 2',
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
        media: {
          edges: [{
            role: CharacterRole.Main,
            node: {
              id: '3',
              packId: 'anilist',
              type: MediaType.Anime,
              title: {
                english: 'title 3',
              },
            },
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

    const getUserStub = stub(
      db,
      'getUser',
      () => ({
        likes: [
          { characterId: 'anilist:1' },
          { characterId: 'anilist:2' },
          { characterId: 'anilist:3' },
        ],
      } as any),
    );

    const findCharactersStub = stub(
      db,
      'findCharacters',
      () =>
        [
          {
            characterId: 'anilist:1',
            rating: 3,
            userId: 'user_id',
          },
          {
            characterId: 'anilist:2',
            rating: 3,
            userId: 'another_user_id',
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.likeslist({
        index: 0,
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        filter: true,
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
          components: [
            {
              type: 1,
              components: [
                {
                  custom_id: 'likes=user_id=1=0=prev',
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
                  custom_id: 'likes=user_id=1=0=next',
                  label: 'Next',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              fields: [
                {
                  inline: false,
                  name: 'title 2',
                  value:
                    '3<:smolstar:1107503653956374638> <@another_user_id> character 2',
                },
                {
                  inline: false,
                  name: 'title 3',
                  value: '1<:smolstar:1107503653956374638> character 3',
                },
              ],
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
      characterStub.restore();
      getUserStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('empty', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        name: {
          english: 'character 6',
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
      () => ({
        likes: [],
      } as any),
    );

    const findCharactersStub = stub(
      db,
      'findCharacters',
      () => [] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.likeslist({
        index: 0,
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
              description: "You don't have any likes",
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
      characterStub.restore();
      getUserStub.restore();

      findCharactersStub.restore();
    }
  });

  await test.step('empty (Dave)', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        name: {
          english: 'character 6',
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
      () => ({
        likes: [],
      } as any),
    );

    const findCharactersStub = stub(
      db,
      'findCharacters',
      () => [] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.likeslist({
        index: 0,
        userId: 'another_user_id',
        guildId: 'guild_id',
        token: 'test_token',
        nick: true,
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
              description: "<@another_user_id> doesn't have any likes",
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
      characterStub.restore();
      getUserStub.restore();

      findCharactersStub.restore();
    }
  });
});

Deno.test('/logs', async (test) => {
  await test.step('normal', async () => {
    const characters: Character[] = [
      {
        id: '1',
        packId: 'anilist',
        name: {
          english: 'character 1',
        },
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        name: {
          english: 'character 6',
        },
      },
      {
        id: '7',
        packId: 'anilist',
        name: {
          english: 'character 7',
        },
      },
      {
        id: '8',
        packId: 'anilist',
        name: {
          english: 'character 8',
        },
      },
      {
        id: '9',
        packId: 'anilist',
        name: {
          english: 'character 9',
        },
      },
      {
        id: '10',
        packId: 'anilist',
        name: {
          english: 'character 10',
        },
      },
      {
        id: '11',
        packId: 'anilist',
        name: {
          english: 'character 11',
        },
      },
    ];

    const now = new Date('2024-04-10T11:30:29.172Z');
    const timeStub = new FakeTime(now);

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
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
          { characterId: 'anilist:1', rating: 4, createdAt: now },
          { characterId: 'anilist:2', rating: 4, createdAt: now },
          { characterId: 'anilist:3', rating: 4, createdAt: now },
          { characterId: 'anilist:4', rating: 4, createdAt: now },
          { characterId: 'anilist:5', rating: 4, createdAt: now },
          { characterId: 'anilist:6', rating: 4, createdAt: now },
          { characterId: 'anilist:7', rating: 4, createdAt: now },
          { characterId: 'anilist:8', rating: 4, createdAt: now },
          { characterId: 'anilist:9', rating: 4, createdAt: now },
          { characterId: 'anilist:10', rating: 4, createdAt: now },
          { characterId: 'anilist:11', rating: 4, createdAt: now },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.logs({
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
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description: [
                '4<:smolstar:1107503653956374638> character 11 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 10 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 9 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 8 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 7 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 6 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 5 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 4 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 3 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> character 2 <t:1712748629:R>',
              ].join('\n'),
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
      characterStub.restore();
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
      },
      {
        id: '2',
        packId: 'anilist',
        name: {
          english: 'character 2',
        },
      },
      {
        id: '3',
        packId: 'anilist',
        name: {
          english: 'character 3',
        },
      },
      {
        id: '4',
        packId: 'anilist',
        name: {
          english: 'character 4',
        },
      },
      {
        id: '5',
        packId: 'anilist',
        name: {
          english: 'character 5',
        },
      },
      {
        id: '6',
        packId: 'anilist',
        name: {
          english: 'character 6',
        },
      },
      {
        id: '7',
        packId: 'anilist',
        name: {
          english: 'character 7',
        },
      },
      {
        id: '8',
        packId: 'anilist',
        name: {
          english: 'character 8',
        },
      },
      {
        id: '9',
        packId: 'anilist',
        name: {
          english: 'character 9',
        },
      },
      {
        id: '10',
        packId: 'anilist',
        name: {
          english: 'character 10',
        },
      },
      {
        id: '11',
        packId: 'anilist',
        name: {
          english: 'character 11',
        },
      },
    ];

    const now = new Date('2024-04-10T11:30:29.172Z');
    const timeStub = new FakeTime(now);

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
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
            rating: 4,
            nickname: 'nickname 1',
            createdAt: now,
          },
          {
            characterId: 'anilist:2',
            rating: 4,
            nickname: 'nickname 2',
            createdAt: now,
          },
          {
            characterId: 'anilist:3',
            rating: 4,
            nickname: 'nickname 3',
            createdAt: now,
          },
          {
            characterId: 'anilist:4',
            rating: 4,
            nickname: 'nickname 4',
            createdAt: now,
          },
          {
            characterId: 'anilist:5',
            rating: 4,
            nickname: 'nickname 5',
            createdAt: now,
          },
          {
            characterId: 'anilist:6',
            rating: 4,
            nickname: 'nickname 6',
            createdAt: now,
          },
          {
            characterId: 'anilist:7',
            rating: 4,
            nickname: 'nickname 7',
            createdAt: now,
          },
          {
            characterId: 'anilist:8',
            rating: 4,
            nickname: 'nickname 8',
            createdAt: now,
          },
          {
            characterId: 'anilist:9',
            rating: 4,
            nickname: 'nickname 9',
            createdAt: now,
          },
          {
            characterId: 'anilist:10',
            rating: 4,
            nickname: 'nickname 10',
            createdAt: now,
          },
          {
            characterId: 'anilist:11',
            rating: 4,
            nickname: 'nickname 11',
            createdAt: now,
          },
        ] as any,
    );

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    const characterStub = stub(
      packs,
      'characters',
      () => Promise.resolve(characters),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.logs({
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
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description: [
                '4<:smolstar:1107503653956374638> nickname 11 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 10 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 9 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 8 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 7 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 6 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 5 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 4 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 3 <t:1712748629:R>',
                '4<:smolstar:1107503653956374638> nickname 2 <t:1712748629:R>',
              ].join('\n'),
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
      characterStub.restore();
      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('no logs (Self)', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
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

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.logs({
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
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description: "You don't have any characters",
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

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });

  await test.step('no logs (Dave)', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
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

    const listStub = stub(packs, 'all', () =>
      Promise.resolve([
        { manifest: { id: 'anilist' } },
      ] as any));

    const isDisabledStub = stub(packs, 'isDisabled', () => false);

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = user.logs({
        userId: 'another_user_id',
        guildId: 'guild_id',
        token: 'test_token',
        nick: true,
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
              description: "<@another_user_id> doesn't have any characters",
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

      getInventoryStub.restore();
      getUserCharactersStub.restore();
    }
  });
});
