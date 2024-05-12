// deno-lint-ignore-file no-non-null-assertion no-explicit-any

import { assert, assertEquals } from '$std/assert/mod.ts';

import { assertSpyCall, assertSpyCalls, stub } from '$std/testing/mock.ts';

import utils, { ImageSize } from '~/src/utils.ts';

import * as discord from '~/src/discord.ts';

import config from '~/src/config.ts';

Deno.test('interactions', async (test) => {
  await test.step('command', () => {
    const body = JSON.stringify({
      id: 'body_id',
      token: 'body_token',
      type: discord.InteractionType.Command,
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        name: 'name',
        options: [{
          name: 'text',
          value: 'text',
        }, {
          name: 'boolean',
          value: true,
        }, {
          name: 'number',
          value: 420,
        }],
      },
    });

    const interaction = new discord.Interaction<string | number | boolean>(
      body,
    );

    assertEquals(interaction.id, 'body_id');
    assertEquals(interaction.token, 'body_token');

    assertEquals(interaction.type, 2);

    assertEquals(interaction.name, 'name');

    assertEquals(interaction.member!.user.id, 'user_id');

    assertEquals(interaction.options['text'], 'text');
    assertEquals(interaction.options['boolean'], true);
    assertEquals(interaction.options['number'], 420);
  });

  await test.step('interactions', () => {
    const body = JSON.stringify({
      id: 'body_id',
      token: 'body_token',
      type: discord.InteractionType.Component,
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'test_id=abc=123',
        components: [{
          type: 1,
          components: [{
            custom_id: 'text',
            value: 'text',
          }, {
            custom_id: 'boolean',
            value: true,
          }, {
            custom_id: 'number',
            value: 420,
          }],
        }],
      },
    });

    const interaction = new discord.Interaction<string | number | boolean>(
      body,
    );

    assertEquals(interaction.id, 'body_id');
    assertEquals(interaction.token, 'body_token');

    assertEquals(interaction.type, 3);

    assertEquals(interaction.customType, 'test_id');
    assertEquals(interaction.customValues, ['abc', '123']);

    assertEquals(interaction.member!.user.id, 'user_id');

    // assertEquals(interaction.options['text'], 'text');
    // assertEquals(interaction.options['boolean'], true);
    // assertEquals(interaction.options['number'], 420);
  });

  await test.step('select menu', () => {
    const body = JSON.stringify({
      id: 'body_id',
      token: 'body_token',
      type: discord.InteractionType.Component,
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        type: discord.ComponentType.StringSelect,
        custom_id: 'test_id=1',
        values: ['test_value', 'test_value_2'],
      },
    });

    const interaction = new discord.Interaction<string | number | boolean>(
      body,
    );

    assertEquals(interaction.id, 'body_id');
    assertEquals(interaction.token, 'body_token');

    assertEquals(interaction.type, 3);

    assertEquals(interaction.customType, 'test_id');
    assertEquals(interaction.customValues, ['test_value', 'test_value_2']);

    assertEquals(interaction.member!.user.id, 'user_id');
  });

  await test.step('user', () => {
    const body = JSON.stringify({
      id: 'body_id',
      token: 'body_token',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        type: 2,
        name: 'TEST_COMMAND',
        target_id: 'another_user_id',
        resolved: {
          members: {
            'another_user_id': {
              nick: 'Nickname',
            },
          },
          users: {
            'another_user_id': {
              username: 'Another User',
            },
          },
        },
      },
    });

    const interaction = new discord.Interaction<string>(
      body,
    );

    assertEquals(interaction.id, 'body_id');
    assertEquals(interaction.token, 'body_token');

    assertEquals(interaction.type, 2);

    assertEquals(interaction.name, 'test_command');

    assertEquals(interaction.member!.user.id, 'user_id');

    assertEquals(interaction.options['user'], 'another_user_id');

    assertEquals(
      interaction.resolved?.members?.['another_user_id'].nick,
      'Nickname',
    );

    assertEquals(
      interaction.resolved?.users?.['another_user_id'].username,
      'Another User',
    );
  });
});

