# AI 音乐创作平台

## ——设计与实现文档

***

**系统名称：AI 音乐创作平台（AIMusic）**

**组员信息：**

| 角色 | 学号         | 姓名  |
| -- | ---------- | --- |
| 组长 | 2021000001 | 李秀涛 |
| 组员 | 2021000002 | 张学龙 |
| 组员 | 2021000003 | 杨明浩 |
| 组员 | 2021000004 | 刘伟鹏 |

> 注：封面无页眉、无页码。

***

## 目录

- 第 1 章 绪论
  - 1.1 项目研究现状
  - 1.2 项目开发背景
  - 1.3 项目开发意义
  - 1.4 项目开发目标
  - 1.5 主要工作内容
  - 1.6 研究方法
  - 1.7 文档组织结构
- 第 2 章 项目分析
  - 2.1 功能需求分析
  - 2.2 非功能性需求
  - 2.3 数据需求分析
- 第 3 章 项目设计
  - 3.1 软件架构设计
  - 3.2 软件模块设计
  - 3.3 业务流程设计
  - 3.4 接口设计
  - 3.5 数据库设计
- 第 4 章 项目实现
  - 4.1 用户认证模块
  - 4.2 音乐生成模块
  - 4.3 发现与播放模块
  - 4.4 评论与点赞模块
  - 4.5 积分与充值模块
  - 4.6 创作者月度排行榜模块
  - 4.7 后台管理模块
- 第 5 章 总结与展望
  - 5.1 项目总结
  - 5.2 不足与展望
- 参考文献

***

# 第 1 章 绪论

## 1.1 项目研究现状

近年来，以 AIGC（Artificial Intelligence Generated Content，人工智能生成内容）为代表的技术迅速发展，深刻改变了内容创作行业的生产方式。在音乐领域，人工智能生成音乐（AI Music Generation）已成为学术界与工业界共同关注的研究热点。

国际方面，OpenAI 于 2020 年发布的 Jukebox 模型首次展示了基于深度学习的端到端音乐生成能力；Google 于 2023 年推出 MusicLM，能够根据文本描述生成高保真音乐；2024 年 Suno、Udio 等产品将 AI 音乐生成推向大众消费市场，用户只需输入提示词即可在数秒内获得带有人声的完整歌曲。国内方面，MiniMax、昆仑万维天工 SkyMusic、腾讯音乐 MUSE 等厂商也相继开放了音乐生成 API。

在工程实现层面，当前主流的 AI 音乐平台普遍采用"前后端分离 + 大模型 API 调用"的架构模式：前端负责交互与播放，后端负责鉴权、任务调度、计费与存储。然而，多数开源项目仅停留在"调用接口生成音频"的演示阶段，缺乏完整的用户体系、积分计费、评论互动、排行榜激励等运营能力，难以直接用于教学实践或小型商业化部署。

## 1.2 项目开发背景

在上述背景下，本项目面向高校软件工程课程实践与小型 AIGC 应用快速搭建场景，旨在构建一个功能完整、架构清晰、可二次开发的 AI 音乐创作平台。项目以 MiniMax Music-01 模型作为音乐生成后端，以 DeepSeek 大语言模型作为歌词生成后端，结合 FastAPI 异步后端与 Next.js 前端，实现从用户注册、歌词生成、音乐生成、播放、评论、点赞、积分充值到创作者月度排行榜的完整闭环。

## 1.3 项目开发意义

1. **技术学习意义**：项目综合运用了异步 Python Web 框架、ORM、JWT 鉴权、对象存储、大模型 API 集成、React 服务端渲染、状态管理等现代全栈技术，对软件工程课程的综合实践具有较高价值。
2. **应用价值**：平台为音乐爱好者提供低门槛的 AI 创作工具，并通过积分与排行榜激励机制促进创作者持续产出优质内容。
3. **研究价值**：项目对"有意义歌曲"的量化定义（当月播放量≥10 且状态正常）为创作者活跃度评估提供了一种可参考的指标设计思路。

## 1.4 项目开发目标

本项目旨在实现以下目标：

1. 支持纯音乐、歌曲（带歌词）、翻唱三种创作模式，调用大模型生成音频。
2. 提供用户注册、登录、JWT 鉴权、单点登录踢出（session\_version 机制）。
3. 建立积分体系：生成音乐消耗积分，充值获得积分，排行榜奖励积分。
4. 提供发现页（分页、搜索、排序）、作品页、播放历史。
5. 提供歌曲评论、点赞（中间表控制每人一次）、删除评论功能。
6. 提供创作者月度热度排行榜，前三名金银铜标识，按月发放积分奖励并防重复。
7. 提供后台管理：用户管理、歌曲管理（改名/删除）、模型管理、套餐管理、订单管理、系统配置。

