/**
 * Spentify Mobile - Firebase & Real-Time Sync Service (INR & Google Sync)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDDTPqBvDm7nraufcBwZG6cZi4_nVJmdtY",
  authDomain: "spentify-tracker.firebaseapp.com",
  projectId: "spentify-tracker",
  storageBucket: "spentify-tracker.firebasestorage.app",
  messagingSenderId: "795271930013",
  appId: "1:795271930013:web:a0366396bffc76caa8b474"
};

let app;
let db = null;

try {
  if (FIREBASE_CONFIG.apiKey) {
    app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Mobile Firebase init:', e);
}

const STORAGE_KEY = 'spentify_mobile_expenses';
const USER_KEY = 'spentify_mobile_user';

export function getCanonicalUserId(email) {
  if (!email) return 'default_user';
  return 'user_' + email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

export const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Dining", icon: "🍔", color: "#f59e0b" },
  { id: "transport", name: "Transport & Fuel", icon: "🚗", color: "#3b82f6" },
  { id: "groceries", name: "Groceries & Mart", icon: "🛒", color: "#10b981" },
  { id: "shopping", name: "Shopping", icon: "🛍️", color: "#ec4899" },
  { id: "bills", name: "Bills & Utilities", icon: "💡", color: "#8b5cf6" },
  { id: "entertainment", name: "Movies & Outing", icon: "🎬", color: "#06b6d4" },
  { id: "health", name: "Health & Pharmacy", icon: "💊", color: "#ef4444" },
  { id: "tech", name: "Recharge & Tech", icon: "💻", color: "#6366f1" },
  { id: "other", name: "Other Expenses", icon: "📦", color: "#64748b" }
];

export const DEFAULT_INCOME_CATEGORIES = [
  { id: "salary", name: "Salary & Wages", icon: "💼", color: "#10b981" },
  { id: "freelance", name: "Freelance & Gigs", icon: "💻", color: "#06b6d4" },
  { id: "business", name: "Business & Sales", icon: "🏢", color: "#3b82f6" },
  { id: "investments", name: "Investments & Dividends", icon: "📈", color: "#8b5cf6" },
  { id: "gift", name: "Allowance & Gifts", icon: "🎁", color: "#ec4899" },
  { id: "savings_rollover", name: "Savings Rollover / Opening Balance", icon: "🔄", color: "#64748b", isRollover: true },
  { id: "other_income", name: "Other Income", icon: "💰", color: "#14b8a6" }
];

export const DEFAULT_PAYMENTS = [
  { id: "upi", name: "UPI / GPay", icon: "⚡" },
  { id: "card", name: "Card / Credit", icon: "💳" },
  { id: "cash", name: "Cash", icon: "💵" },
  { id: "bank", name: "Net Banking", icon: "🏦" }
];

export async function getLocalUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveLocalUser(user) {
  try {
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  } catch (e) {}
}

export async function getLocalExpenses() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function saveLocalExpenses(expenses) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error(e);
  }
}

export async function addExpense(expense, user) {
  const type = expense.type === 'income' ? 'income' : 'expense';
  const prefix = type === 'income' ? 'inc_' : 'exp_';
  const id = prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const now = new Date();
  const dateStr = expense.date || now.toISOString().split('T')[0];
  const timeStr = expense.time || now.toTimeString().split(' ')[0].substr(0, 5);
  const userEmail = (user?.email || '').toLowerCase().trim();

  const newEntry = {
    id,
    type,
    amount: parseFloat(expense.amount) || 0,
    title: (expense.title || (type === 'income' ? 'Income' : 'Expense')).trim(),
    category: expense.category || (type === 'income' ? 'salary' : 'other'),
    paymentMethod: expense.paymentMethod || (type === 'income' ? 'bank' : 'upi'),
    date: dateStr,
    time: timeStr,
    timestamp: new Date(`${dateStr}T${timeStr}:00`).getTime() || Date.now(),
    notes: (expense.notes || '').trim(),
    userEmail,
    source: 'mobile_app',
    createdAt: Date.now()
  };

  const current = await getLocalExpenses();
  current.unshift(newEntry);
  await saveLocalExpenses(current);

  const uid = userEmail ? getCanonicalUserId(userEmail) : (user?.uid || 'default_user');
  if (db && uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'expenses', id), newEntry);
    } catch (err) {
      console.warn('Mobile cloud sync pending:', err);
    }
  }

  return newEntry;
}

export async function deleteExpense(id, user) {
  const current = await getLocalExpenses();
  const filtered = current.filter(e => e.id !== id);
  await saveLocalExpenses(filtered);

  const userEmail = (user?.email || '').toLowerCase().trim();
  const uid = userEmail ? getCanonicalUserId(userEmail) : (user?.uid || 'default_user');
  if (db && uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'expenses', id));
    } catch (err) {
      console.warn('Mobile cloud delete failed:', err);
    }
  }
}

export function subscribeToCloudExpenses(user, onUpdate) {
  const userEmail = (user?.email || '').toLowerCase().trim();
  const uid = userEmail ? getCanonicalUserId(userEmail) : (user?.uid || 'default_user');
  if (!db || !uid || uid === 'default_user') return () => {};

  try {
    const expensesCol = collection(db, 'users', uid, 'expenses');
    const q = query(expensesCol, orderBy('timestamp', 'desc'));

    // Instant direct fetch for immediate UI population
    getDocs(q).then((snapshot) => {
      const list = [];
      snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
      if (list.length > 0) {
        saveLocalExpenses(list);
        onUpdate(list);
      }
    }).catch(err => {
      console.warn('Mobile initial fetch note:', err);
    });

    // Real-time live listener
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
      saveLocalExpenses(list);
      onUpdate(list);
    }, (err) => {
      console.warn('Mobile snapshot listener info:', err);
    });
  } catch (e) {
    return () => {};
  }
}
