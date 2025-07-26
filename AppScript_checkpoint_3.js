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
    .setParam('approval_prompt', 'force')
    .setTokenHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    })
    .setGrantType('authorization_code')
    .setTokenPayloadHandler(function(payload) {
      // Increase timeout for token request
      payload.timeout = 60000; // 60 seconds
      return payload;
    });
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
    .addItem('🔄 Refresh Triggering Posts for All Users (Triggering Posts)', 'pullLatestPosts')
    .addSeparator()
    .addSubMenu(ui.createMenu('🌐 Weibo Integration')
      .addItem('🔐 Authorize Weibo Access', 'authorizeWeibo')
      .addItem('🔁 Sync Posts from Weibo (Posts)', 'syncUserPostsFromWeibo')
      .addItem('📤 Send Approved Replies (Response Queue)', 'sendApprovedRepliesToWeibo')
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
  const hourKey = 'weibo_rate_limit';
  const requestCount = parseInt(cache.get(hourKey)) || 0;
  
  console.log(`Current API usage: ${requestCount}/${WEIBO_RATE_LIMIT} requests this hour`);
  
  if (requestCount >= WEIBO_RATE_LIMIT) {
    throw new Error('API10023: Rate limit exceeded. Please wait until next hour.');
  }
  
  // Update count with 1 hour expiry
  cache.put(hourKey, (requestCount + 1).toString(), 3600);
  return requestCount + 1;
}

