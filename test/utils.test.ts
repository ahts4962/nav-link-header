import {
	deepEqual,
	fileIncludedInFolder,
	parseWikiLink,
	removeCode,
} from "src/utils";

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
	expect(deepEqual({ a: 1, b: undefined }, { a: 1, b: undefined })).toBe(
		true
	);
	expect(deepEqual({ a: 1, b: undefined }, { a: 1, b: 2 })).toBe(false);
	expect(deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })).toBe(true);
	expect(deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 4] })).toBe(false);
	expect(deepEqual([1, { x: 2 }], [1, { x: 2 }])).toBe(true);
	expect(deepEqual([1, { x: 2 }], [1, { x: 3 }])).toBe(false);
	expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
	expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
	expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true);
	expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false);
	expect(
		deepEqual([1, { a: { b: [1, 2] } }], [1, { a: { b: [1, 2] } }])
	).toBe(true);
	expect(
		deepEqual([1, { a: { b: [1, 2] } }], [1, { a: { b: [1, 3] } }])
	).toBe(false);
});

test("check if the file is included in the folder", () => {
	expect(fileIncludedInFolder("file", "/")).toBe(true);
	expect(fileIncludedInFolder("file", "/", false)).toBe(true);
	expect(fileIncludedInFolder("folder/file", "/")).toBe(true);
	expect(fileIncludedInFolder("folder/file", "/", false)).toBe(false);
	expect(fileIncludedInFolder("fol/der/file", "/")).toBe(true);
	expect(fileIncludedInFolder("fol/der/file", "/", false)).toBe(false);
	expect(fileIncludedInFolder("file", "folder")).toBe(false);
	expect(fileIncludedInFolder("file", "folder", false)).toBe(false);
	expect(fileIncludedInFolder("folder/file", "folder")).toBe(true);
	expect(fileIncludedInFolder("folder/file", "folder", false)).toBe(true);
	expect(fileIncludedInFolder("fol/der/file", "folder")).toBe(false);
	expect(fileIncludedInFolder("fol/der/file", "folder", false)).toBe(false);
	expect(fileIncludedInFolder("folder/file", "fol")).toBe(false);
	expect(fileIncludedInFolder("folder/file", "fol", false)).toBe(false);
	expect(fileIncludedInFolder("fol/der/file", "fol")).toBe(true);
	expect(fileIncludedInFolder("fol/der/file", "fol", false)).toBe(false);
	expect(fileIncludedInFolder("fol/der/file", "fol/der")).toBe(true);
	expect(fileIncludedInFolder("fol/der/file", "fol/der", false)).toBe(true);
});

test("remove YAML front matter", () => {
	let content;
	let expected;

	content =
		'---\nnum: 1\nstring: "string"\nlist:\n  - 1\n  - 2\n---\ncontent';
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

	content =
		"\n---\na: a\n---\n" +
		"text`text\n" +
		"```\ncode\n```\n" +
		"text`text\n";
	expected = "\n---\na: a\n---\ntext`text\n\ntext`text\n";
	expect(removeCode(content)).toBe(expected);
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
});
