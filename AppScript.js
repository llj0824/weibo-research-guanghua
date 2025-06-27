/**
 * AppScript.js
 * 
 * This Google Apps Script powers the "Weibo AI Experiment - Response System" Google Sheet.
 * It connects the sheet to the Deepseek API to generate, approve, and manage AI-generated responses
 * for Weibo users divided into experimental groups. The script adds a custom menu for workflow actions,
 * handles prompt generation, and manages analytics, following the workflow and structure described in
 * GOOGLE_SHEETS_IMPLEMENTATION_GUIDE.md.
 * 
 * Key Features:
 * - Adds a custom menu for generating and approving responses
 * - Calls Deepseek API for AI-generated replies
 * - Supports group-based prompt templates and analytics
 * - Designed for use with the Users, Prompts, and Response Queue tabs as described in the implementation guide
 */

// Configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

// Get API Key from Script Properties
function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('DEEPSEEK_API_KEY');
}

// Main menu
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 Response System')
    .addItem('📝 Generate Responses for Selected Users', 'generateResponsesForSelected')
    .addItem('🔄 Generate All Pending Responses', 'generateAllResponses')
    .addItem('✅ Approve All Responses', 'approveAllResponses')
    .addItem('📊 Update Analytics', 'updateAnalytics')
    .addSeparator()
    .addItem('⚙️ Settings', 'showSettings')
    .addToUi();
}

// Generate response using Deepseek
function callDeepseekAPI(prompt, systemPrompt = '') {
  const apiKey = getApiKey();
  
  const payload = {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful assistant responding in Chinese.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 150
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(DEEPSEEK_API_URL, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.choices && result.choices[0]) {
      return result.choices[0].message.content;
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('Deepseek API Error:', error);
    return `Error: ${error.toString()}`;
  }
}

// Generate responses for selected users
function generateResponsesForSelected() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = sheet.getSheetByName('Users');
  const promptsSheet = sheet.getSheetByName('Prompts');
  const queueSheet = sheet.getSheetByName('Response Queue');
  
  // Get selected range
  const range = usersSheet.getActiveRange();
  const selectedData = range.getValues();
  
  // Get prompts
  const prompts = {};
  const promptData = promptsSheet.getDataRange().getValues();
  for (let i = 1; i < promptData.length; i++) {
    prompts[promptData[i][0]] = {
      template: promptData[i][1],
      system: promptData[i][2]
    };
  }
  
  // Sample post content (in real implementation, fetch from Weibo)
  const samplePost = "今天天气真好，出去散步了一圈，心情特别愉快！🌞";
  
  let responsesGenerated = 0;
  
  // Process each selected user
  selectedData.forEach(row => {
    const userId = row[0];
    const userName = row[1];
    const group = row[2];
    
    if (group === 'Control') return; // Skip control group
    
    const promptConfig = prompts[group];
    if (!promptConfig) return;
    
    // Generate response
    const prompt = promptConfig.template
      .replace('{post_content}', samplePost)
      .replace('{user_topics}', '生活、旅行'); // Sample topics
    
    const response = callDeepseekAPI(prompt, promptConfig.system);
    
    // Add to queue
    const timestamp = new Date();
    queueSheet.appendRow([
      timestamp,
      userId,
      userName,
      group,
      'sample_post_id',
      samplePost,
      response,
      'NO', // Not approved yet
      '', // Final response (empty)
      '', // Sent date (empty)
      promptConfig.template
    ]);
    
    responsesGenerated++;
  });
  
  SpreadsheetApp.getUi().alert(`✅ Generated ${responsesGenerated} responses!`);
}

// Show settings dialog
function showSettings() {
  const html = HtmlService.createHtmlOutputFromFile('Settings')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
}

// Update analytics
function updateAnalytics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const queueSheet = sheet.getSheetByName('Response Queue');
  const analyticsSheet = sheet.getSheetByName('Analytics');
  
  const data = queueSheet.getDataRange().getValues();
  
  // Calculate statistics
  let stats = {
    total: data.length - 1,
    approved: 0,
    sent: 0,
    byGroup: {}
  };
  
  for (let i = 1; i < data.length; i++) {
    const group = data[i][3];
    const approved = data[i][7];
    const sentDate = data[i][9];
    
    if (!stats.byGroup[group]) stats.byGroup[group] = 0;
    stats.byGroup[group]++;
    
    if (approved === 'YES') stats.approved++;
    if (sentDate) stats.sent++;
  }
  
  // Update analytics sheet
  analyticsSheet.clear();
  analyticsSheet.getRange(1, 1).setValue('Analytics Dashboard');
  analyticsSheet.getRange(2, 1).setValue('Last Updated: ' + new Date());
  
  let row = 4;
  analyticsSheet.getRange(row++, 1).setValue('Total Responses: ' + stats.total);
  analyticsSheet.getRange(row++, 1).setValue('Approved: ' + stats.approved);
  analyticsSheet.getRange(row++, 1).setValue('Sent: ' + stats.sent);
  
  row++;
  analyticsSheet.getRange(row++, 1).setValue('By Group:');
  for (let group in stats.byGroup) {
    analyticsSheet.getRange(row++, 1).setValue(group + ': ' + stats.byGroup[group]);
  }
}
```

#### 3.2 Create Settings HTML
Create new HTML file in Apps Script (File → New → HTML) named "Settings":

```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      .setting {
        margin: 15px 0;
      }
      button {
        background: #4285f4;
        color: white;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        border-radius: 4px;
      }
      button:hover {
        background: #357ae8;
      }
    </style>
  </head>
  <body>
    <h3>System Settings</h3>
    
    <div class="setting">
      <label>Deepseek Model:</label><br>
      <select id="model">
        <option value="deepseek-chat">Deepseek Chat (Default)</option>
        <option value="deepseek-coder">Deepseek Coder</option>
      </select>
    </div>
    
    <div class="setting">
      <label>Response Temperature (0.0 - 1.0):</label><br>
      <input type="number" id="temperature" min="0" max="1" step="0.1" value="0.7">
    </div>
    
    <div class="setting">
      <label>Max Response Length:</label><br>
      <input type="number" id="maxTokens" min="50" max="500" value="150">
    </div>
    
    <button onclick="saveSettings()">Save Settings</button>
    <button onclick="google.script.host.close()">Close</button>
    
    <script>
      function saveSettings() {
        // Implementation for saving settings
        alert('Settings saved!');
        google.script.host.close();
      }
    </script>
  </body>
</html>