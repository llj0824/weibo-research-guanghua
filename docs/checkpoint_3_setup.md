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
- Headers (Row 1): `user_id | user_name | Treatment Group | user_link | user_description | user_followers_cnt | weibo_user_id | weibo_screen_name | last_sync_date | last_response_date | response_count | status | SamplePost`
- Fill with your 226 users assigned to groups: Control, Group1, Group2, Group3, Group4
- The `user_id` should be the Weibo user ID (numeric) or `user_name` should be the Weibo screen name
- The script will automatically add `last_sync_date` column if it doesn't exist

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

### 5.1 Authorize Weibo Access [DONE]

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
2. Your users should already have:
   - `user_id`: Should be the Weibo user ID (numeric) 
   - `user_name`: Should be the Weibo screen name
   
   The script will use these existing columns to sync with Weibo:
   - If `user_id` is numeric, it will use it as the Weibo UID
   - Otherwise, it will use `user_name` as the Weibo screen name
   
   Example:
   ```
   user_id     | user_name      | Treatment Group | ...other columns...
   1234567890  | zhangsan_weibo | Group1         | ...
   lisi_weibo  | 李四的微博      | Group2         | ...
   ```

### 5.4 Test Sync Posts

This function (`syncUserPostsFromWeibo()`) fetches recent posts from Weibo for selected users and adds them to your Posts sheet.

1. **Select users in Users sheet** (click and drag to select rows)
   - The script will use their `user_id` (if numeric) or `user_name` to fetch from Weibo

2. **Click** `🤖 Response System → 🌐 Weibo Integration → 🔁 Sync Posts from Weibo`
   - For each selected user, the script:
     - Calls Weibo API endpoint `/2/statuses/user_timeline.json` to get up to 50 recent posts
     - Checks if posts already exist in Posts sheet (avoids duplicates by checking post_id)
     - Adds new posts with all metadata (content, likes, comments, timestamps, etc.)
     - Updates `last_sync_date` in Users sheet
   - Uses 1 API request per user (counts toward 150/hour rate limit)

3. **Wait for completion dialog** showing:
   - Number of users successfully synced
   - Total new posts added
   - Any errors encountered

4. **Check Posts sheet** for new entries
   - New posts appear at the bottom with all 15 columns populated
   - Posts are real Weibo data, not test data

### 5.5 Test Full Workflow

This demonstrates the complete AI response generation and posting cycle.

#### Step 1: Pull Latest Posts
```
🤖 Response System → 🔄 Pull Latest Posts for All Users
```
**What it does** (`pullLatestPosts()`):
- Scans the Posts sheet for ALL users in your Users sheet
- Finds each user's most recent post (by timestamp)
- Copies these "latest posts" to the Triggering Post sheet
- These become the posts that AI will respond to
- Shows summary: "✅ Updated 226 users with their latest posts!"

#### Step 2: Generate AI Responses
1. **Select users** in Users sheet (only select non-Control group users)
2. **Click** `🤖 Response System → 📝 Generate Responses for Selected Users`

**What it does** (`generateResponsesForSelected()`):
- For each selected user:
  - Gets their triggering post from Triggering Post sheet
  - Gets their post history (for Group2 & Group4 only)
  - Fetches the appropriate prompt template from Prompts sheet
  - Replaces placeholders: `{user_name}`, `{post_content}`, `{user_history}`
  - Calls DeepSeek API with the constructed prompt
  - Saves the response to Response Queue with all context

3. **Check Response Queue** for generated responses
   - Each row shows: timestamp, user info, triggering post, AI response
   - `approved` column defaults to "NO"
   - `history_context` shows what historical posts were provided (if any)
   - `prompt_sent` shows the exact prompt sent to DeepSeek

#### Step 3: Send to Weibo
1. **In Response Queue**, change `approved` values to "YES" for responses you want to send
   - You can also edit `final_response` to customize the text before sending

2. **Click** `🤖 Response System → 🌐 Weibo Integration → 📤 Send Approved Replies`

**What it does** (`sendApprovedRepliesToWeibo()`):
- Scans Response Queue for rows where:
  - `approved` = "YES"
  - `sent_date` is empty
  - `weibo_send_status` is not "success"
- For each approved response:
  - Truncates text to 140 characters (Weibo's limit)
  - Calls Weibo API endpoint `/2/comments/create.json`
  - Posts the comment on the original Weibo post
  - Updates Response Queue with:
    - `weibo_comment_id`: The ID of the posted comment
    - `weibo_send_status`: "success" or "failed"
    - `sent_date`: Current timestamp
    - `weibo_error_message`: Error details if failed

3. **Check results** in Response Queue:
   - Look for `weibo_comment_id` - this confirms successful posting
   - Failed sends show error in `weibo_error_message` column
   - Common errors: post deleted, comment too long, rate limit

### Understanding the Data Flow

```
Weibo → Posts Sheet → Triggering Post Sheet → AI Generation → Response Queue → Weibo
```
1. **Sync**: Real posts from Weibo → Posts sheet
2. **Select**: Latest post per user → Triggering Post sheet  
3. **Generate**: Triggering post + prompt → AI response in Response Queue
4. **Approve**: Manual review and approval
5. **Send**: Approved responses → Posted as Weibo comments

## Important Notes:

- **Rate Limit**: 150 requests/hour - plan accordingly
- **Comment Length**: Weibo limits to 140 characters
- **Sync Frequency**: Don't over-sync; once daily is usually enough
- **Error Handling**: Check `weibo_error_message` column for failures
- **Security**: Never share App Secret or API keys
