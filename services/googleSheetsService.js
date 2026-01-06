const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = '1fhXnyTk09IbDDvzs1cAceZUtBkYW5g90y_eICCVD9q0';
  }

  async initialize(credentials) {
    try {
      // For service account authentication
      if (credentials.type === 'service_account') {
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      } else {
        // For OAuth2 (alternative method)
        const { client_id, client_secret, refresh_token } = credentials;
        const oauth2Client = new google.auth.OAuth2(client_id, client_secret);
        oauth2Client.setCredentials({ refresh_token });
        this.auth = oauth2Client;
      }

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets:', error.message);
      return false;
    }
  }

  async getLastExpenseRow(sheetName = 'Sheet1') {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return 1;

      // Find the last row with data (skip header)
      return rows.length;
    } catch (error) {
      console.error('Error finding last row:', error.message);
      console.error('Sheet name tried:', sheetName);
      console.error('Spreadsheet ID:', this.spreadsheetId);
      return 1;
    }
  }

  async verifySheetExists(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetExists = response.data.sheets.some(
        sheet => sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        const availableSheets = response.data.sheets.map(s => s.properties.title).join(', ');
        throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${availableSheets}`);
      }

      return true;
    } catch (error) {
      console.error('Error verifying sheet:', error.message);
      throw error;
    }
  }

  async appendTransactions(transactions, sheetName = 'Sheet1') {
    try {
      // Verify sheet exists first
      await this.verifySheetExists(sheetName);

      // Add two blank rows before the transactions
      const transactionsWithBlanks = [
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ...transactions
      ];

      // Use column A starting range - API will append to the next empty row
      const range = `${sheetName}!A:A`;

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',  // Use USER_ENTERED for proper number formatting
        requestBody: {
          values: transactionsWithBlanks,
        },
      });

      return {
        success: true,
        rowsAdded: response.data.updates.updatedRows,
        range: response.data.updates.updatedRange,
      };
    } catch (error) {
      console.error('Error appending transactions:', error.message);
      console.error('Full error:', error);
      return {
        success: false,
        error: `Failed to append to sheet "${sheetName}": ${error.message}`,
      };
    }
  }

  async updateWeeklySummary(weekData, sheetName = 'Weekly Summary') {
    try {
      // Verify sheet exists first
      await this.verifySheetExists(sheetName);

      // Find the row for this week
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!B:B`, // Dates column
      });

      const rows = response.data.values || [];
      let targetRow = -1;

      // Look for matching week dates
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === weekData.dates) {
          targetRow = i + 1; // Sheet rows are 1-indexed
          break;
        }
      }

      // If week not found, append new row
      if (targetRow === -1) {
        const lastRow = rows.length + 1;
        const range = `${sheetName}!A${lastRow}`;

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              weekData.week,
              weekData.dates,
              weekData.netWorth || '',
              weekData.income || '',
              weekData.expenses,
              weekData.checkingBalance || '',
              weekData.savingsBalance || '',
              weekData.freedomCC || '',
              weekData.primeVisaCC || '',
              weekData.notes || ''
            ]],
          },
        });

        return { success: true, action: 'created', row: lastRow };
      } else {
        // Update existing row (columns E, F, G, H, I: Expenses, Checking Balance, Savings Balance, Freedom CC, Prime Visa CC)
        const range = `${sheetName}!E${targetRow}:I${targetRow}`;

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              weekData.expenses,
              weekData.checkingBalance || '',
              weekData.savingsBalance || '',
              weekData.freedomCC || '',
              weekData.primeVisaCC || ''
            ]],
          },
        });

        return { success: true, action: 'updated', row: targetRow };
      }
    } catch (error) {
      console.error('Error updating weekly summary:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getWeeklySummaryData(weekDates, sheetName = 'Weekly Summary') {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:J`,
      });

      const rows = response.data.values || [];

      // Find the row matching the week dates
      for (let i = 1; i < rows.length; i++) { // Skip header
        if (rows[i][1] === weekDates) {
          return {
            week: rows[i][0],
            dates: rows[i][1],
            netWorth: parseFloat(rows[i][2]) || 0,
            income: parseFloat(rows[i][3]) || 0,
            expenses: parseFloat(rows[i][4]) || 0,
            checkingBalance: parseFloat(rows[i][5]) || 0,
            savingsBalance: parseFloat(rows[i][6]) || 0,
            freedomCC: parseFloat(rows[i][7]) || 0,
            primeVisaCC: parseFloat(rows[i][8]) || 0,
            notes: rows[i][9] || ''
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting weekly summary data:', error.message);
      return null;
    }
  }
}

module.exports = GoogleSheetsService;
