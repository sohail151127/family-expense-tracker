(() => {
  'use strict';

  const STORAGE_KEY = 'family-expense-tracker-v2-premium';
  const OLD_STORAGE_KEY = 'family-expense-tracker-v1';
  const SYNC_DEBOUNCE_MS = 1600;

  const defaultPeople = [
    { id: 'combined', name: 'Combined / General', active: true },
    { id: 'father-zulfiqar', name: 'Father Zulfiqar', active: true },
    { id: 'mother-rafiq-bibi', name: 'Mother Rafiq Bibi', active: true },
    { id: 'son-sohail', name: 'Son Sohail', active: true },
    { id: 'grandson-sarim', name: 'Grandson Sarim', active: true },
    { id: 'sons-wife-kainat', name: "Son's Wife Kainat", active: true },
    { id: 'daughter-sidra', name: 'Daughter Sidra', active: true },
    { id: 'son-bilal', name: 'Son Bilal', active: true }
  ];

  const defaultCategories = [
    { id: 'grocery', name: 'Grocery', active: true },
    { id: 'medicine', name: 'Medicine', active: true },
    { id: 'bills', name: 'Bills', active: true },
    { id: 'food', name: 'Food', active: true },
    { id: 'transport', name: 'Transport', active: true },
    { id: 'education', name: 'Education', active: true },
    { id: 'home', name: 'Home', active: true },
    { id: 'rent', name: 'Rent', active: true },
    { id: 'utilities', name: 'Utilities', active: true },
    { id: 'other', name: 'Other', active: true }
  ];

  const defaultAccounts = [
    { id: 'cash', name: 'Cash', openingBalance: 0, active: true },
    { id: 'bank', name: 'Bank', openingBalance: 0, active: true },
    { id: 'jazzcash', name: 'JazzCash', openingBalance: 0, active: true },
    { id: 'easypaisa', name: 'Easypaisa', openingBalance: 0, active: true }
  ];

  const initialState = () => ({
    version: 2,
    settings: {
      currency: 'PKR',
      selectedMonth: monthKey(new Date()),
      syncUrl: '',
      warningPercent: 20,
      usageMode: 'admin',
      pinHash: '',
      budget: {
        expectedIncome: 0,
        savingTarget: 0,
        necessaryLimit: 0,
        unnecessaryLimit: 0
      }
    },
    people: clone(defaultPeople),
    categories: clone(defaultCategories),
    accounts: clone(defaultAccounts),
    expenses: [],
    incomes: [],
    debts: [],
    recurringExpenses: [],
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncAt: '',
      syncPending: false,
      syncMessage: 'Local storage ready.'
    }
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    lockScreen: $('#lockScreen'),
    pinInput: $('#pinInput'),
    unlockBtn: $('#unlockBtn'),
    pinError: $('#pinError'),
    appTitle: $('#appTitle'),
    monthTitle: $('#monthTitle'),
    installBtn: $('#installBtn'),
    lockNowBtn: $('#lockNowBtn'),
    syncDot: $('#syncDot'),
    syncText: $('#syncText'),
    syncStatus: $('#syncStatus'),
    toast: $('#toast'),
    undoBar: $('#undoBar'),
    undoText: $('#undoText'),
    undoBtn: $('#undoBtn'),
    homeMonthPicker: $('#homeMonthPicker'),
    homePrevMonth: $('#homePrevMonth'),
    homeNextMonth: $('#homeNextMonth'),
    calendarMonthPicker: $('#calendarMonthPicker'),
    calendarPrev: $('#calendarPrev'),
    calendarNext: $('#calendarNext'),
    monthBadge: $('#monthBadge'),
    remainingHero: $('#remainingHero'),
    homeIncome: $('#homeIncome'),
    homeExpense: $('#homeExpense'),
    homeSavingForecast: $('#homeSavingForecast'),
    homeProgressBar: $('#homeProgressBar'),
    homeBudgetHint: $('#homeBudgetHint'),
    alertStack: $('#alertStack'),
    homeNecessary: $('#homeNecessary'),
    homeUnnecessary: $('#homeUnnecessary'),
    homeNecessaryLimit: $('#homeNecessaryLimit'),
    homeUnnecessaryLimit: $('#homeUnnecessaryLimit'),
    todaySpent: $('#todaySpent'),
    todaySummary: $('#todaySummary'),
    safeDailySpend: $('#safeDailySpend'),
    accountBalanceList: $('#accountBalanceList'),
    closingSummary: $('#closingSummary'),
    exportMonthlySummaryBtn: $('#exportMonthlySummaryBtn'),
    expensePanel: $('#expensePanel'),
    incomePanel: $('#incomePanel'),
    expenseForm: $('#expenseForm'),
    expenseId: $('#expenseId'),
    expenseAmount: $('#expenseAmount'),
    expenseDate: $('#expenseDate'),
    expensePerson: $('#expensePerson'),
    expenseCategory: $('#expenseCategory'),
    expenseAccount: $('#expenseAccount'),
    expenseNecessity: $('#expenseNecessity'),
    expenseDescription: $('#expenseDescription'),
    duplicateWarning: $('#duplicateWarning'),
    quickCategoryBar: $('#quickCategoryBar'),
    clearExpenseBtn: $('#clearExpenseBtn'),
    incomeForm: $('#incomeForm'),
    incomeId: $('#incomeId'),
    incomeAmount: $('#incomeAmount'),
    incomeDate: $('#incomeDate'),
    incomeSource: $('#incomeSource'),
    customIncomeWrap: $('#customIncomeWrap'),
    customIncomeSource: $('#customIncomeSource'),
    incomeAccount: $('#incomeAccount'),
    incomeNote: $('#incomeNote'),
    clearIncomeBtn: $('#clearIncomeBtn'),
    filterRange: $('#filterRange'),
    filterFromWrap: $('#filterFromWrap'),
    filterToWrap: $('#filterToWrap'),
    filterFrom: $('#filterFrom'),
    filterTo: $('#filterTo'),
    filterPerson: $('#filterPerson'),
    filterCategory: $('#filterCategory'),
    filterNecessity: $('#filterNecessity'),
    reportSearch: $('#reportSearch'),
    resetFiltersBtn: $('#resetFiltersBtn'),
    filteredSpent: $('#filteredSpent'),
    filteredCount: $('#filteredCount'),
    filteredDailyAverage: $('#filteredDailyAverage'),
    topPersonText: $('#topPersonText'),
    topPersonAmount: $('#topPersonAmount'),
    topCategoryText: $('#topCategoryText'),
    topCategoryAmount: $('#topCategoryAmount'),
    personBarChart: $('#personBarChart'),
    categoryBarChart: $('#categoryBarChart'),
    necessityDonut: $('#necessityDonut'),
    dailyTrendChart: $('#dailyTrendChart'),
    incomeSourceChart: $('#incomeSourceChart'),
    accountChart: $('#accountChart'),
    personCards: $('#personCards'),
    expenseList: $('#expenseList'),
    debtReportList: $('#debtReportList'),
    calendarMonthText: $('#calendarMonthText'),
    calendarGrid: $('#calendarGrid'),
    dayDetails: $('#dayDetails'),
    dayDetailsTitle: $('#dayDetailsTitle'),
    dayDetailsSummary: $('#dayDetailsSummary'),
    dayDetailsList: $('#dayDetailsList'),
    closeDayDetails: $('#closeDayDetails'),
    fatherModeToggle: $('#fatherModeToggle'),
    newPin: $('#newPin'),
    savePinBtn: $('#savePinBtn'),
    removePinBtn: $('#removePinBtn'),
    budgetForm: $('#budgetForm'),
    budgetIncome: $('#budgetIncome'),
    savingTarget: $('#savingTarget'),
    necessaryLimit: $('#necessaryLimit'),
    unnecessaryLimit: $('#unnecessaryLimit'),
    warningPercent: $('#warningPercent'),
    accountForm: $('#accountForm'),
    accountId: $('#accountId'),
    accountName: $('#accountName'),
    accountOpening: $('#accountOpening'),
    clearAccountBtn: $('#clearAccountBtn'),
    accountsList: $('#accountsList'),
    personForm: $('#personForm'),
    personName: $('#personName'),
    peopleList: $('#peopleList'),
    categoryForm: $('#categoryForm'),
    categoryName: $('#categoryName'),
    categoriesList: $('#categoriesList'),
    recurringForm: $('#recurringForm'),
    recurringId: $('#recurringId'),
    recurringName: $('#recurringName'),
    recurringAmount: $('#recurringAmount'),
    recurringDay: $('#recurringDay'),
    recurringPerson: $('#recurringPerson'),
    recurringCategory: $('#recurringCategory'),
    recurringAccount: $('#recurringAccount'),
    recurringNecessity: $('#recurringNecessity'),
    clearRecurringBtn: $('#clearRecurringBtn'),
    addRecurringDueBtn: $('#addRecurringDueBtn'),
    recurringList: $('#recurringList'),
    debtForm: $('#debtForm'),
    debtId: $('#debtId'),
    debtType: $('#debtType'),
    debtParty: $('#debtParty'),
    debtAmount: $('#debtAmount'),
    debtDueDate: $('#debtDueDate'),
    debtNote: $('#debtNote'),
    clearDebtBtn: $('#clearDebtBtn'),
    debtList: $('#debtList'),
    syncUrl: $('#syncUrl'),
    saveSyncUrlBtn: $('#saveSyncUrlBtn'),
    syncNowBtn: $('#syncNowBtn'),
    importSheetBtn: $('#importSheetBtn'),
    exportJsonBtn: $('#exportJsonBtn'),
    exportCsvBtn: $('#exportCsvBtn'),
    exportMonthlyBtn: $('#exportMonthlyBtn'),
    importFile: $('#importFile'),
    resetBtn: $('#resetBtn')
  };

  let state = loadState();
  let activeTab = 'home';
  let deferredInstallPrompt = null;
  let syncTimer = null;
  let toastTimer = null;
  let undoTimer = null;
  let pendingUndo = null;
  let reportFilters = {
    range: 'thisMonth',
    from: '',
    to: '',
    personId: 'all',
    categoryId: 'all',
    necessity: 'all',
    search: ''
  };

  init();

  function init() {
    normalizeState();
    seedDefaultsIfEmpty();
    setDefaultFormDates();
    bindEvents();
    applyMode();
    checkPinLock();
    renderAll();
    registerServiceWorker();
  }

  function bindEvents() {
    $$('.nav-btn').forEach((btn) => btn.addEventListener('click', () => openTab(btn.dataset.tab)));
    $$('[data-open-tab]').forEach((btn) => btn.addEventListener('click', () => openTab(btn.dataset.openTab)));
    $$('[data-open-add]').forEach((btn) => btn.addEventListener('click', () => {
      openTab('add');
      setAddMode(btn.dataset.openAdd);
    }));

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      els.installBtn.hidden = false;
    });
    els.installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      els.installBtn.hidden = true;
    });

    els.unlockBtn.addEventListener('click', unlockWithPin);
    els.pinInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') unlockWithPin(); });
    els.lockNowBtn.addEventListener('click', lockNow);

    [els.homeMonthPicker, els.calendarMonthPicker].forEach((input) => {
      input.addEventListener('change', () => setSelectedMonth(input.value));
    });
    els.homePrevMonth.addEventListener('click', () => shiftMonth(-1));
    els.homeNextMonth.addEventListener('click', () => shiftMonth(1));
    els.calendarPrev.addEventListener('click', () => shiftMonth(-1));
    els.calendarNext.addEventListener('click', () => shiftMonth(1));

    $$('.segment-btn').forEach((btn) => btn.addEventListener('click', () => setAddMode(btn.dataset.addMode)));
    els.incomeSource.addEventListener('change', () => {
      els.customIncomeWrap.hidden = els.incomeSource.value !== 'custom';
    });
    els.expenseForm.addEventListener('submit', saveExpenseFromForm);
    els.incomeForm.addEventListener('submit', saveIncomeFromForm);
    els.clearExpenseBtn.addEventListener('click', clearExpenseForm);
    els.clearIncomeBtn.addEventListener('click', clearIncomeForm);

    [els.filterRange, els.filterPerson, els.filterCategory, els.filterNecessity].forEach((input) => {
      input.addEventListener('change', updateReportFiltersFromInputs);
    });
    [els.filterFrom, els.filterTo, els.reportSearch].forEach((input) => {
      input.addEventListener('input', updateReportFiltersFromInputs);
    });
    els.resetFiltersBtn.addEventListener('click', resetReportFilters);
    els.closeDayDetails.addEventListener('click', () => { els.dayDetails.hidden = true; });

    els.fatherModeToggle.addEventListener('change', () => {
      state.settings.usageMode = els.fatherModeToggle.checked ? 'father' : 'admin';
      saveAndRender(true);
      if (state.settings.usageMode === 'father' && activeTab === 'reports') openTab('home');
    });
    els.savePinBtn.addEventListener('click', savePin);
    els.removePinBtn.addEventListener('click', removePin);
    els.budgetForm.addEventListener('submit', saveBudget);
    els.accountForm.addEventListener('submit', saveAccount);
    els.clearAccountBtn.addEventListener('click', clearAccountForm);
    els.personForm.addEventListener('submit', addPerson);
    els.categoryForm.addEventListener('submit', addCategory);
    els.recurringForm.addEventListener('submit', saveRecurring);
    els.clearRecurringBtn.addEventListener('click', clearRecurringForm);
    els.addRecurringDueBtn.addEventListener('click', addRecurringDueForMonth);
    els.debtForm.addEventListener('submit', saveDebt);
    els.clearDebtBtn.addEventListener('click', clearDebtForm);

    els.saveSyncUrlBtn.addEventListener('click', () => {
      state.settings.syncUrl = els.syncUrl.value.trim();
      state.meta.syncMessage = state.settings.syncUrl ? 'Sync URL saved.' : 'Sync URL removed.';
      saveAndRender(false);
      showToast('Sync URL saved.');
    });
    els.syncNowBtn.addEventListener('click', () => pushToSheet(true));
    els.importSheetBtn.addEventListener('click', importFromSheet);
    els.exportJsonBtn.addEventListener('click', exportJson);
    els.exportCsvBtn.addEventListener('click', exportCsv);
    els.exportMonthlyBtn.addEventListener('click', exportMonthlyReport);
    els.exportMonthlySummaryBtn.addEventListener('click', exportMonthlyReport);
    els.importFile.addEventListener('change', importJsonFile);
    els.resetBtn.addEventListener('click', resetLocalData);
    els.undoBtn.addEventListener('click', restoreUndo);

    window.addEventListener('online', () => {
      if (state.meta.syncPending) scheduleSync();
      renderSyncStatus();
    });
    window.addEventListener('offline', renderSyncStatus);
  }

  function openTab(tab) {
    if (tab === 'reports' && state.settings.usageMode === 'father') tab = 'home';
    activeTab = tab;
    $$('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.tabPanel === tab));
    $$('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setAddMode(mode) {
    const normalized = mode === 'income' ? 'income' : 'expense';
    $$('.segment-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.addMode === normalized));
    els.expensePanel.classList.toggle('active-panel', normalized === 'expense');
    els.incomePanel.classList.toggle('active-panel', normalized === 'income');
  }

  function setSelectedMonth(value) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    state.settings.selectedMonth = value;
    reportFilters.range = els.filterRange.value === 'custom' ? 'custom' : 'thisMonth';
    saveAndRender(false);
  }

  function shiftMonth(delta) {
    const [year, month] = state.settings.selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(monthKey(date));
  }

  function renderAll() {
    normalizeState();
    applyMode();
    renderStaticInputs();
    renderSyncStatus();
    renderHome();
    renderAddScreen();
    renderReports();
    renderCalendar();
    renderSettings();
  }

  function applyMode() {
    document.body.classList.toggle('father-mode', state.settings.usageMode === 'father');
    els.fatherModeToggle.checked = state.settings.usageMode === 'father';
    els.lockNowBtn.hidden = !state.settings.pinHash;
  }

  function renderStaticInputs() {
    const selectedMonth = state.settings.selectedMonth || monthKey(new Date());
    els.homeMonthPicker.value = selectedMonth;
    els.calendarMonthPicker.value = selectedMonth;
    els.monthTitle.textContent = `${formatMonthLabel(selectedMonth)} Family Budget`;
    els.monthBadge.textContent = formatMonthLabel(selectedMonth);
    els.syncUrl.value = state.settings.syncUrl || '';

    const personOptions = getActivePeople().map((person) => [person.id, person.name]);
    const categoryOptions = getActiveCategories().map((category) => [category.id, category.name]);
    const accountOptions = getActiveAccounts().map((account) => [account.id, account.name]);
    fillOptions(els.expensePerson, personOptions);
    fillOptions(els.expenseCategory, categoryOptions);
    fillOptions(els.expenseAccount, accountOptions);
    fillOptions(els.incomeAccount, accountOptions);
    fillOptions(els.recurringPerson, personOptions);
    fillOptions(els.recurringCategory, categoryOptions);
    fillOptions(els.recurringAccount, accountOptions);
    fillOptions(els.filterPerson, [['all', 'All people'], ...personOptions]);
    fillOptions(els.filterCategory, [['all', 'All categories'], ...categoryOptions]);
    els.filterPerson.value = reportFilters.personId;
    els.filterCategory.value = reportFilters.categoryId;
    els.filterRange.value = reportFilters.range;
    els.filterNecessity.value = reportFilters.necessity;
    els.filterFrom.value = reportFilters.from || monthStart(selectedMonth);
    els.filterTo.value = reportFilters.to || monthEnd(selectedMonth);
    els.reportSearch.value = reportFilters.search || '';
    const custom = reportFilters.range === 'custom';
    els.filterFromWrap.hidden = !custom;
    els.filterToWrap.hidden = !custom;
  }

  function renderHome() {
    const month = state.settings.selectedMonth;
    const range = getMonthRange(month);
    const expenses = state.expenses.filter((expense) => dateInRange(expense.date, range.from, range.to));
    const incomes = state.incomes.filter((income) => dateInRange(income.date, range.from, range.to));
    const totalIncome = sum(incomes, 'amount');
    const totalExpense = sum(expenses, 'amount');
    const necessary = sum(expenses.filter((expense) => expense.necessity === 'necessary'), 'amount');
    const unnecessary = sum(expenses.filter((expense) => expense.necessity === 'unnecessary'), 'amount');
    const budget = getBudget();
    const plannedIncome = budget.expectedIncome || totalIncome;
    const remaining = totalIncome - totalExpense;
    const savingForecast = plannedIncome ? plannedIncome - totalExpense : remaining;
    const spentPercent = plannedIncome ? clamp((totalExpense / plannedIncome) * 100, 0, 100) : 0;
    const todayExpenses = state.expenses.filter((expense) => expense.date === todayKey());
    const todayTotal = sum(todayExpenses, 'amount');
    const todayNecessary = sum(todayExpenses.filter((expense) => expense.necessity === 'necessary'), 'amount');

    els.remainingHero.textContent = money(remaining);
    els.homeIncome.textContent = money(totalIncome);
    els.homeExpense.textContent = money(totalExpense);
    els.homeSavingForecast.textContent = money(savingForecast);
    els.homeProgressBar.style.width = `${spentPercent}%`;
    els.homeBudgetHint.textContent = plannedIncome
      ? `${money(totalExpense)} spent from ${money(plannedIncome)} planned monthly income.`
      : 'Add income or set a monthly plan to show budget progress.';
    els.homeNecessary.textContent = money(necessary);
    els.homeUnnecessary.textContent = money(unnecessary);
    els.homeNecessaryLimit.textContent = budget.necessaryLimit ? `${money(Math.max(budget.necessaryLimit - necessary, 0))} left from limit` : 'No limit set';
    els.homeUnnecessaryLimit.textContent = budget.unnecessaryLimit ? `${money(Math.max(budget.unnecessaryLimit - unnecessary, 0))} left from limit` : 'No limit set';
    els.todaySpent.textContent = money(todayTotal);
    els.todaySummary.textContent = todayTotal ? `${money(todayNecessary)} necessary today` : 'No spending today';
    els.safeDailySpend.textContent = money(calculateSafeDailySpend(plannedIncome, totalExpense, budget.savingTarget, month));

    renderAlerts({ remaining, plannedIncome, savingForecast, necessary, unnecessary, budget, totalExpense });
    renderAccountBalances();
    renderClosingSummary({ totalIncome, totalExpense, remaining, necessary, unnecessary, todayTotal, todayNecessary, savingForecast });
  }

  function renderAlerts(data) {
    const alerts = [];
    const threshold = Number(state.settings.warningPercent || 20);
    if (data.plannedIncome && data.remaining <= (data.plannedIncome * threshold / 100)) {
      alerts.push({ type: 'warning', text: `Low balance warning: remaining balance is under ${threshold}% of planned monthly income.` });
    }
    if (data.budget.savingTarget && data.savingForecast < data.budget.savingTarget) {
      alerts.push({ type: 'warning', text: `Saving target is behind. Current forecast is ${money(data.savingForecast)}, target is ${money(data.budget.savingTarget)}.` });
    } else if (data.budget.savingTarget && data.savingForecast >= data.budget.savingTarget) {
      alerts.push({ type: 'good', text: `Saving target is on track. Forecast saving is ${money(data.savingForecast)}.` });
    }
    if (data.budget.unnecessaryLimit && data.unnecessary > data.budget.unnecessaryLimit) {
      alerts.push({ type: 'danger', text: `Unnecessary expense limit crossed by ${money(data.unnecessary - data.budget.unnecessaryLimit)}.` });
    }
    if (data.budget.necessaryLimit && data.necessary > data.budget.necessaryLimit) {
      alerts.push({ type: 'warning', text: `Necessary expense limit crossed by ${money(data.necessary - data.budget.necessaryLimit)}.` });
    }
    els.alertStack.innerHTML = alerts.map((alert) => `<div class="alert ${alert.type}">${escapeHtml(alert.text)}</div>`).join('');
  }

  function renderClosingSummary(data) {
    const topCategory = topByGroup(state.expenses.filter((expense) => isMonthDate(expense.date, state.settings.selectedMonth)), (expense) => findCategory(expense.categoryId)?.name || 'Other');
    const lines = [
      ['Month income', money(data.totalIncome)],
      ['Month expense', money(data.totalExpense)],
      ['Remaining balance', money(data.remaining)],
      ['Necessary expense', money(data.necessary)],
      ['Unnecessary expense', money(data.unnecessary)],
      ['Today expense', money(data.todayTotal)],
      ['Most spent on', topCategory ? `${topCategory.name} (${money(topCategory.amount)})` : 'No data yet']
    ];
    els.closingSummary.innerHTML = lines.map(([label, value]) => `<div class="summary-line"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  }

  function renderAccountBalances() {
    const balances = accountBalances();
    if (!balances.length) {
      els.accountBalanceList.className = 'balance-list empty-state';
      els.accountBalanceList.textContent = 'No accounts yet.';
      return;
    }
    els.accountBalanceList.className = 'balance-list';
    els.accountBalanceList.innerHTML = balances.map((item) => `
      <div class="balance-item">
        <span>${escapeHtml(item.name)}</span>
        <strong>${money(item.balance)}</strong>
      </div>
    `).join('');
  }

  function renderAddScreen() {
    els.quickCategoryBar.innerHTML = getActiveCategories().slice(0, 8).map((category) => `
      <button type="button" class="quick-chip ${els.expenseCategory.value === category.id ? 'active' : ''}" data-quick-category="${escapeHtml(category.id)}">${escapeHtml(category.name)}</button>
    `).join('');
    $$('[data-quick-category]', els.quickCategoryBar).forEach((btn) => {
      btn.addEventListener('click', () => {
        els.expenseCategory.value = btn.dataset.quickCategory;
        renderAddScreen();
      });
    });
  }

  function renderReports() {
    const filteredExpenses = getFilteredExpenses();
    const filteredTotal = sum(filteredExpenses, 'amount');
    const dateRange = getReportDateRange();
    const days = Math.max(1, daysBetween(dateRange.from, dateRange.to) + 1);
    const personItems = groupExpensesBy(filteredExpenses, (expense) => findPerson(expense.personId)?.name || 'Unknown');
    const categoryItems = groupExpensesBy(filteredExpenses, (expense) => findCategory(expense.categoryId)?.name || 'Other');
    const topPerson = personItems[0];
    const topCategory = categoryItems[0];

    els.filteredSpent.textContent = money(filteredTotal);
    els.filteredCount.textContent = `${filteredExpenses.length} expense${filteredExpenses.length === 1 ? '' : 's'}`;
    els.filteredDailyAverage.textContent = money(filteredTotal / days);
    els.topPersonText.textContent = topPerson ? topPerson.name : '—';
    els.topPersonAmount.textContent = topPerson ? money(topPerson.amount) : money(0);
    els.topCategoryText.textContent = topCategory ? topCategory.name : '—';
    els.topCategoryAmount.textContent = topCategory ? money(topCategory.amount) : money(0);

    renderBarChart(els.personBarChart, personItems.slice(0, 8));
    renderBarChart(els.categoryBarChart, categoryItems.slice(0, 8));
    renderNecessityDonut(filteredExpenses);
    renderLineChart(els.dailyTrendChart, dailyExpenseSeries(filteredExpenses, dateRange.from, dateRange.to));
    renderBarChart(els.incomeSourceChart, groupIncomesBySource(getMonthIncomes(state.settings.selectedMonth)).slice(0, 8));
    renderBarChart(els.accountChart, accountBalances().map((account) => ({ name: account.name, amount: Math.max(account.balance, 0) })).slice(0, 8));
    renderPersonCards(filteredExpenses);
    renderExpenseList(filteredExpenses);
    renderDebtReports();
  }

  function renderBarChart(container, items) {
    if (!items.length || !sum(items, 'amount')) {
      container.className = 'chart-area empty-state';
      container.textContent = 'No data yet.';
      return;
    }
    container.className = 'chart-area bar-chart';
    const max = Math.max(...items.map((item) => item.amount), 1);
    container.innerHTML = items.map((item) => {
      const width = Math.max(3, (item.amount / max) * 100);
      return `
        <div class="bar-row" title="${escapeHtml(item.name)} - ${money(item.amount)}">
          <div class="bar-label">${escapeHtml(item.name)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <div class="bar-value">${money(item.amount)}</div>
        </div>
      `;
    }).join('');
  }

  function renderNecessityDonut(expenses) {
    const necessary = sum(expenses.filter((expense) => expense.necessity === 'necessary'), 'amount');
    const unnecessary = sum(expenses.filter((expense) => expense.necessity === 'unnecessary'), 'amount');
    const total = necessary + unnecessary;
    if (!total) {
      els.necessityDonut.className = 'donut-wrap empty-state';
      els.necessityDonut.textContent = 'No data yet.';
      return;
    }
    els.necessityDonut.className = 'donut-wrap';
    const necessaryPercent = Math.round((necessary / total) * 100);
    els.necessityDonut.innerHTML = `
      <div>
        <div class="donut" style="background: conic-gradient(var(--brand) 0 ${necessaryPercent}%, #f59e0b ${necessaryPercent}% 100%);">
          <div class="donut-center"><strong>${necessaryPercent}%</strong><span>Necessary</span></div>
        </div>
        <div class="donut-legend">
          <span><i class="legend-dot" style="background:var(--brand)"></i>${money(necessary)}</span>
          <span><i class="legend-dot" style="background:#f59e0b"></i>${money(unnecessary)}</span>
        </div>
      </div>
    `;
  }

  function renderLineChart(container, series) {
    if (!series.length || !series.some((item) => item.amount > 0)) {
      container.className = 'chart-area empty-state';
      container.textContent = 'No trend data yet.';
      return;
    }
    container.className = 'chart-area';
    const width = 520;
    const height = 214;
    const padX = 34;
    const padY = 28;
    const max = Math.max(...series.map((item) => item.amount), 1);
    const denominator = Math.max(series.length - 1, 1);
    const points = series.map((item, index) => {
      const x = padX + (index / denominator) * (width - padX * 2);
      const y = height - padY - (item.amount / max) * (height - padY * 2);
      return { ...item, x, y };
    });
    const linePath = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padY} L ${points[0].x.toFixed(1)} ${height - padY} Z`;
    const labelEvery = Math.ceil(series.length / 5);
    container.innerHTML = `
      <svg class="trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily expense trend">
        <line class="trend-axis" x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}"></line>
        <line class="trend-axis" x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}"></line>
        <path class="trend-area" d="${areaPath}"></path>
        <path class="trend-line" d="${linePath}"></path>
        ${points.map((point, index) => `<circle class="trend-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${point.amount ? 3.5 : 0}"><title>${escapeHtml(point.label)}: ${money(point.amount)}</title></circle>${index % labelEvery === 0 ? `<text class="trend-label" x="${point.x.toFixed(1)}" y="${height - 6}" text-anchor="middle">${escapeHtml(point.shortLabel)}</text>` : ''}`).join('')}
      </svg>
    `;
  }

  function renderPersonCards(expenses) {
    const groups = groupExpensesBy(expenses, (expense) => findPerson(expense.personId)?.name || 'Unknown', (expense) => expense.personId || 'combined');
    if (!groups.length) {
      els.personCards.className = 'person-card-grid empty-state';
      els.personCards.textContent = 'No person-wise expense yet.';
      return;
    }
    els.personCards.className = 'person-card-grid';
    els.personCards.innerHTML = groups.map((group) => {
      const necessary = sum(group.items.filter((expense) => expense.necessity === 'necessary'), 'amount');
      const unnecessary = sum(group.items.filter((expense) => expense.necessity === 'unnecessary'), 'amount');
      const active = reportFilters.personId === group.id;
      return `
        <button class="person-card ${active ? 'active' : ''}" data-person-filter="${escapeHtml(group.id)}">
          <span>${escapeHtml(group.name)}</span>
          <strong>${money(group.amount)}</strong>
          <small>${group.count} entries · N: ${money(necessary)} · U: ${money(unnecessary)}</small>
        </button>
      `;
    }).join('');
    $$('[data-person-filter]', els.personCards).forEach((btn) => {
      btn.addEventListener('click', () => {
        reportFilters.personId = reportFilters.personId === btn.dataset.personFilter ? 'all' : btn.dataset.personFilter;
        renderAll();
      });
    });
  }

  function renderExpenseList(expenses) {
    const sorted = [...expenses].sort((a, b) => `${b.date}${b.createdAt || ''}`.localeCompare(`${a.date}${a.createdAt || ''}`));
    if (!sorted.length) {
      els.expenseList.className = 'record-list empty-state';
      els.expenseList.textContent = 'No expenses found.';
      return;
    }
    els.expenseList.className = 'record-list';
    els.expenseList.innerHTML = sorted.map((expense) => expenseRecordHtml(expense)).join('');
    bindExpenseActions(els.expenseList);
  }

  function expenseRecordHtml(expense) {
    const person = findPerson(expense.personId)?.name || 'Unknown';
    const category = findCategory(expense.categoryId)?.name || 'Other';
    const account = findAccount(expense.accountId)?.name || 'Cash';
    return `
      <article class="record-item">
        <div class="record-head"><div><div class="record-title">${escapeHtml(expense.description || category)}</div><div class="muted small-text">${formatDate(expense.date)}</div></div><div class="record-amount">${money(expense.amount)}</div></div>
        <div class="record-meta">
          <span class="tag">${escapeHtml(person)}</span>
          <span class="tag">${escapeHtml(category)}</span>
          <span class="tag">${escapeHtml(account)}</span>
          <span class="tag ${expense.necessity === 'necessary' ? 'good' : 'warning'}">${expense.necessity === 'necessary' ? 'Necessary' : 'Unnecessary'}</span>
        </div>
        <div class="record-actions"><button class="mini-btn" data-edit-expense="${escapeHtml(expense.id)}">Edit</button><button class="mini-btn" data-delete-expense="${escapeHtml(expense.id)}">Delete</button></div>
      </article>
    `;
  }

  function bindExpenseActions(root) {
    $$('[data-edit-expense]', root).forEach((btn) => btn.addEventListener('click', () => editExpense(btn.dataset.editExpense)));
    $$('[data-delete-expense]', root).forEach((btn) => btn.addEventListener('click', () => deleteExpense(btn.dataset.deleteExpense)));
  }

  function renderCalendar() {
    const month = state.settings.selectedMonth;
    const [year, monthNumber] = month.split('-').map(Number);
    const first = new Date(year, monthNumber - 1, 1);
    const days = new Date(year, monthNumber, 0).getDate();
    const startOffset = first.getDay();
    const expensesByDate = groupBy(state.expenses.filter((expense) => isMonthDate(expense.date, month)), (expense) => expense.date);
    els.calendarMonthText.textContent = `${formatMonthLabel(month)} date-wise spending`;
    const cells = [];
    for (let index = 0; index < startOffset; index += 1) cells.push('<button class="day-cell empty" disabled></button>');
    for (let day = 1; day <= days; day += 1) {
      const date = `${month}-${String(day).padStart(2, '0')}`;
      const items = expensesByDate[date] || [];
      const total = sum(items, 'amount');
      const people = unique(items.map((expense) => findPerson(expense.personId)?.name || 'Unknown')).slice(0, 3);
      cells.push(`
        <button class="day-cell ${date === todayKey() ? 'today' : ''}" data-day="${date}">
          <span class="day-number">${day}</span>
          ${total ? `<span class="day-total">${money(total)}</span>` : ''}
          <span class="day-tags">${people.map((person) => `<span class="day-tag">${escapeHtml(shortName(person))}</span>`).join('')}</span>
        </button>
      `);
    }
    els.calendarGrid.innerHTML = cells.join('');
    $$('[data-day]', els.calendarGrid).forEach((btn) => btn.addEventListener('click', () => openDayDetails(btn.dataset.day)));
  }

  function openDayDetails(date) {
    const expenses = state.expenses.filter((expense) => expense.date === date).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const incomes = state.incomes.filter((income) => income.date === date).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const totalExpense = sum(expenses, 'amount');
    const totalIncome = sum(incomes, 'amount');
    els.dayDetails.hidden = false;
    els.dayDetailsTitle.textContent = formatDate(date);
    els.dayDetailsSummary.textContent = `Income ${money(totalIncome)} · Expense ${money(totalExpense)}`;
    const incomeHtml = incomes.map((income) => `
      <article class="record-item">
        <div class="record-head"><div><div class="record-title">${escapeHtml(income.source || 'Income')}</div><div class="muted small-text">${escapeHtml(income.note || 'Income entry')}</div></div><div class="record-amount">${money(income.amount)}</div></div>
        <div class="record-meta"><span class="tag good">Income</span><span class="tag">${escapeHtml(findAccount(income.accountId)?.name || 'Cash')}</span></div>
      </article>
    `).join('');
    const expenseHtml = expenses.map((expense) => expenseRecordHtml(expense)).join('');
    els.dayDetailsList.innerHTML = incomeHtml + expenseHtml || '<div class="empty-state">No entries for this date.</div>';
    bindExpenseActions(els.dayDetailsList);
  }

  function renderSettings() {
    const budget = getBudget();
    els.budgetIncome.value = budget.expectedIncome || '';
    els.savingTarget.value = budget.savingTarget || '';
    els.necessaryLimit.value = budget.necessaryLimit || '';
    els.unnecessaryLimit.value = budget.unnecessaryLimit || '';
    els.warningPercent.value = state.settings.warningPercent || 20;
    renderAccountsManager();
    renderPeopleManager();
    renderCategoriesManager();
    renderRecurringManager();
    renderDebtManager();
  }

  function renderAccountsManager() {
    if (!state.accounts.length) {
      els.accountsList.innerHTML = '<div class="empty-state">No accounts yet.</div>';
      return;
    }
    const balances = accountBalancesMap();
    els.accountsList.innerHTML = state.accounts.map((account) => `
      <div class="manage-item">
        <div><strong>${escapeHtml(account.name)}</strong><small>Opening ${money(account.openingBalance || 0)} · Current ${money(balances[account.id] || 0)} · ${account.active === false ? 'Disabled' : 'Active'}</small></div>
        <div class="manage-actions"><button class="mini-btn" data-edit-account="${escapeHtml(account.id)}">Edit</button><button class="mini-btn" data-toggle-account="${escapeHtml(account.id)}">${account.active === false ? 'Enable' : 'Disable'}</button></div>
      </div>
    `).join('');
    $$('[data-edit-account]', els.accountsList).forEach((btn) => btn.addEventListener('click', () => editAccount(btn.dataset.editAccount)));
    $$('[data-toggle-account]', els.accountsList).forEach((btn) => btn.addEventListener('click', () => toggleItem(state.accounts, btn.dataset.toggleAccount, 'Account')));
  }

  function renderPeopleManager() {
    els.peopleList.innerHTML = state.people.map((person) => `
      <div class="manage-item">
        <div><strong>${escapeHtml(person.name)}</strong><small>${person.active === false ? 'Disabled' : 'Active'}</small></div>
        <div class="manage-actions"><button class="mini-btn" data-toggle-person="${escapeHtml(person.id)}">${person.active === false ? 'Enable' : 'Disable'}</button></div>
      </div>
    `).join('');
    $$('[data-toggle-person]', els.peopleList).forEach((btn) => btn.addEventListener('click', () => toggleItem(state.people, btn.dataset.togglePerson, 'Person')));
  }

  function renderCategoriesManager() {
    els.categoriesList.innerHTML = state.categories.map((category) => `
      <div class="manage-item">
        <div><strong>${escapeHtml(category.name)}</strong><small>${category.active === false ? 'Disabled' : 'Active'}</small></div>
        <div class="manage-actions"><button class="mini-btn" data-toggle-category="${escapeHtml(category.id)}">${category.active === false ? 'Enable' : 'Disable'}</button></div>
      </div>
    `).join('');
    $$('[data-toggle-category]', els.categoriesList).forEach((btn) => btn.addEventListener('click', () => toggleItem(state.categories, btn.dataset.toggleCategory, 'Category')));
  }

  function renderRecurringManager() {
    if (!state.recurringExpenses.length) {
      els.recurringList.innerHTML = '<div class="empty-state">No recurring expenses yet.</div>';
      return;
    }
    els.recurringList.innerHTML = state.recurringExpenses.map((item) => `
      <div class="manage-item">
        <div><strong>${escapeHtml(item.name)}</strong><small>${money(item.amount)} · day ${item.day} · ${escapeHtml(findCategory(item.categoryId)?.name || 'Other')} · ${item.active === false ? 'Disabled' : 'Active'}</small></div>
        <div class="manage-actions"><button class="mini-btn" data-edit-recurring="${escapeHtml(item.id)}">Edit</button><button class="mini-btn" data-toggle-recurring="${escapeHtml(item.id)}">${item.active === false ? 'Enable' : 'Disable'}</button><button class="mini-btn" data-delete-recurring="${escapeHtml(item.id)}">Delete</button></div>
      </div>
    `).join('');
    $$('[data-edit-recurring]', els.recurringList).forEach((btn) => btn.addEventListener('click', () => editRecurring(btn.dataset.editRecurring)));
    $$('[data-toggle-recurring]', els.recurringList).forEach((btn) => btn.addEventListener('click', () => toggleItem(state.recurringExpenses, btn.dataset.toggleRecurring, 'Recurring expense')));
    $$('[data-delete-recurring]', els.recurringList).forEach((btn) => btn.addEventListener('click', () => deleteRecurring(btn.dataset.deleteRecurring)));
  }

  function renderDebtManager() {
    if (!state.debts.length) {
      els.debtList.innerHTML = '<div class="empty-state">No pending payments yet.</div>';
      return;
    }
    const sorted = [...state.debts].sort((a, b) => (a.status || '').localeCompare(b.status || '') || (a.dueDate || '').localeCompare(b.dueDate || ''));
    els.debtList.innerHTML = sorted.map((debt) => debtItemHtml(debt, true)).join('');
    bindDebtActions(els.debtList);
  }

  function renderDebtReports() {
    const pending = state.debts.filter((debt) => debt.status !== 'paid');
    if (!pending.length) {
      els.debtReportList.className = 'record-list empty-state';
      els.debtReportList.textContent = 'No pending payments.';
      return;
    }
    els.debtReportList.className = 'record-list';
    els.debtReportList.innerHTML = pending.map((debt) => debtItemHtml(debt, false)).join('');
    bindDebtActions(els.debtReportList);
  }

  function debtItemHtml(debt, showEdit) {
    const status = debt.status === 'paid' ? 'Paid' : 'Pending';
    return `
      <article class="record-item">
        <div class="record-head"><div><div class="record-title">${escapeHtml(debt.party)}</div><div class="muted small-text">${debt.dueDate ? `Due ${formatDate(debt.dueDate)}` : 'No due date'} · ${escapeHtml(debt.note || '')}</div></div><div class="record-amount">${money(debt.amount)}</div></div>
        <div class="record-meta"><span class="tag ${debt.type === 'receivable' ? 'good' : 'warning'}">${debt.type === 'receivable' ? 'Receivable' : 'Payable'}</span><span class="tag ${debt.status === 'paid' ? 'good' : 'danger'}">${status}</span></div>
        <div class="record-actions">${showEdit ? `<button class="mini-btn" data-edit-debt="${escapeHtml(debt.id)}">Edit</button>` : ''}<button class="mini-btn" data-paid-debt="${escapeHtml(debt.id)}">Mark paid</button><button class="mini-btn" data-delete-debt="${escapeHtml(debt.id)}">Delete</button></div>
      </article>
    `;
  }

  function bindDebtActions(root) {
    $$('[data-edit-debt]', root).forEach((btn) => btn.addEventListener('click', () => editDebt(btn.dataset.editDebt)));
    $$('[data-paid-debt]', root).forEach((btn) => btn.addEventListener('click', () => markDebtPaid(btn.dataset.paidDebt)));
    $$('[data-delete-debt]', root).forEach((btn) => btn.addEventListener('click', () => deleteDebt(btn.dataset.deleteDebt)));
  }

  function updateReportFiltersFromInputs() {
    reportFilters = {
      range: els.filterRange.value,
      from: els.filterFrom.value,
      to: els.filterTo.value,
      personId: els.filterPerson.value,
      categoryId: els.filterCategory.value,
      necessity: els.filterNecessity.value,
      search: els.reportSearch.value.trim().toLowerCase()
    };
    renderStaticInputs();
    renderReports();
  }

  function resetReportFilters() {
    reportFilters = { range: 'thisMonth', from: '', to: '', personId: 'all', categoryId: 'all', necessity: 'all', search: '' };
    renderAll();
  }

  function saveExpenseFromForm(event) {
    event.preventDefault();
    const amount = numberValue(els.expenseAmount.value);
    if (!amount || amount <= 0) return showToast('Enter a valid expense amount.');
    const id = els.expenseId.value || uid('exp');
    const data = {
      id,
      date: els.expenseDate.value || todayKey(),
      amount,
      personId: els.expensePerson.value || 'combined',
      categoryId: els.expenseCategory.value || 'other',
      accountId: els.expenseAccount.value || 'cash',
      necessity: els.expenseNecessity.value || 'necessary',
      description: els.expenseDescription.value.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const existingIndex = state.expenses.findIndex((expense) => expense.id === id);
    const duplicate = existingIndex === -1 ? findDuplicateExpense(data) : null;
    if (duplicate && !confirm('This looks like a duplicate expense. Save anyway?')) return;
    if (existingIndex >= 0) {
      data.createdAt = state.expenses[existingIndex].createdAt || data.createdAt;
      state.expenses[existingIndex] = data;
      showToast('Expense updated.');
    } else {
      state.expenses.push(data);
      showToast('Expense saved.');
    }
    clearExpenseForm(false);
    saveAndRender(true);
  }

  function findDuplicateExpense(data) {
    return state.expenses.find((expense) => expense.date === data.date && Number(expense.amount) === Number(data.amount) && expense.personId === data.personId && expense.categoryId === data.categoryId);
  }

  function editExpense(id) {
    const expense = state.expenses.find((item) => item.id === id);
    if (!expense) return;
    openTab('add');
    setAddMode('expense');
    els.expenseId.value = expense.id;
    els.expenseAmount.value = expense.amount;
    els.expenseDate.value = expense.date;
    els.expensePerson.value = expense.personId;
    els.expenseCategory.value = expense.categoryId;
    els.expenseAccount.value = expense.accountId || 'cash';
    els.expenseNecessity.value = expense.necessity || 'necessary';
    els.expenseDescription.value = expense.description || '';
    renderAddScreen();
  }

  function deleteExpense(id) {
    const index = state.expenses.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [removed] = state.expenses.splice(index, 1);
    showUndo('Expense deleted.', () => state.expenses.push(removed));
    saveAndRender(true);
  }

  function clearExpenseForm(resetDate = true) {
    els.expenseId.value = '';
    els.expenseAmount.value = '';
    if (resetDate) els.expenseDate.value = todayKey();
    els.expensePerson.value = 'combined';
    els.expenseCategory.value = state.categories[0]?.id || 'other';
    els.expenseAccount.value = state.accounts[0]?.id || 'cash';
    els.expenseNecessity.value = 'necessary';
    els.expenseDescription.value = '';
    els.duplicateWarning.hidden = true;
    renderAddScreen();
  }

  function saveIncomeFromForm(event) {
    event.preventDefault();
    const amount = numberValue(els.incomeAmount.value);
    if (!amount || amount <= 0) return showToast('Enter a valid income amount.');
    const source = els.incomeSource.value === 'custom' ? els.customIncomeSource.value.trim() : els.incomeSource.value;
    if (!source) return showToast('Enter income source.');
    const id = els.incomeId.value || uid('inc');
    const data = {
      id,
      date: els.incomeDate.value || todayKey(),
      amount,
      source,
      accountId: els.incomeAccount.value || 'cash',
      note: els.incomeNote.value.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const existingIndex = state.incomes.findIndex((income) => income.id === id);
    if (existingIndex >= 0) {
      data.createdAt = state.incomes[existingIndex].createdAt || data.createdAt;
      state.incomes[existingIndex] = data;
      showToast('Income updated.');
    } else {
      state.incomes.push(data);
      showToast('Income saved.');
    }
    clearIncomeForm(false);
    saveAndRender(true);
  }

  function clearIncomeForm(resetDate = true) {
    els.incomeId.value = '';
    els.incomeAmount.value = '';
    if (resetDate) els.incomeDate.value = todayKey();
    els.incomeSource.value = 'Father Pension';
    els.customIncomeWrap.hidden = true;
    els.customIncomeSource.value = '';
    els.incomeAccount.value = state.accounts[0]?.id || 'cash';
    els.incomeNote.value = '';
  }

  function saveBudget(event) {
    event.preventDefault();
    state.settings.budget = {
      expectedIncome: numberValue(els.budgetIncome.value),
      savingTarget: numberValue(els.savingTarget.value),
      necessaryLimit: numberValue(els.necessaryLimit.value),
      unnecessaryLimit: numberValue(els.unnecessaryLimit.value)
    };
    state.settings.warningPercent = clamp(numberValue(els.warningPercent.value) || 20, 1, 90);
    showToast('Monthly plan saved.');
    saveAndRender(true);
  }

  function saveAccount(event) {
    event.preventDefault();
    const name = els.accountName.value.trim();
    if (!name) return showToast('Enter account name.');
    const id = els.accountId.value || slugId(name, 'account');
    const data = { id, name, openingBalance: numberValue(els.accountOpening.value), active: true };
    const index = state.accounts.findIndex((account) => account.id === id);
    if (index >= 0) state.accounts[index] = { ...state.accounts[index], ...data };
    else state.accounts.push(data);
    clearAccountForm();
    showToast('Account saved.');
    saveAndRender(true);
  }

  function editAccount(id) {
    const account = findAccount(id);
    if (!account) return;
    els.accountId.value = account.id;
    els.accountName.value = account.name;
    els.accountOpening.value = account.openingBalance || '';
    els.accountName.focus();
  }

  function clearAccountForm() {
    els.accountId.value = '';
    els.accountName.value = '';
    els.accountOpening.value = '';
  }

  function addPerson(event) {
    event.preventDefault();
    const name = els.personName.value.trim();
    if (!name) return;
    state.people.push({ id: slugId(name, 'person'), name, active: true });
    els.personName.value = '';
    showToast('Person added.');
    saveAndRender(true);
  }

  function addCategory(event) {
    event.preventDefault();
    const name = els.categoryName.value.trim();
    if (!name) return;
    state.categories.push({ id: slugId(name, 'category'), name, active: true });
    els.categoryName.value = '';
    showToast('Category added.');
    saveAndRender(true);
  }

  function toggleItem(collection, id, label) {
    const item = collection.find((entry) => entry.id === id);
    if (!item) return;
    item.active = item.active === false;
    showToast(`${label} ${item.active ? 'enabled' : 'disabled'}.`);
    saveAndRender(true);
  }

  function saveRecurring(event) {
    event.preventDefault();
    const name = els.recurringName.value.trim();
    const amount = numberValue(els.recurringAmount.value);
    if (!name || !amount) return showToast('Enter recurring name and amount.');
    const id = els.recurringId.value || uid('rec');
    const data = {
      id,
      name,
      amount,
      day: clamp(Math.round(numberValue(els.recurringDay.value) || 1), 1, 31),
      personId: els.recurringPerson.value || 'combined',
      categoryId: els.recurringCategory.value || 'other',
      accountId: els.recurringAccount.value || 'cash',
      necessity: els.recurringNecessity.value || 'necessary',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const index = state.recurringExpenses.findIndex((item) => item.id === id);
    if (index >= 0) {
      data.createdAt = state.recurringExpenses[index].createdAt || data.createdAt;
      state.recurringExpenses[index] = data;
    } else state.recurringExpenses.push(data);
    clearRecurringForm();
    showToast('Recurring expense saved.');
    saveAndRender(true);
  }

  function editRecurring(id) {
    const item = state.recurringExpenses.find((entry) => entry.id === id);
    if (!item) return;
    els.recurringId.value = item.id;
    els.recurringName.value = item.name;
    els.recurringAmount.value = item.amount;
    els.recurringDay.value = item.day;
    els.recurringPerson.value = item.personId;
    els.recurringCategory.value = item.categoryId;
    els.recurringAccount.value = item.accountId || 'cash';
    els.recurringNecessity.value = item.necessity || 'necessary';
    els.recurringName.focus();
  }

  function clearRecurringForm() {
    els.recurringId.value = '';
    els.recurringName.value = '';
    els.recurringAmount.value = '';
    els.recurringDay.value = '1';
    els.recurringPerson.value = 'combined';
    els.recurringCategory.value = state.categories[0]?.id || 'other';
    els.recurringAccount.value = state.accounts[0]?.id || 'cash';
    els.recurringNecessity.value = 'necessary';
  }

  function deleteRecurring(id) {
    const index = state.recurringExpenses.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [removed] = state.recurringExpenses.splice(index, 1);
    showUndo('Recurring expense deleted.', () => state.recurringExpenses.push(removed));
    saveAndRender(true);
  }

  function addRecurringDueForMonth() {
    const month = state.settings.selectedMonth;
    const activeRecurring = state.recurringExpenses.filter((item) => item.active !== false);
    if (!activeRecurring.length) return showToast('No active recurring expenses.');
    let added = 0;
    activeRecurring.forEach((item) => {
      const day = Math.min(item.day || 1, Number(monthEnd(month).slice(-2)));
      const date = `${month}-${String(day).padStart(2, '0')}`;
      const exists = state.expenses.some((expense) => expense.recurringId === item.id && expense.date.slice(0, 7) === month);
      if (exists) return;
      state.expenses.push({
        id: uid('exp'),
        date,
        amount: Number(item.amount) || 0,
        personId: item.personId || 'combined',
        categoryId: item.categoryId || 'other',
        accountId: item.accountId || 'cash',
        necessity: item.necessity || 'necessary',
        description: item.name,
        recurringId: item.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      added += 1;
    });
    showToast(added ? `${added} recurring expense${added === 1 ? '' : 's'} added.` : 'Recurring expenses already added for this month.');
    saveAndRender(!!added);
  }

  function saveDebt(event) {
    event.preventDefault();
    const amount = numberValue(els.debtAmount.value);
    const party = els.debtParty.value.trim();
    if (!amount || !party) return showToast('Enter party and amount.');
    const id = els.debtId.value || uid('debt');
    const data = {
      id,
      type: els.debtType.value || 'receivable',
      party,
      amount,
      dueDate: els.debtDueDate.value || '',
      note: els.debtNote.value.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paidAt: ''
    };
    const index = state.debts.findIndex((debt) => debt.id === id);
    if (index >= 0) {
      data.status = state.debts[index].status || 'pending';
      data.paidAt = state.debts[index].paidAt || '';
      data.createdAt = state.debts[index].createdAt || data.createdAt;
      state.debts[index] = data;
    } else state.debts.push(data);
    clearDebtForm();
    showToast('Pending payment saved.');
    saveAndRender(true);
  }

  function editDebt(id) {
    const debt = state.debts.find((item) => item.id === id);
    if (!debt) return;
    els.debtId.value = debt.id;
    els.debtType.value = debt.type;
    els.debtParty.value = debt.party;
    els.debtAmount.value = debt.amount;
    els.debtDueDate.value = debt.dueDate || '';
    els.debtNote.value = debt.note || '';
    els.debtParty.focus();
  }

  function markDebtPaid(id) {
    const debt = state.debts.find((item) => item.id === id);
    if (!debt) return;
    debt.status = 'paid';
    debt.paidAt = new Date().toISOString();
    debt.updatedAt = new Date().toISOString();
    showToast('Marked as paid.');
    saveAndRender(true);
  }

  function deleteDebt(id) {
    const index = state.debts.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [removed] = state.debts.splice(index, 1);
    showUndo('Payment deleted.', () => state.debts.push(removed));
    saveAndRender(true);
  }

  function clearDebtForm() {
    els.debtId.value = '';
    els.debtType.value = 'receivable';
    els.debtParty.value = '';
    els.debtAmount.value = '';
    els.debtDueDate.value = '';
    els.debtNote.value = '';
  }

  function savePin() {
    const value = els.newPin.value.trim();
    if (!value) return removePin();
    if (value.length < 4) return showToast('PIN should be at least 4 digits.');
    state.settings.pinHash = hashPin(value);
    els.newPin.value = '';
    showToast('PIN saved.');
    saveAndRender(true);
  }

  function removePin() {
    state.settings.pinHash = '';
    els.newPin.value = '';
    els.pinInput.value = '';
    els.lockScreen.hidden = true;
    showToast('PIN removed.');
    saveAndRender(true);
  }

  function checkPinLock() {
    if (state.settings.pinHash && sessionStorage.getItem('familyExpenseUnlocked') !== 'true') {
      els.lockScreen.hidden = false;
      setTimeout(() => els.pinInput.focus(), 100);
    }
  }

  function unlockWithPin() {
    if (hashPin(els.pinInput.value.trim()) === state.settings.pinHash) {
      sessionStorage.setItem('familyExpenseUnlocked', 'true');
      els.lockScreen.hidden = true;
      els.pinInput.value = '';
      els.pinError.textContent = '';
    } else {
      els.pinError.textContent = 'Wrong PIN.';
    }
  }

  function lockNow() {
    if (!state.settings.pinHash) return showToast('Set a PIN first.');
    sessionStorage.removeItem('familyExpenseUnlocked');
    els.lockScreen.hidden = false;
    els.pinInput.value = '';
    els.pinInput.focus();
  }

  function getFilteredExpenses() {
    const range = getReportDateRange();
    return state.expenses.filter((expense) => {
      if (!dateInRange(expense.date, range.from, range.to)) return false;
      if (reportFilters.personId !== 'all' && expense.personId !== reportFilters.personId) return false;
      if (reportFilters.categoryId !== 'all' && expense.categoryId !== reportFilters.categoryId) return false;
      if (reportFilters.necessity !== 'all' && expense.necessity !== reportFilters.necessity) return false;
      if (reportFilters.search) {
        const haystack = [expense.description, findPerson(expense.personId)?.name, findCategory(expense.categoryId)?.name, findAccount(expense.accountId)?.name, expense.necessity].join(' ').toLowerCase();
        if (!haystack.includes(reportFilters.search)) return false;
      }
      return true;
    });
  }

  function getReportDateRange() {
    const today = new Date();
    if (reportFilters.range === 'today') return { from: todayKey(), to: todayKey() };
    if (reportFilters.range === 'yesterday') {
      const y = addDays(today, -1);
      return { from: dateKey(y), to: dateKey(y) };
    }
    if (reportFilters.range === 'thisWeek') {
      const start = addDays(today, -((today.getDay() + 6) % 7));
      const end = addDays(start, 6);
      return { from: dateKey(start), to: dateKey(end) };
    }
    if (reportFilters.range === 'custom') {
      return {
        from: reportFilters.from || monthStart(state.settings.selectedMonth),
        to: reportFilters.to || monthEnd(state.settings.selectedMonth)
      };
    }
    return getMonthRange(state.settings.selectedMonth);
  }

  function saveAndRender(shouldSync = true) {
    normalizeState();
    state.meta.updatedAt = new Date().toISOString();
    if (shouldSync) {
      state.meta.syncPending = true;
      state.meta.syncMessage = navigator.onLine ? 'Saved locally. Backup pending...' : 'Saved locally. Offline backup pending.';
    }
    persist();
    renderAll();
    if (shouldSync) scheduleSync();
  }

  function scheduleSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => pushToSheet(false), SYNC_DEBOUNCE_MS);
  }

  async function pushToSheet(manual = false) {
    const url = (state.settings.syncUrl || '').trim();
    if (!url) {
      if (manual) showToast('Add Google Apps Script URL first.');
      state.meta.syncMessage = 'Local storage ready. Add sync URL for Google Sheet backup.';
      state.meta.syncPending = true;
      persist();
      renderSyncStatus();
      return;
    }
    if (!navigator.onLine) {
      state.meta.syncMessage = 'Offline. Data saved locally and will sync later.';
      state.meta.syncPending = true;
      persist();
      renderSyncStatus();
      return;
    }
    const payload = { action: 'backup', app: 'family-expense-tracker-v2', savedAt: new Date().toISOString(), data: exportStateObject() };
    try {
      state.meta.syncMessage = 'Sending backup to Google Sheet...';
      renderSyncStatus();
      await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      state.meta.lastSyncAt = new Date().toISOString();
      state.meta.syncPending = false;
      state.meta.syncMessage = `Backup sent: ${formatDateTime(state.meta.lastSyncAt)}.`;
      persist();
      renderSyncStatus();
      if (manual) showToast('Backup sent to Google Sheet.');
    } catch (error) {
      console.error(error);
      state.meta.syncPending = true;
      state.meta.syncMessage = 'Could not sync. Local data is still saved.';
      persist();
      renderSyncStatus();
      if (manual) showToast('Sync failed. Local data is safe.');
    }
  }

  function importFromSheet() {
    const url = (state.settings.syncUrl || '').trim();
    if (!url) return showToast('Add Google Apps Script URL first.');
    if (!navigator.onLine) return showToast('Internet is required to import from Google Sheet.');
    if (!confirm('Import latest data from Google Sheet? Current local data will be replaced after automatic backup export.')) return;
    autoDownloadBackupBeforeReplace();
    const callbackName = `sheetImport_${Date.now()}`;
    const script = document.createElement('script');
    window[callbackName] = (response) => {
      try {
        if (!response || response.ok === false) throw new Error(response?.error || 'Import failed.');
        const imported = mergeState(response.data || {});
        const currentUrl = state.settings.syncUrl;
        state = imported;
        state.settings.syncUrl = state.settings.syncUrl || currentUrl;
        state.meta.syncMessage = 'Imported from Google Sheet.';
        state.meta.syncPending = false;
        state.meta.updatedAt = new Date().toISOString();
        persist();
        renderAll();
        showToast('Imported from Google Sheet.');
      } catch (error) {
        console.error(error);
        showToast('Import failed. Check Apps Script setup.');
      } finally {
        delete window[callbackName];
        script.remove();
      }
    };
    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      showToast('Import failed. Check URL/deployment.');
    };
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}action=latest&callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;
    document.body.appendChild(script);
  }

  function renderSyncStatus() {
    const synced = !!state.meta.lastSyncAt && !state.meta.syncPending;
    els.syncDot.classList.toggle('synced', synced && navigator.onLine);
    els.syncText.textContent = !navigator.onLine ? 'Offline' : synced ? 'Synced' : state.settings.syncUrl ? 'Pending' : 'Local';
    els.syncStatus.textContent = state.meta.syncMessage || 'Local storage ready.';
  }

  function exportStateObject() {
    normalizeState();
    return {
      version: state.version,
      settings: state.settings,
      people: state.people,
      categories: state.categories,
      accounts: state.accounts,
      expenses: state.expenses,
      incomes: state.incomes,
      debts: state.debts,
      recurringExpenses: state.recurringExpenses,
      meta: state.meta,
      exportedAt: new Date().toISOString()
    };
  }

  function exportJson() {
    downloadFile(`family-expense-backup-${todayKey()}.json`, JSON.stringify(exportStateObject(), null, 2), 'application/json');
    showToast('JSON backup exported.');
  }

  function exportCsv() {
    const rows = [];
    state.incomes.forEach((income) => rows.push({ type: 'income', date: income.date, amount: income.amount, person: '', category: '', account: findAccount(income.accountId)?.name || '', necessity: '', description: '', source: income.source || '', note: income.note || '', status: '' }));
    state.expenses.forEach((expense) => rows.push({ type: 'expense', date: expense.date, amount: expense.amount, person: findPerson(expense.personId)?.name || '', category: findCategory(expense.categoryId)?.name || '', account: findAccount(expense.accountId)?.name || '', necessity: expense.necessity || '', description: expense.description || '', source: '', note: '', status: '' }));
    state.debts.forEach((debt) => rows.push({ type: debt.type, date: debt.dueDate || '', amount: debt.amount, person: debt.party, category: 'Pending payment', account: '', necessity: '', description: debt.note || '', source: '', note: '', status: debt.status || 'pending' }));
    const headers = ['type', 'date', 'amount', 'person', 'category', 'account', 'necessity', 'description', 'source', 'note', 'status'];
    const csv = [headers.join(','), ...rows.sort((a, b) => String(b.date).localeCompare(String(a.date))).map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\n');
    downloadFile(`family-expense-records-${todayKey()}.csv`, csv, 'text/csv');
    showToast('CSV exported.');
  }

  function exportMonthlyReport() {
    const month = state.settings.selectedMonth;
    const expenses = getMonthExpenses(month);
    const incomes = getMonthIncomes(month);
    const totalIncome = sum(incomes, 'amount');
    const totalExpense = sum(expenses, 'amount');
    const necessary = sum(expenses.filter((expense) => expense.necessity === 'necessary'), 'amount');
    const unnecessary = sum(expenses.filter((expense) => expense.necessity === 'unnecessary'), 'amount');
    const personLines = groupExpensesBy(expenses, (expense) => findPerson(expense.personId)?.name || 'Unknown').map((item) => `- ${item.name}: ${money(item.amount)} (${item.count} entries)`).join('\n') || '- No expenses';
    const categoryLines = groupExpensesBy(expenses, (expense) => findCategory(expense.categoryId)?.name || 'Other').map((item) => `- ${item.name}: ${money(item.amount)} (${item.count} entries)`).join('\n') || '- No expenses';
    const report = [
      `${formatMonthLabel(month)} Family Budget Report`,
      '',
      `Total income: ${money(totalIncome)}`,
      `Total expense: ${money(totalExpense)}`,
      `Remaining balance: ${money(totalIncome - totalExpense)}`,
      `Necessary expense: ${money(necessary)}`,
      `Unnecessary expense: ${money(unnecessary)}`,
      '',
      'Person-wise spending:',
      personLines,
      '',
      'Category-wise spending:',
      categoryLines,
      '',
      `Exported at: ${formatDateTime(new Date().toISOString())}`
    ].join('\n');
    downloadFile(`family-expense-monthly-report-${month}.txt`, report, 'text/plain');
    showToast('Monthly report exported.');
  }

  function importJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!imported || !Array.isArray(imported.expenses) || !Array.isArray(imported.incomes)) throw new Error('Invalid backup.');
        if (!confirm('Import this backup? Current local data will be replaced after automatic backup export.')) return;
        autoDownloadBackupBeforeReplace();
        const currentSyncUrl = state.settings.syncUrl;
        state = mergeState(imported);
        state.settings.syncUrl = state.settings.syncUrl || currentSyncUrl;
        state.meta.syncPending = true;
        state.meta.syncMessage = 'Backup imported locally.';
        persist();
        renderAll();
        scheduleSync();
        showToast('Backup imported.');
      } catch (error) {
        console.error(error);
        showToast('Could not import this backup file.');
      } finally {
        els.importFile.value = '';
      }
    };
    reader.readAsText(file);
  }

  function resetLocalData() {
    if (!confirm('Export backup before resetting. Continue?')) return;
    exportJson();
    if (!confirm('Final confirmation: delete local data from this browser?')) return;
    const syncUrl = state.settings.syncUrl;
    state = initialState();
    state.settings.syncUrl = syncUrl;
    persist();
    renderAll();
    showToast('Local data reset.');
  }

  function autoDownloadBackupBeforeReplace() {
    downloadFile(`auto-backup-before-replace-${Date.now()}.json`, JSON.stringify(exportStateObject(), null, 2), 'application/json');
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 3200);
  }

  function showUndo(message, undoFn) {
    clearTimeout(undoTimer);
    pendingUndo = undoFn;
    els.undoText.textContent = message;
    els.undoBar.hidden = false;
    undoTimer = setTimeout(() => {
      pendingUndo = null;
      els.undoBar.hidden = true;
    }, 10000);
  }

  function restoreUndo() {
    if (!pendingUndo) return;
    pendingUndo();
    pendingUndo = null;
    els.undoBar.hidden = true;
    showToast('Restored.');
    saveAndRender(true);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
      if (!raw) return initialState();
      return mergeState(JSON.parse(raw));
    } catch (error) {
      console.error(error);
      return initialState();
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportStateObject()));
  }

  function mergeState(imported) {
    const base = initialState();
    const merged = {
      ...base,
      ...imported,
      version: 2,
      settings: {
        ...base.settings,
        ...(imported.settings || {}),
        budget: {
          ...base.settings.budget,
          ...((imported.settings && imported.settings.budget) || {})
        }
      },
      people: mergeById(base.people, imported.people || []),
      categories: mergeById(base.categories, imported.categories || []),
      accounts: mergeById(base.accounts, imported.accounts || []),
      expenses: imported.expenses || [],
      incomes: imported.incomes || [],
      debts: imported.debts || [],
      recurringExpenses: imported.recurringExpenses || [],
      meta: { ...base.meta, ...(imported.meta || {}) }
    };
    return merged;
  }

  function mergeById(defaults, items) {
    const map = new Map(defaults.map((item) => [item.id, { ...item }]));
    items.forEach((item) => { if (item && item.id) map.set(item.id, { ...map.get(item.id), ...item }); });
    return Array.from(map.values());
  }

  function normalizeState() {
    state.settings = state.settings || initialState().settings;
    state.settings.selectedMonth = state.settings.selectedMonth || monthKey(new Date());
    state.settings.budget = { ...initialState().settings.budget, ...(state.settings.budget || {}) };
    state.people = state.people || [];
    state.categories = state.categories || [];
    state.accounts = state.accounts || [];
    state.expenses = (state.expenses || []).map((expense) => ({
      id: expense.id || uid('exp'),
      date: expense.date || todayKey(),
      amount: Number(expense.amount) || 0,
      personId: expense.personId || 'combined',
      categoryId: expense.categoryId || 'other',
      accountId: expense.accountId || 'cash',
      necessity: expense.necessity || 'necessary',
      description: expense.description || '',
      recurringId: expense.recurringId || '',
      createdAt: expense.createdAt || new Date().toISOString(),
      updatedAt: expense.updatedAt || expense.createdAt || new Date().toISOString()
    }));
    state.incomes = (state.incomes || []).map((income) => ({
      id: income.id || uid('inc'),
      date: income.date || todayKey(),
      amount: Number(income.amount) || 0,
      source: income.source || 'Other Income',
      accountId: income.accountId || 'cash',
      note: income.note || '',
      createdAt: income.createdAt || new Date().toISOString(),
      updatedAt: income.updatedAt || income.createdAt || new Date().toISOString()
    }));
    state.accounts = state.accounts.map((account) => ({ ...account, openingBalance: Number(account.openingBalance) || 0, active: account.active !== false }));
    state.debts = (state.debts || []).map((debt) => ({
      id: debt.id || uid('debt'),
      type: debt.type === 'payable' ? 'payable' : 'receivable',
      party: debt.party || '',
      amount: Number(debt.amount) || 0,
      dueDate: debt.dueDate || '',
      note: debt.note || '',
      status: debt.status === 'paid' ? 'paid' : 'pending',
      paidAt: debt.paidAt || '',
      createdAt: debt.createdAt || new Date().toISOString(),
      updatedAt: debt.updatedAt || debt.createdAt || new Date().toISOString()
    }));
    state.recurringExpenses = (state.recurringExpenses || []).map((item) => ({
      id: item.id || uid('rec'),
      name: item.name || '',
      amount: Number(item.amount) || 0,
      day: clamp(Number(item.day) || 1, 1, 31),
      personId: item.personId || 'combined',
      categoryId: item.categoryId || 'other',
      accountId: item.accountId || 'cash',
      necessity: item.necessity || 'necessary',
      active: item.active !== false,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
    }));
  }

  function seedDefaultsIfEmpty() {
    state.people = mergeById(defaultPeople, state.people);
    state.categories = mergeById(defaultCategories, state.categories);
    state.accounts = mergeById(defaultAccounts, state.accounts);
  }

  function setDefaultFormDates() {
    els.expenseDate.value = todayKey();
    els.incomeDate.value = todayKey();
  }

  function getBudget() { return state.settings.budget || {}; }
  function getActivePeople() { return state.people.filter((item) => item.active !== false); }
  function getActiveCategories() { return state.categories.filter((item) => item.active !== false); }
  function getActiveAccounts() { return state.accounts.filter((item) => item.active !== false); }
  function findPerson(id) { return state.people.find((item) => item.id === id); }
  function findCategory(id) { return state.categories.find((item) => item.id === id); }
  function findAccount(id) { return state.accounts.find((item) => item.id === id); }
  function getMonthExpenses(month) { return state.expenses.filter((expense) => isMonthDate(expense.date, month)); }
  function getMonthIncomes(month) { return state.incomes.filter((income) => isMonthDate(income.date, month)); }

  function accountBalances() {
    const balances = accountBalancesMap();
    return state.accounts.map((account) => ({ id: account.id, name: account.name, balance: balances[account.id] || 0, active: account.active !== false }));
  }

  function accountBalancesMap() {
    const balances = {};
    state.accounts.forEach((account) => { balances[account.id] = Number(account.openingBalance) || 0; });
    state.incomes.forEach((income) => { balances[income.accountId || 'cash'] = (balances[income.accountId || 'cash'] || 0) + (Number(income.amount) || 0); });
    state.expenses.forEach((expense) => { balances[expense.accountId || 'cash'] = (balances[expense.accountId || 'cash'] || 0) - (Number(expense.amount) || 0); });
    return balances;
  }

  function getMonthRange(month) { return { from: monthStart(month), to: monthEnd(month) }; }
  function monthStart(month) { return `${month}-01`; }
  function monthEnd(month) { const [y, m] = month.split('-').map(Number); return `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`; }
  function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
  function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function todayKey() { return dateKey(new Date()); }
  function addDays(date, days) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
  function isMonthDate(date, month) { return String(date || '').slice(0, 7) === month; }
  function dateInRange(date, from, to) { return String(date) >= String(from) && String(date) <= String(to); }
  function daysBetween(from, to) { return Math.round((parseDate(to) - parseDate(from)) / 86400000); }
  function parseDate(value) { const [year, month, day] = String(value).split('-').map(Number); return new Date(year, month - 1, day || 1); }

  function calculateSafeDailySpend(plannedIncome, spent, savingTarget, month) {
    const available = Math.max(0, (Number(plannedIncome) || 0) - (Number(spent) || 0) - (Number(savingTarget) || 0));
    if (!available) return 0;
    const today = new Date();
    const selectedCurrent = month === monthKey(today);
    const [year, monthNumber] = month.split('-').map(Number);
    const totalDays = new Date(year, monthNumber, 0).getDate();
    const day = selectedCurrent ? today.getDate() : 1;
    const remainingDays = Math.max(1, totalDays - day + 1);
    return available / remainingDays;
  }

  function dailyExpenseSeries(expenses, from, to) {
    const days = daysBetween(from, to) + 1;
    const allDays = [];
    for (let index = 0; index < Math.min(days, 62); index += 1) {
      const date = dateKey(addDays(parseDate(from), index));
      allDays.push({ date, label: formatDate(date), shortLabel: String(Number(date.slice(-2))), amount: 0 });
    }
    const map = new Map(allDays.map((item) => [item.date, item]));
    expenses.forEach((expense) => { if (map.has(expense.date)) map.get(expense.date).amount += Number(expense.amount) || 0; });
    return allDays;
  }

  function groupExpensesBy(expenses, labelFn, idFn = labelFn) {
    const map = new Map();
    expenses.forEach((expense) => {
      const id = idFn(expense);
      const name = labelFn(expense);
      const entry = map.get(id) || { id, name, amount: 0, count: 0, items: [] };
      entry.amount += Number(expense.amount) || 0;
      entry.count += 1;
      entry.items.push(expense);
      map.set(id, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }

  function groupIncomesBySource(incomes) {
    const map = new Map();
    incomes.forEach((income) => {
      const name = income.source || 'Other Income';
      const entry = map.get(name) || { id: name, name, amount: 0, count: 0 };
      entry.amount += Number(income.amount) || 0;
      entry.count += 1;
      map.set(name, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }

  function topByGroup(items, labelFn) { return groupExpensesBy(items, labelFn)[0] || null; }
  function groupBy(items, keyFn) { return items.reduce((acc, item) => { const key = keyFn(item); (acc[key] ||= []).push(item); return acc; }, {}); }
  function sum(items, key) { return items.reduce((total, item) => total + (Number(item[key]) || 0), 0); }
  function unique(items) { return Array.from(new Set(items.filter(Boolean))); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
  function numberValue(value) { return Number(String(value || '').replace(/,/g, '')) || 0; }
  function uid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
  function slugId(name, prefix) { return `${prefix}_${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}_${Math.random().toString(36).slice(2, 5)}`; }

  function fillOptions(select, options) {
    const current = select.value;
    select.innerHTML = options.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
    if (options.some(([value]) => value === current)) select.value = current;
  }

  function money(value) {
    const amount = Number(value) || 0;
    try {
      return new Intl.NumberFormat('en-PK', { style: 'currency', currency: state.settings.currency || 'PKR', maximumFractionDigits: 0 }).format(amount).replace('PKR', 'Rs');
    } catch (error) {
      return `Rs ${Math.round(amount).toLocaleString()}`;
    }
  }

  function formatMonthLabel(month) {
    const [year, monthNumber] = month.split('-').map(Number);
    return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function formatDate(value) {
    if (!value) return '';
    return parseDate(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function shortName(name) {
    return String(name).replace('Combined / General', 'Combined').split(' ').slice(-1)[0] || name;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function csvCell(value) {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function hashPin(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    return `pin_${Math.abs(hash)}`;
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(console.warn));
    }
  }
})();
