export interface MemoizeOptions<Args extends unknown[]> {
  getKey?: (...args: Args) => string;
  maxSize?: number;
  onCacheHit?: (...args: Args) => void;
}

export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  { getKey, maxSize = 50, onCacheHit }: MemoizeOptions<Args> = {},
): (...args: Args) => Result {
  const cache = new Map<string, Result>();
  const keys: string[] = [];

  const resolveKey = getKey ?? ((...args: Args) => JSON.stringify(args));

  return (...args: Args) => {
    const key = resolveKey(...args);
    if (cache.has(key)) {
      onCacheHit?.(...args);
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    keys.push(key);

    if (keys.length > maxSize) {
      const oldest = keys.shift();
      if (oldest) {
        cache.delete(oldest);
      }
    }

    return result;
  };
}

