# Mobile tab screenshots

The Mobile example (`MobileTab.ts`) shows two screen captures of the Toolbox mobile app, each
wrapped at render time in a sleek CSS device frame (`phoneFrame()` + `.tb-mobile__device` in
`MobileTab.scss`). The frame - thin dark bezel, large continuous-corner radius, dynamic-island
pill, subtle side buttons, soft drop shadow - is drawn in CSS, so the source images must be
**clean, frameless screenshots of just the app screen** (no device chrome, no status bar baked in).

Two screens are shown to convey a bit of component diversity; pick two that contrast well (e.g. a
list/landing view and a data-entry form, as shipped).

The frame coloration and the screenshot content both **track the desktop app's light/dark theme**
(`MobileTab.ts` reads `XH.darkTheme` to pick the image and flag the `--light` frame variant). So each
screen needs **two** captures - one taken with the mobile app in dark theme, one in light.

## The four images (two screens x two themes)

| File | Screen | Theme |
|------|--------|-------|
| `MobileImageHome.png` | Home / landing list | dark |
| `MobileImageHomeLight.png` | Home / landing list | light |
| `MobileImageForm.png` | Form (inputs, selects, switches) | dark |
| `MobileImageFormLight.png` | Form (inputs, selects, switches) | light |

Capture each screen once per theme (toggle the mobile app theme between captures) and keep the
light/dark pair visually identical apart from the theme.

- **Aspect ratio:** capture at a modern phone ratio of **9 : 19.5** (e.g. 393 x 852 logical, or
  786 x 1704 at 2x). The frame applies `object-fit: cover` anchored to the top, so a slightly
  different tall ratio still crops cleanly - but matching 9:19.5 avoids any cropping.
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
