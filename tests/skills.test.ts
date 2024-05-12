// deno-lint-ignore-file no-explicit-any

import { assertSpyCallArgs, stub } from '$std/testing/mock.ts';
import { FakeTime } from '$std/testing/time.ts';

import { assertEquals, assertRejects, assertThrows } from '$std/assert/mod.ts';
import { assertMonochromeSnapshot } from '~/tests/utils.test.ts';

import db from '~/db/mod.ts';
import packs from '~/src/packs.ts';
import config from '~/src/config.ts';
import utils from '~/src/utils.ts';

import _skills, { skills } from '~/src/skills.ts';

import { type Character, CharacterRole, MediaType } from '~/src/types.ts';

import { NonFetalError } from '~/src/errors.ts';

Deno.test('all skills', async (test) => {
  await test.step('snapshot', async (test) => {
    await assertMonochromeSnapshot(test, skills);
  });

  await test.step('crits', async (test) => {
    await test.step('hit', () => {
      const critSkill = skills.crit;

      const randomStub = stub(Math, 'random', () => 0);

      try {
        const output = critSkill.activation(
          {
            attacking: {
              attack: 5,
            } as any,
            lvl: 1,
          },
        );

        assertEquals(output.damage, 2);
      } finally {
        randomStub.restore();
      }
    });

    await test.step('miss', () => {
      const critSkill = skills.crit;

      const randomStub = stub(Math, 'random', () => 1);

      try {
        const output = critSkill.activation(
          {
            attacking: {
              attack: 5,
            } as any,
            lvl: 1,
          },
        );

        assertEquals(output.damage, undefined);
      } finally {
        randomStub.restore();
      }
    });
  });
});

Deno.test('/skills showall', async (test) => {
  await test.step('page 0', async (test) => {
    const message = _skills.all(0);

    await assertMonochromeSnapshot(test, message.json());
  });
});

