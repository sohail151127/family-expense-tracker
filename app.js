(() => {
  'use strict';

  const STORAGE_KEY = 'family-expense-tracker-v1';
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
    { id: 'other', name: 'Other', active: true }
  ];

  const initialState = () => ({
    version: 1,
    settings: {
      currency: 'PKR',
      selectedMonth: monthKey(new Date()),
      syncUrl: '',
      warningPercent: 20
    },
    people: clone(defaultPeople),
    categories: clone(defaultCategories),
    expenses: [],
    incomes: [],
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncAt: '',
      syncPending: false,
      syncMessage: 'Local storage ready.'
    }
  });

  let state = loadState();
  let filters = {
    range: 'thisMonth',
    from: '',
    to: '',
    personId: 'all',
    categoryId: 'all',
    necessity: 'all'
  };
  let deferredInstallPrompt = null;
  let syncTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    installBtn: $('#installBtn'),
    monthPicker: $('#monthPicker'),
    prevMonthBtn: $('#prevMonthBtn'),
    nextMonthBtn: $('#nextMonthBtn'),
    totalIncomeText: $('#totalIncomeText'),
    totalExpenseText: $('#totalExpenseText'),
    remainingText: $('#remainingText'),
    progressBar: $('#progressBar'),
    balanceHint: $('#balanceHint'),
    necessaryText: $('#necessaryText'),
    unnecessaryText: $('#unnecessaryText'),
    transactionCountText: $('#transactionCountText'),
    dailyAverageText: $('#dailyAverageText'),
    filteredTotalText: $('#filteredTotalText'),
    expenseList: $('#expenseList'),
    incomeList: $('#incomeList'),
    calendarGrid: $('#calendarGrid'),
    calendarMonthText: $('#calendarMonthText'),
    dayDetailsCard: $('#dayDetailsCard'),
    dayDetailsTitle: $('#dayDetailsTitle'),
    dayDetailsList: $('#dayDetailsList'),
    closeDayDetailsBtn: $('#closeDayDetailsBtn'),
    customRangeBox: $('#customRangeBox'),
    filterFrom: $('#filterFrom'),
    filterTo: $('#filterTo'),
    filterPerson: $('#filterPerson'),
    filterCategory: $('#filterCategory'),
    filterNecessity: $('#filterNecessity'),
    resetFiltersBtn: $('#resetFiltersBtn'),
    expensePanel: $('#expensePanel'),
    incomePanel: $('#incomePanel'),
    expenseForm: $('#expenseForm'),
    expenseId: $('#expenseId'),
    expenseAmount: $('#expenseAmount'),
    expenseDate: $('#expenseDate'),
    expensePerson: $('#expensePerson'),
    expenseCategory: $('#expenseCategory'),
    expenseDescription: $('#expenseDescription'),
    clearExpenseBtn: $('#clearExpenseBtn'),
    incomeForm: $('#incomeForm'),
    incomeId: $('#incomeId'),
    incomeAmount: $('#incomeAmount'),
    incomeDate: $('#incomeDate'),
    incomeSourceSelect: $('#incomeSourceSelect'),
    customIncomeSourceWrap: $('#customIncomeSourceWrap'),
    incomeSourceCustom: $('#incomeSourceCustom'),
    incomeNote: $('#incomeNote'),
    clearIncomeBtn: $('#clearIncomeBtn'),
    personForm: $('#personForm'),
    personName: $('#personName'),
    peopleList: $('#peopleList'),
    categoryForm: $('#categoryForm'),
    categoryName: $('#categoryName'),
    categoryList: $('#categoryList'),
    syncUrl: $('#syncUrl'),
    saveSyncUrlBtn: $('#saveSyncUrlBtn'),
    syncNowBtn: $('#syncNowBtn'),
    importSheetBtn: $('#importSheetBtn'),
    syncStatusText: $('#syncStatusText'),
    syncDot: $('#syncDot'),
    exportJsonBtn: $('#exportJsonBtn'),
    exportCsvBtn: $('#exportCsvBtn'),
    importFile: $('#importFile'),
    resetDataBtn: $('#resetDataBtn'),
    toast: $('#toast')
  };

  init();

  function init() {
    const today = todayKey();
    els.monthPicker.value = state.settings.selectedMonth || monthKey(new Date());
    els.expenseDate.value = today;
    els.incomeDate.value = today;
    els.syncUrl.value = state.settings.syncUrl || '';
    filters.from = startOfMonthKey(state.settings.selectedMonth);
    filters.to = endOfMonthKey(state.settings.selectedMonth);

    bindEvents();
    renderAll();
    registerServiceWorker();
  }

  function bindEvents() {
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

    els.monthPicker.addEventListener('change', () => {
      if (!els.monthPicker.value) return;
      state.settings.selectedMonth = els.monthPicker.value;
      filters.range = 'thisMonth';
      filters.from = startOfMonthKey(state.settings.selectedMonth);
      filters.to = endOfMonthKey(state.settings.selectedMonth);
      activateRangeButton('thisMonth');
      saveAndRender(false);
    });

    els.prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    els.nextMonthBtn.addEventListener('click', () => changeMonth(1));

    $$('[data-open-panel]').forEach((button) => {
      button.addEventListener('click', () => openPanel(button.dataset.openPanel));
    });

    $$('[data-close-panel]').forEach((button) => {
      button.addEventListener('click', closePanels);
    });

    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => setTab(tab.dataset.tab));
    });

    $$('.pill').forEach((button) => {
      button.addEventListener('click', () => {
        filters.range = button.dataset.range;
        activateRangeButton(filters.range);
        updateRangeFromQuickFilter();
        renderDashboard();
      });
    });

    ['change', 'input'].forEach((eventName) => {
      els.filterFrom.addEventListener(eventName, () => {
        filters.from = els.filterFrom.value;
        renderDashboard();
      });
      els.filterTo.addEventListener(eventName, () => {
        filters.to = els.filterTo.value;
        renderDashboard();
      });
    });

    els.filterPerson.addEventListener('change', () => {
      filters.personId = els.filterPerson.value;
      renderDashboard();
    });

    els.filterCategory.addEventListener('change', () => {
      filters.categoryId = els.filterCategory.value;
      renderDashboard();
    });

    els.filterNecessity.addEventListener('change', () => {
      filters.necessity = els.filterNecessity.value;
      renderDashboard();
    });

    els.resetFiltersBtn.addEventListener('click', () => {
      filters = {
        range: 'thisMonth',
        from: startOfMonthKey(state.settings.selectedMonth),
        to: endOfMonthKey(state.settings.selectedMonth),
        personId: 'all',
        categoryId: 'all',
        necessity: 'all'
      };
      activateRangeButton('thisMonth');
      renderAll();
    });

    els.expenseForm.addEventListener('submit', saveExpenseFromForm);
    els.clearExpenseBtn.addEventListener('click', clearExpenseForm);
    els.incomeForm.addEventListener('submit', saveIncomeFromForm);
    els.clearIncomeBtn.addEventListener('click', clearIncomeForm);

    els.incomeSourceSelect.addEventListener('change', () => {
      els.customIncomeSourceWrap.hidden = els.incomeSourceSelect.value !== 'Other';
      if (els.incomeSourceSelect.value === 'Other') els.incomeSourceCustom.focus();
    });

    els.personForm.addEventListener('submit', addPerson);
    els.categoryForm.addEventListener('submit', addCategory);
    els.closeDayDetailsBtn.addEventListener('click', () => {
      els.dayDetailsCard.hidden = true;
    });

    els.saveSyncUrlBtn.addEventListener('click', () => {
      state.settings.syncUrl = els.syncUrl.value.trim();
      state.meta.syncMessage = state.settings.syncUrl ? 'Sync URL saved.' : 'Sync URL removed.';
      saveAndRender(false);
      showToast(state.meta.syncMessage);
    });

    els.syncNowBtn.addEventListener('click', () => pushToSheet(true));
    els.importSheetBtn.addEventListener('click', importFromSheet);
    els.exportJsonBtn.addEventListener('click', exportJson);
    els.exportCsvBtn.addEventListener('click', exportCsv);
    els.importFile.addEventListener('change', importJsonFile);
    els.resetDataBtn.addEventListener('click', resetLocalData);

    window.addEventListener('online', () => {
      state.meta.syncMessage = 'Back online. Sending backup...';
      pushToSheet(false);
      renderSyncStatus();
    });

    window.addEventListener('offline', () => {
      state.meta.syncMessage = 'Offline. Changes are saved on this phone.';
      state.meta.syncPending = true;
      persist();
      renderSyncStatus();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePanels();
    });
  }

  function setTab(tabName) {
    $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.tab === tabName));
    $$('.tab-panel').forEach((panel) => panel.classList.remove('is-active'));
    $(`#${tabName}Panel`).classList.add('is-active');
    if (tabName === 'calendar') renderCalendar();
  }

  function changeMonth(step) {
    const [year, month] = state.settings.selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + step, 1);
    state.settings.selectedMonth = monthKey(date);
    els.monthPicker.value = state.settings.selectedMonth;
    filters.range = 'thisMonth';
    filters.from = startOfMonthKey(state.settings.selectedMonth);
    filters.to = endOfMonthKey(state.settings.selectedMonth);
    activateRangeButton('thisMonth');
    saveAndRender(false);
  }

  function openPanel(panelId) {
    if (panelId === 'expensePanel' && !els.expenseId.value) {
      els.expenseDate.value = todayKey();
      els.expensePerson.value = getActivePeople()[0]?.id || 'combined';
      els.expenseCategory.value = getActiveCategories()[0]?.id || 'other';
      setNecessity('necessary');
    }

    if (panelId === 'incomePanel' && !els.incomeId.value) {
      els.incomeDate.value = todayKey();
    }

    const panel = document.getElementById(panelId);
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const firstInput = panel.querySelector('input:not([type="hidden"]), select, textarea');
      firstInput?.focus({ preventScroll: true });
    }, 80);
  }

  function closePanels() {
    $$('.drawer').forEach((drawer) => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  function clearExpenseForm() {
    els.expenseId.value = '';
    els.expenseAmount.value = '';
    els.expenseDate.value = todayKey();
    els.expensePerson.value = getActivePeople()[0]?.id || 'combined';
    els.expenseCategory.value = getActiveCategories()[0]?.id || 'other';
    els.expenseDescription.value = '';
    setNecessity('necessary');
  }

  function clearIncomeForm() {
    els.incomeId.value = '';
    els.incomeAmount.value = '';
    els.incomeDate.value = todayKey();
    els.incomeSourceSelect.value = 'Father Pension';
    els.customIncomeSourceWrap.hidden = true;
    els.incomeSourceCustom.value = '';
    els.incomeNote.value = '';
  }

  function saveExpenseFromForm(event) {
    event.preventDefault();
    const amount = parseAmount(els.expenseAmount.value);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount. Example: 1500');
      els.expenseAmount.focus();
      return;
    }

    const id = els.expenseId.value || uid('expense');
    const existingIndex = state.expenses.findIndex((expense) => expense.id === id);
    const expense = {
      id,
      amount,
      date: els.expenseDate.value || todayKey(),
      personId: els.expensePerson.value,
      categoryId: els.expenseCategory.value,
      necessity: getSelectedNecessity(),
      description: cleanText(els.expenseDescription.value),
      createdAt: existingIndex >= 0 ? state.expenses[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) state.expenses[existingIndex] = expense;
    else state.expenses.unshift(expense);

    clearExpenseForm();
    closePanels();
    saveAndRender(true);
    showToast(existingIndex >= 0 ? 'Expense updated.' : 'Expense saved.');
  }

  function saveIncomeFromForm(event) {
    event.preventDefault();
    const amount = parseAmount(els.incomeAmount.value);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid income amount. Example: 50000');
      els.incomeAmount.focus();
      return;
    }

    const source = els.incomeSourceSelect.value === 'Other'
      ? cleanText(els.incomeSourceCustom.value)
      : els.incomeSourceSelect.value;

    if (!source) {
      showToast('Please enter income source.');
      els.incomeSourceCustom.focus();
      return;
    }

    const id = els.incomeId.value || uid('income');
    const existingIndex = state.incomes.findIndex((income) => income.id === id);
    const income = {
      id,
      amount,
      date: els.incomeDate.value || todayKey(),
      source,
      note: cleanText(els.incomeNote.value),
      createdAt: existingIndex >= 0 ? state.incomes[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) state.incomes[existingIndex] = income;
    else state.incomes.unshift(income);

    clearIncomeForm();
    closePanels();
    saveAndRender(true);
    showToast(existingIndex >= 0 ? 'Income updated.' : 'Income saved.');
  }

  function addPerson(event) {
    event.preventDefault();
    const name = cleanText(els.personName.value);
    if (!name) return;
    if (state.people.some((person) => person.name.toLowerCase() === name.toLowerCase() && person.active)) {
      showToast('This person already exists.');
      return;
    }
    state.people.push({ id: uid(slugify(name) || 'person'), name, active: true });
    els.personName.value = '';
    saveAndRender(true);
    showToast('Person added.');
  }

  function addCategory(event) {
    event.preventDefault();
    const name = cleanText(els.categoryName.value);
    if (!name) return;
    if (state.categories.some((category) => category.name.toLowerCase() === name.toLowerCase() && category.active)) {
      showToast('This category already exists.');
      return;
    }
    state.categories.push({ id: uid(slugify(name) || 'category'), name, active: true });
    els.categoryName.value = '';
    saveAndRender(true);
    showToast('Category added.');
  }

  function removePerson(id) {
    const person = findPerson(id);
    if (!person || person.id === 'combined') {
      showToast('Combined / General cannot be removed.');
      return;
    }
    const used = state.expenses.some((expense) => expense.personId === id);
    const message = used
      ? `Hide ${person.name}? Old expenses will keep this name.`
      : `Remove ${person.name}?`;
    if (!confirm(message)) return;
    person.active = false;
    saveAndRender(true);
    showToast('Person hidden.');
  }

  function removeCategory(id) {
    const category = findCategory(id);
    if (!category || category.id === 'other') {
      showToast('Other category cannot be removed.');
      return;
    }
    const used = state.expenses.some((expense) => expense.categoryId === id);
    const message = used
      ? `Hide ${category.name}? Old expenses will keep this category.`
      : `Remove ${category.name}?`;
    if (!confirm(message)) return;
    category.active = false;
    saveAndRender(true);
    showToast('Category hidden.');
  }

  function editExpense(id) {
    const expense = state.expenses.find((item) => item.id === id);
    if (!expense) return;
    els.expenseId.value = expense.id;
    els.expenseAmount.value = String(expense.amount);
    els.expenseDate.value = expense.date;
    els.expensePerson.value = expense.personId;
    els.expenseCategory.value = expense.categoryId;
    els.expenseDescription.value = expense.description || '';
    setNecessity(expense.necessity || 'necessary');
    openPanel('expensePanel');
  }

  function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    state.expenses = state.expenses.filter((expense) => expense.id !== id);
    saveAndRender(true);
    showToast('Expense deleted.');
  }

  function editIncome(id) {
    const income = state.incomes.find((item) => item.id === id);
    if (!income) return;
    els.incomeId.value = income.id;
    els.incomeAmount.value = String(income.amount);
    els.incomeDate.value = income.date;
    const knownSources = ['Father Pension', 'Sohail Income'];
    if (knownSources.includes(income.source)) {
      els.incomeSourceSelect.value = income.source;
      els.customIncomeSourceWrap.hidden = true;
      els.incomeSourceCustom.value = '';
    } else {
      els.incomeSourceSelect.value = 'Other';
      els.customIncomeSourceWrap.hidden = false;
      els.incomeSourceCustom.value = income.source;
    }
    els.incomeNote.value = income.note || '';
    openPanel('incomePanel');
  }

  function deleteIncome(id) {
    if (!confirm('Delete this income record?')) return;
    state.incomes = state.incomes.filter((income) => income.id !== id);
    saveAndRender(true);
    showToast('Income deleted.');
  }

  function renderAll() {
    normalizeState();
    renderSelects();
    renderSummary();
    renderDashboard();
    renderPeople();
    renderCategories();
    renderCalendar();
    renderSyncStatus();
  }

  function renderSelects() {
    fillOptions(els.expensePerson, getActivePeople().map((person) => [person.id, person.name]));
    fillOptions(els.expenseCategory, getActiveCategories().map((category) => [category.id, category.name]));
    fillOptions(els.filterPerson, [['all', 'All People'], ...state.people.filter((person) => person.active || usedPersonIds().has(person.id)).map((person) => [person.id, person.name])]);
    fillOptions(els.filterCategory, [['all', 'All Categories'], ...state.categories.filter((category) => category.active || usedCategoryIds().has(category.id)).map((category) => [category.id, category.name])]);

    els.filterPerson.value = filters.personId;
    els.filterCategory.value = filters.categoryId;
    els.filterNecessity.value = filters.necessity;
    els.filterFrom.value = filters.from || '';
    els.filterTo.value = filters.to || '';
    els.customRangeBox.hidden = filters.range !== 'custom';
  }

  function renderSummary() {
    const month = state.settings.selectedMonth;
    const incomes = state.incomes.filter((income) => income.date?.startsWith(month));
    const expenses = state.expenses.filter((expense) => expense.date?.startsWith(month));
    const totalIncome = sum(incomes, 'amount');
    const totalExpense = sum(expenses, 'amount');
    const remaining = totalIncome - totalExpense;
    const necessary = sum(expenses.filter((expense) => expense.necessity !== 'unnecessary'), 'amount');
    const unnecessary = sum(expenses.filter((expense) => expense.necessity === 'unnecessary'), 'amount');
    const daysInMonth = getDaysInMonth(month);
    const dailyAverage = totalExpense / daysInMonth;
    const spentPercent = totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0;

    els.totalIncomeText.textContent = money(totalIncome);
    els.totalExpenseText.textContent = money(totalExpense);
    els.remainingText.textContent = money(remaining);
    els.necessaryText.textContent = money(necessary);
    els.unnecessaryText.textContent = money(unnecessary);
    els.transactionCountText.textContent = String(expenses.length);
    els.dailyAverageText.textContent = money(dailyAverage);
    els.progressBar.style.width = `${spentPercent}%`;

    if (!totalIncome && !totalExpense) {
      els.balanceHint.textContent = 'Add income and expenses to see the monthly picture.';
    } else if (remaining < 0) {
      els.balanceHint.textContent = `Overspent by ${money(Math.abs(remaining))}. Review unnecessary expenses.`;
    } else if (totalIncome > 0 && remaining <= totalIncome * (state.settings.warningPercent / 100)) {
      els.balanceHint.textContent = `Low balance warning: only ${money(remaining)} remaining this month.`;
    } else {
      els.balanceHint.textContent = `${money(remaining)} remaining after ${money(totalExpense)} expenses.`;
    }
  }

  function renderDashboard() {
    renderSelects();
    const filtered = getFilteredExpenses().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    els.filteredTotalText.textContent = money(sum(filtered, 'amount'));
    els.expenseList.innerHTML = filtered.length
      ? filtered.map(renderExpenseCard).join('')
      : `<div class="empty-state">No expenses found for selected filter.</div>`;

    els.expenseList.querySelectorAll('[data-edit-expense]').forEach((button) => {
      button.addEventListener('click', () => editExpense(button.dataset.editExpense));
    });
    els.expenseList.querySelectorAll('[data-delete-expense]').forEach((button) => {
      button.addEventListener('click', () => deleteExpense(button.dataset.deleteExpense));
    });

    const monthIncomes = state.incomes
      .filter((income) => income.date?.startsWith(state.settings.selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

    els.incomeList.innerHTML = monthIncomes.length
      ? monthIncomes.map(renderIncomeCard).join('')
      : `<div class="empty-state">No income added for this month.</div>`;

    els.incomeList.querySelectorAll('[data-edit-income]').forEach((button) => {
      button.addEventListener('click', () => editIncome(button.dataset.editIncome));
    });
    els.incomeList.querySelectorAll('[data-delete-income]').forEach((button) => {
      button.addEventListener('click', () => deleteIncome(button.dataset.deleteIncome));
    });
  }

  function renderExpenseCard(expense) {
    const person = findPerson(expense.personId)?.name || 'Unknown';
    const category = findCategory(expense.categoryId)?.name || 'Other';
    const necessity = expense.necessity === 'unnecessary' ? 'Unnecessary' : 'Necessary';
    const necessityClass = expense.necessity === 'unnecessary' ? 'tag--unnecessary' : 'tag--necessary';
    return `
      <div class="entry-card">
        <div class="entry-card__top">
          <div>
            <strong>${escapeHtml(money(expense.amount))}</strong>
            <div class="entry-card__meta">
              <span>${escapeHtml(formatDate(expense.date))}</span>
              <span>•</span>
              <span>${escapeHtml(person)}</span>
            </div>
          </div>
          <span class="tag ${necessityClass}">${necessity}</span>
        </div>
        <div class="entry-card__meta">
          <span class="tag">${escapeHtml(category)}</span>
        </div>
        ${expense.description ? `<p class="entry-card__note">${escapeHtml(expense.description)}</p>` : ''}
        <div class="entry-card__actions">
          <button type="button" class="mini-button" data-edit-expense="${expense.id}">Edit</button>
          <button type="button" class="mini-button mini-button--danger" data-delete-expense="${expense.id}">Delete</button>
        </div>
      </div>`;
  }

  function renderIncomeCard(income) {
    return `
      <div class="entry-card">
        <div class="entry-card__top">
          <div>
            <strong>${escapeHtml(money(income.amount))}</strong>
            <div class="entry-card__meta">
              <span>${escapeHtml(formatDate(income.date))}</span>
              <span>•</span>
              <span>${escapeHtml(income.source)}</span>
            </div>
          </div>
          <span class="tag tag--necessary">Income</span>
        </div>
        ${income.note ? `<p class="entry-card__note">${escapeHtml(income.note)}</p>` : ''}
        <div class="entry-card__actions">
          <button type="button" class="mini-button" data-edit-income="${income.id}">Edit</button>
          <button type="button" class="mini-button mini-button--danger" data-delete-income="${income.id}">Delete</button>
        </div>
      </div>`;
  }

  function renderPeople() {
    els.peopleList.innerHTML = getActivePeople().map((person) => `
      <span class="chip">${escapeHtml(person.name)} <button type="button" data-remove-person="${person.id}" aria-label="Remove ${escapeHtml(person.name)}">×</button></span>
    `).join('');
    els.peopleList.querySelectorAll('[data-remove-person]').forEach((button) => {
      button.addEventListener('click', () => removePerson(button.dataset.removePerson));
    });
  }

  function renderCategories() {
    els.categoryList.innerHTML = getActiveCategories().map((category) => `
      <span class="chip">${escapeHtml(category.name)} <button type="button" data-remove-category="${category.id}" aria-label="Remove ${escapeHtml(category.name)}">×</button></span>
    `).join('');
    els.categoryList.querySelectorAll('[data-remove-category]').forEach((button) => {
      button.addEventListener('click', () => removeCategory(button.dataset.removeCategory));
    });
  }

  function renderCalendar() {
    const month = state.settings.selectedMonth;
    const [year, monthNumber] = month.split('-').map(Number);
    const firstDate = new Date(year, monthNumber - 1, 1);
    const firstDay = (firstDate.getDay() + 6) % 7;
    const startDate = new Date(year, monthNumber - 1, 1 - firstDay);
    const monthFormatter = new Intl.DateTimeFormat('en-PK', { month: 'long', year: 'numeric' });
    els.calendarMonthText.textContent = monthFormatter.format(firstDate);

    const days = [];
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    els.calendarGrid.innerHTML = days.map((date) => renderCalendarDay(date, month)).join('');
    els.calendarGrid.querySelectorAll('[data-calendar-date]').forEach((button) => {
      button.addEventListener('click', () => showDayDetails(button.dataset.calendarDate));
    });
  }

  function renderCalendarDay(date, selectedMonth) {
    const key = dateKey(date);
    const dayMonth = monthKey(date);
    const dayExpenses = state.expenses.filter((expense) => expense.date === key);
    const total = sum(dayExpenses, 'amount');
    const personTags = [...new Set(dayExpenses.slice(0, 4).map((expense) => findPerson(expense.personId)?.name || 'Unknown'))];
    const classes = [
      'calendar-day',
      dayMonth !== selectedMonth ? 'is-muted' : '',
      key === todayKey() ? 'is-today' : ''
    ].filter(Boolean).join(' ');

    return `
      <button type="button" class="${classes}" data-calendar-date="${key}">
        <span class="calendar-day__num">${date.getDate()}</span>
        ${total ? `<span class="calendar-day__amount">${escapeHtml(compactMoney(total))}</span>` : ''}
        ${personTags.length ? `<span class="calendar-day__tags">${personTags.map((tag) => `<span>${escapeHtml(shortName(tag))}</span>`).join('')}</span>` : ''}
      </button>`;
  }

  function showDayDetails(date) {
    const dayExpenses = state.expenses
      .filter((expense) => expense.date === date)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    els.dayDetailsTitle.textContent = formatDate(date);
    els.dayDetailsList.innerHTML = dayExpenses.length
      ? dayExpenses.map(renderExpenseCard).join('')
      : `<div class="empty-state">No expenses on this date.</div>`;
    els.dayDetailsCard.hidden = false;
    els.dayDetailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

    els.dayDetailsList.querySelectorAll('[data-edit-expense]').forEach((button) => {
      button.addEventListener('click', () => editExpense(button.dataset.editExpense));
    });
    els.dayDetailsList.querySelectorAll('[data-delete-expense]').forEach((button) => {
      button.addEventListener('click', () => deleteExpense(button.dataset.deleteExpense));
    });
  }

  function renderSyncStatus() {
    els.syncUrl.value = state.settings.syncUrl || '';
    els.syncStatusText.textContent = state.meta.syncMessage || 'Local storage ready.';
    els.syncDot.classList.toggle('is-synced', !!state.meta.lastSyncAt && !state.meta.syncPending);
    els.syncDot.classList.toggle('is-pending', !!state.meta.syncPending);
  }

  function getFilteredExpenses() {
    const range = getDateRange();
    return state.expenses.filter((expense) => {
      if (range.from && expense.date < range.from) return false;
      if (range.to && expense.date > range.to) return false;
      if (filters.personId !== 'all' && expense.personId !== filters.personId) return false;
      if (filters.categoryId !== 'all' && expense.categoryId !== filters.categoryId) return false;
      if (filters.necessity !== 'all' && (expense.necessity || 'necessary') !== filters.necessity) return false;
      return true;
    });
  }

  function getDateRange() {
    if (filters.range === 'custom') {
      return { from: filters.from || '', to: filters.to || '' };
    }
    if (filters.range === 'today') {
      const today = todayKey();
      return { from: today, to: today };
    }
    if (filters.range === 'yesterday') {
      const yesterday = dateKey(addDays(new Date(), -1));
      return { from: yesterday, to: yesterday };
    }
    if (filters.range === 'thisWeek') {
      return weekRange(new Date());
    }
    return {
      from: startOfMonthKey(state.settings.selectedMonth),
      to: endOfMonthKey(state.settings.selectedMonth)
    };
  }

  function updateRangeFromQuickFilter() {
    const range = getDateRange();
    filters.from = range.from;
    filters.to = range.to;
    els.customRangeBox.hidden = filters.range !== 'custom';
    els.filterFrom.value = filters.from;
    els.filterTo.value = filters.to;
  }

  function activateRangeButton(range) {
    $$('.pill').forEach((button) => button.classList.toggle('is-active', button.dataset.range === range));
  }

  function saveAndRender(shouldSync = true) {
    state.meta.updatedAt = new Date().toISOString();
    state.meta.syncPending = shouldSync || state.meta.syncPending;
    if (shouldSync) state.meta.syncMessage = navigator.onLine ? 'Saved locally. Backup pending...' : 'Saved locally. Offline backup pending.';
    persist();
    renderAll();
    if (shouldSync) scheduleSync();
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialState();
      const parsed = JSON.parse(raw);
      return mergeState(parsed);
    } catch (error) {
      console.warn('Could not load state', error);
      return initialState();
    }
  }

  function mergeState(saved) {
    const base = initialState();
    return {
      ...base,
      ...saved,
      settings: { ...base.settings, ...(saved.settings || {}) },
      meta: { ...base.meta, ...(saved.meta || {}) },
      people: Array.isArray(saved.people) && saved.people.length ? saved.people : base.people,
      categories: Array.isArray(saved.categories) && saved.categories.length ? saved.categories : base.categories,
      expenses: Array.isArray(saved.expenses) ? saved.expenses : [],
      incomes: Array.isArray(saved.incomes) ? saved.incomes : []
    };
  }

  function normalizeState() {
    state.people = uniqueById([...(state.people || []), ...defaultPeople]).map((person) => ({ ...person, active: person.active !== false }));
    state.categories = uniqueById([...(state.categories || []), ...defaultCategories]).map((category) => ({ ...category, active: category.active !== false }));
    state.expenses = (state.expenses || []).map((expense) => ({
      ...expense,
      amount: Number(expense.amount) || 0,
      necessity: expense.necessity === 'unnecessary' ? 'unnecessary' : 'necessary',
      date: expense.date || todayKey(),
      personId: expense.personId || 'combined',
      categoryId: expense.categoryId || 'other',
      description: expense.description || '',
      createdAt: expense.createdAt || new Date().toISOString(),
      updatedAt: expense.updatedAt || expense.createdAt || new Date().toISOString()
    }));
    state.incomes = (state.incomes || []).map((income) => ({
      ...income,
      amount: Number(income.amount) || 0,
      date: income.date || todayKey(),
      source: income.source || 'Other',
      note: income.note || '',
      createdAt: income.createdAt || new Date().toISOString(),
      updatedAt: income.updatedAt || income.createdAt || new Date().toISOString()
    }));
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

    const payload = {
      action: 'backup',
      app: 'family-expense-tracker',
      savedAt: new Date().toISOString(),
      data: exportStateObject()
    };

    try {
      state.meta.syncMessage = 'Sending backup to Google Sheet...';
      renderSyncStatus();
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
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
    if (!url) {
      showToast('Add Google Apps Script URL first.');
      return;
    }
    if (!navigator.onLine) {
      showToast('Internet is required to import from Google Sheet.');
      return;
    }
    if (!confirm('Import latest data from Google Sheet? This will replace local data after creating an automatic local export.')) return;

    autoDownloadBackupBeforeReplace();
    const callbackName = `sheetImport_${Date.now()}`;
    const script = document.createElement('script');
    window[callbackName] = (response) => {
      try {
        if (!response || response.ok === false) throw new Error(response?.error || 'Import failed.');
        const imported = mergeState(response.data || {});
        state = imported;
        state.settings.syncUrl = url;
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

  function exportJson() {
    const data = exportStateObject();
    downloadFile(`family-expense-backup-${todayKey()}.json`, JSON.stringify(data, null, 2), 'application/json');
    showToast('JSON backup exported.');
  }

  function exportCsv() {
    const expenseRows = state.expenses.map((expense) => ({
      type: 'expense',
      date: expense.date,
      amount: expense.amount,
      person: findPerson(expense.personId)?.name || expense.personId,
      category: findCategory(expense.categoryId)?.name || expense.categoryId,
      necessity: expense.necessity || 'necessary',
      description: expense.description || '',
      source: '',
      note: ''
    }));
    const incomeRows = state.incomes.map((income) => ({
      type: 'income',
      date: income.date,
      amount: income.amount,
      person: '',
      category: '',
      necessity: '',
      description: '',
      source: income.source || '',
      note: income.note || ''
    }));
    const rows = [...expenseRows, ...incomeRows].sort((a, b) => b.date.localeCompare(a.date));
    const headers = ['type', 'date', 'amount', 'person', 'category', 'necessity', 'description', 'source', 'note'];
    const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\n');
    downloadFile(`family-expense-records-${todayKey()}.csv`, csv, 'text/csv');
    showToast('CSV exported.');
  }

  function importJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!imported || !Array.isArray(imported.expenses) || !Array.isArray(imported.incomes)) {
          throw new Error('Invalid backup file.');
        }
        if (!confirm('Import this backup? Current local data will be replaced after automatic backup export.')) return;
        autoDownloadBackupBeforeReplace();
        const currentSyncUrl = state.settings.syncUrl;
        state = mergeState(imported);
        state.settings.syncUrl = state.settings.syncUrl || currentSyncUrl;
        state.meta.updatedAt = new Date().toISOString();
        state.meta.syncMessage = 'Backup imported locally.';
        state.meta.syncPending = true;
        persist();
        renderAll();
        scheduleSync();
        showToast('Backup imported.');
      } catch (error) {
        console.error(error);
        showToast('Could not import this file.');
      } finally {
        els.importFile.value = '';
      }
    };
    reader.readAsText(file);
  }

  function autoDownloadBackupBeforeReplace() {
    const data = exportStateObject();
    downloadFile(`auto-backup-before-import-${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json');
  }

  function resetLocalData() {
    if (!confirm('Export backup before resetting. Continue with local reset?')) return;
    exportJson();
    if (!confirm('Final confirmation: delete local data from this browser?')) return;
    const syncUrl = state.settings.syncUrl;
    state = initialState();
    state.settings.syncUrl = syncUrl;
    persist();
    renderAll();
    showToast('Local data reset.');
  }

  function exportStateObject() {
    normalizeState();
    return {
      version: state.version,
      settings: state.settings,
      people: state.people,
      categories: state.categories,
      expenses: state.expenses,
      incomes: state.incomes,
      meta: state.meta,
      exportedAt: new Date().toISOString()
    };
  }

  function fillOptions(select, options) {
    const currentValue = select.value;
    select.innerHTML = options.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
    if (options.some(([value]) => value === currentValue)) select.value = currentValue;
  }

  function getActivePeople() {
    return state.people.filter((person) => person.active !== false);
  }

  function getActiveCategories() {
    return state.categories.filter((category) => category.active !== false);
  }

  function findPerson(id) {
    return state.people.find((person) => person.id === id);
  }

  function findCategory(id) {
    return state.categories.find((category) => category.id === id);
  }

  function usedPersonIds() {
    return new Set(state.expenses.map((expense) => expense.personId));
  }

  function usedCategoryIds() {
    return new Set(state.expenses.map((expense) => expense.categoryId));
  }

  function setNecessity(value) {
    $$('input[name="necessity"]').forEach((input) => {
      input.checked = input.value === value;
    });
  }

  function getSelectedNecessity() {
    return $('input[name="necessity"]:checked')?.value || 'necessary';
  }

  function parseAmount(value) {
    const normalized = String(value || '').replace(/,/g, '').trim();
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return 0;
    return Number(normalized);
  }

  function cleanText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function money(value) {
    const safeValue = Number(value) || 0;
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: state.settings.currency || 'PKR',
      maximumFractionDigits: safeValue % 1 ? 2 : 0
    }).format(safeValue).replace('PKR', 'Rs');
  }

  function compactMoney(value) {
    const safeValue = Number(value) || 0;
    if (Math.abs(safeValue) >= 1000000) return `Rs ${(safeValue / 1000000).toFixed(1)}M`;
    if (Math.abs(safeValue) >= 1000) return `Rs ${(safeValue / 1000).toFixed(1)}k`;
    return money(safeValue);
  }

  function sum(items, key) {
    return items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
  }

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function startOfMonthKey(month) {
    return `${month}-01`;
  }

  function endOfMonthKey(month) {
    const [year, monthNumber] = month.split('-').map(Number);
    return dateKey(new Date(year, monthNumber, 0));
  }

  function getDaysInMonth(month) {
    const [year, monthNumber] = month.split('-').map(Number);
    return new Date(year, monthNumber, 0).getDate();
  }

  function weekRange(date) {
    const start = new Date(date);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: dateKey(start), to: dateKey(end) };
  }

  function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function formatDate(value) {
    if (!value) return '';
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day));
  }

  function formatDateTime(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  function uid(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function slugify(value) {
    return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function uniqueById(items) {
    const map = new Map();
    items.forEach((item) => {
      if (!map.has(item.id)) map.set(item.id, item);
    });
    return [...map.values()];
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function csvCell(value) {
    const string = String(value ?? '');
    return /[",\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function shortName(name) {
    return name
      .replace('Combined / General', 'Combined')
      .replace('Father ', '')
      .replace('Mother ', '')
      .replace('Grandson ', '')
      .replace("Son's Wife ", '')
      .replace('Daughter ', '')
      .replace('Son ', '');
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('is-visible'), 2600);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('SW registration failed', error));
    }
  }

  window.familyExpenseApp = {
    exportState: exportStateObject,
    pushToSheet,
    importFromSheet
  };
})();
