/**
 * AppScript.js - CHECKPOINT 3: WEIBO API INTEGRATION
 * 
 * This version adds Weibo API integration to the existing system, enabling:
 * - OAuth2 authentication with Weibo
 * - Syncing user posts from Weibo to Posts sheet
 * - Sending approved replies directly to Weibo
 * - Rate limiting (150 requests/hour)
 * 
 * Key Features from Previous Checkpoints:
 * - Triggering Post sheet for better control
 * - Real posts integration
 * - AI response generation with DeepSeek
 * 
 * New in Checkpoint 3:
 * - Weibo OAuth2 authentication
 * - syncUserPostsFromWeibo() function
 * - sendApprovedRepliesToWeibo() function
 * - Rate limiting and error handling
 */

// Configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

// Weibo API Configuration
const WEIBO_API_BASE = 'https://api.weibo.com';
const WEIBO_AUTH_URL = 'https://api.weibo.com/oauth2/authorize';
const WEIBO_TOKEN_URL = 'https://api.weibo.com/oauth2/access_token';
const WEIBO_RATE_LIMIT = 150; // requests per hour

// Get API Keys from Script Properties
function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('DEEPSEEK_API_KEY');
}

function getWeiboAppKey() {
  return PropertiesService.getScriptProperties().getProperty('WEIBO_APP_KEY');
}

function getWeiboAppSecret() {
  return PropertiesService.getScriptProperties().getProperty('WEIBO_APP_SECRET');
}

// OAuth2 Service for Weibo
function getWeiboService() {
  // Note: This requires adding the OAuth2 library to your Apps Script project
  // Library ID: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
  
  // Get the script ID for building redirect URI
  const scriptId = ScriptApp.getScriptId();
  const redirectUri = `https://script.google.com/macros/d/${scriptId}/usercallback`;
  
  return OAuth2.createService('Weibo')
    .setAuthorizationBaseUrl(WEIBO_AUTH_URL)
    .setTokenUrl(WEIBO_TOKEN_URL)
    .setClientId(getWeiboAppKey())
    .setClientSecret(getWeiboAppSecret())
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('all')
    .setParam('response_type', 'code')
    .setParam('redirect_uri', redirectUri)
    .setParam('access_type', 'offline')
    .setParam('approval_prompt', 'force');
}

// OAuth callback
function authCallback(request) {
  const service = getWeiboService();
  const isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}

// Main menu - UPDATED with Weibo integration
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 Response System')
    .addItem('📝 Generate Responses for Selected Users', 'generateResponsesForSelected')
    .addSeparator()
    .addItem('🔄 Pull Latest Posts for All Users', 'pullLatestPosts')
    .addSeparator()
    .addSubMenu(ui.createMenu('🌐 Weibo Integration')
      .addItem('🔐 Authorize Weibo Access', 'authorizeWeibo')
      .addItem('🔁 Sync Posts from Weibo', 'syncUserPostsFromWeibo')
      .addItem('📤 Send Approved Replies', 'sendApprovedRepliesToWeibo')
      .addItem('📊 Check API Usage', 'checkWeiboApiUsage'))
    .addSeparator()
    .addItem('⚙️ Settings', 'showSettings')
    .addToUi();
}

// Authorize Weibo access
function authorizeWeibo() {
  const service = getWeiboService();
  if (service.hasAccess()) {
    SpreadsheetApp.getUi().alert('✅ Already authorized with Weibo!');
  } else {
    const authorizationUrl = service.getAuthorizationUrl();
    
    // Debug: Log the authorization URL to see the exact redirect_uri
    console.log('Authorization URL:', authorizationUrl);
    const scriptId = ScriptApp.getScriptId();
    console.log('Script ID:', scriptId);
    console.log('Expected redirect URI:', `https://script.google.com/macros/d/${scriptId}/usercallback`);
    
    const template = HtmlService.createTemplate('Click <a href="<?= authorizationUrl ?>" target="_blank">here</a> to authorize access to Weibo.<br><br>Debug info:<br>Script ID: <?= scriptId ?><br>Expected Redirect URI: <?= redirectUri ?>');
    template.authorizationUrl = authorizationUrl;
    template.scriptId = scriptId;
    template.redirectUri = `https://script.google.com/macros/d/${scriptId}/usercallback`;
    const htmlOutput = template.evaluate()
      .setWidth(600)
      .setHeight(300);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Authorize Weibo Access');
  }
}

