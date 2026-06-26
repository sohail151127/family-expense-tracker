(() => {
  'use strict';
  const STORAGE_KEY = 'family-expense-tracker-v4-foundation';
  const DB_NAME = 'family-expense-tracker-offline-db';
  const DB_VERSION = 1;
  const DB_STORE = 'appState';
  let dbPromise = null;
  const OLD_KEYS = ['family-expense-tracker-v3-notes-entries','family-expense-tracker-v2-premium','family-expense-tracker-v1'];
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const uid = (p='id') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  const todayISO = () => new Date().toISOString().slice(0,10);
  const monthKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const fmtMonth = (mk) => new Date(`${mk}-01T12:00:00`).toLocaleDateString('en-PK',{month:'long',year:'numeric'});
  const money = n => `Rs ${Math.round(Number(n)||0).toLocaleString('en-PK')}`;
  const slug = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || uid('item');
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const peopleDefaults = ['Combined / General','Father Zulfiqar','Mother Rafiq Bibi','Son Sohail','Grandson Sarim',"Son's Wife Kainat",'Daughter Sidra','Son Bilal'].map(n=>({id:slug(n),name:n,active:true}));
  const catDefaults = ['Grocery','Medicine','Bills','Food','Transport','Education','Home','Rent','Utilities','Milk','Vegetables','Other'].map(n=>({id:slug(n),name:n,active:true}));
  const accountDefaults = ['Cash','Bank','JazzCash','Easypaisa'].map(n=>({id:slug(n),name:n,openingBalance:0,active:true}));
  const initialState = () => ({version:4,settings:{currency:'PKR',selectedMonth:monthKey(),syncUrl:'',pinHash:'',notesPinHash:'',budget:{expectedIncome:0,savingTarget:0,necessaryLimit:0,unnecessaryLimit:0}},people:clone(peopleDefaults),categories:clone(catDefaults),accounts:clone(accountDefaults),expenses:[],incomes:[],notes:[],debts:[],recurringExpenses:[],activity:[],meta:{createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),lastSyncAt:'',syncPending:false,syncQueue:[],syncMessage:'Offline-first local storage ready.', storageEngine:'Local + IndexedDB mirror', offlineReady:false, lastAutoBackupAt:''}});
  let state = loadState();
  let currentView = 'home';
  let selectedPeople = [];
  let selectedCategories = [];
  let notesUnlocked = false;
  let lastDeleted = null;

  const els = {
    app: $('#app'), lockScreen: $('#lockScreen'), pinInput: $('#pinInput'), unlockBtn: $('#unlockBtn'), pinError: $('#pinError'), pageTitle: $('#pageTitle'), syncStatus: $('#syncStatus'), syncDot: $('#syncDot'), syncText: $('#syncText'), toast: $('#toast'), undoBar: $('#undoBar'), undoText: $('#undoText'), undoBtn: $('#undoBtn'),
    monthPicker: $('#monthPicker'), monthTitle: $('#monthTitle'), metricIncome: $('#metricIncome'), metricExpense: $('#metricExpense'), metricBalance: $('#metricBalance'), metricNecessary: $('#metricNecessary'), metricUnnecessary: $('#metricUnnecessary'), metricSaving: $('#metricSaving'), budgetPercent: $('#budgetPercent'), budgetBar: $('#budgetBar'), budgetText: $('#budgetText'), smartWidgets: $('#smartWidgets'), recentTimeline: $('#recentTimeline'),
    addTypeTabs: $('#addTypeTabs'), entryForm: $('#entryForm'), editingType: $('#editingType'), editingId: $('#editingId'), entryType: $('#entryType'), entryDate: $('#entryDate'), entryAmount: $('#entryAmount'), entryAccount: $('#entryAccount'), entryTitle: $('#entryTitle'), entryDescription: $('#entryDescription'), peopleChips: $('#peopleChips'), categoryChips: $('#categoryChips'), quickPersonName: $('#quickPersonName'), quickAddPerson: $('#quickAddPerson'), quickCategoryName: $('#quickCategoryName'), quickAddCategory: $('#quickAddCategory'), entryNecessary: $('#entryNecessary'), incomeSource: $('#incomeSource'), noteTag: $('#noteTag'), debtStatus: $('#debtStatus'), recurringRepeat: $('#recurringRepeat'), saveEntryBtn: $('#saveEntryBtn'), clearFormBtn: $('#clearFormBtn'),
    globalSearch: $('#globalSearch'), filterType: $('#filterType'), filterRange: $('#filterRange'), customRangeWrap: $('#customRangeWrap'), rangeFrom: $('#rangeFrom'), rangeTo: $('#rangeTo'), entriesCount: $('#entriesCount'), entriesSum: $('#entriesSum'), entriesTimeline: $('#entriesTimeline'),
    personReport: $('#personReport'), categoryReport: $('#categoryReport'), necessaryChart: $('#necessaryChart'), dailyChart: $('#dailyChart'), incomeReport: $('#incomeReport'), accountReport: $('#accountReport'),
    calendarGrid: $('#calendarGrid'), dayDetails: $('#dayDetails'),
    notesLockBox: $('#notesLockBox'), notesPinInput: $('#notesPinInput'), notesUnlockBtn: $('#notesUnlockBtn'), notesSetPinBtn: $('#notesSetPinBtn'), notesError: $('#notesError'), notesArea: $('#notesArea'), notesSearch: $('#notesSearch'), notesList: $('#notesList'), addNoteCardBtn: $('#addNoteCardBtn'), notesLockBtn: $('#notesLockBtn'),
    settingExpectedIncome: $('#settingExpectedIncome'), settingSavingTarget: $('#settingSavingTarget'), settingNecessaryLimit: $('#settingNecessaryLimit'), settingUnnecessaryLimit: $('#settingUnnecessaryLimit'), saveBudgetBtn: $('#saveBudgetBtn'), settingsPeopleList: $('#settingsPeopleList'), settingsCategoryList: $('#settingsCategoryList'), settingsAccountList: $('#settingsAccountList'), settingsPersonInput: $('#settingsPersonInput'), settingsCategoryInput: $('#settingsCategoryInput'), settingsAccountInput: $('#settingsAccountInput'), settingsAddPerson: $('#settingsAddPerson'), settingsAddCategory: $('#settingsAddCategory'), settingsAddAccount: $('#settingsAddAccount'), syncUrl: $('#syncUrl'), saveSyncUrlBtn: $('#saveSyncUrlBtn'), syncNowBtn: $('#syncNowBtn'), importSheetBtn: $('#importSheetBtn'), syncMessage: $('#syncMessage'), exportJsonBtn: $('#exportJsonBtn'), exportCsvBtn: $('#exportCsvBtn'), importFile: $('#importFile'), resetBtn: $('#resetBtn'), appPinInput: $('#appPinInput'), notesPinSettingInput: $('#notesPinSettingInput'), savePinsBtn: $('#savePinsBtn')
  };


  function openDB(){
    if(!('indexedDB' in window)) return Promise.resolve(null);
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if(!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { console.warn('IndexedDB unavailable', req.error); resolve(null); };
    });
    return dbPromise;
  }
  async function idbPut(key, value){
    const db = await openDB();
    if(!db) return false;
    return new Promise(resolve => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => { console.warn('IndexedDB write failed', tx.error); resolve(false); };
    });
  }
  async function idbGet(key){
    const db = await openDB();
    if(!db) return null;
    return new Promise(resolve => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }
  async function hydrateFromIndexedDB(){
    try{
      const localUpdated = new Date(state.meta?.updatedAt || 0).getTime();
      const idbState = await idbGet(STORAGE_KEY);
      const idbUpdated = new Date(idbState?.meta?.updatedAt || 0).getTime();
      if(idbState && idbUpdated > localUpdated){
        state = normalize(idbState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        renderAll();
        toast('Loaded latest offline data.');
      }
      await idbPut(STORAGE_KEY, state);
      state.meta.offlineReady = true;
      updateSyncStatus();
    }catch(e){ console.warn('Offline DB hydrate failed', e); }
  }
  async function mirrorToOfflineDB(){
    try{ await idbPut(STORAGE_KEY, state); }catch(e){ console.warn(e); }
  }
  function loadState(){
    try{
      const current = localStorage.getItem(STORAGE_KEY);
      if(current) return normalize(JSON.parse(current));
      for(const key of OLD_KEYS){ const raw = localStorage.getItem(key); if(raw){ const st = normalize(JSON.parse(raw)); localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); return st; } }
    }catch(e){ console.warn(e); }
    return initialState();
  }
  function normalize(st){
    const base = initialState(); st = {...base, ...st}; st.settings = {...base.settings, ...(st.settings||{})}; st.settings.budget = {...base.settings.budget, ...((st.settings||{}).budget||{})}; st.meta = {...base.meta, ...(st.meta||{})};
    st.people = Array.isArray(st.people)&&st.people.length ? st.people.map(x=>({id:x.id||slug(x.name),name:x.name||'Unnamed',active:x.active!==false})) : base.people;
    st.categories = Array.isArray(st.categories)&&st.categories.length ? st.categories.map(x=>({id:x.id||slug(x.name),name:x.name||'Other',active:x.active!==false})) : base.categories;
    st.accounts = Array.isArray(st.accounts)&&st.accounts.length ? st.accounts.map(x=>({id:x.id||slug(x.name),name:x.name||'Account',openingBalance:Number(x.openingBalance)||0,active:x.active!==false})) : base.accounts;
    st.expenses = (st.expenses||[]).map(e=>({...e,id:e.id||uid('exp'),type:'expense',date:e.date||todayISO(),amount:Number(e.amount)||0,title:e.title||e.description||'Expense',description:e.description||'',peopleIds:arr(e.peopleIds||e.personIds||e.personId||e.person),categoryIds:arr(e.categoryIds||e.categories||e.categoryId||e.category),accountId:e.accountId||'cash',necessary:e.necessary!==false,createdAt:e.createdAt||new Date().toISOString(),updatedAt:e.updatedAt||new Date().toISOString()}));
    st.incomes = (st.incomes||[]).map(e=>({...e,id:e.id||uid('inc'),type:'income',date:e.date||todayISO(),amount:Number(e.amount)||0,title:e.title||e.source||'Income',description:e.description||e.note||'',source:e.source||e.title||'Other Income',accountId:e.accountId||'cash',createdAt:e.createdAt||new Date().toISOString(),updatedAt:e.updatedAt||new Date().toISOString()}));
    st.notes = (st.notes||[]).map(e=>({...e,id:e.id||uid('note'),type:'note',date:e.date||e.createdAt?.slice(0,10)||todayISO(),title:e.title||'Note',description:e.description||'',tag:e.tag||'',createdAt:e.createdAt||new Date().toISOString(),updatedAt:e.updatedAt||new Date().toISOString()}));
    st.debts = (st.debts||[]).map(e=>({...e,id:e.id||uid('debt'),type:'debt',date:e.date||todayISO(),amount:Number(e.amount)||0,title:e.title||'Pending payment',description:e.description||'',status:e.status||'receivable',accountId:e.accountId||'cash',peopleIds:arr(e.peopleIds||e.personId),createdAt:e.createdAt||new Date().toISOString(),updatedAt:e.updatedAt||new Date().toISOString()}));
    st.recurringExpenses = (st.recurringExpenses||[]).map(e=>({...e,id:e.id||uid('rec'),type:'recurring',date:e.date||todayISO(),amount:Number(e.amount)||0,title:e.title||'Recurring expense',description:e.description||'',repeat:e.repeat||'monthly',accountId:e.accountId||'cash',peopleIds:arr(e.peopleIds||e.personId),categoryIds:arr(e.categoryIds||e.categoryId),createdAt:e.createdAt||new Date().toISOString(),updatedAt:e.updatedAt||new Date().toISOString()}));
    st.activity = st.activity || [];
    return st;
  }
  function arr(v){ if(Array.isArray(v)) return v.filter(Boolean); if(!v) return []; return [v]; }
  function save(change='Saved locally'){
    state.meta.updatedAt = new Date().toISOString(); state.meta.syncPending = true; state.meta.syncMessage = change; state.meta.syncQueue = state.meta.syncQueue || []; state.meta.syncQueue.push({id:uid('q'),change,at:new Date().toISOString()}); if(state.meta.syncQueue.length>80) state.meta.syncQueue = state.meta.syncQueue.slice(-80);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); mirrorToOfflineDB(); updateSyncStatus();
  }
  function log(msg){ state.activity.unshift({id:uid('act'),message:msg,at:new Date().toISOString()}); state.activity = state.activity.slice(0,200); }
  async function hash(v){ if(!v) return ''; const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)); return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''); }

  async function init(){
    if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').then(reg=>{ if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'}); }).catch(console.warn); }
    hydrateFromIndexedDB();
    window.addEventListener('online', () => { updateSyncStatus(); autoSync(); toast('Internet is back. Syncing pending changes.'); });
    window.addEventListener('offline', () => { updateSyncStatus(); toast('Offline mode active. Your changes will stay on this phone.'); });
    els.monthPicker.value = state.settings.selectedMonth || monthKey(); els.entryDate.value = todayISO(); els.rangeFrom.value = `${state.settings.selectedMonth}-01`; els.rangeTo.value = todayISO();
    bind(); renderAll(); updateSyncStatus();
    if(state.settings.pinHash){ els.lockScreen.classList.remove('hidden'); } else { els.lockScreen.classList.add('hidden'); }
    window.addEventListener('online',()=>{ toast('Back online. Sync is available.'); updateSyncStatus(); autoSync(); });
    window.addEventListener('offline',()=>{ toast('Offline mode: changes will stay saved on this phone.'); updateSyncStatus(); });
    setTimeout(autoSync, 1000);
  }
  function bind(){
    $$('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));
    $$('[data-jump-add]').forEach(b=>b.addEventListener('click',()=>{ setAddType(b.dataset.jumpAdd); nav('add'); }));
    els.unlockBtn.onclick = async()=>{ if(await hash(els.pinInput.value)===state.settings.pinHash){ els.lockScreen.classList.add('hidden'); els.pinInput.value=''; } else els.pinError.textContent='Incorrect PIN.'; };
    els.monthPicker.onchange = ()=>{ state.settings.selectedMonth = els.monthPicker.value || monthKey(); save('Month changed'); renderAll(); };
    els.addTypeTabs.onclick = e=>{ const b=e.target.closest('button[data-type]'); if(b) setAddType(b.dataset.type); };
    els.entryType.onchange = ()=>setAddType(els.entryType.value, false);
    els.entryForm.onsubmit = saveEntry;
    els.clearFormBtn.onclick = clearForm;
    els.quickAddPerson.onclick = ()=>quickAdd('person', els.quickPersonName.value, true);
    els.quickAddCategory.onclick = ()=>quickAdd('category', els.quickCategoryName.value, true);
    ['input','change'].forEach(evt=>{ els.globalSearch.addEventListener(evt, renderEntries); els.filterType.addEventListener(evt, renderEntries); els.filterRange.addEventListener(evt,()=>{ els.customRangeWrap.classList.toggle('hidden',els.filterRange.value!=='custom'); renderEntries(); }); els.rangeFrom.addEventListener(evt, renderEntries); els.rangeTo.addEventListener(evt, renderEntries); els.notesSearch.addEventListener(evt, renderNotes); });
    els.notesUnlockBtn.onclick = unlockNotes; els.notesSetPinBtn.onclick = setNotesPinQuick; els.notesLockBtn.onclick = ()=>{ notesUnlocked=false; renderNotesLock(); }; els.addNoteCardBtn.onclick = ()=>{ clearForm(); setAddType('note'); nav('add'); };
    els.saveBudgetBtn.onclick = saveBudget; els.settingsAddPerson.onclick = ()=>quickAdd('person', els.settingsPersonInput.value, false); els.settingsAddCategory.onclick = ()=>quickAdd('category', els.settingsCategoryInput.value, false); els.settingsAddAccount.onclick = ()=>quickAdd('account', els.settingsAccountInput.value, false);
    els.saveSyncUrlBtn.onclick = ()=>{ state.settings.syncUrl = els.syncUrl.value.trim(); save('Sync URL saved'); renderSettings(); toast('Sync URL saved.'); };
    els.syncNowBtn.onclick = syncNow; els.importSheetBtn.onclick = importSheet;
    els.exportJsonBtn.onclick = exportJson; els.exportCsvBtn.onclick = exportCsv; els.importFile.onchange = importBackup; els.resetBtn.onclick = resetLocal;
    els.savePinsBtn.onclick = savePins; els.undoBtn.onclick = undoDelete;
  }
  function nav(view){ currentView=view; $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`)); $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===view)); els.pageTitle.textContent = ({home:'Dashboard',add:'Add Entry',entries:'Entries',reports:'Reports',calendar:'Calendar',notes:'Notes',settings:'Settings'}[view]||'Dashboard'); renderAll(); }
  function setAddType(type, switchTab=true){
    els.entryType.value=type; $$('#addTypeTabs button').forEach(b=>b.classList.toggle('active',b.dataset.type===type));
    $$('.expense-only').forEach(x=>x.classList.toggle('hidden',type!=='expense')); $$('.income-only').forEach(x=>x.classList.toggle('hidden',type!=='income')); $$('.note-only').forEach(x=>x.classList.toggle('hidden',type!=='note')); $$('.debt-only').forEach(x=>x.classList.toggle('hidden',type!=='debt')); $$('.recurring-only').forEach(x=>x.classList.toggle('hidden',type!=='recurring'));
    $('.money-fields')?.classList.toggle('hide-amount', type==='note'); els.saveEntryBtn.textContent = els.editingId.value ? 'Update entry' : `Save ${type}`; if(switchTab) nav('add');
  }
  function clearForm(){ els.editingId.value=''; els.editingType.value=''; els.entryDate.value=todayISO(); els.entryAmount.value=''; els.entryTitle.value=''; els.entryDescription.value=''; selectedPeople=[]; selectedCategories=[]; els.entryNecessary.checked=true; els.noteTag.value=''; els.debtStatus.value='receivable'; renderChips(); setAddType(els.entryType.value||'expense', false); }
  function renderAll(){ renderHome(); renderChips(); renderEntries(); renderReports(); renderCalendar(); renderNotesLock(); renderSettings(); }
  function monthFilter(list){ const mk=state.settings.selectedMonth; return list.filter(x=>(x.date||'').startsWith(mk)); }
  function totals(){ const expenses=monthFilter(state.expenses), incomes=monthFilter(state.incomes); const inc=sum(incomes), exp=sum(expenses), nec=sum(expenses.filter(x=>x.necessary!==false)), un=exp-nec; const budget=state.settings.budget||{}; return {expenses,incomes,inc,exp,nec,un,bal:inc-exp,saving:(inc-exp)-(Number(budget.savingTarget)||0)}; }
  function sum(a){ return a.reduce((t,x)=>t+(Number(x.amount)||0),0); }
  function renderHome(){ const t=totals(); els.monthPicker.value=state.settings.selectedMonth; els.monthTitle.textContent=`${fmtMonth(state.settings.selectedMonth)} Family Budget`; els.metricIncome.textContent=money(t.inc); els.metricExpense.textContent=money(t.exp); els.metricBalance.textContent=money(t.bal); els.metricNecessary.textContent=money(t.nec); els.metricUnnecessary.textContent=money(t.un); els.metricSaving.textContent=money(t.bal-(Number(state.settings.budget.savingTarget)||0)); const base=t.inc || Number(state.settings.budget.expectedIncome)||0; const pct=base?Math.min(100,Math.round(t.exp/base*100)):0; els.budgetPercent.textContent=`${pct}%`; els.budgetBar.style.width=`${pct}%`; els.budgetText.textContent=base?`${money(t.exp)} spent from ${money(base)}. ${money(Math.max(0,base-t.exp))} available.`:'Add monthly income or expected income to activate budget tracking.';
    const largest = t.expenses.slice().sort((a,b)=>b.amount-a.amount)[0]; const pending = state.debts.filter(d=>d.status!=='paid').length; els.smartWidgets.innerHTML=[['Pending sync',state.meta.syncPending?'Yes':'No'],['Pending payments',pending],['Largest expense',largest?`${largest.title} · ${money(largest.amount)}`:'None'],['Entries this month',t.expenses.length+t.incomes.length]].map(([a,b])=>`<div class="mini-card"><span class="muted">${a}</span><strong>${b}</strong></div>`).join(''); renderTimeline(els.recentTimeline, allEntries().slice(0,8)); }
  function renderChips(){ els.entryAccount.innerHTML = state.accounts.filter(x=>x.active).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join(''); els.peopleChips.innerHTML=state.people.filter(x=>x.active).map(p=>`<button type="button" class="chip ${selectedPeople.includes(p.id)?'active':''}" data-id="${p.id}" data-kind="person">${esc(p.name)}</button>`).join(''); els.categoryChips.innerHTML=state.categories.filter(x=>x.active).map(c=>`<button type="button" class="chip ${selectedCategories.includes(c.id)?'active':''}" data-id="${c.id}" data-kind="cat">${esc(c.name)}</button>`).join(''); els.peopleChips.onclick=e=>toggleChip(e,'people'); els.categoryChips.onclick=e=>toggleChip(e,'cat'); }
  function toggleChip(e,kind){ const b=e.target.closest('.chip'); if(!b) return; const arr=kind==='people'?selectedPeople:selectedCategories; const i=arr.indexOf(b.dataset.id); i>=0?arr.splice(i,1):arr.push(b.dataset.id); renderChips(); }
  function saveEntry(e){ e.preventDefault(); const type=els.entryType.value; const id=els.editingId.value || uid(type); const base={id,type,date:els.entryDate.value||todayISO(),title:els.entryTitle.value.trim()||type[0].toUpperCase()+type.slice(1),description:els.entryDescription.value.trim(),updatedAt:new Date().toISOString(),createdAt:new Date().toISOString()}; const amount=Number(els.entryAmount.value)||0; let obj={...base};
    if(type==='expense'){ if(!amount) return toast('Please enter amount.'); obj={...obj,amount,accountId:els.entryAccount.value,peopleIds:selectedPeople.length?selectedPeople:[state.people[0]?.id].filter(Boolean),categoryIds:selectedCategories.length?selectedCategories:[state.categories.find(c=>c.name==='Other')?.id||state.categories[0]?.id].filter(Boolean),necessary:els.entryNecessary.checked}; upsert('expenses',obj); }
    if(type==='income'){ if(!amount) return toast('Please enter amount.'); obj={...obj,amount,source:els.incomeSource.value,accountId:els.entryAccount.value}; upsert('incomes',obj); }
    if(type==='note'){ obj={...obj,tag:els.noteTag.value.trim()}; upsert('notes',obj); }
    if(type==='debt'){ obj={...obj,amount,status:els.debtStatus.value,accountId:els.entryAccount.value,peopleIds:selectedPeople}; upsert('debts',obj); }
    if(type==='recurring'){ obj={...obj,amount,repeat:els.recurringRepeat.value,accountId:els.entryAccount.value,peopleIds:selectedPeople,categoryIds:selectedCategories}; upsert('recurringExpenses',obj); }
    log(`${els.editingId.value?'Updated':'Added'} ${type}: ${obj.title}`); save(`${type} saved locally`); toast('Saved locally. It will sync when internet is available.'); clearForm(); renderAll(); if(type==='note') nav('notes'); else nav('entries'); autoSync(); }
  function upsert(key,obj){ const arr=state[key]; const i=arr.findIndex(x=>x.id===obj.id); if(i>=0) arr[i]={...arr[i],...obj,createdAt:arr[i].createdAt}; else arr.unshift(obj); }
  function allEntries(){ return [...state.expenses,...state.incomes,...state.notes,...state.debts,...state.recurringExpenses].sort((a,b)=>String(b.date).localeCompare(String(a.date)) || String(b.updatedAt).localeCompare(String(a.updatedAt))); }
  function renderEntries(){ els.customRangeWrap.classList.toggle('hidden',els.filterRange.value!=='custom'); let list=allEntries(); const type=els.filterType.value; if(type!=='all') list=list.filter(x=>x.type===type); list=filterByRange(list, els.filterRange.value); const q=(els.globalSearch.value||'').toLowerCase().trim(); if(q) list=list.filter(x=>searchText(x).includes(q)); const net=list.reduce((t,x)=>t+(x.type==='income'?Number(x.amount)||0:x.type==='expense'?-(Number(x.amount)||0):0),0); els.entriesCount.textContent=`${list.length} entries`; els.entriesSum.textContent=`${money(net)} net`; renderTimeline(els.entriesTimeline,list); }
  function filterByRange(list,range){ const now=new Date(); const iso=todayISO(); if(range==='all') return list; if(range==='today') return list.filter(x=>x.date===iso); if(range==='yesterday'){ const d=new Date(); d.setDate(d.getDate()-1); return list.filter(x=>x.date===d.toISOString().slice(0,10)); } if(range==='week'){ const d=new Date(); d.setDate(d.getDate()-d.getDay()); const start=d.toISOString().slice(0,10); return list.filter(x=>x.date>=start&&x.date<=iso); } if(range==='custom') return list.filter(x=>(!els.rangeFrom.value||x.date>=els.rangeFrom.value)&&(!els.rangeTo.value||x.date<=els.rangeTo.value)); return list.filter(x=>(x.date||'').startsWith(state.settings.selectedMonth)); }
  function searchText(x){ const people=(x.peopleIds||[]).map(id=>nameById(state.people,id)).join(' '); const cats=(x.categoryIds||[]).map(id=>nameById(state.categories,id)).join(' '); return [x.type,x.title,x.description,x.amount,x.date,x.source,x.tag,x.status,x.repeat,people,cats].join(' ').toLowerCase(); }
  function renderTimeline(root,list){ root.innerHTML = list.length? list.map(cardHtml).join('') : `<div class="panel"><p class="muted">No entries found.</p></div>`; root.onclick = e=>{ const edit=e.target.closest('[data-edit]'), del=e.target.closest('[data-delete]'); if(edit) editEntry(edit.dataset.type, edit.dataset.id); if(del) deleteEntry(del.dataset.type, del.dataset.id); }; }
  function cardHtml(x){ const amt = x.amount?`<span class="amount ${x.type}">${x.type==='income'?'+':x.type==='expense'?'-':''}${money(x.amount)}</span>`:''; const tags=[x.type, ...(x.peopleIds||[]).map(id=>nameById(state.people,id)), ...(x.categoryIds||[]).map(id=>nameById(state.categories,id)), x.source, x.tag, x.status, x.repeat, x.necessary===false?'Unnecessary':x.necessary===true?'Necessary':''].filter(Boolean).slice(0,8); return `<article class="entry-card"><div class="row"><div><h4>${esc(x.title||x.type)}</h4><small class="muted">${esc(x.date||'')} · ${esc(x.description||'No description')}</small></div>${amt}</div><div class="tag-row">${tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><div class="actions"><button class="btn tiny soft" data-edit="1" data-type="${x.type}" data-id="${x.id}">Edit</button><button class="btn tiny danger" data-delete="1" data-type="${x.type}" data-id="${x.id}">Delete</button></div></article>`; }
  function editEntry(type,id){ const [key,item]=findEntry(type,id); if(!item) return; nav('add'); setAddType(type,false); els.editingId.value=id; els.editingType.value=type; els.entryType.value=type; els.entryDate.value=item.date||todayISO(); els.entryAmount.value=item.amount||''; els.entryTitle.value=item.title||''; els.entryDescription.value=item.description||''; els.entryAccount.value=item.accountId||state.accounts[0]?.id||''; selectedPeople=[...(item.peopleIds||[])]; selectedCategories=[...(item.categoryIds||[])]; els.entryNecessary.checked=item.necessary!==false; els.incomeSource.value=item.source||'Other Income'; els.noteTag.value=item.tag||''; els.debtStatus.value=item.status||'receivable'; els.recurringRepeat.value=item.repeat||'monthly'; setAddType(type,false); renderChips(); }
  function deleteEntry(type,id){ const [key,item,index]=findEntry(type,id); if(!item) return; if(!confirm(`Delete ${item.title || type}?`)) return; state[key].splice(index,1); lastDeleted={key,item,index}; log(`Deleted ${type}: ${item.title}`); save(`${type} deleted locally`); renderAll(); showUndo(`${item.title} deleted.`); autoSync(); }
  function findEntry(type,id){ const map={expense:'expenses',income:'incomes',note:'notes',debt:'debts',recurring:'recurringExpenses'}; const key=map[type]; const index=state[key]?.findIndex(x=>x.id===id); return [key,state[key]?.[index],index]; }
  function showUndo(text){ els.undoText.textContent=text; els.undoBar.classList.remove('hidden'); setTimeout(()=>els.undoBar.classList.add('hidden'),8000); }
  function undoDelete(){ if(!lastDeleted) return; state[lastDeleted.key].splice(lastDeleted.index,0,lastDeleted.item); save('Undo delete'); lastDeleted=null; els.undoBar.classList.add('hidden'); renderAll(); }
  function quickAdd(kind,name,select){ name=(name||'').trim(); if(!name) return toast(`Enter ${kind} name first.`); const obj={id:slug(name),name,active:true}; if(kind==='person'){ if(!state.people.find(x=>x.id===obj.id)) state.people.push(obj); if(select&&!selectedPeople.includes(obj.id)) selectedPeople.push(obj.id); els.quickPersonName.value=''; els.settingsPersonInput.value=''; }
    if(kind==='category'){ if(!state.categories.find(x=>x.id===obj.id)) state.categories.push(obj); if(select&&!selectedCategories.includes(obj.id)) selectedCategories.push(obj.id); els.quickCategoryName.value=''; els.settingsCategoryInput.value=''; }
    if(kind==='account'){ if(!state.accounts.find(x=>x.id===obj.id)) state.accounts.push({...obj,openingBalance:0}); els.settingsAccountInput.value=''; }
    log(`Added ${kind}: ${name}`); save(`${kind} added`); renderAll(); }
  function renderReports(){ const t=totals(); const byPeople={}; t.expenses.forEach(e=>(e.peopleIds||['combined-general']).forEach(id=>byPeople[id]=(byPeople[id]||0)+e.amount)); rank(els.personReport, byPeople, state.people, 'person'); const byCat={}; t.expenses.forEach(e=>(e.categoryIds||['other']).forEach(id=>byCat[id]=(byCat[id]||0)+e.amount)); rank(els.categoryReport, byCat, state.categories, 'category'); const byInc={}; t.incomes.forEach(i=>byInc[i.source||'Other Income']=(byInc[i.source||'Other Income']||0)+i.amount); rankRaw(els.incomeReport, byInc); const bals=accountBalances(); rankRaw(els.accountReport, Object.fromEntries(state.accounts.map(a=>[a.name,bals[a.id]||0]))); drawPie(els.necessaryChart,[['Necessary',t.nec],['Unnecessary',t.un]]); drawLine(els.dailyChart,dailyTotals(t.expenses)); }
  function rank(root,obj,ref){ const max=Math.max(1,...Object.values(obj)); const items=Object.entries(obj).sort((a,b)=>b[1]-a[1]); root.innerHTML=items.length?items.map(([id,v])=>`<div class="rank-item"><strong>${esc(nameById(ref,id))}</strong><span>${money(v)}</span><div class="bar-line"><span style="width:${Math.round(v/max*100)}%"></span></div></div>`).join(''):`<p class="muted">No data yet.</p>`; }
  function rankRaw(root,obj){ const max=Math.max(1,...Object.values(obj)); const items=Object.entries(obj).filter(x=>x[1]!==0).sort((a,b)=>b[1]-a[1]); root.innerHTML=items.length?items.map(([n,v])=>`<div class="rank-item"><strong>${esc(n)}</strong><span>${money(v)}</span><div class="bar-line"><span style="width:${Math.round(Math.abs(v)/max*100)}%"></span></div></div>`).join(''):`<p class="muted">No data yet.</p>`; }
  function accountBalances(){ const bals={}; state.accounts.forEach(a=>bals[a.id]=Number(a.openingBalance)||0); state.incomes.forEach(i=>bals[i.accountId]=(bals[i.accountId]||0)+Number(i.amount||0)); state.expenses.forEach(e=>bals[e.accountId]=(bals[e.accountId]||0)-Number(e.amount||0)); return bals; }
  function dailyTotals(expenses){ const days=new Date(Number(state.settings.selectedMonth.slice(0,4)),Number(state.settings.selectedMonth.slice(5,7)),0).getDate(); const data=Array.from({length:days},(_,i)=>0); expenses.forEach(e=>{ const d=Number((e.date||'').slice(8,10)); if(d) data[d-1]+=Number(e.amount)||0; }); return data; }
  function drawPie(canvas,data){ const ctx=canvas.getContext('2d'); const w=canvas.width=canvas.clientWidth*devicePixelRatio, h=canvas.height=canvas.clientHeight*devicePixelRatio; ctx.clearRect(0,0,w,h); const total=data.reduce((a,b)=>a+b[1],0)||1; let start=-Math.PI/2; const colors=['#174f3f','#d39a38']; data.forEach((d,i)=>{ const ang=d[1]/total*Math.PI*2; ctx.beginPath(); ctx.moveTo(w/2,h/2); ctx.arc(w/2,h/2,Math.min(w,h)/3,start,start+ang); ctx.closePath(); ctx.fillStyle=colors[i]; ctx.fill(); start+=ang; }); ctx.fillStyle='#13261f'; ctx.font=`${13*devicePixelRatio}px sans-serif`; ctx.fillText(`Necessary ${Math.round(data[0][1]/total*100)}%`,12*devicePixelRatio,22*devicePixelRatio); }
  function drawLine(canvas,data){ const ctx=canvas.getContext('2d'); const w=canvas.width=canvas.clientWidth*devicePixelRatio, h=canvas.height=canvas.clientHeight*devicePixelRatio; ctx.clearRect(0,0,w,h); const max=Math.max(1,...data); ctx.strokeStyle='#174f3f'; ctx.lineWidth=3*devicePixelRatio; ctx.beginPath(); data.forEach((v,i)=>{ const x=14*devicePixelRatio+i*(w-28*devicePixelRatio)/(data.length-1||1); const y=h-16*devicePixelRatio-(v/max)*(h-34*devicePixelRatio); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); }
  function renderCalendar(){ const mk=state.settings.selectedMonth, y=+mk.slice(0,4), m=+mk.slice(5,7)-1; const first=new Date(y,m,1), days=new Date(y,m+1,0).getDate(); const expenseByDate={}; monthFilter(state.expenses).forEach(e=>{ expenseByDate[e.date]=expenseByDate[e.date]||{sum:0,tags:new Set()}; expenseByDate[e.date].sum+=Number(e.amount)||0; (e.peopleIds||[]).slice(0,2).forEach(id=>expenseByDate[e.date].tags.add(nameById(state.people,id).split(' ')[0])); }); let html=''; for(let i=0;i<first.getDay();i++) html+='<div class="cal-cell blank"></div>'; for(let d=1;d<=days;d++){ const date=`${mk}-${String(d).padStart(2,'0')}`, x=expenseByDate[date]; html+=`<button class="cal-cell" data-date="${date}"><strong>${d}</strong>${x?`<div class="total">${money(x.sum)}</div><div class="tags">${[...x.tags].map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}</button>`; } els.calendarGrid.innerHTML=html; els.calendarGrid.onclick=e=>{ const c=e.target.closest('[data-date]'); if(c) dayDetails(c.dataset.date); }; }
  function dayDetails(date){ const list=allEntries().filter(x=>x.date===date); els.dayDetails.innerHTML=`<h3>${new Date(date+'T12:00:00').toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h3><p class="muted">${list.length} records found for this date.</p><div class="timeline">${list.map(cardHtml).join('')||'<p class="muted">No entries.</p>'}</div>`; els.dayDetails.onclick=e=>{ const edit=e.target.closest('[data-edit]'), del=e.target.closest('[data-delete]'); if(edit) editEntry(edit.dataset.type, edit.dataset.id); if(del) deleteEntry(del.dataset.type, del.dataset.id); } }
  async function unlockNotes(){ if(!state.settings.notesPinHash){ els.notesError.textContent='Set a notes code first.'; return; } if(await hash(els.notesPinInput.value)===state.settings.notesPinHash){ notesUnlocked=true; els.notesPinInput.value=''; renderNotesLock(); } else els.notesError.textContent='Incorrect notes code.'; }
  async function setNotesPinQuick(){ if(!els.notesPinInput.value) return els.notesError.textContent='Type a new code first.'; state.settings.notesPinHash=await hash(els.notesPinInput.value); els.notesPinInput.value=''; notesUnlocked=true; save('Notes PIN saved'); renderNotesLock(); toast('Notes code saved.'); }
  function renderNotesLock(){ els.notesLockBox.classList.toggle('hidden',notesUnlocked); els.notesArea.classList.toggle('hidden',!notesUnlocked); if(notesUnlocked) renderNotes(); }
  function renderNotes(){ let list=state.notes.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))); const q=(els.notesSearch.value||'').toLowerCase(); if(q) list=list.filter(n=>[n.title,n.description,n.tag].join(' ').toLowerCase().includes(q)); els.notesList.innerHTML=list.length?list.map(n=>`<article class="note-card"><h3>${esc(n.title)}</h3><p class="muted">${esc(n.description||'No description')}</p><div class="tag-row">${n.tag?`<span class="tag">${esc(n.tag)}</span>`:''}<span class="tag">${esc(n.date)}</span></div><div class="actions"><button class="btn tiny soft" data-edit="1" data-type="note" data-id="${n.id}">Edit</button><button class="btn tiny danger" data-delete="1" data-type="note" data-id="${n.id}">Delete</button></div></article>`).join(''):`<div class="panel"><p class="muted">No notes yet. Tap + Note to create one.</p></div>`; els.notesList.onclick=e=>{ const edit=e.target.closest('[data-edit]'), del=e.target.closest('[data-delete]'); if(edit) editEntry('note',edit.dataset.id); if(del) deleteEntry('note',del.dataset.id); }; }
  function renderSettings(){ const b=state.settings.budget; els.settingExpectedIncome.value=b.expectedIncome||''; els.settingSavingTarget.value=b.savingTarget||''; els.settingNecessaryLimit.value=b.necessaryLimit||''; els.settingUnnecessaryLimit.value=b.unnecessaryLimit||''; els.syncUrl.value=state.settings.syncUrl||''; els.syncMessage.textContent=state.meta.syncMessage||''; els.settingsPeopleList.innerHTML=settingItems(state.people,'people'); els.settingsCategoryList.innerHTML=settingItems(state.categories,'categories'); els.settingsAccountList.innerHTML=settingItems(state.accounts,'accounts'); $$('.settings-item button').forEach(btn=>btn.onclick=()=>{ const list=state[btn.dataset.list]; const it=list.find(x=>x.id===btn.dataset.id); if(it){ it.active=!it.active; save('Setting updated'); renderAll(); } }); }
  function settingItems(list,key){ return list.map(x=>`<div class="settings-item"><span>${esc(x.name)} <small class="muted">${x.active?'Active':'Hidden'}</small></span><button class="btn tiny soft" data-list="${key}" data-id="${x.id}">${x.active?'Hide':'Show'}</button></div>`).join(''); }
  function saveBudget(){ state.settings.budget={expectedIncome:+els.settingExpectedIncome.value||0,savingTarget:+els.settingSavingTarget.value||0,necessaryLimit:+els.settingNecessaryLimit.value||0,unnecessaryLimit:+els.settingUnnecessaryLimit.value||0}; save('Budget updated'); renderAll(); toast('Budget saved.'); }
  async function savePins(){ state.settings.pinHash = els.appPinInput.value ? await hash(els.appPinInput.value) : ''; state.settings.notesPinHash = els.notesPinSettingInput.value ? await hash(els.notesPinSettingInput.value) : state.settings.notesPinHash; els.appPinInput.value=''; els.notesPinSettingInput.value=''; save('PIN settings saved'); toast('PIN settings saved.'); }
  function updateSyncStatus(){ const q=(state.meta.syncQueue||[]).length; const status=!navigator.onLine?'offline':state.meta.syncPending?'pending':'online'; els.syncStatus.className=`status-pill ${status}`; els.syncText.textContent=!navigator.onLine?`Offline${q?' · '+q+' pending':''}`:state.meta.syncPending?`Pending sync${q?' · '+q:''}`:'Synced'; updateOfflinePanel(); }

  function updateOfflinePanel(){
    const panel = document.getElementById('offlinePanel');
    if(!panel) return;
    const q = (state.meta.syncQueue||[]).length;
    const size = new Blob([JSON.stringify(state)]).size;
    const cacheText = state.meta.offlineReady ? 'Ready' : 'Preparing';
    panel.innerHTML = `
      <div class="mini-grid">
        <div class="mini-card"><span class="muted">Connection</span><strong>${navigator.onLine?'Online':'Offline'}</strong><small class="muted">The app can still open and save records without internet.</small></div>
        <div class="mini-card"><span class="muted">Pending changes</span><strong>${q}</strong><small class="muted">These changes will push to Google Sheet when internet is available.</small></div>
        <div class="mini-card"><span class="muted">Offline database</span><strong>${cacheText}</strong><small class="muted">Data is kept locally and mirrored to IndexedDB for stronger offline use.</small></div>
        <div class="mini-card"><span class="muted">Last sync</span><strong>${state.meta.lastSyncAt?new Date(state.meta.lastSyncAt).toLocaleString('en-PK'):'Never'}</strong><small class="muted">Shows the last successful Google Sheet sync.</small></div>
        <div class="mini-card"><span class="muted">Local data size</span><strong>${Math.max(1,Math.round(size/1024))} KB</strong><small class="muted">Approximate app data stored on this device.</small></div>
        <div class="mini-card"><span class="muted">Google Sheet</span><strong>${state.settings.syncUrl?'Connected':'Not set'}</strong><small class="muted">Add the Apps Script URL to enable cloud backup.</small></div>
      </div>`;
  }
  async function autoSync(){ if(navigator.onLine && state.settings.syncUrl && state.meta.syncPending) await syncNow(false); }
  async function syncNow(show=true){ if(!state.settings.syncUrl) return toast('Add Google Apps Script URL first.'); if(!navigator.onLine) return toast('Offline. Saved locally and will sync later.'); try{ const res=await fetch(state.settings.syncUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'saveState',state})}); const json=await res.json(); if(!json.ok) throw new Error(json.error||'Sync failed'); state.meta.lastSyncAt=new Date().toISOString(); state.meta.syncPending=false; state.meta.syncQueue=[]; state.meta.syncMessage='Synced to Google Sheet.'; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); mirrorToOfflineDB(); updateSyncStatus(); renderSettings(); if(show) toast('Synced to Google Sheet.'); }catch(e){ state.meta.syncMessage='Sync failed. Data is still saved locally.'; save('Sync failed'); if(show) toast('Sync failed. Local data is safe.'); console.error(e); } }
  async function importSheet(){ if(!state.settings.syncUrl) return toast('Add Google Apps Script URL first.'); if(!navigator.onLine) return toast('Internet is required to import from Sheet.'); if(!confirm('Import Sheet will replace local data on this device. Continue?')) return; try{ const res=await fetch(state.settings.syncUrl+'?action=getState'); const json=await res.json(); if(!json.ok || !json.state) throw new Error(json.error||'No state found'); const keepUrl=state.settings.syncUrl; state=normalize(json.state); state.settings.syncUrl=state.settings.syncUrl||keepUrl; localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); mirrorToOfflineDB(); renderAll(); toast('Imported from Google Sheet.'); }catch(e){ toast('Import failed.'); console.error(e); } }
  function exportJson(){ download(`family-expense-backup-${Date.now()}.json`, JSON.stringify(state,null,2),'application/json'); }
  function exportCsv(){ const rows=[['type','date','title','description','amount','people','categories','source','account','necessary','status','tag']]; allEntries().forEach(x=>rows.push([x.type,x.date,x.title,x.description,x.amount||'',(x.peopleIds||[]).map(id=>nameById(state.people,id)).join('|'),(x.categoryIds||[]).map(id=>nameById(state.categories,id)).join('|'),x.source||'',nameById(state.accounts,x.accountId)||'',x.necessary===undefined?'':x.necessary,x.status||'',x.tag||''])); download(`family-expense-entries-${Date.now()}.csv`, rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n'),'text/csv'); }
  function importBackup(e){ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const next=normalize(JSON.parse(r.result)); const keepUrl=state.settings.syncUrl; state=next; state.settings.syncUrl=state.settings.syncUrl||keepUrl; localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); mirrorToOfflineDB(); save('Backup imported'); renderAll(); toast('Backup imported.'); }catch(err){ toast('Invalid backup file.'); } }; r.readAsText(f); e.target.value=''; }
  function resetLocal(){ exportJson(); if(confirm('Reset all local data on this device? A JSON backup has been downloaded first.')){ state=initialState(); localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); mirrorToOfflineDB(); renderAll(); toast('Local data reset.'); } }
  function download(name,content,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  function nameById(list,id){ return (list.find(x=>x.id===id)||{}).name || id || ''; }
  function esc(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function toast(msg){ els.toast.textContent=msg; els.toast.classList.remove('hidden'); setTimeout(()=>els.toast.classList.add('hidden'),3200); }
  init();
})();
