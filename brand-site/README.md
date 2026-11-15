# Miles After Five website (local prototype)

A two-page site built with plain HTML, CSS and vanilla JavaScript. No installs, no build step, no internet needed.

## Open it

Double-click `index.html` (or drag it into a browser window). Use the "Calculate Your Pace" button or the nav to reach `pace-calculator.html`.

## Files

```
miles-after-five/
  index.html             Home page
  pace-calculator.html   Pace calculator
  styles.css             Shared styles (brand colors are CSS variables at the top)
  script.js              Calculator logic and form handling
  assets/
    images/              hero-runner-laces.jpg, runner-line-art.png
    fonts/               (empty, see "Fonts" below)
    logos/               (empty, see "Open items" below)
```

## How to test it

1. **Navigation:** Home and Pace Calculator links work in the header and footer; the hero and CTA buttons go to the calculator.
2. **Calculator:** enter `3` miles, `30` minutes, `0` seconds, click "Calculate My Pace". Expect `10:00`.
3. **Decimals:** `3.1` miles, `27` minutes, `45` seconds gives `08:57`.
4. **Validation:** try empty fields, `0` or negative distance, seconds above 59, decimal minutes. Each should show a clear message and no result.
5. **Reset:** click "Reset". Inputs, result and errors all clear.
6. **Responsive:** resize the browser (or use device tools) from phone width up to desktop.
7. **Keyboard:** Tab through the page. Enter submits the form.

## Where the assets came from

All images come from the team repository `SHU-MK680-F26/mk680-launch-images`:

- `hero-runner-laces.jpg`: the photo area of `yuga-launch-3.png`, cropped to remove the "Weekly group run" text banner.
- `runner-line-art.png`: the line-art runner from `yuga-launch-1.png`, with the headline fragment blanked out.

## Fonts

The brand font is Montserrat, but no font files exist in the team repository, so the site uses Montserrat only if it is already installed on the visitor's device and otherwise falls back to a system sans-serif. When the font files are available, put them in `assets/fonts/` and uncomment the `@font-face` block at the top of `styles.css`.

## Open items

- **`brand/voice.md` was not found.** Neither accessible repository contains it (the second repo, `sandbox-yuga`, is empty). Copy was written from the PRD and the Instagram posts ("Clock out. Lace up." and the core brand message). Please review against the real voice guide when you have it.
- **Instagram link:** footer links to `https://www.instagram.com/milesafter5_/` on both pages.
- **Logo:** none found, so the nav uses a text wordmark.
- **Home page copy** deliberately avoids event times, locations, testimonials and member numbers, per the PRD.
