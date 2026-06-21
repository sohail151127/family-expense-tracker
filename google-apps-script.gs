/**
 * Family Expense Tracker - Google Sheets Sync Backend
 *
 * Setup:
 * 1. Create a Google Sheet.
 * 2. Open Extensions > Apps Script.
 * 3. Paste this full file.
 * 4. Deploy > New deployment > Web app.
 * 5. Execute as: Me.
 * 6. Who has access: Anyone with the link.
 * 7. Copy the Web App URL and paste it inside the PWA Backup tab.
 */

const CONFIG = {
  // Leave empty when this script is attached to the Google Sheet.
  // If using a standalone Apps Script project, paste the spreadsheet ID here.
  SPREADSHEET_ID: '',
  SHEETS: {
    appState: 'AppState',
    people: 'People',
    categories: 'Categories',
    expenses: 'Expenses',
    incomes: 'Income'
  }
};

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(body);

    if (payload.action !== 'backup' || !payload.data) {
      return jsonResponse({ ok: false, error: 'Invalid backup payload.' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      saveAppData_(payload.data);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : 'latest';
    const callback = e && e.parameter && e.parameter.callback ? e.parameter.callback : '';

    if (action !== 'latest') {
      return jsonOrJsonp_({ ok: false, error: 'Unknown action.' }, callback);
    }

    const data = readAppData_();
    return jsonOrJsonp_({ ok: true, data: data }, callback);
  } catch (error) {
    const callback = e && e.parameter && e.parameter.callback ? e.parameter.callback : '';
    return jsonOrJsonp_({ ok: false, error: String(error && error.message ? error.message : error) }, callback);
  }
}

function saveAppData_(data) {
  const ss = getSpreadsheet_();

  writeSheet_(ss, CONFIG.SHEETS.appState, ['key', 'value'], [
    ['version', String(data.version || 1)],
    ['settings', JSON.stringify(data.settings || {})],
    ['meta', JSON.stringify(data.meta || {})],
    ['exportedAt', data.exportedAt || ''],
    ['savedAt', new Date().toISOString()]
  ]);

  writeSheet_(ss, CONFIG.SHEETS.people, ['id', 'name', 'active'], (data.people || []).map((person) => [
    person.id || '',
    person.name || '',
    person.active === false ? 'FALSE' : 'TRUE'
  ]));

  writeSheet_(ss, CONFIG.SHEETS.categories, ['id', 'name', 'active'], (data.categories || []).map((category) => [
    category.id || '',
    category.name || '',
    category.active === false ? 'FALSE' : 'TRUE'
  ]));

  writeSheet_(ss, CONFIG.SHEETS.expenses, ['id', 'date', 'amount', 'personId', 'categoryId', 'necessity', 'description', 'createdAt', 'updatedAt'], (data.expenses || []).map((expense) => [
    expense.id || '',
    expense.date || '',
    Number(expense.amount || 0),
    expense.personId || 'combined',
    expense.categoryId || 'other',
    expense.necessity || 'necessary',
    expense.description || '',
    expense.createdAt || '',
    expense.updatedAt || ''
  ]));

  writeSheet_(ss, CONFIG.SHEETS.incomes, ['id', 'date', 'amount', 'source', 'note', 'createdAt', 'updatedAt'], (data.incomes || []).map((income) => [
    income.id || '',
    income.date || '',
    Number(income.amount || 0),
    income.source || '',
    income.note || '',
    income.createdAt || '',
    income.updatedAt || ''
  ]));
}

function readAppData_() {
  const ss = getSpreadsheet_();
  const appStateRows = readRows_(ss, CONFIG.SHEETS.appState);
  const appState = {};
  appStateRows.forEach((row) => {
    if (row.key) appState[row.key] = row.value;
  });

  const people = readRows_(ss, CONFIG.SHEETS.people).map((row) => ({
    id: String(row.id || ''),
    name: String(row.name || ''),
    active: String(row.active || 'TRUE').toUpperCase() !== 'FALSE'
  })).filter((person) => person.id && person.name);

  const categories = readRows_(ss, CONFIG.SHEETS.categories).map((row) => ({
    id: String(row.id || ''),
    name: String(row.name || ''),
    active: String(row.active || 'TRUE').toUpperCase() !== 'FALSE'
  })).filter((category) => category.id && category.name);

  const expenses = readRows_(ss, CONFIG.SHEETS.expenses).map((row) => ({
    id: String(row.id || ''),
    date: formatDateValue_(row.date),
    amount: Number(row.amount || 0),
    personId: String(row.personId || 'combined'),
    categoryId: String(row.categoryId || 'other'),
    necessity: String(row.necessity || 'necessary'),
    description: String(row.description || ''),
    createdAt: String(row.createdAt || ''),
    updatedAt: String(row.updatedAt || '')
  })).filter((expense) => expense.id && expense.date);

  const incomes = readRows_(ss, CONFIG.SHEETS.incomes).map((row) => ({
    id: String(row.id || ''),
    date: formatDateValue_(row.date),
    amount: Number(row.amount || 0),
    source: String(row.source || ''),
    note: String(row.note || ''),
    createdAt: String(row.createdAt || ''),
    updatedAt: String(row.updatedAt || '')
  })).filter((income) => income.id && income.date);

  return {
    version: Number(appState.version || 1),
    settings: safeJson_(appState.settings, {}),
    meta: safeJson_(appState.meta, {}),
    people: people,
    categories: categories,
    expenses: expenses,
    incomes: incomes,
    exportedAt: appState.exportedAt || '',
    importedAt: new Date().toISOString()
  };
}

function writeSheet_(ss, sheetName, headers, rows) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clear();
  const values = [headers].concat(rows || []);
  const range = sheet.getRange(1, 1, values.length, headers.length);
  range.setNumberFormat('@');
  range.setValues(values);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function readRows_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values.shift().map((header) => String(header || '').trim());
  return values.filter((row) => row.some((cell) => cell !== '')).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    return item;
  });
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID) return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('No active spreadsheet. Add SPREADSHEET_ID in CONFIG or bind script to a Google Sheet.');
  return active;
}

function formatDateValue_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

function safeJson_(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOrJsonp_(data, callback) {
  if (callback && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(data) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse(data);
}
