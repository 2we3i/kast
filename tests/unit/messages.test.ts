import {
  type MessageFormatElement,
  parse,
  TYPE,
} from "@formatjs/icu-messageformat-parser";
import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import lt from "../../messages/lt.json";
import ru from "../../messages/ru.json";

type Tree = { [key: string]: Tree | string | unknown[] };

/** Every leaf message keyed by its dotted path; arrays are compared whole. */
function flatten(tree: Tree, prefix = ""): Map<string, unknown> {
  const entries = Object.entries(tree).flatMap(
    (pair): Array<[string, unknown]> => {
      const [key, value] = pair;
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return [...flatten(value as Tree, path)];
      }
      return [[path, value]];
    },
  );
  return new Map(entries);
}

/** The argument names a message reads, plural and select included. */
function argumentsOf(elements: MessageFormatElement[]): Set<string> {
  const names = new Set<string>();
  const visit = (nodes: MessageFormatElement[]) => {
    for (const node of nodes) {
      if (node.type === TYPE.literal || node.type === TYPE.pound) continue;
      if (node.type === TYPE.tag) {
        visit(node.children);
        continue;
      }
      names.add(node.value);
      if (node.type === TYPE.plural || node.type === TYPE.select) {
        for (const option of Object.values(node.options)) visit(option.value);
      }
    }
  };
  visit(elements);
  return names;
}

const english = flatten(en as Tree);
const locales = { lt: flatten(lt as Tree), ru: flatten(ru as Tree) };

describe("messages", () => {
  for (const [locale, messages] of Object.entries(locales)) {
    it(`${locale} has exactly the English keys`, () => {
      expect([...messages.keys()].sort()).toEqual([...english.keys()].sort());
    });

    it(`${locale} messages parse and use only arguments English passes`, () => {
      for (const [key, value] of messages) {
        if (typeof value !== "string") continue;
        const source = english.get(key);
        if (typeof source !== "string") continue;
        const expected = argumentsOf(parse(source));
        const actual = argumentsOf(parse(value));
        for (const name of actual) {
          expect(expected, `${locale}:${key} reads {${name}}`).toContain(name);
        }
      }
    });
  }

  it("English messages parse", () => {
    for (const [key, value] of english) {
      if (typeof value !== "string") continue;
      expect(() => parse(value), key).not.toThrow();
    }
  });
});
