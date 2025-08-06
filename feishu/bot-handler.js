const axios = require('axios');

/**
 * Feishu Bot Handler for Weibo Research
 * Handles interactive commands and sheet operations
 */
class FeishuBotHandler {
  constructor(config) {
    this.config = config;
    this.feishuBaseUrl = 'https://open.feishu.cn/open-apis';
    this.tenantAccessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Initialize bot and get tenant access token
   */
  async initialize() {
    await this.getTenantAccessToken();
    setInterval(() => this.refreshTokenIfNeeded(), 30 * 60 * 1000); // Check every 30 minutes
  }

  /**
   * Get tenant access token
   */
  async getTenantAccessToken() {
    try {
      const response = await axios.post(
        `${this.feishuBaseUrl}/auth/v3/tenant_access_token/internal`,
        {
          app_id: this.config.FEISHU_APP_ID,
          app_secret: this.config.FEISHU_APP_SECRET
        }
      );

      this.tenantAccessToken = response.data.tenant_access_token;
      this.tokenExpiry = Date.now() + (response.data.expire - 300) * 1000; // Refresh 5 minutes early
      
      console.log('Tenant access token obtained successfully');
    } catch (error) {
      console.error('Failed to get tenant access token:', error);
      throw error;
    }
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded() {
    if (!this.tokenExpiry || Date.now() > this.tokenExpiry) {
      await this.getTenantAccessToken();
    }
  }

  /**
   * Handle bot commands
   */
  async handleCommand(command, params, userId) {
    await this.refreshTokenIfNeeded();

    switch (command) {
      case '/help':
        return await this.showHelp(userId);
      
      case '/status':
        return await this.showStatus(userId);
      
      case '/generate':
        return await this.generateResponses(params, userId);
      
      case '/approve':
        return await this.approveResponses(params, userId);
      
      case '/post':
        return await this.postToWeibo(params, userId);
      
      case '/sheet':
        return await this.getSheetLink(params, userId);
      
      case '/analytics':
        return await this.showAnalytics(params, userId);
      
      default:
        return await this.sendMessage(userId, '未知命令。输入 /help 查看可用命令。');
    }
  }

  /**
   * Show help message
   */
  async showHelp(userId) {
    const helpText = `
🤖 **微博研究助手命令列表**

**基础命令:**
• \`/help\` - 显示帮助信息
• \`/status\` - 查看系统状态

**生成回复:**
• \`/generate users=<user_ids> group=<group_id>\` - 为指定用户生成回复
  示例: \`/generate users=123456,789012 group=2\`

**审核管理:**
• \`/approve ids=<response_ids>\` - 批准指定回复
• \`/approve all\` - 批准所有待审核回复
• \`/approve group=<group_id>\` - 批准指定组的所有回复

**发布管理:**
• \`/post approved\` - 发布所有已批准的回复
• \`/post ids=<response_ids>\` - 发布指定回复

**数据查看:**
• \`/sheet <sheet_name>\` - 获取表格链接
  可用表格: users, prompts, response_queue, posts, analytics
• \`/analytics [today|week|month]\` - 查看数据统计

**批量操作:**
• \`/generate batch\` - 批量生成（从待处理队列）
• \`/post batch limit=<n>\` - 批量发布（限制数量）

**实验组说明:**
- Group 0: 对照组
- Group 1: AI扮演人类（无历史）
- Group 2: AI扮演人类（有历史）
- Group 3: AI声明身份（无历史）
- Group 4: AI声明身份（有历史）
`;

    return await this.sendRichMessage(userId, helpText);
  }

  /**
   * Show system status
   */
  async showStatus(userId) {
    try {
      const stats = await this.getSystemStats();
      
      const statusMessage = `
📊 **系统状态**

**API状态:**
• DeepSeek API: ${stats.deepseekStatus ? '✅ 正常' : '❌ 异常'}
• 微博 API: ${stats.weiboStatus ? '✅ 正常' : '❌ 异常'}
• 飞书 API: ✅ 正常

**今日统计:**
• 生成回复: ${stats.todayGenerated} 条
• 已批准: ${stats.todayApproved} 条
• 已发布: ${stats.todayPosted} 条
• API调用: ${stats.todayApiCalls} 次

**队列状态:**
• 待审核: ${stats.pendingApproval} 条
• 待发布: ${stats.pendingPost} 条
• 发布失败: ${stats.failedPosts} 条

**用户统计:**
• 活跃用户: ${stats.activeUsers} 人
• 总用户: ${stats.totalUsers} 人

**成本统计:**
• 今日成本: ¥${stats.todayCost.toFixed(2)}
• 本月成本: ¥${stats.monthCost.toFixed(2)}

最后更新: ${new Date().toLocaleString('zh-CN')}
`;

      return await this.sendRichMessage(userId, statusMessage);
    } catch (error) {
      console.error('Error getting system status:', error);
      return await this.sendMessage(userId, '获取系统状态失败: ' + error.message);
    }
  }

  /**
   * Generate responses for users
   */
  async generateResponses(params, userId) {
    try {
      const userIds = params.users ? params.users.split(',') : [];
      const groupId = params.group ? parseInt(params.group) : null;
      
      if (userIds.length === 0 && !params.batch) {
        return await this.sendMessage(userId, '请指定用户ID或使用 batch 参数');
      }
      
      await this.sendMessage(userId, `开始生成回复... 🔄`);
      
      // Call the cloud function to generate responses
      const result = await this.callCloudFunction('generate', {
        userIds,
        groupId,
        batch: params.batch === 'true'
      });
      
      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;
      
      let message = `
✅ **生成完成**

• 成功: ${successCount} 条
• 失败: ${failCount} 条
`;
      
      if (failCount > 0) {
        message += '\n**失败详情:**\n';
        result.results.filter(r => !r.success).forEach(r => {
          message += `• 用户 ${r.userId}: ${r.error}\n`;
        });
      }
      
      message += `\n[查看回复队列](${await this.getSheetUrl('response_queue')})`;
      
      return await this.sendRichMessage(userId, message);
    } catch (error) {
      console.error('Error generating responses:', error);
      return await this.sendMessage(userId, '生成失败: ' + error.message);
    }
  }

  /**
   * Approve responses
   */
  async approveResponses(params, userId) {
    try {
      let responseIds = [];
      
      if (params.all) {
        // Get all pending responses
        const pending = await this.getPendingResponses();
        responseIds = pending.map(r => r.response_id);
      } else if (params.group) {
        // Get pending responses for specific group
        const pending = await this.getPendingResponses({ groupId: params.group });
        responseIds = pending.map(r => r.response_id);
      } else if (params.ids) {
        responseIds = params.ids.split(',');
      } else {
        return await this.sendMessage(userId, '请指定要批准的回复ID');
      }
      
      if (responseIds.length === 0) {
        return await this.sendMessage(userId, '没有待批准的回复');
      }
      
      // Update approval status in sheet
      const results = await this.updateApprovalStatus(responseIds, 'approved');
      
      return await this.sendRichMessage(userId, `
✅ **批准完成**

已批准 ${results.success} 条回复

[查看回复队列](${await this.getSheetUrl('response_queue')})
`);
    } catch (error) {
      console.error('Error approving responses:', error);
      return await this.sendMessage(userId, '批准失败: ' + error.message);
    }
  }

  /**
   * Post to Weibo
   */
  async postToWeibo(params, userId) {
    try {
      let responseIds = [];
      
      if (params.approved) {
        // Get all approved but not posted responses
        const approved = await this.getApprovedResponses();
        responseIds = approved.map(r => r.response_id);
      } else if (params.ids) {
        responseIds = params.ids.split(',');
      } else if (params.batch) {
        const limit = params.limit ? parseInt(params.limit) : 10;
        const approved = await this.getApprovedResponses({ limit });
        responseIds = approved.map(r => r.response_id);
      } else {
        return await this.sendMessage(userId, '请指定要发布的回复');
      }
      
      if (responseIds.length === 0) {
        return await this.sendMessage(userId, '没有待发布的回复');
      }
      
      await this.sendMessage(userId, `开始发布 ${responseIds.length} 条回复... 🚀`);
      
      // Call cloud function to post
      const result = await this.callCloudFunction('post', { responseIds });
      
      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;
      
      return await this.sendRichMessage(userId, `
✅ **发布完成**

• 成功: ${successCount} 条
• 失败: ${failCount} 条

[查看详情](${await this.getSheetUrl('response_queue')})
`);
    } catch (error) {
      console.error('Error posting to Weibo:', error);
      return await this.sendMessage(userId, '发布失败: ' + error.message);
    }
  }

  /**
   * Show analytics
   */
  async showAnalytics(params, userId) {
    try {
      const period = params[0] || 'today';
      const analytics = await this.getAnalytics(period);
      
      let message = `📈 **数据分析 - ${this.getPeriodLabel(period)}**\n\n`;
      
      // Group statistics
      message += '**各组表现:**\n';
      for (const group of analytics.groups) {
        message += `• Group ${group.id}: 生成 ${group.generated} | 批准 ${group.approved} | 发布 ${group.posted}\n`;
      }
      
      // Engagement metrics
      message += '\n**互动指标:**\n';
      message += `• 平均回复长度: ${analytics.avgResponseLength} 字\n`;
      message += `• 批准率: ${(analytics.approvalRate * 100).toFixed(1)}%\n`;
      message += `• 发布成功率: ${(analytics.postSuccessRate * 100).toFixed(1)}%\n`;
      
      // Cost analysis
      message += '\n**成本分析:**\n';
      message += `• API调用: ${analytics.apiCalls} 次\n`;
      message += `• 总成本: ¥${analytics.totalCost.toFixed(2)}\n`;
      message += `• 单条成本: ¥${analytics.costPerResponse.toFixed(3)}\n`;
      
      // Trends
      if (analytics.trends) {
        message += '\n**趋势:**\n';
        message += `• 较昨日: ${analytics.trends.daily > 0 ? '📈' : '📉'} ${Math.abs(analytics.trends.daily)}%\n`;
        message += `• 较上周: ${analytics.trends.weekly > 0 ? '📈' : '📉'} ${Math.abs(analytics.trends.weekly)}%\n`;
      }
      
      message += `\n[查看完整报表](${await this.getSheetUrl('analytics')})`;
      
      return await this.sendRichMessage(userId, message);
    } catch (error) {
      console.error('Error getting analytics:', error);
      return await this.sendMessage(userId, '获取分析数据失败: ' + error.message);
    }
  }

  /**
   * Get sheet link
   */
  async getSheetLink(params, userId) {
    const sheetName = params[0];
    if (!sheetName) {
      return await this.sendMessage(userId, '请指定表格名称');
    }
    
    try {
      const url = await this.getSheetUrl(sheetName);
      return await this.sendRichMessage(userId, `
📊 **${this.getSheetDisplayName(sheetName)}**

[点击打开表格](${url})
`);
    } catch (error) {
      return await this.sendMessage(userId, '获取表格链接失败: ' + error.message);
    }
  }

  /**
   * Send plain text message
   */
  async sendMessage(userId, text) {
    try {
      await axios.post(
        `${this.feishuBaseUrl}/im/v1/messages`,
        {
          receive_id: userId,
          msg_type: 'text',
          content: JSON.stringify({ text })
        },
        {
          headers: {
            'Authorization': `Bearer ${this.tenantAccessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            receive_id_type: 'user_id'
          }
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Send rich text message with markdown
   */
  async sendRichMessage(userId, markdown) {
    try {
      await axios.post(
        `${this.feishuBaseUrl}/im/v1/messages`,
        {
          receive_id: userId,
          msg_type: 'post',
          content: JSON.stringify({
            zh_cn: {
              title: '微博研究助手',
              content: this.markdownToFeishuPost(markdown)
            }
          })
        },
        {
          headers: {
            'Authorization': `Bearer ${this.tenantAccessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            receive_id_type: 'user_id'
          }
        }
      );
    } catch (error) {
      console.error('Error sending rich message:', error);
    }
  }

  /**
   * Convert markdown to Feishu post format
   */
  markdownToFeishuPost(markdown) {
    const lines = markdown.split('\n');
    const content = [];
    
    for (const line of lines) {
      if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        content.push([{
          tag: 'text',
          text: line.replace(/\*\*/g, ''),
          style: ['bold']
        }]);
      } else if (line.startsWith('•')) {
        // Bullet point
        content.push([{
          tag: 'text',
          text: line
        }]);
      } else if (line.includes('[') && line.includes('](')) {
        // Link
        const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          content.push([{
            tag: 'a',
            text: match[1],
            href: match[2]
          }]);
        } else {
          content.push([{ tag: 'text', text: line }]);
        }
      } else if (line.trim()) {
        // Regular text
        content.push([{ tag: 'text', text: line }]);
      } else {
        // Empty line
        content.push([{ tag: 'text', text: '' }]);
      }
    }
    
    return content;
  }

  /**
   * Helper methods for data operations
   */
  
  async getSystemStats() {
    // Implement sheet reading to get stats
    return {
      deepseekStatus: true,
      weiboStatus: true,
      todayGenerated: 0,
      todayApproved: 0,
      todayPosted: 0,
      todayApiCalls: 0,
      pendingApproval: 0,
      pendingPost: 0,
      failedPosts: 0,
      activeUsers: 0,
      totalUsers: 226,
      todayCost: 0,
      monthCost: 0
    };
  }

  async getPendingResponses(filter = {}) {
    // Implement sheet query
    return [];
  }

  async getApprovedResponses(filter = {}) {
    // Implement sheet query
    return [];
  }

  async updateApprovalStatus(responseIds, status) {
    // Implement sheet update
    return { success: responseIds.length };
  }

  async getAnalytics(period) {
    // Implement analytics calculation
    return {
      groups: [],
      avgResponseLength: 0,
      approvalRate: 0,
      postSuccessRate: 0,
      apiCalls: 0,
      totalCost: 0,
      costPerResponse: 0,
      trends: { daily: 0, weekly: 0 }
    };
  }

  async callCloudFunction(action, params) {
    // Implement cloud function call
    return { results: [] };
  }

  async getSheetUrl(sheetName) {
    // Return the actual sheet URL
    return `https://feishu.cn/sheets/${this.config.SHEET_ID}#sheet=${sheetName}`;
  }

  getSheetDisplayName(sheetName) {
    const names = {
      users: '用户管理',
      prompts: '提示词模板',
      response_queue: '回复队列',
      posts: '微博帖子库',
      analytics: '数据分析',
      settings: '系统设置'
    };
    return names[sheetName] || sheetName;
  }

  getPeriodLabel(period) {
    const labels = {
      today: '今日',
      week: '本周',
      month: '本月'
    };
    return labels[period] || period;
  }
}

module.exports = FeishuBotHandler;