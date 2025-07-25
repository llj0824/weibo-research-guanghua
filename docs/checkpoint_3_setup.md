# Complete Setup Guide for AppScript_checkpoint_3.js

This guide provides detailed, step-by-step instructions for deploying the Weibo AI Response System with full API integration.

## Prerequisites

- Google account with access to Google Sheets and Apps Script
- Weibo developer account (requires Chinese phone number)
- DeepSeek API key
- Basic understanding of Google Sheets

## Phase 1: Google Sheets Setup

### 1.1 Create the Google Sheet Structure

1. **Create a new Google Sheet** or use existing one
2. **Create these tabs (sheets) in exact order:**

#### Tab 1: Users
- Headers (Row 1): `user_id | user_name | group | weibo_user_id | weibo_screen_name | last_sync_date`
- Fill with your 226 users assigned to groups: Control, Group1, Group2, Group3, Group4
- Leave weibo columns empty initially (will fill later)

#### Tab 2: Prompts
- Headers (Row 1): `group | prompt_template | system_prompt`
- Add rows for each group with prompts containing placeholders: `{user_name}`, `{post_content}`, `{user_history}`

#### Tab 3: Posts
- Headers (Row 1): `user_id | post_id | post_link | post_publish_time | post_content | post_geo | post_likes_cnt | post_comments_cnt | post_reposts_cnt | post_pic_num | post_pics | post_video_url | post_topic_names | post_topic_num | post_topic_urls`
- Import your existing Weibo posts data here

#### Tab 4: Triggering Post
- Same headers as Posts sheet
- Will be auto-populated by the script


#### Tab 5: Response Queue [Done]
- Headers (Row 1): `timestamp | user_id | user_name | group | triggering_post_id | triggering_post_content | history_context | prompt_sent | generated_response | approved | final_response | sent_date | weibo_comment_id | weibo_send_status | weibo_error_message`

#### Tab 6: Analytics (optional)
- Create empty sheet, script will populate

## Phase 2: Google Apps Script Setup

### 2.1 Open Apps Script Editor

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Copy ALL content from `AppScript_checkpoint_3.js` and paste it

### 2.2 Add OAuth2 Library (CRITICAL STEP)

1. In Apps Script editor, click **Libraries** in left sidebar (+ icon)
2. In "Script ID" field, paste: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`
3. Click **Look up**
4. Select **Version**: Choose highest number (e.g., 43)
5. Keep **Identifier** as: `OAuth2`
6. Click **Add**

### 2.3 Add Settings HTML

1. In Apps Script editor, click **+** next to Files
2. Select **HTML**
3. Name it exactly: `Settings_checkpoint_3`
4. Delete default content
5. Paste entire content from `Settings_checkpoint_3.html`
6. Click save (💾)

### 2.4 Get Your Script ID (Important!)

1. In Apps Script editor, click **Project Settings** (gear icon)
2. Copy the **Script ID** (looks like: `1g-zyHtsKqIt7OKWgVFdu-Hwjn0Q5z6HpLcfMjucBxvLyaV9A5Oz7W6Zm`)
3. Save this - you'll need it for Weibo setup

## Phase 3: Weibo Developer Account Setup

### 3.1 Register as Weibo Developer

1. Go to https://open.weibo.com
2. Click **注册** (Register) or **登录** (Login)
3. You need:
   - Verified Weibo account
   - Chinese phone number for SMS verification
   - ID verification (passport/ID card)

### 3.2 Create Your Application

1. After login, go to **我的应用** (My Apps)
2. Click **创建应用** (Create App)
3. Select **网页应用** (Web Application)
4. Fill in:
   - **应用名称** (App Name): "北大光华研究项目" or similar
   - **应用简介** (Description): "Academic research project studying AI responses on social media"
   - **应用地址** (App URL): Your institution URL or `https://www.gsm.pku.edu.cn/`
   - **应用域名** (Domain): Same as above

### 3.3 Configure OAuth Settings (CRITICAL)

1. In your app settings, find **OAuth2.0 授权设置** (OAuth2.0 Settings)
2. Add **授权回调页** (Redirect URI):
   ```
   https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback
   ```
   Replace `YOUR_SCRIPT_ID` with the ID from step 2.4

3. Add **取消授权回调页** (Cancel Authorization Callback):
   ```
   https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback
   ```

### 3.4 Get Your Credentials

1. In app dashboard, find:
   - **App Key**: (looks like: 1234567890)
   - **App Secret**: (looks like: abcdef1234567890abcdef1234567890)
2. **SAVE THESE SECURELY** - you'll need them next

## Phase 4: Script Configuration

### 4.1 Deploy as Web App

1. In Apps Script editor, click **Deploy → New Deployment**
2. Click gear icon ⚙️ → **Web app**
3. Fill in:
   - **Description**: "Weibo Integration v1"
   - **Execute as**: Me
   - **Who has access**: Anyone (required for OAuth callback)
4. Click **Deploy**
5. **IMPORTANT**: Copy the Web app URL (you might need this)
6. Click **Done**

   ### 4.2 Set Script Properties (Method 1: Via Script)

