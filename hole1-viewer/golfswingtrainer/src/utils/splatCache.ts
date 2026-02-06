import { SplatMesh } from '@sparkjsdev/spark';

const splatCache = new Map<string, any>();

export function getSplatMesh(url: string): any {
  if (splatCache.has(url)) {
    return splatCache.get(url);
  }

  try {
    // @ts-ignore
    const splat = new SplatMesh({ url, editable: true });
    splatCache.set(url, splat);
    return splat;
  } catch (e) {
    console.error(`Failed to load splat: ${url}`, e);
    return null;
  }
}
