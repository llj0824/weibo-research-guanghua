# Feishu + Tencent Cloud Deployment Guide

This guide will help you migrate the Weibo research project from Google Sheets to a Feishu Multidimensional Table + Tencent Cloud Function architecture.

## Architecture Overview

```
Feishu Multidimensional Table (Data Storage)
    ↓
Feishu Bot (Interactive Interface)
    ↓
Tencent Cloud Function (Business Logic)
    ↓
DeepSeek API (AI Generation) + Weibo API (Data Fetching/Publishing)
```

## Step 1: Create Feishu Application

### 1.1 Register Feishu Open Platform Account
1. Visit [Feishu Open Platform](https://open.feishu.cn)
2. Register a developer account with your phone number
3. Create an organization (if you don't have one)

### 1.2 Create Application
1. Enter the developer console
2. Click "Create Application" → Select "Self-built Application"
3. Fill in application information:
   - Application Name: Weibo Research Assistant
   - Application Description: Research on AI identity disclosure effects on social media engagement

### 1.3 Configure Application Permissions
In the application details page, click "Permission Management" and add the following permissions:
- **Bot**
  - `im:message` - Send messages
  - `im:message:send_as_bot` - Send messages as bot
- **Docs**
  - `sheets:spreadsheet` - Access spreadsheets
  - `drive:drive` - Access cloud documents
- **Contacts**
  - `contact:user.id:readonly` - Get user ID

### 1.4 Get Application Credentials
On the "Credentials & Basic Info" page, record:
- App ID: `cli_xxxxx`
- App Secret: `xxxxx`

## Step 2: Create Feishu Multidimensional Table

### 2.1 Create Table
1. Log in to Feishu, go to "Docs"
2. Create a new multidimensional table: "Weibo Research Data"
3. Record the table ID (in URL: `https://feishu.cn/base/XXX`)

### 2.2 Create Data Tables
Create the following tables according to `sheet-structure.json`:

#### User Management Table
| Field | Type | Description |
|------|------|------|
| user_id | Text | Weibo user ID |
| username | Text | Username |
| group_id | Select | Experiment group (0-4) |
| status | Select | Active/Inactive/Excluded |
| last_processed | Date | Last processing time |
| total_responses | Number | Total responses |

#### Prompt Template Table
| Field | Type | Description |
|------|------|------|
| prompt_id | Text | Template ID |
| group_id | Select | Applicable group |
| prompt_template | Long text | Prompt template |
| system_prompt | Long text | System prompt |
| temperature | Number | Temperature parameter |

#### Response Queue Table
| Field | Type | Description |
|------|------|------|
| response_id | Text | Response ID |
| user_id | Text | User ID |
| post_content | Long text | Original post content |
| response_content | Long text | AI response |
| approval_status | Select | Approval status |
| posting_status | Select | Posting status |

### 2.3 Import User Data
1. Export user data from original Google Sheets (CSV format)
2. Import CSV data into Feishu table
3. Ensure 226 users are correctly assigned to 5 experiment groups

## Step 3: Deploy Tencent Cloud Function

### 3.1 Register Tencent Cloud Account
1. Visit [Tencent Cloud](https://cloud.tencent.com)
2. Complete real-name verification
3. Enable Cloud Function service

### 3.2 Create Cloud Function
1. Enter Cloud Function console
2. Create new function:
   - Function Name: `weibo-research-handler`
   - Runtime: Node.js 16.13
   - Memory: 512MB
   - Timeout: 60 seconds

### 3.3 Upload Code
1. Create deployment package:
```bash
cd feishu
npm init -y
npm install axios
zip -r function.zip .
```

2. Upload `function.zip` to cloud function

### 3.4 Configure Environment Variables
Add in cloud function configuration:
- `FEISHU_APP_ID`: Feishu application ID
- `FEISHU_APP_SECRET`: Feishu application secret
- `DEEPSEEK_API_KEY`: DeepSeek API key
- `WEIBO_ACCESS_TOKEN`: Weibo access token

### 3.5 Create API Gateway Trigger
1. Add trigger → API Gateway trigger
2. Record trigger URL: `https://service-xxx.gz.apigw.tencentcs.com/release/xxx`

## Step 4: Configure Feishu Bot

### 4.1 Enable Bot
1. In Feishu application console, go to "App Features" → "Bot"
2. Enable bot feature
3. Set bot information:
   - Name: Weibo Research Assistant
   - Description: Help manage Weibo research experiment

### 4.2 Configure Event Subscription
1. Go to "Event Subscription"
2. Configure request URL: Enter Tencent Cloud Function API Gateway URL
3. Add events:
   - `im.message.receive_v1` - Receive messages

### 4.3 Publish Application
1. Create new version in "Version Management"
2. Submit for review (self-built apps auto-approve)
3. Publish to organization

## Step 5: Obtain API Credentials

### 5.1 DeepSeek API
1. Visit [DeepSeek Platform](https://platform.deepseek.com)
2. Register and get API Key
3. Top up account (suggest ¥50 for testing)

### 5.2 Weibo API
Due to Weibo Open Platform restrictions, suggest:
1. Use existing Weibo developer account
2. Or use cached user data (exported from original project)

## Step 6: Test System

### 6.1 Test Bot Commands
Chat with bot in Feishu:
```
/help              # View help
/status            # View system status
/sheet users       # Get user table link
```

### 6.2 Test Generation Feature
```
/generate users=1234567890 group=1
```

### 6.3 Test Approval and Publishing
```
/approve all                    # Approve all pending
/post approved                  # Post approved responses
```

## Step 7: Data Migration

### 7.1 Export Google Sheets Data
```javascript
// Run in Google Apps Script
function exportData() {
  const sheets = ['Users', 'Prompts', 'Response Queue', 'Posts'];
  const data = {};
  
  sheets.forEach(sheetName => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const values = sheet.getDataRange().getValues();
    data[sheetName] = values;
  });
  
  // Save as JSON
  DriveApp.createFile('weibo_research_data.json', JSON.stringify(data));
}
```

### 7.2 Import to Feishu
Use provided import script or manually import CSV files

## Operations Guide

### Monitoring
1. **Tencent Cloud Monitoring**
   - Function invocation count
   - Error rate
   - Execution time

2. **Feishu Table Statistics**
   - Daily generation/approval/posting count
   - API call costs

### Backup
1. Daily automatic backup of Feishu table data
2. Save API call logs

### Troubleshooting
1. **Bot Not Responding**
   - Check cloud function logs
   - Verify event subscription URL
   - Confirm app permissions

2. **API Call Failures**
   - Check if API key expired
   - Confirm sufficient balance
   - View error logs

### Cost Optimization
1. **Batch Processing**: Merge multiple requests to reduce API calls
2. **Caching Strategy**: Cache user history data
3. **Scheduled Tasks**: Execute batch operations during off-peak hours

## Security Recommendations

1. **Key Management**
   - Use Tencent Cloud Key Management Service
   - Rotate API keys regularly
   - Don't hardcode keys in code

2. **Access Control**
   - Limit Feishu app usage scope
   - Set cloud function access whitelist
   - Enable operation audit logs

3. **Data Protection**
   - Encrypt sensitive data
   - Regular backups
   - Comply with data privacy regulations

## FAQ

**Q: Why choose Feishu over DingTalk?**
A: Feishu has more powerful multidimensional tables, better APIs, and better integration with Tencent Cloud.

**Q: What's the cost of Tencent Cloud Functions?**
A: Estimated monthly cost:
- Function invocations: ~¥10-20
- API Gateway: ~¥5-10
- Total: ~¥15-30

**Q: How to handle Weibo API restrictions?**
A: Suggestions:
1. Use proxy server (Hong Kong/overseas)
2. Cache user data to reduce API calls
3. Use multiple Weibo developer accounts in rotation

**Q: How to ensure data security?**
A: 
1. All data stored in private Feishu space
2. API communication uses HTTPS encryption
3. Sensitive information stored in environment variables

## Contact Support

For issues:
- Technical issues: Check Tencent Cloud Function logs
- Feishu issues: Check Feishu Open Platform documentation
- Project issues: Refer to original Google Sheets implementation

---

# 飞书 + 腾讯云部署指南

本指南将帮助您将微博研究项目从 Google Sheets 迁移到飞书多维表格 + 腾讯云函数的架构。

## 架构概览

```
飞书多维表格 (数据存储)
    ↓
飞书机器人 (交互界面)
    ↓
腾讯云函数 (业务逻辑)
    ↓
DeepSeek API (AI生成) + 微博 API (数据获取/发布)
```

## 步骤 1: 创建飞书应用

### 1.1 注册飞书开放平台账号
1. 访问 [飞书开放平台](https://open.feishu.cn)
2. 使用手机号注册开发者账号
3. 创建企业（如果还没有）

### 1.2 创建应用
1. 进入开发者后台
2. 点击"创建应用" → 选择"企业自建应用"
3. 填写应用信息：
   - 应用名称：微博研究助手
   - 应用描述：AI身份披露对社交媒体互动影响研究

### 1.3 配置应用权限
在应用详情页，点击"权限管理"，添加以下权限：
- **机器人**
  - `im:message` - 发送消息
  - `im:message:send_as_bot` - 以机器人身份发送消息
- **云文档**
  - `sheets:spreadsheet` - 访问电子表格
  - `drive:drive` - 访问云文档
- **通讯录**
  - `contact:user.id:readonly` - 获取用户ID

### 1.4 获取应用凭证
在"凭证与基础信息"页面，记录：
- App ID: `cli_xxxxx`
- App Secret: `xxxxx`

## 步骤 2: 创建飞书多维表格

### 2.1 创建表格
1. 登录飞书，进入"云文档"
2. 创建新的多维表格："微博研究数据"
3. 记录表格 ID（在 URL 中：`https://feishu.cn/base/XXX`）

### 2.2 创建数据表
根据 `sheet-structure.json` 创建以下表：

#### 用户管理表
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | 文本 | 微博用户ID |
| username | 文本 | 用户名 |
| group_id | 单选 | 实验组 (0-4) |
| status | 单选 | 活跃/不活跃/已排除 |
| last_processed | 日期 | 最后处理时间 |
| total_responses | 数字 | 总回复数 |

#### 提示词模板表
| 字段 | 类型 | 说明 |
|------|------|------|
| prompt_id | 文本 | 模板ID |
| group_id | 单选 | 适用组 |
| prompt_template | 多行文本 | 提示词模板 |
| system_prompt | 多行文本 | 系统提示词 |
| temperature | 数字 | 温度参数 |

#### 回复队列表
| 字段 | 类型 | 说明 |
|------|------|------|
| response_id | 文本 | 回复ID |
| user_id | 文本 | 用户ID |
| post_content | 多行文本 | 原帖内容 |
| response_content | 多行文本 | AI回复 |
| approval_status | 单选 | 审核状态 |
| posting_status | 单选 | 发布状态 |

### 2.3 导入用户数据
1. 从原 Google Sheets 导出用户数据（CSV格式）
2. 在飞书表格中导入CSV数据
3. 确保226个用户正确分配到5个实验组

## 步骤 3: 部署腾讯云函数

### 3.1 注册腾讯云账号
1. 访问 [腾讯云](https://cloud.tencent.com)
2. 完成实名认证
3. 开通云函数服务

### 3.2 创建云函数
1. 进入云函数控制台
2. 创建新函数：
   - 函数名称：`weibo-research-handler`
   - 运行环境：Node.js 16.13
   - 内存：512MB
   - 超时时间：60秒

### 3.3 上传代码
1. 创建部署包：
```bash
cd feishu
npm init -y
npm install axios
zip -r function.zip .
```

2. 上传 `function.zip` 到云函数

### 3.4 配置环境变量
在云函数配置中添加：
- `FEISHU_APP_ID`: 飞书应用ID
- `FEISHU_APP_SECRET`: 飞书应用密钥
- `DEEPSEEK_API_KEY`: DeepSeek API密钥
- `WEIBO_ACCESS_TOKEN`: 微博访问令牌

### 3.5 创建 API 网关触发器
1. 添加触发器 → API网关触发器
2. 记录触发器URL：`https://service-xxx.gz.apigw.tencentcs.com/release/xxx`

## 步骤 4: 配置飞书机器人

### 4.1 启用机器人
1. 在飞书应用后台，进入"应用功能" → "机器人"
2. 启用机器人功能
3. 设置机器人信息：
   - 名称：微博研究助手
   - 描述：帮助管理微博研究实验

### 4.2 配置事件订阅
1. 进入"事件订阅"
2. 配置请求地址：输入腾讯云函数的API网关URL
3. 添加事件：
   - `im.message.receive_v1` - 接收消息

### 4.3 发布应用
1. 在"版本管理"中创建新版本
2. 提交审核（企业自建应用自动通过）
3. 发布到企业

## 步骤 5: 获取 API 凭证

### 5.1 DeepSeek API
1. 访问 [DeepSeek Platform](https://platform.deepseek.com)
2. 注册并获取 API Key
3. 充值（建议先充值 ¥50 测试）

### 5.2 微博 API
由于微博开放平台限制，建议：
1. 使用已有的微博开发者账号
2. 或使用缓存的用户数据（从原项目导出）

## 步骤 6: 测试系统

### 6.1 测试机器人命令
在飞书中与机器人对话：
```
/help              # 查看帮助
/status            # 查看系统状态
/sheet users       # 获取用户表链接
```

### 6.2 测试生成功能
```
/generate users=1234567890 group=1
```

### 6.3 测试审核和发布
```
/approve all                    # 批准所有待审核
/post approved                  # 发布已批准的回复
```

## 步骤 7: 数据迁移

### 7.1 导出 Google Sheets 数据
```javascript
// 在 Google Apps Script 中运行
function exportData() {
  const sheets = ['Users', 'Prompts', 'Response Queue', 'Posts'];
  const data = {};
  
  sheets.forEach(sheetName => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const values = sheet.getDataRange().getValues();
    data[sheetName] = values;
  });
  
  // 保存为 JSON
  DriveApp.createFile('weibo_research_data.json', JSON.stringify(data));
}
```

### 7.2 导入到飞书
使用提供的导入脚本或手动导入CSV文件

## 运维指南

### 监控
1. **腾讯云监控**
   - 函数调用次数
   - 错误率
   - 执行时间

2. **飞书表格统计**
   - 每日生成/批准/发布数量
   - API调用成本

### 备份
1. 每日自动备份飞书表格数据
2. 保存API调用日志

### 故障排查
1. **机器人无响应**
   - 检查云函数日志
   - 验证事件订阅URL
   - 确认应用权限

2. **API调用失败**
   - 检查API密钥是否过期
   - 确认余额充足
   - 查看错误日志

### 成本优化
1. **批量处理**：合并多个请求减少API调用
2. **缓存策略**：缓存用户历史数据
3. **定时任务**：在低峰期执行批量操作

## 安全建议

1. **密钥管理**
   - 使用腾讯云密钥管理服务
   - 定期轮换API密钥
   - 不要在代码中硬编码密钥

2. **访问控制**
   - 限制飞书应用的使用范围
   - 设置云函数访问白名单
   - 启用操作审计日志

3. **数据保护**
   - 加密敏感数据
   - 定期备份
   - 遵守数据隐私法规

## 常见问题

**Q: 为什么选择飞书而不是钉钉？**
A: 飞书的多维表格功能更强大，API更完善，且与腾讯云集成更好。

**Q: 腾讯云函数的成本如何？**
A: 预计每月成本：
- 函数调用：约 ¥10-20
- API网关：约 ¥5-10
- 总计：约 ¥15-30

**Q: 如何处理微博API限制？**
A: 建议：
1. 使用代理服务器（香港/海外）
2. 缓存用户数据减少API调用
3. 使用多个微博开发者账号轮换

**Q: 数据安全如何保证？**
A: 
1. 所有数据存储在企业私有飞书空间
2. API通信使用HTTPS加密
3. 敏感信息使用环境变量存储

## 联系支持

如遇到问题，请联系：
- 技术问题：查看腾讯云函数日志
- 飞书问题：查看飞书开放平台文档
- 项目问题：参考原 Google Sheets 实现