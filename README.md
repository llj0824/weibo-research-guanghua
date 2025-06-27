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

| Column | Description |
|--------|-------------|
| user_searched_words | Randomly generated keyword used to find user |
| user_name | Weibo username (nickname) |
| user_id | Unique Weibo user ID |
| user_link | User profile URL |
| user_description | User bio/self-description |
| user_followings_cnt | Number of accounts user follows |
| user_followers_cnt | Number of followers |
| user_gender | Gender (male/female) |
| user_location | Registered location |
| user_register_date | Weibo registration date |
| user_total_cnt_likes_comments_reposts | Total engagement (as of 2025-05-31) |
| user_verified | Verification status (True/False) |
| user_verified_tag | Verification label (e.g., "Celebrity") |
| user_vip_type | VIP membership status |
| post_count_2025-05-23_to_2025-05-31 | Original posts in sampling period |

#### 2. `posting_history_bf0531.xlsx`
Historical posting data before May 31, 2025, containing:

| Column | Description |
|--------|-------------|
| user_id | Unique user identifier |
| post_id | Unique post ID |
| post_link | Public URL to post |
| post_publish_time | Timestamp (to the second) |
| post_content | Text content (including emojis, hashtags) |
| post_geo | Geographic location (if available) |
| post_likes_cnt | Number of likes |
| post_comments_cnt | Number of comments |
| post_reposts_cnt | Number of reposts |
| post_pic_num | Number of attached images |
| post_pics | List of image URLs |
| post_video_url | Video URL (if any) |
| post_topic_names | Hashtags used (e.g., #WinterOlympics#) |
| post_topic_num | Total number of hashtags |
| post_topic_urls | Links to topic pages |

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

## Next Steps

1. Finalize response generation system architecture
2. Develop and test AI response prompts for each experimental condition
3. Implement randomization protocol for group assignment
4. Create monitoring dashboard for tracking interventions
5. Establish data collection pipeline for outcome measures

## Contact

For questions about this research, please contact:
- Professor Shen Qiaowei: [email]
- Han Tianshi: [email]
- Leo Jiang: [email]

---

*Last updated: June 2025*