Deno.test('embeds', () => {
  const embed = new discord.Embed();

  embed
    .setAuthor({ name: 'a', url: 'b', icon_url: 'c' })
    .setTitle('abc')
    .setDescription('abc')
    .setUrl('abc')
    .setColor('#3E5F8A')
    .setThumbnail({ url: 'abc' })
    .setImage({ url: 'abc' })
    .setFooter({ text: 'a', icon_url: 'b' });

  assertEquals(embed.json().type, 'rich');
  assertEquals(embed.json().fields, undefined);

  assertEquals(embed.json().author!.name, 'a');
  assertEquals(embed.json().author!.url, 'b');
  assertEquals(embed.json().author!.icon_url, 'c');

  assertEquals(embed.json().title, 'abc');

  assertEquals(embed.json().description!, 'abc');

  assertEquals(embed.json().url, 'abc');

  assertEquals(embed.json().color!, 4087690);

  assertEquals(
    embed.json().thumbnail!.url,
    'undefined/external/abc?size=thumbnail',
  );

  assertEquals(
    embed.json().image!.url,
    'undefined/external/abc',
  );

  assertEquals(embed.json().footer!.text, 'a');
  assertEquals(embed.json().footer!.icon_url, 'b');

  embed.addField({ name: 'a', value: 'b' });
  embed.addField({ name: 'c', value: 'd', inline: true });

  assertEquals(embed.json().fields!.length, 2);

  assertEquals(embed.json().fields![0], {
    name: 'a',
    value: 'b',
  });

  assertEquals(embed.json().fields![1], {
    name: 'c',
    value: 'd',
    inline: true,
  });
});

Deno.test('components', async (test) => {
  await test.step('general', () => {
    const component = new discord.Component();

    component
      .setId('custom_id')
      .setEmote({
        id: 'emote_id',
        name: 'emote_name',
        animated: true,
      })
      .setLabel('label');

    assertEquals(component.json(), {
      type: 2,
      style: 2,
      custom_id: 'custom_id',
      emoji: {
        id: 'emote_id',
        name: 'emote_name',
        animated: true,
      },
      label: 'label',
    });
  });

  await test.step('select menu', () => {
    const component = new discord.Component();

    component
      .setId('custom_id')
      .setOptions([{
        label: 'label',
        value: 'value',
        default: true,
        description: 'description',
        emote: {
          id: 'emote_id',
          name: 'emote_name',
          animated: false,
        },
      }]);

    assertEquals(component.json(), {
      type: 3,
      custom_id: 'custom_id',
      options: [{
        label: 'label',
        value: 'value',
        default: true,
        description: 'description',
        emoji: {
          id: 'emote_id',
          name: 'emote_name',
          animated: false,
        },
      }],
    });
  });

  await test.step('new with non-default type', () => {
    assertEquals(
      new discord.Component(discord.ComponentType.UserSelect).json().type,
      5,
    );
  });

  await test.step('new with placeholder', () => {
    const component = new discord.Component(discord.ComponentType.TextInput);

    component.setPlaceholder('placeholder');

    assertEquals(component.json(), {
      type: 4,
      style: 1,
      placeholder: 'placeholder',
    });
  });

  await test.step('new with url', () => {
    const component = new discord.Component();

    component.setUrl('url');

    assertEquals(component.json(), {
      type: 2,
      style: 5,
      url: 'url',
    });
  });

  await test.step('set style', () => {
    const component = new discord.Component();

    component.setStyle(discord.ButtonStyle.Blue);

    assertEquals(component.json(), {
      type: 2,
      style: 1,
    });
  });
});

