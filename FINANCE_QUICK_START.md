# Quick Start: Weekly Finance Automation

## TL;DR - What Changed

Your weekly finance task now has a **"⚡ Process Finances"** button that:
- Parses Chase transactions automatically
- Categorizes all expenses
- Calculates your weekly total
- Shows financial runway
- Generates money-saving insights
- Optionally updates Google Sheets

**Time saved: 28 minutes per week**

## How to Use (3 Steps)

### 1. Paste Transactions
- Click on "Weekly Finances" task
- Paste your raw Chase data into the Description field

### 2. Click Process
- Click **"⚡ Process Finances"** button
- Enter: checking balance, savings balance, CC debt
- Wait 2 seconds

### 3. Review Insights
You'll instantly see:
- Total weekly expenses ($48.08 in your sample)
- Spending level (Low/Medium/High)
- Runway (72 weeks in your sample = strong position 💪)
- Top 3 spending categories
- Money-saving tips

## What You Get

### Auto-Categorized Transactions
```
Lush Beauty Salon → Beauty & Personal Care
Grab → Transportation
Black Sand Brewery → Food & Dining
7am Bakers → Food & Dining
```

### Smart Insights
- "Food & Dining is 48% of your spending. Try meal prepping to save."
- "Great job keeping expenses low this week!"
- Runway alerts: ⚠️ if < 2 weeks, 💪 if > 8 weeks

### Formatted for Spreadsheet
All transactions are formatted to match your columns:
- Date | Expense Name | Category | Amount | Notes

## Google Sheets (Optional)

Want automatic Google Sheets updates? See [FINANCE_AUTOMATION_GUIDE.md](FINANCE_AUTOMATION_GUIDE.md) for setup.

Without setup, you can still:
- Get all insights and analysis
- Manually copy formatted data to your sheet

## Files Created

- `services/transactionParser.js` - Parses and categorizes transactions
- `services/googleSheetsService.js` - Google Sheets integration
- `server.js` - Updated with API endpoints
- `FINANCE_AUTOMATION_GUIDE.md` - Complete documentation
- `.env.example` - Environment variables template

## Start the Server

```bash
npm start
```

Then open: http://localhost:3000

## Questions?

Read the full guide: [FINANCE_AUTOMATION_GUIDE.md](FINANCE_AUTOMATION_GUIDE.md)
