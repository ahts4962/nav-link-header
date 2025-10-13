import { expect, test } from "vitest";
import emojiRegex from "emoji-regex-xs";
import { EMOJI_ANNOTATION_PLACEHOLDER, exportedForTesting } from "src/annotatedLink";
import { sanitizeRegexInput } from "src/utils";

const { constructAnnotationRegex, removeCode } = exportedForTesting;

test("remove YAML front matter", () => {
  let content;
  let expected;

  content = '---\nnum: 1\nstring: "string"\nlist:\n  - 1\n  - 2\n---\ncontent';
  expected = "content";
  expect(removeCode(content)).toBe(expected);

  content = " ---\nfront matter\n---\n";
  expected = " ---\nfront matter\n---\n";
  expect(removeCode(content)).toBe(expected);

  content = "--- \nfront matter\n---\n";
  expected = "--- \nfront matter\n---\n";
  expect(removeCode(content)).toBe(expected);

  content = "---\n---\n";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "------\n";
  expected = "------\n";
  expect(removeCode(content)).toBe(expected);

  content = "---\nfront matter\n ---\n";
  expected = "---\nfront matter\n ---\n";
  expect(removeCode(content)).toBe(expected);

  content = "---\nfront matter\n--- \n";
  expected = "---\nfront matter\n--- \n";
  expect(removeCode(content)).toBe(expected);

  content = "---\nfront matter\n---";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "---\n\n---\n";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "---\nfront matter\n---\n---\nfront matter\n---\n";
  expected = "---\nfront matter\n---\n";
  expect(removeCode(content)).toBe(expected);
});

test("remove code blocks", () => {
  let content;
  let expected;

  // First step
  content = "```ts\ncode\n```\n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "text\n```\ncode\n```\n";
  expected = "text\n\n";
  expect(removeCode(content)).toBe(expected);

  content = " ```\ncode\n```\n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "````\ncode\n````\n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "```ts\ncode\ntext```\n";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "```\n```\n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "```\ncode\n````\n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "```\ncode\n ```\n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "```\ncode\n``` \n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "```\ncode\n```text\n";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "```\ncode\n`` `\n";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "`` `\ncode\n```\n";
  expected = "`\ncode\n";
  expect(removeCode(content)).toBe(expected);

  content = "```\n`code`\n```\n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "````\n```\ncode\n```\n````\n";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "```\ncode\n```\ntext\n`````\ncode\n`````\n";
  expected = "\ntext\n\n";
  expect(removeCode(content)).toBe(expected);

  // Second step
  content = "```\ncode";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = " ```\ncode";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "````\ncode";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "````\ncode\n```";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "```ts\ncode";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "```ts";
  expected = "";
  expect(removeCode(content)).toBe(expected);

  content = "\n```ts";
  expected = "\n";
  expect(removeCode(content)).toBe(expected);

  content = "```ts`";
  expected = "``";
  expect(removeCode(content)).toBe(expected);

  content = "````\ncode\n```\ncode\n```";
  expected = "";
  expect(removeCode(content)).toBe(expected);
});

test("remove inline codes", () => {
  let content;
  let expected;

  content = "text`code`text";
  expected = "texttext";
  expect(removeCode(content)).toBe(expected);

  content = "text``code``text";
  expected = "texttext";
  expect(removeCode(content)).toBe(expected);

  content = "text`code``text";
  expected = "text`code``text";
  expect(removeCode(content)).toBe(expected);

  content = "text``code`text";
  expected = "text`text";
  expect(removeCode(content)).toBe(expected);

  content = "text`code\ncode`text";
  expected = "texttext";
  expect(removeCode(content)).toBe(expected);

  content = "text`code\n\ncode`text";
  expected = "text`code\n\ncode`text";
  expect(removeCode(content)).toBe(expected);

  content = "text```code```text";
  expected = "texttext";
  expect(removeCode(content)).toBe(expected);

  content = "text`code`";
  expected = "text";
  expect(removeCode(content)).toBe(expected);

  content = "text`code` text`code`text";
  expected = "text texttext";
  expect(removeCode(content)).toBe(expected);

  content = "text`code```text```code`text";
  expected = "texttext";
  expect(removeCode(content)).toBe(expected);
});

