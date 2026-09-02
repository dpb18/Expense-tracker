import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Alert
} from 'react-native';
import {
  getLocalExpenses,
  getLocalUser,
  saveLocalUser,
  addExpense,
  deleteExpense,
  subscribeToCloudExpenses,
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENTS
} from './src/firebase';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const [currencySymbol] = useState('₹');
  const [monthlyBudget] = useState(25000);
  const [dailyBudget] = useState(800);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'analytics', 'settings'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('food');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    initApp();
  }, []);

  async function initApp() {
    const savedUser = await getLocalUser();
    if (savedUser) {
      setUser(savedUser);
      setGoogleEmailInput(savedUser.email);
    }
    await loadExpenses();
  }

  useEffect(() => {
    const unsubscribe = subscribeToCloudExpenses(user, (cloudList) => {
      setExpenses(cloudList);
    });
    return () => unsubscribe && unsubscribe();
  }, [user]);

  async function loadExpenses() {
    const list = await getLocalExpenses();
    if (list.length === 0) {
      // Seed Indian Rupee sample data
      const sample = [
        { id: '1', title: 'Chai & Samosa Break', amount: 60, category: 'food', paymentMethod: 'upi', date: new Date().toISOString().split('T')[0], time: '10:15' },
        { id: '2', title: 'Swiggy Thali Lunch', amount: 240, category: 'food', paymentMethod: 'upi', date: new Date().toISOString().split('T')[0], time: '13:30' },
        { id: '3', title: 'Auto Rickshaw to Office', amount: 80, category: 'transport', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0], time: '09:00' },
        { id: '4', title: 'BigBasket Weekly Groceries', amount: 1450, category: 'groceries', paymentMethod: 'upi', date: new Date().toISOString().split('T')[0], time: '18:30' }
      ];
      setExpenses(sample);
    } else {
      setExpenses(list);
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotal = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const monthTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetRemaining = Math.max(0, monthlyBudget - monthTotal);
  const budgetPct = Math.min(100, Math.round((monthTotal / monthlyBudget) * 100));

  async function handleSaveExpense() {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter what this expense was for (e.g. Chai, Auto, Lunch).');
      return;
    }

    const newEntry = await addExpense({
      amount: num,
      title: title.trim(),
      category,
      paymentMethod,
      notes
    }, user);

    setExpenses([newEntry, ...expenses]);
    setAmount('');
    setTitle('');
    setNotes('');
    setIsAddModalOpen(false);
  }

  async function handleDeleteExpense(id) {
    await deleteExpense(id, user);
    setExpenses(expenses.filter(e => e.id !== id));
  }

  async function handleGoogleLogin(customEmail = null) {
    const email = (customEmail || googleEmailInput || '').trim();
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid Google Account email.');
      return;
    }
    const name = email.split('@')[0];
    const loggedUser = {
      uid: 'goog_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
      email: email,
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,8b5cf6`,
      verified: true
    };
    await saveLocalUser(loggedUser);
    setUser(loggedUser);
    setIsGoogleModalOpen(false);
    Alert.alert('Google Sync Active', `Logged in as ${loggedUser.displayName} (${email}). All expenses will sync with your Chrome Extension!`);
  }

  async function handleGoogleLogout() {
    await saveLocalUser(null);
    setUser(null);
    setGoogleEmailInput('');
    setIsGoogleModalOpen(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandIcon}>💸</Text>
          <View>
            <Text style={styles.brandTitle}>Spentify</Text>
            <Text style={styles.brandSub}>Indian Rupee (INR ₹)</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.googleSyncPill}
          onPress={() => setIsGoogleModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleSyncText}>
            {user ? user.email.split('@')[0] : 'Sign in'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'home' && (
          <>
            {/* Today Spend Hero Card */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>TODAY'S SPENDING</Text>
              <Text style={styles.heroAmount}>{currencySymbol}{Math.round(todayTotal).toLocaleString('en-IN')}</Text>
              <View style={styles.heroFooter}>
                <Text style={styles.heroSub}>Daily Target: {currencySymbol}{dailyBudget}</Text>
                <Text style={[styles.heroStatus, todayTotal > dailyBudget ? styles.statusDanger : styles.statusSuccess]}>
                  {todayTotal > dailyBudget ? 'Over daily limit' : `${currencySymbol}${Math.round(dailyBudget - todayTotal)} left`}
                </Text>
              </View>
            </View>

            {/* Quick KPI Row */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiBoxLabel}>MONTHLY SPEND</Text>
                <Text style={styles.kpiBoxVal}>{currencySymbol}{Math.round(monthTotal).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiBoxLabel}>BUDGET LEFT</Text>
                <Text style={[styles.kpiBoxVal, { color: '#10b981' }]}>{currencySymbol}{Math.round(budgetRemaining).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Budget Progress Bar */}
            <View style={styles.budgetCard}>
              <View style={styles.budgetCardHeader}>
                <Text style={styles.budgetCardTitle}>Monthly Target (₹{monthlyBudget.toLocaleString('en-IN')})</Text>
                <Text style={styles.budgetCardPct}>{budgetPct}% Used</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${budgetPct}%` }]} />
              </View>
            </View>

            {/* Recent Expenses List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <Text style={styles.sectionCount}>{expenses.length} entries</Text>
            </View>

            {expenses.slice(0, 10).map(item => {
              const cat = DEFAULT_CATEGORIES.find(c => c.id === item.category) || { icon: '📦', name: 'Other' };
              const pay = DEFAULT_PAYMENTS.find(p => p.id === item.paymentMethod) || { icon: '⚡', name: 'UPI' };
              return (
                <View key={item.id} style={styles.transactionCard}>
                  <View style={styles.txLeft}>
                    <Text style={styles.txIcon}>{cat.icon}</Text>
                    <View>
                      <Text style={styles.txTitle}>{item.title}</Text>
                      <Text style={styles.txMeta}>{item.date} • {pay.name}</Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>-{currencySymbol}{Math.round(item.amount || 0).toLocaleString('en-IN')}</Text>
                    <TouchableOpacity onPress={() => handleDeleteExpense(item.id)}>
                      <Text style={styles.txDeleteBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'analytics' && (
          <View>
            <Text style={styles.sectionTitle}>Category Spending Breakdown</Text>
            {DEFAULT_CATEGORIES.map(cat => {
              const catTotal = expenses
                .filter(e => e.category === cat.id)
                .reduce((s, e) => s + (e.amount || 0), 0);
              if (catTotal === 0) return null;
              const pct = monthTotal > 0 ? Math.round((catTotal / monthTotal) * 100) : 0;
              return (
                <View key={cat.id} style={styles.analyticsRow}>
                  <View style={styles.analyticsLeft}>
                    <Text style={styles.analyticsIcon}>{cat.icon}</Text>
                    <Text style={styles.analyticsName}>{cat.name}</Text>
                  </View>
                  <View style={styles.analyticsRight}>
                    <Text style={styles.analyticsAmount}>{currencySymbol}{Math.round(catTotal).toLocaleString('en-IN')}</Text>
                    <Text style={styles.analyticsPct}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Cloud Sync & Preferences</Text>
            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => setIsGoogleModalOpen(true)}
            >
              <Text style={styles.settingLabel}>Google Account</Text>
              <Text style={[styles.settingVal, { color: '#6366f1' }]}>
                {user ? user.email : 'Tap to sign in with Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingVal}>Indian Rupee (INR ₹)</Text>
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Monthly Budget Limit</Text>
              <Text style={styles.settingVal}>₹25,000</Text>
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Daily Soft Budget</Text>
              <Text style={styles.settingVal}>₹800 / day</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (Add Expense) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setIsAddModalOpen(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'home' && styles.navTabActive]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'analytics' && styles.navTabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={[styles.navText, activeTab === 'analytics' && styles.navTextActive]}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'settings' && styles.navTabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Add Expense Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Expense</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Amount Input */}
              <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>

              {/* Title Input */}
              <Text style={styles.inputLabel}>WHAT WAS THIS FOR?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Chai, Swiggy, Auto, Petrol..."
                placeholderTextColor="#64748b"
                value={title}
                onChangeText={setTitle}
              />

              {/* Category Picker */}
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {DEFAULT_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catBtn, category === cat.id && styles.catBtnActive]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={styles.catBtnIcon}>{cat.icon}</Text>
                    <Text style={[styles.catBtnText, category === cat.id && styles.catBtnTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payment Method */}
              <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
              <View style={styles.paymentRow}>
                {DEFAULT_PAYMENTS.map(pay => (
                  <TouchableOpacity
                    key={pay.id}
                    style={[styles.payBtn, paymentMethod === pay.id && styles.payBtnActive]}
                    onPress={() => setPaymentMethod(pay.id)}
                  >
                    <Text style={styles.payBtnText}>{pay.icon} {pay.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes Input */}
              <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Optional tags like #work, #treat..."
                placeholderTextColor="#64748b"
                value={notes}
                onChangeText={setNotes}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                activeOpacity={0.8}
                onPress={handleSaveExpense}
              >
                <Text style={styles.submitBtnText}>Log Expense (₹{amount || '0'})</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Google Sign-in Modal */}
      <Modal
        visible={isGoogleModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsGoogleModalOpen(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.googleModalBox}>
            <Text style={styles.googleModalTitle}>Google Account Sync</Text>
            <Text style={styles.googleModalSub}>
              Use the same Google email as your Chrome Extension to sync all your laptop & mobile expenses seamlessly in real time.
            </Text>

            <TextInput
              style={styles.googleInput}
              placeholder="Enter your Google Account email"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={googleEmailInput}
              onChangeText={setGoogleEmailInput}
            />

            <View style={styles.googleModalBtns}>
              {user ? (
                <TouchableOpacity
                  style={[styles.googleBtn, styles.googleLogoutBtn]}
                  onPress={handleGoogleLogout}
                >
                  <Text style={styles.googleBtnText}>Sign Out</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.googleBtn, styles.googleSaveBtn]}
                onPress={handleGoogleLogin}
              >
                <Text style={styles.googleBtnText}>{user ? 'Update Account' : 'Sign In & Sync'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.googleCloseBtn}
              onPress={() => setIsGoogleModalOpen(false)}
            >
              <Text style={styles.googleCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { fontSize: 26 },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  brandSub: { fontSize: 11, color: '#94a3b8' },
  googleSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  googleG: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    backgroundColor: '#ea4335',
    width: 16,
    height: 16,
    textAlign: 'center',
    lineHeight: 16,
    borderRadius: 8
  },
  googleSyncText: { fontSize: 12, color: '#f8fafc', fontWeight: '600' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 90 },
  heroCard: {
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 16
  },
  heroLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  heroAmount: { fontSize: 34, fontWeight: '900', color: '#ffffff', marginVertical: 4 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  heroSub: { fontSize: 12, color: '#64748b' },
  heroStatus: { fontSize: 12, fontWeight: '600' },
  statusSuccess: { color: '#10b981' },
  statusDanger: { color: '#ef4444' },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kpiBox: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  kpiBoxLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  kpiBoxVal: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  budgetCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20
  },
  budgetCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetCardTitle: { fontSize: 13, fontWeight: '600', color: '#cbd5e1' },
  budgetCardPct: { fontSize: 12, fontWeight: '700', color: '#6366f1' },
  progressTrack: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  sectionCount: { fontSize: 12, color: '#64748b' },
  transactionCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon: { fontSize: 22 },
  txTitle: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  txMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  txRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txAmount: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  txDeleteBtn: { color: '#64748b', fontSize: 14, padding: 4 },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8
  },
  analyticsLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analyticsIcon: { fontSize: 20 },
  analyticsName: { fontSize: 14, color: '#ffffff', fontWeight: '500' },
  analyticsRight: { alignItems: 'flex-end' },
  analyticsAmount: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  analyticsPct: { fontSize: 11, color: '#64748b' },
  settingsContainer: { gap: 10 },
  settingCard: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  settingLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  settingVal: { fontSize: 14, color: '#ffffff', fontWeight: '600', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },
  fabIcon: { fontSize: 32, color: '#ffffff', fontWeight: '300', lineHeight: 34 },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  navTab: { alignItems: 'center', padding: 6 },
  navTabActive: { opacity: 1 },
  navIcon: { fontSize: 18 },
  navText: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 2 },
  navTextActive: { color: '#6366f1' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  modalCloseBtn: { fontSize: 18, color: '#64748b', padding: 4 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginTop: 12, marginBottom: 6, letterSpacing: 0.5 },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a233a',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#263354'
  },
  currencyPrefix: { fontSize: 24, fontWeight: '700', color: '#6366f1', marginRight: 6 },
  amountInput: { flex: 1, height: 48, fontSize: 24, fontWeight: '700', color: '#ffffff' },
  textInput: {
    backgroundColor: '#1a233a',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#263354'
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161f36',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232f4e',
    gap: 4
  },
  catBtnActive: { backgroundColor: 'rgba(99, 102, 241, 0.25)', borderColor: '#6366f1' },
  catBtnIcon: { fontSize: 14 },
  catBtnText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  catBtnTextActive: { color: '#ffffff', fontWeight: '700' },
  paymentRow: { flexDirection: 'row', gap: 6 },
  payBtn: {
    flex: 1,
    backgroundColor: '#161f36',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232f4e',
    alignItems: 'center'
  },
  payBtnActive: { backgroundColor: 'rgba(139, 92, 246, 0.25)', borderColor: '#8b5cf6' },
  payBtnText: { fontSize: 11, color: '#cbd5e1', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  googleModalBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  googleModalTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  googleModalSub: { fontSize: 13, color: '#94a3b8', lineHeight: 18, marginBottom: 16 },
  googleInput: {
    backgroundColor: '#1a233a',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#263354',
    marginBottom: 16
  },
  googleModalBtns: { flexDirection: 'row', gap: 10 },
  googleBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  googleSaveBtn: { backgroundColor: '#6366f1' },
  googleLogoutBtn: { backgroundColor: '#ef4444' },
  googleBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  googleCloseBtn: { marginTop: 12, alignItems: 'center' },
  googleCloseText: { color: '#64748b', fontSize: 13 }
});
