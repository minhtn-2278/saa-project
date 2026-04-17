import { describe, it, expect } from "vitest";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import jaMessages from "@/messages/ja.json";

/**
 * Recursively collect dot-path keys from a nested object.
 */
function collectKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return [prefix];
  }
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    keys.push(...collectKeys(v, path));
  }
  return keys;
}

describe("i18n key parity for awardsPage.*", () => {
  const viKeys = collectKeys(
    (viMessages as Record<string, unknown>).awardsPage
  ).sort();
  const enKeys = collectKeys(
    (enMessages as Record<string, unknown>).awardsPage
  ).sort();
  const jaKeys = collectKeys(
    (jaMessages as Record<string, unknown>).awardsPage
  ).sort();

  it("vi has non-empty awardsPage namespace", () => {
    expect(viKeys.length).toBeGreaterThan(0);
  });

  it("en has the same keys as vi", () => {
    expect(enKeys).toEqual(viKeys);
  });

  it("ja has the same keys as vi", () => {
    expect(jaKeys).toEqual(viKeys);
  });
});
