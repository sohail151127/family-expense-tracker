# Family Expense Tracker v3 Premium

Mobile-first PWA for family finance, reports, calendar tracking, private notes, and Google Sheets backup.

## What is new in v3

- New **Entries** tab for all income, expenses and pending payments in one place
- Search bar for the main app entries
- New locked **Notes** tab
- Notes are fully separate from income/expense calculations
- Notes have title, description and tag
- Notes can be searched, edited and deleted
- Separate Notes access code/PIN
- Existing v2 features remain: Home, Add, Reports, Calendar, Settings, graphs, budgets, accounts, recurring expenses, pending payments, import/export and Google Sheet sync

## Update on GitHub Pages

1. Extract this ZIP.
2. Open your GitHub repository: `family-expense-tracker`.
3. Click **Add file > Upload files**.
4. Upload/replace these files and folders from this package:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.webmanifest`
   - `sw.js`
   - `icons` folder
   - `README_SETUP.md`
   - `google-apps-script.gs` can be uploaded too, but it is mainly for Apps Script.
5. Click **Commit changes**.
6. Open your live link after 1–2 minutes.
7. If old version shows on mobile, refresh Chrome, close/reopen the PWA, or clear site cache for the app.

## Update Google Sheets sync

Because v3 adds Notes, update Apps Script too.

1. Open your existing Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Replace the old code with the full code from `google-apps-script.gs`.
4. Click Save.
5. Go to **Deploy > Manage deployments**.
6. Edit the existing web app deployment.
7. Version: **New version**.
8. Click **Deploy**.
9. Keep the same Web App URL in the app, unless Google gives you a new one.
10. In the app, go to **Settings > Backup & sync** and click **Sync now**.

After sync, Google Sheet should have these tabs:

- AppState
- People
- Categories
- Accounts
- Expenses
- Income
- PendingPayments
- RecurringExpenses
- Notes

## Safe use with two mobiles

Best flow when using both father mobile and your mobile:

1. Before adding data on a device, click **Import Sheet**.
2. Add income/expense/notes.
3. Click **Sync now**.

This prevents one phone from overwriting newer data from the other phone.

## Notes lock

Open the Notes tab for the first time and create a Notes code. After that, Notes will require that code in the current browser session. Notes are included in backup/sync but are not included in income, expense, budget, graph or balance calculations.

## Install on Android

1. Open the GitHub Pages live link in Chrome.
2. Tap the three-dot menu.
3. Tap **Add to Home screen** or **Install app**.
4. Open it from the home screen like a normal app.

## Data safety

The app saves data locally first. Google Sheets is used for backup/sync. Use **Export JSON** sometimes for extra safety.
