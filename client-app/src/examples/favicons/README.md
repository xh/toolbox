# Favicon Generator

A client-only Toolbox example app that builds a Hoist app's favicon set from any Font Awesome Pro
glyph. Pick a glyph and weight, set the colors, backdrop shape and padding, then download a zip
ready to drop into `client-app/public`.

## Using it

Open `/favicons`, or open Example Apps > Favicon Generator in the desktop app.

1. Design the icon. Start from a preset or "Surprise me" if you like.
2. Click **Download .zip** and unzip it into your app's `client-app/public`.
3. Merge the snippet from "Add it to your Hoist app" into `configureRsbuild()` in
   `rsbuild.config.mjs`. It sets the favicon, the preloader colors and the manifest theme color.

**Copy link** gives a URL that reopens the exact design. The downloaded `favicon.svg` also embeds
that link in a comment, so you can come back to a design from the file alone.

## The zip

| File | Size | Notes |
|------|------|-------|
| `favicon.svg` | any | The main icon, in the chosen shape. |
| `favicon-192.png` | 192px | For the web app manifest. |
| `favicon-512.png` | 512px | For the web app manifest. |
| `apple-touch-icon.png` | 180px | Always a full-bleed square in the backdrop color, as iOS masks its own corners. |

The browser builds every file, with no server call. `SvgBuilder` writes each SVG as a string.
`Rasterizer` draws it to a canvas at the target size to make the PNGs, and `FaviconExport` zips
the set with [fflate](https://github.com/101arrowz/fflate). It stores the PNGs uncompressed,
because they are already deflated.

## Layout

| Path | Contents |
|------|----------|
| `AppModel.ts` | Installs `GlyphService`, then creates `FaviconModel`. |
| `FaviconModel.ts` | The design as observable state, plus everything derived from it. |
| `cmp/` | The controls column and the preview tiles. |
| `svc/` | `GlyphService` and the loader for the full Font Awesome packs. |
| `lib/` | Pure functions for specs, layout, SVG, export, URL and presets. |

The split between `svc/` and `lib/` follows one rule: app-wide state and startup work go in a
service, and stateless transforms go in `lib/`. The `lib/` modules need no running app, so their
specs test them directly.

## Patterns worth a look

**A service for the glyph catalog.** `GlyphService` loads all four Pro packs in `initAsync`, under
the app load mask. It registers every glyph with Hoist's `Icon` catalog, so `IconPicker` can offer
about 3,800 of them. It registers glyphs by FA name only, without icon definitions. A registration with
definitions calls `library.add` once per glyph, which is far too slow at this scale.

**Packs kept out of the initial chunk.** Each pack import carries a `?full` query, so the bundler
emits the packs to an async chunk. Without it, the full packs merge with the per-glyph imports
that Hoist and Toolbox make, and land in every entry's initial chunk. See `faPacks.d.ts`.

**One spec drives everything.** `FaviconModel.spec` is a computed `FaviconSpec`. The SVG, every
preview, the config snippet, the share URL and the zip all derive from it. `normalizeSpec()` is the
one place that validates a design, whether it comes from the URL, a preset or "Surprise me".

**The URL as saved state.** A debounced reaction writes the spec to the query string with
`replaceState`, so the URL always reopens the current design without filling the browser history.
Invalid values in a link fall back to defaults.

**Path-aware fitting.** `PathGeometry` parses each glyph's SVG path, and `GlyphLayout` fits the
actual outline inside a circle or rounded square, not just its bounding box. Round glyphs fill a
circle instead of shrinking to fit their corners.

**A live tab icon.** In a full tab, `LiveTabIcon` swaps the page's own favicon for the current
design, and restores the original when the model is destroyed. Inside a frame, the tab icon belongs
to the parent page. The browser tabs preview then offers to open the design in a full tab.

**Panels as preview tiles.** The preview tiles are ordinary Hoist panels. `Favicons.scss` restyles
them by overriding the `--xh-panel-*` CSS variables on the grid, and container queries set one,
two or three columns.

## Dependencies

- The Font Awesome Pro packs for the solid, regular, light and thin weights. These need XH's Font
  Awesome Pro npm access, as Toolbox already has.
- `fflate`, to build the zip.
