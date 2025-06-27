# AI Identity Disclosure Effects on Social Media Engagement: A Weibo Experiment

## Research Team

- **Institution**: Peking University (Beijing, China)
- **Advising Professor**: Professor Shen Qiaowei
- **PhD Student**: Han Tianshi  
- **Engineer**: Leo Jiang

## Project Overview

This research project investigates the differential effects of AI identity disclosure on social media user engagement. We examine whether users respond differently to AI accounts that openly declare their artificial nature versus those that roleplay as humans, and whether contextual awareness of users' posting history affects these interactions.

## Research Questions

1. How does AI identity disclosure (declared AI vs. human-roleplay) affect user engagement on social media?
2. Does contextual awareness of users' posting history influence the effectiveness of AI interactions?
3. What are the implications for AI deployment strategies on social media platforms?

## Experimental Design

### Study Structure
- **Total Groups**: 5 (1 control group + 4 experimental groups)
- **Design**: 2×2 factorial design
- **Platform**: Weibo (Chinese microblogging platform)

### Experimental Conditions

| Group | Account Type | Context Awareness | Description |
|-------|-------------|-------------------|-------------|
| Control | None | N/A | No intervention |
| Group 1 | Human-roleplay | Without context | AI acts as human, no user history |
| Group 2 | Human-roleplay | With context | AI acts as human, uses posting history |
| Group 3 | AI-declared | Without context | Openly AI account, no user history |
| Group 4 | AI-declared | With context | Openly AI account, uses posting history |

### Intervention Protocol
- **Frequency**: 2-3 times per week
- **Method**: Reply to users' posts based on experimental condition
- **Duration**: [To be specified]
- **Outcome Measures**: Changes in user posting activity, engagement metrics

## Data Description

### Sample Size
- **Current**: 226 users (as of June 23, 2025)
- **Original**: 234 users
- **Attrition**: 8 users (posts from May 23-31, 2025 no longer accessible)

### Data Files

#### 1. `user_list_20250623.xlsx`
Contains comprehensive user metadata with the following columns:

| Column | Description | Example/Type |
|--------|-------------|--------------|
| user_searched_words | Randomly generated keyword used to find user | "美食" (string) |
| user_name | Weibo username (nickname) | "小明的日常" (string) |
| user_id | Unique Weibo user ID | "1234567890" (string/numeric) |
| user_link | User profile URL | "https://weibo.com/u/1234567890" |
| user_description | User bio/self-description | "爱生活，爱美食" (string, can be empty) |
| user_followings_cnt | Number of accounts user follows | 156 (integer, range: 0-10000+) |
| user_followers_cnt | Number of followers | 2341 (integer, range: 0-1M+) |
| user_gender | Gender (male/female) | "男" or "女" (string) |
| user_location | Registered location | "北京" (string, can be empty) |
| user_register_date | Weibo registration date | "2015-03-20" (date) |
| user_total_cnt_likes_comments_reposts | Total engagement (as of 2025-05-31) | 15234 (integer) |
| user_verified | Verification status (True/False) | False (boolean) |
| user_verified_tag | Verification label (e.g., "Celebrity") | "" (empty if not verified) |
| user_vip_type | VIP membership status | "普通用户" (string) |
| post_count_2025-05-23_to_2025-05-31 | Original posts in sampling period | 3 (integer, range: 1-20) |

#### 2. `posting_history_bf0531.xlsx`
Historical posting data before May 31, 2025, containing:

| Column | Description | Example/Type |
|--------|-------------|--------------|
| user_id | Unique user identifier | "1234567890" (string) |
| post_id | Unique post ID | "4901234567890123" (string) |
| post_link | Public URL to post | "https://weibo.com/1234567890/N1a2b3c4d" |
| post_publish_time | Timestamp (to the second) | "2025-05-15 14:30:25" (datetime) |
| post_content | Text content (including emojis, hashtags) | "今天天气真好！😊 #北京生活#" (string) |
| post_geo | Geographic location (if available) | "北京市朝阳区" (string, often empty) |
| post_likes_cnt | Number of likes | 45 (integer, range: 0-10000+) |
| post_comments_cnt | Number of comments | 12 (integer, range: 0-1000+) |
| post_reposts_cnt | Number of reposts | 3 (integer, range: 0-1000+) |
| post_pic_num | Number of attached images | 2 (integer, range: 0-9) |
| post_pics | List of image URLs | ["https://pic.weibo.com/...", "..."] (list) |
| post_video_url | Video URL (if any) | "https://video.weibo.com/..." (string, often empty) |
| post_topic_names | Hashtags used (e.g., #WinterOlympics#) | ["北京生活", "美食分享"] (list) |
| post_topic_num | Total number of hashtags | 2 (integer, range: 0-10) |
| post_topic_urls | Links to topic pages | ["https://s.weibo.com/...", "..."] (list) |

#### 3. `posting_history_af0531.xlsx`
Recent posting data (May 31 - June 15, 2025) with identical structure to above. This data is specifically collected to test the effectiveness of context-aware commenting prompts.

## Response Generation System

### Objective
Develop an automated system to generate appropriate responses based on experimental conditions.

### Proposed Implementation
- **Platform**: Google Sheets integration (or similar cloud-based solution)
- **Features**:
  - User assignment to experimental groups
  - Automated response generation based on group conditions
  - Context analysis for Groups 2 & 4 (with posting history)
  - Response tracking and logging
  - Engagement metrics monitoring

### Technical Requirements
- API integration with Weibo (if available)
- Natural language processing for context analysis
- Response templates for different experimental conditions
- Monitoring dashboard for intervention tracking

## Ethics and Compliance

### Privacy Protection
- All user data is anonymized
- No personally identifiable information beyond public profile data
- Compliance with Weibo's terms of service

### Research Ethics
- [IRB approval status to be added]
- Informed consent procedures (if applicable)
- Data security measures in place

## Project Timeline

- **Data Collection Phase 1**: Completed (up to June 15, 2025)
- **System Development**: In progress
- **Intervention Phase**: [To be scheduled]
- **Analysis Phase**: [To be scheduled]

## Directory Structure

```
weibo-research-guanghua/
├── README.md
├── data_weibo_0623/
│   ├── ReadMe.txt
│   ├── user_list_20250623.xlsx
│   ├── posting_history_bf0531.xlsx
│   └── posting_history_af0531.xlsx
└── [Future directories for code, analysis, results]
```

## Contact

For questions about this research, please contact:
- Professor Shen Qiaowei: [email]
- Han Tianshi: [email]
- Leo Jiang: [email]

---

*Last updated: June 2025*