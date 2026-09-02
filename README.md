# 💸 Spentify - Cross-Platform Expense Tracker Suite

A seamless, distraction-free expense tracking ecosystem designed for instant logging on your laptop while working, combined with full analytics dashboards and real-time synchronization to your mobile device.

---

## 🌟 What's Included

```
expense-tracker/
├── chrome-extension/         # Chrome Extension (Manifest V3)
│   ├── manifest.json         # Extension manifest with shortcuts & permissions
│   ├── popup.html/.css/.js   # ⚡ 5-Second Quick-Logger Popup with Today's Hero Card
│   ├── dashboard.html/.css/.js # 📊 Full-Tab Analytics Dashboard with Chart.js
│   ├── firebase-config.js    # Firebase credentials & default configurations
│   ├── db.js                 # Unified Reactive Storage & Real-Time Sync Engine
│   ├── background.js         # Service worker for daily spend badge on toolbar icon
│   ├── lib/chart.umd.min.js  # Offline bundled Chart.js engine
│   └── icons/                # High-res 16px, 48px, 128px PNG extension icons
├── mobile-app/               # React Native (Expo) Mobile App
│   ├── App.js                # Full Mobile Expense App with Tabs & FAB Add Modal
│   ├── package.json          # Dependencies (React Native, Firebase, AsyncStorage)
│   ├── app.json              # Expo Configuration
│   └── src/firebase.js       # Real-Time Firestore Sync Service
├── firestore.rules           # Cloud Firestore Security Rules
└── generate_icons.cjs        # Script to regenerate icons if needed
```

---

## 🚀 Quick Start Guide

### 1. Load the Chrome Extension in your Browser

1. Open **Google Chrome** (or Edge / Brave).
2. Navigate to `chrome://extensions/` in the URL bar.
3. Turn ON **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"** in the top left.
5. Select the folder:
   `c:\Users\Dhiraj Pratim Barman\.gemini\antigravity-ide\scratch\privacy-policy\expense-tracker\chrome-extension`
6. Pin **Spentify** to your Chrome toolbar!

> **Keyboard Shortcuts:**
> - `Alt + Shift + E` (or click icon): Instantly open the **Quick Expense Popup**
> - `Alt + Shift + D`: Open the **Full Analytics Dashboard** in a new tab

---

### 2. Run the Mobile App (Expo)

1. Open a terminal in the `mobile-app` directory:
   ```bash
   cd "c:\Users\Dhiraj Pratim Barman\.gemini\antigravity-ide\scratch\privacy-policy\expense-tracker\mobile-app"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Scan the QR code using the **Expo Go** app on your Android or iOS phone!

---

## ☁️ Enabling Real-Time Cloud Sync (Firebase)

The extension and mobile app work **100% out of the box with zero setup** using local storage caching and sample data.

To sync real-time across your laptop and phone with your Google Account:
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project (e.g. `spentify-tracker`).
2. Enable **Authentication** -> Sign-in method -> **Google**.
3. Enable **Cloud Firestore** in test or production mode (copy `firestore.rules`).
4. Copy your web app configuration keys into:
   - `chrome-extension/firebase-config.js`
   - `mobile-app/src/firebase.js`

---

## ✨ Features

- **⚡ Distraction-Free Logging**: Auto-focused amount, quick +5, +10, +20, +50 chip presets, category pills, and `Enter` key instant save.
- **🏷️ Smart Categories & Modes**: Food, Transport, Groceries, Shopping, Bills, Entertainment, Health, Tech with Card/Cash/UPI/Bank modes.
- **📈 Dynamic Charting**: Interactive category donut charts, daily spending trend velocity charts, and budget burn indicators.
- **🎯 Budget Goal Tracking**: Color-coded alerts when approaching or exceeding daily/monthly targets.
- **💾 Export & Import**: One-click export to CSV (Excel/Sheets) and full JSON backup/restore.
- **🏷️ Real-Time Toolbar Badge**: Extension icon badge automatically shows today's spend total in real-time (Green = Under budget, Red = Over budget).
