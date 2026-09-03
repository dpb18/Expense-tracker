/**
 * Spentify - Full Dashboard Controller Logic (Income, Expenses & Net Balance Intelligence)
 */

document.addEventListener('DOMContentLoaded', async () => {
  let activeTimeRange = 'month';
  let activeCategoryChartType = 'expense';
  let modalCurrentType = 'expense';
  let trendChartInstance = null;
  let categoryChartInstance = null;

  // Auth Elements
  const dashAuthGate = document.getElementById('dashAuthGate');
  const dashGoogleSignInBtn = document.getElementById('dashGoogleSignInBtn');
  const googleAuthBtn = document.getElementById('googleAuthBtn');
  const navUserName = document.getElementById('navUserName');
  const navUserAvatar = document.getElementById('navUserAvatar');
  const navDefaultG = document.getElementById('navDefaultG');
  const dashSignOutBtn = document.getElementById('dashSignOutBtn');

  // DOM Elements
  const currencySelect = document.getElementById('currencySelect');
  const timeFilterTabs = document.getElementById('timeFilterTabs');
  const kpiNetBalance = document.getElementById('kpiNetBalance');
  const kpiNetSubtext = document.getElementById('kpiNetSubtext');
  const kpiTotalIncome = document.getElementById('kpiTotalIncome');
  const kpiTotalIncomeSubtext = document.getElementById('kpiTotalIncomeSubtext');
  const kpiMonthSpend = document.getElementById('kpiMonthSpend');
  const kpiMonthSubtext = document.getElementById('kpiMonthSubtext');
  const kpiSavingsRate = document.getElementById('kpiSavingsRate');
  const kpiBudgetLimit = document.getElementById('kpiBudgetLimit');
  const kpiBudgetBadge = document.getElementById('kpiBudgetBadge');
  const kpiProgressBar = document.getElementById('kpiProgressBar');
  const categoryChartTabs = document.getElementById('categoryChartTabs');
  const categoryChartSubtitle = document.getElementById('categoryChartSubtitle');
  const categoryLegendList = document.getElementById('categoryLegendList');
  const expensesTableBody = document.getElementById('expensesTableBody');
  const tableEmptyState = document.getElementById('tableEmptyState');
  const transactionsCount = document.getElementById('transactionsCount');
  const searchInput = document.getElementById('searchInput');
  const tableTypeFilter = document.getElementById('tableTypeFilter');
  const tableCategoryFilter = document.getElementById('tableCategoryFilter');
  const tablePaymentFilter = document.getElementById('tablePaymentFilter');
  const tableSortSelect = document.getElementById('tableSortSelect');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const backupJsonBtn = document.getElementById('backupJsonBtn');
  const importJsonInput = document.getElementById('importJsonInput');
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  const addIncomeBtn = document.getElementById('addIncomeBtn');
  const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
  const emptyStateAddIncomeBtn = document.getElementById('emptyStateAddIncomeBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const dashToast = document.getElementById('dashToast');

  // Modals
  const expenseModal = document.getElementById('expenseModal');
  const modalExpenseForm = document.getElementById('modalExpenseForm');
  const modalTypeSwitcher = document.getElementById('modalTypeSwitcher');
  const modalTitle = document.getElementById('modalTitle');
  const editExpenseId = document.getElementById('editExpenseId');
  const modalAmount = document.getElementById('modalAmount');
  const modalTitleInput = document.getElementById('modalTitleInput');
  const modalTitleLabel = document.getElementById('modalTitleLabel');
  const modalCategorySelect = document.getElementById('modalCategorySelect');
  const modalCategoryLabel = document.getElementById('modalCategoryLabel');
  const modalPaymentSelect = document.getElementById('modalPaymentSelect');
  const modalDateInput = document.getElementById('modalDateInput');
  const modalTimeInput = document.getElementById('modalTimeInput');
  const modalNotesInput = document.getElementById('notesInput') || document.getElementById('modalNotesInput');
  const saveExpenseModalBtn = document.getElementById('saveExpenseModalBtn');
  const closeExpenseModalBtn = document.getElementById('closeExpenseModalBtn');
  const cancelExpenseModalBtn = document.getElementById('cancelExpenseModalBtn');

  const settingsModal = document.getElementById('settingsModal');
  const settingsForm = document.getElementById('settingsForm');
  const settingMonthlyBudget = document.getElementById('settingMonthlyBudget');
  const settingDailyBudget = document.getElementById('settingDailyBudget');
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

  const kpiCreditDues = document.getElementById('kpiCreditDues');
  const kpiCreditDuesSubtext = document.getElementById('kpiCreditDuesSubtext');
  const creditCenterTotalDues = document.getElementById('creditCenterTotalDues');
  const creditCardDueVal = document.getElementById('creditCardDueVal');
  const lazyPayDueVal = document.getElementById('lazyPayDueVal');
  const flipkartPay3DueVal = document.getElementById('flipkartPay3DueVal');
  const timelineMonth1Label = document.getElementById('timelineMonth1Label');
  const timelineMonth1Val = document.getElementById('timelineMonth1Val');
  const timelineMonth1Sub = document.getElementById('timelineMonth1Sub');
  const timelineMonth2Label = document.getElementById('timelineMonth2Label');
  const timelineMonth2Val = document.getElementById('timelineMonth2Val');
  const timelineMonth2Sub = document.getElementById('timelineMonth2Sub');
  const timelineMonth3Label = document.getElementById('timelineMonth3Label');
  const timelineMonth3Val = document.getElementById('timelineMonth3Val');
  const timelineMonth3Sub = document.getElementById('timelineMonth3Sub');
  const modalInstallmentHint = document.getElementById('modalInstallmentHint');
  const modalInstallmentHintText = document.getElementById('modalInstallmentHintText');
  const creditItemsList = document.getElementById('creditItemsList');
  const creditItemsCount = document.getElementById('creditItemsCount');

  // Top View Navigation
  let currentMainView = 'expenses';
  const tabNavExpenses = document.getElementById('tabNavExpenses');
  const tabNavAssets = document.getElementById('tabNavAssets');
  const expensesViewContainer = document.getElementById('expensesViewContainer');
  const assetsViewContainer = document.getElementById('assetsViewContainer');
  const assetHeaderActions = document.getElementById('assetHeaderActions');
  const navAssetsCountBadge = document.getElementById('navAssetsCountBadge');

  // Asset Elements
  const addAssetBtn = document.getElementById('addAssetBtn');
  const addAssetHeroBtn = document.getElementById('addAssetHeroBtn');
  const emptyStateAddAssetBtn = document.getElementById('emptyStateAddAssetBtn');
  const kpiAssetInvested = document.getElementById('kpiAssetInvested');
  const kpiAssetInvestedSub = document.getElementById('kpiAssetInvestedSub');
  const kpiAssetCurrentVal = document.getElementById('kpiAssetCurrentVal');
  const kpiAssetCurrentValSub = document.getElementById('kpiAssetCurrentValSub');
  const kpiAssetReturns = document.getElementById('kpiAssetReturns');
  const kpiAssetReturnsSub = document.getElementById('kpiAssetReturnsSub');
  const kpiAssetMonthlySip = document.getElementById('kpiAssetMonthlySip');
  const kpiAssetMonthlySipSub = document.getElementById('kpiAssetMonthlySipSub');
  const assetLegendList = document.getElementById('assetLegendList');
  const assetCatCardsList = document.getElementById('assetCatCardsList');
  const assetTotalCountBadge = document.getElementById('assetTotalCountBadge');
  const assetsCountPill = document.getElementById('assetsCountPill');
  const assetSearchInput = document.getElementById('assetSearchInput');
  const assetCategoryFilter = document.getElementById('assetCategoryFilter');
  const assetPlatformFilter = document.getElementById('assetPlatformFilter');
  const assetsTableBody = document.getElementById('assetsTableBody');
  const assetsEmptyState = document.getElementById('assetsEmptyState');

  // Asset Modals
  const assetModal = document.getElementById('assetModal');
  const assetModalTitle = document.getElementById('assetModalTitle');
  const assetModalForm = document.getElementById('assetModalForm');
  const editAssetId = document.getElementById('editAssetId');
  const assetNameInput = document.getElementById('assetNameInput');
  const assetCategorySelect = document.getElementById('assetCategorySelect');
  const assetPlatformSelect = document.getElementById('assetPlatformSelect');
  const assetInvestedInput = document.getElementById('assetInvestedInput');
  const assetCurrentValInput = document.getElementById('assetCurrentValInput');
  const assetIsSipCheck = document.getElementById('assetIsSipCheck');
  const sipFieldsRow = document.getElementById('sipFieldsRow');
  const assetMonthlySipInput = document.getElementById('assetMonthlySipInput');
  const assetSipDayInput = document.getElementById('assetSipDayInput');
  const assetUnitsInput = document.getElementById('assetUnitsInput');
  const assetUnitTypeInput = document.getElementById('assetUnitTypeInput');
  const assetDateInput = document.getElementById('assetDateInput');
  const assetNotesInput = document.getElementById('assetNotesInput');
  const closeAssetModalBtn = document.getElementById('closeAssetModalBtn');
  const cancelAssetModalBtn = document.getElementById('cancelAssetModalBtn');

  // Topup Modal
  const assetTopupModal = document.getElementById('assetTopupModal');
  const assetTopupForm = document.getElementById('assetTopupForm');
  const topupAssetId = document.getElementById('topupAssetId');
  const topupAssetInfoText = document.getElementById('topupAssetInfoText');
  const topupAmountInput = document.getElementById('topupAmountInput');
  const topupDateInput = document.getElementById('topupDateInput');
  const topupNoteInput = document.getElementById('topupNoteInput');
  const closeTopupModalBtn = document.getElementById('closeTopupModalBtn');
  const cancelTopupModalBtn = document.getElementById('cancelTopupModalBtn');

  let assetChartInstance = null;

  // Launch Google Sign In
  if (dashGoogleSignInBtn) {
    dashGoogleSignInBtn.addEventListener('click', async () => {
      dashGoogleSignInBtn.disabled = true;
      dashGoogleSignInBtn.innerHTML = '<span>Connecting to Google...</span>';

      try {
        const res = await window.db.signInWithGoogle();
        if (res && res.success && res.user) {
          showToast(`Welcome ${res.user.displayName || res.user.email}!`);
          checkDashboardAuth();
        } else if (res && res.error) {
          alert('Google Sign-In: ' + res.error);
        }
      } catch (err) {
        alert('Google Sign-In Error: ' + err.message);
      } finally {
        dashGoogleSignInBtn.disabled = false;
        dashGoogleSignInBtn.innerHTML = `
          <svg class="google-svg-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z"/>
          </svg>
          <span>Sign in with Google</span>
        `;
      }
    });
  }

  // Sign out
  if (dashSignOutBtn) {
    dashSignOutBtn.addEventListener('click', async () => {
      if (confirm(`Do you want to sign out from Google?`)) {
        await window.db.signOutGoogle();
        showToast('Signed out from Google');
        checkDashboardAuth();
      }
    });
  }

  // Google Header Button (Sign In if logged out)
  if (googleAuthBtn) {
    googleAuthBtn.addEventListener('click', async () => {
      if (!window.db.currentUser || window.db.currentUser.isLocal) {
        try {
          showToast('Connecting to Google...');
          const res = await window.db.signInWithGoogle();
          if (res && res.success && res.user) {
            showToast(`Welcome ${res.user.displayName || res.user.email}!`);
            checkDashboardAuth();
          } else if (res && res.error) {
            alert('Google Sign-In: ' + res.error);
          }
        } catch (err) {
          alert('Google Sign-In Error: ' + err.message);
        }
      }
    });
  }

  function checkDashboardAuth() {
    if (dashAuthGate) dashAuthGate.style.display = 'none';

    if (window.db.currentUser && !window.db.currentUser.isLocal) {
      googleAuthBtn.classList.add('signed-in');
      navUserName.textContent = window.db.currentUser.displayName || window.db.currentUser.email;

      if (window.db.currentUser.photoURL) {
        navUserAvatar.src = window.db.currentUser.photoURL;
        navUserAvatar.style.display = 'inline-block';
        navDefaultG.style.display = 'none';
      } else {
        navUserAvatar.style.display = 'none';
        navDefaultG.style.display = 'inline-flex';
      }
      dashSignOutBtn.style.display = 'inline-flex';
    } else {
      googleAuthBtn.classList.remove('signed-in');
      navUserName.textContent = '☁️ Cloud Sync (Sign In)';
      navUserAvatar.style.display = 'none';
      navDefaultG.style.display = 'inline-flex';
      dashSignOutBtn.style.display = 'none';
    }

    if (!trendChartInstance) initCharts();
    refreshDashboard();
  }

  // --- Filter Event Listeners ---

  timeFilterTabs.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      timeFilterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTimeRange = tab.dataset.range;
      refreshDashboard();
    });
  });

  if (categoryChartTabs) {
    categoryChartTabs.querySelectorAll('.chart-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        categoryChartTabs.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategoryChartType = tab.dataset.chartType;
        if (categoryChartSubtitle) {
          categoryChartSubtitle.textContent = activeCategoryChartType === 'income' ? 'Income sources distribution' : 'Where your money is going';
        }
        const filtered = getFilteredExpenses();
        const summary = window.db.getSummary(filtered);
        updateCategoryChart(summary);
      });
    });
  }

  currencySelect.addEventListener('change', async () => {
    const currKey = currencySelect.value;
    const currObj = window.CURRENCIES[currKey] || { symbol: '₹' };
    await window.db.saveSettings({
      currency: currKey,
      currencySymbol: currObj.symbol
    });
    updateCurrencyDisplay();
    refreshDashboard();
    showToast(`Currency changed to ${currKey} (${currObj.symbol})`);
  });

  searchInput.addEventListener('input', () => renderTable());
  if (tableTypeFilter) tableTypeFilter.addEventListener('change', () => {
    populateCategoryDropdowns();
    renderTable();
  });
  tableCategoryFilter.addEventListener('change', () => renderTable());
  tablePaymentFilter.addEventListener('change', () => renderTable());
  tableSortSelect.addEventListener('change', () => renderTable());

  // Modal installment live hint listeners
  modalAmount.addEventListener('input', () => updateModalInstallmentHint());
  modalPaymentSelect.addEventListener('change', () => updateModalInstallmentHint());

  function updateModalInstallmentHint() {
    if (!modalInstallmentHint) return;
    const amt = parseFloat(modalAmount.value) || 0;
    const payMethod = modalPaymentSelect.value;
    const symbol = window.db.settings.currencySymbol || '₹';

    if (modalCurrentType === 'expense' && payMethod === 'flipkart_pay3') {
      modalInstallmentHint.style.display = 'flex';
      const perMo = Math.round(amt / 3);
      modalInstallmentHintText.textContent = `Split into 3 monthly payments of ${symbol}${perMo.toLocaleString('en-IN')} / mo (Not deducted from current cash)`;
    } else if (modalCurrentType === 'expense' && ['credit_card', 'lazypay'].includes(payMethod)) {
      modalInstallmentHint.style.display = 'flex';
      modalInstallmentHintText.textContent = `Paid next month (Will not deduct from in-hand cash balance)`;
    } else {
      modalInstallmentHint.style.display = 'none';
    }
  }

  // --- Export & Import ---

  exportCsvBtn.addEventListener('click', () => {
    window.db.exportCSV();
    showToast('Exported CSV spreadsheet');
  });

  backupJsonBtn.addEventListener('click', () => {
    window.db.exportJSON();
    showToast('Downloaded JSON backup');
  });

  importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const res = await window.db.importJSON(evt.target.result);
      if (res.success) {
        showToast(`Imported ${res.count} transactions successfully!`);
      } else {
        alert('Import failed: ' + res.error);
      }
      importJsonInput.value = '';
    };
    reader.readAsText(file);
  });

  // --- Modal Triggers ---

  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
      openExpenseModalForAdd('expense');
    });
  }

  if (addIncomeBtn) {
    addIncomeBtn.addEventListener('click', () => {
      openExpenseModalForAdd('income');
    });
  }

  if (emptyStateAddBtn) {
    emptyStateAddBtn.addEventListener('click', () => {
      openExpenseModalForAdd('expense');
    });
  }

  if (emptyStateAddIncomeBtn) {
    emptyStateAddIncomeBtn.addEventListener('click', () => {
      openExpenseModalForAdd('income');
    });
  }

  if (modalTypeSwitcher) {
    modalTypeSwitcher.querySelectorAll('.modal-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        setModalType(type);
      });
    });
  }

  function setModalType(type) {
    modalCurrentType = type;
    if (modalTypeSwitcher) {
      modalTypeSwitcher.querySelectorAll('.modal-type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
      });
    }

    if (type === 'income') {
      modalTitle.textContent = editExpenseId.value ? 'Edit Income' : 'Record Income';
      modalTitleLabel.textContent = 'Income Source / Title *';
      modalTitleInput.placeholder = 'e.g. Monthly Salary, Freelance project, Dividend';
      modalCategoryLabel.textContent = 'Income Category *';
      saveExpenseModalBtn.textContent = 'Save Income';
      saveExpenseModalBtn.className = 'btn btn-success';

      // Hide credit payment options in income mode
      Array.from(modalPaymentSelect.options).forEach(opt => {
        if (['credit_card', 'lazypay', 'flipkart_pay3'].includes(opt.value)) {
          opt.style.display = 'none';
        } else {
          opt.style.display = 'block';
        }
      });
      modalPaymentSelect.value = 'bank';
    } else {
      modalTitle.textContent = editExpenseId.value ? 'Edit Expense' : 'Log Expense';
      modalTitleLabel.textContent = 'Expense Title *';
      modalTitleInput.placeholder = 'e.g. Swiggy Lunch, Auto, Groceries';
      modalCategoryLabel.textContent = 'Expense Category *';
      saveExpenseModalBtn.textContent = 'Save Expense';
      saveExpenseModalBtn.className = 'btn btn-primary';

      Array.from(modalPaymentSelect.options).forEach(opt => {
        opt.style.display = 'block';
      });
      modalPaymentSelect.value = 'upi';
    }

    populateModalCategories(type);
    updateModalInstallmentHint();
  }

  closeExpenseModalBtn.addEventListener('click', () => closeExpenseModal());
  cancelExpenseModalBtn.addEventListener('click', () => closeExpenseModal());

  settingsBtn.addEventListener('click', () => {
    settingMonthlyBudget.value = window.db.settings.monthlyBudget || 25000;
    settingDailyBudget.value = window.db.settings.dailyBudget || 800;
    settingsModal.style.display = 'flex';
  });

  closeSettingsModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');
  cancelSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mb = parseFloat(settingMonthlyBudget.value) || 25000;
    const db = parseFloat(settingDailyBudget.value) || Math.round(mb / 30);
    await window.db.saveSettings({ monthlyBudget: mb, dailyBudget: db });
    settingsModal.style.display = 'none';
    refreshDashboard();
    showToast('Budget settings updated');
  });

  // Modal Form Submit (Add or Edit)
  modalExpenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.db.currentUser || window.db.currentUser.isLocal) {
      alert('Please sign in with Google to save transactions.');
      return;
    }

    const amount = parseFloat(modalAmount.value);
    const title = modalTitleInput.value.trim();
    const category = modalCategorySelect.value;
    const paymentMethod = modalPaymentSelect.value;
    const date = modalDateInput.value;
    const time = modalTimeInput.value;
    const notes = modalNotesInput ? modalNotesInput.value : '';
    const type = modalCurrentType;

    if (isNaN(amount) || amount <= 0 || !title) return;

    try {
      const id = editExpenseId.value;
      if (id) {
        await window.db.updateExpense(id, { type, amount, title, category, paymentMethod, date, time, notes });
        showToast(`Updated ${type === 'income' ? 'income' : 'expense'} "${title}"`);
      } else {
        await window.db.addExpense({ type, amount, title, category, paymentMethod, date, time, notes, source: 'dashboard' });
        showToast(`Logged new ${type === 'income' ? 'income' : 'expense'} "${title}"`);
      }
    } catch (err) {
      console.error('Save transaction error:', err);
      showToast(err.message || 'Error saving transaction');
    } finally {
      closeExpenseModal();
      refreshDashboard();
    }
  });

  // --- Helper Functions ---

  function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function populateModalCategories(type) {
    modalCategorySelect.innerHTML = '';
    const cats = type === 'income'
      ? (window.db.settings.incomeCategories || window.DEFAULT_SETTINGS.incomeCategories || [])
      : (window.db.settings.categories || window.DEFAULT_SETTINGS.categories || []);

    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.icon} ${cat.name}`;
      modalCategorySelect.appendChild(opt);
    });
  }

  function populateCategoryDropdowns() {
    const selectedType = tableTypeFilter ? tableTypeFilter.value : 'all';
    tableCategoryFilter.innerHTML = '<option value="all">All Categories</option>';

    let catsToShow = [];
    if (selectedType === 'income') {
      catsToShow = window.db.settings.incomeCategories || window.DEFAULT_SETTINGS.incomeCategories || [];
    } else if (selectedType === 'expense') {
      catsToShow = window.db.settings.categories || window.DEFAULT_SETTINGS.categories || [];
    } else {
      catsToShow = [
        ...(window.db.settings.categories || window.DEFAULT_SETTINGS.categories || []),
        ...(window.db.settings.incomeCategories || window.DEFAULT_SETTINGS.incomeCategories || [])
      ];
    }

    catsToShow.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.icon} ${cat.name}`;
      tableCategoryFilter.appendChild(opt);
    });

    populateModalCategories(modalCurrentType);
  }

  function formatCurrency(val) {
    const symbol = window.db.settings.currencySymbol || '₹';
    return `${symbol}${Math.round(val).toLocaleString('en-IN')}`;
  }

  function updateCurrencyDisplay() {
    const symbol = window.db.settings.currencySymbol || '₹';
    document.querySelectorAll('.modalCurrencySymbol').forEach(el => el.textContent = symbol);
  }

  function openExpenseModalForAdd(initialType = 'expense') {
    if (!window.db.currentUser || window.db.currentUser.isLocal) {
      alert('Please sign in with Google to record expenses or income.');
      if (googleAuthBtn) googleAuthBtn.click();
      return;
    }

    editExpenseId.value = '';
    modalAmount.value = '';
    modalTitleInput.value = '';
    if (modalNotesInput) modalNotesInput.value = '';
    const now = new Date();
    modalDateInput.value = getLocalDateString(now);
    modalTimeInput.value = now.toTimeString().split(' ')[0].substr(0, 5);

    setModalType(initialType);
    expenseModal.style.display = 'flex';
    modalAmount.focus();
  }

  function openExpenseModalForEdit(item) {
    editExpenseId.value = item.id;
    modalAmount.value = item.amount;
    modalTitleInput.value = item.title;
    modalPaymentSelect.value = item.paymentMethod || 'upi';
    modalDateInput.value = item.date;
    modalTimeInput.value = item.time || '12:00';
    if (modalNotesInput) modalNotesInput.value = item.notes || '';

    setModalType(item.type || 'expense');
    modalCategorySelect.value = item.category;

    expenseModal.style.display = 'flex';
    modalAmount.focus();
  }

  function closeExpenseModal() {
    if (expenseModal) {
      expenseModal.style.display = 'none';
    }
    editExpenseId.value = '';
    modalAmount.value = '';
    modalTitleInput.value = '';
    if (modalNotesInput) modalNotesInput.value = '';
  }

  function getFilteredExpenses() {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return window.db.expenses.filter(item => {
      if (!item || !item.date) return false;
      if (activeTimeRange === 'today') return item.date === todayStr;

      const parts = item.date.split('-').map(Number);
      if (parts.length < 3) return true;
      const itemYear = parts[0];
      const itemMonth = parts[1] - 1; // 0-indexed
      const itemDay = parts[2];

      if (activeTimeRange === 'month') {
        return itemYear === currentYear && itemMonth === currentMonth;
      }

      const itemDate = new Date(itemYear, itemMonth, itemDay);
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffTime = todayMidnight - itemDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (activeTimeRange === 'week') {
        return diffDays >= -1 && diffDays < 7;
      }
      if (activeTimeRange === 'last30') {
        return diffDays >= -1 && diffDays < 30;
      }
      return true;
    });
  }

  function refreshDashboard() {
    if (!window.db.currentUser) return;

    const filtered = getFilteredExpenses();
    const summary = window.db.getSummary(filtered);
    const globalSummary = window.db.getSummary();
    const now = new Date();

    // 3-Month Projection Month Names
    const m1Name = now.toLocaleDateString('en-IN', { month: 'short' });
    const m2Date = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const m2Name = m2Date.toLocaleDateString('en-IN', { month: 'short' });
    const m3Date = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const m3Name = m3Date.toLocaleDateString('en-IN', { month: 'short' });

    if (timelineMonth1Label) timelineMonth1Label.textContent = `${m1Name} (Current Month)`;
    if (timelineMonth2Label) timelineMonth2Label.textContent = `${m2Name} (Next Month Bill)`;
    if (timelineMonth3Label) timelineMonth3Label.textContent = `${m3Name} (Month After Next)`;

    // Update KPI 1: Liquid Cash in Hand (Not deducting credit cards/LazyPay)
    const liquidCash = summary.liquidCashBalance || 0;
    const effectiveNet = summary.effectiveNetBalance || 0;
    const earnedInc = summary.periodEarnedIncome || 0;
    const rollInc = summary.periodRolloverIncome || 0;

    if (kpiNetBalance) {
      kpiNetBalance.textContent = `${liquidCash >= 0 ? '+' : '-'}${formatCurrency(Math.abs(liquidCash))}`;
      kpiNetBalance.className = `kpi-value ${liquidCash >= 0 ? 'amount-income' : 'amount-expense'}`;
    }
    if (kpiNetSubtext) {
      if (summary.totalCreditDues > 0) {
        kpiNetSubtext.innerHTML = `In-Hand Cash: <strong>${formatCurrency(liquidCash)}</strong> • Net after CC Dues: <strong style="color:#fbbf24;">${formatCurrency(effectiveNet)}</strong>`;
      } else if (rollInc > 0 && earnedInc > 0) {
        kpiNetSubtext.innerHTML = `In-Hand Cash (Salary: +${formatCurrency(earnedInc)} + Rollover: +${formatCurrency(rollInc)} - Spends: ${formatCurrency(summary.periodDirectExpense || 0)})`;
      } else if (rollInc > 0) {
        kpiNetSubtext.innerHTML = `In-Hand Cash (Opening B/F: +${formatCurrency(rollInc)} - Spends: ${formatCurrency(summary.periodDirectExpense || 0)})`;
      } else {
        kpiNetSubtext.textContent = `In-Hand Cash (Income: +${formatCurrency(earnedInc)} - Cash Out: ${formatCurrency(summary.periodDirectExpense || 0)})`;
      }
    }

    // Update KPI 2: Credit & BNPL Upcoming Dues
    if (kpiCreditDues) {
      kpiCreditDues.textContent = `${formatCurrency(summary.totalCreditDues || 0)}`;
      if (kpiCreditDuesSubtext) {
        kpiCreditDuesSubtext.textContent = `Cards: ${formatCurrency(summary.creditCardDues || 0)} • LazyPay: ${formatCurrency(summary.lazyPayDues || 0)} • Pay 3: ${formatCurrency(summary.flipkartPay3Total || 0)}`;
      }
    }

    // Update KPI 3: Total Income (Real Earned Income vs Rollover)
    if (kpiTotalIncome) kpiTotalIncome.textContent = `+${formatCurrency(earnedInc)}`;
    const incCount = filtered.filter(i => i.type === 'income').length;
    if (kpiTotalIncomeSubtext) {
      if (rollInc > 0) {
        if (earnedInc > 0) {
          kpiTotalIncomeSubtext.innerHTML = `Earned: <strong>+${formatCurrency(earnedInc)}</strong> • <span style="color:#60a5fa;font-weight:600;">+ ${formatCurrency(rollInc)} Rollover B/F</span>`;
        } else {
          kpiTotalIncomeSubtext.innerHTML = `<span style="color:#60a5fa;font-weight:600;">${formatCurrency(rollInc)} Opening Balance B/F</span>`;
        }
      } else if (activeTimeRange === 'month' && summary.previousMonthClosingBalance > 0) {
        kpiTotalIncomeSubtext.innerHTML = `${incCount} income ${incCount === 1 ? 'entry' : 'entries'} • Prev Balance: <span style="color:#60a5fa;">${formatCurrency(summary.previousMonthClosingBalance)}</span>`;
      } else {
        kpiTotalIncomeSubtext.textContent = `${incCount} income ${incCount === 1 ? 'entry' : 'entries'} in period`;
      }
    }

    // Update KPI 4: Total Spends (Direct Cash + Deferred Credit)
    if (kpiMonthSpend) kpiMonthSpend.textContent = `${formatCurrency(summary.periodExpense || 0)}`;
    const expCount = filtered.filter(i => i.type !== 'income').length;
    if (kpiMonthSubtext) kpiMonthSubtext.textContent = `Direct: ${formatCurrency(summary.periodDirectExpense || 0)} • Credit: ${formatCurrency(summary.periodCreditExpense || 0)}`;

    // Update Dedicated Credit & BNPL Center
    if (creditCenterTotalDues) creditCenterTotalDues.textContent = formatCurrency(summary.totalCreditDues || 0);
    if (creditCardDueVal) creditCardDueVal.textContent = formatCurrency(summary.creditCardDues || 0);
    if (lazyPayDueVal) lazyPayDueVal.textContent = formatCurrency(summary.lazyPayDues || 0);
    if (flipkartPay3DueVal) flipkartPay3DueVal.textContent = formatCurrency(summary.flipkartPay3Total || 0);

    const m2Cc = (summary.timelineSchedule && summary.timelineSchedule.nextMonth) ? summary.timelineSchedule.nextMonth.creditCard || 0 : 0;
    const m2Lp = (summary.timelineSchedule && summary.timelineSchedule.nextMonth) ? summary.timelineSchedule.nextMonth.lazyPay || 0 : 0;
    const m2P3 = (summary.timelineSchedule && summary.timelineSchedule.nextMonth) ? summary.timelineSchedule.nextMonth.flipkartPay3 || 0 : 0;
    const m1P3 = (summary.timelineSchedule && summary.timelineSchedule.currentMonth) ? summary.timelineSchedule.currentMonth.flipkartPay3 || 0 : 0;
    const m3P3 = (summary.timelineSchedule && summary.timelineSchedule.month3) ? summary.timelineSchedule.month3.flipkartPay3 || 0 : 0;

    if (timelineMonth1Val) timelineMonth1Val.textContent = formatCurrency((summary.timelineSchedule && summary.timelineSchedule.currentMonth) ? summary.timelineSchedule.currentMonth.total || 0 : 0);
    if (timelineMonth1Sub) {
      timelineMonth1Sub.textContent = m1P3 > 0 ? `📦 Flipkart Pay in 3: ${formatCurrency(m1P3)}` : '0 dues this month';
    }

    if (timelineMonth2Val) timelineMonth2Val.textContent = formatCurrency((summary.timelineSchedule && summary.timelineSchedule.nextMonth) ? summary.timelineSchedule.nextMonth.total || 0 : 0);
    if (timelineMonth2Sub) {
      const parts = [];
      if (m2Cc > 0) parts.push(`💳 CC: ${formatCurrency(m2Cc)}`);
      if (m2Lp > 0) parts.push(`🛍️ LazyPay: ${formatCurrency(m2Lp)}`);
      if (m2P3 > 0) parts.push(`📦 Pay 3: ${formatCurrency(m2P3)}`);
      timelineMonth2Sub.textContent = parts.length > 0 ? parts.join(' • ') : 'No upcoming statement dues';
    }

    if (timelineMonth3Val) timelineMonth3Val.textContent = formatCurrency((summary.timelineSchedule && summary.timelineSchedule.month3) ? summary.timelineSchedule.month3.total || 0 : 0);
    if (timelineMonth3Sub) {
      timelineMonth3Sub.textContent = m3P3 > 0 ? `📦 Flipkart Pay in 3: ${formatCurrency(m3P3)}` : '0 dues in Month 3';
    }

    // Render Credit & BNPL Active Statements List
    if (creditItemsList) {
      const creditItems = (window.db.expenses || []).filter(e => 
        e.type !== 'income' && ['credit_card', 'card', 'lazypay', 'flipkart_pay3'].includes(e.paymentMethod)
      );

      if (creditItemsCount) {
        creditItemsCount.textContent = `${creditItems.length} unsettled ${creditItems.length === 1 ? 'charge' : 'charges'}`;
      }

      if (creditItems.length === 0) {
        creditItemsList.innerHTML = `
          <div style="text-align: center; padding: 18px; color: #64748b; font-size: 12px;">
            No unsettled credit card, LazyPay, or Pay in 3 purchases recorded.
          </div>
        `;
      } else {
        const allCategories = [
          ...(window.db.settings.categories || []),
          ...(window.db.settings.incomeCategories || [])
        ];
        const symbol = window.db.settings.currencySymbol || '₹';

        creditItemsList.innerHTML = creditItems.slice(0, 10).map(item => {
          const catObj = allCategories.find(c => c.id === item.category) || { icon: '📦', name: 'Other', color: '#64748b' };
          let payBadge = '';
          let dueScheduleText = '';

          if (item.paymentMethod === 'credit_card' || item.paymentMethod === 'card') {
            payBadge = `<span class="credit-due-pill">💳 Credit Card</span>`;
            dueScheduleText = `Due in <strong>${m2Name}</strong> statement bill (Paid next month)`;
          } else if (item.paymentMethod === 'lazypay') {
            payBadge = `<span class="credit-due-pill">🛍️ LazyPay</span>`;
            dueScheduleText = `Due in <strong>${m2Name}</strong> bill cycle (Paid next month)`;
          } else if (item.paymentMethod === 'flipkart_pay3') {
            const perMo = Math.round(item.amount / 3);
            payBadge = `<span class="credit-due-pill emi">📦 Flipkart Pay in 3</span>`;
            dueScheduleText = `Split across 3 months (3 x ${symbol}${perMo.toLocaleString('en-IN')}/mo in ${m1Name}, ${m2Name}, ${m3Name})`;
          }

          return `
            <div class="credit-item-row">
              <div class="credit-item-left">
                <span class="credit-item-icon">${catObj.icon}</span>
                <div>
                  <div class="credit-item-title">${escapeHtml(item.title)}</div>
                  <div class="credit-item-meta">${item.date} • ${catObj.name} • ${dueScheduleText}</div>
                </div>
              </div>
              <div class="credit-item-right">
                ${payBadge}
                <div class="credit-item-amt">${symbol}${Math.round(item.amount || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Update Budget Bar
    if (kpiProgressBar) kpiProgressBar.style.width = `${globalSummary.budgetUsedPercent || 0}%`;
    if (kpiBudgetLimit) kpiBudgetLimit.textContent = `Budget: ${formatCurrency(globalSummary.monthlyBudget || 25000)}`;

    const savings = summary.savingsRate || 0;
    if (kpiBudgetBadge) {
      if (savings >= 20) {
        kpiBudgetBadge.textContent = `${savings}% Saved`;
        kpiBudgetBadge.className = 'budget-badge';
      } else if (savings > 0) {
        kpiBudgetBadge.textContent = 'Moderate';
        kpiBudgetBadge.className = 'budget-badge warning';
      } else {
        kpiBudgetBadge.textContent = 'Tight';
        kpiBudgetBadge.className = 'budget-badge danger';
      }
    }

    updateCharts(filtered, summary);
    renderTable();
  }

  // --- Chart.js Initializations & Updates ---

  function initCharts() {
    if (typeof Chart === 'undefined') return;

    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChartInstance = new Chart(trendCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Income',
            data: [],
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderRadius: 6,
            borderSkipped: false,
            hoverBackgroundColor: '#34d399'
          },
          {
            label: 'Expenses',
            data: [],
            backgroundColor: 'rgba(99, 102, 241, 0.75)',
            borderRadius: 6,
            borderSkipped: false,
            hoverBackgroundColor: '#818cf8'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const symbol = window.db.settings.currencySymbol || '₹';
                return ` ${context.dataset.label}: ${symbol}${Math.round(context.parsed.y).toLocaleString('en-IN')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#64748b',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: (val) => `${window.db.settings.currencySymbol || '₹'}${val}`
            }
          }
        }
      }
    });

    const catCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderWidth: 2,
          borderColor: '#111827'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const symbol = window.db.settings.currencySymbol || '₹';
                return ` ${context.label}: ${symbol}${Math.round(context.parsed).toLocaleString('en-IN')}`;
              }
            }
          }
        }
      }
    });
  }

  function updateCharts(filteredExpenses, summary) {
    if (!trendChartInstance || !categoryChartInstance) {
      initCharts();
    }
    if (!trendChartInstance || !categoryChartInstance) return;

    const daysMap = {};
    const dateLabels = [];
    const dateIncomes = [];
    const dateExpenses = [];
    const daysToShow = activeTimeRange === 'week' ? 7 : (activeTimeRange === 'last30' ? 30 : (activeTimeRange === 'today' ? 1 : 14));

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = getLocalDateString(d);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      daysMap[dateKey] = { income: 0, expense: 0 };
      dateLabels.push(label);
    }

    filteredExpenses.forEach(e => {
      if (daysMap[e.date]) {
        if (e.type === 'income') {
          daysMap[e.date].income += (parseFloat(e.amount) || 0);
        } else {
          daysMap[e.date].expense += (parseFloat(e.amount) || 0);
        }
      }
    });

    Object.keys(daysMap).forEach(k => {
      dateIncomes.push(daysMap[k].income);
      dateExpenses.push(daysMap[k].expense);
    });

    trendChartInstance.data.labels = dateLabels;
    trendChartInstance.data.datasets[0].data = dateIncomes;
    trendChartInstance.data.datasets[1].data = dateExpenses;
    trendChartInstance.update();

    updateCategoryChart(summary);
  }

  function updateCategoryChart(summary) {
    if (!categoryChartInstance) return;

    const catLabels = [];
    const catData = [];
    const catColors = [];
    const activeCategories = [];

    const isIncome = activeCategoryChartType === 'income';
    const categoriesList = isIncome
      ? (window.db.settings.incomeCategories || window.DEFAULT_SETTINGS.incomeCategories || [])
      : (window.db.settings.categories || window.DEFAULT_SETTINGS.categories || []);
    const totalsMap = isIncome ? summary.incomeCategoryTotals : summary.expenseCategoryTotals;
    const totalAmount = isIncome ? (summary.periodTotalInflow || summary.periodIncome) : summary.periodExpense;

    categoriesList.forEach(cat => {
      const total = totalsMap[cat.id] || 0;
      if (total > 0) {
        catLabels.push(cat.name);
        catData.push(total);
        catColors.push(cat.color);
        activeCategories.push({ ...cat, total });
      }
    });

    if (catData.length === 0) {
      catLabels.push('No data');
      catData.push(1);
      catColors.push('#334155');
    }

    categoryChartInstance.data.labels = catLabels;
    categoryChartInstance.data.datasets[0].data = catData;
    categoryChartInstance.data.datasets[0].backgroundColor = catColors;
    categoryChartInstance.update();

    renderCategoryLegend(activeCategories, totalAmount, isIncome);
  }

  function renderCategoryLegend(categories, totalAmount, isIncome) {
    categoryLegendList.innerHTML = '';
    if (categories.length === 0) {
      categoryLegendList.innerHTML = `<div class="empty-state">No ${isIncome ? 'income' : 'expense'} recorded in this period</div>`;
      return;
    }

    categories.sort((a, b) => b.total - a.total);

    categories.forEach(cat => {
      const pct = totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100) : 0;
      const el = document.createElement('div');
      el.className = 'legend-item';
      el.innerHTML = `
        <div class="legend-left">
          <span class="legend-dot" style="background-color: ${cat.color};"></span>
          <span>${cat.icon} ${cat.name} <small style="color: #64748b;">(${pct}%)</small></span>
        </div>
        <span class="legend-val ${isIncome ? 'amount-income' : ''}">${isIncome ? '+' : '-'}${formatCurrency(cat.total)}</span>
      `;
      categoryLegendList.appendChild(el);
    });
  }

  // --- Table View Rendering ---

  function renderTable() {
    let list = getFilteredExpenses();
    const query = searchInput.value.toLowerCase().trim();
    const typeFilter = tableTypeFilter ? tableTypeFilter.value : 'all';
    const catFilter = tableCategoryFilter.value;
    const payFilter = tablePaymentFilter.value;
    const sortBy = tableSortSelect.value;
    const symbol = window.db.settings.currencySymbol || '₹';

    if (typeFilter !== 'all') {
      list = list.filter(e => (e.type || 'expense') === typeFilter);
    }

    if (query) {
      list = list.filter(e =>
        (e.title && e.title.toLowerCase().includes(query)) ||
        (e.notes && e.notes.toLowerCase().includes(query)) ||
        (e.category && e.category.toLowerCase().includes(query))
      );
    }

    if (catFilter !== 'all') list = list.filter(e => e.category === catFilter);
    if (payFilter !== 'all') list = list.filter(e => e.paymentMethod === payFilter);

    list.sort((a, b) => {
      if (sortBy === 'date-desc') return (b.timestamp || 0) - (a.timestamp || 0);
      if (sortBy === 'date-asc') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortBy === 'amount-desc') return (b.amount || 0) - (a.amount || 0);
      if (sortBy === 'amount-asc') return (a.amount || 0) - (b.amount || 0);
      return 0;
    });

    transactionsCount.textContent = `${list.length} entries`;

    if (list.length === 0) {
      expensesTableBody.innerHTML = '';
      tableEmptyState.style.display = 'block';
      return;
    }

    tableEmptyState.style.display = 'none';
    expensesTableBody.innerHTML = '';

    const allCategories = [
      ...(window.db.settings.categories || []),
      ...(window.db.settings.incomeCategories || [])
    ];

    list.forEach(item => {
      const isIncome = item.type === 'income';
      const isRollover = isIncome && (item.category === 'savings_rollover' || item.category === 'opening_balance' || (typeof isRolloverItem === 'function' && isRolloverItem(item)));
      const isDeferred = !isIncome && ['credit_card', 'card', 'lazypay', 'flipkart_pay3'].includes(item.paymentMethod);
      const catObj = allCategories.find(c => c.id === item.category) || { icon: isRollover ? '🔄' : (isIncome ? '💰' : '📦'), name: isRollover ? 'Savings Rollover / B/F' : (isIncome ? 'Income' : 'Other'), color: isRollover ? '#64748b' : '#64748b' };
      const payObj = window.db.settings.paymentMethods.find(p => p.id === item.paymentMethod) || { icon: isIncome ? '🏦' : '⚡', name: isIncome ? 'Bank' : 'UPI' };

      let payBadgeHtml = '';
      if (item.paymentMethod === 'credit_card' || item.paymentMethod === 'card') {
        payBadgeHtml = `<span class="badge-deferred">💳 Credit Card (Next Mo)</span>`;
      } else if (item.paymentMethod === 'lazypay') {
        payBadgeHtml = `<span class="badge-deferred">🛍️ LazyPay (Next Mo)</span>`;
      } else if (item.paymentMethod === 'flipkart_pay3') {
        const perMo = Math.round(item.amount / 3);
        payBadgeHtml = `<span class="badge-deferred" style="border-color:#818cf8;color:#a5b4fc;">📦 Pay in 3 (3x ${symbol}${perMo.toLocaleString('en-IN')})</span>`;
      } else {
        payBadgeHtml = `<span class="badge-pill">${payObj.icon} ${payObj.name}</span>`;
      }

      let typeBadgeHtml = '';
      if (isRollover) {
        typeBadgeHtml = `<span class="type-badge" style="background: rgba(100, 116, 139, 0.18); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3);">🔄 Rollover / B/F</span>`;
      } else if (isIncome) {
        typeBadgeHtml = `<span class="type-badge income">💰 Income</span>`;
      } else {
        typeBadgeHtml = `<span class="type-badge expense">💸 Expense</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          ${typeBadgeHtml}
        </td>
        <td>
          <div class="table-expense-cell">
            <span class="table-cat-icon">${catObj.icon}</span>
            <span class="table-expense-title">${escapeHtml(item.title)}</span>
          </div>
        </td>
        <td>
          <span class="badge-pill" style="color: ${catObj.color}; border: 1px solid ${catObj.color}40;">
            ${catObj.name}
          </span>
        </td>
        <td>
          ${payBadgeHtml}
        </td>
        <td style="color: #94a3b8; font-size: 12px;">
          ${item.date} ${item.time ? `<small>at ${item.time}</small>` : ''}
        </td>
        <td style="color: #94a3b8; font-size: 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(item.notes || '-')}
        </td>
        <td class="text-right">
          <span class="table-amount ${isRollover ? '' : (isIncome ? 'amount-income' : (isDeferred ? 'amount-deferred' : ''))}" style="${isRollover ? 'color: #93c5fd;' : ''}">
            ${isIncome ? '+' : '-'}${symbol}${Math.round(item.amount || 0).toLocaleString('en-IN')}
            ${isRollover ? `<br><small style="font-size:10px;color:#60a5fa;font-weight:600;">(Opening Balance)</small>` : (isDeferred ? `<br><small style="font-size:10px;color:#fbbf24;font-weight:600;">(Deferred)</small>` : '')}
          </span>
        </td>
        <td class="text-center">
          <div class="table-actions">
            ${isIncome ? `
              <button class="btn-action-icon rollover-toggle-btn" title="${isRollover ? 'Mark as regular salary/income' : 'Mark as Savings Rollover (Opening Balance)'}" style="color: ${isRollover ? '#60a5fa' : '#94a3b8'};">
                <span style="font-size: 13px;">${isRollover ? '🔄' : '💼'}</span>
              </button>
            ` : ''}
            <button class="btn-action-icon edit-btn" title="Edit Entry">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-action-icon delete delete-btn" title="Delete Entry">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;

      const rollBtn = tr.querySelector('.rollover-toggle-btn');
      if (rollBtn) {
        rollBtn.addEventListener('click', async () => {
          const newCat = isRollover ? 'salary' : 'savings_rollover';
          await window.db.updateExpense(item.id, {
            category: newCat,
            isRollover: !isRollover
          });
          showToast(isRollover ? 'Converted to regular salary/income' : 'Marked as Savings Rollover (Opening Balance)');
          refreshDashboard();
        });
      }

      tr.querySelector('.edit-btn').addEventListener('click', () => openExpenseModalForEdit(item));
      tr.querySelector('.delete-btn').addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
          await window.db.deleteExpense(item.id);
          showToast('Entry deleted');
        }
      });

      expensesTableBody.appendChild(tr);
    });
  }

  function showToast(msg) {
    dashToast.textContent = msg;
    dashToast.classList.add('show');
    setTimeout(() => dashToast.classList.remove('show'), 2200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // =========================================================================
  // VIEW SWITCHING (CASH FLOW & EXPENSES vs YOUR ASSETS & INVESTMENTS)
  // =========================================================================

  function switchMainView(viewName) {
    currentMainView = viewName;
    if (viewName === 'assets') {
      if (tabNavExpenses) tabNavExpenses.classList.remove('active');
      if (tabNavAssets) tabNavAssets.classList.add('active');
      if (expensesViewContainer) expensesViewContainer.style.display = 'none';
      if (assetsViewContainer) assetsViewContainer.style.display = 'flex';
      refreshAssetsView();
    } else {
      if (tabNavAssets) tabNavAssets.classList.remove('active');
      if (tabNavExpenses) tabNavExpenses.classList.add('active');
      if (assetsViewContainer) assetsViewContainer.style.display = 'none';
      if (expensesViewContainer) expensesViewContainer.style.display = 'flex';
    }
  }

  if (tabNavExpenses) tabNavExpenses.addEventListener('click', () => switchMainView('expenses'));
  if (tabNavAssets) tabNavAssets.addEventListener('click', () => switchMainView('assets'));

  // =========================================================================
  // ASSET & WEALTH MANAGEMENT CONTROLLERS
  // =========================================================================

  function getFilteredAssets() {
    let list = [...(window.db.assets || [])];
    const catFilter = assetCategoryFilter ? assetCategoryFilter.value : 'all';
    const platFilter = assetPlatformFilter ? assetPlatformFilter.value : 'all';
    const query = assetSearchInput ? assetSearchInput.value.toLowerCase().trim() : '';

    if (catFilter !== 'all') {
      list = list.filter(a => a.category === catFilter);
    }
    if (platFilter !== 'all') {
      list = list.filter(a => a.platform === platFilter);
    }
    if (query) {
      list = list.filter(a => {
        const name = (a.name || '').toLowerCase();
        const notes = (a.notes || '').toLowerCase();
        const plat = (a.platform || '').toLowerCase();
        return name.includes(query) || notes.includes(query) || plat.includes(query);
      });
    }

    return list;
  }

  function initAssetChart() {
    const ctx = document.getElementById('assetChart');
    if (!ctx) return;

    if (assetChartInstance) {
      assetChartInstance.destroy();
      assetChartInstance = null;
    }

    assetChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: '#1e293b',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`
            }
          }
        }
      }
    });
  }

  function updateAssetChart(summary) {
    if (!assetChartInstance) initAssetChart();
    if (!assetChartInstance) return;

    const labels = [];
    const data = [];
    const colors = [];
    const catTotals = summary.categoryTotals || {};

    Object.keys(catTotals).forEach(catKey => {
      const c = catTotals[catKey];
      if (c.invested > 0 || c.currentValue > 0) {
        labels.push(`${c.icon} ${c.name}`);
        data.push(Math.round(c.currentValue || c.invested));
        colors.push(c.color || '#64748b');
      }
    });

    if (data.length === 0) {
      labels.push('No Assets');
      data.push(1);
      colors.push('#334155');
    }

    assetChartInstance.data.labels = labels;
    assetChartInstance.data.datasets[0].data = data;
    assetChartInstance.data.datasets[0].backgroundColor = colors;
    assetChartInstance.update();

    // Render legend
    if (assetLegendList) {
      assetLegendList.innerHTML = '';
      const totalVal = summary.totalCurrentValue || 1;
      Object.keys(catTotals).forEach(catKey => {
        const c = catTotals[catKey];
        if (c.invested > 0 || c.currentValue > 0) {
          const pct = Math.round(((c.currentValue || c.invested) / totalVal) * 100);
          const li = document.createElement('div');
          li.className = 'legend-item';
          li.innerHTML = `
            <div class="legend-left">
              <span class="legend-color-dot" style="background: ${c.color}"></span>
              <span class="legend-name">${c.icon} ${c.name}</span>
            </div>
            <div class="legend-right">
              <span class="legend-val">${formatCurrency(c.currentValue || c.invested)}</span>
              <span class="legend-pct" style="color: ${c.color}; font-weight:700;">${pct}%</span>
            </div>
          `;
          assetLegendList.appendChild(li);
        }
      });
    }
  }

  function renderAssetCategoryCards(summary) {
    if (!assetCatCardsList) return;
    assetCatCardsList.innerHTML = '';

    const catTotals = summary.categoryTotals || {};
    const relevantCats = ['gold', 'sip', 'stocks', 'fd'];

    relevantCats.forEach(catKey => {
      const c = catTotals[catKey];
      if (!c) return;

      const inv = c.invested || 0;
      const cur = c.currentValue || inv;
      const ret = cur - inv;
      const retPct = inv > 0 ? Math.round(((ret / inv) * 100) * 10) / 10 : 0;
      const badgeClass = ret > 0 ? 'positive' : (ret < 0 ? 'negative' : 'neutral');

      const card = document.createElement('div');
      card.className = 'asset-cat-card';
      card.innerHTML = `
        <div class="asset-cat-card-header">
          <span>${c.icon} ${c.name}</span>
          <span class="return-badge ${badgeClass}">${ret >= 0 ? '+' : ''}${retPct}%</span>
        </div>
        <div class="asset-cat-card-val">${formatCurrency(cur)}</div>
        <div class="asset-cat-card-sub">
          <span>Invested: ${formatCurrency(inv)}</span>
          <span style="color: ${ret >= 0 ? '#34d399' : '#f87171'}; font-weight: 600;">
            ${ret >= 0 ? '+' : ''}${formatCurrency(ret)}
          </span>
        </div>
      `;
      assetCatCardsList.appendChild(card);
    });
  }

  function renderAssetsTable() {
    if (!assetsTableBody) return;

    const filtered = getFilteredAssets();
    const symbol = (window.db.settings && window.db.settings.currencySymbol) || '₹';

    if (assetsCountPill) assetsCountPill.textContent = `${filtered.length} ${filtered.length === 1 ? 'holding' : 'holdings'}`;

    if (filtered.length === 0) {
      assetsTableBody.innerHTML = '';
      if (assetsEmptyState) assetsEmptyState.style.display = 'block';
      return;
    }

    if (assetsEmptyState) assetsEmptyState.style.display = 'none';
    assetsTableBody.innerHTML = '';

    const assetCats = (window.db.settings && window.db.settings.assetCategories) || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS.assetCategories : []);
    const assetPlatforms = (window.db.settings && window.db.settings.assetPlatforms) || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS.assetPlatforms : []);

    filtered.forEach(asset => {
      const catObj = assetCats.find(c => c.id === asset.category) || { icon: '🌐', name: 'Other', color: '#64748b' };
      const platObj = assetPlatforms.find(p => p.id === asset.platform) || { icon: '🌐', name: asset.platform || 'Other' };

      const inv = parseFloat(asset.investedAmount) || 0;
      const cur = (asset.currentValue !== undefined && !isNaN(parseFloat(asset.currentValue))) ? parseFloat(asset.currentValue) : inv;
      const ret = cur - inv;
      const retPct = inv > 0 ? Math.round(((ret / inv) * 100) * 100) / 100 : 0;
      const badgeClass = ret > 0 ? 'positive' : (ret < 0 ? 'negative' : 'neutral');

      let planDetailHtml = '';
      if (asset.isSip) {
        planDetailHtml = `<span class="badge-pill" style="border-color: #3b82f640; color: #60a5fa;">📊 SIP ${formatCurrency(asset.monthlySip || 0)}/mo <small>(Day ${asset.sipDay || 5})</small></span>`;
      } else {
        planDetailHtml = `<span style="font-size: 11.5px; color: #94a3b8;">One-Time Lumpsum</span>`;
      }

      let unitsBadge = '';
      if (asset.units && asset.units > 0) {
        unitsBadge = `<div style="font-size: 11px; color: #fbbf24; font-weight: 600;">${asset.units} ${escapeHtml(asset.unitType || '')}</div>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="table-expense-cell">
            <span class="table-cat-icon">${catObj.icon}</span>
            <div>
              <div class="table-expense-title">${escapeHtml(asset.name)}</div>
              ${unitsBadge}
              ${asset.notes ? `<small style="color: #94a3b8; font-size: 11px;">${escapeHtml(asset.notes)}</small>` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="badge-pill" style="color: ${catObj.color}; border: 1px solid ${catObj.color}40;">
            ${catObj.icon} ${catObj.name}
          </span>
        </td>
        <td>
          <span class="badge-pill" style="color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1);">
            ${platObj.icon} ${platObj.name}
          </span>
        </td>
        <td class="text-right" style="font-weight: 600; color: #e2e8f0;">
          ${formatCurrency(inv)}
        </td>
        <td class="text-right" style="font-weight: 700; color: #38bdf8;">
          ${formatCurrency(cur)}
        </td>
        <td class="text-right">
          <span class="return-badge ${badgeClass}">
            ${ret >= 0 ? '+' : ''}${formatCurrency(ret)} (${ret >= 0 ? '+' : ''}${retPct}%)
          </span>
        </td>
        <td>
          ${planDetailHtml}
        </td>
        <td style="color: #94a3b8; font-size: 12px;">
          ${asset.purchaseDate || '-'}
        </td>
        <td class="text-center">
          <div class="asset-row-actions">
            <button type="button" class="btn-topup-action topup-btn" title="Add installment / Top-up">
              + Top-up
            </button>
            <button type="button" class="btn-action-icon edit-asset-btn" title="Edit / Update Value">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button type="button" class="btn-action-icon delete delete-asset-btn" title="Delete Holding">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.topup-btn').addEventListener('click', () => openTopupModal(asset));
      tr.querySelector('.edit-asset-btn').addEventListener('click', () => openAssetModalForEdit(asset));
      tr.querySelector('.delete-asset-btn').addEventListener('click', async () => {
        if (confirm(`Are you sure you want to remove "${asset.name}" from your portfolio?`)) {
          await window.db.deleteAsset(asset.id);
          showToast('Asset removed from portfolio');
          refreshAssetsView();
        }
      });

      assetsTableBody.appendChild(tr);
    });
  }

  function refreshAssetsView() {
    const summary = window.db.getAssetSummary();

    // Badges
    if (navAssetsCountBadge) navAssetsCountBadge.textContent = window.db.assets.length;
    if (navAssetsCountBadge) navAssetsCountBadge.title = `${window.db.assets.length} Active Holdings`;
    const navBadge = document.getElementById('navAssetsBadge');
    if (navBadge) navBadge.textContent = formatCurrency(summary.totalCurrentValue);
    if (assetTotalCountBadge) assetTotalCountBadge.textContent = `${window.db.assets.length} holdings`;

    // KPIs
    if (kpiAssetInvested) kpiAssetInvested.textContent = formatCurrency(summary.totalInvested);
    if (kpiAssetInvestedSub) kpiAssetInvestedSub.textContent = `Across ${window.db.assets.length} active investments`;

    if (kpiAssetCurrentVal) kpiAssetCurrentVal.textContent = formatCurrency(summary.totalCurrentValue);
    if (kpiAssetCurrentValSub) kpiAssetCurrentValSub.textContent = `Valuation at today's price`;

    if (kpiAssetReturns) {
      kpiAssetReturns.textContent = `${summary.totalReturns >= 0 ? '+' : '-'}${formatCurrency(Math.abs(summary.totalReturns))}`;
      kpiAssetReturns.className = `kpi-value ${summary.totalReturns >= 0 ? 'amount-income' : 'amount-expense'}`;
    }
    if (kpiAssetReturnsSub) {
      kpiAssetReturnsSub.textContent = `${summary.returnPercentage >= 0 ? '+' : ''}${summary.returnPercentage}% overall portfolio return`;
      kpiAssetReturnsSub.style.color = summary.totalReturns >= 0 ? '#34d399' : '#f87171';
    }

    if (kpiAssetMonthlySip) kpiAssetMonthlySip.textContent = formatCurrency(summary.monthlySipTotal);
    if (kpiAssetMonthlySipSub) kpiAssetMonthlySipSub.textContent = `Committed monthly auto-debit`;

    // Donut Chart & Category Cards
    updateAssetChart(summary);
    renderAssetCategoryCards(summary);

    // Table
    renderAssetsTable();
  }

  // --- Asset Modal Actions ---

  function openAssetModalForAdd() {
    if (!window.db.currentUser || window.db.currentUser.isLocal) {
      alert('Please sign in with Google to add or manage your investment portfolio.');
      if (googleAuthBtn) googleAuthBtn.click();
      return;
    }

    editAssetId.value = '';
    assetModalTitle.textContent = 'Add Investment / Asset';
    assetNameInput.value = '';
    assetCategorySelect.value = 'sip';
    assetPlatformSelect.value = 'zerodha';
    assetInvestedInput.value = '';
    assetCurrentValInput.value = '';
    assetIsSipCheck.checked = false;
    sipFieldsRow.style.display = 'none';
    assetMonthlySipInput.value = '';
    assetSipDayInput.value = '5';
    assetUnitsInput.value = '';
    assetUnitTypeInput.value = 'units';
    assetDateInput.value = getLocalDateString(new Date());
    assetNotesInput.value = '';

    assetModal.style.display = 'flex';
    assetNameInput.focus();
  }

  function openAssetModalForEdit(asset) {
    if (!window.db.currentUser || window.db.currentUser.isLocal) {
      alert('Please sign in with Google to edit your portfolio.');
      return;
    }

    editAssetId.value = asset.id;
    assetModalTitle.textContent = 'Edit Investment / Asset';
    assetNameInput.value = asset.name || '';
    assetCategorySelect.value = asset.category || 'sip';
    assetPlatformSelect.value = asset.platform || 'other';
    assetInvestedInput.value = asset.investedAmount || 0;
    assetCurrentValInput.value = (asset.currentValue !== undefined) ? asset.currentValue : (asset.investedAmount || 0);
    assetIsSipCheck.checked = Boolean(asset.isSip);
    sipFieldsRow.style.display = asset.isSip ? 'flex' : 'none';
    assetMonthlySipInput.value = asset.monthlySip || '';
    assetSipDayInput.value = asset.sipDay || '5';
    assetUnitsInput.value = asset.units || '';
    assetUnitTypeInput.value = asset.unitType || '';
    assetDateInput.value = asset.purchaseDate || getLocalDateString(new Date());
    assetNotesInput.value = asset.notes || '';

    assetModal.style.display = 'flex';
    assetCurrentValInput.focus();
  }

  function closeAssetModal() {
    assetModal.style.display = 'none';
  }

  // Category change helper
  if (assetCategorySelect) {
    assetCategorySelect.addEventListener('change', () => {
      const cat = assetCategorySelect.value;
      if (cat === 'gold') {
        assetPlatformSelect.value = 'other';
        assetUnitTypeInput.value = 'grams';
      } else if (cat === 'stocks') {
        assetPlatformSelect.value = 'zerodha';
        assetUnitTypeInput.value = 'shares';
        assetIsSipCheck.checked = false;
        sipFieldsRow.style.display = 'none';
      } else if (cat === 'sip') {
        assetPlatformSelect.value = 'zerodha';
        assetUnitTypeInput.value = 'units';
        assetIsSipCheck.checked = true;
        sipFieldsRow.style.display = 'flex';
      }
    });
  }

  if (assetInvestedInput) {
    assetInvestedInput.addEventListener('input', () => {
      // Auto-mirror invested into current value if adding fresh
      if (!editAssetId.value && !assetCurrentValInput.value) {
        assetCurrentValInput.value = assetInvestedInput.value;
      }
    });
  }

  if (assetIsSipCheck) {
    assetIsSipCheck.addEventListener('change', () => {
      sipFieldsRow.style.display = assetIsSipCheck.checked ? 'flex' : 'none';
    });
  }

  if (addAssetBtn) addAssetBtn.addEventListener('click', openAssetModalForAdd);
  if (addAssetHeroBtn) addAssetHeroBtn.addEventListener('click', openAssetModalForAdd);
  if (emptyStateAddAssetBtn) emptyStateAddAssetBtn.addEventListener('click', openAssetModalForAdd);
  if (closeAssetModalBtn) closeAssetModalBtn.addEventListener('click', closeAssetModal);
  if (cancelAssetModalBtn) cancelAssetModalBtn.addEventListener('click', closeAssetModal);

  if (assetModalForm) {
    assetModalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!window.db.currentUser || window.db.currentUser.isLocal) {
        alert('Please sign in with Google to save investments.');
        return;
      }

      const id = editAssetId.value;
      const inv = parseFloat(assetInvestedInput.value) || 0;
      const cur = (assetCurrentValInput.value !== undefined && !isNaN(parseFloat(assetCurrentValInput.value))) ? parseFloat(assetCurrentValInput.value) : inv;

      const data = {
        name: assetNameInput.value.trim(),
        category: assetCategorySelect.value,
        platform: assetPlatformSelect.value,
        investedAmount: inv,
        currentValue: cur,
        isSip: assetIsSipCheck.checked,
        monthlySip: assetIsSipCheck.checked ? (parseFloat(assetMonthlySipInput.value) || 0) : 0,
        sipDay: parseInt(assetSipDayInput.value) || 5,
        units: parseFloat(assetUnitsInput.value) || 0,
        unitType: assetUnitTypeInput.value.trim(),
        purchaseDate: assetDateInput.value,
        notes: assetNotesInput.value.trim()
      };

      try {
        if (id) {
          await window.db.updateAsset(id, data);
          showToast(`Updated "${data.name}"`);
        } else {
          await window.db.addAsset(data);
          showToast(`Added "${data.name}" to your portfolio`);
        }
      } catch (err) {
        console.error('Save asset error:', err);
        showToast(err.message || 'Error saving asset');
      } finally {
        closeAssetModal();
        refreshAssetsView();
      }
    });
  }

  // --- Top-up / Installment Modal Actions ---

  function openTopupModal(asset) {
    if (!window.db.currentUser || window.db.currentUser.isLocal) {
      alert('Please sign in with Google to manage assets.');
      return;
    }

    topupAssetId.value = asset.id;
    if (topupAssetInfoText) {
      topupAssetInfoText.innerHTML = `Adding investment installment to: <strong style="color:#fde047;">${escapeHtml(asset.name)}</strong> (Current: ${formatCurrency(asset.investedAmount)})`;
    }
    topupAmountInput.value = asset.isSip && asset.monthlySip ? asset.monthlySip : '';
    topupDateInput.value = getLocalDateString(new Date());
    topupNoteInput.value = asset.isSip ? 'Monthly SIP installment' : 'Top-up addition';

    assetTopupModal.style.display = 'flex';
    topupAmountInput.focus();
  }

  function closeTopupModal() {
    assetTopupModal.style.display = 'none';
  }

  if (closeTopupModalBtn) closeTopupModalBtn.addEventListener('click', closeTopupModal);
  if (cancelTopupModalBtn) cancelTopupModalBtn.addEventListener('click', closeTopupModal);

  if (assetTopupForm) {
    assetTopupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!window.db.currentUser || window.db.currentUser.isLocal) {
        alert('Please sign in with Google to add top-up installments.');
        return;
      }

      const id = topupAssetId.value;
      const amt = parseFloat(topupAmountInput.value) || 0;
      const date = topupDateInput.value;
      const note = topupNoteInput.value.trim();

      if (amt <= 0) {
        alert('Please enter an amount greater than 0');
        return;
      }

      try {
        await window.db.addAssetTopup(id, amt, date, note);
        showToast(`+${formatCurrency(amt)} added to asset holding`);
      } catch (err) {
        console.error('Topup error:', err);
        showToast(err.message || 'Error adding topup');
      } finally {
        closeTopupModal();
        refreshAssetsView();
      }
    });
  }

  // Asset Filter Event Listeners
  if (assetCategoryFilter) assetCategoryFilter.addEventListener('change', renderAssetsTable);
  if (assetPlatformFilter) assetPlatformFilter.addEventListener('change', renderAssetsTable);
  if (assetSearchInput) assetSearchInput.addEventListener('input', renderAssetsTable);

  // --- Safe Initialization ---
  try {
    await window.db.init();
    
    // Clean up any previously seeded mock demo assets so portfolio starts clean at zero
    if (!window.db.assets) {
      window.db.assets = [];
    }
    if (window.db.assets.some(a => a.id && a.id.startsWith('ast_demo_'))) {
      window.db.assets = window.db.assets.filter(a => !a.id.startsWith('ast_demo_'));
      window.db.saveLocalData();
    }

    initCharts();
    initAssetChart();
    populateCategoryDropdowns();
    if (currencySelect) currencySelect.value = (window.db.settings && window.db.settings.currency) || 'INR';
    updateCurrencyDisplay();
    checkDashboardAuth();

    window.db.subscribe(() => {
      refreshDashboard();
      refreshAssetsView();
    });
    window.db.onAuthChange(() => checkDashboardAuth());

    // Explicitly refresh all sections, charts, credit center, table, and assets
    refreshDashboard();
    refreshAssetsView();
  } catch (err) {
    console.error('Spentify Dashboard initialization error:', err);
  }
});

