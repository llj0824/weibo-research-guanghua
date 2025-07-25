Google sheet: https://docs.google.com/spreadsheets/d/1m1H2-zutyutnAX3_Cf0J13EVjHslqcXsRfxt5DpRSSI/edit?gid=1460325950#gid=1460325950

### Authorize Weibo Access [DONE]

1. In Google Sheet, click **🤖 Response System → 🌐 Weibo Integration → 🔐 Authorize Weibo Access**
2. A dialog appears with authorization link
3. Click the link (opens in new tab)
4. Log in to Weibo with the account that owns the app
5. Click **授权** (Authorize) to grant permissions
6. You'll see "Success! You can close this tab"
7. Close the tab and dismiss the dialog

### Test Connection

1. Click **🤖 Response System → ⚙️ Settings**
2. Click **🔌 Test Connections**
3. You should see:
   - ✅ DeepSeek API: Connected
   - ✅ Weibo API: Authorized
### Test Full Workflow

This demonstrates the complete AI response generation and posting cycle.

#### Step 1: Pull Latest Posts (Update 'Triggering Posts' Sheet)
```
🤖 Response System → 🔄 Pull Latest Posts for All Users
```
**What it does**:
- Scans the Posts sheet for ALL users in your Users sheet
- Finds each user's most recent post (by timestamp)
- Copies these "latest posts" to the Triggering Post sheet
- These become the posts that AI will respond to
- Shows summary: "✅ Updated 226 users with their latest posts!"

#### Step 2: Generate AI Responses
1. **Select users** in Users sheet (only select non-Control group users)
2. **Click** `🤖 Response System → 📝 Generate Responses for Selected Users`

**What it does**:
- For each selected user:
  - Gets their triggering post from Triggering Post sheet
  - Gets their post history (for Group2 & Group4 only)
  - Fetches the appropriate prompt template from Prompts sheet
  - Replaces placeholders: `{user_name}`, `{post_content}`, `{user_history}`
  - Calls DeepSeek API with the constructed prompt
  - Saves the response to Response Queue with all context

1. **Check Response Queue** for generated responses
   - Each row shows: timestamp, user info, triggering post, AI response
   - `approved` column defaults to "NO"
   - `history_context` shows what historical posts were provided (if any)
   - `prompt_sent` shows the exact prompt sent to DeepSeek

#### Step 3: Send to Weibo
1. **In Response Queue**, change `approved` values to "YES" for responses you want to send
   - You can also edit `final_response` to customize the text before sending

2. **Click** `🤖 Response System → 🌐 Weibo Integration → 📤 Send Approved Replies`

**What it does**:
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

1. **Check results** in Response Queue:
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
