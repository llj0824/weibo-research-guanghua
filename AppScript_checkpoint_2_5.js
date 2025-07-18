/**
 * AppScript.js - CHECKPOINT 2.5: TRIGGERING POST SHEET
 * 
 * This version adds a separate "Triggering Post" sheet that can be populated
 * with the latest post from each user via a button click.
 * 
 * Key Features:
 * - Separate "Triggering Post" sheet for better control
 * - Button to auto-pull latest posts from all users
 * - Non-blocking: missing posts show warning but don't stop other generations
 * - Posts sheet remains unchanged for historical context
 * 
 * New in Checkpoint 3:
 * - pullLatestPosts() function to populate Triggering Post sheet
 * - Updated getPostForUser() to check Triggering Post sheet first
 * - New menu item for pulling latest posts
 */

// Configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

// Get API Key from Script Properties
function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('DEEPSEEK_API_KEY');
}

// Main menu - UPDATED with new option
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 Response System')
    .addItem('📝 Generate Responses for Selected Users', 'generateResponsesForSelected')
    .addSeparator()
    .addItem('🔄 Pull Latest Posts for All Users', 'pullLatestPosts')
    .addSeparator()
    .addItem('⚙️ Settings', 'showSettings')
    .addToUi();
}

// NEW FUNCTION: Pull latest posts for all users
function pullLatestPosts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = sheet.getSheetByName('Posts');
  const usersSheet = sheet.getSheetByName('Users');
  let triggeringPostSheet = sheet.getSheetByName('Triggering Post');
  
  // Create Triggering Post sheet if it doesn't exist
  if (!triggeringPostSheet) {
    triggeringPostSheet = sheet.insertSheet('Triggering Post');
    // Set headers (same as Posts sheet)
    const headers = ['user_id', 'post_id', 'post_link', 'post_publish_time', 'post_content', 
                    'post_geo', 'post_likes_cnt', 'post_comments_cnt', 'post_reposts_cnt', 
                    'post_pic_num', 'post_pics', 'post_video_url', 'post_topic_names', 
                    'post_topic_num', 'post_topic_urls'];
    triggeringPostSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  if (!postsSheet) {
    SpreadsheetApp.getUi().alert('❌ Posts sheet not found! Please create it and import post data.');
    return;
  }
  
  // Get all users
  const usersData = usersSheet.getDataRange().getValues();
  const allUserIds = [];
  for (let i = 1; i < usersData.length; i++) {
    allUserIds.push(String(usersData[i][0]));
  }
  
  // Get all posts
  const postsData = postsSheet.getDataRange().getValues();
  const postsByUser = {};
  
  // Group posts by user
  for (let i = 1; i < postsData.length; i++) {
    const userId = String(postsData[i][0]);
    if (!postsByUser[userId]) {
      postsByUser[userId] = [];
    }
    postsByUser[userId].push(postsData[i]);
  }
  
  // Clear existing data (except header)
  const lastRow = triggeringPostSheet.getLastRow();
  if (lastRow > 1) {
    triggeringPostSheet.getRange(2, 1, lastRow - 1, triggeringPostSheet.getLastColumn()).clear();
  }
  
  // Find latest post for each user
  let updatedCount = 0;
  let missingCount = 0;
  const newRows = [];
  
  for (const userId of allUserIds) {
    if (postsByUser[userId] && postsByUser[userId].length > 0) {
      // Sort by publish time (column 3) to find latest
      const userPosts = postsByUser[userId];
      userPosts.sort((a, b) => {
        const dateA = new Date(a[3]);
        const dateB = new Date(b[3]);
        return dateB - dateA; // Sort descending (newest first)
      });
      
      // Add the latest post to Triggering Post sheet
      newRows.push(userPosts[0]);
      updatedCount++;
    } else {
      missingCount++;
    }
  }
  
  // Write all new rows at once if there are any
  if (newRows.length > 0) {
    triggeringPostSheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  // Show summary
  let message = `✅ Updated ${updatedCount} users with their latest posts!`;
  if (missingCount > 0) {
    message += `\n⚠️ ${missingCount} users have no posts in the Posts sheet.`;
  }
  SpreadsheetApp.getUi().alert(message);
}

// UPDATED FUNCTION: Get post for user - now checks Triggering Post sheet first
function getPostForUser(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const triggeringPostSheet = sheet.getSheetByName('Triggering Post');
  const postsSheet = sheet.getSheetByName('Posts');
  
  let triggeringPost = null;
  let historicalPosts = [];
  
  // First, try to get triggering post from Triggering Post sheet
  if (triggeringPostSheet) {
    const triggeringData = triggeringPostSheet.getDataRange().getValues();
    
    for (let i = 1; i < triggeringData.length; i++) {
      if (String(triggeringData[i][0]) === String(userId)) {
        triggeringPost = {
          postId: triggeringData[i][1],
          postLink: triggeringData[i][2],
          publishTime: triggeringData[i][3],
          content: triggeringData[i][4]
        };
        break;
      }
    }
  }
  
  // Get historical posts from Posts sheet
  if (postsSheet) {
    const postsData = postsSheet.getDataRange().getValues();
    const triggeringPostId = triggeringPost ? triggeringPost.postId : null;
    
    for (let i = 1; i < postsData.length; i++) {
      if (String(postsData[i][0]) === String(userId)) {
        // Skip if this is the triggering post
        if (triggeringPostId && String(postsData[i][1]) === String(triggeringPostId)) {
          continue;
        }
        
        historicalPosts.push({
          postId: postsData[i][1],
          publishTime: postsData[i][3],
          content: postsData[i][4]
        });
      }
    }
    
    // Sort historical posts by publish time (newest first)
    historicalPosts.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
  }
  
  // If no triggering post found, return null (will be handled by caller)
  if (!triggeringPost) {
    return null;
  }
  
  return { triggeringPost, historicalPosts };
}

// Generate response using Deepseek
function callDeepseekAPI(prompt, systemPrompt = '') {
  const apiKey = getApiKey();
  
  // DEBUG: Log the prompt being sent
  console.log('Sending prompt to API:', prompt.substring(0, 100) + '...');
  
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
    const responseText = response.getContentText();
    
    // DEBUG: Log raw API response
    console.log('API Response Status:', response.getResponseCode());
    console.log('API Response Text:', responseText.substring(0, 200) + '...');
    
    const result = JSON.parse(responseText);
    
    if (result.choices && result.choices[0]) {
      return result.choices[0].message.content;
    } else {
      console.error('No choices in API response:', result);
      throw new Error('Invalid API response - no choices');
    }
  } catch (error) {
    console.error('Deepseek API Error:', error);
    return `Error: ${error.toString()}`;
  }
}