## 1.5 主要工作内容

| 工作阶段  | 主要内容                                                       |
| ----- | ---------------------------------------------------------- |
| 需求分析  | 梳理用户角色（普通用户、管理员）及其用例，明确功能与非功能需求                            |
| 系统设计  | 设计前后端分离架构、数据库 ER 模型、RESTful 接口、业务流程                        |
| 后端开发  | 基于 FastAPI + SQLAlchemy 异步实现 10 个路由模块、12 张数据表              |
| 前端开发  | 基于 Next.js 16 + React 19 + TailwindCSS + Zustand 实现 12 个页面 |
| 第三方集成 | 集成 MiniMax 音乐生成 API、DeepSeek 歌词生成 API、腾讯云 COS 对象存储         |
| 测试与部署 | 本地 SQLite 调试，部署至云服务器（49.235.178.100）                       |

## 1.6 研究方法

本项目综合采用以下软件工程方法：

1. **面向对象方法**：后端使用 SQLAlchemy ORM 将数据表抽象为对象模型（User、GenerationTask、Comment 等），通过关系映射（relationship）表达实体间关联；前端使用 TypeScript 接口定义数据类型，以面向对象思想组织组件与状态。
2. **结构化方法**：在需求分析与系统设计阶段，采用数据流图、ER 图、功能结构图等结构化建模工具描述系统。
3. **迭代增量开发**：按模块迭代开发，先实现核心生成与播放闭环，再逐步增加评论、排行榜、后台管理等功能。

## 1.7 文档组织结构

第 1 章绪论介绍项目背景、意义、目标与研究方法；第 2 章项目分析给出功能需求（用例图）、非功能需求与数据需求（ER 图与关系模式）；第 3 章项目设计阐述软件架构、模块、业务流程、接口与数据库设计；第 4 章项目实现描述各模块的实现并附界面效果图；第 5 章总结与展望对项目进行总结并提出优化方向。

***

# 第 2 章 项目分析

## 2.1 功能需求分析

### 2.1.1 用户角色

系统涉及两类用户角色：

- **普通用户**：注册登录后可生成音乐、播放、评论、点赞、充值、查看排行榜与作品。
- **管理员**：在普通用户权限基础上，可访问后台管理用户、歌曲、模型、套餐、订单、系统配置。

### 2.1.2 用例图

```
                    +-----------------------+
                    |   AI 音乐创作平台     |
                    |                       |
   +----------+    |  注册/登录            |    +----------+
   |          |---►|  生成音乐(纯音乐/歌曲/翻唱)◄---|          |
   |          |    |  播放/历史            |    |          |
   | 普通用户 |    |  评论/点赞/删除评论    |    |  管理员  |
   |          |    |  充值/查看明细        |    |          |
   |          |    |  查看排行榜          |    |          |
   |          |    |  管理作品(改名/删除)  |    |          |
   +----------+    |  后台管理(用户/歌曲/   |    +----------+
                    |    模型/套餐/订单/配置)|
                    +-----------------------+
```

### 2.1.3 用例描述（节选）

**用例 1：发表评论**

| 项目   | 内容                                                                            |
| ---- | ----------------------------------------------------------------------------- |
| 用例名称 | 发表评论                                                                          |
| 参与者  | 已登录普通用户                                                                       |
| 前置条件 | 用户已登录，目标歌曲存在且状态正常                                                             |
| 基本流程 | 1. 用户在歌曲详情页输入评论内容（10-200 字）2. 点击发送3. 系统校验字数与登录态4. 写入评论表，歌曲评论数 +15. 返回新评论并刷新列表 |
| 异常流程 | 未登录提示登录；字数不足/超限提示；歌曲不存在提示错误                                                   |
| 后置条件 | 评论持久化，歌曲 comment\_count 自增                                                    |

**用例 2：点赞评论**

| 项目   | 内容                                                                                                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 用例名称 | 点赞评论                                                                                                                                    |
| 参与者  | 已登录普通用户                                                                                                                                 |
| 前置条件 | 评论存在                                                                                                                                    |
| 基本流程 | 1. 用户点击点赞按钮2. 系统查询 comment\_likes 表是否存在记录3. 不存在则插入记录，评论 likes\_count+1，返回 is\_liked=true4. 存在则删除记录，评论 likes\_count-1，返回 is\_liked=false |
| 异常流程 | 未登录提示登录；评论不存在提示错误                                                                                                                       |
| 后置条件 | 点赞中间表与评论点赞数保持一致                                                                                                                         |

**用例 3：查询月度排行榜**

