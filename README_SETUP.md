# Family Expense Tracker PWA

This is a mobile-first Progressive Web App for family income and expense tracking.

## Features included

- Installable PWA for Android home screen
- Works offline after first load
- Local data storage in the browser
- Google Sheets backup/sync through Apps Script
- Income sources: Father Pension, Sohail Income, Other
- Expense records with amount, date, person, category, necessary/unnecessary, and description
- Sticky monthly summary: total money, spent, remaining
- Filters: today, yesterday, this week, this month, custom date, person, category, necessary/unnecessary
- Calendar month view with daily totals and person tags
- Add/remove people and categories
- JSON export/import backup
- CSV export for Excel/Google Sheets
- Reset safety with automatic backup export

## Files

- `index.html` — app markup
- `styles.css` — premium mobile UI
- `app.js` — app logic, local storage, filters, calendar, export/import, sync
- `manifest.webmanifest` — PWA install settings
- `sw.js` — offline cache service worker
- `icons/` — PWA icons
- `google-apps-script.gs` — Google Sheets backend code

## How to host on GitHub Pages

1. Create a new GitHub repository, for example: `family-expense-tracker`.
2. Upload all files and folders from this package to the repository root.
3. Go to repository `Settings > Pages`.
4. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Save.
6. Open the GitHub Pages URL on Android Chrome.
7. Tap Chrome menu `⋮` and choose `Add to Home screen` or `Install app`.

## How to set up Google Sheets sync

1. Create a new Google Sheet.
2. In the sheet, go to `Extensions > Apps Script`.
3. Delete any starter code.
4. Paste the full contents of `google-apps-script.gs`.
5. Click Save.
6. Click `Deploy > New deployment`.
7. Select type: `Web app`.
8. Set:
   - Execute as: `Me`
   - Who has access: `Anyone with the link`
9. Click Deploy and allow permissions.
10. Copy the Web App URL.
11. Open the PWA > Backup tab > paste URL > Save URL.
12. Click `Sync Now`.

The script will create these tabs in your Google Sheet:

- `AppState`
- `People`
- `Categories`
- `Expenses`
- `Income`

## Important notes

- The app saves locally first. This means your father can use it even if internet is off.
- If the browser data is cleared, local data can be lost. Google Sheet sync and JSON export protect against that.
- Use `Export JSON` occasionally as an extra manual backup.
- `Import Sheet` replaces local data with the latest Google Sheet data, and automatically downloads a backup first.
- `Reset Local Data` only clears the current browser/device data, not the Google Sheet.

## Suggested usage

At the start of each month:

1. Add Father Pension income.
2. Add Sohail Income if applicable.
3. Add each expense daily.
4. Use the Dashboard to see total, spent, and remaining.
5. Use Calendar to review spending by date.
6. Use filters to check necessary vs unnecessary expenses.

## Customization

You can change the default people and categories inside `app.js`:

- `defaultPeople`
- `defaultCategories`

You can also edit colors and UI spacing inside `styles.css`.