// Generate responses for selected users with real posts
function generateResponsesForSelected() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = sheet.getSheetByName('Users');
  const promptsSheet = sheet.getSheetByName('Prompts');
  const queueSheet = sheet.getSheetByName('Response Queue');
  const triggeringPostSheet = sheet.getSheetByName('Triggering Post');
  
  // Check if Triggering Post sheet exists
  if (!triggeringPostSheet) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Triggering Post sheet not found!',
      'Would you like to create it and pull latest posts now?',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      pullLatestPosts();
    } else {
      return;
    }
  }
  
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
  const skippedUserNames = [];
  
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
    if (!postData || !postData.triggeringPost) {
      console.log(`No triggering post found for user ${userId} (${userName})`);
      skippedUsers++;
      skippedUserNames.push(`${userName} (${userId})`);
      return;
    }
    
    const { triggeringPost, historicalPosts } = postData;
    let historyContext = 'N/A';
    let finalPrompt = promptConfig.template;

    // Prepare history context only for relevant groups and if history exists
    if ((group === 'Group2' || group === 'Group4') && historicalPosts.length > 0) {
      historyContext = historicalPosts.map(p => 
        `- (On ${new Date(p.publishTime).toLocaleDateString()}) User posted: "${p.content}"`
      ).join('\n');
    }

    // Replace all placeholders to create the final prompt
    finalPrompt = finalPrompt.replace('{user_name}', userName);
    finalPrompt = finalPrompt.replace('{post_content}', triggeringPost.content || 'No content available');
    
    // Replace history placeholder, providing a default if not applicable
    if (finalPrompt.includes('{user_history}')) {
      finalPrompt = finalPrompt.replace('{user_history}', historyContext === 'N/A' ? 'No history was provided.' : historyContext);
    }
    
    const response = callDeepseekAPI(finalPrompt, promptConfig.system);
    
    const timestamp = new Date();
    
    // Add to queue with the new, detailed, research-focused structure
    queueSheet.appendRow([
      timestamp,
      userId,
      userName,
      group,
      triggeringPost.postId,
      triggeringPost.content,
      triggeringPost.postLink,  // post_link column
      historyContext,        // The actual history provided
      finalPrompt,           // The exact prompt sent to the API
      response,
      'NO',                  // approved
      '',                    // final_response
      ''                     // sent_date
    ]);
    
    responsesGenerated++;
  });
  
  // Show results
  let message = `✅ Generated ${responsesGenerated} responses!`;
  if (skippedUsers > 0) {
    message += `\n\n⚠️ Skipped ${skippedUsers} users (no triggering post found)`;
    if (skippedUserNames.length <= 5) {
      message += `:\n${skippedUserNames.join('\n')}`;
    } else {
      message += `:\n${skippedUserNames.slice(0, 5).join('\n')}\n... and ${skippedUserNames.length - 5} more`;
    }
    message += '\n\nTip: Use "🔄 Pull Latest Posts for All Users" to update the Triggering Post sheet.';
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