| 项目   | 内容                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------- |
| 用例名称 | 查询月度排行榜                                                                                                        |
| 参与者  | 任意访客（可选登录）                                                                                                     |
| 前置条件 | 无                                                                                                              |
| 基本流程 | 1. 用户选择月份（默认当月）2. 系统统计该月每首歌曲播放量3. 筛选"有意义歌曲"（播放量≥10、状态 completed、未删除）4. 按创作者分组统计数量并降序排序5. 分页返回排名、昵称、有意义歌曲数、奖励信息 |
| 后置条件 | 无                                                                                                              |

**用例 4：管理员发放排行榜奖励**

| 项目   | 内容                                                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| 用例名称 | 发放排行榜奖励                                                                                                                          |
| 参与者  | 管理员                                                                                                                              |
| 前置条件 | 目标月份已结束                                                                                                                          |
| 基本流程 | 1. 管理员调用发放接口2. 系统校验月份已结束3. 计算排行榜4. 查询 ranking\_reward\_records 是否已发放5. 未发放则给前三名发放 500/300/200 积分，第 4-10 名发放 100 积分6. 写入发放记录与积分流水 |
| 异常流程 | 当月未结束拒绝；已发放跳过                                                                                                                    |
| 后置条件 | 积分到账，发放记录持久化                                                                                                                     |

## 2.2 非功能性需求

| 类别   | 需求描述                                              |
| ---- | ------------------------------------------------- |
| 性能   | 接口响应时间 P95 < 500ms（不含大模型调用）；排行榜统计接口 < 1s          |
| 并发   | 支持单机 50 并发；音乐生成任务异步执行不阻塞主线程                       |
| 安全性  | 密码 bcrypt 加盐哈希；JWT 鉴权；管理员接口权限校验；SQL 注入由 ORM 参数化防护 |
| 可用性  | 前端响应式适配移动端；加载骨架屏；错误 Toast 提示                      |
| 可扩展性 | 适配器模式接入多种大模型；SystemConfig 表支持运行时配置                |
| 可维护性 | 模块化路由；统一日志；统一响应格式                                 |
| 部署   | 前后端分离部署，支持云服务器                                    |

## 2.3 数据需求分析

### 2.3.1 ER 图

```
+----------+        +------------------+        +----------+
|   User   |1------*| GenerationTask   |*------1| AIModel  |
+----------+        +------------------+        +----------+
    |1                  |1                         |
    |                   |                          |
    |*                  |*                         |
+----------+        +----------+              +----------+
| Credit   |        | Comment  |              | PlayHistory|
|Transaction|       +----------+              +----------+
+----------+            |1
    |1                  |*
    |                   |
+----------+        +----------+
| Credit   |        | Comment  |
| Order    |        | Like     |
+----------+        +----------+

+----------+        +----------+        +----------+
| Credit   |        | System   |        | Admin    |
| Package  |        | Config   |        | Log      |
+----------+        +----------+        +----------+

+------------------+
| RankingReward    |
| Record           |
+------------------+
```

### 2.3.2 关系模式

下划线表示主键，斜体表示外键。

1. **User**（<u>id</u>, username, email, password\_hash, credits, total\_credits\_earned, total\_credits\_spent, is\_active, is\_admin, session\_version, created\_at, updated\_at）
2. **AIModel**（<u>id</u>, name, code, description, supported\_modes, supports\_lyrics, max\_duration\_sec, price\_per\_second, price\_per\_song, tags, api\_config, adapter\_name, max\_concurrent, is\_active, consecutive\_failures, created\_at, updated\_at）
3. **GenerationTask**（<u>id</u>, *user\_id*, *model\_id*, mode, prompt, lyrics, style, vocal\_gender, vocal\_style, language, duration\_sec, actual\_duration\_sec, cost\_credits, status, audio\_url, error\_message, is\_deleted, custom\_name, audio\_base64, play\_count, comment\_count, created\_at, completed\_at）
4. **CreditTransaction**（<u>id</u>, *user\_id*, amount, balance\_after, type, related\_id, description, created\_at）
5. **CreditPackage**（<u>id</u>, name, price\_cents, credits, bonus\_credits, is\_recommended, is\_active）
6. **CreditOrder**（<u>id</u>, order\_no, *user\_id*, package\_id, amount\_cents, credits\_bought, bonus\_credits, status, payment\_method, paid\_at, created\_at）
7. **PlayHistory**（<u>id</u>, *user\_id*, *task\_id*, played\_at）
8. **Comment**（<u>id</u>, *user\_id*, *task\_id*, content, likes\_count, created\_at）
9. **CommentLike**（<u>id</u>, *user\_id*, *comment\_id*, created\_at）+ 唯一约束 (user\_id, comment\_id)
10. **SystemConfig**（<u>id</u>, key, value）
11. **AdminLog**（<u>id</u>, admin\_id, action, target\_type, target\_id, details, ip, created\_at）
12. **RankingRewardRecord**（<u>id</u>, year\_month, *user\_id*, rank, meaningful\_songs\_count, reward\_credits, reward\_type, created\_at）+ 唯一约束 (year\_month, user\_id)

