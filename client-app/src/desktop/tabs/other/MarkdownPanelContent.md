# Markdown Demo

You can edit this sample text using the `codeInput` below to see the rendered output
update as you go.

---

## GitHub Flavored Markdown

The Hoist wrapper automatically includes support for GitHub Flavored Markdown (GFM)
via the `react-gfm` plugin. This adds several useful extensions on top of standard
markdown, including tables, task lists, and ~~strikethrough~~ text.

### Tables

| GFM Extension | Supported |
| :------------ | :-------: |
| Tables        |    ✅     |
| Task Lists    |    ✅     |
| Strikethrough |    ✅     |
| Autolinks     |    ✅     |
| Ocelots       |    ❌     |

### Task Lists

- [x] Add initial markdown content
- [x] Test GFM support for things like task lists
- [ ] Continue winning

### Code Blocks

Use the Hoist `markdown` component to render content with fenced code blocks:

```typescript
import {markdown} from '@xh/hoist/cmp/markdown';

const myPanel = hoistCmp.factory(() =>
    panel({
        item: markdown({content: myMarkdownString, lineBreaks: false})
    })
);
```

Inline code like `@bindable` and `HoistModel` is also supported.

## Text Formatting

Markdown supports **bold**, _italic_, **_bold italic_**, and ~~strikethrough~~ text.
These can be freely mixed with `inline code` and [links](https://xh.io) in running prose.

## Lists

Ordered and unordered lists can be nested:

1. First item
2. Second item
    - A nested bullet
    - Another nested bullet
3. Third item
    1. A nested numbered item
    2. Another nested numbered item

## Blockquotes

> Blockquotes are useful for callouts, tips, or highlighting important information.
> They can contain **formatted text**, `code`, and [links](https://xh.io).
>
> They can also span multiple paragraphs.

## Customizations in this Example

This demo includes a few customizations worth noting:

- The `lineBreaks` option is set to `false` to allow this markdown source to wrap
  more aggressively, without introducing line breaks in the rendered output.
- The containing `panel` uses `scrollable: true` and `contentBoxProps: {padding: true}`
  to handle overflow and spacing around the rendered content.
- Toggle the **Custom styles** switch in the toolbar above to apply an optional set of
  CSS styles to the rendered output. The `markdown` component renders unstyled HTML by
  default — apps can add their own styles for headings, tables, code blocks, links,
  and more via a wrapping CSS class.

## Importing Markdown from Source Files

This initial markdown content was imported from a `.md` file checked in alongside the code.
This can be useful for lengthy markdown content that should land in source control,
e.g. inline documentation or help text.

See the source within [`MarkdownPanel.ts`](https://github.com/xh/toolbox/blob/develop/client-app/src/desktop/tabs/other/MarkdownPanel.ts)
to review how it is imported and loaded _(hint, `fetch` is involved)_. A
[`types.d.ts`](https://github.com/xh/toolbox/blob/develop/client-app/src/types.d.ts) module
declaration tells TypeScript that `*.md` imports resolve to a URL string, enabling the
import without a `// @ts-ignore`.
