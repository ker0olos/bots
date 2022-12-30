import nacl from 'https://cdn.skypack.dev/tweetnacl@v1.0.3?dts';

import { Media } from './repo.interface.ts';

export function randint(min: number, max: number) {
  return Math.floor((Math.random()) * (max - min + 1)) + min;
}

export function hexToInt(hex?: string): number | undefined {
  if (!hex) {
    return;
  }

  const color = hex.substring(1);

  const R = color.substring(0, 2);
  const G = color.substring(2, 4);
  const B = color.substring(4, 6);

  return parseInt(`${R}${G}${B}`, 16);
}

export function shuffle<T>(array: T[]) {
  for (
    let i = 0, length = array.length, swap = 0, temp = null;
    i < length;
    i++
  ) {
    swap = Math.floor(Math.random() * (i + 1));
    temp = array[swap];
    array[swap] = array[i];
    array[i] = temp;
  }
}

export const sleep = (secs: number) =>
  new Promise((resolve) => setTimeout(resolve, secs * 1000));

export function rng<T>(dict: { [chance: number]: T }): T {
  const pool = Object.values(dict);

  const chances = Object.keys(dict).map((n) => parseInt(n));

  const sum = chances.reduce((a, b) => a + b);

  if (sum !== 100) {
    throw new Error(`Sum of ${chances} is ${sum} when it should be 100`);
  }

  const _ = [];

  for (let i = 0; i < chances.length; i++) {
    // if chance is 5 - add 5 items to the array
    // if chance is 90 - add 90 items to the array
    for (let y = 0; y < chances[i]; y++) {
      // push the index of the item not it's value
      _.push(i);
    }
  }

  // shuffle the generated chances array
  // which is the RNG part of this function
  shuffle(_);

  // use the first item from the shuffled array on the pool
  return pool[_[0]];
}

export function capitalize(s: string): string {
  const sa = s.split('_');
  return sa.map((s) => s[0].toUpperCase() + s.slice(1).toLowerCase()).join(' ')
    .trim();
}

export function decodeDescription(s?: string): string | undefined {
  if (!s) {
    return;
  }

  s = decodeURI(s);

  s = s.replaceAll('&amp;', '&');
  s = s.replaceAll('&quot;', '"');
  s = s.replaceAll('&#039;', '\'');
  s = s.replaceAll('&lt;', '<');
  s = s.replaceAll('&gt;', '>');

  s = s.replaceAll(/~!.+!~/gm, '');

  s = s.replace(/<i.*?>((.|\n)*?)<\/i>/g, '*$1*');
  s = s.replace(/<b.*?>((.|\n)*?)<\/b>/g, '**$1**');
  s = s.replace(/<strike.*?>((.|\n)*?)<\/strike>/g, '~~$1~~');

  s = s.replaceAll(/<br>|<\/br>|<br\/>|<hr>|<\/hr>/gm, '\n');

  s = s.replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)');

  return s;
}

export function titlesToArray(media: Media): string[] {
  const titles = [
    media.title.english,
    media.title.romaji,
    media.title.native,
  ].filter(Boolean);

  return titles as string[];
}

export async function verifySignature(
  request: Request,
  publicKey: string,
): Promise<{ valid: boolean; body: string }> {
  const signature = request.headers.get('X-Signature-Ed25519')!;
  const timestamp = request.headers.get('X-Signature-Timestamp')!;

  const body = await request.text();

  function hexToUint8Array(hex: string) {
    return new Uint8Array(
      hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)),
    );
  }

  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(publicKey),
  );

  return { valid, body };
}
