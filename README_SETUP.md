# Family Expense Tracker v2 Premium

This is a mobile-first PWA for family expense tracking.

## What is new in v2

- Premium organized layout with bottom navigation: Home, Add, Reports, Calendar, Settings
- Father Mode and Admin Mode
- Person-wise expense UI and filters
- Category-wise, daily trend, income source and account balance graphs
- Monthly budget planning and saving target
- Necessary/unnecessary expense tracking with limits
- Cash/bank/wallet account balances
- Recurring expenses
- Pending payments / udhaar tracking
- Duplicate expense warning
- Delete undo safety
- Optional PIN lock
- Monthly report export
- Google Sheets backup with new tabs
- Fully English UI

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
7. If the old version shows on mobile, open Chrome > App info/Site settings > clear cache for the app, or uninstall and add it again from Chrome.

## Update Google Sheets sync

Because v2 adds Accounts, Pending Payments and Recurring Expenses, you should update Apps Script as well.

1. Open your existing Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Replace the old code with the full code from `google-apps-script.gs`.
4. Click Save.
5. Go to **Deploy > Manage deployments**.
6. Edit the existing web app deployment or create a new deployment.
7. Version: New version.
8. Execute as: Me.
9. Who has access: Anyone with the link.
10. Deploy and copy the Web App URL.
11. In the app, go to **Settings > Backup & sync**.
12. Paste the URL and click **Save URL**.
13. Click **Sync now**.

After sync, Google Sheet should have these tabs:

- AppState
- People
- Categories
- Accounts
- Expenses
- Income
- PendingPayments
- RecurringExpenses

## Safe use with two mobiles

Best flow when using both father mobile and your mobile:

1. Before adding data on a device, click **Import Sheet**.
2. Add income/expense.
3. Click **Sync now**.

This prevents one phone from overwriting newer data from the other phone.

## Install on Android

1. Open the GitHub Pages live link in Chrome.
2. Tap the three-dot menu.
3. Tap **Add to Home screen** or **Install app**.
4. Open it from the home screen like a normal app.

## Data safety

The app saves data locally first. Google Sheets is used for backup/sync. Use **Export JSON** sometimes for extra safety.
