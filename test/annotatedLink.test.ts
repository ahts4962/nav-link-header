import { expect, test } from "vitest";
import emojiRegex from "emoji-regex-xs";
import { EMOJI_ANNOTATION_PLACEHOLDER, exportedForTesting } from "src/annotatedLink";

const { convertAnnotationString } = exportedForTesting;

test("process annotation string", () => {
  const vs = "[\\uFE0E\\uFE0F]?";
  expect(convertAnnotationString("abc", false)).toBe("abc");
  expect(convertAnnotationString("abc", true)).toBe("abc");
  expect(convertAnnotationString("🔗", false)).toBe("🔗");
  expect(convertAnnotationString("🔗", true)).toBe(`🔗${vs}`);
  expect(convertAnnotationString("a🔗b", false)).toBe("a🔗b");
  expect(convertAnnotationString("a🔗b", true)).toBe(`a🔗${vs}b`);
  expect(convertAnnotationString("🔗\uFE0F", false)).toBe("🔗\uFE0F");
  expect(convertAnnotationString("🔗\uFE0F", true)).toBe(`🔗${vs}`);
  expect(convertAnnotationString("🔗\uFE0E", false)).toBe("🔗\uFE0E");
  expect(convertAnnotationString("🔗\uFE0E", true)).toBe(`🔗${vs}\uFE0E`);
  expect(convertAnnotationString("🏳️‍🌈", false)).toBe("🏳️‍🌈");
  expect(convertAnnotationString("🏳️‍🌈", true)).toBe(`\u{1F3F3}${vs}\u200D${vs}\u{1F308}${vs}`);
  expect(convertAnnotationString("🔗🏳️‍🌈", false)).toBe("🔗🏳️‍🌈");
  expect(convertAnnotationString("🔗🏳️‍🌈", true)).toBe(
    `🔗${vs}\u{1F3F3}${vs}\u200D${vs}\u{1F308}${vs}`
  );

  const ep = EMOJI_ANNOTATION_PLACEHOLDER;
  const emojiRegexSource = `(?:${emojiRegex().source})`;
  expect(convertAnnotationString(ep, false)).toBe(emojiRegexSource);
  expect(convertAnnotationString(ep, true)).toBe(emojiRegexSource);
  expect(convertAnnotationString(`a${ep}b`, false)).toBe(`a${emojiRegexSource}b`);
  expect(convertAnnotationString(`a${ep}b`, true)).toBe(`a${emojiRegexSource}b`);
  expect(convertAnnotationString(`a${ep}b${ep}c`, false)).toBe(
    `a${emojiRegexSource}b${emojiRegexSource}c`
  );
  expect(convertAnnotationString(`a${ep}b${ep}c`, true)).toBe(
    `a${emojiRegexSource}b${emojiRegexSource}c`
  );

  expect(convertAnnotationString(`🔗${ep}🏳️‍🌈`, false)).toBe(`🔗${emojiRegexSource}🏳️‍🌈`);
  expect(convertAnnotationString(`🔗${ep}🏳️‍🌈`, true)).toBe(
    `🔗${vs}${emojiRegexSource}\u{1F3F3}${vs}\u200D${vs}\u{1F308}${vs}`
  );
});
