# Checkpoint 3: Weibo API Integration Research & Plan

## Executive Summary

This document outlines the research findings and implementation plan for integrating Weibo API into our Google Sheets-based response system. The integration will enable:
1. Automatic fetching of user posts from Weibo
2. Direct posting of AI-generated replies to Weibo posts

## Research Findings

### Weibo API Overview

#### Current API Version
- Weibo offers API v2 using OAuth 2.0 authentication
- Official documentation: https://open.weibo.com/wiki/API文档/en
- Last major update: The documentation appears to be maintained but updates are infrequent

#### Authentication Requirements

**OAuth 2.0 Flow:**
1. **App Registration Required**
   - Must register application at open.weibo.com
   - Obtain App Key (client_id) and App Secret (client_secret)
   - Configure redirect URI: `https://script.google.com/macros/d/{SCRIPT_ID}/usercallback`

2. **Authentication Endpoints:**
   - Authorize: `https://api.weibo.com/oauth2/authorize`
   - Access Token: `https://api.weibo.com/oauth2/access_token`

3. **Token Requirements:**
   - All API calls require `access_token` parameter
   - Tokens expire (typically after 30 days)
   - Need to implement refresh token mechanism

### API Endpoints Research

#### 1. User Timeline Endpoint (Fetch Posts)

**Endpoint:** `https://api.weibo.com/2/statuses/user_timeline.json`

**Details:**
- HTTP Method: GET
- Authentication: Required (OAuth 2.0)
- Purpose: Returns a user's most recent weibos

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| access_token | string | Yes | OAuth2 access token |
| uid | int64 | Choice* | User ID |
| screen_name | string | Choice* | User nickname |
| since_id | int64 | No | Return results newer than this ID |
| max_id | int64 | No | Return results older than this ID |
| count | int | No | Number per page (default: 50, max: 200) |
| page | int | No | Page number (default: 1) |
| feature | int | No | Filter type (0: all, 1: original, 2: picture) |

*Must provide either uid OR screen_name

**Response Format:**
```json
{
  "statuses": [
    {
      "created_at": "Tue May 31 17:46:55 +0800 2011",
      "id": 11488058246,
      "text": "Post content here",
      "source": "<a href='...' rel='nofollow'>Weibo</a>",
      "user": {
        "id": 1404376560,
        "screen_name": "username",
        "name": "Display Name"
      },
      "reposts_count": 0,
      "comments_count": 0,
      "thumbnail_pic": "http://...",
      "bmiddle_pic": "http://...",
      "original_pic": "http://..."
    }
  ],
  "total_number": 1234
}
```

#### 2. Create Comment Endpoint (Post Replies)

**Endpoint:** `https://api.weibo.com/2/comments/create.json`

**Details:**
- HTTP Method: POST
- Authentication: Required (OAuth 2.0)
- Purpose: Post a comment to a weibo

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| access_token | string | Yes | OAuth2 access token |
| comment | string | Yes | Comment content (max 140 characters) |
| id | int64 | Yes | Weibo ID to comment on |
| comment_ori | int | No | 0: no, 1: comment on original if repost |

**Response Format:**
```json
{
  "created_at": "Wed Jun 01 00:50:25 +0800 2011",
  "id": 12438492184,
  "text": "Comment text here",
  "source": "Web",
  "mid": "202110601896455629",
  "user": {
    "id": 1223762662,
    "screen_name": "commenter_name",
    "name": "Commenter Display Name"
  },
  "status": {
    "created_at": "Tue May 31 17:46:55 +0800 2011",
    "id": 11488058246,
    "text": "Original post content"
  }
}
```

### API Rate Limits

**Important Note:** Specific rate limit numbers were not found in the documentation, but Weibo implements rate limiting.

**Rate Limit Checking:**
- Endpoint: `https://api.weibo.com/2/account/rate_limit_status.json`
- Returns current API usage and limits

**General Guidelines:**
- API access is subject to "Count Limitation"
- Different levels of API access (Normal, Advanced, Partner)
- Rate limits vary by endpoint and access level
- Implement exponential backoff for rate limit errors (HTTP 429)

### API Access Restrictions

1. **Developer Account Required**
   - Must have verified Weibo developer account
   - App must be reviewed and approved

2. **Search API Limitation**
   - Search API not available to all developers
   - Requires special permission (contact @微博开放平台)

3. **Content Restrictions**
   - Comments limited to 140 characters
   - Must comply with Weibo content policies

## Implementation Plan

### Phase 1: OAuth Integration (Foundation)

#### 1.1 Setup OAuth2 Library
```javascript
// Add Google's OAuth2 library for Apps Script
// Library ID: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
```

#### 1.2 Create OAuth Service
```javascript
function getWeiboService() {
  return OAuth2.createService('Weibo')
    .setAuthorizationBaseUrl('https://api.weibo.com/oauth2/authorize')
    .setTokenUrl('https://api.weibo.com/oauth2/access_token')
    .setClientId(getWeiboAppKey())
    .setClientSecret(getWeiboAppSecret())
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('all') // Adjust based on needs
    .setParam('access_type', 'offline')
    .setParam('approval_prompt', 'force');
}
```

