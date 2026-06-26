# Family Expense Tracker V4.4 – Polish & Performance

This update focuses on premium mobile UI/UX, performance polish, safer cache updates, responsive calendar styling, cleaner settings actions, and app icon reliability.

## What changed

- Premium mobile-first UI polish
- Better card spacing, shadows, typography, touch targets, and button states
- Cleaner bottom navigation for small screens
- Calendar remains responsive with horizontal scroll when required
- Improved settings action layout with helper text outside buttons
- Updated PWA cache version so mobiles receive the update
- Fixed/kept app icons for install screen and manifest
- Database schema version marked as V4.4 for future migrations
- Better safe-area spacing for Android/iPhone style browsers

## Update steps

1. Export JSON backup from the current app first.
2. Upload/replace these files in GitHub:

- index.html
- styles.css
- app.js
- sw.js
- manifest.webmanifest
- icons folder
- README_SETUP.md
- google-apps-script.gs

3. Commit changes.
4. Apps Script usually does not need a logic change for this polish update, but paste the included `google-apps-script.gs` and deploy a new version if you want everything aligned.
5. Open the GitHub Pages app on laptop and refresh 2–3 times.
6. Open the mobile PWA while online, refresh/open once, wait 15–20 seconds, then close and reopen.
7. Test offline after the first online load.

## Mobile update tip

If the installed app still shows the old design, remove the home-screen app and install it again from Chrome after opening the GitHub Pages link.
