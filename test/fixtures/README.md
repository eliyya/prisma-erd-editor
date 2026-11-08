# ERD Editor fixtures

`erd-editor.schema.json` is the official JSON Schema retrieved from
<https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json>.
It is checked in so tests validate the storage contract without network access.

`compact.erd.json` represents a document saved in the current compact format.
Columns have no `ui`, empty text is omitted, and editor-owned data includes a
table group, logical names, dictionary entries, and viewport settings. This
reproduces the missing `ui.widthName` failure during regeneration.