***

# 第 3 章 项目设计

## 3.1 软件架构设计

系统采用**前后端分离的 B/S 架构**，整体分为四层：

```
+----------------------------------------------------------+
|                     前端展示层 (Next.js)                  |
|  页面: 登录/创作/发现/作品/排行榜/充值/明细/个人/后台管理   |
|  状态: Zustand (auth/audio/ui/discovery)                  |
|  交互: axios + 拦截器(snake/camel 转换、token 注入)        |
+----------------------------------------------------------+
                          |  HTTP/REST (JSON)
+----------------------------------------------------------+
|                  后端接口层 (FastAPI)                      |
|  路由: auth/user/models/generation/credits/orders/        |
|        admin/discovery/comments/rankings                  |
|  鉴权: JWT (HTTPBearer) + session_version 单点踢出        |
|  响应: 统一 ApiResponse {success, data, error}             |
+----------------------------------------------------------+
                          |
+----------------------------------------------------------+
|                  业务服务层 (utils/adapters)               |
|  auth / pagination / response / logger / storage(COS)     |
|  lyrics(DeepSeek) / auto_complete / email                 |
|  adapters: BaseAdapter -> MiniMaxAdapter / MockAdapter   |
+----------------------------------------------------------+
                          |
+----------------------------------------------------------+
|                  数据持久层 (SQLAlchemy + SQLite)          |
|  12 张表: User/AIModel/GenerationTask/Comment/CommentLike  |
|           /CreditTransaction/CreditPackage/CreditOrder    |
|           /PlayHistory/SystemConfig/AdminLog/RankingReward|
+----------------------------------------------------------+
```

## 3.2 软件模块设计

### 后端模块（包图）

```
app/
├── main.py            # FastAPI 应用入口，中间件与路由注册
├── config.py          # 配置读取（.env）
├── database.py        # 引擎、会话工厂、init_db 迁移
├── models/            # ORM 模型（12 个）
├── schemas/           # Pydantic 请求/响应模型
├── routers/           # 10 个路由模块
│   ├── auth.py        # 注册/登录/登出
│   ├── user.py        # 用户信息/积分
│   ├── models.py      # AI 模型列表
│   ├── generation.py  # 音乐生成/歌词生成/自动补全
│   ├── credits.py     # 积分流水
│   ├── orders.py      # 充值订单
│   ├── discovery.py   # 发现页/播放/历史/排行榜
│   ├── comments.py    # 评论 CRUD/点赞
│   ├── rankings.py    # 月度排行榜/奖励发放
│   └── admin.py       # 后台管理
├── adapters/          # 大模型适配器（策略模式）
│   ├── base.py        # BaseAdapter 抽象基类
│   ├── minimax.py     # MiniMax 实现
│   └── mock.py        # 本地占位实现
└── utils/             # 工具
    ├── auth.py        # JWT/密码/鉴权依赖
    ├── response.py    # 统一响应
    ├── pagination.py  # 分页工具
    ├── logger.py      # 日志
    ├── storage.py     # 腾讯云 COS 上传
    ├── lyrics.py      # DeepSeek 歌词生成
    ├── auto_complete.py # 表单自动补全
    └── email.py       # 邮件
```

### 前端模块（功能结构图）

```
src/
├── app/               # Next.js App Router 页面
│   ├── (auth)         # 登录/注册
│   ├── create         # 创作页（侧边栏表单 + 预览）
│   ├── discover       # 发现页（卡片网格 + 详情弹窗 + 评论）
│   ├── works          # 我的作品
│   ├── rankings       # 月度排行榜
│   ├── recharge       # 充值
│   ├── transactions   # 积分明细
│   ├── profile        # 个人中心
│   └── admin/         # 后台管理
│       ├── (dashboard)
│       ├── songs      # 歌曲管理
│       ├── models     # 模型管理
│       ├── packages   # 套餐管理
│       ├── orders     # 订单管理
│       ├── users      # 用户管理
│       ├── settings   # 系统配置
│       └── logs       # 日志
├── components/        # 通用组件
│   ├── ui/            # Button/Card/Modal/Badge/Skeleton
│   ├── layout/        # AppLayout/Sidebar/AdminSidebar
│   └── CommentSection.tsx
├── stores/            # Zustand 状态
├── lib/axios.ts       # HTTP 客户端
├── types/             # TypeScript 类型
└── utils/             # 工具函数
```

