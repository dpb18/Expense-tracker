/**
 * Spentify - Firebase Cloud Sync & Configuration
 * 
 * Configured with Google Authentication & Real-Time Cloud Firestore Sync.
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDDTPqBvDm7nraufcBwZG6cZi4_nVJmdtY",
  authDomain: "spentify-tracker.firebaseapp.com",
  projectId: "spentify-tracker",
  storageBucket: "spentify-tracker.firebasestorage.app",
  messagingSenderId: "795271930013",
  appId: "1:795271930013:web:a0366396bffc76caa8b474"
};



// Default app settings configured for Indian Rupees (INR ₹)
const DEFAULT_SETTINGS = {
  currency: "INR",
  currencySymbol: "₹",
  monthlyBudget: 25000,
  dailyBudget: 800,
  syncMode: "google", // 'google' or 'local'
  theme: "dark",
  user: null, // null when not signed in, or { uid, email, displayName, photoURL }
  categories: [
    { id: "food", name: "Food & Dining", icon: "🍔", color: "#f59e0b" },
    { id: "transport", name: "Transport & Fuel", icon: "🚗", color: "#3b82f6" },
    { id: "groceries", name: "Groceries & Mart", icon: "🛒", color: "#10b981" },
    { id: "shopping", name: "Shopping", icon: "🛍️", color: "#ec4899" },
    { id: "bills", name: "Bills & Utilities", icon: "💡", color: "#8b5cf6" },
    { id: "entertainment", name: "Movies & Outing", icon: "🎬", color: "#06b6d4" },
    { id: "health", name: "Health & Pharmacy", icon: "💊", color: "#ef4444" },
    { id: "tech", name: "Recharge & Tech", icon: "💻", color: "#6366f1" },
    { id: "other", name: "Other Expenses", icon: "📦", color: "#64748b" }
  ],
  incomeCategories: [
    { id: "salary", name: "Salary & Wages", icon: "💼", color: "#10b981" },
    { id: "freelance", name: "Freelance & Gigs", icon: "💻", color: "#06b6d4" },
    { id: "business", name: "Business & Sales", icon: "🏢", color: "#3b82f6" },
    { id: "investments", name: "Investments & Dividends", icon: "📈", color: "#8b5cf6" },
    { id: "gift", name: "Allowance & Gifts", icon: "🎁", color: "#ec4899" },
    { id: "savings_rollover", name: "Savings Rollover / Opening Balance", icon: "🔄", color: "#64748b", isRollover: true },
    { id: "other_income", name: "Other Income", icon: "💰", color: "#14b8a6" }
  ],
  paymentMethods: [
    { id: "upi", name: "UPI / GPay / PhonePe", icon: "⚡", type: "direct" },
    { id: "credit_card", name: "Credit Card (Paid Next Mo)", icon: "💳", type: "credit" },
    { id: "lazypay", name: "LazyPay / BNPL (Paid Next Mo)", icon: "🛍️", type: "credit" },
    { id: "flipkart_pay3", name: "Flipkart Pay in 3 (3 Months)", icon: "📦", type: "installment_3" },
    { id: "bank", name: "Bank / Debit Card", icon: "🏦", type: "direct" },
    { id: "cash", name: "Cash", icon: "💵", type: "direct" },
    { id: "card", name: "Card", icon: "💳", type: "credit" } // backward compat
  ],
  assetCategories: [
    { id: "gold", name: "Gold & Precious Metals", icon: "🟡", color: "#eab308" },
    { id: "sip", name: "Mutual Funds & SIP", icon: "📊", color: "#3b82f6" },
    { id: "stocks", name: "Stocks & Equities", icon: "📈", color: "#10b981" },
    { id: "fd", name: "Fixed Deposit & PPF", icon: "🏦", color: "#8b5cf6" },
    { id: "sgb", name: "Sovereign Gold Bond (SGB)", icon: "💎", color: "#f59e0b" },
    { id: "other", name: "Other Investments", icon: "🌐", color: "#64748b" }
  ],
  assetPlatforms: [
    { id: "zerodha", name: "Zerodha Kite / Coin", icon: "🪁" },
    { id: "groww", name: "Groww", icon: "🌱" },
    { id: "paytm", name: "Paytm Money", icon: "🟡" },
    { id: "indmoney", name: "INDmoney", icon: "💼" },
    { id: "angelone", name: "Angel One", icon: "👼" },
    { id: "upstox", name: "Upstox", icon: "⚡" },
    { id: "bank", name: "Bank / Post Office", icon: "🏦" },
    { id: "other", name: "Other Platform", icon: "🌐" }
  ]
};

// Currencies supported (INR as primary)
const CURRENCIES = {
  INR: { symbol: "₹", name: "Indian Rupee (INR ₹)" },
  USD: { symbol: "$", name: "US Dollar (USD $)" },
  EUR: { symbol: "€", name: "Euro (EUR €)" },
  GBP: { symbol: "£", name: "British Pound (GBP £)" },
  AED: { symbol: "AED", name: "UAE Dirham (AED)" },
  CAD: { symbol: "CA$", name: "Canadian Dollar (CAD)" },
  AUD: { symbol: "AU$", name: "Australian Dollar (AUD)" },
  SGD: { symbol: "S$", name: "Singapore Dollar (SGD)" }
};

function getCanonicalUserId(email) {
  if (!email) return 'default_user';
  return 'user_' + String(email).toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

if (typeof window !== "undefined") {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.CURRENCIES = CURRENCIES;
  window.getCanonicalUserId = getCanonicalUserId;
}

if (typeof global !== "undefined") {
  global.FIREBASE_CONFIG = FIREBASE_CONFIG;
  global.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  global.CURRENCIES = CURRENCIES;
  global.getCanonicalUserId = getCanonicalUserId;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FIREBASE_CONFIG, DEFAULT_SETTINGS, CURRENCIES, getCanonicalUserId };
}
