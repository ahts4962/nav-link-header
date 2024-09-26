# Nav Link Header

The Nav Link Header plugin displays navigation links at the top of the notes. These links include
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

- Display links to page previews.
- Wikilinks and markdown format links are supported.
- Create a new periodic note by clicking the link if it doesn't exist.

# Usage

After installing the plugin, enable the options you need in the plugin settings page.
You can customize whether to show annotated links and periodic note links in markdown views and page previews individually.
Specify the annotation strings if you use the annotated links.

# Requirements

This plugin uses lookbehind in regular expressions, so iOS before 16.4 is not supported.