Deno.test('/skills acquire', async (test) => {
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

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({}) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => ({ combat: { skills: {} }, userId: 'user_id' }) as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = _skills.preAcquire({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        character: 'character',
        skillKey: 'crit',
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
              components: [
                {
                  type: 2,
                  style: 2,
                  custom_id: 'cacquire=user_id=id:1=crit',
                  label: 'Confirm',
                },
                {
                  type: 2,
                  style: 4,
                  custom_id: 'cancel=user_id',
                  label: 'Cancel',
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
                  name: 'full name',
                  value: '\u200B',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description: [
                `**Critical Hit** **(LVL 0 <:rarrow:1170533290105655428> LVL 1)**`,
                `The art of performing the traditional critical hit.`,
                `1. _Crit Chance (0.5%)_`,
                `2. _Crit Damage (30%)_`,
              ].join('\n'),
            },
            {
              type: 'rich',
              description: '<:remove:1099004424111792158> 2 Skill Points',
              title: 'Acquire Skill',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('upgrade', async () => {
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

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({}) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          combat: {
            skills: {
              'crit': { level: 1 },
            },
          },
          userId: 'user_id',
        }) as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = _skills.preAcquire({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        character: 'character',
        skillKey: 'crit',
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
              components: [
                {
                  type: 2,
                  style: 2,
                  custom_id: 'cacquire=user_id=id:1=crit',
                  label: 'Confirm',
                },
                {
                  type: 2,
                  style: 4,
                  custom_id: 'cancel=user_id',
                  label: 'Cancel',
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
                  name: 'full name',
                  value: '\u200B',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description: [
                `**Critical Hit** **(LVL 1 <:rarrow:1170533290105655428> LVL 2)**`,
                `The art of performing the traditional critical hit.`,
                `1. _Crit Chance (0.5% <:rarrow:1170533290105655428> 5%)_`,
                `2. _Crit Damage (30% <:rarrow:1170533290105655428> 45%)_`,
              ].join('\n'),
            },
            {
              type: 'rich',
              description: '<:remove:1099004424111792158> 2 Skill Points',
              title: 'Upgrade Skill',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('skill is maxed', async () => {
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

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({}) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          combat: {
            skills: {
              'crit': { level: 3 },
            },
          },
          userId: 'user_id',
        }) as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = _skills.preAcquire({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        character: 'character',
        skillKey: 'crit',
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
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
              ],
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
            },
            {
              type: 'rich',
              description: [
                `**Critical Hit** **(LVL MAX)**`,
                `The art of performing the traditional critical hit.`,
                `1. _Crit Chance (15%)_`,
                `2. _Crit Damage (60%)_`,
              ].join('\n'),
            },
            {
              type: 'rich',
              title: 'Skill is maxed',
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;

      fetchStub.restore();
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('character not owned', async () => {
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

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({}) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () => undefined as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = _skills.preAcquire({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        character: 'character',
        skillKey: 'crit',
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
                '<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
              ],
              footer: {
                text: "Character is yet to be found and isn't combat ready",
              },
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
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('character not owned by you', async () => {
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

    const getInventoryStub = stub(
      db,
      'getInventory',
      () => ({}) as any,
    );

    const findCharactersStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          rating: 1,
          combat: { skills: {} },
          userId: 'another_user_id',
        }) as any,
    );

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
    );

    const packsStub = stub(
      packs,
      'characters',
      () => Promise.resolve([character]),
    );

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = _skills.preAcquire({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        character: 'character',
        skillKey: 'crit',
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
              description: 'full name is not owned by you',
            },
            {
              type: 'rich',
              description:
                '<@another_user_id>\n\n<:star:1061016362832642098><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906><:no_star:1109377526662434906>',
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
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
      packsStub.restore();
      timeStub.restore();

      getInventoryStub.restore();
      findCharactersStub.restore();
    }
  });

  await test.step('character not found', async () => {
    const timeStub = new FakeTime();

    const fetchStub = stub(
      utils,
      'fetchWithRetry',
      () => undefined as any,
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

    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = _skills.preAcquire({
        token: 'test_token',
        userId: 'user_id',
        guildId: 'guild_id',
        character: 'character',
        skillKey: 'crit',
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
      packsStub.restore();
      timeStub.restore();
    }
  });

  await test.step("skill doesn't exist", () => {
    assertThrows(
      () =>
        _skills.preAcquire({
          token: 'test_token',
          userId: 'user_id',
          guildId: 'guild_id',
          character: 'character',
          skillKey: 'skill' as any,
        }),
      Error,
      '404',
    );
  });
});

Deno.test('acquire skill', async (test) => {
  await test.step('normal', async () => {
    const acquireSkillStub = stub(
      db,
      'acquireSkill',
      () => Promise.resolve({ level: 1 }),
    );

    try {
      const message = await _skills.acquire({
        userId: 'user_id',
        guildId: 'guild_id',
        characterId: 'character_id',
        skillKey: 'crit',
      });

      assertSpyCallArgs(acquireSkillStub, 0, [
        'user_id',
        'guild_id',
        'character_id',
        'crit',
      ]);

      assertEquals(
        message.json(),
        {
          type: 4,
          data: {
            attachments: [],
            components: [],
            embeds: [
              {
                type: 'rich',
                title: 'Skill Acquired',
              },
              {
                type: 'rich',
                description: [
                  `**Critical Hit** **(LVL 0 <:rarrow:1170533290105655428> LVL 1)**`,
                  `The art of performing the traditional critical hit.`,
                  `1. _Crit Chance (0.5%)_`,
                  `2. _Crit Damage (30%)_`,
                ].join('\n'),
              },
            ],
          },
        },
      );
    } finally {
      acquireSkillStub.restore();
    }
  });

  await test.step('upgrade', async () => {
    const acquireSkillStub = stub(
      db,
      'acquireSkill',
      () => ({ level: 2 }) as any,
    );

    try {
      const message = await _skills.acquire({
        userId: 'user_id',
        guildId: 'guild_id',
        characterId: 'character_id',
        skillKey: 'crit',
      });

      assertSpyCallArgs(acquireSkillStub, 0, [
        'user_id',
        'guild_id',
        'character_id',
        'crit',
      ]);

      assertEquals(
        message.json(),
        {
          type: 4,
          data: {
            attachments: [],
            components: [],
            embeds: [
              {
                type: 'rich',
                title: 'Skill Upgraded',
              },
              {
                type: 'rich',
                description: [
                  `**Critical Hit** **(LVL 1 <:rarrow:1170533290105655428> LVL 2)**`,
                  `The art of performing the traditional critical hit.`,
                  `1. _Crit Chance (0.5% <:rarrow:1170533290105655428> 5%)_`,
                  `2. _Crit Damage (30% <:rarrow:1170533290105655428> 45%)_`,
                ].join('\n'),
              },
            ],
          },
        },
      );
    } finally {
      acquireSkillStub.restore();
    }
  });

  await test.step('skill is maxed', async () => {
    const acquireSkillStub = stub(
      db,
      'acquireSkill',
      () => {
        throw new NonFetalError('failed');
      },
    );

    try {
      const message = await _skills.acquire({
        userId: 'user_id',
        guildId: 'guild_id',
        characterId: 'character_id',
        skillKey: 'crit',
      });

      assertSpyCallArgs(acquireSkillStub, 0, [
        'user_id',
        'guild_id',
        'character_id',
        'crit',
      ]);

      assertEquals(
        message.json(),
        {
          type: 4,
          data: {
            attachments: [],
            components: [],
            embeds: [
              {
                type: 'rich',
                description: 'Failed',
              },
            ],
          },
        },
      );
    } finally {
      acquireSkillStub.restore();
    }
  });

  await test.step('skill not found', async () => {
    await assertRejects(
      () =>
        _skills.acquire({
          userId: 'user_id',
          guildId: 'guild_id',
          characterId: 'character_id',
          skillKey: 'skill' as any,
        }),
      Error,
      '404',
    );
  });
});
