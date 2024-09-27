import { removeCode } from "src/utils";

test("remove YAML front matter", () => {
	let content;
	let expected;

	content =
		'---\nnum: 1\nstring: "string"\nlist:\n  - 1\n  - 2\n---\ncontent';
	expected = "content";
	expect(removeCode(content)).toEqual(expected);

	content = " ---\nfront matter\n---\n";
	expected = " ---\nfront matter\n---\n";
	expect(removeCode(content)).toEqual(expected);

	content = "--- \nfront matter\n---\n";
	expected = "--- \nfront matter\n---\n";
	expect(removeCode(content)).toEqual(expected);

	content = "---\n---\n";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "------\n";
	expected = "------\n";
	expect(removeCode(content)).toEqual(expected);

	content = "---\nfront matter\n ---\n";
	expected = "---\nfront matter\n ---\n";
	expect(removeCode(content)).toEqual(expected);

	content = "---\nfront matter\n--- \n";
	expected = "---\nfront matter\n--- \n";
	expect(removeCode(content)).toEqual(expected);

	content = "---\nfront matter\n---";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "---\n\n---\n";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "---\nfront matter\n---\n---\nfront matter\n---\n";
	expected = "---\nfront matter\n---\n";
	expect(removeCode(content)).toEqual(expected);
});

test("remove code blocks", () => {
	let content;
	let expected;

	// First step
	content = "```ts\ncode\n```\n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "text\n```\ncode\n```\n";
	expected = "text\n\n";
	expect(removeCode(content)).toEqual(expected);

	content = " ```\ncode\n```\n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "````\ncode\n````\n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "```ts\ncode\ntext```\n";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "```\n```\n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "```\ncode\n````\n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "```\ncode\n ```\n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "```\ncode\n``` \n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "```\ncode\n```text\n";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "```\ncode\n`` `\n";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "`` `\ncode\n```\n";
	expected = "`\ncode\n";
	expect(removeCode(content)).toEqual(expected);

	content = "```\n`code`\n```\n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "````\n```code```\n````\n";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "```\ncode\n```\ntext\n`````\ncode\n`````\n";
	expected = "\ntext\n\n";
	expect(removeCode(content)).toEqual(expected);

	// Second step
	content = "```\ncode";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = " ```\ncode";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "````\ncode";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "````\ncode\n```";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "```ts\ncode";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "```ts";
	expected = "";
	expect(removeCode(content)).toEqual(expected);

	content = "\n```ts";
	expected = "\n";
	expect(removeCode(content)).toEqual(expected);

	content = "```ts`";
	expected = "``";
	expect(removeCode(content)).toEqual(expected);

	content = "````\ncode\n```\ncode\n```";
	expected = "";
	expect(removeCode(content)).toEqual(expected);
});

test("remove inline codes", () => {
	let content;
	let expected;

	content = "text`code`text";
	expected = "texttext";
	expect(removeCode(content)).toEqual(expected);

	content = "text``code``text";
	expected = "texttext";
	expect(removeCode(content)).toEqual(expected);

	content = "text`code``text";
	expected = "text`code``text";
	expect(removeCode(content)).toEqual(expected);

	content = "text``code`text";
	expected = "text`text";
	expect(removeCode(content)).toEqual(expected);

	content = "text`code\ncode`text";
	expected = "texttext";
	expect(removeCode(content)).toEqual(expected);

	content = "text`code\n\ncode`text";
	expected = "text`code\n\ncode`text";
	expect(removeCode(content)).toEqual(expected);

	content = "text```code```text";
	expected = "texttext";
	expect(removeCode(content)).toEqual(expected);

	content = "text`code`";
	expected = "text";
	expect(removeCode(content)).toEqual(expected);

	content = "text`code` text`code`text";
	expected = "text texttext";
	expect(removeCode(content)).toEqual(expected);

	content = "text`code```text```code`text";
	expected = "texttext";
	expect(removeCode(content)).toEqual(expected);
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
	expect(removeCode(content)).toEqual(expected);

	content =
		"\n---\na: a\n---\n" +
		"text`text\n" +
		"```\ncode\n```\n" +
		"text`text\n";
	expected = "\n---\na: a\n---\ntext`text\n\ntext`text\n";
	expect(removeCode(content)).toEqual(expected);
});
