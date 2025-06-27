# Google Sheets + Deepseek API Implementation Guide

## Workflow Overview (What Han Tianshi Will See)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Weibo AI Experiment - Response System            │
├─────────────────────────────────────────────────────────────────────┤
│ 🤖 Response System ▼                                                │
│  ├─ 📝 Generate Responses for Selected Users                       │
│  ├─ 🔄 Generate All Pending Responses                              │
│  ├─ ✅ Approve All Responses                                       │
│  └─ 📊 Update Analytics                                            │
└─────────────────────────────────────────────────────────────────────┘

Tab 1: Users (226 users divided into 4 groups)
┌────────────┬─────────────┬────────┬─────────────────────────────────┐
│  user_id   │  user_name  │ group  │    user_link    │ followers  │
├────────────┼─────────────┼────────┼─────────────────────────────────┤
│ 1234567890 │ 小明的日常   │ Group1 │ weibo.com/...   │    2,341   │
│ 2345678901 │ 美食爱好者   │ Group1 │ weibo.com/...   │    5,123   │
│    ...     │     ...     │  ...   │      ...        │     ...    │
│ [Row 57]   │     ...     │ Group1 │      ...        │     ...    │
│ [Row 58]   │     ...     │ Group2 │      ...        │     ...    │
│    ...     │     ...     │  ...   │      ...        │     ...    │
└────────────┴─────────────┴────────┴─────────────────────────────────┘

Tab 2: Prompts (EDITABLE BY HAN TIANSHI)
┌────────┬──────────────────────────────────────────────────────────┐
│ group  │                    prompt_template                        │
├────────┼──────────────────────────────────────────────────────────┤
│ Group1 │ You are a friendly Weibo user. Reply to: {post_content} │
│ Group2 │ You know their interests in {user_topics}. Reply to...  │
│ Group3 │ I am an AI assistant. I'd like to respond to...         │
│ Group4 │ I am an AI. I've noticed you post about {user_topics}...│
└────────┴──────────────────────────────────────────────────────────┘
         ↑ Han Tianshi can edit these prompts anytime!

Tab 3: Response Queue (After clicking "Generate Responses")
┌────────────┬────────────┬─────────────────────┬──────────┬─────────┐
│ timestamp  │ user_name  │   post_content      │ response │ approved│
├────────────┼────────────┼─────────────────────┼──────────┼─────────┤
│ 2025-06-27 │ 小明的日常  │ 今天天气真好！🌞      │ 天气确实..│   NO    │
│ 2025-06-27 │ 美食爱好者  │ 刚做了红烧肉，香！    │ 看起来... │   NO    │
└────────────┴────────────┴─────────────────────┴──────────┴─────────┘
                                                              ↑ Change to YES/NO/EDIT

Daily Workflow:
1. Click "🔄 Generate All Pending Responses"
2. Review responses in Response Queue
3. Change "approved" to YES for good responses
4. Click "📊 Update Analytics" to see progress
```

## Overview

This guide provides step-by-step instructions for building a response generation system using Google Sheets and Deepseek API. The system will handle all 226 users across 4 experimental groups with editable prompts.

## Phase 1: MVP (Days 1-3)

### Goal
Create a functional system that can generate responses for all 226 users with editable prompts that Han Tianshi can modify.

### Step 1: Create Google Sheets Structure

#### 1.1 Create New Google Sheet
1. Go to sheets.google.com (use VPN if needed)
2. Create new spreadsheet named: "Weibo AI Experiment - Response System"
3. Create the following sheets (tabs):

#### 1.2 Sheet 1: "Users" Tab
Create columns:
```
A: user_id
B: user_name
C: group (Control, Group1, Group2, Group3, Group4)
D: user_link
E: user_description
F: user_followers_cnt
G: last_response_date
H: response_count
I: status (active/inactive)

user_id	user_name	group	user_link	user_description	user_followers_cnt	last_response_date	response_count	status
```

Import all 226 users from `user_list_20250623.xlsx` and assign to groups sequentially:
- Group1: Rows 2-57 (56 users)
- Group2: Rows 58-113 (56 users)
- Group3: Rows 114-170 (57 users)
- Group4: Rows 171-227 (57 users)

#### 1.3 Sheet 2: "Prompts" Tab
Create editable prompt templates:
```
A: group_name
B: prompt_template
C: system_prompt
D: last_updated
E: notes
```

Initial prompts: 
Note to self: i'll use gpt 4.5 or deepseek to make these prompts in chinese.
```
Row 2: Group1 | Human-roleplay, no context
"You are a friendly Weibo user. Reply to this post naturally: {post_content}"

Row 3: Group2 | Human-roleplay, with context
"You are a friendly Weibo user who has read this person's previous posts. Based on their interests in {user_topics}, reply to: {post_content}"

Row 4: Group3 | AI-declared, no context
"I am an AI assistant. I'd like to respond to your post: {post_content}"