#### 1.3 Settings Management
- Add new Script Properties:
  - `WEIBO_APP_KEY`
  - `WEIBO_APP_SECRET`
- Update Settings UI to configure Weibo credentials

### Phase 2: Core Functions

#### 2.1 Sync User Posts Function
```javascript
function syncUserPostsFromWeibo() {
  // 1. Get selected users from Users sheet
  // 2. For each user with Weibo ID:
  //    - Call user_timeline API
  //    - Compare with existing posts in Posts sheet
  //    - Add new posts only
  // 3. Update "last_sync" timestamp
  // 4. Show summary report
}
```

**Implementation Details:**
- Batch process users to respect rate limits
- Store Weibo user_id mapping in Users sheet
- Add sync status columns to track progress
- Handle pagination for users with many posts

#### 2.2 Send Replies Function
```javascript
function sendApprovedRepliesToWeibo() {
  // 1. Query Response Queue for approved, unsent replies
  // 2. For each reply:
  //    - Extract post_id from triggering post
  //    - Call comments/create API
  //    - Update sent_date and status
  // 3. Handle errors and rate limits
  // 4. Show summary report
}
```

**Implementation Details:**
- Add retry logic for failed sends
- Log all API responses for audit
- Update Response Queue with send status
- Implement rate limit backoff

### Phase 3: UI Updates

#### 3.1 Menu Updates
```javascript
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
      .addItem('📊 Check API Limits', 'checkWeiboApiLimits'))
    .addSeparator()
    .addItem('⚙️ Settings', 'showSettings')
    .addToUi();
}
```

#### 3.2 Sheet Structure Updates

**Users Sheet - Add Columns:**
- `weibo_user_id` (int64)
- `weibo_screen_name` (string)
- `last_sync_date` (datetime)

**Response Queue - Add Columns:**
- `weibo_comment_id` (int64) - ID of posted comment
- `weibo_send_status` (string) - success/failed/pending
- `weibo_error_message` (string) - Error details if failed

### Phase 4: Error Handling & Monitoring

#### 4.1 Rate Limit Management
```javascript
function handleRateLimit(error) {
  // Parse rate limit headers
  // Implement exponential backoff
  // Queue failed requests for retry
  // Alert user if limits exceeded
}
```

#### 4.2 Error Types to Handle
1. **Authentication Errors (401)**
   - Token expired
   - Invalid credentials
   
2. **Rate Limit Errors (429)**
   - Too many requests
   - Daily/hourly limits
   
3. **Content Errors (400)**
   - Comment too long
   - Invalid post ID
   
4. **Network Errors**
   - Timeout
   - Connection failed

### Phase 5: Security Considerations

1. **Credential Storage**
   - Use Script Properties for API keys
   - Never log sensitive data
   - Implement token refresh

2. **User Data Protection**
   - Only sync necessary data
   - Respect user privacy settings
   - Maintain audit logs

3. **Content Validation**
   - Validate comment length (≤140 chars)
   - Check for prohibited content
   - Sanitize user inputs

## Testing Strategy

### Test Cases
1. **OAuth Flow**
   - Initial authorization
   - Token refresh
   - Revoke and re-authorize

2. **Post Syncing**
   - New posts detection
   - Duplicate prevention
   - Large volume handling

3. **Reply Sending**
   - Successful posting
   - Error handling
   - Rate limit respect

### Test Data
- Use test accounts with known post counts
- Create test posts for reply testing
- Monitor API usage during tests

## Rollout Plan

### Phase 1: Development (Week 1)
- Implement OAuth integration
- Basic API calling functions
- Error handling framework

### Phase 2: Testing (Week 2)
- Internal testing with test accounts
- Rate limit calibration
- Bug fixes and optimization

### Phase 3: Limited Release (Week 3)
- Deploy to subset of users
- Monitor API usage
- Gather feedback

### Phase 4: Full Release (Week 4)
- Release to all users
- Documentation updates
- Training materials

## Maintenance Considerations

1. **API Changes**
   - Monitor Weibo API announcements
   - Version checking mechanism
   - Graceful degradation

2. **Rate Limit Monitoring**
   - Daily usage reports
   - Alert thresholds
   - Usage optimization

3. **Error Tracking**
   - Log all API errors
   - Weekly error reports
   - Proactive fixes

## Appendix: Resources

### Official Documentation
- Weibo Open Platform: https://open.weibo.com
- API Documentation: https://open.weibo.com/wiki/API文档/en
- OAuth Guide: https://open.weibo.com/wiki/Oauth/en

### Libraries and Tools
- Google Apps Script OAuth2: https://github.com/googleworkspace/apps-script-oauth2
- API Testing Tools: Postman, curl

### Support Contacts
- Developer Support: weibo_app@vip.sina.com
- Platform Updates: @微博开放平台

---

*Checkpoint 3 Documentation v1.0*
*Last Updated: 2025-01-18*