# Checkpoint 3: Weibo API Integration Implementation Guide

## Overview

Checkpoint 3 adds Weibo API integration to the existing Google Sheets response system, enabling:
- Automatic syncing of user posts from Weibo
- Direct posting of approved AI-generated replies to Weibo
- OAuth2 authentication
- Rate limiting (150 requests/hour)

## Prerequisites

1. **Weibo Developer Account**
   - Register at https://open.weibo.com
   - Create an application to get App Key and App Secret
   - Configure redirect URI: `https://script.google.com/macros/d/{YOUR_SCRIPT_ID}/usercallback`

2. **Google Apps Script OAuth2 Library**
   - In Apps Script editor: Resources → Libraries
   - Add library ID: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`
   - Select latest version and click "Add"

## Setup Instructions

### Step 1: Deploy the New Script

1. Open your Google Sheet
2. Go to Extensions → Apps Script
3. Replace existing code with `AppScript_checkpoint_3.js`
4. Save the script

### Step 2: Configure Weibo API Credentials

1. In Apps Script editor, go to Project Settings (gear icon)
2. Add Script Properties:
   - `WEIBO_APP_KEY`: Your Weibo App Key
   - `WEIBO_APP_SECRET`: Your Weibo App Secret
3. Or use the Settings dialog in the sheet menu

### Step 3: Set Up OAuth2 Redirect

1. In Apps Script editor, click "Deploy" → "New Deployment"
2. Choose "Web app" as deployment type
3. Copy the deployment URL
4. Extract the script ID from the URL
5. Update your Weibo app settings with redirect URI:
   ```
   https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
   ```

### Step 4: Authorize Weibo Access

1. In Google Sheets, click "🤖 Response System" → "🌐 Weibo Integration" → "🔐 Authorize Weibo Access"
2. Click the authorization link
3. Log in to Weibo and approve access
4. Close the success tab when done

## Using Weibo Integration Features

### Syncing Posts from Weibo

1. **Add Weibo User Info to Users Sheet**
   - The script will automatically add columns: `weibo_user_id`, `weibo_screen_name`, `last_sync_date`
   - Fill in either `weibo_user_id` or `weibo_screen_name` for users you want to sync

2. **Select Users to Sync**
   - In Users sheet, select the rows of users to sync
   - Click "🌐 Weibo Integration" → "🔁 Sync Posts from Weibo"

3. **What Happens**
   - Fetches up to 50 recent posts per user
   - Adds new posts to Posts sheet (skips duplicates)
   - Updates `last_sync_date` for successful syncs
   - Shows summary with count of new posts

### Sending Replies to Weibo

1. **Approve Responses**
   - In Response Queue sheet, change `approved` column to "YES" for responses you want to send
   - Optionally edit the `final_response` column

2. **Send to Weibo**
   - Click "🌐 Weibo Integration" → "📤 Send Approved Replies"
   - The script will:
     - Find all approved, unsent responses
     - Post them as comments on the original Weibo posts
     - Update `sent_date` and add `weibo_comment_id`
     - Mark status as "success" or "failed"

3. **Monitor Results**
   - Check new columns: `weibo_comment_id`, `weibo_send_status`, `weibo_error_message`
   - Failed sends can be retried after fixing issues

### Rate Limit Management

**Current Limit:** 150 requests per hour

**Check Usage:**
- Click "🌐 Weibo Integration" → "📊 Check API Usage"
- Shows current hour's usage and remaining requests

**Rate Limit Strategy:**
- Requests are tracked per hour
- Script automatically stops when limit reached
- Wait for next hour to continue

## Sheet Structure Updates

### Users Sheet - New Columns
| Column | Description |
|--------|-------------|
| weibo_user_id | Weibo user ID (int64) |
| weibo_screen_name | Weibo username |
| last_sync_date | Last successful sync timestamp |

### Response Queue - New Columns
| Column | Description |
|--------|-------------|
| weibo_comment_id | ID of posted comment on Weibo |
| weibo_send_status | Status: success/failed/pending |
| weibo_error_message | Error details if send failed |

## Troubleshooting

### Authorization Issues
- **"Not authorized with Weibo"**: Use menu to authorize
- **Token expired**: Re-authorize through menu
- **Invalid credentials**: Check App Key/Secret in settings

### Sync Issues
- **No posts found**: Verify user has public posts
- **User not found**: Check weibo_user_id or screen_name is correct
- **Rate limit**: Wait for next hour or check usage

### Send Issues
- **Comment too long**: Weibo limits to 140 characters
- **Post not found**: Original post may be deleted
- **Rate limit exceeded**: Check API usage, wait if needed

## Best Practices

1. **Batch Operations**
   - Sync multiple users at once to save API calls
   - Send replies in batches to respect rate limits

2. **Error Handling**
   - Check error messages in sheets for failed operations
   - Retry failed sends after fixing issues

3. **Data Management**
   - Regularly sync to keep posts current
   - Archive old responses to keep sheets performant

4. **Security**
   - Never share App Secret
   - Regularly review authorized access
   - Use script properties for sensitive data

## API Usage Examples

### Manual API Testing
You can test API endpoints directly:

```javascript
// In Apps Script editor console
function testUserTimeline() {
  const result = makeWeiboRequest('/2/statuses/user_timeline.json?screen_name=test_user&count=5');
  console.log(result);
}
```

### Custom Integrations
The `makeWeiboRequest()` function can be used for other Weibo API endpoints:

```javascript
// Get user info
const userInfo = makeWeiboRequest('/2/users/show.json?screen_name=username');

// Get comments on a post  
const comments = makeWeiboRequest('/2/comments/show.json?id=POST_ID');
```

## Next Steps

1. **Test with Small Groups**: Start with 5-10 users to verify setup
2. **Monitor Rate Limits**: Track usage patterns, adjust batch sizes
3. **Automate Syncing**: Set up time-based triggers for regular syncs
4. **Review Analytics**: Use Analytics sheet to track engagement

---

*Checkpoint 3 Implementation Guide v1.0*