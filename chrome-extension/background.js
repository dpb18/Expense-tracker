/**
 * Spentify - Background Service Worker (Manifest V3)
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('Spentify extension installed successfully!');
  updateBadge();
});

// Update badge whenever storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.spentify_expenses || changes.spentify_settings)) {
    updateBadge();
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_dashboard') {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  }
});

async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(['spentify_expenses', 'spentify_settings']);
    const expenses = result.spentify_expenses || [];
    const settings = result.spentify_settings || { currencySymbol: '$', monthlyBudget: 1200, dailyBudget: 40 };

    const todayStr = new Date().toISOString().split('T')[0];
    let todayTotal = 0;
    expenses.forEach(e => {
      if (e.date === todayStr) {
        todayTotal += (e.amount || 0);
      }
    });

    const symbol = settings.currencySymbol || '$';
    const rounded = Math.round(todayTotal);
    const badgeText = rounded > 0 ? `${symbol}${rounded}` : '';

    await chrome.action.setBadgeText({ text: badgeText });

    const dailyBudget = settings.dailyBudget || (settings.monthlyBudget / 30);
    let color = '#10b981'; // green
    if (todayTotal > dailyBudget) {
      color = '#ef4444'; // red (exceeded)
    } else if (todayTotal > dailyBudget * 0.75) {
      color = '#f59e0b'; // amber (warning)
    }

    await chrome.action.setBadgeBackgroundColor({ color });
  } catch (err) {
    console.error('Badge update error:', err);
  }
}
