// deno-lint-ignore-file no-explicit-any

import { assertEquals } from '$std/assert/mod.ts';

import { FakeTime } from '$std/testing/time.ts';

import { assertSpyCalls, returnsNext, stub } from '$std/testing/mock.ts';

import utils from '~/src/utils.ts';

import packs from '~/src/packs.ts';
import stats from '~/src/stats.ts';

import config from '~/src/config.ts';

import db from '~/db/mod.ts';

Deno.test('/stats', async (test) => {
  await test.step('normal', async () => {
    const characterStub = stub(
      packs,
      'characters',
      returnsNext([
        Promise.resolve([{
          id: '1',
          packId: 'id',
          name: {
            english: 'full name',
          },
          images: [{
            url: 'image_url',
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

    const findCharacterStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          characterId: 'id:1',
          rating: 4,
          combat: {
            level: 2,
            exp: 10,
            // unclaimedStatsPoints: 1,
            curStats: {
              attack: 1,
              defense: 2,
              speed: 3,
              hp: 28,
            },
          },
          userId: 'user_id',
        }) as any,
    );

    config.combat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = stats.view({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        character: 'character_id',
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
                '<@user_id>\n\n<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: 'Level 2\n10/20',
                },
                {
                  name: 'Stats',
                  value:
                    'Skill Points: 0\nAttack: 1\nDefense: 2\nSpeed: 3\nHP: 28',
                },
              ],
            },
          ],
          components: [
            {
              type: 1,
              components: [
                //     {
                //       custom_id: 'stats=atk=user_id=id:1',
                //       disabled: false,
                //       label: '+1 ATK',
                //       style: 2,
                //       type: 2,
                //     },
                //     {
                //       custom_id: 'stats=def=user_id=id:1',
                //       disabled: false,
                //       label: '+1 DEF',
                //       style: 2,
                //       type: 2,
                //     },
                //     {
                //       custom_id: 'stats=spd=user_id=id:1',
                //       disabled: false,
                //       label: '+1 SPD',
                //       style: 2,
                //       type: 2,
                //     },
                //   ],
                {
                  custom_id: 'character=id:1',
                  label: '/character',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'like=id:1',
                  label: '/like',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'passign=user_id=id:1',
                  label: '/p assign',
                  style: 2,
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
      delete config.combat;

      timeStub.restore();
      characterStub.restore();
      fetchStub.restore();

      findCharacterStub.restore();
    }
  });

  await test.step('skills', async () => {
    const characterStub = stub(
      packs,
      'characters',
      returnsNext([
        Promise.resolve([{
          id: '1',
          packId: 'id',
          name: {
            english: 'full name',
          },
          images: [{
            url: 'image_url',
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

    const findCharacterStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          characterId: 'id:1',
          rating: 4,
          combat: {
            skillPoints: 2,
            skills: { 'crit': { level: 2 } },
            // unclaimedStatsPoints: 0,
            curStats: {
              attack: 1,
              defense: 2,
              speed: 3,
              hp: 18,
            },
          },
          userId: 'user_id',
        }) as any,
    );

    config.combat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = stats.view({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        character: 'character_id',
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
                '<@user_id>\n\n<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: 'Level 1\n0/10',
                },
                {
                  name: 'Skills',
                  value: 'Critical Hit (LVL 2)',
                },
                {
                  name: 'Stats',
                  value:
                    'Skill Points: 2\nAttack: 1\nDefense: 2\nSpeed: 3\nHP: 18',
                },
              ],
            },
          ],
          components: [
            {
              type: 1,
              components: [
                //     {
                //       custom_id: 'stats=atk=user_id=id:1',
                //       disabled: true,
                //       label: '+1 ATK',
                //       style: 2,
                //       type: 2,
                //     },
                //     {
                //       custom_id: 'stats=def=user_id=id:1',
                //       disabled: true,
                //       label: '+1 DEF',
                //       style: 2,
                //       type: 2,
                //     },
                //     {
                //       custom_id: 'stats=spd=user_id=id:1',
                //       disabled: true,
                //       label: '+1 SPD',
                //       style: 2,
                //       type: 2,
                //     },
                {
                  custom_id: 'character=id:1',
                  label: '/character',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'like=id:1',
                  label: '/like',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'passign=user_id=id:1',
                  label: '/p assign',
                  style: 2,
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
      delete config.combat;

      timeStub.restore();
      characterStub.restore();
      fetchStub.restore();

      findCharacterStub.restore();
    }
  });

  await test.step('another user', async () => {
    const characterStub = stub(
      packs,
      'characters',
      returnsNext([
        Promise.resolve([{
          id: '1',
          packId: 'id',
          name: {
            english: 'full name',
          },
          images: [{
            url: 'image_url',
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

    const findCharacterStub = stub(
      db,
      'findCharacter',
      () =>
        ({
          characterId: 'id:1',
          rating: 4,
          combat: {
            level: 2,
            exp: 10,
            // unclaimedStatsPoints: 1,
            curStats: {
              attack: 1,
              defense: 2,
              speed: 3,
              hp: 8,
            },
          },
          userId: 'another_user_id',
        }) as any,
    );

    config.combat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = stats.view({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        character: 'character_id',
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
                '<@another_user_id>\n\n<:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:star:1061016362832642098><:no_star:1109377526662434906>',
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: 'Level 2\n10/20',
                },
                {
                  name: 'Stats',
                  value:
                    'Skill Points: 0\nAttack: 1\nDefense: 2\nSpeed: 3\nHP: 8',
                },
              ],
            },
          ],
          components: [
            {
              type: 1,
              components: [
                //     {
                //       custom_id: 'stats=atk=user_id=id:1',
                //       disabled: false,
                //       label: '+1 ATK',
                //       style: 2,
                //       type: 2,
                //     },
                //     {
                //       custom_id: 'stats=def=user_id=id:1',
                //       disabled: false,
                //       label: '+1 DEF',
                //       style: 2,
                //       type: 2,
                //     },
                //     {
                //       custom_id: 'stats=spd=user_id=id:1',
                //       disabled: false,
                //       label: '+1 SPD',
                //       style: 2,
                //       type: 2,
                //     },
                //   ],
                {
                  custom_id: 'character=id:1',
                  label: '/character',
                  style: 2,
                  type: 2,
                },
                {
                  custom_id: 'like=id:1',
                  label: '/like',
                  style: 2,
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
      delete config.combat;

      timeStub.restore();
      characterStub.restore();
      fetchStub.restore();

      findCharacterStub.restore();
    }
  });

  await test.step('not fit for combat (not owned)', async () => {
    const characterStub = stub(
      packs,
      'characters',
      returnsNext([
        Promise.resolve([{
          id: '1',
          packId: 'id',
          name: {
            english: 'full name',
          },
          images: [{
            url: 'image_url',
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

    const findCharacterStub = stub(
      db,
      'findCharacter',
      () => undefined as any,
    );

    config.combat = true;
    config.appId = 'app_id';
    config.origin = 'http://localhost:8000';

    try {
      const message = stats.view({
        userId: 'user_id',
        guildId: 'guild_id',
        token: 'test_token',
        character: 'character_id',
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
              thumbnail: {
                url: 'http://localhost:8000/external/image_url?size=thumbnail',
              },
              fields: [
                {
                  name: 'full name',
                  value: '\u200B',
                },
              ],
              footer: {
                text: "Character is yet to be found and isn't combat ready",
              },
            },
          ],
        },
      );
    } finally {
      delete config.appId;
      delete config.origin;
      delete config.combat;

      timeStub.restore();
      characterStub.restore();
      fetchStub.restore();

      findCharacterStub.restore();
    }
  });

  await test.step('maintenance', () => {
  });
});
