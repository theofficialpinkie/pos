// Test script to list all sheet names in your Google Sheets
const { google } = require('googleapis');

async function listSheets() {
  // Get credentials from localStorage (you'll need to paste them here)
  const credentials = JSON.parse(process.argv[2] || '{}');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1fhXnyTk09IbDDvzs1cAceZUtBkYW5g90y_eICCVD9q0';

    // Get spreadsheet metadata to see all sheets
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    console.log('\n📋 Sheets in your Google Spreadsheet:\n');
    response.data.sheets.forEach((sheet, index) => {
      console.log(`${index + 1}. "${sheet.properties.title}"`);
    });
    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

listSheets();
