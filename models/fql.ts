// deno-lint-ignore-file no-explicit-any

import {
  Client,
  query,
} from 'https://deno.land/x/fauna@5.0.0-deno-alpha9/mod.js';

import {
  Expr,
  ExprArg,
  type query as _query,
} from 'https://deno.land/x/fauna@5.0.0-deno-alpha9/mod.d.ts';

const _fql = query as typeof _query;

type TypedExpr<T> = Expr & { type?: T };

export type StringExpr = string | TypedExpr<'string'>;
export type NumberExpr = number | TypedExpr<'number'>;
export type BooleanExpr = boolean | TypedExpr<'boolean'>;

export type NullExpr = TypedExpr<'null'>;
export type TimeExpr = TypedExpr<'time'>;
export type IndexExpr = TypedExpr<'index'>;
export type MatchExpr = TypedExpr<'match'>;
export type RefExpr = TypedExpr<'ref'>;

export type ResponseExpr = TypedExpr<'response'>;

export type UserExpr = TypedExpr<'user'>;
export type GuildExpr = TypedExpr<'guild'>;
export type InstanceExpr = TypedExpr<'instance'>;
export type InventoryExpr = TypedExpr<'inventory'>;
export type CharacterExpr = TypedExpr<'character'>;

function Ref(document: Expr): RefExpr {
  return _fql.Select('ref', document);
}

function Id(name: StringExpr, id: StringExpr): RefExpr {
  return _fql.Ref(_fql.Collection(name), id);
}

function Create<T = Expr>(collection: string, data: T): Expr {
  return _fql.Create(_fql.Collection(collection), {
    data,
  });
}

function Update<T = Expr>(ref: RefExpr, data: Partial<T>): Expr {
  return _fql.Update(ref, {
    data,
  });
}

function Index(name: string): IndexExpr {
  return _fql.FaunaIndex(name);
}

function Match(index: IndexExpr, ...terms: ExprArg[]): MatchExpr {
  return _fql.Match(index, ...terms);
}

function Get(refOrMatch: RefExpr | MatchExpr): Expr {
  return _fql.Get(refOrMatch);
}

function Append(ref: RefExpr, items: Expr): RefExpr[] {
  return _fql.Append(ref, items) as unknown as RefExpr[];
}

function Paginate(
  expr: Expr,
  { size, before, after }: { size?: number; before?: RefExpr; after?: RefExpr },
): Expr {
  return _fql.Paginate(expr, {
    size,
    before,
    after,
  });
}

// function Map<T = Expr>(
//   refOrMatch: RefExpr | MatchExpr,
//   map: (ref: RefExpr) => Expr,
// ): T[] {
//   return _fql.Map(refOrMatch, map) as unknown as T[];
// }

function IsNonEmpty(expr: Expr): BooleanExpr {
  return _fql.IsNonEmpty(expr);
}

function And(a: BooleanExpr, b: BooleanExpr): BooleanExpr {
  return _fql.And(a, b);
}

function GTE(a: NumberExpr, b: NumberExpr): BooleanExpr {
  return _fql.GTE(a, b);
}

function LTE(a: NumberExpr, b: NumberExpr): BooleanExpr {
  return _fql.LTE(a, b);
}

function Subtract(a: NumberExpr, b: NumberExpr): NumberExpr {
  return _fql.Subtract(a, b);
}

function If<A = Expr, B = Expr>(
  cond: BooleanExpr,
  _then: Expr | ExprArg,
  _else: Expr | ExprArg,
): A | B {
  return _fql.If(cond, _then, _else) as A | B;
}

// function Equals<A = Expr, B = Expr>(a?: A, b?: B): BooleanExpr {
//   // deno-lint-ignore no-non-null-assertion
//   return _fql.Equals(a!, b!);
// }

function IsNull(expr?: ExprArg): BooleanExpr {
  // deno-lint-ignore no-non-null-assertion
  return _fql.Equals(expr!, fql.Null());
}

function Let<T, U>(
  params: { [K in keyof T]: T[K] },
  cb: (shadows: typeof params) => U,
): U {
  const shadows: any = {};

  for (const obj of Object.keys(params)) {
    shadows[obj] = _fql.Var(obj);
  }

  return _fql.Let(params, cb(shadows) as any) as U;
}

function Var(name: StringExpr): Expr {
  return _fql.Var(name);
}

function Length(expr: Expr): NumberExpr {
  return _fql.Count(expr);
}

function Select(
  path: (StringExpr | NumberExpr)[],
  from: Expr,
  _default?: Expr,
): Expr {
  return _fql.Select(path, from, _default);
}

function Reverse(expr: Expr): Expr {
  return _fql.Reverse(expr);
}

function TimeDiffInMinutes(a: TimeExpr, b: TimeExpr): NumberExpr {
  return _fql.TimeDiff(a, b, 'minutes');
}

function Now(): TimeExpr {
  return _fql.Now();
}

function Null(): NullExpr {
  return null as unknown as NullExpr;
}

function Indexer(
  { client, name, unique, collection, terms }: {
    client: Client;
    unique: boolean;
    collection: string;
    name: string;
    terms: {
      field: string[];
    }[];
  },
): () => Promise<void> {
  const params = {
    name,
    unique,
    source: _fql.Collection(collection),
    terms,
  };

  return () =>
    client.query(
      _fql.If(
        _fql.Exists(_fql.FaunaIndex(name)),
        _fql.Update(_fql.FaunaIndex(name), params),
        _fql.CreateIndex(params),
      ),
    );
}

function Resolver(
  { client, name, lambda }: {
    name: string;
    client: Client;
    lambda: (...vars: any[]) => ExprArg;
  },
): () => Promise<void> {
  const params = {
    name,
    body: _fql.Query(lambda),
  };

  return () =>
    client.query(
      _fql.If(
        _fql.Exists(_fql.FaunaFunction(name)),
        _fql.Update(_fql.FaunaFunction(name), params),
        _fql.CreateFunction(params),
      ),
    );
}

export const fql = {
  // Map,
  // Equals,
  And,
  Append,
  Create,
  Get,
  GTE,
  Id,
  If,
  Index,
  Indexer,
  IsNonEmpty,
  IsNull,
  Length,
  Let,
  LTE,
  Match,
  Now,
  Null,
  Paginate,
  Ref,
  Resolver,
  Reverse,
  Select,
  Subtract,
  TimeDiffInMinutes,
  Update,
  Var,
};

export type { Client };