Deno.test('attachments', async (test) => {
  await test.step('add', () => {
    const message = new discord.Message();

    message
      .addAttachment({
        type: 'image/png',
        arrayBuffer: new ArrayBuffer(8),
        filename: 'file.test',
      });

    assertEquals(message.json(), {
      type: 4,
      data: {
        attachments: [
          {
            filename: 'file.test',
            id: '0',
          },
        ],
        components: [],
        embeds: [],
      },
    });
  });

  await test.step('clear', () => {
    const message = new discord.Message();

    const embed = new discord.Embed();

    embed.setTitle('abc');

    message
      .addAttachment({
        type: 'image/png',
        arrayBuffer: new ArrayBuffer(8),
        filename: 'file.test',
      });

    message.addEmbed(embed);

    assertEquals(message.json(), {
      type: 4,
      data: {
        components: [],
        attachments: [{
          filename: 'file.test',
          id: '0',
        }],
        embeds: [{
          title: 'abc',
          type: 'rich',
        }],
      },
    });

    message.clearAttachments();

    assertEquals(message.json(), {
      type: 4,
      data: {
        components: [],
        attachments: [],
        embeds: [{
          title: 'abc',
          type: 'rich',
        }],
      },
    });
  });

  await test.step('clear and clear embeds', () => {
    const message = new discord.Message();
    const embed = new discord.Embed();

    embed.setTitle('abc');

    message
      .addAttachment({
        type: 'image/png',
        arrayBuffer: new ArrayBuffer(8),
        filename: 'file.test',
      });

    message.addEmbed(embed);

    assertEquals(message.json(), {
      type: 4,
      data: {
        components: [],
        attachments: [{
          filename: 'file.test',
          id: '0',
        }],
        embeds: [{
          title: 'abc',
          type: 'rich',
        }],
      },
    });

    message.clearEmbedsAndAttachments();

    assertEquals(message.json(), {
      type: 4,
      data: {
        attachments: [],
        components: [],
        embeds: [],
      },
    });
  });
});

Deno.test('suggestions', async (test) => {
  await test.step('normal', () => {
    const message = new discord.Message();

    message.addSuggestions({ name: 'a', value: 'b' }, { value: 'c' });

    assertEquals(message.json(), {
      type: 8,
      data: {
        choices: [{
          name: 'a',
          value: 'b',
        }, {
          name: 'c',
          value: 'c',
        }],
      },
    });
  });

  await test.step('no suggestions', () => {
    const message = new discord.Message(discord.MessageType.Suggestions);

    assertEquals(message.json(), {
      type: 8,
      data: {
        choices: [],
      },
    });
  });
});

Deno.test('messages', async (test) => {
  await test.step('normal', () => {
    const message = new discord.Message();

    assertEquals(message.json().type, 4);

    message.setContent('content');

    assertEquals(message.json().data.content, 'content');
  });

  await test.step('set flags', () => {
    const message = new discord.Message();

    assert(!message.json().data.flags);

    message.setFlags(discord.MessageFlags.Ephemeral);

    assertEquals(message.json().data.flags, 1 << 6);
  });

  await test.step('set type', () => {
    const message = new discord.Message(discord.MessageType.Update);

    assertEquals(message.json().type, 7);

    message.setType(discord.MessageType.Pong);

    assertEquals(message.json().type, 1);
  });

  await test.step('adding embeds and components', () => {
    const message = new discord.Message();

    message.addEmbed(new discord.Embed());
    message.addComponents([new discord.Component()]);

    assertEquals(message.json(), {
      type: 4,
      data: {
        attachments: [],
        components: [{
          type: 1,
          components: [{
            type: 2,
            style: 2,
            label: undefined,
          }],
        }],
        embeds: [{
          type: 'rich',
        }],
      },
    });
  });

  await test.step('inserting components', () => {
    const message = new discord.Message();

    message.addComponents([
      new discord.Component().setId('1'),
      new discord.Component().setId('2'),
    ]);

    message.insertComponents([
      new discord.Component().setId('3'),
    ]);

    assertEquals(message.json(), {
      type: 4,
      data: {
        attachments: [],
        components: [{
          type: 1,
          components: [
            {
              type: 2,
              style: 2,
              custom_id: '3',
              label: undefined,
            },
            {
              type: 2,
              style: 2,
              custom_id: '1',
              label: undefined,
            },
            {
              type: 2,
              style: 2,
              custom_id: '2',
              label: undefined,
            },
          ],
        }],
        embeds: [],
      },
    });
  });

  await test.step('modals', () => {
    const component = new discord.Message();

    component
      .setTitle('title')
      .setId('custom_id');

    assertEquals(component.json(), {
      type: 9,
      data: {
        components: [],
        custom_id: 'custom_id',
        title: 'title',
      },
    });
  });

  await test.step('send', async () => {
    const message = new discord.Message().setContent('content');

    const response = message.send();

    assertEquals(
      response.status,
      200,
    );

    assertEquals(
      response.statusText,
      'OK',
    );

    const json = JSON.parse(
      (await response?.formData()).get('payload_json')!.toString(),
    );

    assertEquals(json, {
      type: 4,
      data: {
        embeds: [],
        attachments: [],
        components: [],
        content: 'content',
      },
    });
  });
});

