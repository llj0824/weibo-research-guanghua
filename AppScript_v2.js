/**
 * AppScript.js - UPDATED VERSION WITH REAL POSTS
 * 
 * This version integrates with the Posts sheet to use real Weibo posts
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
 * 
 *  * This version integrates with the Posts sheet to use real Weibo posts
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
    .addSeparator()
    .addItem('⚙️ Settings', 'showSettings')
    .addToUi();
}

// NEW FUNCTION: Get real post for user
function getPostForUser(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = sheet.getSheetByName('Posts');
  
  if (!postsSheet) {
    throw new Error('Posts sheet not found! Please create it and import post data.');
  }
  
  const data = postsSheet.getDataRange().getValues();
  
  // Find posts for this user (skip header row)
  const userPosts = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      userPosts.push({
        postId: data[i][1],
        content: data[i][4], // post_content is column 4
        publishTime: data[i][3] // post_publish_time is column 3
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
    max_tokens: 2000
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