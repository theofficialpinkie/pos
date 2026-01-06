# Weekly Finance Automation Guide

## Overview

This automation reduces your weekly finance process from 30 minutes to just a few clicks. It handles:

- Parsing Chase transaction data
- Auto-categorizing expenses
- Generating weekly insights and spending analysis
- Calculating your financial runway
- Updating Google Sheets automatically (optional)

## How It Works

### Step 1: Sunday Planning
1. Navigate to Sunday on your dashboard
2. Click "Sunday Planning" button (if Weekly Finances task doesn't exist)
3. The "Weekly Finances" task will be auto-created

### Step 2: Paste Transaction Data
1. Go to chase.com and copy your recent transactions
2. Click on the "Weekly Finances" task to open the sidebar
3. Paste the raw Chase transaction data into the **Description** field
4. The data should look like this:
   ```
   Dec 21, 2025 LUSH BEAUTY SALON MBL LUSH BEAUTY SALON MBL $11.96
   12/21/2025 Grab* A-8OQR9URWXDQCAV Grab* A-8OQR9URWXDQCAV $0.83
   ```

### Step 3: Process Finances
1. Click the **"⚡ Process Finances"** button
2. Enter your current financial data when prompted:
   - Checking account balance
   - Savings account balance
   - Total credit card debt (Freedom + Prime Visa)
3. Wait for the automation to process (takes ~2 seconds)

### Step 4: Review Insights
You'll see:
- **Total weekly expenses** (automatically calculated)
- **Spending level** (Low/Medium/High)
- **Financial runway** (weeks until you're in the red)
- **Top 3 spending categories** with amounts and percentages
- **Money-saving tips** based on your spending patterns

### Step 5: Update Google Sheets (Optional)
- If you've set up Google API credentials, the system will ask if you want to auto-update your spreadsheet
- It will:
  - Add all transactions to your expense tracking sheet
  - Update the weekly summary with total expenses
  - Format everything correctly for your spreadsheet columns

### Step 6: Manual Review
- The insights are displayed right in the task card
- Click "View Full Analysis" to see detailed breakdown
- Click "📊 View Spreadsheet" to open your Google Sheet and verify

## Features

### Auto-Categorization
Transactions are automatically categorized into:
- Transportation (Grab, taxis, etc.)
- Food & Dining (restaurants, cafes, bars)
- Beauty & Personal Care (salons, spas)
- Groceries
- Entertainment
- Shopping
- Health & Fitness
- Utilities
- Subscriptions
- Other

### Insights Generated
1. **Total Expenses**: Sum of all transactions
2. **Spending Level**: Categorized as Low (<$100), Medium ($100-$300), or High (>$300)
3. **Runway Calculator**: Shows how many weeks until you're in the red based on current liquid assets and weekly spending
4. **Top Categories**: Your top 3 spending categories with percentage breakdown
5. **Money-Saving Tips**: AI-generated tips based on your spending patterns

### Runway Alerts
- ⚠️ **WARNING**: You are in the red (immediate action needed)
- ⚠️ **ALERT**: Less than 2 weeks of runway (urgent)
- ⚡ **Moderate**: 2-4 weeks of runway (attention needed)
- ✅ **Comfortable**: 4-8 weeks of runway
- 💪 **Strong**: 8+ weeks of runway

## Google Sheets Setup (Optional)

### Method 1: Service Account (Recommended for automation)

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing

2. **Enable Google Sheets API**
   - In your project, go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Fill in the details and create
   - Click on the created service account
   - Go to "Keys" tab → "Add Key" → "Create New Key"
   - Choose JSON format and download

4. **Share Spreadsheet with Service Account**
   - Open your Google Sheet
   - Click "Share"
   - Add the service account email (from the JSON file)
   - Give it "Editor" permissions

5. **Store Credentials**
   - Open the downloaded JSON file
   - In your browser console (F12), run:
   ```javascript
   localStorage.setItem('googleSheetsCredentials', JSON.stringify({
     type: 'service_account',
     project_id: 'your-project-id',
     private_key_id: 'your-private-key-id',
     private_key: 'your-private-key',
     client_email: 'your-service-account-email',
     client_id: 'your-client-id',
     auth_uri: 'https://accounts.google.com/o/oauth2/auth',
     token_uri: 'https://oauth2.googleapis.com/token',
     auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
     client_x509_cert_url: 'your-cert-url'
   }));
   ```

### Method 2: Manual Copy-Paste (No setup required)

If you don't want to set up Google API:
1. Process your transactions as normal
2. The formatted data will be shown in the insights
3. You can manually copy-paste the transactions into your spreadsheet
4. The system still provides all the insights and analysis

## Spreadsheet Format

### Expense Tracking Sheet (Sheet1)
Expected columns:
- **Date**: MM/DD/YYYY
- **Expense Name**: Merchant name (auto-cleaned)
- **Category**: Auto-assigned category
- **Amount**: Dollar amount
- **Notes**: Empty (you can add manually)

### Weekly Summary Sheet
Expected columns:
- **Week**: Week number (e.g., "Week 52")
- **Dates**: Date range (e.g., "12/15 - 12/21")
- **Net Worth**: (manual entry)
- **Income**: (manual entry)
- **Expenses**: AUTO-FILLED with total weekly expenses
- **Checking Balance**: (from your input)
- **Savings Balance**: (from your input)
- **Freedom**: Freedom CC balance (manual)
- **Prime Visa**: Prime Visa CC balance (from your input)
- **Notes**: (manual entry)

## Troubleshooting

### "No valid transactions found"
- Make sure you're pasting the raw Chase transaction data
- Check that the format matches the expected Chase format
- Verify transactions have dates and amounts

### "Failed to initialize Google Sheets API"
- Check that credentials are properly stored in localStorage
- Verify the service account has access to the spreadsheet
- Make sure Google Sheets API is enabled in your Cloud project

### Transactions not categorized correctly
- The system uses keyword matching for categorization
- You can manually edit categories in the spreadsheet
- Future versions may include custom category rules

### Insights not showing
- Make sure you clicked "Process Finances" button
- Check that you entered valid financial data (balances, debt)
- Verify transactions were successfully parsed

## Privacy & Security

- All processing happens on your local machine and server
- Transaction data is stored only in your browser's localStorage
- Google Sheets credentials are stored in localStorage (client-side only)
- No data is sent to third-party services except Google Sheets (if you enable it)

## What You No Longer Need To Do

✅ Manually format Chase transactions for spreadsheet columns
✅ Calculate weekly expense totals
✅ Identify spending categories
✅ Calculate financial runway
✅ Analyze spending patterns
✅ Generate insights about spending behavior

## Time Savings

**Before**: ~30 minutes
**After**: ~2 minutes

**What you still do manually**:
- Copy transactions from Chase (30 seconds)
- Enter current balances (30 seconds)
- Review insights and make decisions (1 minute)

**What the automation does**:
- Parse and format transactions
- Categorize all expenses
- Calculate totals and summaries
- Generate insights and tips
- Update Google Sheets
- Track runway and alerts