## 3.3 业务流程设计

### 3.3.1 音乐生成业务流程（活动图）

```
        开始
          |
          v
   [用户填写创作表单]
          |
          v
   [点击生成按钮] --未登录--> [提示登录] --> 结束
          |
        已登录
          v
   [校验积分是否足够] --不足--> [提示充值] --> 结束
          |
         足够
          v
   [扣除积分 + 创建任务(pending)]
          |
          v
   [调用适配器 build_request]
          |
          v
   [调用大模型 API]
          |
     +----+----+
     |         |
   成功      失败
     |         |
     v         v
[上传音频至COS] [记录错误信息]
     |         [状态=failed]
     v
[更新 audio_url/状态=completed]
     |
     v
   结束
```

### 3.3.2 评论点赞业务流程（时序图）

```
用户        前端        后端comments路由      数据库
 |---点击点赞-->|              |                |
 |             |---POST /comments/{id}/like--->|
 |             |              |---查询CommentLike-->|
 |             |              |<--返回记录/空------|
 |             |              |                |
 |             |              |  [存在记录]    |
 |             |              |---删除CommentLike-->|
 |             |              |---likes_count-1---->|
 |             |              |<--is_liked=false----|
 |             |<--{isLiked:false,likesCount}--|
 |<--更新UI----|              |                |
```

## 3.4 接口设计

### 3.4.1 内部模块接口

| 接口                                           | 提供者              | 调用者        | 说明              |
| -------------------------------------------- | ---------------- | ---------- | --------------- |
| `get_db()`                                   | database         | 所有路由       | 注入异步数据库会话       |
| `get_current_user()`                         | utils.auth       | 需登录路由      | JWT 鉴权返回 User   |
| `get_optional_user()`                        | utils.auth       | 评论/排行榜     | 可选鉴权，未登录返回 None |
| `get_admin_user()`                           | utils.auth       | 后台路由       | 校验管理员权限         |
| `ApiResponse.ok/fail()`                      | utils.response   | 所有路由       | 统一响应封装          |
| `paginate()`                                 | utils.pagination | 列表路由       | 通用分页            |
| `BaseAdapter.build_request/parse_response()` | adapters.base    | generation | 大模型适配           |

### 3.4.2 对外 RESTful API（节选）

| 方法     | 路径                               | 说明     | 鉴权     |
| ------ | -------------------------------- | ------ | ------ |
| POST   | /api/auth/register               | 注册     | 无      |
| POST   | /api/auth/login                  | 登录     | 无      |
| GET    | /api/models                      | 模型列表   | 可选     |
| POST   | /api/generation/submit           | 提交生成任务 | 必须     |
| POST   | /api/generation/lyrics           | 生成歌词   | 必须     |
| GET    | /api/discovery                   | 发现页列表  | 可选     |
| POST   | /api/discovery/{id}/play         | 记录播放   | 可选     |
| POST   | /api/comments                    | 发表评论   | 必须     |
| GET    | /api/comments/task/{id}          | 评论列表   | 可选     |
| DELETE | /api/comments/{id}               | 删除评论   | 必须(本人) |
| POST   | /api/comments/{id}/like          | 点赞切换   | 必须     |
| GET    | /api/rankings/monthly            | 月度排行榜  | 可选     |
| POST   | /api/rankings/monthly/distribute | 发放奖励   | 管理员    |
| GET    | /api/admin/songs                 | 歌曲管理列表 | 管理员    |
| PATCH  | /api/admin/songs/{id}/rename     | 改名     | 管理员    |
| DELETE | /api/admin/songs/{id}            | 删除歌曲   | 管理员    |

### 3.4.3 适配器扩展接口

新增大模型只需继承 `BaseAdapter` 并实现 `build_request` 与 `parse_response`，在 `AIModel.adapter_name` 字段配置适配器名称即可被 `generation` 路由动态调用，无需修改业务代码。

## 3.5 数据库设计

### 3.5.1 表结构

#### 1. users（用户表）

