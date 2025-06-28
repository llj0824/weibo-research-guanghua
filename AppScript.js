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
  ui.createMenu('🤖 光华新媒体 AI 助手 ')
    .addItem('📝 Generate Responses for Selected Users', 'generateResponsesForSelected')
    // .addItem('🔄 Generate All Pending Responses', 'generateAllResponses')
    .addItem('✅ Approve All Responses', 'approveAllResponses')
    // .addItem('📊 Update Analytics', 'updateAnalytics')
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
  const samplePost = "上班的日子就像一条看不到尽头的路，但还是得咬牙坚持走下去。有没有人和我一样偶尔也会迷茫?";
  
  let responsesGenerated = 0;
  
  // Process each selected user
  selectedData.forEach(row => {
    const userId = row[0];
    const userName = row[1];
    const group = row[2];
    
    if (group === 'Control') return; // Skip control group
    
    const promptConfig = prompts[group];
    if (!promptConfig) return;
    
    // --- UPDATED LINE ---
    // Generate response by replacing placeholders for user_name and post_content
    const prompt = promptConfig.template
      .replace('{user_name}', userName)
      .replace('{post_content}', samplePost);
    
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