1. In Apps Script editor, create a temporary function:
```javascript
function setInitialProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('DEEPSEEK_API_KEY', 'YOUR_DEEPSEEK_KEY_HERE');
  props.setProperty('WEIBO_APP_KEY', 'YOUR_WEIBO_APP_KEY');
  props.setProperty('WEIBO_APP_SECRET', 'YOUR_WEIBO_APP_SECRET');
}
```
2. Replace the values with your actual keys
3. Run this function once (click ▶️)
4. DELETE this function after running (for security)

### 4.3 Set Script Properties (Method 2: Via UI)

1. Return to Google Sheet
2. Refresh the page (Ctrl+R or Cmd+R)
3. You should see **🤖 Response System** menu
4. Click **🤖 Response System → ⚙️ Settings**
5. Fill in:
   - DeepSeek API Key
   - Weibo App Key
   - Weibo App Secret
6. Click **💾 Save Settings**

## Phase 5: Authorization and Testing

### 5.1 Authorize Weibo Access [ON THIS STEP - waiting for 天实 set callback on weibo]

1. In Google Sheet, click **🤖 Response System → 🌐 Weibo Integration → 🔐 Authorize Weibo Access**
2. A dialog appears with authorization link
3. Click the link (opens in new tab)
4. Log in to Weibo with the account that owns the app
5. Click **授权** (Authorize) to grant permissions
6. You'll see "Success! You can close this tab"
7. Close the tab and dismiss the dialog

### 5.2 Test Connection

1. Click **🤖 Response System → ⚙️ Settings**
2. Click **🔌 Test Connections**
3. You should see:
   - ✅ DeepSeek API: Connected
   - ✅ Weibo API: Authorized

### 5.3 Prepare User Data

1. Go to **Users** sheet
2. For each user you want to sync, add EITHER:
   - `weibo_user_id`: The numeric Weibo user ID
   - `weibo_screen_name`: The Weibo username (without @)
   
   Example:
   ```
   user_id | user_name | group  | weibo_user_id | weibo_screen_name
   001     | 张三      | Group1 | 1234567890    |
   002     | 李四      | Group2 |               | lisi_weibo
   ```

### 5.4 Test Sync Posts

1. Select a few users in Users sheet (click and drag to select rows)
2. Click **🤖 Response System → 🌐 Weibo Integration → 🔁 Sync Posts from Weibo**
3. Wait for completion dialog
4. Check **Posts** sheet for new entries

### 5.5 Test Full Workflow

1. Click **🤖 Response System → 🔄 Pull Latest Posts for All Users**
   - This populates the Triggering Post sheet

2. Select users in Users sheet
3. Click **🤖 Response System → 📝 Generate Responses for Selected Users**
   - Check Response Queue for generated responses

4. In Response Queue, change some `approved` values to "YES"
5. Click **🤖 Response System → 🌐 Weibo Integration → 📤 Send Approved Replies**
   - Check `weibo_comment_id` column for success

## Phase 6: Troubleshooting

### Common Issues:

**"Not authorized with Weibo"**
- Re-run authorization process
- Check App Key and Secret are correct

**"Rate limit exceeded"**
- Check usage: **🌐 Weibo Integration → 📊 Check API Usage**
- Wait for next hour (limit resets hourly)

**"Script not found" error**
- Ensure OAuth2 library is added correctly
- Check library version is latest

**No posts found during sync**
- Verify weibo_user_id or screen_name is correct
- Check if user has public posts
- Ensure Weibo app is approved/active

**OAuth callback error**
- Verify redirect URI in Weibo app matches exactly:
  `https://script.google.com/macros/d/YOUR_ACTUAL_SCRIPT_ID/usercallback`
- Ensure web app is deployed with "Anyone" access

## Phase 7: Production Checklist

Before going live:

1. ✅ All 6 sheets created with correct headers
2. ✅ OAuth2 library added (version 43+)
3. ✅ Script deployed as web app
4. ✅ All API keys configured
5. ✅ Weibo authorization completed
6. ✅ Test with 5-10 users first
7. ✅ Monitor rate limits closely
8. ✅ Backup your data regularly

## Important Notes:

- **Rate Limit**: 150 requests/hour - plan accordingly
- **Comment Length**: Weibo limits to 140 characters
- **Sync Frequency**: Don't over-sync; once daily is usually enough
- **Error Handling**: Check `weibo_error_message` column for failures
- **Security**: Never share App Secret or API keys

## API Usage Guidelines

### Batch Processing
- Sync multiple users at once to save API calls
- Send replies in batches respecting rate limits
- Use the API usage checker before large operations

### Data Management
- Regularly archive old responses to maintain performance
- Export Response Queue data periodically
- Monitor Posts sheet size (keep under 50,000 rows)

### Error Recovery
- Failed sends can be retried after fixing issues
- Check error messages for specific problems
- Keep logs of all API interactions

## Next Steps

1. **Small Scale Test**: Start with 5-10 users
2. **Monitor Performance**: Track API usage patterns
3. **Scale Gradually**: Increase user count slowly
4. **Automate**: Consider time-based triggers for regular syncs
5. **Analyze**: Use Analytics sheet to track engagement

---

*Checkpoint 3 Setup Guide v1.0*
*Last Updated: 2025-01-25*