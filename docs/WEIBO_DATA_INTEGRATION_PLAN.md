# Weibo Data Integration Plan

## Overview

This document outlines the necessary updates to integrate real Weibo posting data into the response generation system. Currently, the system uses hardcoded sample data. We will update it to use actual posts from `posting_history_af0531.xlsx` and user context from both posting history files.

## Current System Issues

1. **Hardcoded Post Content**: Always uses "今天天气真好，出去散步了一圈，心情特别愉快！🌞"
2. **Fake Topics**: Uses "生活、旅行" for all users instead of real interests
3. **No Real Data Integration**: Ignores the actual posting history we have
4. **Limited User Control**: Han Tianshi can't test with different posts

## Update Plan

### 1. Google Sheets Structure Updates

#### 1.1 Add "Posts" Sheet

**Purpose**: Store recent posts from each user for response generation

**Columns**:
```
user_id | post_id | post_content | post_topic_names | post_publish_time | post_likes_cnt | post_comments_cnt
```

**Data Source**: Import from `posting_history_af0531.xlsx`

**Import Instructions**:
1. Open `posting_history_af0531.xlsx` in Excel
2. Copy columns: A (user_id), B (post_id), E (post_content), N (post_topic_names), D (post_publish_time), G (post_likes_cnt), H (post_comments_cnt)
3. Paste into new "Posts" sheet in Google Sheets
4. Sort by user_id then by post_publish_time (newest first)

#### 1.2 Add "User Context" Sheet

**Purpose**: Aggregate user interests and posting patterns for Groups 2 & 4

**Columns**:
```
user_id | user_name | common_topics | post_frequency | content_themes | sample_posts
```

**Generation Method**:
1. Analyze both `posting_history_bf0531.xlsx` and `posting_history_af0531.xlsx`
2. Extract most frequent hashtags/topics per user
3. Calculate average posts per week
4. Identify common themes (food, travel, daily life, etc.)
5. Store 2-3 representative posts

**Example Row**:
```
1234567890 | 小明的日常 | 美食,旅行,北京生活 | 3.5/week | Daily life, food reviews | [links to posts]
```

### 2. AppScript.js Updates

#### 2.1 Remove Hardcoded Data

**Delete**:
```javascript
// Remove these lines:
const samplePost = "今天天气真好，出去散步了一圈，心情特别愉快！🌞";
.replace('{user_topics}', '生活、旅行');
```

#### 2.2 Add Data Lookup Functions

```javascript
// Get most recent post for a user
function getRecentPostForUser(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const postsSheet = sheet.getSheetByName('Posts');
  const data = postsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return {
        postId: data[i][1],
        content: data[i][2],
        topics: data[i][3],
        publishTime: data[i][4]
      };
    }
  }
  return null;
}

// Get user context for Groups 2 & 4
function getUserContext(userId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const contextSheet = sheet.getSheetByName('User Context');
  const data = contextSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return {
        commonTopics: data[i][2],
        postFrequency: data[i][3],
        contentThemes: data[i][4]
      };
    }
  }
  return null;
}
```

#### 2.3 Update Response Generation Logic

```javascript
function generateResponsesForSelected() {
  // ... existing setup code ...
  
  selectedData.forEach(row => {
    const userId = row[0];
    const userName = row[1];
    const group = row[2];
    
    if (group === 'Control') return;
    
    // Get real post data
    const postData = getRecentPostForUser(userId);
    if (!postData) {
      console.log(`No posts found for user ${userId}`);
      return;
    }
    
    // Get user context for Groups 2 & 4
    let userTopics = '';
    if (group === 'Group2' || group === 'Group4') {
      const context = getUserContext(userId);
      userTopics = context ? context.commonTopics : 'general interests';
    }
    
    // Generate response with real data
    const prompt = promptConfig.template
      .replace('{post_content}', postData.content)
      .replace('{user_topics}', userTopics)
      .replace('{user_name}', userName);
    
    const response = callDeepseekAPI(prompt, promptConfig.system);
    
    // Add to queue with real post data
    queueSheet.appendRow([
      new Date(),
      userId,
      userName,
      group,
      postData.postId,
      postData.content,
      response,
      'NO',
      '',
      '',
      promptConfig.template
    ]);
  });
}
```

### 3. New Features to Add

#### 3.1 Post Selection Options

Add a settings option to control which posts to use:
- **Most Recent**: Always use the latest post
- **Random Recent**: Randomly select from last 5 posts
- **High Engagement**: Select posts with most likes/comments
- **Manual Selection**: Let user choose specific posts

#### 3.2 Batch Import Tool

Create a menu item to refresh post data:
```javascript
function importLatestPosts() {
  // Instructions for importing from Excel
  SpreadsheetApp.getUi().alert(
    'To update posts:\n' +
    '1. Export latest posts from Weibo\n' +
    '2. Copy data to Posts sheet\n' +
    '3. Sort by user_id and date'
  );
}
```

#### 3.3 Context Analysis Tool

Automate the creation of User Context sheet:
```javascript
function analyzeUserContext() {
  // Analyze posting history
  // Extract common topics
  // Calculate posting frequency
  // Update User Context sheet
}
```

### 4. Documentation Updates

#### 4.1 Update README.md

Add section explaining:
- Data flow: Weibo → Excel → Google Sheets → Deepseek
- How real posts are selected
- How user context is determined
- Manual data update process

#### 4.2 Update Implementation Guide

Add:
- Steps to import post data
- Explanation of new sheets
- Troubleshooting for missing data
- Best practices for data freshness

### 5. Implementation Timeline

**Day 1**:
- Create new sheet structures
- Import initial data
- Test data lookups

**Day 2**:
- Update AppScript.js
- Test with real posts
- Debug edge cases

**Day 3**:
- Add helper tools
- Update documentation
- Train Han Tianshi

## Benefits of These Updates

1. **Real Responses**: Generate responses to actual Weibo posts
2. **Accurate Context**: Use real user interests, not fake topics
3. **Flexibility**: Test different posts and scenarios
4. **Research Validity**: Responses based on genuine user behavior
5. **User Control**: Han Tianshi can update data and test variations

## Next Steps

1. Review this plan with the team
2. Backup current system
3. Implement updates in phases
4. Test thoroughly before full deployment
5. Create user guide for Han Tianshi

---

*Document created: December 2024*
*Target completion: 3 days*