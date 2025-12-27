import { expect, test } from "vitest";
import emojiRegex from "emoji-regex-xs";
import { EMOJI_ANNOTATION_PLACEHOLDER, exportedForTesting } from "src/annotatedLink";
import { sanitizeRegexInput } from "src/utils";

const { constructAnnotationRegex } = exportedForTesting;

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
