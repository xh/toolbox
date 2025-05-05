# Markdown Demo

You can edit this sample text using the `codeInput` below to see the rendered output
update as you go.

------

## GitHub Flavored Markdown

The Hoist wrapper automatically includes support for GitHub Flavored Markdown (GFM)
via the `react-gfm` plugin.

### Table Support

| GFM Extension | Supported |
|:--------------|:---------:|
| Tables        |     ✅     |
| Tasks         |     ✅     |
| Magic         |     ❌     |

### Task Lists

- [x] Add initial markdown content
- [x] Test GFM support for things like task lists
- [ ] Continue winning

## Customizations in this Example

The rendered markdown below includes a few customizations:
* The `lineBreaks` option is set to `false` to allow this markdown source to wrap
  more aggressively, without introducing line breaks in the rendered output.
* The `markdown` component has been nested within a `div` to provide a bit of padding
  and set `overflow-y: scroll`. The component itself does not do this automatically.

## Importing markdown content from source files

This initial markdown content was imported from a file checked in alongside the code.
This might be useful for lengthy markdown content that should land in source control,
e.g. inline documentation.

See the source within [`MarkdownPanel.tsx`](https://github.com/xh/toolbox/blob/develop/client-app/src/desktop/tabs/other/MarkdownPanel.tsx)
to review how it is imported and loaded _(hint, `fetch` is involved)_.

