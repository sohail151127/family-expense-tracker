# Family Expense Tracker – V4.3 Smart Stability

## What changed in V4.3

- Activity Log added in Settings.
- Better Notes: pin, favorite, archive, priority, due date, filters, sorting.
- Monthly Archive: create a locked monthly summary for the selected month.
- Safer Sync: clearer import warning, sync history, last remote sync tracking, activity logs for sync/import/export.
- Calendar fixed for mobile width overflow.
- Calendar now starts with Monday and shows Monday–Sunday headers.
- Calendar supports horizontal scrolling on narrow screens.
- Calendar shows dots for income, expense, and notes.
- Settings action descriptions moved outside buttons for cleaner UI.

## Update GitHub Pages

Upload/replace these files in your GitHub repository root:

- index.html
- styles.css
- app.js
- sw.js
- manifest.webmanifest
- google-apps-script.gs
- README_SETUP.md
- icons folder

Commit changes.

## Update Google Apps Script

1. Open your Google Sheet.
2. Go to Extensions → Apps Script.
3. Replace the old script with the new `google-apps-script.gs`.
4. Deploy → Manage deployments → Edit.
5. Select Version: New version.
6. Click Deploy.

## After updating

1. Open the app on laptop first.
2. Export JSON backup.
3. Refresh 2–3 times so the new service worker/cache updates.
4. Confirm the app shows V4.3 features.
5. Click “Send local data to Google Sheet”.
6. Refresh Google Sheet and confirm new tabs: ActivityLog and MonthlyArchives.
7. On mobile, open the app with internet and refresh 2–3 times. Then use “Import data from Google Sheet”.

## Important usage rule

- Use **Send local data to Google Sheet** when the current device has the latest data.
- Use **Import data from Google Sheet** on another device to pull the latest data from Google Sheet.