Deno.test('static messages', async (test) => {
  await test.step('pong', async () => {
    const message = discord.Message.pong();

    const json = await message.json();

    assertEquals(json, {
      type: 1,
    });
  });

  await test.step('dialog', () => {
    const message = discord.Message.dialog({
      type: 'type',
      confirm: 'confirm_id',
      description: 'description',
      message: new discord.Message()
        .addEmbed(new discord.Embed().setTitle('title')),
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [
          {
            type: 'rich',
            title: 'title',
          },
          {
            type: 'rich',
            description: 'description',
          },
        ],
        attachments: [],
        components: [{
          type: 1,
          components: [
            {
              custom_id: 'type=confirm_id',
              label: 'Confirm',
              style: 2,
              type: 2,
            },
            {
              custom_id: 'cancel',
              label: 'Cancel',
              style: 4,
              type: 2,
            },
          ],
        }],
      },
    });
  });

  await test.step('dialog 2', () => {
    const message = discord.Message.dialog({
      confirm: ['type', 'confirm_id2'],
      description: 'description',
      message: new discord.Message()
        .addEmbed(new discord.Embed().setTitle('title')),
      confirmText: 'Accept',
      cancelText: 'Decline',
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [
          {
            type: 'rich',
            title: 'title',
          },
          {
            type: 'rich',
            description: 'description',
          },
        ],
        attachments: [],
        components: [{
          type: 1,
          components: [
            {
              custom_id: 'type=confirm_id2',
              label: 'Accept',
              style: 2,
              type: 2,
            },
            {
              custom_id: 'cancel',
              label: 'Decline',
              style: 4,
              type: 2,
            },
          ],
        }],
      },
    });
  });

  await test.step('dialog 2', () => {
    const message = discord.Message.dialog({
      confirm: ['type', 'confirm_id2'],
      message: new discord.Message()
        .addEmbed(new discord.Embed().setTitle('title')),
      confirmText: 'Accept',
      cancelText: 'Decline',
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [
          {
            type: 'rich',
            title: 'title',
          },
        ],
        attachments: [],
        components: [{
          type: 1,
          components: [
            {
              custom_id: 'type=confirm_id2',
              label: 'Accept',
              style: 2,
              type: 2,
            },
            {
              custom_id: 'cancel',
              label: 'Decline',
              style: 4,
              type: 2,
            },
          ],
        }],
      },
    });
  });

  await test.step('internal error', () => {
    const message = discord.Message.internal('id');

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [
          {
            description:
              'An Internal Error occurred and was reported.\n```ref_id: id```',
            type: 'rich',
          },
        ],
        components: [],
        attachments: [],
      },
    });
  });
});

Deno.test('patch messages', async () => {
  const fetchStub = stub(
    utils,
    'fetchWithRetry',
    () => true as any,
  );

  try {
    const message = new discord.Message();

    await message.patch('token');

    const form = new FormData();

    form.append(
      'payload_json',
      JSON.stringify({
        embeds: [],
        attachments: [],
        components: [],
      }),
    );

    assertSpyCalls(fetchStub, 1);

    assertSpyCall(fetchStub, 0, {
      args: [
        'https://discord.com/api/v10/webhooks/undefined/token/messages/@original',
        {
          method: 'PATCH',
          body: form,
          headers: {
            'User-Agent':
              'Fable (https://github.com/ker0olos/fable, localhost)',
          },
        },
      ],
      returned: true as any,
    });
  } finally {
    fetchStub.restore();
  }
});

