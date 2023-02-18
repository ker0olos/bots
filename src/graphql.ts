import { GraphQLError } from './errors.ts';

// deno-lint-ignore no-explicit-any
type Variables = { [key: string]: any };

// deno-lint-ignore no-explicit-any
export function gql(chunks: TemplateStringsArray, ...variables: any[]): string {
  return chunks.reduce(
    (accumulator, chunk, index) =>
      `${accumulator}${chunk}${index in variables ? variables[index] : ''}`,
    '',
  );
}

// deno-lint-ignore no-explicit-any
export async function request<T = any, V = Variables>(
  { url, query, headers, variables }: {
    url: string;
    query: string;
    headers?: HeadersInit;
    variables?: V | undefined;
  },
): Promise<T> {
  const options: {
    method: string;
    headers: Headers;
    body: string;
  } = {
    method: 'POST',
    headers: new Headers(headers ?? {}),
    body: JSON.stringify({
      query,
      variables,
    }),
  };

  options.headers.append('Content-Type', 'application/json');
  options.headers.append('Accept', 'application/json');

  try {
    const response = await fetch(url, options);

    const json = await response.json();

    if (json.errors || !response.ok) {
      throw new Error(JSON.stringify(json.errors || json));
    }

    return json.data;
  } catch (err) {
    throw new GraphQLError(
      url,
      query,
      variables,
      err.message,
    );
  }
}