// Make Weibo API request with error handling
function makeWeiboRequest(endpoint, method = 'GET', payload = null, captureLogsArray = null) {
  const service = getWeiboService();
  if (!service.hasAccess()) {
    throw new Error('Not authorized with Weibo. Please authorize first.');
  }
  
  // Check rate limit
  checkRateLimit();
  
  const options = {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + service.getAccessToken(), // Changed to Bearer
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    muteHttpExceptions: true
  };
  
  if (payload && method === 'POST') {
    // Convert payload to URL-encoded format for Weibo API
    const formData = [];
    // IMPORTANT: Add access_token to the payload for POST requests
    formData.push('access_token=' + encodeURIComponent(service.getAccessToken()));
    for (let key in payload) {
      formData.push(encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]));
    }
    options.payload = formData.join('&');
  }
  
  // Log the full request details
  const logRequest = (msg) => {
    console.log(msg);
    if (captureLogsArray) captureLogsArray.push(msg);
  };
  
  logRequest('=== WEIBO API REQUEST ===');
  logRequest('URL: ' + WEIBO_API_BASE + endpoint);
  logRequest('Method: ' + method);
  logRequest('Headers: ' + JSON.stringify({
    ...options.headers,
    'Authorization': 'Bearer ' + service.getAccessToken().slice(0, 5) + '...' // Mask token
  }));
  if (payload) {
    logRequest('Payload (original): ' + JSON.stringify(payload));
    logRequest('Payload (encoded): ' + options.payload);
  }
  
  try {
    const response = UrlFetchApp.fetch(WEIBO_API_BASE + endpoint, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    const responseHeaders = response.getHeaders();
    
    // Log the full response details
    logRequest('=== WEIBO API RESPONSE ===');
    logRequest('Status Code: ' + responseCode);
    logRequest('Response Headers: ' + JSON.stringify(responseHeaders));
    logRequest('Response Body: ' + responseText);
    
    if (responseCode === 200) {
      const result = JSON.parse(responseText);
      logRequest('=== WEIBO API SUCCESS ===');
      logRequest('Response: ' + JSON.stringify(result));
      return result;
    } else {
      // Parse error response
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: responseText, error_code: 'UNKNOWN' };
      }
      
      const errorMsg = `Weibo API Error ${errorData.error_code}: ${errorData.error}`;
      logRequest('=== WEIBO API ERROR ===');
      logRequest('Error Details: ' + JSON.stringify(errorData));
      
      // Special handling for rate limit
      if (errorData.error_code === 10023 || responseCode === 429) {
        throw new Error('API10023: Rate limit exceeded');
      }
      
      throw new Error(errorMsg);
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
  
  // Get column indices - using existing user_id and user_name columns
  const headers = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
  const userIdCol = headers.indexOf('user_id') + 1;
  const userNameCol = headers.indexOf('user_name') + 1;
  let lastSyncCol = headers.indexOf('last_sync_date') + 1;
  
  // Add last_sync_date column if it doesn't exist
  if (lastSyncCol === 0) {
    const lastCol = usersSheet.getLastColumn();
    usersSheet.getRange(1, lastCol + 1).setValue('last_sync_date');
    lastSyncCol = lastCol + 1;
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
    
    // Use user_id as weibo_user_id and user_name as weibo_screen_name
    const weiboUserId = userId;  // Assuming user_id is the Weibo user ID
    const weiboScreenName = userName;  // Assuming user_name is the Weibo screen name
    
    if (!weiboUserId && !weiboScreenName) {
      errors.push(`${userName}: No user ID or name`);
      continue;
    }
    
    try {
      // Build request parameters - try user_id first (if numeric), otherwise use screen_name
      const isNumericId = !isNaN(weiboUserId);
      const params = isNumericId ? `uid=${weiboUserId}` : `screen_name=${weiboScreenName}`;
      const endpoint = `/2/statuses/user_timeline.json?${params}&count=10`;
      
      // Debug logging
      console.log(`Syncing posts for user: ${userName} (ID: ${weiboUserId})`);
      console.log(`API endpoint: ${endpoint}`);
      
      const result = makeWeiboRequest(endpoint);
      
      console.log(`API response:`, JSON.stringify(result));
      
      // Check for API errors
      if (result.error_code === 21335) {
        // This error means we can only fetch posts for the authenticated user
        errors.push(`${userName}: Can only sync posts for the authenticated Weibo account (API limitation)`);
        continue;
      }
      
      if (result.statuses && result.statuses.length > 0) {
        console.log(`Found ${result.statuses.length} posts for user ${userName}`);
        const newPosts = [];
        
        for (const status of result.statuses) {
          // Skip if we already have this post
          if (existingPostIds.has(String(status.id))) {
            console.log(`Skipping existing post: ${status.id}`);
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
      } else {
        console.log(`No posts found for user ${userName}`);
        console.log(`Full API response:`, JSON.stringify(result));
        errors.push(`${userName}: No posts returned from API`);
      }
      
    } catch (error) {
      console.error(`Error syncing ${userName}:`, error);
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
  
  // Get the selected range
  const range = queueSheet.getActiveRange();
  if (!range) {
    SpreadsheetApp.getUi().alert('⚠️ Please select rows in the Response Queue sheet first.');
    return;
  }
  
  // Store all logs to show in popup
  const fullLogs = [];
  fullLogs.push('=== STARTING SEND APPROVED REPLIES TO WEIBO ===');
  console.log('=== STARTING SEND APPROVED REPLIES TO WEIBO ===');
  
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
  
  // Get selected data
  const selectedRange = range;
  const startRow = selectedRange.getRow();
  const numRows = selectedRange.getNumRows();
  const selectedData = selectedRange.getValues();
  
  // Get all columns data for the selected rows (need full row data)
  const fullRowData = queueSheet.getRange(startRow, 1, numRows, queueSheet.getLastColumn()).getValues();
  
  let sentCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Process selected rows only
  fullLogs.push(`\nProcessing ${numRows} selected rows (starting from row ${startRow})`);
  console.log(`Processing ${numRows} selected rows (starting from row ${startRow})`);
  
  for (let i = 0; i < fullRowData.length; i++) {
    const rowNum = startRow + i; // Actual row number in sheet
    const rowData = fullRowData[i];
    const approved = rowData[10]; // approved column (index 10)
    const sentDate = rowData[12]; // sent_date column (index 12)
    const weiboStatus = queueSheet.getRange(rowNum, weiboSendStatusCol).getValue();
    
    fullLogs.push(`\nRow ${rowNum}: approved="${approved}", sentDate="${sentDate}", weiboStatus="${weiboStatus}"`);
    console.log(`Row ${rowNum}: approved="${approved}", sentDate="${sentDate}", weiboStatus="${weiboStatus}"`);
    
    // Skip if not approved, already sent, or already processed
    if (approved !== 'YES' || sentDate || weiboStatus === 'success') {
      fullLogs.push(`Skipping row ${rowNum}: Not approved or already processed`);
      continue;
    }
    
    const postId = rowData[4]; // triggering_post_id (column 5)
    const responseText = rowData[11] || rowData[9]; // final_response (column 12) or generated_response (column 10)
    const userName = rowData[2]; // user_name (column 3)
    
    if (!postId || !responseText) {
      errors.push(`Row ${rowNum}: Missing post ID or response text`);
      continue;
    }
    
    fullLogs.push(`\n--- Processing Row ${rowNum} ---`);
    fullLogs.push(`User: ${userName}`);
    fullLogs.push(`Post ID: ${postId}`);
    fullLogs.push(`Original Response: ${responseText}`);
    console.log(`\n--- Processing Row ${rowNum} ---`);
    console.log(`User: ${userName}`);
    console.log(`Post ID: ${postId}`);
    console.log(`Original Response: ${responseText}`);
    
    try {
      // Truncate to 140 characters for Weibo limit
      const truncatedComment = responseText.substring(0, 140);
      fullLogs.push(`Truncated Comment (${truncatedComment.length} chars): ${truncatedComment}`);
      console.log(`Truncated Comment (${truncatedComment.length} chars): ${truncatedComment}`);
      
      // Send comment to Weibo
      const payload = {
        'comment': truncatedComment,
        'id': postId
      };
      
      fullLogs.push('Sending comment to Weibo...');
      console.log('Sending comment to Weibo...');
      const result = makeWeiboRequest('/2/comments/create.json', 'POST', payload, fullLogs);
      
      if (result && result.id) {
        // Success - update sheet
        fullLogs.push(`✅ SUCCESS! Comment ID: ${result.id}`);
        console.log(`✅ SUCCESS! Comment ID: ${result.id}`);
        queueSheet.getRange(rowNum, weiboCommentIdCol).setValue(result.id);
        queueSheet.getRange(rowNum, weiboSendStatusCol).setValue('success');
        queueSheet.getRange(rowNum, 13).setValue(new Date()); // sent_date (column 13)
        sentCount++;
        
        // Add delay to avoid rate limits (1.5 seconds between requests)
        Utilities.sleep(1500);
      }
      
    } catch (error) {
      // Error - log it
      fullLogs.push(`❌ ERROR for ${userName}: ${error.toString()}`);
      console.error(`❌ ERROR for ${userName}:`, error.toString());
      queueSheet.getRange(rowNum, weiboSendStatusCol).setValue('failed');
      queueSheet.getRange(rowNum, weiboErrorCol).setValue(error.toString().substring(0, 500)); // Truncate long errors
      errors.push(`${userName}: ${error.toString()}`);
      errorCount++;
      
      // Stop if we hit rate limit
      if (error.toString().includes('API10023')) {
        fullLogs.push('⚠️ Rate limit hit - stopping processing');
        console.error('⚠️ Rate limit hit - stopping processing');
        errors.push('Processing stopped due to rate limit');
        break;
      }
    }
  }
  
  // Show summary with detailed logs
  fullLogs.push('\n=== SEND REPLIES SUMMARY ===');
  fullLogs.push(`Total sent: ${sentCount}`);
  fullLogs.push(`Total failed: ${errorCount}`);
  fullLogs.push(`Errors: ${JSON.stringify(errors)}`);
  
  console.log('\n=== SEND REPLIES SUMMARY ===');
  console.log(`Total sent: ${sentCount}`);
  console.log(`Total failed: ${errorCount}`);
  console.log(`Errors:`, errors);
  
  // Create HTML output with full logs
  const htmlContent = `
    <div style="font-family: monospace; white-space: pre-wrap; max-height: 600px; overflow-y: auto;">
      <h3>📤 Send Results</h3>
      <p>✅ Sent successfully: ${sentCount}</p>
      <p>❌ Failed: ${errorCount}</p>
      ${errors.length > 0 ? '<h4>⚠️ Errors:</h4><p>' + errors.join('\n') + '</p>' : ''}
      <h4>📋 Full Logs:</h4>
      <div style="background-color: #f5f5f5; padding: 10px; border: 1px solid #ddd; max-height: 400px; overflow-y: auto;">
        ${fullLogs.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
    </div>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(800)
    .setHeight(600);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Weibo Send Results');
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
      // Try to make an actual API call to verify the connection works
      try {
        const testResult = makeWeiboRequest('/2/account/rate_limit_status.json');
        if (testResult && testResult.remaining_ip_hits !== undefined) {
          results.push(`✅ Weibo API: Connected (${testResult.remaining_ip_hits} requests remaining)`);
        } else {
          results.push('❌ Weibo API: Authorized but API call failed');
        }
      } catch (apiError) {
        results.push('❌ Weibo API: Authorized but cannot connect - ' + apiError.toString());
      }
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
