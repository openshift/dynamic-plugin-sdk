import { mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

/** Fetch but the response is stored in disk */
export const cachedFetch: typeof fetch = async (url, options) => {
  const cachePath = resolve(
    __dirname,
    '../../cached',
    encodeURIComponent(url.toString()) + '.json',
  );
  mkdirSync(dirname(cachePath), { recursive: true });

  try {
    const data = readFileSync(cachePath, 'utf8');
    return new Response(data, { status: 200 });
  } catch (err) {
    const res = await fetch(url, options);
    const data = await res.text();
    if (res.ok) {
      import('fs').then((fs) => {
        fs.writeFileSync(cachePath, data, 'utf8');
      });
    }
    // Return a new Response so the body can be read again
    return new Response(data, { ...res });
  }
};
