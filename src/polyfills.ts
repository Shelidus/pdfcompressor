/**
 * Polyfills for browser backwards compatibility (Chrome <= 116, Firefox <= 120, Safari <= 17.3, Edge <= 116)
 * Required especially for pdfjs-dist and modern ECMAScript features.
 */

// 1. Promise.withResolvers polyfill (Introduced in Chrome 119 / Safari 17.4 / Firefox 121)
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// 2. Object.groupBy polyfill (Introduced in Chrome 117 / Safari 17.4 / Firefox 119)
if (typeof (Object as any).groupBy === 'undefined') {
  (Object as any).groupBy = function <T, K extends PropertyKey>(
    items: Iterable<T>,
    callback: (item: T, index: number) => K
  ): Record<K, T[]> {
    const result = {} as Record<K, T[]>;
    let index = 0;
    for (const item of items) {
      const key = callback(item, index++);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    }
    return result;
  };
}

// 3. Map.groupBy polyfill (Introduced in Chrome 117)
if (typeof (Map as any).groupBy === 'undefined') {
  (Map as any).groupBy = function <T, K>(
    items: Iterable<T>,
    callback: (item: T, index: number) => K
  ): Map<K, T[]> {
    const result = new Map<K, T[]>();
    let index = 0;
    for (const item of items) {
      const key = callback(item, index++);
      if (!result.has(key)) {
        result.set(key, []);
      }
      result.get(key)!.push(item);
    }
    return result;
  };
}

// 4. Array.prototype.toReversed, toSorted, toSpliced, with polyfills (Chrome 110+)
const arrayProto = Array.prototype as any;

if (!arrayProto.toReversed) {
  arrayProto.toReversed = function <T>(this: T[]): T[] {
    return [...this].reverse();
  };
}

if (!arrayProto.toSorted) {
  arrayProto.toSorted = function <T>(this: T[], compareFn?: (a: T, b: T) => number): T[] {
    return [...this].sort(compareFn);
  };
}

if (!arrayProto.toSpliced) {
  arrayProto.toSpliced = function <T>(
    this: T[],
    start: number,
    deleteCount?: number,
    ...items: T[]
  ): T[] {
    const copy = [...this];
    if (typeof deleteCount === 'undefined') {
      copy.splice(start);
    } else {
      copy.splice(start, deleteCount, ...items);
    }
    return copy;
  };
}

if (!arrayProto.with) {
  arrayProto.with = function <T>(this: T[], index: number, value: T): T[] {
    const copy = [...this];
    const actualIndex = index < 0 ? copy.length + index : index;
    if (actualIndex >= 0 && actualIndex < copy.length) {
      copy[actualIndex] = value;
    }
    return copy;
  };
}

// 5. Array.prototype.at polyfill
if (!arrayProto.at) {
  arrayProto.at = function <T>(this: T[], index: number): T | undefined {
    const k = index >= 0 ? index : this.length + index;
    return k >= 0 && k < this.length ? this[k] : undefined;
  };
}

// 6. String.prototype.replaceAll polyfill
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (
    this: string,
    search: string | RegExp,
    replacement: string | ((substring: string, ...args: any[]) => string)
  ): string {
    if (search instanceof RegExp) {
      if (!search.global) {
        throw new TypeError('String.prototype.replaceAll called with a non-global RegExp');
      }
      return this.replace(search, replacement as any);
    }
    return this.split(search).join(typeof replacement === 'string' ? replacement : (replacement as any)());
  };
}

// 7. globalThis safety
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

export {};