| 字段                     | 类型           | 约束               | 说明          |
| ---------------------- | ------------ | ---------------- | ----------- |
| id                     | INTEGER      | PK, AUTO         | 主键          |
| username               | VARCHAR(50)  | UNIQUE, NOT NULL | 用户名         |
| email                  | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱          |
| password\_hash         | VARCHAR(255) | NOT NULL         | bcrypt 密码哈希 |
| credits                | FLOAT        | DEFAULT 0        | 当前积分        |
| total\_credits\_earned | FLOAT        | DEFAULT 0        | 累计获得        |
| total\_credits\_spent  | FLOAT        | DEFAULT 0        | 累计消费        |
| is\_active             | BOOLEAN      | DEFAULT TRUE     | 是否启用        |
| is\_admin              | BOOLEAN      | DEFAULT FALSE    | 是否管理员       |
| session\_version       | INTEGER      | DEFAULT 0        | 单点登录版本号     |
| created\_at            | DATETIME     | server\_default  | 创建时间        |
| updated\_at            | DATETIME     | onupdate         | 更新时间        |

#### 2. ai\_models（AI 模型表）

| 字段                 | 类型           | 约束           | 说明   |
| ------------------ | ------------ | ------------ | ---- |
| id                 | INTEGER      | PK           | 主键   |
| name               | VARCHAR(100) | NOT NULL     | 模型名称 |
| code               | VARCHAR(50)  | UNIQUE       | 模型编码 |
| supported\_modes   | TEXT         | JSON         | 支持模式 |
| price\_per\_second | FLOAT        | NOT NULL     | 每秒价格 |
| adapter\_name      | VARCHAR(100) | <br />       | 适配器名 |
| is\_active         | BOOLEAN      | DEFAULT TRUE | 是否启用 |

#### 3. generation\_tasks（生成任务表）

| 字段             | 类型           | 约束                | 说明   |
| -------------- | ------------ | ----------------- | ---- |
| id             | INTEGER      | PK                | 主键   |
| user\_id       | INTEGER      | FK->users.id      | 用户   |
| model\_id      | INTEGER      | FK->ai\_models.id | 模型   |
| mode           | VARCHAR(20)  | NOT NULL          | 模式   |
| prompt         | TEXT         | <br />            | 提示词  |
| lyrics         | TEXT         | <br />            | 歌词   |
| duration\_sec  | INTEGER      | NOT NULL          | 时长   |
| cost\_credits  | FLOAT        | NOT NULL          | 消耗积分 |
| status         | VARCHAR(20)  | DEFAULT pending   | 状态   |
| audio\_url     | VARCHAR(500) | <br />            | 音频地址 |
| is\_deleted    | BOOLEAN      | DEFAULT FALSE     | 软删除  |
| custom\_name   | VARCHAR(200) | <br />            | 自定义名 |
| play\_count    | INTEGER      | DEFAULT 0         | 播放量  |
| comment\_count | INTEGER      | DEFAULT 0         | 评论数  |
| created\_at    | DATETIME     | <br />            | 创建时间 |
| completed\_at  | DATETIME     | <br />            | 完成时间 |

#### 4. comments（评论表）

| 字段           | 类型       | 约束                       | 说明          |
| ------------ | -------- | ------------------------ | ----------- |
| id           | INTEGER  | PK                       | 主键          |
| user\_id     | INTEGER  | FK->users.id             | 评论者         |
| task\_id     | INTEGER  | FK->generation\_tasks.id | 歌曲          |
| content      | TEXT     | NOT NULL                 | 内容(10-200字) |
| likes\_count | INTEGER  | DEFAULT 0                | 点赞数         |
| created\_at  | DATETIME | <br />                   | 创建时间        |

索引：`ix_comments_task_created (task_id, created_at)`

#### 5. comment\_likes（点赞中间表）

| 字段          | 类型       | 约束              | 说明   |
| ----------- | -------- | --------------- | ---- |
| id          | INTEGER  | PK              | 主键   |
| user\_id    | INTEGER  | FK->users.id    | 点赞用户 |
| comment\_id | INTEGER  | FK->comments.id | 评论   |
| created\_at | DATETIME | <br />          | 创建时间 |

唯一约束：`uq_comment_likes_user_comment (user_id, comment_id)` —— 保证每人只能点一次

#### 6. ranking\_reward\_records（排行榜奖励记录表）

| 字段                       | 类型          | 约束           | 说明         |
| ------------------------ | ----------- | ------------ | ---------- |
| id                       | INTEGER     | PK           | 主键         |
| year\_month              | VARCHAR(7)  | NOT NULL     | 月份 YYYY-MM |
| user\_id                 | INTEGER     | FK->users.id | 创作者        |
| rank                     | INTEGER     | NOT NULL     | 名次         |
| meaningful\_songs\_count | INTEGER     | DEFAULT 0    | 有意义歌曲数     |
| reward\_credits          | FLOAT       | NOT NULL     | 奖励积分       |
| reward\_type             | VARCHAR(20) | NOT NULL     | top3/top10 |
| created\_at              | DATETIME    | <br />       | 发放时间       |

