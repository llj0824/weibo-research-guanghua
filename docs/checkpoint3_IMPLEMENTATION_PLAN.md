# Plan for Automatic Weibo Posting

This document outlines the implementation plan for integrating the Weibo API to automatically post queued responses from the Google Sheet.

## Phase 1: Authentication Setup

Before we can interact with the Weibo API, we need to handle authentication. This involves setting up OAuth 2.0 within the Google Apps Script environment.

1.  **Add OAuth2 Library**: Add Google's recommended OAuth2 library to the Apps Script project. This simplifies the authentication flow.
2.  **Store Credentials Securely**: Store the `WEIBO_APP_KEY` and `WEIBO_APP_SECRET` securely in the Script Properties, not in the code itself.
3.  **Create Authorization Flow**: Implement the functions required for the OAuth2 flow, including:
    *   A function to initiate the authorization process.
    *   A callback function to handle the response from Weibo after the user grants permission.
    *   A menu item in the Google Sheet (`🌐 Weibo Integration -> 🔐 Authorize Weibo Access`) so the user can authorize the script to access their Weibo account.

## Phase 2: Implementing the Posting Logic

Once authentication is handled, we will implement the core logic for sending the comments.

1.  **New Function: `sendApprovedRepliesToWeibo()`**: Create a new function with this name in `AppScript.js`. Its job will be to:
    *   Scan the `Response Queue` sheet for any rows where the `approved` column is set to "YES" and the `sent_date` column is empty.
    *   For each of these rows, it will call the Weibo API endpoint `comments/create.json`.
    *   It will use the `access_token` from the OAuth flow, the `comment` from the `final_response` column, and the `id` from the `triggering_post_id` column.

2.  **Update the `Response Queue` Sheet**: After attempting to post a comment, the script will update the sheet:
    *   If successful, it will fill in the current date in the `sent_date` column and add the new `weibo_comment_id` returned by the API.
    *   If it fails, it will log the reason in a new `weibo_error_message` column.

3.  **Add a Menu Button**: Add a new button to the custom menu: `🌐 Weibo Integration -> 📤 Send Approved Replies`. Clicking this will run the `sendApprovedRepliesToWeibo()` function.

4.  **Rate Limiting and Error Handling**: Build in basic error handling. The script will stop if it hits a rate limit and will log other errors (like an invalid post ID) in the sheet so they can be reviewed manually.