// Rate limiting helper
function checkRateLimit() {
  const cache = CacheService.getScriptCache();
  const hourKey = 'weibo_hour_' + new Date().getHours();
  const requestCount = cache.get(hourKey) || '0';
  
  if (parseInt(requestCount) >= WEIBO_RATE_LIMIT) {
    throw new Error(`Rate limit exceeded: ${WEIBO_RATE_LIMIT} requests per hour`);
  }
  
  cache.put(hourKey, (parseInt(requestCount) + 1).toString(), 3600); // 1 hour
  return parseInt(requestCount) + 1;
}

// Make Weibo API request with error handling
function makeWeiboRequest(endpoint, method = 'GET', payload = null) {
  const service = getWeiboService();
  if (!service.hasAccess()) {
    throw new Error('Not authorized with Weibo. Please authorize first.');
  }
  
  // Check rate limit
  checkRateLimit();
  
  const options = {
    method: method,
    headers: {
      'Authorization': 'OAuth2 ' + service.getAccessToken()
    },
    muteHttpExceptions: true
  };
  
  if (payload && method === 'POST') {
    options.payload = payload;
  }
  
  try {
    const response = UrlFetchApp.fetch(WEIBO_API_BASE + endpoint, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode === 200) {
      return JSON.parse(responseText);
    } else if (responseCode === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else {
      console.error('Weibo API Error:', responseCode, responseText);
      throw new Error(`Weibo API Error: ${responseCode} - ${responseText}`);
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

// Sync posts from Weibo for selected users
function syncUserPostsFromWeibo() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = sheet.getSheetByName('Users');
  const postsSheet = sheet.getSheetByName('Posts');
  
  if (!postsSheet) {
    SpreadsheetApp.getUi().alert('❌ Posts sheet not found!');
    return;
  }
  
  // Get selected users
  const range = usersSheet.getActiveRange();
  const selectedData = range.getValues();
  const selectedRowIndices = [];
  const startRow = range.getRow();
  
  // Check if we need to add weibo columns to Users sheet
  const headers = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
  let weiboIdCol = headers.indexOf('weibo_user_id') + 1;
  let weiboScreenNameCol = headers.indexOf('weibo_screen_name') + 1;
  let lastSyncCol = headers.indexOf('last_sync_date') + 1;
  
  if (weiboIdCol === 0) {
    // Add new columns
    const lastCol = usersSheet.getLastColumn();
    usersSheet.getRange(1, lastCol + 1).setValue('weibo_user_id');
    usersSheet.getRange(1, lastCol + 2).setValue('weibo_screen_name');
    usersSheet.getRange(1, lastCol + 3).setValue('last_sync_date');
    weiboIdCol = lastCol + 1;
    weiboScreenNameCol = lastCol + 2;
    lastSyncCol = lastCol + 3;
  }
  
  let syncedUsers = 0;
  let newPostsCount = 0;
  let errors = [];
  
  // Get existing post IDs to avoid duplicates
  const existingPosts = postsSheet.getDataRange().getValues();
  const existingPostIds = new Set();
  for (let i = 1; i < existingPosts.length; i++) {
    existingPostIds.add(String(existingPosts[i][1])); // post_id is column 2
  }
  
  // Process each selected user
  for (let i = 0; i < selectedData.length; i++) {
    const userId = selectedData[i][0];
    const userName = selectedData[i][1];
    const rowIndex = startRow + i;
    
    // Get Weibo user ID if available
    const weiboUserId = usersSheet.getRange(rowIndex, weiboIdCol).getValue();
    const weiboScreenName = usersSheet.getRange(rowIndex, weiboScreenNameCol).getValue();
    
    if (!weiboUserId && !weiboScreenName) {
      errors.push(`${userName}: No Weibo ID or screen name`);
      continue;
    }
    
    try {
      // Build request parameters
      const params = weiboUserId ? `uid=${weiboUserId}` : `screen_name=${weiboScreenName}`;
      const endpoint = `/2/statuses/user_timeline.json?${params}&count=50`;
      
      const result = makeWeiboRequest(endpoint);
      
      if (result.statuses && result.statuses.length > 0) {
        const newPosts = [];
        
        for (const status of result.statuses) {
          // Skip if we already have this post
          if (existingPostIds.has(String(status.id))) {
            continue;
          }
          
          // Format post data to match our sheet structure
          const postRow = [
            userId,                                    // user_id
            status.id,                                // post_id
            `https://weibo.com/${status.user.id}/${status.id}`, // post_link
            status.created_at,                        // post_publish_time
            status.text,                              // post_content
            status.geo || '',                         // post_geo
            status.reposts_count || 0,                // post_reposts_cnt (using reposts for likes)
            status.comments_count || 0,               // post_comments_cnt
            status.reposts_count || 0,                // post_reposts_cnt
            status.pic_ids ? status.pic_ids.length : 0, // post_pic_num
            status.pic_ids ? status.pic_ids.join(',') : '', // post_pics
            status.video_url || '',                   // post_video_url
            '',                                       // post_topic_names
            0,                                        // post_topic_num
            ''                                        // post_topic_urls
          ];
          
          newPosts.push(postRow);
          existingPostIds.add(String(status.id));
        }
        
        // Add new posts to sheet
        if (newPosts.length > 0) {
          const lastRow = postsSheet.getLastRow();
          postsSheet.getRange(lastRow + 1, 1, newPosts.length, newPosts[0].length).setValues(newPosts);
          newPostsCount += newPosts.length;
        }
        
        // Update sync date
        usersSheet.getRange(rowIndex, lastSyncCol).setValue(new Date());
        syncedUsers++;
      }
      
    } catch (error) {
      errors.push(`${userName}: ${error.toString()}`);
    }
  }
  
  // Show summary
  let message = `✅ Sync complete!\n\n`;
  message += `Users synced: ${syncedUsers}\n`;
  message += `New posts added: ${newPostsCount}\n`;
  
  if (errors.length > 0) {
    message += `\n⚠️ Errors:\n${errors.slice(0, 5).join('\n')}`;
    if (errors.length > 5) {
      message += `\n... and ${errors.length - 5} more errors`;
    }
  }
  
  SpreadsheetApp.getUi().alert(message);
}

// Send approved replies to Weibo
function sendApprovedRepliesToWeibo() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const queueSheet = sheet.getSheetByName('Response Queue');
  
  // Check if we need to add Weibo columns
  const headers = queueSheet.getRange(1, 1, 1, queueSheet.getLastColumn()).getValues()[0];
  let weiboCommentIdCol = headers.indexOf('weibo_comment_id') + 1;
  let weiboSendStatusCol = headers.indexOf('weibo_send_status') + 1;
  let weiboErrorCol = headers.indexOf('weibo_error_message') + 1;
  
  if (weiboCommentIdCol === 0) {
    // Add new columns
    const lastCol = queueSheet.getLastColumn();
    queueSheet.getRange(1, lastCol + 1).setValue('weibo_comment_id');
    queueSheet.getRange(1, lastCol + 2).setValue('weibo_send_status');
    queueSheet.getRange(1, lastCol + 3).setValue('weibo_error_message');
    weiboCommentIdCol = lastCol + 1;
    weiboSendStatusCol = lastCol + 2;
    weiboErrorCol = lastCol + 3;
  }
  
  // Get all data
  const data = queueSheet.getDataRange().getValues();
  let sentCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Process approved replies that haven't been sent
  for (let i = 1; i < data.length; i++) {
    const approved = data[i][9]; // approved column
    const sentDate = data[i][11]; // sent_date column
    const weiboStatus = queueSheet.getRange(i + 1, weiboSendStatusCol).getValue();
    
    // Skip if not approved, already sent, or already processed
    if (approved !== 'YES' || sentDate || weiboStatus === 'success') {
      continue;
    }
    
    const postId = data[i][4]; // triggering_post_id
    const responseText = data[i][10] || data[i][8]; // final_response or generated_response
    const userName = data[i][2];
    
    if (!postId || !responseText) {
      errors.push(`Row ${i + 1}: Missing post ID or response text`);
      continue;
    }
    
    try {
      // Send comment to Weibo
      const payload = {
        'comment': responseText.substring(0, 140), // Weibo limit
        'id': postId
      };
      
      const result = makeWeiboRequest('/2/comments/create.json', 'POST', payload);
      
      if (result && result.id) {
        // Success - update sheet
        queueSheet.getRange(i + 1, weiboCommentIdCol).setValue(result.id);
        queueSheet.getRange(i + 1, weiboSendStatusCol).setValue('success');
        queueSheet.getRange(i + 1, 12).setValue(new Date()); // sent_date
        sentCount++;
      }
      
    } catch (error) {
      // Error - log it
      queueSheet.getRange(i + 1, weiboSendStatusCol).setValue('failed');
      queueSheet.getRange(i + 1, weiboErrorCol).setValue(error.toString());
      errors.push(`${userName}: ${error.toString()}`);
      errorCount++;
      
      // Stop if we hit rate limit
      if (error.toString().includes('Rate limit')) {
        break;
      }
    }
  }
  
  // Show summary
  let message = `✅ Send complete!\n\n`;
  message += `Replies sent: ${sentCount}\n`;
  message += `Errors: ${errorCount}\n`;
  
  if (errors.length > 0) {
    message += `\n⚠️ Error details:\n${errors.slice(0, 5).join('\n')}`;
    if (errors.length > 5) {
      message += `\n... and ${errors.length - 5} more errors`;
    }
  }
  
  SpreadsheetApp.getUi().alert(message);
}

// Check API usage
function checkWeiboApiUsage() {
  const cache = CacheService.getScriptCache();
  const hourKey = 'weibo_hour_' + new Date().getHours();
  const requestCount = cache.get(hourKey) || '0';
  
  const message = `📊 Weibo API Usage\n\n` +
    `Current hour: ${requestCount}/${WEIBO_RATE_LIMIT} requests\n` +
    `Remaining: ${WEIBO_RATE_LIMIT - parseInt(requestCount)} requests`;
  
  SpreadsheetApp.getUi().alert(message);
}

// ================ EXISTING FUNCTIONS FROM CHECKPOINT 2.5 ================

// Pull latest posts for all users
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

// Get post for user - checks Triggering Post sheet first
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
  const html = HtmlService.createHtmlOutputFromFile('Settings_checkpoint_3')
    .setWidth(500)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
}

// Get current settings for the UI
function getSettings() {
  const props = PropertiesService.getScriptProperties();
  const userProps = PropertiesService.getUserProperties();
  
  return {
    // DeepSeek settings
    deepseekApiKey: props.getProperty('DEEPSEEK_API_KEY') || '',
    model: props.getProperty('MODEL') || 'deepseek-chat',
    temperature: props.getProperty('TEMPERATURE') || '0.7',
    maxTokens: props.getProperty('MAX_TOKENS') || '150',
    
    // Weibo settings
    weiboAppKey: props.getProperty('WEIBO_APP_KEY') || '',
    weiboAppSecret: props.getProperty('WEIBO_APP_SECRET') || '',
    weiboAuthorized: getWeiboService().hasAccess()
  };
}

// Save settings from the UI
function saveSettings(settings) {
  const props = PropertiesService.getScriptProperties();
  
  // Save DeepSeek settings
  if (settings.deepseekApiKey) {
    props.setProperty('DEEPSEEK_API_KEY', settings.deepseekApiKey);
  }
  if (settings.model) {
    props.setProperty('MODEL', settings.model);
  }
  if (settings.temperature) {
    props.setProperty('TEMPERATURE', settings.temperature.toString());
  }
  if (settings.maxTokens) {
    props.setProperty('MAX_TOKENS', settings.maxTokens.toString());
  }
  
  // Save Weibo settings
  if (settings.weiboAppKey) {
    props.setProperty('WEIBO_APP_KEY', settings.weiboAppKey);
  }
  if (settings.weiboAppSecret) {
    props.setProperty('WEIBO_APP_SECRET', settings.weiboAppSecret);
  }
}

// Test API connections
function testConnections() {
  let results = [];
  
  // Test DeepSeek
  try {
    const apiKey = getApiKey();
    if (apiKey) {
      // Make a simple test call
      const testResponse = callDeepseekAPI('Hello', 'You are a test assistant. Reply with "OK".');
      if (testResponse && !testResponse.includes('Error')) {
        results.push('✅ DeepSeek API: Connected');
      } else {
        results.push('❌ DeepSeek API: Failed');
      }
    } else {
      results.push('⚠️ DeepSeek API: No API key set');
    }
  } catch (e) {
    results.push('❌ DeepSeek API: ' + e.toString());
  }
  
  // Test Weibo
  try {
    const service = getWeiboService();
    if (service.hasAccess()) {
      results.push('✅ Weibo API: Authorized');
    } else {
      results.push('⚠️ Weibo API: Not authorized');
    }
  } catch (e) {
    results.push('❌ Weibo API: ' + e.toString());
  }
  
  return results.join('\n');
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