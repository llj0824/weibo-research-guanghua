Google Sheets: https://docs.google.com/spreadsheets/d/1m1H2-zutyutnAX3_Cf0J13EVjHslqcXsRfxt5DpRSSI/edit?gid=248718322#gid=248718322

以下是设置微博开发者账户的分步中文指南：

### 微博开发者账户设置步骤

1. **访问微博开放平台**
   - 打开网址：[https://open.weibo.com](https://open.weibo.com)
   - 点击"注册"或"登录"创建新账户（如果没有账号）

2. **完成开发者认证**
   - 需要已认证的微博个人账号
   - 提供身份证等认证材料
   - 认证过程通常需要1-3个工作日

3. **创建新应用**
   - 登录后进入"我的应用"
   - 点击"创建应用"或"添加新应用"
   - 选择"网页应用"类型

4. **填写应用信息**
   - 应用名称：使用描述性名称（如"北大研究项目"）
   - 应用描述：说明应用用途
   - 网站：填写项目网站或机构网址
   - 组织："北京大学"

5. **配置重定向URI**
   - 这是OAuth工作的关键
   - 使用格式：`https://script.google.com/macros/d/{1g-zyHtsKqIt7OKWgVFdu-Hwjn0Q5z6HpLcfMjucBxvLyaV9A5Oz7W6Zm}/usercallback`
   - 稍后需要获取Google脚本ID（见第7步）

6. **提交审核**
   - 同意微博服务条款
   - 提交应用等待审核
   - 审核通常需要3-7个工作日

7. **获取凭证**
   - 审核通过后进入应用仪表盘
   - 找到"App Key"(client_id)和"App Secret"(client_secret)
   - 这就是您的WEIBO_APP_KEY和WEIBO_APP_SECRET

### 重要注意事项：
- **认证要求**：需要中国大陆手机号进行验证
- **API限制**：新应用初始API调用限制为150次/小时
- **内容政策**：确保应用符合微博内容规范
- **支持**：遇到问题联系 weibo_app@vip.sina.com

* 

### Step-by-Step Weibo Developer Account Setup

1. **Go to Weibo Open Platform**
   - Visit: [https://open.weibo.com](https://open.weibo.com)
   - Click "Register" or "Sign Up" to create an account if you don't have one

2. **Complete Developer Verification**
   - You'll need a verified Weibo user account
   - Provide required identification documents for developer verification
   - This process may take 1-3 business days

3. **Create a New Application**
   - After logging in, navigate to "My Apps"
   - Click "Create App" or "Add New Application"
   - Select "Web Application" as the app type

4. **Fill in Application Details**
   - App Name: Use a descriptive name (e.g., "Research Project - PKU")
   - Description: Explain your app's purpose
   - Website: Your project website or institution URL
   - Organization: "Peking University"

5. **Configure Redirect URI**
   - This is CRITICAL for OAuth to work
   - Use format: `https://script.google.com/macros/d/{1g-zyHtsKqIt7OKWgVFdu-Hwjn0Q5z6HpLcfMjucBxvLyaV9A5Oz7W6Zm}/usercallback`
   - You'll need to get your Google Script ID later (see step 7)

6. **Submit for Review**
   - Agree to Weibo's terms of service
   - Submit your application for review
   - Approval typically takes 3-7 business days

7. **Retrieve Your Credentials**
   - Once approved, go to your app's dashboard
   - Find your "App Key" (client_id) and "App Secret" (client_secret)
   - These are your WEIBO_APP_KEY and WEIBO_APP_SECRET

### Important Notes:
- **Verification Requirements**: You'll need a Chinese phone number for account verification
- **API Restrictions**: New apps have limited API access initially (150 requests/hour)
- **Content Policies**: Ensure your app complies with Weibo's content guidelines
- **Support**: Contact weibo_app@vip.sina.com if you encounter issues
**