唯一约束：`uq_ranking_reward_month_user (year_month, user_id)` —— 防止同月重复发放

#### 7-12. 其他表

credit\_transactions（积分流水）、credit\_packages（套餐）、credit\_orders（订单）、play\_history（播放历史，含复合索引）、system\_configs（系统配置 KV）、admin\_logs（管理日志）结构从略，详见 2.3.2 关系模式。

***

# 第 4 章 项目实现

## 4.1 用户认证模块

基于 JWT 实现无状态鉴权。注册时使用 bcrypt 对密码加盐哈希存储；登录成功后签发包含 `user_id`、`is_admin`、`session_version` 的 JWT。`session_version` 字段用于实现单点登录踢出：当用户再次登录时 version+1，旧 token 校验时 version 不匹配即失效。

提供 `get_current_user`（必须登录）、`get_optional_user`（可选登录，用于评论查看与排行榜）、`get_admin_user`（管理员校验）三种鉴权依赖。

界面：登录页、注册页，表单校验使用 zod + react-hook-form。

## 4.2 音乐生成模块

支持三种创作模式：

- **instrumental（纯音乐）**：输入提示词、风格、BPM、情绪。
- **song（歌曲）**：输入提示词、歌词、演唱风格；支持调用 DeepSeek 自动生成歌词。
- **cover（翻唱）**：上传参考音频 + 歌词。

生成流程：校验积分 → 扣除积分 → 创建 pending 任务 → 通过 `BaseAdapter` 调用 MiniMax API → 上传音频至腾讯云 COS → 更新任务为 completed。失败时记录 error\_message 并退回积分。

界面：创作页采用左右分栏布局，左侧侧边栏表单（分段标签 01 模式 / 02 模型 / 03 参数），右侧实时预览与生成结果播放。

## 4.3 发现与播放模块

发现页提供卡片网格展示，支持按最新/最热排序、关键词搜索、分页加载。点击卡片打开详情弹窗，展示歌词、描述，并嵌入评论区组件。播放时调用 `/api/discovery/{id}/play` 记录播放历史，用于排行榜统计。

界面：卡片含封面、名称、创作者、播放量、时长；详情弹窗为 lg 尺寸，支持滚动。

## 4.4 评论与点赞模块

- **发表评论**：校验登录与字数（10-200），写入 comments 表，歌曲 `comment_count+1`。
- **查询评论**：按 `created_at` 倒序分页，JOIN users 表带出昵称；若已登录则查询 comment\_likes 标记 `is_liked` 与 `is_owner`。
- **删除评论**：仅评论本人可删，删除后 `comment_count-1`。
- **点赞切换**：查询 comment\_likes，存在则删除并 `likes_count-1`，不存在则插入并 `likes_count+1`。唯一约束保证每人只能点一次。

界面：CommentSection 组件含输入框（实时字数统计、颜色提示）、发送按钮、评论列表（头像、昵称、内容、点赞数、时间、点赞按钮、删除按钮）、分页。

## 4.5 积分与充值模块

积分贯穿全平台：生成音乐按 `price_per_second × duration_sec` 扣费；充值通过 credit\_packages 套餐下单；所有积分变动写入 credit\_transactions 流水表，记录变动后余额。排行榜奖励也以积分形式发放并记录流水。

界面：充值页展示套餐卡片（推荐标识），明细页展示流水列表。

## 4.6 创作者月度排行榜模块

每月统计创作者的"有意义歌曲"数量（当月播放量≥10、状态 completed、未删除），按数量降序排名。前三名分别奖励 500/300/200 积分（金/银/铜），第 4-10 名奖励 100 积分。奖励发放通过 `ranking_reward_records` 表的唯一约束 (year\_month, user\_id) 防止同月重复发放。

排行榜查询接口支持指定月份与分页，返回排名、昵称、有意义歌曲数、奖励信息。当月未结束不允许发放奖励。

界面：排行榜页顶部为前三名领奖台卡片（金/银/铜配色与图标突出），下方为完整榜单列表，支持月份切换与分页，底部展示奖励规则说明。

## 4.7 后台管理模块

管理员可访问 `/admin` 后台，侧边栏包含：仪表盘、歌曲管理、模型管理、套餐管理、订单管理、用户管理、系统配置、日志。

歌曲管理页支持：关键词搜索（名称/提示词/风格/歌词）、状态过滤、含已删除开关、分页（含页码跳转）、播放试听、改名（Modal 弹窗）、删除（软删除）。

界面：表格列含 ID、名称、创作者、模型、模式、状态、播放量、评论数、创建时间、操作；移动端切换为卡片布局。

***

# 第 5 章 总结与展望

