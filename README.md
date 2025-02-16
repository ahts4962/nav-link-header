# Nav Link Header

The Nav Link Header is a plugin for [Obsidian](https://obsidian.md/) that displays navigation
links at the top of your notes. What is displayed as these links is flexible and customizable.
For example, you can display backlinks that are annotated with a specific string,
the previous/next daily notes, or the previous/next notes in the same folder.
This plugin makes it easier to move between notes.

![nav link header](https://github.com/user-attachments/assets/c02fc8f9-ba3a-45d7-a9a7-4aecfce8f63b)

# Features

## Annotated links

If one of the annotation strings is placed immediately before a link, the link is recognized as an annotated link.
Notes with annotated links appear as backlinks at the top of the destination note.
Any string, including emoji, is acceptable as an annotation string as long as the following link is recognized as a backlink.

![annotated link](https://github.com/user-attachments/assets/229583d5-053d-4642-a357-a6ad6be2f13a)

This is useful for creating links to MOC (map of contents). In the case of the screenshot above,
**"📌,🔗" is set in the "Annotation strings" field on the settings page**.
And one of the annotation strings is placed before the links in the "MOC1" note (e.g. `📌[[Note 1]]`).
The links to "MOC1" will then appear at the top of the target note (e.g. 📌MOC1 in "Note 1").
This feature allows you to create links that navigate to the MOC by simply adding an annotation string to the MOC.

## Links specified by file properties

By setting a link or path in the file properties, the link can be displayed in the navigation.
**Remember to set the "Property mappings" field or the "Property name for the
previous/next/parent note" field on the settings page to use this feature**.

![property link](https://github.com/user-attachments/assets/670580d0-1099-4308-aadc-6bc8450a9713)

## Links to adjacent daily notes

Links to the chronologically previous and next daily notes are displayed.
Weekly, monthly, quarterly, or yearly notes are also supported.
This plugin utilizes the [obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface/tree/main) package,
so settings for daily notes or [periodic notes](https://github.com/liamcain/obsidian-periodic-notes) plugins are used internally.

![periodic notes](https://github.com/user-attachments/assets/7744036f-98bb-4e39-8ea0-5ec797205674)

## Previous and next notes in a specified folder

By specifying the path to a folder, links to the previous and next notes in that folder can be displayed.
Notes can be flexibly filtered and sorted.

![folder notes](https://github.com/user-attachments/assets/8fd13e71-d354-4fb0-9313-70c933edb04d)

## Other features

- Links can also be displayed in page previews.
- The file property can be used to set the display text of the link.
- Wikilinks and markdown format links are supported for annotated links.
- You can create a new periodic note by clicking the link if it doesn't exist.

# Usage

After installing the plugin, enable the options you need in the plugin settings page.
