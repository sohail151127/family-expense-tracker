# Family Expense Tracker V4.2 Analytics & Reports

## What changed

V4.2 adds a stronger reports layer on top of the working V4.1.2 large data sync fix.

New reporting features:
- Analytics summary cards
- Income vs expense chart
- Savings progress chart
- Weekly spending chart
- This month vs last month comparison chart
- Top 10 biggest expenses
- Top spending days
- Improved person-wise, category-wise, income source, account balance reports
- Export monthly report CSV
- Clearer Settings button labels explaining what each sync/backup action does

## Important before updating

Open your current app and export a JSON backup before uploading this version.

## Upload to GitHub Pages

Replace these files in your existing GitHub repository:

- index.html
- styles.css
- app.js
- sw.js
- manifest.webmanifest
- icons folder
- README_SETUP.md
- google-apps-script.gs

Then commit changes.

## Apps Script

This version keeps the V4.1.2 large-data chunked sync script. Replace Apps Script code with the included `google-apps-script.gs`, then deploy a new version:

Deploy → Manage deployments → Edit → Version: New version → Deploy

## After update

1. Open the app on laptop first.
2. Confirm data is visible.
3. Go to Settings → Send local data to Google Sheet.
4. Refresh Google Sheet and confirm rows are present.
5. On mobile, use Import data from Google Sheet if mobile needs fresh data.

## Cache note

If mobile still shows old app, open the GitHub Pages URL in Chrome, refresh 2–3 times, wait 15 seconds, then reopen the installed PWA.