Deno.test('followup messages', async () => {
  const fetchStub = stub(
    utils,
    'fetchWithRetry',
    () => true as any,
  );

  try {
    const message = new discord.Message();

    await message.followup('token');

    const form = new FormData();

    form.append(
      'payload_json',
      JSON.stringify({
        embeds: [],
        attachments: [],
        components: [],
      }),
    );

    assertSpyCalls(fetchStub, 1);

    assertSpyCall(fetchStub, 0, {
      args: [
        'https://discord.com/api/v10/webhooks/undefined/token',
        {
          method: 'POST',
          body: form,
          headers: {
            'User-Agent':
              'Fable (https://github.com/ker0olos/fable, localhost)',
          },
        },
      ],
      returned: true as any,
    });
  } finally {
    fetchStub.restore();
  }
});

Deno.test('page messages', async (test) => {
  await test.step('1/2', () => {
    const message = discord.Message.page({
      index: 0,
      total: 2,
      type: 'type',
      target: 'target',
      next: true,
      message: new discord.Message()
        .addEmbed(new discord.Embed().setTitle('title')),
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [{
          type: 'rich',
          title: 'title',
        }],
        attachments: [],
        components: [{
          type: 1,
          components: [
            {
              custom_id: 'type=target=1=prev',
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
              custom_id: 'type=target=1=next',
              label: 'Next',
              style: 2,
              type: 2,
            },
          ],
        }],
      },
    });
  });

  await test.step('2/2', () => {
    const message = discord.Message.page({
      index: 1,
      total: 2,
      type: 'type',
      target: 'target',
      next: false,
      message: new discord.Message()
        .addEmbed(new discord.Embed().setTitle('title')),
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [{
          type: 'rich',
          title: 'title',
        }],
        attachments: [],
        components: [{
          type: 1,
          components: [
            {
              custom_id: 'type=target=0=prev',
              label: 'Prev',
              style: 2,
              type: 2,
            },
            {
              custom_id: '_',
              disabled: true,
              label: '2/2',
              style: 2,
              type: 2,
            },
            {
              custom_id: 'type=target=0=next',
              label: 'Next',
              style: 2,
              type: 2,
            },
          ],
        }],
      },
    });
  });

  await test.step('2/3', () => {
    const message = discord.Message.page({
      index: 1,
      total: 3,
      type: 'type',
      target: 'target',
      next: true,
      message: new discord.Message()
        .addEmbed(new discord.Embed().setTitle('title')),
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [{
          type: 'rich',
          title: 'title',
        }],
        attachments: [],
        components: [{
          type: 1,
          components: [{
            custom_id: 'type=target=0=prev',
            label: 'Prev',
            style: 2,
            type: 2,
          }, {
            custom_id: '_',
            disabled: true,
            label: '2/3',
            style: 2,
            type: 2,
          }, {
            custom_id: 'type=target=2=next',
            label: 'Next',
            style: 2,
            type: 2,
          }],
        }],
      },
    });
  });

  await test.step('1/?', () => {
    const message = discord.Message.page({
      index: 0,
      type: 'type',
      target: 'target',
      next: true,
      message: new discord.Message()
        .addEmbed(new discord.Embed().setTitle('title')),
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [{
          type: 'rich',
          title: 'title',
        }],
        attachments: [],
        components: [{
          type: 1,
          components: [{
            custom_id: '_',
            disabled: true,
            label: '1',
            style: 2,
            type: 2,
          }, {
            custom_id: 'type=target=1=next',
            label: 'Next',
            style: 2,
            type: 2,
          }],
        }],
      },
    });
  });

  await test.step('1/1', () => {
    const message = discord.Message.page({
      index: 0,
      total: 1,
      type: 'type',
      target: 'target',
      next: false,
      message: new discord.Message()
        .addEmbed(new discord.Embed().setTitle('title')),
    });

    assertEquals(message.json(), {
      type: 4,
      data: {
        embeds: [{
          type: 'rich',
          title: 'title',
        }],
        attachments: [],
        components: [{
          type: 1,
          components: [
            {
              custom_id: 'type=target=0=prev',
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
              custom_id: 'type=target=0=next',
              label: 'Next',
              style: 2,
              type: 2,
            },
          ],
        }],
      },
    });
  });
});

