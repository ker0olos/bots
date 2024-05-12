// deno-lint-ignore-file no-explicit-any

import { assertEquals } from '$std/assert/mod.ts';

import { assertSpyCall, spy, stub } from '$std/testing/mock.ts';

import * as discord from '~/src/discord.ts';

import utils from '~/src/utils.ts';
import config from '~/src/config.ts';

import { handler } from '~/src/interactions.ts';

import user from '~/src/user.ts';
import packs from '~/src/packs.ts';
import search from '~/src/search.ts';
import gacha from '~/src/gacha.ts';
import help from '~/src/help.ts';
import trade from '~/src/trade.ts';
import shop from '~/src/shop.ts';

import merge from '~/src/merge.ts';

import steal from '~/src/steal.ts';
import skills from '~/src/skills.ts';
import battle from '~/src/battle.ts';
import stats from '~/src/stats.ts';
import party from '~/src/party.ts';
import tower from '~/src/tower.ts';
import chat from '~/src/chat.ts';

config.global = true;

Deno.test('media components', async () => {
  const body = JSON.stringify({
    id: 'id',
    token: 'token',
    type: discord.InteractionType.Component,
    guild_id: 'guild_id',

    data: {
      custom_id: 'media=media_id',
    },
  });

  const validateStub = stub(utils, 'validateRequest', () => ({} as any));

  const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
    valid: true,
    body,
  } as any));

  const setTypeSpy = spy(() => ({
    send: () => true,
  }));

  const searchStub = stub(search, 'media', () =>
    ({
      setType: setTypeSpy,
    }) as any);

  config.publicKey = 'publicKey';

  try {
    const request = new Request('http://localhost:8000', {
      body,
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': 'ed25519',
        'X-Signature-Timestamp': 'timestamp',
      },
    });

    const response = await handler(request);

    assertSpyCall(validateStub, 0, {
      args: [request, {
        POST: {
          headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
        },
      }],
    });

    assertSpyCall(signatureStub, 0, {
      args: [{
        body,
        signature: 'ed25519',
        timestamp: 'timestamp',
        publicKey: 'publicKey',
      }],
    });

    assertSpyCall(setTypeSpy, 0, {
      args: [discord.MessageType.Update],
    });

    assertSpyCall(searchStub, 0, {
      args: [{
        token: 'token',
        id: 'media_id',
        guildId: 'guild_id',
      }],
    });

    assertEquals(response, true as any);
  } finally {
    delete config.publicKey;

    searchStub.restore();
    validateStub.restore();
    signatureStub.restore();
  }
});