## 5.1 项目总结

本项目基于 **FastAPI + SQLAlchemy（异步）+ SQLite** 后端与 **Next.js 16 + React 19 + TailwindCSS + Zustand** 前端技术栈，实现了一个功能完整的 AI 音乐创作平台。主要成果如下：

1. 基于 **MiniMax Music-01** 与 **DeepSeek** 大模型 API 实现了纯音乐、歌曲、翻唱三种模式的 AI 音乐生成。
2. 基于 **JWT + session\_version** 实现了用户鉴权与单点登录踢出。
3. 基于 **SQLAlchemy ORM** 设计了 12 张数据表，涵盖用户、任务、评论、点赞、积分、订单、播放历史、排行榜奖励等完整业务。
4. 基于 **中间表唯一约束** 实现了"每人只能点一次"的点赞切换。
5. 基于 **月度统计 + 唯一约束发放记录** 实现了创作者月度热度排行榜与防重复积分发放。
6. 基于 **适配器模式（BaseAdapter）** 实现了大模型的可扩展接入。
7. 基于 **腾讯云 COS** 实现了音频对象存储。
8. 实现了完整的后台管理（用户/歌曲/模型/套餐/订单/配置/日志）。

## 5.2 不足与展望

### 5.2.1 不足

1. **数据库**：当前使用 SQLite，并发写入能力有限，不适合生产环境高并发。
2. **支付**：充值订单仅记录流水，未对接真实支付网关（微信/支付宝）。
3. **排行榜实时性**：排行榜每次查询实时统计，数据量大时性能下降。
4. **音频版权**：未对生成音频做版权水印与内容审核。
5. **推荐算法**：发现页仅支持按时间/播放量排序，缺乏个性化推荐。
6. **测试覆盖**：缺乏自动化单元测试与集成测试。

### 5.2.2 优化方案

1. **数据库迁移**：迁移至 PostgreSQL/MySQL，引入 Redis 缓存热点数据与排行榜月度快照。
2. **支付集成**：对接微信支付/支付宝当面付，实现真实充值闭环。
3. **排行榜优化**：使用定时任务（Celery/APScheduler）在月末预计算并缓存排行榜，查询时直接读取缓存。
4. **内容安全**：接入音频水印与文本/音频内容审核 API。
5. **个性化推荐**：基于用户播放历史与标签，引入协同过滤或向量检索推荐。
6. **测试与 CI/CD**：补充 pytest 与 Vitest 测试用例，配置 GitHub Actions 自动化构建部署。
7. **容器化**：使用 Docker Compose 编排前后端与数据库，简化部署。

***

## 参考文献

\[1] OpenAI. Jukebox: A Generative Model for Music\[EB/OL]. <https://openai.com/research/jukebox>, 2020.

\[2] Google Research. MusicLM: Generating Music From Text\[EB/OL]. <https://arxiv.org/abs/2301.11325>, 2023.

\[3] MiniMax. MiniMax Music-01 API Documentation\[EB/OL]. <https://www.minimaxi.com>, 2024.

\[4] DeepSeek. DeepSeek API Documentation\[EB/OL]. <https://api.deepseek.com>, 2024.

\[5] Sebastián Ramírez. FastAPI Documentation\[EB/OL]. <https://fastapi.tiangolo.com>, 2024.

\[6] SQLAlchemy Project. SQLAlchemy 2.0 Documentation\[EB/OL]. <https://docs.sqlalchemy.org>, 2024.

\[7] Vercel. Next.js Documentation\[EB/OL]. <https://nextjs.org/docs>, 2024.

\[8] Meta Platforms. React Documentation\[EB/OL]. <https://react.dev>, 2024.

\[9] 腾讯云. 对象存储 COS 开发文档\[EB/OL]. <https://cloud.tencent.com/document/product/436>, 2024.

\[10] Jones M, Bradley J, Sakimura N. RFC 7519: JSON Web Token (JWT)\[S]. IETF, 2015.

\[11] Fielding R T. Architectural Styles and the Design of Network-based Software Architectures\[D]. University of California, Irvine, 2000.

\[12] 阮一峰. ECMAScript 6 入门\[M]. 北京: 电子工业出版社, 2015.

\[13] 张海藩, 牟永敏. 软件工程导论\[M]. 第 6 版. 北京: 清华大学出版社, 2013.

\[14] 王珊, 萨师煊. 数据库系统概论\[M]. 第 5 版. 北京: 高等教育出版社, 2014.

\[15] Gamma E, Helm R, Johnson R, et al. 设计模式: 可复用面向对象软件的基础\[M]. 李英军, 等译. 北京: 机械工业出版社, 2000.
