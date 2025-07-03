# Simple Posts Data Integration Guide

## Overview
This guide shows how to manually integrate real Weibo posts from the Excel files into the Google Sheets system, replacing the hardcoded sample post.

## Step 1: Create "Posts Data" Sheet

### 1.1 Add New Sheet Tab
1. In your Google Sheets, click the "+" at bottom to add new sheet
2. Name it exactly: `Posts Data`

### 1.2 Set Column Headers
Copy and paste this header row into row 1:
```
user_id	post_id	post_link	post_publish_time	post_content	post_geo	post_likes_cnt	post_comments_cnt	post_reposts_cnt	post_pic_num	post_pics	post_video_url	post_topic_names	post_topic_num	post_topic_urls
```

### 1.3 Import Data from Excel
1. Open `posting_history_af0531.xlsx` in Excel
2. Select ALL columns (A through O) - this includes all post data
3. Copy all the selected data
4. In Google Sheets "Posts Data" tab, click cell A2
5. Paste (this will import all the real posts with complete data)

**Note**: You should now have hundreds of real posts in your sheet!

## Step 2: Update AppScript.js

Replace the current `AppScript.js` with this updated version that looks up real posts:

### Complete Updated Code:

```javascript
/**
 * AppScript.js - UPDATED VERSION WITH REAL POSTS
 * 
 * This version integrates with the Posts Data sheet to use real Weibo posts
 * instead of hardcoded sample content.
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

// NEW FUNCTION: Get real post for user
function getPostForUser(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = sheet.getSheetByName('Posts Data');
  
  if (!postsSheet) {
    throw new Error('Posts Data sheet not found! Please create it and import post data.');
  }
  
  const data = postsSheet.getDataRange().getValues();
  
  // Find posts for this user (skip header row)
  const userPosts = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      userPosts.push({
        postId: data[i][1],
        content: data[i][4], // post_content is column 4 (index 4)
        publishTime: data[i][3] // post_publish_time is column 3 (index 3)
      });
    }
  }
  
  // Return a random post from user's posts
  if (userPosts.length > 0) {
    const randomIndex = Math.floor(Math.random() * userPosts.length);
    return userPosts[randomIndex];
  }
  
  return null;
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

// UPDATED: Generate responses for selected users with real posts
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
  
  let responsesGenerated = 0;
  let skippedUsers = 0;
  
  // Process each selected user
  selectedData.forEach(row => {
    const userId = row[0];
    const userName = row[1];
    const group = row[2];
    
    if (group === 'Control') return; // Skip control group
    
    const promptConfig = prompts[group];
    if (!promptConfig) return;
    
    // Get real post for this user
    const postData = getPostForUser(userId);
    if (!postData) {
      console.log(`No posts found for user ${userId} (${userName})`);
      skippedUsers++;
      return;
    }
    
    // Generate response with real post content and date
    const prompt = promptConfig.template
      .replace('{user_name}', userName)
      .replace('{post_content}', postData.content)
      .replace('{post_date}', postData.publishTime || '最近');
    
    const response = callDeepseekAPI(prompt, promptConfig.system);
    
    // Add to queue with real post data
    const timestamp = new Date();
    // Determine if user history should be used based on group
    const usedHistory = (group === 'Group2' || group === 'Group4') ? 'YES' : 'NO';
    
    queueSheet.appendRow([
      timestamp,
      userId,
      userName,
      group,
      postData.postId,
      postData.content,
      postData.publishTime,
      response,
      'NO', // Not approved yet
      '', // Final response (empty)
      '', // Sent date (empty)
      promptConfig.template,
      usedHistory // Track if user history was used
    ]);
    
    responsesGenerated++;
  });
  
  // Show results
  let message = `✅ Generated ${responsesGenerated} responses!`;
  if (skippedUsers > 0) {
    message += `\n⚠️ Skipped ${skippedUsers} users (no posts found)`;
  }
  SpreadsheetApp.getUi().alert(message);
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

## Step 3: Update the Script

1. In Google Sheets, go to Extensions → Apps Script
2. Select all the existing code and delete it
3. Paste the updated code above
4. Click the disk icon to save
5. Close the Apps Script editor
6. Refresh your Google Sheet (F5)

## Step 4: Test with Real Posts

1. **Check Posts Data**: Make sure you have posts imported in the "Posts Data" sheet
2. **Select Users**: In the "Users" sheet, select 2-3 users (make sure their user_ids exist in Posts Data)
3. **Generate Responses**: Click "🤖 Response System" → "📝 Generate Responses for Selected Users"
4. **Check Results**: Look in "Response Queue" sheet - you should see:
   - Real post content (not the weather sample)
   - Real post IDs
   - Post publish times
   - Responses generated based on actual posts
   - "used_history" column showing YES for Groups 2&4, NO for Groups 1&3

## Troubleshooting

### "Posts Data sheet not found!"
- Make sure the sheet is named exactly `Posts Data` (case sensitive)

### "No posts found for user"
- Check that the user_id in Users sheet matches user_id in Posts Data sheet
- User IDs must match exactly (as strings)

### No responses generated
- Verify the user is not in "Control" group
- Check that prompts exist for the user's group

## Benefits

1. **Real Content**: Responses are based on actual Weibo posts
2. **Variety**: Each time you generate, it picks a random post from that user
3. **Complete Data**: All post data (engagement, location, media, etc.) is preserved for future analysis
4. **Context**: Post dates are included for time-aware responses
5. **Verification**: Clear tracking of which groups use user history
6. **Simple Setup**: Just copy-paste from Excel, no complex integration

## Next Steps

Once this is working:
1. Import more posts for better variety
2. Test with different users and groups
3. Refine prompts based on real post responses
4. Consider adding date filtering (most recent posts only)

---

*Simple Integration Guide v1.0*