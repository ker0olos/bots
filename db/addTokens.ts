import { inventoriesByUser, usersByDiscordId } from './indices.ts';

import db, { kv, MAX_PULLS, MAX_SWEEPS } from './mod.ts';

import { KvError } from '../src/errors.ts';

import type * as Schema from './schema.ts';

export const COSTS = {
  THREE: 4,
  FOUR: 12,
  FIVE: 28,
};

export async function addTokens(
  user: Schema.User,
  amount: number,
): Promise<Schema.User> {
  user.availableTokens ??= 0;

  user.availableTokens = user.availableTokens + amount;

  let res = { ok: false }, retries = 0;

  while (!res.ok && retries < 5) {
    // don't save likes on the user object
    user.likes = undefined;

    res = await kv.atomic()
      .set(['users', user._id], user)
      .set(usersByDiscordId(user.id), user)
      .commit();

    if (res.ok) {
      return user;
    }

    retries += 1;
  }

  throw new KvError('failed to update user');
}

export async function addPulls(
  instance: Schema.Instance,
  _user: Schema.User,
  amount: number,
): Promise<Schema.Inventory> {
  _user.availableTokens ??= 0;

  if (amount > _user.availableTokens) {
    throw new Error('INSUFFICIENT_TOKENS');
  }

  _user.availableTokens = _user.availableTokens - amount;

  let res = { ok: false }, retries = 0;

  while (!res.ok && retries < 5) {
    const { user, inventory, inventoryCheck } = await db.rechargeConsumables(
      instance,
      _user,
      false,
    );

    inventory.availablePulls = Math.min(99, inventory.availablePulls + amount);

    if (inventory.availablePulls >= MAX_PULLS) {
      inventory.rechargeTimestamp = undefined;
    }

    // don't save likes on the user object
    user.likes = undefined;

    res = await kv.atomic()
      .check(inventoryCheck)
      //
      .set(['inventories', inventory._id], inventory)
      .set(inventoriesByUser(inventory.instance, user._id), inventory)
      //
      .set(['users', user._id], user)
      .set(usersByDiscordId(user.id), user)
      //
      .commit();

    if (res.ok) {
      return inventory;
    }

    retries += 1;
  }

  throw new KvError('failed to update inventory');
}

export async function addGuarantee(
  user: Schema.User,
  guarantee: number,
): Promise<Schema.User> {
  const cost = guarantee === 5
    ? COSTS.FIVE
    : guarantee === 4
    ? COSTS.FOUR
    : COSTS.THREE;

  user.guarantees ??= [];
  user.availableTokens ??= 0;

  if (cost > user.availableTokens) {
    throw new Error('INSUFFICIENT_TOKENS');
  }

  user.availableTokens = user.availableTokens - cost;

  user.guarantees.push(guarantee);

  // don't save likes on the user object
  user.likes = undefined;

  const update = await kv.atomic()
    .set(['users', user._id], user)
    .set(usersByDiscordId(user.id), user)
    .commit();

  if (update.ok) {
    return user;
  }

  throw new KvError('failed to update user');
}

export async function addSweeps(
  instance: Schema.Instance,
  _user: Schema.User,
  amount: number,
): Promise<Schema.Inventory> {
  _user.availableTokens ??= 0;

  if (amount > _user.availableTokens) {
    throw new Error('INSUFFICIENT_TOKENS');
  }

  _user.availableTokens = _user.availableTokens - amount;

  let res = { ok: false }, retries = 0;

  while (!res.ok && retries < 5) {
    const { user, inventory, inventoryCheck } = await db.rechargeConsumables(
      instance,
      _user,
      false,
    );

    inventory.availableSweeps = Math.min(
      99,
      // deno-lint-ignore no-non-null-assertion
      inventory.availableSweeps! + amount,
    );

    if (inventory.availableSweeps >= MAX_SWEEPS) {
      inventory.sweepsTimestamp = undefined;
    }

    // don't save likes on the user object
    user.likes = undefined;

    res = await kv.atomic()
      .check(inventoryCheck)
      //
      .set(['inventories', inventory._id], inventory)
      .set(inventoriesByUser(inventory.instance, user._id), inventory)
      //
      .set(['users', user._id], user)
      .set(usersByDiscordId(user.id), user)
      //
      .commit();

    if (res.ok) {
      return inventory;
    }

    retries += 1;
  }

  throw new KvError('failed to update inventory');
}
