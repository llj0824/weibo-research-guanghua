# Google Sheets + Deepseek API Implementation Guide

## Overview

This guide provides step-by-step instructions for building a response generation system using Google Sheets and Deepseek API. The system will handle all 226 users across 5 experimental groups with editable prompts.

## Phase 1: MVP (Days 1-3)

### Goal
Create a functional system that can generate responses for all 226 users with editable prompts that Han Tianshi can modify.

### Step 1: Create Google Sheets Structure

#### 1.1 Create New Google Sheet
1. Go to sheets.google.com (use VPN if needed)
2. Create new spreadsheet named: "Weibo AI Experiment - Response System"
3. Create the following sheets (tabs):

#### 1.2 Sheet 1: "Users" Tab
Create columns:
```
A: user_id
B: user_name
C: group (Control, Group1, Group2, Group3, Group4)
D: user_link
E: user_description
F: user_followers_cnt
G: last_response_date
H: response_count
I: status (active/inactive)
```

Import all 226 users from `user_list_20250623.xlsx` and randomly assign to groups:
- Control: ~45 users (no responses)
- Group 1-4: ~45 users each

#### 1.3 Sheet 2: "Prompts" Tab
Create editable prompt templates:
```
A: group_name
B: prompt_template
C: system_prompt
D: last_updated
E: notes
```

Initial prompts:
```
Row 2: Group1 | Human-roleplay, no context
"You are a friendly Weibo user. Reply to this post naturally: {post_content}"

Row 3: Group2 | Human-roleplay, with context
"You are a friendly Weibo user who has read this person's previous posts. Based on their interests in {user_topics}, reply to: {post_content}"

Row 4: Group3 | AI-declared, no context
"I am an AI assistant. I'd like to respond to your post: {post_content}"

Row 5: Group4 | AI-declared, with context
"I am an AI assistant. I've noticed you often post about {user_topics}. Regarding your post: {post_content}"
```

#### 1.4 Sheet 3: "Response Queue" Tab
Columns:
```
A: timestamp
B: user_id
C: user_name
D: group
E: post_id
F: post_content
G: generated_response
H: approved (YES/NO/EDIT)
I: final_response
J: sent_date
K: prompt_used
```

#### 1.5 Sheet 4: "Analytics" Tab
Summary statistics (will auto-calculate):
- Total responses generated
- Responses by group
- Approval rate
- Average response time

### Step 2: Set Up Deepseek API Integration

#### 2.1 Get Deepseek API Key
1. Go to platform.deepseek.com
2. Register account (may need VPN)
3. Get API key from dashboard
4. Note the API endpoint: `https://api.deepseek.com/v1/chat/completions`

#### 2.2 Add API Key to Google Sheets
1. In Google Sheets, go to Extensions → Apps Script
2. Click on Project Settings (gear icon)
3. Add Script Property:
   - Property: `DEEPSEEK_API_KEY`
   - Value: `your-api-key-here`

### Step 3: Create Apps Script Code

#### 3.1 Main Code Structure
In Apps Script editor, replace default code with:

```javascript
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
```

### Step 4: Initial Setup & Testing

#### 4.1 Import User Data
1. Copy data from `user_list_20250623.xlsx`
2. Paste into "Users" sheet
3. Add group assignments (use random formula or manual assignment)

#### 4.2 Test Response Generation
1. Select 5-10 users in Users sheet
2. Click menu: "🤖 Response System" → "📝 Generate Responses for Selected Users"
3. Check "Response Queue" sheet for generated responses
4. Review quality and adjust prompts as needed

#### 4.3 Approval Workflow
1. In "Response Queue" sheet, review generated responses
2. Change "approved" column to:
   - YES: Response is good
   - NO: Don't send
   - EDIT: Need to modify (then edit "final_response" column)

### Step 5: Handoff to Han Tianshi

#### 5.1 Quick Training (30 minutes)
1. Show how to edit prompts in "Prompts" sheet
2. Demonstrate response generation
3. Explain approval process
4. Show analytics dashboard

#### 5.2 Daily Workflow for Han Tianshi
1. Open Google Sheet
2. Review and edit prompts if needed
3. Click "Generate All Pending Responses"
4. Review and approve responses
5. Track progress in Analytics

## Phase 2: Enhanced Features (Week 2)

### Features to Add:
1. **Automatic Post Fetching**
   - Connect to Weibo API or use export
   - Fetch recent posts for each user
   - Generate responses for actual posts

2. **Context Analysis**
   - Analyze user's posting history
   - Extract topics and interests
   - Use in Group 2 & 4 prompts

3. **Batch Operations**
   - Generate responses for all users at once
   - Bulk approval options
   - Export approved responses

4. **Response Variations**
   - Multiple prompt templates per group
   - A/B testing different approaches
   - Track which prompts work best

## Phase 3: Full Automation (Weeks 3-4)

### Features to Add:
1. **Scheduled Generation**
   - Automatic triggers 3x per week
   - Email notifications when ready for review
   - Auto-save backups

2. **Weibo Integration**
   - Direct posting via API (if available)
   - Track engagement metrics
   - Import response data back

3. **Advanced Analytics**
   - Response quality metrics
   - Engagement tracking
   - Group comparison charts
   - Export reports

4. **Error Handling**
   - Retry failed API calls
   - Log all errors
   - Fallback options
   - Alert system

## Troubleshooting

### Common Issues:

1. **Deepseek API Errors**
   - Check API key is correct
   - Verify VPN is working
   - Check API quota/credits

2. **Google Sheets Limits**
   - Apps Script has 6-minute execution limit
   - Process in batches if needed
   - Use time-based triggers for long operations

3. **Response Quality Issues**
   - Adjust temperature parameter
   - Refine prompts
   - Add more context to system prompts
   - Test with different models

### Support Resources:
- Deepseek API Docs: platform.deepseek.com/docs
- Google Apps Script: developers.google.com/apps-script
- Contact Leo for technical issues

---

*Implementation Guide v1.0*
*Last Updated: June 2025*