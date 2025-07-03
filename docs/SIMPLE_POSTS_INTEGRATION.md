# Simple Posts Integration Guide

## Overview
This guide shows how to manually integrate real Weibo posts from the Excel files into the Google Sheets system, replacing the hardcoded sample post.

## Step 1: Create "Posts" Sheet

### 1.1 Add New Sheet Tab
1. In your Google Sheets, click the "+" at bottom to add new sheet
2. Name it exactly: `Posts`

### 1.2 Set Column Headers
Copy and paste this header row into row 1:
```
user_id	post_id	post_link	post_publish_time	post_content	post_geo	post_likes_cnt	post_comments_cnt	post_reposts_cnt	post_pic_num	post_pics	post_video_url	post_topic_names	post_topic_num	post_topic_urls
```

### 1.3 Import Data from Excel
1. Open `posting_history_af0531.xlsx` in Excel
2. Select ALL columns (A through O) - this includes all post data
3. Copy all the selected data
4. In Google Sheets "Posts" tab, click cell A2
5. Paste (this will import all the real posts with complete data)

**Note**: You should now have hundreds of real posts in your sheet!

## Step 2: Update AppScript.js

Replace the current `AppScript.js` with this updated version that looks up real posts:

### Complete Updated Code:
@AppScript_v2.js

## Step 3: Update the Script

1. In Google Sheets, go to Extensions → Apps Script
2. Select all the existing code and delete it
3. Paste the updated code above
4. Click the disk icon to save
5. Close the Apps Script editor
6. Refresh your Google Sheet (F5)

## Step 4: Test with Real Posts

1. **Check Posts**: Make sure you have posts imported in the "Posts" sheet
2. **Select Users**: In the "Users" sheet, select 2-3 users (make sure their user_ids exist in Posts)
3. **Generate Responses**: Click "🤖 Response System" → "📝 Generate Responses for Selected Users"
4. **Check Results**: Look in "Response Queue" sheet - you should see:
   - Real post content (not the weather sample)
   - Real post IDs
   - Post publish times
   - Responses generated based on actual posts
   - "used_history" column showing YES for Groups 2&4, NO for Groups 1&3

## Troubleshooting

### "Posts sheet not found!"
- Make sure the sheet is named exactly `Posts` (case sensitive)

### "No posts found for user"
- Check that the user_id in Users sheet matches user_id in Posts sheet
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