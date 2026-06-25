# Mobile tab screenshots

The Mobile example (`MobileTab.ts`) is a feature tour: a list of selectable feature cards on the
left and a single phone bezel on the right that shows the screen capture for the active card. Each
capture is wrapped at render time in a sleek CSS device frame (`phoneFrame()` + `.tb-mobile__device`
in `MobileTab.scss`). The frame - thin dark bezel, large continuous-corner radius, dynamic-island
pill, subtle side buttons, soft drop shadow - is drawn in CSS, so the source images must be
**clean, frameless screenshots of just the app screen** (no device chrome, no status bar baked in).

The tour is driven by the `FEATURES` array in `MobileTab.ts`; each entry pairs advertising copy
(label, tagline, body) with a light/dark capture pair. Adding a screen is a single array entry.
As shipped: the home dashboard, a form with an options bottom-sheet, and the in-app doc viewer.

The frame coloration and the screenshot content both **track the desktop app's light/dark theme**
(`MobileTab.ts` reads `XH.darkTheme` to pick the image and flag the `--light` frame variant). So each
screen needs **two** captures - one taken with the mobile app in dark theme, one in light.

## The six images (three screens x two themes)

| File | Screen | Theme |
|------|--------|-------|
| `MobileImageHome.png` | Home dashboard | dark |
| `MobileImageHomeLight.png` | Home dashboard | light |
| `MobileImageOptions.png` | Form with options bottom-sheet | dark |
| `MobileImageOptionsLight.png` | Form with options bottom-sheet | light |
| `MobileImageDocs.png` | In-app doc viewer | dark |
| `MobileImageDocsLight.png` | In-app doc viewer | light |

Capture each screen once per theme (toggle the mobile app theme between captures) and keep the
light/dark pair visually identical apart from the theme.

- **Aspect ratio:** the frame's screen slot is tuned to the **~9 : 17 / 804 x 1508** aspect of the
  shipped iOS captures, and the shot fills it via `object-fit: cover` (anchored top) so the full
  width always shows with no crop. If you recapture at a meaningfully different aspect, retune the
  device `aspect-ratio` in `MobileTab.scss` (see the comment there) so the slot still matches.
- **Resolution:** capture at 2x (so ~786 px wide) for a crisp result; the frames render small.
- Swap the files in place, keeping the same names - `MobileTab.ts` imports them by name and no code
  change is needed.

## Capturing fresh screenshots

Any method that yields a clean, frameless PNG of the app screen works. Two easy options:

### Option A - Chrome DevTools device toolbar (recommended, no extra tooling)

1. Open `http://localhost:3000/mobile` (or `https://toolbox.xh.io/mobile`) in Chrome.
2. Open DevTools, click the **device toolbar** toggle (Cmd-Shift-M), and pick a device such as
   **iPhone 14 Pro** (393 x 852) or set a custom 393 x 852 viewport at DPR 2.
3. Navigate to the screen you want.
4. In the device toolbar's "..." menu choose **Capture screenshot** - this saves a frameless PNG of
   just the viewport at full resolution.
5. Rename to the matching file above and drop it in this directory.

### Option B - a real device

Take a normal screenshot on a modern phone, then crop away the OS status bar / home indicator so
the image is just the app screen content. Save at the names above.

## Adjusting the frame itself

The device frame is pure CSS in `MobileTab.scss` (`.tb-mobile__device`, `__screen`, `__island`).
Tune the bezel thickness (`padding`), corner radius, island size/position, or shadow there; no
image editing required.
