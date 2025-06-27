
Update on June 23rd, 2025：
user_list_20250623.xlsx: The file contains the latest user list. Previously, there were 234 users, and now the number has changed to 226, a decrease of 8 users. This is because during the previous web - crawling, it was possible to retrieve that they posted at least one Weibo between May 23, 2025, and May 31, 2025, but now it's no longer possible to crawl the Weibo posts they made during this period.（中文版本：user_list_20250623.xlsx：文件中是最新的user list，之前是234名用户，现在改为226名，用户数减少8名，因为之前爬虫时能够爬到他们在2025/05/23到2025/05/31期间发了至少一条微博，但是现在已经爬不到他们在这期间发的微博）
posting_history_bf0531.xlsx: The file contains the records of original Weibo posts made by 226 users before May 31, 2025. It is the same as the posting_history provided in the previous version of the data. It is attached here for easy reference. （中文版本：posting_history_bf0531.xlsx: 文件中是226名用户在2025/05/31之前的发布的原创微博记录，跟上一版数据中提供的posting_history相同，只是为了方便查看所以附在这里。）
posting_history_af0531.xlsx: The file contains all the original Weibo posting records of 226 users between May 31, 2025, and June 15, 2025. This part of the data was newly crawled, and its main purpose is to test the effectiveness of the prompt for making comments based on the posting history.（中文版本：posting_history_af0531.xlsx：文件中是226名用户在2025/05/31到2025/06/15之间发布的所有原创微博记录，这一部分数据是新爬取的，主要作用是测试根据发博历史进行评论的prompt的有效性）

Contents

## description of columns in user_list
1.user_searched_words
中文：用于搜索该用户的随机生成关键词English: The randomly generated keyword used to search for this user

2.user_name
中文：微博用户名（昵称）English: Weibo username (nickname)

3.user_id
中文：微博用户唯一ID（数字或字符串形式）English: Unique Weibo user ID (numeric or string format)

4.user_link
中文：用户主页URLEnglish: URL of the user's profile page

5.user_description
中文：用户个人简介（自我描述）English: User's self-description (bio)

6.user_followings_cnt
中文：用户关注数（关注了多少人）English: Number of accounts the user is following

7.user_followers_cnt
中文：用户粉丝数（被多少人关注）English: Number of followers the user has

8.user_gender
中文：用户性别（“男”、“女”）English: User's gender ("male", "female")

9.user_location
中文：用户填写的所在地（可能为空或不精确）English: User's registered location (may be empty or imprecise)

10.user_register_date
中文：用户注册微博的日期English: Date when the user registered on Weibo

11.user_total_cnt_likes_comments_reposts
中文：用户截至2025-05-31 所有微博的累计互动量（点赞+评论+转发）English: Total engagement count (likes + comments + reposts) across all user posts as of 2025-05-31


12.user_verified
中文：用户是否认证（布尔值，如True/False）English: Whether the user is verified (boolean, e.g.,True/False)

13.user_verified_tag
中文：用户认证标签（如“知名博主”、“演员”等，未认证则为空）English: Verification tag (e.g., "Celebrity", "Actor"; empty if unverified)

14.user_vip_type
中文：用户VIP类型（如普通用户、VIP会员等）English: VIP membership type (e.g., regular user, VIP member)

15.post_count_2025-05-23_to_2025-05-31
中文：用户在 2025-05-23 至 2025-05-31 期间发布的原创微博数量（不含转发）English: Number of original posts (excluding reposts) published between 2025-05-23 and 2025-05-31​

## description of columns in posting_history

1.user_id
中文：发布微博的用户唯一标识符English: Unique identifier of the user who posted the Weibo

2.post_id
中文：微博的唯一IDEnglish: Unique ID of the Weibo post

3.post_link
中文：该微博的公开URL链接English: Public URL link to the Weibo post

4.post_publish_time
中文：微博的发布时间（精确到秒）English: Timestamp when the post was published (to the second)

5.post_content
中文：微博的文本内容（含表情符号、话题标签等）English: Text content of the post (including emojis, hashtags, etc.)

6.post_geo
中文：微博发布时的地理位置信息（可能为空）English: Geographic location attached to the post (may be empty)

7.post_likes_cnt
中文：该微博的点赞数English: Number of likes received by the post

8.post_comments_cnt
中文：该微博的评论数English: Number of comments received by the post

9.post_reposts_cnt
中文：该微博的转发数English: Number of reposts (shares) of the post

10.post_pic_num
中文：微博附带的图片数量（0表示无图片）English: Number of images attached to the post (0 if none)

11.post_pics
中文：微博图片的URL列表English: List of image URLs

12.post_video_url
中文：微博附带的视频URL（无视频则为空）English: URL of the video attached to the post (empty if none)

13.post_topic_names
中文：微博中提到的所有话题名称（如#冬奥会#、#BlackLivesMatter#）English: All topic names mentioned in the post (e.g., #WinterOlympics#, #BlackLivesMatter#)

14.post_topic_num
中文：微博中提到的话题总数（如一条微博带#A#和#B#，则值为2）English: Total number of topics tagged in the post (e.g., 2 if a post has #A# and #B#)

15.post_topic_urls
中文：每个话题对应的微博专题页链接English: Links to Weibo topic pages






