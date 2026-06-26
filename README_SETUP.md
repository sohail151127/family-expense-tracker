# Family Expense Tracker V4.1 – Offline Engine

This update focuses on reliability when there is no internet.

## What changed in V4.1

- Stronger offline mode using an improved Service Worker.
- App shell is cached so the app can open without internet after it has been opened once online.
- Local data is still saved immediately and is also mirrored into IndexedDB for stronger offline storage.
- Sync queue/status is shown in the top status pill and in Settings.
- Automatic sync attempt when internet returns.
- Google Sheet remains the cloud backup, not the first place data is saved.
- Better Offline & Sync panel in Settings with connection, pending changes, local data size, last sync, and Google status.

## Very important first-use rule

After uploading this version, open the app once with internet on the mobile where it will be used. Wait 10–20 seconds. This lets Chrome install/update the Service Worker and cache the app files.

After that, the app should open offline from the home screen/PWA icon.

## GitHub update steps

Upload/replace these files in your GitHub repository root:

- index.html
- styles.css
- app.js
- sw.js
- manifest.webmanifest
- icons folder
- README_SETUP.md
- google-apps-script.gs

Then commit changes.

## Apps Script update steps

1. Open your Google Sheet.
2. Go to Extensions → Apps Script.
3. Replace old code with `google-apps-script.gs` from this folder.
4. Deploy → Manage deployments → Edit.
5. Select New version.
6. Deploy.

Your existing Web App URL should normally stay the same.

## After upload on mobile

1. Open the GitHub Pages app URL in Chrome while internet is available.
2. Refresh 2–3 times.
3. Open Settings → Offline & Sync Engine.
4. Confirm Offline database says Ready.
5. Close Chrome.
6. Turn off internet and open the installed app icon.

## Safe offline flow

When offline:

- Add entries normally.
- Edit/delete entries normally.
- Add notes normally.
- The top pill should show Offline and pending changes.

When internet returns:

- App will try to sync automatically.
- You can also open Settings and tap Sync now.

## Important two-device rule

If father’s mobile and your mobile both edit data while offline, sync carefully. This version protects local data and queues changes, but Google Sheet is still a single backup copy. The safest flow is:

1. On each device, open app while online.
2. Import Sheet before making changes on the second device.
3. Add/edit entries.
4. Sync now.

Full conflict merge will be handled in a future update.
