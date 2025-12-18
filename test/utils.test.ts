import { expect, test } from "vitest";
import { deepEqual, isFileInFolder, parseMarkdownLink, parseWikiLink } from "src/utils";

test("deep equal", () => {
  expect(deepEqual(1, 1)).toBe(true);
  expect(deepEqual(1, 2)).toBe(false);
  expect(deepEqual("string", "string")).toBe(true);
  expect(deepEqual("string", "str")).toBe(false);
  expect(deepEqual(true, true)).toBe(true);
  expect(deepEqual(true, false)).toBe(false);
  expect(deepEqual(undefined, undefined)).toBe(true);
  expect(deepEqual(undefined, "string")).toBe(false);
  expect(deepEqual(1, [1])).toBe(false);
  expect(deepEqual(1, { a: 1 })).toBe(false);
  expect(deepEqual([1], { a: 1 })).toBe(false);
  expect(deepEqual([1, 2], [1, 2])).toBe(true);
  expect(deepEqual([1, 2], [1, 3])).toBe(false);
  expect(deepEqual([1, 2], [2, 1])).toBe(false);
  expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
  expect(deepEqual({ a: 1, b: undefined }, { a: 1, b: undefined })).toBe(true);
  expect(deepEqual({ a: 1, b: undefined }, { a: 1, b: 2 })).toBe(false);
  expect(deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })).toBe(true);
  expect(deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 4] })).toBe(false);
  expect(deepEqual([1, { x: 2 }], [1, { x: 2 }])).toBe(true);
  expect(deepEqual([1, { x: 2 }], [1, { x: 3 }])).toBe(false);
  expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
  expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true);
  expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false);
  expect(deepEqual([1, { a: { b: [1, 2] } }], [1, { a: { b: [1, 2] } }])).toBe(true);
  expect(deepEqual([1, { a: { b: [1, 2] } }], [1, { a: { b: [1, 3] } }])).toBe(false);
});

test("check if the file is included in the folder", () => {
  expect(isFileInFolder("file", "/")).toBe(true);
  expect(isFileInFolder("file", "/", false)).toBe(true);
  expect(isFileInFolder("folder/file", "/")).toBe(true);
  expect(isFileInFolder("folder/file", "/", false)).toBe(false);
  expect(isFileInFolder("fol/der/file", "/")).toBe(true);
  expect(isFileInFolder("fol/der/file", "/", false)).toBe(false);
  expect(isFileInFolder("file", "folder")).toBe(false);
  expect(isFileInFolder("file", "folder", false)).toBe(false);
  expect(isFileInFolder("folder/file", "folder")).toBe(true);
  expect(isFileInFolder("folder/file", "folder", false)).toBe(true);
  expect(isFileInFolder("fol/der/file", "folder")).toBe(false);
  expect(isFileInFolder("fol/der/file", "folder", false)).toBe(false);
  expect(isFileInFolder("folder/file", "fol")).toBe(false);
  expect(isFileInFolder("folder/file", "fol", false)).toBe(false);
  expect(isFileInFolder("fol/der/file", "fol")).toBe(true);
  expect(isFileInFolder("fol/der/file", "fol", false)).toBe(false);
  expect(isFileInFolder("fol/der/file", "fol/der")).toBe(true);
  expect(isFileInFolder("fol/der/file", "fol/der", false)).toBe(true);
});

test("parse wiki style link", () => {
  let text;
  let expected;

  text = "[[file]]";
  expected = { path: "file", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file.md]]";
  expected = { path: "file.md", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[folder/file.md]]";
  expected = { path: "folder/file.md", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = " [[file]]";
  expected = { path: "file", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file]] ";
  expected = { path: "file", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = " [[file]] ";
  expected = { path: "file", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file]] text";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "text [[file]]";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[ file ]]";
  expected = { path: "file", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[ fi le ]]";
  expected = { path: "fi le", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[]]";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[file]";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "file]]";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[[file]]";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file]]]";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file1]] [[file2]]";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file|display]]";
  expected = { path: "file", displayText: "display" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[folder/file.md|display]]";
  expected = { path: "folder/file.md", displayText: "display" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file|]]";
  expected = { path: "file", displayText: "" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file||]]";
  expected = { path: "file", displayText: "|" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file|display|]]";
  expected = { path: "file", displayText: "display|" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file|display||]]";
  expected = { path: "file", displayText: "display||" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file|display|text]]";
  expected = { path: "file", displayText: "display|text" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file|display|text|]]";
  expected = { path: "file", displayText: "display|text|" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file#header]]";
  expected = { path: "file", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file#header|display]]";
  expected = { path: "file", displayText: "display" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[folder/file.md#header|display]]";
  expected = { path: "folder/file.md", displayText: "display" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file#header|]]";
  expected = { path: "file", displayText: "" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file|display#header]]";
  expected = { path: "file", displayText: "display#header" };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file##header]]";
  expected = { path: "file", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[[file#head#er]]";
  expected = { path: "file", displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);

  text = "[display](file)";
  expected = { path: undefined, displayText: undefined };
  expect(parseWikiLink(text)).toStrictEqual(expected);
});

test("parse markdown style link", () => {
  let text;
  let expected;

  text = "[display](file)";
  expected = {
    destination: "file",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[ display ]( file )";
  expected = {
    destination: "file",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "dis[play](file)";
  expected = {
    destination: undefined,
    isValidExternalLink: false,
    displayText: undefined,
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[[display](file)";
  expected = {
    destination: undefined,
    isValidExternalLink: false,
    displayText: undefined,
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display]](file)";
  expected = {
    destination: undefined,
    isValidExternalLink: false,
    displayText: undefined,
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display]((file)";
  expected = {
    destination: undefined,
    isValidExternalLink: false,
    displayText: undefined,
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](file))";
  expected = {
    destination: undefined,
    isValidExternalLink: false,
    displayText: undefined,
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](file) [display](file)";
  expected = {
    destination: undefined,
    isValidExternalLink: false,
    displayText: undefined,
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](file.md)";
  expected = {
    destination: "file.md",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](folder/file.md)";
  expected = {
    destination: "folder/file.md",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](file#header)";
  expected = {
    destination: "file",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](file.md#header)";
  expected = {
    destination: "file.md",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](folder/file.md#header)";
  expected = {
    destination: "folder/file.md",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](some%20note)";
  expected = {
    destination: "some note",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](some%20note#header)";
  expected = {
    destination: "some note",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](https://example.com)";
  expected = {
    destination: "https://example.com",
    isValidExternalLink: true,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](http://example.com)";
  expected = {
    destination: "http://example.com",
    isValidExternalLink: true,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](https://example.com#section)";
  expected = {
    destination: "https://example.com#section",
    isValidExternalLink: true,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](https://example.com?query=1)";
  expected = {
    destination: "https://example.com?query=1",
    isValidExternalLink: true,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](https://example.com/my%20file.txt)";
  expected = {
    destination: "https://example.com/my%20file.txt",
    isValidExternalLink: true,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](https://example.com/my%20file.txt#section)";
  expected = {
    destination: "https://example.com/my%20file.txt#section",
    isValidExternalLink: true,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](https/example.com)";
  expected = {
    destination: "https/example.com",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[display](https//example.com)";
  expected = {
    destination: "https//example.com",
    isValidExternalLink: false,
    displayText: "display",
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);

  text = "[[file]]";
  expected = {
    destination: undefined,
    isValidExternalLink: false,
    displayText: undefined,
  };
  expect(parseMarkdownLink(text)).toStrictEqual(expected);
});