Row 5: Group4 | AI-declared, with context
"I am an AI assistant. I've noticed you often post about {user_topics}. Regarding your post: {post_content}"
```

#### 1.4 Sheet 3: "Response Queue" Tab
Columns:
```
A: timestamp
B: user_id
C: user_name
D: group
E: post_id
F: post_content
G: generated_response
H: approved (YES/NO/EDIT)
I: final_response
J: sent_date
K: prompt_used
```

#### 1.5 Sheet 4: "Analytics" Tab
Summary statistics (will auto-calculate):
- Total responses generated
- Responses by group
- Approval rate
- Average response time

### Step 2: Set Up Deepseek API Integration

#### 2.1 Get Deepseek API Key
1. Go to platform.deepseek.com
2. Register account (may need VPN)
3. Get API key from dashboard
4. Note the API endpoint: `https://api.deepseek.com/v1/chat/completions`

#### 2.2 Add API Key to Google Sheets
1. In Google Sheets, go to Extensions → Apps Script
2. Click on Project Settings (gear icon)
3. Add Script Property:
   - Property: `DEEPSEEK_API_KEY`
   - Value: `your-api-key-here`

### Step 3: Create Apps Script Code
@AppScript.js

#### 3.2 Create Settings HTML
Create new HTML file in Apps Script (File → New → HTML) named "Settings":
@AppScript.html

### Step 4: Initial Setup & Testing

#### 4.1 Import User Data and Assign Groups

**Step 1: Copy Column Headers (paste in row 1)**
```
user_id	user_name	group	user_link	user_description	user_followers_cnt	last_response_date	response_count	status
```

**Step 2: Import User Data**
1. Open `user_list_20250623.xlsx` in Excel
2. Select and copy these columns:
   - Column C (user_id)
   - Column B (user_name)
   - Column D (user_link)
   - Column E (user_description)
   - Column G (user_followers_cnt)
3. In Google Sheets, click cell A2 and paste

**Step 3: Assign Groups Sequentially**
In column C (group), starting from C2:
- Type "Group1" in C2
- Select C2:C57 and press Ctrl+D to fill down (56 users)
- Type "Group2" in C58
- Select C58:C113 and press Ctrl+D to fill down (56 users)
- Type "Group3" in C114
- Select C114:C170 and press Ctrl+D to fill down (57 users)
- Type "Group4" in C171
- Select C171:C227 and press Ctrl+D to fill down (57 users)

**Step 4: Add Default Values**
- Column H (response_count): Type "0" in H2, select H2:H227, press Ctrl+D
- Column I (status): Type "active" in I2, select I2:I227, press Ctrl+D

#### 4.2 Test Response Generation
1. Select 5-10 users in Users sheet
2. Click menu: "🤖 Response System" → "📝 Generate Responses for Selected Users"
3. Check "Response Queue" sheet for generated responses
4. Review quality and adjust prompts as needed

#### 4.3 Approval Workflow
1. In "Response Queue" sheet, review generated responses
2. Change "approved" column to:
   - YES: Response is good
   - NO: Don't send
   - EDIT: Need to modify (then edit "final_response" column)

### Step 5: Handoff to Han Tianshi

#### 5.1 Quick Training (30 minutes)
1. Show how to edit prompts in "Prompts" sheet
2. Demonstrate response generation
3. Explain approval process
4. Show analytics dashboard

#### 5.2 Daily Workflow for Han Tianshi
1. Open Google Sheet
2. Review and edit prompts if needed
3. Click "Generate All Pending Responses"
4. Review and approve responses
5. Track progress in Analytics

## Phase 2: Enhanced Features (Week 2)

### Features to Add:
1. **Automatic Post Fetching**
   - Connect to Weibo API or use export
   - Fetch recent posts for each user
   - Generate responses for actual posts

2. **Context Analysis**
   - Analyze user's posting history
   - Extract topics and interests
   - Use in Group 2 & 4 prompts

3. **Batch Operations**
   - Generate responses for all users at once
   - Bulk approval options
   - Export approved responses

4. **Response Variations**
   - Multiple prompt templates per group
   - A/B testing different approaches
   - Track which prompts work best

## Phase 3: Full Automation (Weeks 3-4)

### Features to Add:
1. **Scheduled Generation**
   - Automatic triggers 3x per week
   - Email notifications when ready for review
   - Auto-save backups

2. **Weibo Integration**
   - Direct posting via API (if available)
   - Track engagement metrics
   - Import response data back

3. **Advanced Analytics**
   - Response quality metrics
   - Engagement tracking
   - Group comparison charts
   - Export reports

4. **Error Handling**
   - Retry failed API calls
   - Log all errors
   - Fallback options
   - Alert system

## Troubleshooting

### Common Issues:

1. **Deepseek API Errors**
   - Check API key is correct
   - Verify VPN is working
   - Check API quota/credits

2. **Google Sheets Limits**
   - Apps Script has 6-minute execution limit
   - Process in batches if needed
   - Use time-based triggers for long operations

3. **Response Quality Issues**
   - Adjust temperature parameter
   - Refine prompts
   - Add more context to system prompts
   - Test with different models

### Support Resources:
- Deepseek API Docs: platform.deepseek.com/docs
- Google Apps Script: developers.google.com/apps-script
- Contact Leo for technical issues

---

*Implementation Guide v1.0*
*Last Updated: June 2025*