test("remove all codes", () => {
  let content;
  let expected;

  content =
    '---\nnum: 1\nstring: "string"\nlist:\n  - 1\n  - 2\n---\n' +
    "text\n" +
    "```ts\ncode\n```\n" +
    "text`code`text\n";
  expected = "text\n\ntexttext\n";
  expect(removeCode(content)).toBe(expected);

  content = "\n---\na: a\n---\n" + "text`text\n" + "```\ncode\n```\n" + "text`text\n";
  expected = "\n---\na: a\n---\ntext`text\n\ntext`text\n";
  expect(removeCode(content)).toBe(expected);
});

test("construct annotation regex", () => {
  const vs = "[\\uFE0E\\uFE0F]?";
  expect(constructAnnotationRegex("abc", false)).toBe("abc");
  expect(constructAnnotationRegex("abc", true)).toBe("abc");
  expect(constructAnnotationRegex("🔗", false)).toBe("🔗");
  expect(constructAnnotationRegex("🔗", true)).toBe(`🔗${vs}`);
  expect(constructAnnotationRegex("a🔗b", false)).toBe("a🔗b");
  expect(constructAnnotationRegex("a🔗b", true)).toBe(`a🔗${vs}b`);
  expect(constructAnnotationRegex("🔗\uFE0F", false)).toBe("🔗\uFE0F");
  expect(constructAnnotationRegex("🔗\uFE0F", true)).toBe(`🔗${vs}`);
  expect(constructAnnotationRegex("🔗\uFE0E", false)).toBe("🔗\uFE0E");
  expect(constructAnnotationRegex("🔗\uFE0E", true)).toBe(`🔗${vs}\uFE0E`);
  expect(constructAnnotationRegex("🏳️‍🌈", false)).toBe("🏳️‍🌈");
  expect(constructAnnotationRegex("🏳️‍🌈", true)).toBe(`\u{1F3F3}${vs}\u200D${vs}\u{1F308}${vs}`);
  expect(constructAnnotationRegex("🔗🏳️‍🌈", false)).toBe("🔗🏳️‍🌈");
  expect(constructAnnotationRegex("🔗🏳️‍🌈", true)).toBe(
    `🔗${vs}\u{1F3F3}${vs}\u200D${vs}\u{1F308}${vs}`
  );

  const ep = sanitizeRegexInput(EMOJI_ANNOTATION_PLACEHOLDER);
  const emojiRegexSource = `(?:${emojiRegex().source})`;
  expect(constructAnnotationRegex(ep, false)).toBe(emojiRegexSource);
  expect(constructAnnotationRegex(ep, true)).toBe(emojiRegexSource);
  expect(constructAnnotationRegex(`a${ep}b`, false)).toBe(`a${emojiRegexSource}b`);
  expect(constructAnnotationRegex(`a${ep}b`, true)).toBe(`a${emojiRegexSource}b`);
  expect(constructAnnotationRegex(`a${ep}b${ep}c`, false)).toBe(
    `a${emojiRegexSource}b${emojiRegexSource}c`
  );
  expect(constructAnnotationRegex(`a${ep}b${ep}c`, true)).toBe(
    `a${emojiRegexSource}b${emojiRegexSource}c`
  );

  expect(constructAnnotationRegex(`🔗${ep}🏳️‍🌈`, false)).toBe(`🔗${emojiRegexSource}🏳️‍🌈`);
  expect(constructAnnotationRegex(`🔗${ep}🏳️‍🌈`, true)).toBe(
    `🔗${vs}${emojiRegexSource}\u{1F3F3}${vs}\u200D${vs}\u{1F308}${vs}`
  );
});