Deno.test('character components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'character=character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const searchStub = stub(search, 'character', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(searchStub, 0, {
        args: [{
          token: 'token',
          guildId: 'guild_id',

          id: 'character_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      searchStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('new message', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'character=character_id=1',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const searchStub = stub(search, 'character', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.New],
      });

      assertSpyCall(searchStub, 0, {
        args: [{
          token: 'token',
          guildId: 'guild_id',

          id: 'character_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      searchStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('media characters components', async () => {
  const body = JSON.stringify({
    id: 'id',
    token: 'token',
    type: discord.InteractionType.Component,
    guild_id: 'guild_id',

    member: {
      user: {
        id: 'user_id',
      },
    },
    data: {
      custom_id: 'mcharacters=media_id=1',
    },
  });

  const validateStub = stub(utils, 'validateRequest', () => ({} as any));

  const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
    valid: true,
    body,
  } as any));

  const setTypeSpy = spy(() => ({
    send: () => true,
  }));

  const searchStub = stub(search, 'mediaCharacters', () =>
    ({
      setType: setTypeSpy,
    }) as any);

  config.publicKey = 'publicKey';

  try {
    const request = new Request('http://localhost:8000', {
      body,
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': 'ed25519',
        'X-Signature-Timestamp': 'timestamp',
      },
    });

    const response = await handler(request);

    assertSpyCall(validateStub, 0, {
      args: [request, {
        POST: {
          headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
        },
      }],
    });

    assertSpyCall(signatureStub, 0, {
      args: [{
        body,
        signature: 'ed25519',
        timestamp: 'timestamp',
        publicKey: 'publicKey',
      }],
    });

    assertSpyCall(setTypeSpy, 0, {
      args: [discord.MessageType.Update],
    });

    assertSpyCall(searchStub, 0, {
      args: [{
        id: 'media_id',
        userId: 'user_id',
        guildId: 'guild_id',
        index: 1,
        token: 'token',
      }],
    });

    assertEquals(response, true as any);
  } finally {
    delete config.publicKey;

    searchStub.restore();
    validateStub.restore();
    signatureStub.restore();
  }
});

Deno.test('collection list components', async (test) => {
  await test.step('stars', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'list=user_id==5==0',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const userStub = stub(user, 'list', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',
          rating: 5,
          id: undefined,
          index: 0,
          picture: false,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('stars (picture view)', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'list=user_id==5=1=0',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const userStub = stub(user, 'list', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',
          rating: 5,
          id: undefined,
          index: 0,
          picture: true,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('media', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'list=user_id=media_id===0',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const userStub = stub(user, 'list', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',
          rating: NaN,
          id: 'media_id',
          index: 0,
          picture: false,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('media (picture view)', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'list=user_id=media_id==1=0',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const userStub = stub(user, 'list', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',
          rating: NaN,
          id: 'media_id',
          index: 0,
          picture: true,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('collection showcase components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'showcase=user_id=5',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const userStub = stub(user, 'showcase', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',
          index: 5,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('like components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'like=character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const userStub = stub(user, 'like', () =>
      ({
        send: () => true,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',

          id: 'character_id',
          mention: true,
          undo: false,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('new message', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'like=character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const userStub = stub(user, 'like', () =>
      ({
        send: () => true,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',

          id: 'character_id',
          mention: true,
          undo: false,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('likeslist components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'likes=user_id=0=1',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const userStub = stub(user, 'likeslist', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',
          filter: false,
          index: 1,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('filter', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'likes=user_id=1=0',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const userStub = stub(user, 'likeslist', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          guildId: 'guild_id',
          filter: true,
          index: 0,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('found components', async (test) => {
  await test.step('prev', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'found=media_id=1=prev',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const searchStub = stub(search, 'mediaFound', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(searchStub, 0, {
        args: [{
          index: 1,
          token: 'token',
          id: 'media_id',
          userId: 'user_id',
          guildId: 'guild_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      searchStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('next', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'found=media_id=1=prev',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const searchStub = stub(search, 'mediaFound', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(searchStub, 0, {
        args: [{
          index: 1,
          token: 'token',
          id: 'media_id',
          userId: 'user_id',
          guildId: 'guild_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      searchStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('gacha components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'gacha=user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const gachaStub = stub(gacha, 'start', () =>
      ({
        send: () => true,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(gachaStub, 0, {
        args: [{
          token: 'token',
          quiet: false,
          mention: true,
          guarantee: undefined,
          userId: 'user_id',
          guildId: 'guild_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      gachaStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('pull', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'pull=user_id=4',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const gachaStub = stub(gacha, 'start', () =>
      ({
        send: () => true,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(gachaStub, 0, {
        args: [{
          token: 'token',
          guarantee: 4,
          quiet: false,
          mention: true,
          userId: 'user_id',
          guildId: 'guild_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      gachaStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('quiet', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'q=user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const gachaStub = stub(gacha, 'start', () =>
      ({
        send: () => true,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(gachaStub, 0, {
        args: [{
          token: 'token',
          quiet: true,
          mention: true,
          guarantee: undefined,
          userId: 'user_id',
          guildId: 'guild_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      gachaStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('buy components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'buy=normal=user_id=3',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const shopStub = stub(shop, 'confirmNormal', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(shopStub, 0, {
        args: [{
          userId: 'user_id',
          guildId: 'guild_id',
          amount: 3,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      shopStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('guaranteed', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'buy=guaranteed=user_id=5',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const shopStub = stub(shop, 'confirmGuaranteed', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(shopStub, 0, {
        args: [{
          userId: 'user_id',
          stars: 5,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      shopStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('bguaranteed', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'buy=bguaranteed=user_id=5',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const shopStub = stub(shop, 'guaranteed', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(shopStub, 0, {
        args: [{
          userId: 'user_id',
          stars: 5,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      shopStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('keys', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'buy=keys=user_id=2',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const shopStub = stub(shop, 'confirmKeys', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(shopStub, 0, {
        args: [{
          userId: 'user_id',
          guildId: 'guild_id',
          amount: 2,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      shopStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('normal no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'buy=normal=another_user_id=3',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('guaranteed no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'buy=guaranteed=another_user_id=5',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('keys no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'buy=keys=another_user_id=2',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('now components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'now=user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const userStub = stub(user, 'now', () =>
      ({
        send: () => true,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(userStub, 0, {
        args: [{
          userId: 'user_id',
          guildId: 'guild_id',
          mention: true,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      userStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('help components', async () => {
  const body = JSON.stringify({
    id: 'id',
    token: 'token',
    type: discord.InteractionType.Component,
    guild_id: 'guild_id',

    member: {
      user: {
        id: 'user_id',
      },
    },
    data: {
      custom_id: 'help==1',
    },
  });

  const validateStub = stub(utils, 'validateRequest', () => ({} as any));

  const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
    valid: true,
    body,
  } as any));

  const setTypeSpy = spy(() => ({
    send: () => true,
  }));

  const helpStub = stub(help, 'pages', () =>
    ({
      setType: setTypeSpy,
    }) as any);

  config.publicKey = 'publicKey';

  try {
    const request = new Request('http://localhost:8000', {
      body,
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': 'ed25519',
        'X-Signature-Timestamp': 'timestamp',
      },
    });

    const response = await handler(request);

    assertSpyCall(validateStub, 0, {
      args: [request, {
        POST: {
          headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
        },
      }],
    });

    assertSpyCall(signatureStub, 0, {
      args: [{
        body,
        signature: 'ed25519',
        timestamp: 'timestamp',
        publicKey: 'publicKey',
      }],
    });

    assertSpyCall(setTypeSpy, 0, {
      args: [discord.MessageType.Update],
    });

    assertSpyCall(helpStub, 0, {
      args: [{
        userId: 'user_id',
        index: 1,
      }],
    });

    assertEquals(response, true as any);
  } finally {
    delete config.publicKey;

    helpStub.restore();
    validateStub.restore();
    signatureStub.restore();
  }
});

Deno.test('give components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id:
          'give=user_id=target_id=character_id&character_id2&character_id3',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const tradeStub = stub(trade, 'give', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(tradeStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          targetId: 'target_id',
          giveCharactersIds: ['character_id', 'character_id2', 'character_id3'],
          guildId: 'guild_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      tradeStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'give=another_user_id=target_id=character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('trade components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'target_id',
        },
      },
      data: {
        custom_id:
          'trade=user_id=target_id=given_character_id&given_character_id2&given_character_id3=taken_character_id&taken_character_id2&taken_character_id3',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const tradeStub = stub(trade, 'accepted', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(tradeStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          targetId: 'target_id',
          giveCharactersIds: [
            'given_character_id',
            'given_character_id2',
            'given_character_id3',
          ],
          takeCharactersIds: [
            'taken_character_id',
            'taken_character_id2',
            'taken_character_id3',
          ],
          guildId: 'guild_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      tradeStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id:
          'trade=user_id=target_id=given_character_id=taken_character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('synthesis components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'test_token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'synthesis=user_id=5',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const synthesisStub = stub(merge, 'confirmed', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(synthesisStub, 0, {
        args: [{
          token: 'test_token',
          userId: 'user_id',
          guildId: 'guild_id',

          target: 5,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      synthesisStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'synthesis=another_user_id=5',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('steal components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'steal=user_id=character_id=40',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const tradeStub = stub(steal, 'attempt', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(setTypeSpy, 0, {
        args: [discord.MessageType.Update],
      });

      assertSpyCall(tradeStub, 0, {
        args: [{
          token: 'token',
          userId: 'user_id',
          characterId: 'character_id',
          guildId: 'guild_id',
          pre: 40,
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;

      tradeStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'steal=another_user_id=character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('community packs install', async (test) => {
  await test.step('normal', async () => {
    const pack = {
      id: 'pack_id',
    };

    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'install=pack_id=user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const listStub = stub(packs, 'all', () => Promise.resolve([pack as any]));

    const packsStub = stub(packs, 'install', () =>
      ({
        send: () => true,
      }) as any);

    config.publicKey = 'publicKey';
    config.communityPacks = true;

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(packsStub, 0, {
        args: [{
          userId: 'user_id',
          guildId: 'guild_id',
          id: 'pack_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;
      delete config.communityPacks;

      listStub.restore();
      packsStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('community packs uninstall', async (test) => {
  await test.step('normal', async () => {
    const pack = {
      id: 'pack_id',
    };

    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'uninstall=pack_id=user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const listStub = stub(packs, 'all', () => Promise.resolve([pack as any]));

    const packsStub = stub(packs, 'uninstall', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';
    config.communityPacks = true;

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(packsStub, 0, {
        args: [{
          userId: 'user_id',
          guildId: 'guild_id',
          id: 'pack_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;
      delete config.communityPacks;

      listStub.restore();
      packsStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const pack = {
      id: 'pack_id',
    };

    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'uninstall=pack_id=another_user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const listStub = stub(packs, 'all', () => Promise.resolve([pack as any]));

    config.publicKey = 'publicKey';
    config.communityPacks = true;

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;
      delete config.communityPacks;

      listStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('disable builtin packs', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'disable-builtins=user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const packsStub = stub(packs, 'confirmDisableBuiltins', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';
    config.communityPacks = true;

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(packsStub, 0, {
        args: [{
          userId: 'user_id',
          guildId: 'guild_id',
        }],
      });

      assertEquals(response, true as any);
    } finally {
      delete config.publicKey;
      delete config.communityPacks;

      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'disable-builtins=another_user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';
    config.communityPacks = true;

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;
      delete config.communityPacks;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

// Deno.test('stats components', async (test) => {
//   await test.step('normal', async () => {
//     const body = JSON.stringify({
//       id: 'id',
//       token: 'token',
//       type: discord.InteractionType.Component,
//       guild_id: 'guild_id',
//       member: {
//         user: {
//           id: 'user_id',
//         },
//       },
//       data: {
//         custom_id: 'stats=atk=user_id=character_id',
//       },
//     });

//     const validateStub = stub(utils, 'validateRequest', () => ({} as any));

//     const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
//       valid: true,
//       body,
//     } as any));

//     const setTypeSpy = spy(() => ({
//       send: () => true,
//     }));

//     const statsStub = stub(stats, 'update', () =>
//       ({
//         setType: setTypeSpy,
//       }) as any);

//     config.publicKey = 'publicKey';

//     try {
//       const request = new Request('http://localhost:8000', {
//         body,
//         method: 'POST',
//         headers: {
//           'X-Signature-Ed25519': 'ed25519',
//           'X-Signature-Timestamp': 'timestamp',
//         },
//       });

//       const response = await handler(request);

//       assertSpyCall(validateStub, 0, {
//         args: [request, {
//           POST: {
//             headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
//           },
//         }],
//       });

//       assertSpyCall(signatureStub, 0, {
//         args: [{
//           body,
//           signature: 'ed25519',
//           timestamp: 'timestamp',
//           publicKey: 'publicKey',
//         }],
//       });

//       assertSpyCall(setTypeSpy, 0, {
//         args: [discord.MessageType.Update],
//       });

//       assertSpyCall(statsStub, 0, {
//         args: [{
//           token: 'token',
//           userId: 'user_id',
//           characterId: 'character_id',
//           guildId: 'guild_id',
//           type: 'atk',
//         }],
//       });

//       assertEquals(response, true as any);
//     } finally {
//       delete config.publicKey;

//       statsStub.restore();
//       validateStub.restore();
//       signatureStub.restore();
//     }
//   });

//   await test.step('no permission', async () => {
//     const body = JSON.stringify({
//       id: 'id',
//       token: 'token',
//       type: discord.InteractionType.Component,
//       guild_id: 'guild_id',
//       member: {
//         user: {
//           id: 'user_id',
//         },
//       },
//       data: {
//         custom_id: 'stats=str=another_user_id=character_id',
//       },
//     });

//     const validateStub = stub(utils, 'validateRequest', () => ({} as any));

//     const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
//       valid: true,
//       body,
//     } as any));

//     config.publicKey = 'publicKey';

//     try {
//       const request = new Request('http://localhost:8000', {
//         body,
//         method: 'POST',
//         headers: {
//           'X-Signature-Ed25519': 'ed25519',
//           'X-Signature-Timestamp': 'timestamp',
//         },
//       });

//       const response = await handler(request);

//       assertSpyCall(validateStub, 0, {
//         args: [request, {
//           POST: {
//             headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
//           },
//         }],
//       });

//       assertSpyCall(signatureStub, 0, {
//         args: [{
//           body,
//           signature: 'ed25519',
//           timestamp: 'timestamp',
//           publicKey: 'publicKey',
//         }],
//       });

//       assertEquals(response?.ok, true);
//       assertEquals(response?.redirected, false);

//       assertEquals(response?.status, 200);
//       assertEquals(response?.statusText, 'OK');

//       const json = JSON.parse(
//         // deno-lint-ignore no-non-null-assertion
//         (await response?.formData()).get('payload_json')!.toString(),
//       );

//       assertEquals({
//         type: 4,
//         data: {
//           flags: 64,
//           content: '',
//           attachments: [],
//           components: [],
//           embeds: [
//             {
//               type: 'rich',
//               description:
//                 "You don't have permission to complete this interaction!",
//             },
//           ],
//         },
//       }, json);
//     } finally {
//       delete config.publicKey;

//       validateStub.restore();
//       signatureStub.restore();
//     }
//   });
// });

Deno.test('battle components', async (test) => {
  await test.step('skip', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'sbattle=battle_id=user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const battleStub = stub(battle, 'skipBattle', () => undefined as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 7,
        data: {
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              image: {
                url: 'http://localhost:8000/assets/spinner3.gif',
              },
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      battleStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('skip no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'sbattle=battle_id=another_user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('skills components', async (test) => {
  await test.step('page 1', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'skills=buff=1',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const skillsStub = stub(skills, 'all', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(skillsStub, 0, {
        args: [1, 'buff', undefined],
      });
    } finally {
      delete config.publicKey;

      skillsStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('stats components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'stats=character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const statsStub = stub(stats, 'view', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(statsStub, 0, {
        args: [{
          token: 'token',
          character: 'id=character_id',
          guildId: 'guild_id',
          userId: 'user_id',
        }],
      });
    } finally {
      delete config.publicKey;

      statsStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('cacquire components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'cacquire=user_id=character_id=crit',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const skillsStub = stub(skills, 'acquire', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(skillsStub, 0, {
        args: [{
          characterId: 'character_id',
          guildId: 'guild_id',
          skillKey: 'crit',
          userId: 'user_id',
        }],
      });
    } finally {
      delete config.publicKey;

      skillsStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'cacquire=another_user_id=character_id=crit',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
          attachments: [],
          components: [],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('treclear components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'treclear',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const skillsStub = stub(tower, 'reclear', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(skillsStub, 0, {
        args: [{
          token: 'token',
          guildId: 'guild_id',
          userId: 'user_id',
        }],
      });
    } finally {
      delete config.publicKey;

      skillsStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('passign components', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'passign=user_id=character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const partyStub = stub(party, 'assign', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(partyStub, 0, {
        args: [{
          token: 'token',
          id: 'character_id',
          guildId: 'guild_id',
          userId: 'user_id',
        }],
      });
    } finally {
      delete config.publicKey;

      partyStub.restore();
      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'passign=another_user_id=character_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
          attachments: [],
          components: [],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('cancel dialog', async (test) => {
  await test.step('canceled', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'cancel',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 7,
        data: {
          embeds: [
            {
              type: 'rich',
              description: 'Cancelled',
            },
          ],
          content: '',
          attachments: [],
          components: [],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('declined', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'target_id',
        },
      },
      data: {
        custom_id: 'cancel=user_id=target_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 7,
        data: {
          embeds: [
            {
              type: 'rich',
              description: 'Declined',
            },
          ],
          content: '',
          attachments: [],
          components: [],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission 1', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'cancel=another_user_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
          attachments: [],
          components: [],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission 2', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',

      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'cancel=another_user_id=target_id',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
          attachments: [],
          components: [],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('reply modal component', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'reply=user_id=character_id=Character Name',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 9,
        data: {
          custom_id: 'reply=user_id=character_id',
          title: 'Reply to Character Name',
          components: [{
            type: 1,
            components: [{
              custom_id: 'message',
              label: 'Message',
              max_length: 2048,
              min_length: 1,
              style: 2,
              type: 4,
            }],
          }],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Component,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'reply=another_user_id=character_id=Character Name',
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});

Deno.test('reply modal submit component', async (test) => {
  await test.step('normal', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Modal,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'reply=user_id=character_id',
        components: [{
          components: [{
            custom_id: 'message',
            value: 'test message',
          }],
        }],
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    const setTypeSpy = spy(() => ({
      send: () => true,
    }));

    const chatStub = stub(chat, 'run', () =>
      ({
        setType: setTypeSpy,
      }) as any);

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertSpyCall(chatStub, 0, {
        args: [{
          token: 'token',
          id: 'character_id',
          guildId: 'guild_id',
          member: { user: { id: 'user_id' } } as any,
          message: 'test message',
          continue: true,
        }],
      });
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
      chatStub.restore();
    }
  });

  await test.step('no permission', async () => {
    const body = JSON.stringify({
      id: 'id',
      token: 'token',
      type: discord.InteractionType.Modal,
      guild_id: 'guild_id',
      member: {
        user: {
          id: 'user_id',
        },
      },
      data: {
        custom_id: 'reply=another_user_id=character_id',
        components: [{
          components: [{
            custom_id: 'message',
            value: 'test message',
          }],
        }],
      },
    });

    const validateStub = stub(utils, 'validateRequest', () => ({} as any));

    const signatureStub = stub(utils, 'verifySignature', ({ body }) => ({
      valid: true,
      body,
    } as any));

    config.publicKey = 'publicKey';

    try {
      const request = new Request('http://localhost:8000', {
        body,
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'ed25519',
          'X-Signature-Timestamp': 'timestamp',
        },
      });

      const response = await handler(request);

      assertSpyCall(validateStub, 0, {
        args: [request, {
          POST: {
            headers: ['X-Signature-Ed25519', 'X-Signature-Timestamp'],
          },
        }],
      });

      assertSpyCall(signatureStub, 0, {
        args: [{
          body,
          signature: 'ed25519',
          timestamp: 'timestamp',
          publicKey: 'publicKey',
        }],
      });

      assertEquals(response?.ok, true);
      assertEquals(response?.redirected, false);

      assertEquals(response?.status, 200);
      assertEquals(response?.statusText, 'OK');

      const json = JSON.parse(
        // deno-lint-ignore no-non-null-assertion
        (await response?.formData()).get('payload_json')!.toString(),
      );

      assertEquals({
        type: 4,
        data: {
          flags: 64,
          content: '',
          attachments: [],
          components: [],
          embeds: [
            {
              type: 'rich',
              description:
                "You don't have permission to complete this interaction!",
            },
          ],
        },
      }, json);
    } finally {
      delete config.publicKey;

      validateStub.restore();
      signatureStub.restore();
    }
  });
});
