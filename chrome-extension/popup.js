/**
 * Spentify - Popup Controller Logic (1-Click Zero-Config Google Sign-In)
 */

document.addEventListener('DOMContentLoaded', async () => {
  let selectedType = 'expense';
  let selectedCategory = 'food';
  let selectedPaymentMethod = 'upi';

  // Auth Gate & Account Elements
  const authGateScreen = document.getElementById('authGateScreen');
  const authenticatedView = document.getElementById('authenticatedView');
  const googleSignInGateBtn = document.getElementById('googleSignInGateBtn');
  const googleUserPill = document.getElementById('googleUserPill');
  const googleUserEmail = document.getElementById('googleUserEmail');
  const navUserAvatarImg = document.getElementById('navUserAvatarImg');
  const defaultGIcon = document.getElementById('defaultGIcon');

  // Account Modal Elements
  const accountModal = document.getElementById('accountModal');
  const closeAccountModalBtn = document.getElementById('closeAccountModalBtn');
  const confirmSignOutBtn = document.getElementById('confirmSignOutBtn');
  const accountUserName = document.getElementById('accountUserName');
  const accountUserEmail = document.getElementById('accountUserEmail');
  const modalUserAvatar = document.getElementById('modalUserAvatar');

  // Form & Dashboard Elements
  const popupTypeSwitch = document.getElementById('popupTypeSwitch');
  const amountCard = document.getElementById('amountCard');
  const presetChipsRow = document.getElementById('presetChipsRow');
  const quickAddForm = document.getElementById('quickAddForm');
  const amountInput = document.getElementById('amountInput');
  const titleInput = document.getElementById('titleInput');
  const currencyPrefix = document.getElementById('currencyPrefix');
  const categoryGrid = document.getElementById('categoryGrid');
  const categoryLabel = document.getElementById('categoryLabel');
  const paymentPills = document.getElementById('paymentPills');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');

  const heroNetBalance = document.getElementById('heroNetBalance');
  const heroTodayIncome = document.getElementById('heroTodayIncome');
  const heroTodayAmount = document.getElementById('heroTodayAmount');
  const heroBudgetRemaining = document.getElementById('heroBudgetRemaining');
  const heroBudgetPill = document.getElementById('heroBudgetPill');
  const heroCurrentDate = document.getElementById('heroCurrentDate');
  const recentList = document.getElementById('recentList');
  const openDashboardBtn = document.getElementById('openDashboardBtn');
  const closePopupBtn = document.getElementById('closePopupBtn');
  const viewAllLink = document.getElementById('viewAllLink');
  const toggleDetailsBtn = document.getElementById('toggleDetailsBtn');
  const extraDetailsPanel = document.getElementById('extraDetailsPanel');
  const dateInput = document.getElementById('dateInput');
  const timeInput = document.getElementById('timeInput');
  const notesInput = document.getElementById('notesInput');
  const toast = document.getElementById('toast');

  function closePopup() {
    try {
      window.close();
    } catch (e) {}

    if (typeof chrome !== 'undefined') {
      if (chrome.tabs && chrome.tabs.getCurrent) {
        try {
          chrome.tabs.getCurrent((tab) => {
            if (tab && tab.id) {
              chrome.tabs.remove(tab.id);
            }
          });
        } catch (e) {}
      }
      if (chrome.windows && chrome.windows.getCurrent) {
        try {
          chrome.windows.getCurrent((win) => {
            if (win && win.id) {
              chrome.windows.remove(win.id);
            }
          });
        } catch (e) {}
      }
    }

    try {
      window.open('', '_self', '');
      window.close();
    } catch (e) {}
  }

  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => closePopup());
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePopup();
    }
  });

  function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const heroCreditDuesVal = document.getElementById('heroCreditDuesVal');
  const installmentHint = document.getElementById('installmentHint');
  const installmentHintText = document.getElementById('installmentHintText');

  // Amount Input listener for live installment calculation
  amountInput.addEventListener('input', () => {
    updateInstallmentHint();
  });

  function updateInstallmentHint() {
    if (!installmentHint) return;
    const amt = parseFloat(amountInput.value) || 0;
    if (selectedType === 'expense' && selectedPaymentMethod === 'flipkart_pay3') {
      installmentHint.style.display = 'flex';
      const perMo = Math.round((amt / 3));
      installmentHintText.textContent = `Split into 3 monthly payments of ${symbol}${perMo.toLocaleString('en-IN')} / mo`;
    } else if (selectedType === 'expense' && (selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'lazypay')) {
      installmentHint.style.display = 'flex';
      installmentHintText.textContent = `Deferred bill: Due next month (No instant cash deduction)`;
    } else {
      installmentHint.style.display = 'none';
    }
  }

  // Type Switcher Event Listeners
  if (popupTypeSwitch) {
    popupTypeSwitch.querySelectorAll('.type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const newType = tab.dataset.type;
        if (newType === selectedType) return;
        selectedType = newType;
        popupTypeSwitch.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        applyTypeChange();
      });
    });
  }

  function applyTypeChange() {
    const isIncome = selectedType === 'income';

    if (isIncome) {
      amountCard.classList.add('mode-income');
      submitBtn.classList.add('btn-income');
      submitBtnText.textContent = 'Record Income';
      titleInput.placeholder = 'What was this income for? (e.g. Salary, Client payment, Bonus)';
      categoryLabel.textContent = 'Income Category';
      selectedCategory = 'salary';

      presetChipsRow.innerHTML = `
        <button type="button" class="preset-chip" data-add="1000">+ ₹1K</button>
        <button type="button" class="preset-chip" data-add="5000">+ ₹5K</button>
        <button type="button" class="preset-chip" data-add="10000">+ ₹10K</button>
        <button type="button" class="preset-chip" data-add="50000">+ ₹50K</button>
      `;

      // In income mode, only direct cash/bank methods apply
      selectedPaymentMethod = 'bank';
      paymentPills.querySelectorAll('.payment-pill').forEach(p => {
        const method = p.dataset.method;
        if (['credit_card', 'lazypay', 'flipkart_pay3'].includes(method)) {
          p.style.display = 'none';
        } else {
          p.style.display = 'inline-block';
        }
        p.classList.toggle('active', method === 'bank');
      });
    } else {
      amountCard.classList.remove('mode-income');
      submitBtn.classList.remove('btn-income');
      submitBtnText.textContent = 'Log Expense';
      titleInput.placeholder = 'What was this expense for? (e.g. Chai, Lunch, Auto, Groceries)';
      categoryLabel.textContent = 'Expense Category';
      selectedCategory = 'food';

      presetChipsRow.innerHTML = `
        <button type="button" class="preset-chip" data-add="50">+ ₹50</button>
        <button type="button" class="preset-chip" data-add="100">+ ₹100</button>
        <button type="button" class="preset-chip" data-add="500">+ ₹500</button>
        <button type="button" class="preset-chip" data-add="1000">+ ₹1,000</button>
      `;

      // Show all payment methods in expense mode
      paymentPills.querySelectorAll('.payment-pill').forEach(p => {
        p.style.display = 'inline-block';
      });
      selectedPaymentMethod = 'upi';
      paymentPills.querySelectorAll('.payment-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.method === 'upi');
      });
    }

    // Re-bind preset chips
    presetChipsRow.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const addVal = parseFloat(chip.dataset.add) || 0;
        const currentVal = parseFloat(amountInput.value) || 0;
        amountInput.value = (currentVal + addVal);
        amountInput.focus();
        updateInstallmentHint();
      });
    });

    renderCategories();
    updateInstallmentHint();
  }

  // Launch Genuine Google Sign In
  googleSignInGateBtn.addEventListener('click', async () => {
    googleSignInGateBtn.disabled = true;
    googleSignInGateBtn.innerHTML = '<span>Connecting to Google...</span>';

    try {
      const res = await window.db.signInWithGoogle();
      if (res && res.success && res.user) {
        showToast(`Welcome ${res.user.displayName || res.user.email}!`);
        checkAuthState();
      } else if (res && res.error) {
        alert('Google Sign-In: ' + res.error);
      }
    } catch (err) {
      alert('Google Sign-In Error: ' + err.message);
    } finally {
      googleSignInGateBtn.disabled = false;
      googleSignInGateBtn.innerHTML = `
        <svg class="google-svg-icon" viewBox="0 0 24 24" width="18" height="18">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"/>
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z"/>
        </svg>
        <span>Sign in with Google</span>
      `;
    }
  });

  // Google User Pill Click -> Open Account Modal
  googleUserPill.addEventListener('click', () => {
    if (window.db.currentUser) {
      accountUserName.textContent = window.db.currentUser.displayName || 'Google User';
      accountUserEmail.textContent = window.db.currentUser.email || '';
      if (window.db.currentUser.photoURL) {
        modalUserAvatar.src = window.db.currentUser.photoURL;
        modalUserAvatar.style.display = 'block';
      } else {
        modalUserAvatar.style.display = 'none';
      }
      accountModal.style.display = 'flex';
    }
  });

  closeAccountModalBtn.addEventListener('click', () => {
    accountModal.style.display = 'none';
  });

  confirmSignOutBtn.addEventListener('click', async () => {
    await window.db.signOutGoogle();
    accountModal.style.display = 'none';
    showToast('Signed out from Google');
    checkAuthState();
  });

  function checkAuthState() {
    const isSignedIn = window.db.currentUser && !window.db.currentUser.isLocal;

    if (!isSignedIn) {
      if (authGateScreen) authGateScreen.style.display = 'flex';
      if (accountModal) accountModal.style.display = 'none';
      if (authenticatedView) authenticatedView.style.display = 'none';
      return;
    }

    if (authGateScreen) authGateScreen.style.display = 'none';
    if (accountModal) accountModal.style.display = 'none';
    if (authenticatedView) authenticatedView.style.display = 'flex';

    if (window.db.currentUser) {
      googleUserEmail.textContent = window.db.currentUser.displayName || (window.db.currentUser.email ? window.db.currentUser.email.split('@')[0] : 'User');

      if (window.db.currentUser.photoURL) {
        navUserAvatarImg.src = window.db.currentUser.photoURL;
        navUserAvatarImg.style.display = 'inline-block';
        defaultGIcon.style.display = 'none';
      } else {
        navUserAvatarImg.style.display = 'none';
        defaultGIcon.style.display = 'inline-flex';
        defaultGIcon.textContent = 'G';
      }
    }

    applyTypeChange();
    updateView();
  }

  // Category selection handler
  function renderCategories() {
    categoryGrid.innerHTML = '';
    const categories = selectedType === 'income'
      ? (window.db.settings.incomeCategories || window.DEFAULT_SETTINGS.incomeCategories || [])
      : (window.db.settings.categories || window.DEFAULT_SETTINGS.categories || []);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cat-btn ${cat.id === selectedCategory ? 'active' : ''}`;
      btn.dataset.category = cat.id;
      btn.innerHTML = `<span class="cat-icon">${cat.icon}</span> <span class="cat-name">${cat.name}</span>`;
      btn.addEventListener('click', () => {
        selectedCategory = cat.id;
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      categoryGrid.appendChild(btn);
    });
  }

  // Payment Method selection handler
  paymentPills.querySelectorAll('.payment-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      selectedPaymentMethod = pill.dataset.method;
      paymentPills.querySelectorAll('.payment-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      updateInstallmentHint();
    });
  });

  // Extra Details Toggle
  toggleDetailsBtn.addEventListener('click', () => {
    const isHidden = extraDetailsPanel.style.display === 'none';
    extraDetailsPanel.style.display = isHidden ? 'flex' : 'none';
    toggleDetailsBtn.textContent = isHidden ? '- Hide extra details' : '+ Add notes or custom date';
  });

  // Form Submit Handler
  quickAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.db.currentUser || window.db.currentUser.isLocal) {
      showToast('Please sign in with Google to log transactions.');
      checkAuthState();
      return;
    }

    const amount = parseFloat(amountInput.value);
    const title = titleInput.value.trim();

    if (isNaN(amount) || amount <= 0) {
      amountInput.focus();
      return;
    }

    if (!title) {
      titleInput.focus();
      return;
    }

    const symbol = (window.db.settings && window.db.settings.currencySymbol) || '₹';

    try {
      await window.db.addExpense({
        type: selectedType,
        amount,
        title,
        category: selectedCategory,
        paymentMethod: selectedPaymentMethod,
        date: dateInput.value || getLocalDateString(new Date()),
        time: timeInput.value || new Date().toTimeString().split(' ')[0].substr(0, 5),
        notes: notesInput.value || '',
        source: 'chrome_popup'
      });

      // Reset Form
      amountInput.value = '';
      titleInput.value = '';
      notesInput.value = '';
      extraDetailsPanel.style.display = 'none';
      toggleDetailsBtn.textContent = '+ Add notes or custom date';
      updateInstallmentHint();

      showToast(`${selectedType === 'income' ? 'Recorded income' : (['credit_card', 'lazypay', 'flipkart_pay3'].includes(selectedPaymentMethod) ? 'Recorded credit/BNPL expense' : 'Logged cash expense')} ${symbol}${amount}`);

      // Automatically close the popup window
      setTimeout(() => {
        closePopup();
      }, 300);
    } catch (err) {
      console.error('Error logging transaction:', err);
      showToast(err.message || 'Error logging transaction');
    }
  });

  // Open Full Dashboard
  const openDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    } else {
      window.open('dashboard.html', '_blank');
    }
  };

  openDashboardBtn.addEventListener('click', openDashboard);
  viewAllLink.addEventListener('click', openDashboard);

  // Update UI Function
  function updateView() {
    if (!window.db.currentUser) return;

    const summary = window.db.getSummary();
    const symbol = window.db.settings.currencySymbol || '₹';

    // Hero Liquid Cash Balance
    const cashNet = summary.todayNetBalance || 0;
    heroNetBalance.textContent = `${cashNet >= 0 ? '+' : '-'}${symbol}${Math.abs(Math.round(cashNet)).toLocaleString('en-IN')}`;
    heroTodayIncome.textContent = `+${symbol}${Math.round(summary.todayEarnedIncome || summary.todayIncome || 0).toLocaleString('en-IN')}`;
    heroTodayAmount.textContent = `-${symbol}${Math.round(summary.todayDirectExpense || 0).toLocaleString('en-IN')}`;

    if (heroCreditDuesVal) {
      heroCreditDuesVal.textContent = `${symbol}${Math.round(summary.totalCreditDues || 0).toLocaleString('en-IN')} (Upcoming)`;
    }

    if (cashNet >= 0) {
      heroBudgetRemaining.textContent = `+${symbol}${Math.round(cashNet)} In-Hand`;
      heroBudgetPill.className = 'hero-budget-pill';
    } else {
      heroBudgetRemaining.textContent = `-${symbol}${Math.abs(Math.round(cashNet))} Deficit`;
      heroBudgetPill.className = 'hero-budget-pill danger';
    }

    renderRecentExpenses();
  }

  function renderRecentExpenses() {
    const expenses = window.db.expenses.slice(0, 4);
    const symbol = window.db.settings.currencySymbol || '₹';

    if (expenses.length === 0) {
      recentList.innerHTML = '<div class="empty-state">No transactions recorded today yet.</div>';
      return;
    }

    recentList.innerHTML = '';
    const allCategories = [
      ...(window.db.settings.categories || []),
      ...(window.db.settings.incomeCategories || [])
    ];

    expenses.forEach(item => {
      const isIncome = item.type === 'income';
      const isRollover = isIncome && (item.category === 'savings_rollover' || item.category === 'opening_balance' || (typeof isRolloverItem === 'function' && isRolloverItem(item)));
      const isDeferred = !isIncome && ['credit_card', 'card', 'lazypay', 'flipkart_pay3'].includes(item.paymentMethod);
      const catObj = allCategories.find(c => c.id === item.category) || { icon: isRollover ? '🔄' : (isIncome ? '💰' : '📦'), name: isRollover ? 'Savings Rollover / B/F' : (isIncome ? 'Income' : 'Other') };

      let payTag = '';
      if (item.paymentMethod === 'credit_card' || item.paymentMethod === 'card') payTag = '💳 Card (Next Mo)';
      else if (item.paymentMethod === 'lazypay') payTag = '🛍️ LazyPay (Next Mo)';
      else if (item.paymentMethod === 'flipkart_pay3') payTag = '📦 Pay in 3 (EMI)';

      const el = document.createElement('div');
      el.className = 'recent-item';
      el.innerHTML = `
        <div class="recent-item-left">
          <span class="recent-item-icon">${catObj.icon}</span>
          <div class="recent-item-info">
            <span class="recent-item-title">${escapeHtml(item.title)}</span>
            <span class="recent-item-meta">${item.time || ''} • ${catObj.name} ${payTag ? `• <span style="color:#fbbf24;font-weight:600;">${payTag}</span>` : ''}</span>
          </div>
        </div>
        <div class="recent-item-right">
          <span class="recent-item-amount ${isRollover ? 'rollover' : (isIncome ? 'income' : (isDeferred ? 'deferred' : ''))}">
            ${isIncome ? '+' : '-'}${symbol}${(item.amount || 0).toLocaleString('en-IN')}
          </span>
          <button type="button" class="btn-delete-item" data-id="${item.id}" title="Delete entry">✕</button>
        </div>
      `;

      el.querySelector('.btn-delete-item').addEventListener('click', async (e) => {
        e.stopPropagation();
        await window.db.deleteExpense(item.id);
        showToast('Transaction removed');
      });

      recentList.appendChild(el);
    });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --- Safe Initialization ---
  try {
    await window.db.init();

    const currentSymbol = (window.db.settings && window.db.settings.currencySymbol) || '₹';
    if (currencyPrefix) currencyPrefix.textContent = currentSymbol;

    const todayDate = new Date();
    if (heroCurrentDate) heroCurrentDate.textContent = todayDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (dateInput) dateInput.value = getLocalDateString(todayDate);
    if (timeInput) timeInput.value = todayDate.toTimeString().split(' ')[0].substr(0, 5);

    checkAuthState();

    window.db.subscribe(() => {
      updateView();
    });

    window.db.onAuthChange(() => checkAuthState());
  } catch (err) {
    console.error('Spentify Popup initialization error:', err);
  }
});

