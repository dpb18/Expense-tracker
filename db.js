/**
 * Spentify - Unified Storage & Real-Time Google Sync Engine
 * Strictly authenticates genuine Google / Gmail accounts via Firebase & Google OAuth.
 */

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isRolloverItem(item) {
  if (!item || item.type !== 'income') return false;
  if (item.category === 'savings_rollover' || item.category === 'opening_balance' || item.isRollover) return true;
  const title = (item.title || '').toLowerCase();
  return title.includes('opening balance') ||
    title.includes('savings rollover') ||
    title.includes('balance b/f') ||
    title.includes('carried forward') ||
    title.includes('carryover') ||
    title.includes('rollover from') ||
    title.includes('savings for');
}

function getCanonicalUserId(email) {
  if (!email) return 'default_user';
  return 'user_' + String(email).toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

class ExpenseDatabase {
  constructor() {
    this.expenses = [];
    this.assets = [];
    const baseSettings = (typeof DEFAULT_SETTINGS !== 'undefined') ? DEFAULT_SETTINGS : ((typeof global !== 'undefined' && global.DEFAULT_SETTINGS) ? global.DEFAULT_SETTINGS : {});
    this.settings = JSON.parse(JSON.stringify(baseSettings));
    this.listeners = [];
    this.authListeners = [];
    this.isInitialized = false;
    this.firebaseApp = null;
    this.firestore = null;
    this.auth = null;
    this.currentUser = null;
    this.firestoreUnsubscribe = null;
    this.firestoreAssetUnsubscribe = null;

    this.setupCrossContextSync();
  }

  setupCrossContextSync() {
    // 1. Chrome Extension Storage Changes (Popup <-> Dashboard <-> Background)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          let dataChanged = false;
          let authChanged = false;

          if (changes.spentify_expenses) {
            this.expenses = changes.spentify_expenses.newValue || [];
            dataChanged = true;
          }
          if (changes.spentify_assets) {
            this.assets = changes.spentify_assets.newValue || [];
            dataChanged = true;
          }
          if (changes.spentify_settings) {
            this.settings = { ...this.settings, ...(changes.spentify_settings.newValue || {}) };
            dataChanged = true;
          }
          if (changes.spentify_user) {
            this.currentUser = changes.spentify_user.newValue || null;
            authChanged = true;
            dataChanged = true;
          }

          if (authChanged) this.notifyAuthListeners();
          if (dataChanged) {
            this.updateExtensionBadge();
            this.notifyListeners();
          }
        }
      });
    }

    // 2. Web / Standalone Tab Storage Changes
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        let dataChanged = false;
        let authChanged = false;

        try {
          if (e.key === 'spentify_expenses' && e.newValue) {
            this.expenses = JSON.parse(e.newValue);
            dataChanged = true;
          }
          if (e.key === 'spentify_assets' && e.newValue) {
            this.assets = JSON.parse(e.newValue);
            dataChanged = true;
          }
          if (e.key === 'spentify_settings' && e.newValue) {
            this.settings = { ...this.settings, ...JSON.parse(e.newValue) };
            dataChanged = true;
          }
          if (e.key === 'spentify_user') {
            this.currentUser = e.newValue ? JSON.parse(e.newValue) : null;
            authChanged = true;
            dataChanged = true;
          }
        } catch (err) {
          console.warn('Storage event parse note:', err);
        }

        if (authChanged) this.notifyAuthListeners();
        if (dataChanged) {
          this.updateExtensionBadge();
          this.notifyListeners();
        }
      });

      // 3. Tab focus & visibility sync to ensure instant freshness
      window.addEventListener('focus', async () => {
        await this.loadLocalData();
        this.notifyAuthListeners();
        this.notifyListeners();
      });

      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          await this.loadLocalData();
          this.notifyAuthListeners();
          this.notifyListeners();
        }
      });
    }
  }

  getUserId() {
    if (!this.currentUser || !this.currentUser.email) return 'default_user';
    return getCanonicalUserId(this.currentUser.email);
  }

  async init() {
    if (this.isInitialized) return;

    // 1. Load local cache
    await this.loadLocalData();

    // 2. Initialize Firebase
    await this.initFirebase();

    // 3. Immediately start cloud sync listener if user is logged in
    if (this.currentUser && this.currentUser.email && !this.currentUser.isLocal) {
      this.startFirestoreListener();
    }

    this.isInitialized = true;
    this.notifyAuthListeners();
    this.notifyListeners();
  }

  isExtension() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  async loadLocalData() {
    try {
      let loadedExpenses = null;
      let loadedAssets = null;
      let loadedSettings = null;
      let loadedUser = null;

      if (this.isExtension()) {
        const result = await chrome.storage.local.get(['spentify_expenses', 'spentify_assets', 'spentify_settings', 'spentify_user']);
        if (result.spentify_expenses) loadedExpenses = result.spentify_expenses;
        if (result.spentify_assets) loadedAssets = result.spentify_assets;
        if (result.spentify_settings) loadedSettings = result.spentify_settings;
        if (result.spentify_user) loadedUser = result.spentify_user;
      }

      if (!loadedExpenses && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('spentify_expenses');
        if (stored) loadedExpenses = JSON.parse(stored);
      }
      if (!loadedAssets && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('spentify_assets');
        if (stored) loadedAssets = JSON.parse(stored);
      }
      if (!loadedSettings && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('spentify_settings');
        if (stored) loadedSettings = JSON.parse(stored);
      }
      if (!loadedUser && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('spentify_user');
        if (stored) loadedUser = JSON.parse(stored);
      }

      if (loadedExpenses) {
        this.expenses = loadedExpenses;
        // Auto-classify any existing items that match rollover keywords
        this.expenses.forEach(e => {
          if (e.type === 'income' && isRolloverItem(e) && e.category !== 'savings_rollover') {
            e.category = 'savings_rollover';
            e.isRollover = true;
          }
        });
      }

      if (loadedAssets && Array.isArray(loadedAssets)) {
        this.assets = loadedAssets.filter(a => !a.id || !a.id.startsWith('ast_demo_'));
      } else {
        this.assets = [];
      }

      if (loadedSettings) {
        const baseIncomeCats = (typeof DEFAULT_SETTINGS !== 'undefined' && DEFAULT_SETTINGS.incomeCategories) ? DEFAULT_SETTINGS.incomeCategories : [];
        const baseExpenseCats = (typeof DEFAULT_SETTINGS !== 'undefined' && DEFAULT_SETTINGS.categories) ? DEFAULT_SETTINGS.categories : [];
        const baseAssetCats = (typeof DEFAULT_SETTINGS !== 'undefined' && DEFAULT_SETTINGS.assetCategories) ? DEFAULT_SETTINGS.assetCategories : [];
        const baseAssetPlatforms = (typeof DEFAULT_SETTINGS !== 'undefined' && DEFAULT_SETTINGS.assetPlatforms) ? DEFAULT_SETTINGS.assetPlatforms : [];

        const existingIncomeCatIds = new Set((loadedSettings.incomeCategories || []).map(c => c.id));
        const mergedIncomeCats = [
          ...(loadedSettings.incomeCategories || []),
          ...baseIncomeCats.filter(c => !existingIncomeCatIds.has(c.id))
        ];

        const existingExpenseCatIds = new Set((loadedSettings.categories || []).map(c => c.id));
        const mergedExpenseCats = [
          ...(loadedSettings.categories || []),
          ...baseExpenseCats.filter(c => !existingExpenseCatIds.has(c.id))
        ];

        const existingAssetCatIds = new Set((loadedSettings.assetCategories || []).map(c => c.id));
        const mergedAssetCats = [
          ...(loadedSettings.assetCategories || []),
          ...baseAssetCats.filter(c => !existingAssetCatIds.has(c.id))
        ];

        this.settings = {
          ...this.settings,
          ...loadedSettings,
          incomeCategories: mergedIncomeCats.length > 0 ? mergedIncomeCats : this.settings.incomeCategories,
          categories: mergedExpenseCats.length > 0 ? mergedExpenseCats : this.settings.categories,
          assetCategories: mergedAssetCats.length > 0 ? mergedAssetCats : this.settings.assetCategories,
          assetPlatforms: loadedSettings.assetPlatforms || baseAssetPlatforms
        };
      } else {
        const baseIncomeCats = (typeof DEFAULT_SETTINGS !== 'undefined' && DEFAULT_SETTINGS.incomeCategories) ? DEFAULT_SETTINGS.incomeCategories : [];
        if (baseIncomeCats.length > 0) {
          this.settings.incomeCategories = JSON.parse(JSON.stringify(baseIncomeCats));
        }
        if (typeof DEFAULT_SETTINGS !== 'undefined') {
          if (DEFAULT_SETTINGS.assetCategories) this.settings.assetCategories = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.assetCategories));
          if (DEFAULT_SETTINGS.assetPlatforms) this.settings.assetPlatforms = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.assetPlatforms));
        }
      }

      this.currentUser = (loadedUser && !loadedUser.isLocal) ? loadedUser : null;
      if (this.currentUser && this.currentUser.email) {
        this.currentUser.uid = getCanonicalUserId(this.currentUser.email);
      }

      // Sync across both storage engines
      if (this.isExtension()) {
        chrome.storage.local.set({
          spentify_expenses: this.expenses,
          spentify_assets: this.assets,
          spentify_settings: this.settings,
          spentify_user: this.currentUser
        }).catch(() => { });
      }
    } catch (e) {
      console.warn('Spentify: Local cache read error', e);
    }
  }

  async saveLocalData() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('spentify_expenses', JSON.stringify(this.expenses));
        localStorage.setItem('spentify_assets', JSON.stringify(this.assets));
        localStorage.setItem('spentify_settings', JSON.stringify(this.settings));
        if (this.currentUser) {
          localStorage.setItem('spentify_user', JSON.stringify(this.currentUser));
        } else {
          localStorage.removeItem('spentify_user');
        }
      }

      if (this.isExtension()) {
        await chrome.storage.local.set({
          spentify_expenses: this.expenses,
          spentify_assets: this.assets,
          spentify_settings: this.settings,
          spentify_user: this.currentUser
        });
      }
      this.updateExtensionBadge();
    } catch (e) {
      console.error('Spentify: Save error', e);
    }
  }

  updateExtensionBadge() {
    if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
      if (!this.currentUser) {
        chrome.action.setBadgeText({ text: '' });
        return;
      }

      const summary = this.getSummary();
      const todayTotal = Math.round(summary.todayTotal);
      const symbol = this.settings.currencySymbol || '₹';
      const text = todayTotal > 0 ? `${symbol}${todayTotal}` : '';

      chrome.action.setBadgeText({ text });

      const dailyBudget = this.settings.dailyBudget || 800;
      let color = '#10b981'; // Green
      if (todayTotal > dailyBudget) {
        color = '#ef4444'; // Red
      } else if (todayTotal > dailyBudget * 0.75) {
        color = '#f59e0b'; // Amber
      }
      chrome.action.setBadgeBackgroundColor({ color });
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.expenses, this.getSummary());
      } catch (e) {
        console.error('Error in subscriber callback', e);
      }
    });
  }

  onAuthChange(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notifyAuthListeners() {
    this.authListeners.forEach(cb => {
      try {
        cb(this.currentUser);
      } catch (e) { }
    });
  }

  // --- CRUD Operations ---

  async addExpense(expenseData) {
    if (!this.currentUser || this.currentUser.isLocal) {
      throw new Error('Please sign in with Google to log transactions.');
    }

    const userEmail = (this.currentUser.email || '').toLowerCase().trim();
    const userUid = this.getUserId();

    const type = expenseData.type === 'income' ? 'income' : 'expense';
    const id = (type === 'income' ? 'inc_' : 'exp_') + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const now = new Date();
    const dateStr = expenseData.date || getLocalDateString(now);
    const timeStr = expenseData.time || now.toTimeString().split(' ')[0].substr(0, 5);
    const amount = parseFloat(expenseData.amount) || 0;
    const paymentMethod = expenseData.paymentMethod || (type === 'income' ? 'bank' : 'upi');

    // Credit / BNPL & Installment calculations
    const isDeferred = type === 'expense' && ['credit_card', 'card', 'lazypay', 'flipkart_pay3'].includes(paymentMethod);
    let installments = null;
    let installmentInfo = null;

    if (paymentMethod === 'flipkart_pay3' && type === 'expense') {
      const perMonthAmt = Math.round((amount / 3) * 100) / 100;
      installments = [
        { monthIndex: 0, amount: perMonthAmt, label: 'Month 1', status: 'pending' },
        { monthIndex: 1, amount: perMonthAmt, label: 'Month 2', status: 'pending' },
        { monthIndex: 2, amount: perMonthAmt, label: 'Month 3', status: 'pending' }
      ];
      installmentInfo = {
        plan: 'flipkart_pay3',
        tenureMonths: 3,
        monthlyAmount: perMonthAmt
      };
    }

    const newExpense = {
      id,
      type,
      amount,
      title: (expenseData.title || (type === 'income' ? 'Income' : 'Expense')).trim(),
      category: expenseData.category || (type === 'income' ? 'salary' : 'other'),
      paymentMethod,
      isDeferred,
      installments,
      installmentInfo,
      date: dateStr,
      time: timeStr,
      timestamp: new Date(`${dateStr}T${timeStr}:00`).getTime() || Date.now(),
      notes: (expenseData.notes || '').trim(),
      source: expenseData.source || 'chrome_popup',
      userEmail,
      createdAt: Date.now()
    };

    this.expenses.unshift(newExpense);
    await this.saveLocalData();
    this.notifyListeners();

    if (this.firestore && this.currentUser && !this.currentUser.isLocal) {
      this.firestore
        .collection('users')
        .doc(userUid)
        .collection('expenses')
        .doc(id)
        .set(newExpense)
        .catch(err => {
          console.warn('Cloud Firestore sync pending (offline):', err);
        });
    }

    return newExpense;
  }

  // Alias for semantic clarity
  async addTransaction(data) {
    return this.addExpense(data);
  }

  async deleteExpense(id) {
    this.expenses = this.expenses.filter(item => item.id !== id);
    await this.saveLocalData();
    this.notifyListeners();

    if (this.firestore && this.currentUser) {
      try {
        await this.firestore
          .collection('users')
          .doc(this.getUserId())
          .collection('expenses')
          .doc(id)
          .delete();
      } catch (err) {
        console.warn('Cloud delete failed:', err);
      }
    }
  }

  async updateExpense(id, updatedFields) {
    const index = this.expenses.findIndex(item => item.id === id);
    if (index !== -1) {
      const existing = this.expenses[index];
      const updated = { ...existing, ...updatedFields };
      if (updatedFields.amount !== undefined) updated.amount = parseFloat(updatedFields.amount) || 0;
      if (updatedFields.type) updated.type = updatedFields.type;
      if (updatedFields.date && updatedFields.time) {
        updated.timestamp = new Date(`${updatedFields.date}T${updatedFields.time}:00`).getTime();
      }
      this.expenses[index] = updated;
      await this.saveLocalData();
      this.notifyListeners();

      if (this.firestore && this.currentUser) {
        try {
          await this.firestore
            .collection('users')
            .doc(this.getUserId())
            .collection('expenses')
            .doc(id)
            .update(updated);
        } catch (err) {
          console.warn('Cloud update failed:', err);
        }
      }
      return updated;
    }
    return null;
  }

  // --- Wealth & Asset Management Operations (SIPs, Stocks, Paytm Gold) ---

  async addAsset(assetData) {
    if (!this.currentUser || this.currentUser.isLocal) {
      throw new Error('Please sign in with Google to manage assets.');
    }

    const userEmail = (this.currentUser.email || '').toLowerCase().trim();
    const userUid = this.getUserId();
    const id = 'ast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const investedAmount = parseFloat(assetData.investedAmount) || 0;
    const currentValue = (assetData.currentValue !== undefined && !isNaN(parseFloat(assetData.currentValue))) ? parseFloat(assetData.currentValue) : investedAmount;
    const monthlySip = parseFloat(assetData.monthlySip) || 0;
    const isSip = Boolean(assetData.isSip || assetData.investmentType === 'sip' || monthlySip > 0);
    const dateStr = assetData.purchaseDate || getLocalDateString(new Date());

    const newAsset = {
      id,
      name: (assetData.name || 'Asset Holding').trim(),
      category: assetData.category || 'sip', // 'gold', 'sip', 'stocks', 'fd', 'sgb', 'other'
      platform: assetData.platform || 'paytm', // 'paytm', 'zerodha', 'groww', 'indmoney', 'bank', 'other'
      investedAmount,
      currentValue,
      isSip,
      monthlySip,
      sipDay: parseInt(assetData.sipDay) || 5,
      units: parseFloat(assetData.units) || 0,
      unitType: assetData.unitType || (assetData.category === 'gold' ? 'grams' : 'units'),
      purchaseDate: dateStr,
      notes: (assetData.notes || '').trim(),
      history: assetData.history || [
        { date: dateStr, amount: investedAmount, type: 'initial', note: 'Initial Investment' }
      ],
      userEmail,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.assets.unshift(newAsset);
    await this.saveLocalData();
    this.notifyListeners();

    if (this.firestore && this.currentUser && !this.currentUser.isLocal) {
      this.firestore
        .collection('users')
        .doc(userUid)
        .collection('assets')
        .doc(id)
        .set(newAsset)
        .catch(err => {
          console.warn('Cloud Firestore asset sync note:', err);
        });
    }

    return newAsset;
  }

  async updateAsset(id, updatedFields) {
    const index = this.assets.findIndex(item => item.id === id);
    if (index !== -1) {
      const existing = this.assets[index];
      const updated = { ...existing, ...updatedFields, updatedAt: Date.now() };

      if (updatedFields.investedAmount !== undefined) updated.investedAmount = parseFloat(updatedFields.investedAmount) || 0;
      if (updatedFields.currentValue !== undefined) updated.currentValue = parseFloat(updatedFields.currentValue) || 0;
      if (updatedFields.monthlySip !== undefined) updated.monthlySip = parseFloat(updatedFields.monthlySip) || 0;
      if (updatedFields.units !== undefined) updated.units = parseFloat(updatedFields.units) || 0;

      this.assets[index] = updated;
      await this.saveLocalData();
      this.notifyListeners();

      if (this.firestore && this.currentUser && !this.currentUser.isLocal) {
        try {
          await this.firestore
            .collection('users')
            .doc(this.getUserId())
            .collection('assets')
            .doc(id)
            .update(updated);
        } catch (err) {
          console.warn('Cloud Firestore asset update note:', err);
        }
      }
      return updated;
    }
    return null;
  }

  async deleteAsset(id) {
    this.assets = this.assets.filter(item => item.id !== id);
    await this.saveLocalData();
    this.notifyListeners();

    if (this.firestore && this.currentUser && !this.currentUser.isLocal) {
      try {
        await this.firestore
          .collection('users')
          .doc(this.getUserId())
          .collection('assets')
          .doc(id)
          .delete();
      } catch (err) {
        console.warn('Cloud Firestore asset delete note:', err);
      }
    }
  }

  async addAssetTopup(id, topupAmount, date = null, note = '') {
    const asset = this.assets.find(a => a.id === id);
    if (!asset) return null;

    const amt = parseFloat(topupAmount) || 0;
    if (amt <= 0) return null;

    const dateStr = date || getLocalDateString(new Date());
    const newInvested = (parseFloat(asset.investedAmount) || 0) + amt;
    const newCurrent = (parseFloat(asset.currentValue) || asset.investedAmount || 0) + amt;
    const history = asset.history || [];
    history.push({ date: dateStr, amount: amt, type: 'topup', note: note || 'Top-up / SIP installment' });

    return this.updateAsset(id, {
      investedAmount: newInvested,
      currentValue: newCurrent,
      history
    });
  }

  getAssetSummary(filteredAssets = null) {
    const list = filteredAssets || this.assets;
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let monthlySipTotal = 0;
    const categoryTotals = {};
    const platformTotals = {};

    const assetCats = (this.settings && this.settings.assetCategories) || (typeof DEFAULT_SETTINGS !== 'undefined' ? DEFAULT_SETTINGS.assetCategories : []);
    assetCats.forEach(c => {
      categoryTotals[c.id] = { invested: 0, currentValue: 0, returns: 0, count: 0, color: c.color, icon: c.icon, name: c.name };
    });

    list.forEach(a => {
      const inv = parseFloat(a.investedAmount) || 0;
      const cur = (a.currentValue !== undefined && !isNaN(parseFloat(a.currentValue))) ? parseFloat(a.currentValue) : inv;
      const sip = a.isSip ? (parseFloat(a.monthlySip) || 0) : 0;

      totalInvested += inv;
      totalCurrentValue += cur;
      monthlySipTotal += sip;

      const cat = a.category || 'other';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { invested: 0, currentValue: 0, returns: 0, count: 0, color: '#64748b', icon: '🌐', name: 'Other' };
      }
      categoryTotals[cat].invested += inv;
      categoryTotals[cat].currentValue += cur;
      categoryTotals[cat].returns += (cur - inv);
      categoryTotals[cat].count += 1;

      const plat = a.platform || 'other';
      platformTotals[plat] = (platformTotals[plat] || 0) + inv;
    });

    const totalReturns = totalCurrentValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? Math.round(((totalReturns / totalInvested) * 100) * 100) / 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalReturns,
      returnPercentage,
      monthlySipTotal,
      categoryTotals,
      platformTotals,
      totalCount: list.length
    };
  }

  seedInitialAssets() {
    this.assets = [];
  }

  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveLocalData();
    this.notifyListeners();
  }

  // --- Real Google OAuth 2.0 Integration ---

  async initFirebase() {
    if (typeof firebase !== 'undefined') {
      try {
        let activeCfg = typeof FIREBASE_CONFIG !== 'undefined' ? JSON.parse(JSON.stringify(FIREBASE_CONFIG)) : {};

        if (this.isExtension()) {
          const res = await chrome.storage.local.get(['spentify_firebase_config']);
          if (res.spentify_firebase_config) {
            activeCfg = { ...activeCfg, ...res.spentify_firebase_config };
          }
        }
        const savedCfg = localStorage.getItem('spentify_firebase_config');
        if (savedCfg) {
          activeCfg = { ...activeCfg, ...JSON.parse(savedCfg) };
        }

        if (!firebase.apps.length) {
          this.firebaseApp = firebase.initializeApp(activeCfg);
        } else {
          this.firebaseApp = firebase.app();
        }
        this.firestore = firebase.firestore();
        this.auth = firebase.auth();

        this.auth.onAuthStateChanged(async (user) => {
          if (user) {
            const email = (user.email || '').toLowerCase().trim();
            this.currentUser = {
              uid: getCanonicalUserId(email),
              displayName: user.displayName || email.split('@')[0],
              email: email,
              photoURL: user.photoURL || `https://lh3.googleusercontent.com/a/default-user`,
              emailVerified: user.emailVerified || true
            };
            this.startFirestoreListener();
            await this.saveLocalData();
            this.notifyAuthListeners();
            this.notifyListeners();
          } else {
            // User is not signed in via Firebase Auth SDK directly.
            // If we have a cached logged-in user from local storage, retain it and keep cloud sync active!
            if (this.currentUser && this.currentUser.email && !this.currentUser.isLocal) {
              this.startFirestoreListener();
            }
          }
        });
      } catch (e) {
        console.warn('Firebase init note:', e);
      }
    }
  }

  /**
   * Genuine Google OAuth 2.0 Sign In via Firebase Auth
   */
  async signInWithGoogle() {
    if (typeof window.googleAuthService !== 'undefined') {
      const res = await window.googleAuthService.signInWithGoogleOAuth();
      if (res && res.success && res.user) {
        this.currentUser = res.user;
        if (this.currentUser.email) {
          this.currentUser.uid = getCanonicalUserId(this.currentUser.email);
        }
        await this.saveLocalData();
        this.startFirestoreListener();
        this.notifyAuthListeners();
        this.notifyListeners();
        return res;
      }
      return res;
    }
    return { success: false, error: 'Google authentication service not ready' };
  }

  async signOutGoogle() {
    if (typeof window.googleAuthService !== 'undefined') {
      await window.googleAuthService.signOut();
    }
    if (this.auth) {
      try { await this.auth.signOut(); } catch (e) { }
    }
    if (this.firestoreUnsubscribe) {
      try { this.firestoreUnsubscribe(); } catch (e) {}
      this.firestoreUnsubscribe = null;
    }
    if (this.firestoreAssetUnsubscribe) {
      try { this.firestoreAssetUnsubscribe(); } catch (e) {}
      this.firestoreAssetUnsubscribe = null;
    }
    this.currentUser = null;
    await this.saveLocalData();
    this.notifyAuthListeners();
    this.notifyListeners();
  }

  startFirestoreListener() {
    if (!this.firestore || !this.currentUser || !this.currentUser.email || this.currentUser.isLocal) return;
    if (this.firestoreUnsubscribe) {
      try { this.firestoreUnsubscribe(); } catch (e) {}
      this.firestoreUnsubscribe = null;
    }
    if (this.firestoreAssetUnsubscribe) {
      try { this.firestoreAssetUnsubscribe(); } catch (e) {}
      this.firestoreAssetUnsubscribe = null;
    }

    const userId = this.getUserId();
    if (!userId || userId === 'default_user') return;

    const expensesRef = this.firestore.collection('users').doc(userId).collection('expenses');
    const assetsRef = this.firestore.collection('users').doc(userId).collection('assets');

    // 1. Instant direct fetch to populate immediately on refresh or device switch
    expensesRef.orderBy('timestamp', 'desc').get().then(snapshot => {
      const cloudExpenses = [];
      snapshot.forEach(doc => {
        cloudExpenses.push({ id: doc.id, ...doc.data() });
      });

      if (cloudExpenses.length > 0) {
        // Merge with any unsynced local items that aren't in cloud yet
        const cloudIds = new Set(cloudExpenses.map(e => e.id));
        const unsynced = this.expenses.filter(e => !cloudIds.has(e.id));
        unsynced.forEach(localItem => {
          expensesRef.doc(localItem.id).set({
            ...localItem,
            userEmail: this.currentUser.email
          }).catch(() => {});
        });

        this.expenses = [...unsynced, ...cloudExpenses].sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
        this.saveLocalData();
        this.notifyListeners();
      } else if (this.expenses.length > 0) {
        // Cloud is empty for this user but local had items: upload them to cloud
        this.expenses.forEach(localItem => {
          expensesRef.doc(localItem.id).set({
            ...localItem,
            userEmail: this.currentUser.email
          }).catch(() => {});
        });
      }
    }).catch(err => {
      console.warn('Initial Firestore expenses fetch note:', err);
    });

    assetsRef.orderBy('createdAt', 'desc').get().then(snapshot => {
      const cloudAssets = [];
      snapshot.forEach(doc => {
        cloudAssets.push({ id: doc.id, ...doc.data() });
      });
      if (cloudAssets.length > 0) {
        this.assets = cloudAssets;
        this.saveLocalData();
        this.notifyListeners();
      }
    }).catch(err => {
      console.warn('Initial Firestore assets fetch note:', err);
    });

    // 2. Real-time live listener for updates from mobile and other tabs
    try {
      this.firestoreUnsubscribe = expensesRef
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
          const cloudExpenses = [];
          snapshot.forEach(doc => {
            cloudExpenses.push({ id: doc.id, ...doc.data() });
          });
          if (cloudExpenses.length > 0 || (snapshot.empty && this.expenses.length === 0)) {
            // Merge with local unsynced items
            const cloudIds = new Set(cloudExpenses.map(e => e.id));
            const unsynced = this.expenses.filter(e => !cloudIds.has(e.id));
            this.expenses = [...unsynced, ...cloudExpenses].sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
            this.saveLocalData();
            this.notifyListeners();
          }
        }, err => {
          console.warn('Firestore snapshot note:', err);
        });

      this.firestoreAssetUnsubscribe = assetsRef
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const cloudAssets = [];
          snapshot.forEach(doc => {
            cloudAssets.push({ id: doc.id, ...doc.data() });
          });
          if (cloudAssets.length > 0) {
            this.assets = cloudAssets;
            this.saveLocalData();
            this.notifyListeners();
          }
        }, err => {
          console.warn('Firestore asset snapshot note:', err);
        });
    } catch (e) {
      console.warn('Firestore subscription note:', e);
    }
  }

  // --- Analytics & Aggregations (INR) ---

  getSummary(filteredExpenses = null) {
    const list = filteredExpenses || this.expenses;
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Previous month computation (e.g. August when current is September)
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    let prevMonthEarnedIncome = 0;
    let prevMonthDirectExpense = 0;

    let periodEarnedIncome = 0;
    let periodRolloverIncome = 0;
    let periodExpense = 0;
    let periodDirectExpense = 0; // Immediate cash outflow (UPI, Bank, Cash)
    let periodCreditExpense = 0; // Deferred credit/BNPL outflow

    let todayEarnedIncome = 0;
    let todayRolloverIncome = 0;
    let todayExpense = 0;
    let todayDirectExpense = 0;
    let todayCreditExpense = 0;

    let monthEarnedIncome = 0;
    let monthRolloverIncome = 0;
    let monthExpense = 0;
    let monthDirectExpense = 0;
    let monthCreditExpense = 0;

    let allTimeEarnedIncome = 0;
    let allTimeRolloverIncome = 0;
    let allTimeExpense = 0;
    let allTimeDirectExpense = 0;

    // Credit & BNPL Dues breakdown
    let creditCardDues = 0;
    let lazyPayDues = 0;
    let flipkartPay3Total = 0;

    // 3-Month Installment Projection (Timeline Schedule)
    const timelineSchedule = {
      currentMonth: { creditCard: 0, lazyPay: 0, flipkartPay3: 0, total: 0 },
      nextMonth: { creditCard: 0, lazyPay: 0, flipkartPay3: 0, total: 0 },
      month3: { creditCard: 0, lazyPay: 0, flipkartPay3: 0, total: 0 }
    };

    const expenseCategoryTotals = {};
    const incomeCategoryTotals = {};
    const paymentTotals = {};
    const dailyMap = {};

    if (this.settings && Array.isArray(this.settings.categories)) {
      this.settings.categories.forEach(c => { expenseCategoryTotals[c.id] = 0; });
    }
    if (this.settings && Array.isArray(this.settings.incomeCategories)) {
      this.settings.incomeCategories.forEach(c => { incomeCategoryTotals[c.id] = 0; });
    }
    if (this.settings && Array.isArray(this.settings.paymentMethods)) {
      this.settings.paymentMethods.forEach(p => { paymentTotals[p.id] = 0; });
    }

    // Process filtered list for period metrics
    list.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      const isIncome = item.type === 'income';
      const isRollover = isIncome && isRolloverItem(item);
      const isDeferred = !isIncome && ['credit_card', 'card', 'lazypay', 'flipkart_pay3'].includes(item.paymentMethod);

      if (isIncome) {
        if (isRollover) {
          periodRolloverIncome += amt;
          incomeCategoryTotals['savings_rollover'] = (incomeCategoryTotals['savings_rollover'] || 0) + amt;
        } else {
          periodEarnedIncome += amt;
          const cat = item.category || 'other_income';
          incomeCategoryTotals[cat] = (incomeCategoryTotals[cat] || 0) + amt;
        }
      } else {
        periodExpense += amt;
        if (isDeferred) {
          periodCreditExpense += amt;
        } else {
          periodDirectExpense += amt;
        }

        const cat = item.category || 'other';
        expenseCategoryTotals[cat] = (expenseCategoryTotals[cat] || 0) + amt;
      }

      const pay = item.paymentMethod || (isIncome ? 'bank' : 'upi');
      paymentTotals[pay] = (paymentTotals[pay] || 0) + amt;

      if (item.date) {
        if (!dailyMap[item.date]) {
          dailyMap[item.date] = { expense: 0, directExpense: 0, creditExpense: 0, income: 0, earnedIncome: 0, rolloverIncome: 0, net: 0 };
        }
        if (isIncome) {
          dailyMap[item.date].income += amt;
          if (isRollover) {
            dailyMap[item.date].rolloverIncome += amt;
          } else {
            dailyMap[item.date].earnedIncome += amt;
          }
        } else {
          dailyMap[item.date].expense += amt;
          if (isDeferred) {
            dailyMap[item.date].creditExpense += amt;
          } else {
            dailyMap[item.date].directExpense += amt;
          }
        }
        dailyMap[item.date].net = dailyMap[item.date].income - dailyMap[item.date].directExpense;
      }
    });

    // Process all items for global calendar aggregates & BNPL liabilities
    this.expenses.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      const isIncome = item.type === 'income';
      const isRollover = isIncome && isRolloverItem(item);
      const isDeferred = !isIncome && ['credit_card', 'card', 'lazypay', 'flipkart_pay3'].includes(item.paymentMethod);

      if (isIncome) {
        if (isRollover) {
          allTimeRolloverIncome += amt;
        } else {
          allTimeEarnedIncome += amt;
        }
      } else {
        allTimeExpense += amt;
        if (!isDeferred) {
          allTimeDirectExpense += amt;
        }

        if (item.paymentMethod === 'credit_card' || item.paymentMethod === 'card') {
          creditCardDues += amt;
          timelineSchedule.nextMonth.creditCard += amt;
        } else if (item.paymentMethod === 'lazypay') {
          lazyPayDues += amt;
          timelineSchedule.nextMonth.lazyPay += amt;
        } else if (item.paymentMethod === 'flipkart_pay3') {
          flipkartPay3Total += amt;
          const perMo = Math.round((amt / 3) * 100) / 100;
          timelineSchedule.currentMonth.flipkartPay3 += perMo;
          timelineSchedule.nextMonth.flipkartPay3 += perMo;
          timelineSchedule.month3.flipkartPay3 += (amt - (perMo * 2));
        }
      }

      if (item.date === todayStr) {
        if (isIncome) {
          if (isRollover) todayRolloverIncome += amt;
          else todayEarnedIncome += amt;
        } else {
          todayExpense += amt;
          if (isDeferred) todayCreditExpense += amt;
          else todayDirectExpense += amt;
        }
      }

      if (item.date) {
        const parts = item.date.split('-').map(Number);
        if (parts.length >= 3) {
          const itemYear = parts[0];
          const itemMonth = parts[1] - 1;
          // Previous Month
          if (itemYear === prevYear && itemMonth === prevMonth) {
            if (isIncome && !isRollover) {
              prevMonthEarnedIncome += amt;
            } else if (!isIncome && !isDeferred) {
              prevMonthDirectExpense += amt;
            }
          }
          // Current Month
          if (itemYear === currentYear && itemMonth === currentMonth) {
            if (isIncome) {
              if (isRollover) monthRolloverIncome += amt;
              else monthEarnedIncome += amt;
            } else {
              monthExpense += amt;
              if (isDeferred) monthCreditExpense += amt;
              else monthDirectExpense += amt;
            }
          }
        }
      }
    });

    timelineSchedule.currentMonth.total = timelineSchedule.currentMonth.creditCard + timelineSchedule.currentMonth.lazyPay + timelineSchedule.currentMonth.flipkartPay3;
    timelineSchedule.nextMonth.total = timelineSchedule.nextMonth.creditCard + timelineSchedule.nextMonth.lazyPay + timelineSchedule.nextMonth.flipkartPay3;
    timelineSchedule.month3.total = timelineSchedule.month3.creditCard + timelineSchedule.month3.lazyPay + timelineSchedule.month3.flipkartPay3;

    const totalCreditDues = creditCardDues + lazyPayDues + flipkartPay3Total;
    const previousMonthClosingBalance = Math.max(0, prevMonthEarnedIncome - prevMonthDirectExpense);

    // Smart Liquid Cash In Hand calculation:
    // Determine whether the filtered period is a continuous multi-period window containing historical origin entries
    let periodLiquidCash = 0;
    if (periodEarnedIncome > 0 && periodDirectExpense > 0 && periodRolloverIncome > 0) {
      // Both prior salary/expenses and rollover exist in the same range (e.g. Last 30 Days)
      // The earned income - direct expenses ALREADY yields the residual balance, so do NOT double-add rollover.
      periodLiquidCash = periodEarnedIncome - periodDirectExpense;
    } else if (periodRolloverIncome > 0 && periodEarnedIncome === 0) {
      // Period has only rollover (e.g. Month started with savings carryover)
      periodLiquidCash = periodRolloverIncome - periodDirectExpense;
    } else {
      periodLiquidCash = (periodEarnedIncome + periodRolloverIncome) - periodDirectExpense;
    }

    const todayIncome = todayEarnedIncome;
    const todayTotalInflow = todayEarnedIncome + todayRolloverIncome;
    const todayCashBalance = todayTotalInflow - todayDirectExpense;

    // Month in-hand cash
    const monthStartingBalance = monthRolloverIncome > 0 ? monthRolloverIncome : previousMonthClosingBalance;
    const monthCashBalance = (monthStartingBalance + monthEarnedIncome) - monthDirectExpense;
    const monthIncome = monthEarnedIncome;

    const liquidCashBalance = periodLiquidCash;
    const effectiveNetBalance = liquidCashBalance - totalCreditDues;

    const allTimeIncome = allTimeEarnedIncome;
    const allTimeNetBalance = allTimeEarnedIncome - (allTimeExpense - totalCreditDues);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayData = dailyMap[dateStr] || { expense: 0, directExpense: 0, creditExpense: 0, income: 0, earnedIncome: 0, rolloverIncome: 0, net: 0 };
      last7Days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        expense: dayData.expense,
        directExpense: dayData.directExpense,
        creditExpense: dayData.creditExpense,
        income: dayData.earnedIncome || dayData.income,
        rolloverIncome: dayData.rolloverIncome || 0,
        amount: dayData.expense // backward compat
      });
    }

    const currentDayOfMonth = now.getDate();
    const dailyAverage = currentDayOfMonth > 0 ? (monthExpense / currentDayOfMonth) : 0;
    const monthlyBudget = (this.settings && this.settings.monthlyBudget) || 25000;
    const budgetUsedPercent = Math.min(100, Math.round((monthExpense / monthlyBudget) * 100));
    const budgetRemaining = Math.max(0, monthlyBudget - monthExpense);
    const dailyBudget = (this.settings && this.settings.dailyBudget) || 800;
    const dailyBudgetRemaining = Math.max(0, dailyBudget - todayExpense);
    const savingsRate = monthEarnedIncome > 0 ? Math.max(0, Math.round(((monthEarnedIncome - monthDirectExpense) / monthEarnedIncome) * 100)) : 0;

    return {
      // Period metrics (Accurate earned revenue vs rollover)
      periodIncome: periodEarnedIncome, // True earned income (₹30,524)
      periodEarnedIncome,
      periodRolloverIncome,
      periodTotalInflow: periodEarnedIncome + periodRolloverIncome,
      periodExpense,
      periodDirectExpense,
      periodCreditExpense,
      liquidCashBalance,
      netBalance: liquidCashBalance, // Liquid cash balance in hand (not deducting credit cards/lazypay)
      effectiveNetBalance,
      totalIncome: periodEarnedIncome, // Accurate earned income
      totalEarnedIncome: periodEarnedIncome,
      totalRolloverIncome: periodRolloverIncome,
      totalExpense: periodExpense,
      totalAllTime: periodExpense, // backward compat

      // Today metrics
      todayTotal: todayExpense, // backward compat
      todayExpense,
      todayDirectExpense,
      todayCreditExpense,
      todayIncome,
      todayEarnedIncome,
      todayRolloverIncome,
      todayNetBalance: todayCashBalance,

      // Month metrics
      monthTotal: monthExpense, // backward compat
      monthExpense,
      monthDirectExpense,
      monthCreditExpense,
      monthIncome: monthEarnedIncome,
      monthEarnedIncome,
      monthRolloverIncome,
      monthStartingBalance,
      previousMonthClosingBalance,
      monthNetBalance: monthCashBalance,

      // Credit & BNPL Dues breakdown
      creditCardDues,
      lazyPayDues,
      flipkartPay3Total,
      totalCreditDues,
      timelineSchedule,

      // All-time metrics
      allTimeIncome,
      allTimeEarnedIncome,
      allTimeRolloverIncome,
      allTimeExpense,
      allTimeNetBalance,

      // Budget & Pacing
      dailyAverage,
      monthlyBudget,
      budgetUsedPercent,
      budgetRemaining,
      dailyBudget,
      dailyBudgetRemaining,
      savingsRate,

      // Breakdown maps
      categoryTotals: expenseCategoryTotals, // backward compat
      expenseCategoryTotals,
      incomeCategoryTotals,
      paymentTotals,
      dailyMap,
      last7Days,
      totalCount: list.length
    };
  }

  // --- Seed Realistic Indian Rupee Demo Data ---

  seedInitialData() {
    const today = new Date();
    const sampleItems = [
      { title: 'Monthly Salary Credit', type: 'income', category: 'salary', amount: 55000, paymentMethod: 'bank', offsetDays: 5, time: '09:30' },
      { title: 'Freelance Design Gig', type: 'income', category: 'freelance', amount: 12000, paymentMethod: 'upi', offsetDays: 2, time: '16:00' },
      { title: 'Chai & Samosa Break', type: 'expense', category: 'food', amount: 60, paymentMethod: 'upi', offsetDays: 0, time: '10:15' },
      { title: 'Swiggy Thali Lunch', type: 'expense', category: 'food', amount: 240, paymentMethod: 'upi', offsetDays: 0, time: '13:30' },
      { title: 'Auto Rickshaw to Office', type: 'expense', category: 'transport', amount: 80, paymentMethod: 'cash', offsetDays: 0, time: '09:00' },
      { title: 'BigBasket Weekly Groceries', type: 'expense', category: 'groceries', amount: 1450, paymentMethod: 'upi', offsetDays: 1, time: '18:30' },
      { title: 'Petrol / Fuel Refill', type: 'expense', category: 'transport', amount: 500, paymentMethod: 'card', offsetDays: 2, time: '08:30' },
      { title: 'WiFi Broadband Bill', type: 'expense', category: 'bills', amount: 799, paymentMethod: 'upi', offsetDays: 3, time: '11:00' },
      { title: 'Movie Tickets & Popcorn', type: 'expense', category: 'entertainment', amount: 650, paymentMethod: 'upi', offsetDays: 4, time: '20:00' }
    ];

    this.expenses = sampleItems.map((sample, idx) => {
      const d = new Date(today);
      d.setDate(d.getDate() - sample.offsetDays);
      const dateStr = getLocalDateString(d);
      return {
        id: `${sample.type === 'income' ? 'inc' : 'exp'}_demo_${idx + 1}_${Date.now()}`,
        type: sample.type,
        amount: sample.amount,
        title: sample.title,
        category: sample.category,
        paymentMethod: sample.paymentMethod,
        date: dateStr,
        time: sample.time,
        timestamp: new Date(`${dateStr}T${sample.time}:00`).getTime(),
        notes: sample.type === 'income' ? 'Verified Income' : 'Indian Rupee sample',
        source: 'welcome_seed',
        createdAt: Date.now() - sample.offsetDays * 86400000
      };
    });
  }

  exportCSV() {
    const headers = ['ID', 'Type', 'Date', 'Time', 'Title', 'Category', 'Amount (INR)', 'Payment Method', 'Notes'];
    const rows = this.expenses.map(e => [
      `"${e.id}"`,
      `"${e.type || 'expense'}"`,
      `"${e.date}"`,
      `"${e.time}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      `"${e.paymentMethod}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `spentify_transactions_${getLocalDateString(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportJSON() {
    const data = { version: '2.5', currency: 'INR', expenses: this.expenses, assets: this.assets, settings: this.settings };
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
    link.setAttribute('download', `spentify_backup_${getLocalDateString(new Date())}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async importJSON(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      let count = 0;
      if (Array.isArray(data.expenses)) {
        const existingIds = new Set(this.expenses.map(e => e.id));
        data.expenses.forEach(e => {
          if (!existingIds.has(e.id)) {
            this.expenses.push(e);
            count++;
          }
        });
        this.expenses.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      if (Array.isArray(data.assets)) {
        const existingAssetIds = new Set(this.assets.map(a => a.id));
        data.assets.forEach(a => {
          if (!existingAssetIds.has(a.id)) {
            this.assets.push(a);
            count++;
          }
        });
      }
      await this.saveLocalData();
      this.notifyListeners();
      return { success: true, count };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

if (typeof window !== 'undefined') {
  window.ExpenseDatabase = ExpenseDatabase;
  window.getLocalDateString = getLocalDateString;
  window.isRolloverItem = isRolloverItem;
  try {
    window.db = window.db || new ExpenseDatabase();
  } catch (e) {
    console.warn('ExpenseDatabase init error:', e);
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.ExpenseDatabase = ExpenseDatabase;
  globalThis.getLocalDateString = getLocalDateString;
  globalThis.isRolloverItem = isRolloverItem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExpenseDatabase, getLocalDateString, isRolloverItem };
}
