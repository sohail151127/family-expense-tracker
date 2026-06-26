# Family Expense Tracker — V4.1.2 Large Data Sync Fix

This patch fixes Google Sheets sync failing with: `Your input contains more than the maximum of 50000 characters in a single cell.`

The Apps Script now stores the full AppState JSON in safe 45,000-character chunks and still writes readable tables like Expenses, Income, Notes, People, Categories, Accounts, PendingPayments, and RecurringExpenses.

## Update steps

1. Keep your current exported JSON backup safe.
2. Upload/replace these files in GitHub Pages: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icons` folder, and `README_SETUP.md`.
3. In Google Sheet > Extensions > Apps Script, replace the old code with the new `google-apps-script.gs`.
4. Deploy: Deploy > Manage deployments > Edit > Version: New version > Deploy.
5. Open the app on laptop first.
6. Import your JSON backup if the app is empty.
7. Click Sync.
8. Refresh Google Sheet and confirm the Expenses tab has rows.
9. On mobile, open the app and click Import Sheet, not Sync, after laptop to Sheet sync is confirmed.
