class TransactionParser {
  constructor() {
    this.categories = {
      'Transportation': ['grab', 'taxi', 'uber', 'lyft', 'transit', 'parking', 'toll', 'air', 'airline', 'china air'],
      'Food & Dining': ['restaurant', 'cafe', 'coffee', 'bakery', 'brewery', 'bar', 'club', 'kitchen', 'grill', 'bistro', 'eatery', 'dining', 'food', 'wolfgang puck', 'bagel', 'acme', 'zin cafe', 'raw cafe', 'draeger'],
      'Beauty & Personal Care': ['salon', 'beauty', 'spa', 'hair', 'barber', 'nail', 'massage'],
      'Groceries': ['grocery', 'supermarket', 'market', 'trader joes', 'whole foods', 'safeway'],
      'Entertainment': ['cinema', 'movie', 'theater', 'concert', 'lawn', 'club', 'entertainment'],
      'Shopping': ['amazon', 'shop', 'store', 'retail', 'clothing', 'apparel', 'cheng meng'],
      'Lodging': ['airbnb', 'hotel', 'hostel', 'accommodation'],
      'Health & Fitness': ['gym', 'fitness', 'yoga', 'wellness', 'health', 'pharmacy', 'cvs', 'walgreens', 'new day'],
      'Utilities': ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
      'Subscriptions': ['netflix', 'spotify', 'hulu', 'disney', 'apple', 'subscription', 'membership'],
      'Government & Fees': ['dmv', 'state of calif', 'government', 'tax', 'fee'],
      'Other': []
    };
  }

  parseChaseTransactions(rawText) {
    const lines = rawText.trim().split('\n');
    const transactions = [];

    // First, try single-line parsing for credit card format
    const singleLineTransactions = this.parseSingleLineFormat(lines);
    transactions.push(...singleLineTransactions);

    // Then, try multi-line parsing for checking account format
    const multiLineTransactions = this.parseMultiLineFormat(lines);
    transactions.push(...multiLineTransactions);

    return transactions;
  }

  parseSingleLineFormat(lines) {
    const transactions = [];
    let skipNext = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Skip empty lines, exchange rates, and header/footer text
      if (!line ||
          line.toLowerCase().includes('showing activity') ||
          line.toLowerCase().includes('activity since') ||
          line.toLowerCase().includes('exchg rate') ||
          line.toLowerCase().includes('rupiah') ||
          line.toLowerCase().includes('new taiwan dollar') ||
          line.toLowerCase().includes('account activity') ||
          line.toLowerCase().includes('page ') ||
          line.toLowerCase().includes('statement date') ||
          line.toLowerCase().includes('current balance') ||
          line.toLowerCase().includes('show details') ||
          line.toLowerCase().includes('not sorted') ||
          line.toLowerCase().includes('action') ||
          line.match(/^\d+\s+X\s+0\.\d+/) ||
          skipNext) {
        skipNext = false;
        continue;
      }

      // Parse transaction line
      const transaction = this.parseTransactionLine(line);
      if (transaction) {
        transactions.push(transaction);
        // Skip the next line if it's likely an exchange rate
        if (i + 1 < lines.length && lines[i + 1].toLowerCase().includes('rupiah')) {
          skipNext = true;
        }
      }
    }

