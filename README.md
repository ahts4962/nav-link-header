# Nav Link Header

The Nav Link Header is a plugin for [Obsidian](https://obsidian.md/) that displays navigation
links at the top of the notes. These links include
backlinks annotated by a specific string, or previous, next, and up links of the daily notes.
This plugin makes it easier to move between notes.

![ss](https://github.com/user-attachments/assets/c013ac61-d406-4457-ba9c-7a99ee3d669f)

# Features

## Annotated links

If one of the annotation strings is placed immediately before a link, the link is recognized as an annotated link.
Notes with annotated links appear as backlinks at the top of the destination note.
Any string, including emoji, is acceptable as an annotation string as long as the following link is recognized as a backlink.
This is useful for creating links to MOC (map of contents).

## Links to adjacent daily notes

Links to the chronologically previous and next daily notes are displayed.
Weekly, monthly, quarterly, or yearly notes are also supported.
This plugin utilizes the [obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface/tree/main) package,
so settings for daily notes or [periodic notes](https://github.com/liamcain/obsidian-periodic-notes) plugins are used internally.

## Other features

- Display links in page previews.
- Wikilinks and markdown format links are supported.
- Create a new periodic note by clicking the link if it doesn't exist.
- The note to be displayed in the navigation can also be specified using properties.

# Usage

After installing the plugin, enable the options you need in the plugin settings page.
You can customize whether to show annotated links and periodic note links in markdown views and page previews individually.
Specify the annotation strings if you use the annotated links.

## Examples of annotated links

In the case of the screenshot above, "⚓,📅" is set in the "Annotation strings" field on the settings page.
And one of the annotation strings is placed before the links in the "MOC1" note (e.g. `⚓[[Note 1]]`).
The links to "MOC1" will then appear at the top of the target note (e.g. ⚓MOC1 in "Note 1").
This feature allows you to create links that navigate to the MOC by simply adding an annotation string to the MOC.
