const express = require('express');
const path = require('path');
require('dotenv').config();
const TransactionParser = require('./services/transactionParser');
const GoogleSheetsService = require('./services/googleSheetsService');

const app = express();
const PORT = 3000;

// Initialize services
const transactionParser = new TransactionParser();
const sheetsService = new GoogleSheetsService();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Finance automation endpoints
app.post('/api/finance/process-transactions', async (req, res) => {
  try {
    const { rawTransactions, weekDates, checkingBalance, savingsBalance, freedomCC, primeVisaCC } = req.body;

    console.log('Received financial data:', { checkingBalance, savingsBalance, freedomCC, primeVisaCC });

    if (!rawTransactions) {
      return res.status(400).json({ error: 'No transaction data provided' });
    }

    // Parse transactions
    const transactions = transactionParser.parseChaseTransactions(rawTransactions);

    console.log(`Parsed ${transactions.length} transactions`);
    console.log('Sample transaction:', transactions[0]);

    if (transactions.length === 0) {
      return res.status(400).json({ error: 'No valid transactions found' });
    }

    // Calculate insights (combine CC debt for runway calculation)
    const totalCCDebt = (parseFloat(freedomCC) || 0) + (parseFloat(primeVisaCC) || 0);
    const insights = transactionParser.calculateInsights(
      transactions,
      parseFloat(checkingBalance) || 0,
      parseFloat(savingsBalance) || 0,
      totalCCDebt
    );

    // Format for spreadsheet
    const formattedTransactions = transactionParser.formatForSpreadsheet(transactions);

    res.json({
      success: true,
      transactions: formattedTransactions,
      insights,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error processing transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/finance/update-sheets', async (req, res) => {
  try {
    const { transactions, weekData, credentials } = req.body;

    console.log('Week data being sent to sheets:', weekData);
    console.log('Number of transactions:', transactions.length);

    // Initialize Google Sheets if credentials provided
    if (credentials) {
      const initialized = await sheetsService.initialize(credentials);
      if (!initialized) {
        return res.status(500).json({ error: 'Failed to initialize Google Sheets API' });
      }
    }

    // Append transactions to expense sheet
    const transactionResult = await sheetsService.appendTransactions(
      transactions,
      'Expenses '  // Note: there's a space after "Expenses"
    );

    if (!transactionResult.success) {
      return res.status(500).json({ error: transactionResult.error });
    }

    // Update weekly summary
    const summaryResult = await sheetsService.updateWeeklySummary(
      weekData,
      'Weekly Summary' // Replace with your actual summary sheet name
    );

    if (!summaryResult.success) {
      return res.status(500).json({ error: summaryResult.error });
    }

    res.json({
      success: true,
      transactionResult,
      summaryResult
    });
  } catch (error) {
    console.error('Error updating sheets:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/finance/get-weekly-data', async (req, res) => {
  try {
    const { weekDates, credentials } = req.body;

    if (credentials) {
      const initialized = await sheetsService.initialize(credentials);
      if (!initialized) {
        return res.status(500).json({ error: 'Failed to initialize Google Sheets API' });
      }
    }

    const weeklyData = await sheetsService.getWeeklySummaryData(weekDates, 'Weekly Summary');

    res.json({
      success: true,
      data: weeklyData
    });
  } catch (error) {
    console.error('Error getting weekly data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});