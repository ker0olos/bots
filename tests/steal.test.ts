// deno-lint-ignore-file no-explicit-any

import { assertEquals, assertThrows } from '$std/assert/mod.ts';

import { FakeTime } from '$std/testing/time.ts';

import {
  assertSpyCall,
  assertSpyCalls,
  returnsNext,
  stub,
} from '$std/testing/mock.ts';

import packs from '~/src/packs.ts';
import utils from '~/src/utils.ts';

import steal from '~/src/steal.ts';

import config from '~/src/config.ts';

import db, { ObjectId } from '~/db/mod.ts';

import { Character, CharacterRole, MediaType } from '~/src/types.ts';

import { NonFetalError } from '~/src/errors.ts';

Deno.test('chances', async (test) => {
  await test.step('5*', async (test) => {
    const rating = 5;

    await test.step('no inactive time', () => {
      const inactiveDays = steal.getInactiveDays({
        lastPull: undefined,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });

    await test.step('1 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 1);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(1, chance);
    });

    await test.step('7 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 7);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(26, chance);
    });

    await test.step('15 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 15);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(51, chance);
    });

    await test.step('32 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 32);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });
  });

  await test.step('4*', async (test) => {
    const rating = 4;

    await test.step('no inactive time', () => {
      const inactiveDays = steal.getInactiveDays({
        lastPull: undefined,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });

    await test.step('1 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 1);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(3, chance);
    });

    await test.step('8 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 8);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(28, chance);
    });

    await test.step('15 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 15);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(53, chance);
    });

    await test.step('32 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 32);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });
  });

  await test.step('3*', async (test) => {
    const rating = 3;

    await test.step('no inactive time', () => {
      const inactiveDays = steal.getInactiveDays({
        lastPull: undefined,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });

    await test.step('1 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 1);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(15, chance);
    });

    await test.step('7 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 7);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(40, chance);
    });

    await test.step('15 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 15);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(65, chance);
    });

    await test.step('32 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 32);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });
  });

  await test.step('2*', async (test) => {
    const rating = 2;

    await test.step('no inactive time', () => {
      const inactiveDays = steal.getInactiveDays({
        lastPull: undefined,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });

    await test.step('1 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 1);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(25, chance);
    });

    await test.step('7 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 7);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(50, chance);
    });

    await test.step('15 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 15);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(75, chance);
    });

    await test.step('32 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 32);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });
  });

  await test.step('1*', async (test) => {
    const rating = 1;

    await test.step('no inactive time', () => {
      const inactiveDays = steal.getInactiveDays({
        lastPull: undefined,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });

    await test.step('1 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 1);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(50, chance);
    });

    await test.step('7 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 7);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(75, chance);
    });

    await test.step('15 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 15);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });

    await test.step('32 inactive day', () => {
      const date = new Date();

      date.setDate(date.getDate() - 32);

      const inactiveDays = steal.getInactiveDays({
        lastPull: date,
      });

      const chance = steal.getChances({
        rating,
      } as any, inactiveDays);

      assertEquals(90, chance);
    });
  });
});

Deno.test('/steal', async (test) => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          party: {},
          user: { discordId: 'user-id' },
          stealTimestamp: undefined,
        }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          rating: 2,
          characterId: 'id:1',
          userId: 'another_user_id',
          inventory: { party: {} },
        }) as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'character_id',
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
              description: '<@another_user_id>',
              fields: [
                {
                  name: 'media title',
                  value: '**full name**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description: 'Your chance of success is **90.00%**',
            },
          ],
          components: [{
            components: [
              {
                custom_id: 'steal=user_id=id:1=90',
                label: 'Attempt',
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
            type: 1,
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('on cooldown', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime('2011/1/25 00:00 UTC');

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          party: {},
          user: { discordId: 'user-id' },
          stealTimestamp: new Date(),
        }) as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'character_id',
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
          embeds: [{
            type: 'rich',
            description: 'Steal is on cooldown, try again <t:1296172800:R>',
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
    }
  });

  await test.step('stealing from party (inactive user)', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          party: {},
          user: { discordId: 'user-id' },
          stealTimestamp: undefined,
        }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          rating: 2,
          characterId: 'id:1',
          userId: 'another_user_id',
          inventory: {
            party: {
              member1: { characterId: 'id:1' },
            },
          },
        }) as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'character_id',
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
              description: '<@another_user_id>',
              fields: [
                {
                  name: 'media title',
                  value: '**full name**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description: 'Your chance of success is **90.00%**',
            },
          ],
          components: [{
            components: [
              {
                custom_id: 'steal=user_id=id:1=90',
                label: 'Attempt',
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
            type: 1,
          }],
          attachments: [],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('stealing from party (active user)', async () => {
    const id = new ObjectId();

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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          party: {},
          user: { discordId: 'user-id' },
          stealTimestamp: undefined,
        }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          _id: id,
          rating: 2,
          characterId: 'id:1',
          userId: 'another_user_id',
          inventory: {
            lastPull: new Date(),
            party: {
              member1Id: id,
            },
          },
        }) as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'character_id',
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
              description:
                "As part of <@another_user_id>'s party, **full name** cannot be stolen while <@another_user_id> is still active",
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media title',
                  value: '**full name**',
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
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('stealing from yourself', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          party: {},
          user: { discordId: 'user-id' },
          stealTimestamp: undefined,
        }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          rating: 2,
          characterId: 'id:1',
          userId: 'user_id',
          inventory: { party: {} },
        }) as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'character_id',
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
          embeds: [{
            type: 'rich',
            description: "You can't steal from yourself!",
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('not found', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([]),
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'character_id',
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
          embeds: [{
            type: 'rich',
            description: 'Found _nothing_ matching that query!',
          }],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

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
                  stealTimestamp: undefined,
                },
              },
            }))),
        } as any,
        undefined,
        undefined,
      ]),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );
    const getInventoryStub = stub(
      db,
      'rechargeConsumables',
      () =>
        ({
          party: {},
          user: { discordId: 'user-id' },
          stealTimestamp: undefined,
        }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => undefined as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.pre({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        id: 'character_id',
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
              description: "full name hasn't been found by anyone yet",
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media title',
                  value: '**full name**',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
            },
          ],
          components: [],
          attachments: [],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('under maintenance', () => {
    config.stealing = false;

    try {
      assertThrows(
        () =>
          steal.pre({
            userId: 'user_id',
            guildId: 'guild_id',
            token: 'test_token',
            id: 'character_id',
          }),
        NonFetalError,
        'Stealing is under maintenance, try again later!',
      );
    } finally {
      delete config.stealing;
    }
  });
});