Deno.test('emotes', async (test) => {
  for (const [name, tag] of Object.entries(discord.emotes)) {
    await test.step(name, async () => {
      const id = /<.*:.*:(.*)>/.exec(tag);

      const response = await fetch(
        `https://cdn.discordapp.com/emojis/${
          id
            ?.[1]
        }.webp?size=44&quality=lossless`,
      );

      assertEquals(response.status, 200);

      assertEquals(response.headers.get('content-type'), 'image/webp');

      // needs to close request body or test will fail
      await response.body?.cancel();
    });
  }
});

Deno.test('images', async (test) => {
  await test.step('no proxy no default', () => {
    const embed = new discord.Embed();

    embed.setImage({
      default: false,
      proxy: false,
      size: ImageSize.Medium,
      url: 'url',
    });

    assertEquals(
      embed.json().image!.url,
      'url',
    );
  });

  await test.step('attachment', () => {
    const embed = new discord.Embed();

    embed.setImage({
      default: true,
      proxy: true,
      size: ImageSize.Medium,
      url: 'attachment://image',
    });

    assertEquals(
      embed.json().image!.url,
      'attachment://image',
    );
  });

  await test.step('origin', () => {
    try {
      config.origin = 'http://localhost:8080';

      const embed = new discord.Embed();

      embed.setImage({
        default: true,
        proxy: true,
        size: ImageSize.Medium,
        url: 'http://localhost:8080/image',
      });

      assertEquals(
        embed.json().image!.url,
        'http://localhost:8080/image',
      );
    } finally {
      delete config.origin;
    }
  });

  await test.step('no default', () => {
    const embed = new discord.Embed();

    embed.setImage({
      default: false,
      proxy: true,
      size: ImageSize.Large,
      url: 'url',
    });

    assertEquals(
      embed.json().image!.url,
      'undefined/external/url',
    );
  });

  await test.step('no proxy', () => {
    const embed = new discord.Embed();

    embed.setImage({
      default: true,
      proxy: false,
      size: ImageSize.Large,
      url: 'url',
    });

    assertEquals(
      embed.json().image!.url,
      'undefined/external/url',
    );
  });
});

Deno.test('thumbnails', async (test) => {
  await test.step('no proxy no default', () => {
    const embed = new discord.Embed();

    embed.setThumbnail({
      default: false,
      proxy: false,
      url: 'url',
    });

    assertEquals(
      embed.json().thumbnail!.url,
      'url',
    );
  });

  await test.step('attachment', () => {
    const embed = new discord.Embed();

    embed.setThumbnail({
      default: true,
      proxy: true,
      url: 'attachment://image',
    });

    assertEquals(
      embed.json().thumbnail!.url,
      'attachment://image',
    );
  });

  await test.step('origin', () => {
    try {
      config.origin = 'http://localhost:8080';

      const embed = new discord.Embed();

      embed.setThumbnail({
        default: true,
        proxy: true,
        url: 'http://localhost:8080/image',
      });

      assertEquals(
        embed.json().thumbnail!.url,
        'http://localhost:8080/image',
      );
    } finally {
      delete config.origin;
    }
  });

  await test.step('no default', () => {
    const embed = new discord.Embed();

    embed.setThumbnail({
      default: false,
      proxy: true,
      url: 'url',
    });

    assertEquals(
      embed.json().thumbnail!.url,
      'undefined/external/url?size=thumbnail',
    );
  });

  await test.step('no proxy', () => {
    const embed = new discord.Embed();

    embed.setThumbnail({
      default: true,
      proxy: false,
      url: 'url',
    });

    assertEquals(
      embed.json().thumbnail!.url,
      'undefined/external/url?size=thumbnail',
    );
  });
});
