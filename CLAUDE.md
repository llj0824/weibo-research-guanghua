# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an academic research project studying AI identity disclosure effects on social media engagement on Weibo. The project uses Google Apps Script integrated with Google Sheets as the control panel, with DeepSeek AI API for response generation.

## Architecture

```
Google Sheets (UI & Database)
    ↓
Google Apps Script (Business Logic)
    ↓
DeepSeek AI API (Response Generation)
```

## Key Files

- **AppScript_v2.js**: Main Google Apps Script containing all business logic
- **AppScript.html**: Settings UI for Google Sheets
- **data_weibo_0623/**: Research data with user lists and posting history

## Development Workflow

### Setup and Deployment
Since this is a Google Apps Script project, there are no traditional build commands. Instead:

1. **Create Google Sheet** with required tabs:
   - Users (226 users assigned to 4 groups)
   - Prompts (editable prompt templates)
   - Response Queue (generated responses)
   - Posts (real Weibo posts)

2. **Deploy Script**:
   - Open Google Apps Script editor from Sheet (Extensions → Apps Script)
   - Copy code from `AppScript_v2.js`
   - Add API key to Script Properties: `DEEPSEEK_API_KEY`

3. **Test Functions**:
   - Use `onOpen()` to create custom menu
   - Test with `generateResponsesForSelected()`
   - Check logs with `View → Logs` in Apps Script editor

### Key Functions

- `onOpen()`: Creates custom menu in Google Sheets
- `generateResponsesForSelected()`: Main workflow for generating AI responses
- `getPostForUser(userId)`: Fetches real Weibo posts for users
- `callDeepseekAPI(messages)`: Handles AI API integration
- `writeToResponseQueue()`: Logs responses for review

### Debugging

Since there's no traditional development environment:
- Use `console.log()` for debugging (visible in Apps Script logs)
- Use `SpreadsheetApp.getUi().alert()` for user feedback
- Test with small user selections first

## Research Design Context

The project implements a 2×2 factorial design with 5 groups:
- **Control**: No intervention
- **Group 1**: AI as human, without context
- **Group 2**: AI as human, with user history
- **Group 3**: AI declared, without context
- **Group 4**: AI declared, with user history

## Important Considerations

1. **Data Privacy**: All user data is from public profiles. Maintain anonymization standards.

2. **API Rate Limits**: DeepSeek API has rate limits. Process users in batches if needed.

3. **Sheet Performance**: Google Sheets can slow down with large datasets. Keep Response Queue under 10,000 rows.

4. **Error Handling**: Always wrap API calls in try-catch blocks. Show user-friendly error messages.

5. **Testing**: No formal testing framework. Test manually through Sheet UI before processing all users.

## Common Tasks

### Adding New Prompt Templates
Edit the Prompts sheet directly. Available variables:
- `{post_content}`: The actual post text
- `{user_topics}`: User's historical topics (Groups 2 & 4 only)
- `{user_name}`: User's display name

### Processing Users
1. Select users in Users sheet
2. Click menu: 🤖 Response System → 📝 Generate Responses
3. Review in Response Queue sheet
4. Change approval status as needed

### Monitoring Progress
Check Analytics sheet for:
- Total responses generated
- Approval rates by group
- Response frequency tracking