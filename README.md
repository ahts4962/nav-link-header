# Nav Link Header

**Nav Link Header** is a plugin for [Obsidian](https://obsidian.md/) that displays navigation
headers at the top of your notes. The content shown in these headers is flexible and highly customizable.
For example, you can display backlinks annotated with a specific string, previous and next daily notes,
or previous and next notes within the same folder.
This plugin makes navigating between notes faster and more convenient.

<img width="970" height="910" alt="Nav Link Header" src="https://github.com/user-attachments/assets/ed40ace3-4fbf-49c3-9581-6f0e3a2dc9e4" />

# Features

## Annotated links

If an annotation string is placed immediately before a link, that link is recognized as an annotated link.
Annotated links found in backlink notes or in the current note are displayed in the navigation header.
Any string — including emoji — can be used as an annotation string, as long as the following text is recognized as a link
(either a wikilink or a Markdown link).
To enable this feature, specify the annotation strings in the **Annotation strings for backlinks** or
**Annotation strings for current note** settings.

<img width="763" height="804" alt="Annotated link" src="https://github.com/user-attachments/assets/659f301e-bc13-40ae-9ddc-006e237c6e47" />

This is useful for creating links to an MOC (Map of Contents). In the screenshot above, "📌,🔗" is configured
in the **Annotation strings for backlinks** field on the settings page. One of these annotation strings is placed
immediately before links in the "MOC1" note (for example, 📌[[Note 1]]). As a result, a link to "MOC1" appears
at the top of the destination (for example, 📌MOC1 in "Note 1"). This feature allows you to create navigation links
back to an MOC simply by adding an annotation string to the MOC.

Advanced versions of these settings are also available. They allow you to specify a display prefix (such as an emoji)
for each annotation string. These advanced settings also support regular expressions.

<img width="795" height="757" alt="Annotated link advanced" src="https://github.com/user-attachments/assets/00df4f74-8941-4e81-ae40-966f62d9d80d" />

## Property links

By setting a link, file path, or website URL in a note’s file properties, the link can be displayed
in the navigation header. Markdown links (for example, `[obsidian](https://obsidian.md)`) are also supported.
To use this feature, configure the **Property mappings** field on the settings page.

<img width="943" height="1074" alt="Property link" src="https://github.com/user-attachments/assets/3e62877b-aca3-4201-9809-54aecc08486f" />

## Links to adjacent daily notes

Links to the chronologically previous and next daily notes are displayed.
Weekly, monthly, quarterly, and yearly notes are also supported. This plugin uses the
[obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface/tree/main) package internally,
so it respects the settings from the **Daily notes** plugin or the
[periodic notes](https://github.com/liamcain/obsidian-periodic-notes) plugin.

<img width="639" height="286" alt="Daily note link" src="https://github.com/user-attachments/assets/e71b524b-4cf0-4033-ab7b-f056aa59eadd" />

## Folder links

By specifying a folder path, links to the previous and next files within that folder can be displayed.
Files can also be flexibly filtered and sorted.

<img width="674" height="541" alt="Folder link" src="https://github.com/user-attachments/assets/6bd67b95-f521-42c1-bd4b-e0abcfb79882" />

You can configure how many files are displayed. It’s also possible to display all files in the same folder, as shown below.

<img width="679" height="504" alt="Folder link multiple" src="https://github.com/user-attachments/assets/6d598182-9d98-4b98-82de-f5a4230df736" />

## Pinned note content

By placing an annotation string in a note’s content, the content that follows the annotation string can be displayed in the navigation header. This works not only for links, but also for plain text.

<img width="725" height="489" alt="Pinned note content" src="https://github.com/user-attachments/assets/5d5e2846-da93-49bb-a8b2-e7b61fa7608a" />

## Link collapsing

By clicking a prefix (such as an emoji) in the navigation header, links that share the same prefix are collapsed
into a single entry.

<img width="530" height="248" alt="Link collapsing" src="https://github.com/user-attachments/assets/54b15c83-5699-439a-b190-ec26b5df2f98" />

## Wide range of supported display targets

Navigation headers can be displayed in panes and page previews. Both the container (pane or page preview)
and the view type are configurable. Multiple view types are supported, including Markdown, Canvas, Bases, and PDF views,
and each option can be enabled or disabled individually.

<img width="1119" height="522" alt="Panes" src="https://github.com/user-attachments/assets/fb0fd156-c196-41bf-a42d-9da781866fcb" />

<img width="721" height="540" alt="Page previews" src="https://github.com/user-attachments/assets/120d5f29-eb3b-4aa1-8a32-e6c6a59a6c0e" />

# Usage

After installing the plugin, configure the options you need in the plugin settings page.