    return transactions;
  }

  parseMultiLineFormat(lines) {
    const transactions = [];
    const seenTransactions = new Set(); // Track duplicates
    let currentDate = null;
    let currentMerchant = null;
    let lookingForAmount = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      // Check if this line is a date in "Jan 2, 2026" or "12/29/2025" format
      const dateMatch = line.match(/^([A-Za-z]{3}\s+\d{1,2},\s+\d{4})$/) ||
                       line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})$/);

      if (dateMatch) {
        currentDate = dateMatch[1];
        currentMerchant = null;
        lookingForAmount = false;
        continue;
      }

      // Check if this line is a merchant name (not a header/footer)
      if (currentDate && !currentMerchant && !this.isHeaderOrFooter(line)) {
        // Skip duplicate merchant names and category labels
        if (!line.toLowerCase().includes('travel') &&
            !line.toLowerCase().includes('shopping') &&
            !line.toLowerCase().includes('card') &&
            line.length > 3) {
          currentMerchant = line;
          lookingForAmount = true;
          continue;
        }
      }

      // Check if this line contains an amount
      if (currentDate && currentMerchant && lookingForAmount) {
        const amountMatch = line.match(/−?\$(\d+[\d,]*\.?\d*)/);
        if (amountMatch) {
          const amount = amountMatch[1].replace(/,/g, '');
          const amountValue = parseFloat(amount);

          // Skip if amount looks like a balance (over $1000)
          if (amountValue > 1000) {
            currentDate = null;
            currentMerchant = null;
            lookingForAmount = false;
            continue;
          }

          // Create a unique key to detect duplicates
          const transactionKey = `${currentDate}|${currentMerchant}|${amountValue}`;

          // Only add if not a duplicate
          if (!seenTransactions.has(transactionKey)) {
            seenTransactions.add(transactionKey);

            transactions.push({
              date: this.parseDate(currentDate),
              expenseName: this.cleanMerchantName(currentMerchant),
              category: this.categorizeTransaction(currentMerchant),
              amount: amountValue,
              notes: ''
            });
          }

          // Reset state
          currentDate = null;
          currentMerchant = null;
          lookingForAmount = false;
        }
      }
    }

    return transactions;
  }

  isHeaderOrFooter(line) {
    const lower = line.toLowerCase();
    return lower.includes('description') ||
           lower.includes('category') ||
           lower.includes('amount') ||
           lower.includes('action') ||
           lower.includes('date') ||
           lower.includes('not sorted') ||
           lower.includes('show details') ||
           lower.includes('current balance') ||
           lower.includes('ach debit') ||
           lower.includes('atm transaction') ||
           lower.includes('fee') ||
           lower.includes('return') ||
           lower.match(/^\$[\d,]+\.?\d*$/) || // Just a dollar amount
           lower.match(/^[\d,]+\.?\d*$/);     // Just a number
  }

  parseTransactionLine(line) {
    // Chase format variations:
    // "Dec 21, 2025 MERCHANT NAME MERCHANT NAME $11.96"
    // "12/21/2025 MERCHANT NAME MERCHANT NAME $11.96"
    // "12/22 MERCHANT NAME LOCATION 10.47" (no $ sign, MM/DD only)
    // "12/29/2025 MERCHANT NAME ... −$32.75negative $32.75" (checking account)

    // Pattern 1: MM/DD MERCHANT AMOUNT (most common in credit card statement)
    const pattern1 = /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(\d+[\d,]*\.?\d*)$/;

    // Pattern 2: Full date with $ sign
    const pattern2 = /^([A-Za-z]{3}\s+\d{1,2},\s+\d{4})\s+(.+?)\s+\$(\d+[\d,]*\.\d{2})$/;

    // Pattern 3: MM/DD/YYYY with $ sign (checking account)
    const pattern3 = /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+−?\$(\d+[\d,]*\.\d{2})/;

    let match = line.match(pattern1) || line.match(pattern2) || line.match(pattern3);

    if (match) {
      const [, dateStr, merchantFull, amount] = match;

      // Merchant name is often duplicated in Chase format
      const merchantParts = merchantFull.trim().split(/\s{2,}/);
      const merchant = merchantParts[0] || merchantFull;

      // Parse date to standard format
      const date = this.parseDate(dateStr);

      // Categorize the transaction
      const category = this.categorizeTransaction(merchant);

      // Remove commas from amount if present
      const cleanAmount = amount.replace(/,/g, '');

      return {
        date,
        expenseName: this.cleanMerchantName(merchant),
        category,
        amount: parseFloat(cleanAmount),
        notes: ''
      };
    }

    return null;
  }

  parseDate(dateStr) {
    // Handle "Dec 21, 2025" format
    if (dateStr.includes(',')) {
      const date = new Date(dateStr);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }

    // Handle "12/21" format (MM/DD only - add current/previous year)
    if (dateStr.split('/').length === 2) {
      const [month, day] = dateStr.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // If the month is in the future (e.g., December when it's January), use previous year
      let year = currentYear;
      if (parseInt(month) > currentMonth) {
        year = currentYear - 1;
      }

      return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
    }

    // Handle "12/21/2025" format (already complete)
    return dateStr;
  }

  cleanMerchantName(merchant) {
    // Remove common prefixes/suffixes
    let cleaned = merchant
      .replace(/^Grab\*\s+A-[A-Z0-9]+/i, 'Grab')
      .replace(/\s+MBL$/i, '')
      .trim();

    // Split by common delimiters and take the first part (dedupe)
    const parts = cleaned.split(/\s{2,}/);
    cleaned = parts[0] || cleaned;

    // Capitalize properly
    cleaned = cleaned
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return cleaned;
  }

  categorizeTransaction(merchant) {
    const merchantLower = merchant.toLowerCase();

    // Check categories in priority order (more specific first)
    const priorityOrder = [
      'Lodging',
      'Government & Fees',
      'Transportation',
      'Food & Dining',
      'Beauty & Personal Care',
      'Groceries',
      'Shopping',
      'Health & Fitness',
      'Entertainment',
      'Utilities',
      'Subscriptions',
      'Other'
    ];

    for (const category of priorityOrder) {
      const keywords = this.categories[category];
      for (const keyword of keywords) {
        if (merchantLower.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Other';
  }

  calculateInsights(transactions, checkingBalance, savingsBalance, ccDebt) {
    const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryTotals = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    // Sort categories by spending
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Spending level assessment
    let spendingLevel = 'Medium';
    if (totalExpenses < 100) spendingLevel = 'Low';
    else if (totalExpenses > 300) spendingLevel = 'High';

    // Runway calculation
    const totalLiquid = checkingBalance + savingsBalance;
    const weeksUntilRed = ccDebt > totalLiquid ? 0 : Math.floor(totalLiquid / (totalExpenses || 1));

    // Generate tips
    const tips = this.generateTips(categoryTotals, totalExpenses, spendingLevel);

    return {
      totalExpenses: totalExpenses.toFixed(2),
      spendingLevel,
      topCategories: topCategories.map(([cat, amt]) => ({
        category: cat,
        amount: amt.toFixed(2),
        percentage: ((amt / totalExpenses) * 100).toFixed(0)
      })),
      categoryBreakdown: categoryTotals,
      runway: {
        weeksUntilRed,
        message: this.getRunwayMessage(weeksUntilRed)
      },
      tips
    };
  }

  generateTips(categoryTotals, totalExpenses, spendingLevel) {
    const tips = [];

    // Tip based on spending level
    if (spendingLevel === 'High') {
      tips.push('Your spending is above average this week. Consider setting daily spending limits.');
    } else if (spendingLevel === 'Low') {
      tips.push('Great job keeping expenses low this week! Keep up the discipline.');
    }

    // Category-specific tips
    const foodSpending = (categoryTotals['Food & Dining'] || 0);
    if (foodSpending > totalExpenses * 0.4) {
      tips.push(`Food & Dining is ${((foodSpending/totalExpenses)*100).toFixed(0)}% of your spending. Try meal prepping to save.`);
    }

    const transportSpending = (categoryTotals['Transportation'] || 0);
    if (transportSpending > 50) {
      tips.push('Transportation costs are high. Consider walking or biking for short distances.');
    }

    // Default tip if none generated
    if (tips.length === 0) {
      tips.push('Track your biggest expense categories and find alternatives to reduce costs.');
    }

    return tips.slice(0, 3);
  }

  getRunwayMessage(weeks) {
    if (weeks === 0) {
      return '⚠️ WARNING: You are in the red!';
    } else if (weeks < 2) {
      return `⚠️ ALERT: ${weeks} week${weeks === 1 ? '' : 's'} until you're in the red`;
    } else if (weeks < 4) {
      return `⚡ ${weeks} weeks of runway remaining`;
    } else if (weeks < 8) {
      return `✅ ${weeks} weeks of runway - comfortable`;
    } else {
      return `💪 ${weeks}+ weeks of runway - strong position`;
    }
  }

  formatForSpreadsheet(transactions) {
    // Returns array of arrays for Google Sheets
    return transactions.map(t => [
      t.date,
      t.expenseName,
      t.category,
      String(parseFloat(t.amount) || 0), // Convert to string to prevent date interpretation
      t.notes || ''
    ]);
  }
}

module.exports = TransactionParser;
