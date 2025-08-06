const axios = require('axios');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  DEEPSEEK_API_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
  WEIBO_API_BASE: 'https://api.weibo.com/2',
  FEISHU_APP_ID: process.env.FEISHU_APP_ID,
  FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  WEIBO_ACCESS_TOKEN: process.env.WEIBO_ACCESS_TOKEN,
  MODEL: 'deepseek-chat',
  TEMPERATURE: 0.7
};

// Research Groups Configuration
const GROUPS = {
  control: { id: 0, name: 'Control', promptType: 'none' },
  group1: { id: 1, name: 'AI as Human - No Context', promptType: 'human_no_context' },
  group2: { id: 2, name: 'AI as Human - With History', promptType: 'human_with_context' },
  group3: { id: 3, name: 'AI Declared - No Context', promptType: 'ai_no_context' },
  group4: { id: 4, name: 'AI Declared - With History', promptType: 'ai_with_context' }
};

/**
 * Main handler for Feishu webhook events
 */
exports.main_handler = async (event, context) => {
  try {
    const eventData = JSON.parse(event.body);
    
    // Handle different event types
    switch (eventData.type) {
      case 'url_verification':
        return handleUrlVerification(eventData);
      
      case 'event_callback':
        return await handleEventCallback(eventData);
      
      default:
        return { success: true };
    }
  } catch (error) {
    console.error('Handler error:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  }
};

/**
 * Handle Feishu URL verification
 */
function handleUrlVerification(data) {
  return {
    challenge: data.challenge
  };
}

/**
 * Handle Feishu event callbacks
 */
async function handleEventCallback(data) {
  const event = data.event;
  
  if (event.type === 'message' && event.message_type === 'text') {
    const command = JSON.parse(event.content).text;
    
    if (command.startsWith('/generate')) {
      return await handleGenerateCommand(event);
    } else if (command.startsWith('/post')) {
      return await handlePostCommand(event);
    } else if (command.startsWith('/status')) {
      return await handleStatusCommand(event);
    }
  }
  
  return { success: true };
}

/**
 * Generate AI responses for selected users
 */
async function handleGenerateCommand(event) {
  try {
    // Parse command parameters
    const params = parseCommandParams(event.content);
    const userIds = params.users || [];
    const groupId = params.group || 1;
    
    const results = [];
    
    for (const userId of userIds) {
      try {
        // Get user's recent posts from Weibo
        const posts = await fetchWeiboUserPosts(userId);
        
        // Select a triggering post
        const triggerPost = selectTriggerPost(posts);
        
        // Get user's posting history for context (Groups 2 & 4)
        const userContext = [2, 4].includes(groupId) ? 
          await analyzeUserHistory(userId, posts) : null;
        
        // Generate AI response
        const response = await generateAIResponse({
          groupId,
          post: triggerPost,
          userContext,
          userId
        });
        
        // Store in Feishu sheet
        await storeResponseInSheet({
          userId,
          groupId,
          postId: triggerPost.id,
          postContent: triggerPost.text,
          response: response.content,
          timestamp: new Date().toISOString(),
          approved: false
        });
        
        results.push({
          userId,
          success: true,
          responseId: response.id
        });
        
      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
        results.push({
          userId,
          success: false,
          error: userError.message
        });
      }
    }
    
    // Send summary message
    await sendFeishuMessage(event.sender.sender_id.user_id, 
      formatGenerationResults(results));
    
    return { success: true, results };
    
  } catch (error) {
    console.error('Generate command error:', error);
    await sendFeishuMessage(event.sender.sender_id.user_id, 
      `生成失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch user's recent posts from Weibo API
 */
async function fetchWeiboUserPosts(userId) {
  try {
    const response = await axios.get(`${CONFIG.WEIBO_API_BASE}/statuses/user_timeline.json`, {
      params: {
        access_token: CONFIG.WEIBO_ACCESS_TOKEN,
        uid: userId,
        count: 50,
        page: 1
      }
    });
    
    return response.data.statuses.map(post => ({
      id: post.id,
      text: post.text,
      created_at: post.created_at,
      reposts_count: post.reposts_count,
      comments_count: post.comments_count,
      attitudes_count: post.attitudes_count
    }));
  } catch (error) {
    console.error('Weibo API error:', error.response?.data || error);
    // Fallback to cached data if API fails
    return await getCachedUserPosts(userId);
  }
}

/**
 * Select a triggering post based on engagement and recency
 */
function selectTriggerPost(posts) {
  if (!posts || posts.length === 0) {
    throw new Error('No posts available for user');
  }
  
  // Sort by publish time (most recent first)
  const sortedPosts = posts.sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  // Get posts from last 7 days
  const recentPosts = sortedPosts.filter(post => {
    const postDate = new Date(post.created_at);
    const daysSince = (Date.now() - postDate) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });
  
  // If no recent posts, use most recent overall
  const candidatePosts = recentPosts.length > 0 ? recentPosts : sortedPosts.slice(0, 5);
  
  // Select post with highest engagement
  return candidatePosts.reduce((best, post) => {
    const engagement = post.reposts_count + post.comments_count + post.attitudes_count;
    const bestEngagement = best.reposts_count + best.comments_count + best.attitudes_count;
    return engagement > bestEngagement ? post : best;
  }, candidatePosts[0]);
}

/**
 * Analyze user's posting history for context
 */
async function analyzeUserHistory(userId, posts) {
  const recentPosts = posts.slice(0, 20);
  
  // Extract topics and themes
  const topics = new Set();
  const themes = [];
  
  for (const post of recentPosts) {
    // Extract hashtags
    const hashtags = post.text.match(/#[^\s#]+/g) || [];
    hashtags.forEach(tag => topics.add(tag));
    
    // Extract key themes (simplified version)
    if (post.text.includes('科技') || post.text.includes('AI')) themes.push('technology');
    if (post.text.includes('生活') || post.text.includes('日常')) themes.push('lifestyle');
    if (post.text.includes('工作') || post.text.includes('职场')) themes.push('career');
  }
  
  return {
    topics: Array.from(topics).slice(0, 10),
    themes: [...new Set(themes)],
    postingFrequency: calculatePostingFrequency(posts),
    averageLength: calculateAverageLength(posts)
  };
}

/**
 * Generate AI response using DeepSeek
 */
async function generateAIResponse({ groupId, post, userContext, userId }) {
  const prompt = buildPrompt(groupId, post, userContext);
  
  try {
    const response = await axios.post(
      CONFIG.DEEPSEEK_API_ENDPOINT,
      {
        model: CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(groupId)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: CONFIG.TEMPERATURE,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      id: generateResponseId(),
      content: response.data.choices[0].message.content,
      model: CONFIG.MODEL,
      groupId,
      userId
    };
  } catch (error) {
    console.error('DeepSeek API error:', error.response?.data || error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Build prompt based on group configuration
 */
function buildPrompt(groupId, post, userContext) {
  const groupConfig = Object.values(GROUPS).find(g => g.id === groupId);
  
  let prompt = `请对以下微博内容生成一个回复：\n\n"${post.text}"\n\n`;
  
  // Add context for groups 2 & 4
  if (userContext && [2, 4].includes(groupId)) {
    prompt += `用户历史话题: ${userContext.topics.join(', ')}\n`;
    prompt += `用户关注领域: ${userContext.themes.join(', ')}\n\n`;
  }
  
  // Add identity disclosure for groups 3 & 4
  if ([3, 4].includes(groupId)) {
    prompt += '请在回复中自然地表明你是AI助手，但保持友好和有帮助的语气。\n';
  } else {
    prompt += '请以普通用户的身份回复，语气自然、真实。\n';
  }
  
  prompt += '回复要求：\n';
  prompt += '- 长度控制在50-150字\n';
  prompt += '- 与原帖内容相关\n';
  prompt += '- 提供有价值的观点或信息\n';
  prompt += '- 保持礼貌和积极的语气\n';
  
  return prompt;
}

/**
 * Get system prompt based on group
 */
function getSystemPrompt(groupId) {
  if ([1, 2].includes(groupId)) {
    return '你是一个微博用户，正在浏览并回复其他用户的内容。请以真实、自然的方式互动。';
  } else if ([3, 4].includes(groupId)) {
    return '你是一个AI助手，在微博上帮助用户并提供有价值的回复。请诚实地表明你的AI身份，同时保持友好和有帮助。';
  }
  return '你是一个微博回复生成助手。';
}

/**
 * Store response in Feishu sheet
 */
async function storeResponseInSheet(data) {
  // This would integrate with Feishu Sheet API
  // For now, using a simplified storage approach
  console.log('Storing response:', data);
  
  // TODO: Implement Feishu Sheet API integration
  // const sheet = await getFeishuSheet(SHEET_ID);
  // await sheet.appendRow(data);
}

/**
 * Post approved responses to Weibo
 */
async function handlePostCommand(event) {
  try {
    const params = parseCommandParams(event.content);
    const responseIds = params.responses || [];
    
    const results = [];
    
    for (const responseId of responseIds) {
      try {
        // Get response from storage
        const response = await getStoredResponse(responseId);
        
        if (!response.approved) {
          results.push({
            responseId,
            success: false,
            error: 'Response not approved'
          });
          continue;
        }
        
        // Post to Weibo
        const weiboResult = await postToWeibo({
          content: response.content,
          replyToId: response.postId
        });
        
        // Update status
        await updateResponseStatus(responseId, 'posted', weiboResult.id);
        
        results.push({
          responseId,
          success: true,
          weiboId: weiboResult.id
        });
        
      } catch (error) {
        console.error(`Error posting response ${responseId}:`, error);
        results.push({
          responseId,
          success: false,
          error: error.message
        });
      }
    }
    
    await sendFeishuMessage(event.sender.sender_id.user_id, 
      formatPostingResults(results));
    
    return { success: true, results };
    
  } catch (error) {
    console.error('Post command error:', error);
    await sendFeishuMessage(event.sender.sender_id.user_id, 
      `发布失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Post content to Weibo
 */
async function postToWeibo({ content, replyToId }) {
  try {
    const endpoint = replyToId ? 
      `${CONFIG.WEIBO_API_BASE}/comments/create.json` :
      `${CONFIG.WEIBO_API_BASE}/statuses/update.json`;
    
    const params = {
      access_token: CONFIG.WEIBO_ACCESS_TOKEN,
      comment: content
    };
    
    if (replyToId) {
      params.id = replyToId;
    }
    
    const response = await axios.post(endpoint, null, { params });
    
    return {
      id: response.data.id,
      created_at: response.data.created_at
    };
  } catch (error) {
    console.error('Weibo posting error:', error.response?.data || error);
    throw new Error(`Failed to post to Weibo: ${error.message}`);
  }
}

/**
 * Helper functions
 */

function parseCommandParams(content) {
  const text = JSON.parse(content).text;
  const params = {};
  
  const parts = text.split(' ');
  for (let i = 1; i < parts.length; i++) {
    const [key, value] = parts[i].split('=');
    if (key && value) {
      params[key] = value.includes(',') ? value.split(',') : value;
    }
  }
  
  return params;
}

function generateResponseId() {
  return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculatePostingFrequency(posts) {
  if (posts.length < 2) return 'low';
  
  const dates = posts.map(p => new Date(p.created_at));
  const daysBetween = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
  const postsPerDay = posts.length / daysBetween;
  
  if (postsPerDay > 1) return 'high';
  if (postsPerDay > 0.3) return 'medium';
  return 'low';
}

function calculateAverageLength(posts) {
  const lengths = posts.map(p => p.text.length);
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

async function getCachedUserPosts(userId) {
  // Implement cache retrieval logic
  console.log(`Getting cached posts for user ${userId}`);
  return [];
}

async function getStoredResponse(responseId) {
  // Implement response retrieval from storage
  console.log(`Getting stored response ${responseId}`);
  return {};
}

async function updateResponseStatus(responseId, status, weiboId) {
  // Implement status update logic
  console.log(`Updating response ${responseId} status to ${status}`);
}

async function sendFeishuMessage(userId, text) {
  // Implement Feishu message sending
  console.log(`Sending message to ${userId}: ${text}`);
}

function formatGenerationResults(results) {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  let message = `生成完成！\n✅ 成功: ${successful}\n❌ 失败: ${failed}`;
  
  if (failed > 0) {
    message += '\n\n失败详情:';
    results.filter(r => !r.success).forEach(r => {
      message += `\n- 用户 ${r.userId}: ${r.error}`;
    });
  }
  
  return message;
}

function formatPostingResults(results) {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  let message = `发布完成！\n✅ 成功: ${successful}\n❌ 失败: ${failed}`;
  
  if (successful > 0) {
    message += '\n\n成功发布:';
    results.filter(r => r.success).forEach(r => {
      message += `\n- 回复 ${r.responseId} → 微博 ${r.weiboId}`;
    });
  }
  
  return message;
}