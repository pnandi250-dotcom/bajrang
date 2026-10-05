/**
 * परीक्षण के लिए न्यूनतम `window` — ऐप १००% ऑफ़लाइन है, इसलिए jsdom जैसा
 * भारी वातावरण यहाँ ज़रूरी नहीं; store को बस एक localStorage चाहिए।
 */

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  get length(): number {
    return this.data.size;
  }
}

const storage = new MemoryStorage();

const listeners = new Set<() => void>();

// store.ts `window.localStorage` और `window.addEventListener` इस्तेमाल करता है
(globalThis as unknown as { window: unknown }).window = {
  localStorage: storage,
  addEventListener: (name: string, fn: () => void) => {
    if (name === "storage") listeners.add(fn);
  },
  removeEventListener: (name: string, fn: () => void) => {
    if (name === "storage") listeners.delete(fn);
  },
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
};

export { storage };