Deno.test('attempt', async (test) => {
  await test.step('success', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const sleepStub = stub(utils, 'sleep', () => Promise.resolve());

    const rngStub = stub(utils, 'getRandomFloat', () => 0);

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { discordId: 'user-id' } }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          rating: 2,
          characterId: 'id:1',
          userId: 'another_user_id',
          inventory: { party: {} },
        }) as any,
    );

    const stealCharacterStub = stub(
      db,
      'stealCharacter',
      () => '_' as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.attempt({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        characterId: 'character_id',
        pre: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/steal.gif',
            },
          }],
        },
      });

      await timeStub.runMicrotasks();

      assertSpyCalls(rngStub, 1);

      assertSpyCall(sleepStub, 0, {
        args: [5],
      });

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
                  custom_id: 'character=character_id=1',
                  label: '/character',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'like=character_id',
                  label: '/like',
                  style: 2,
                  type: 2,
                },
              ],
            },
          ],
          embeds: [
            {
              type: 'rich',
              description: '**You Succeeded**',
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media title',
                  value: '**full name**',
                },
                {
                  name: '\u200B',
                  value: '<:add:1099004747123523644>',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
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
          content: '<@another_user_id>',
          attachments: [],
          components: [
            {
              components: [
                {
                  custom_id: 'character=character_id=1',
                  label: '/character',
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
              description: '**full name** was stolen from you!',
            },
            {
              type: 'rich',
              description:
                '<:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'media title',
                  value: '**full name**',
                },
                {
                  name: '\u200B',
                  value: '<:remove:1099004424111792158>',
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
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      rngStub.restore();
      sleepStub.restore();
      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();

      stealCharacterStub.restore();
    }
  });

  await test.step('fail', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime('2011/1/25 00:00 UTC');

    const sleepStub = stub(utils, 'sleep', () => Promise.resolve());

    const rngStub = stub(utils, 'getRandomFloat', () => 1);

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { discordId: 'user-id' } }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          rating: 2,
          characterId: 'id:1',
          userId: 'another_user_id',
          inventory: { party: {} },
        }) as any,
    );

    const stealCharacterStub = stub(
      db,
      'failSteal',
      () => undefined as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.attempt({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        characterId: 'character_id',
        pre: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/steal.gif',
            },
          }],
        },
      });

      await timeStub.runMicrotasks();

      assertSpyCalls(rngStub, 1);

      assertSpyCall(sleepStub, 0, {
        args: [5],
      });

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
              description: '**You Failed**',
            },
            {
              type: 'rich',
              description: 'You can try again <t:1296172800:R>',
            },
          ],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      rngStub.restore();
      sleepStub.restore();
      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();

      findCharactersStub.restore();
      stealCharacterStub.restore();
    }
  });

  await test.step('on cooldown', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime('2011/1/25 00:00 UTC');

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () =>
        ({
          party: {},
          user: { discordId: 'user-id' },
          stealTimestamp: new Date(),
        }) as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.attempt({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        characterId: 'character_id',
        pre: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/steal.gif',
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
            description: 'Steal is on cooldown, try again <t:1296172800:R>',
          }],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
    }
  });

  await test.step('chances lowered', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { discordId: 'user-id' } }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          rating: 2,
          characterId: 'id:1',
          userId: 'another_user_id',
          inventory: { party: {} },
        }) as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.attempt({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        characterId: 'character_id',
        pre: 100,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/steal.gif',
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
                'Something happened and affected your chances of stealing **full name**, Please try again!',
            },
          ],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('not found', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { discordId: 'user-id' } }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => undefined as any,
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.attempt({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        characterId: 'character_id',
        pre: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/steal.gif',
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
            description: "full name hasn't been found by anyone yet",
          }],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('not found 2', async () => {
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const rngStub = stub(utils, 'getRandomFloat', () => 0);

    const sleepStub = stub(utils, 'sleep', () => Promise.resolve());

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { discordId: 'user-id' } }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          rating: 2,
          characterId: 'id:1',
          userId: 'another_user_id',
          inventory: { party: {} },
        }) as any,
    );

    const stealCharacterStub = stub(
      db,
      'stealCharacter',
      () => {
        throw new Error('CHARACTER_NOT_FOUND');
      },
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.attempt({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        characterId: 'character_id',
        pre: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/steal.gif',
            },
          }],
        },
      });

      await timeStub.runMicrotasks();

      assertSpyCall(sleepStub, 0, {
        args: [5],
      });

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
            description: "full name hasn't been found by anyone yet",
          }],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      rngStub.restore();
      sleepStub.restore();
      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();

      findCharactersStub.restore();
      stealCharacterStub.restore();
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
      media: {
        edges: [{
          role: CharacterRole.Main,
          node: {
            id: 'media',
            packId: 'id',
            type: MediaType.Anime,
            title: {
              english: 'media title',
            },
          },
        }],
      },
    };

    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      returnsNext([
        undefined,
        undefined,
      ] as any),
    );

    const listStub = stub(
      packs,
      'all',
      () => Promise.resolve([]),
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({ party: {}, user: { discordId: 'user-id' } }) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => undefined as any,
    );

    const stealCharacterStub = stub(
      db,
      'stealCharacter',
      () => {
        throw new Error('CHARACTER_NOT_OWNED');
      },
    );

    config.stealing = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = steal.attempt({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        characterId: 'character_id',
        pre: 0,
      });

      assertEquals(message.json(), {
        type: 4,
        data: {
          attachments: [],
          components: [],
          embeds: [{
            type: 'rich',
            image: {
              url: 'http://localhost:8000/assets/steal.gif',
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
              description: "full name hasn't been found by anyone yet",
              type: 'rich',
            },
          ],
        },
      );
    } finally {
      delete config.stealing;
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      listStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
      stealCharacterStub.restore();
    }
  });
});
