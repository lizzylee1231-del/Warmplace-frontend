# 暖窝前端

暖窝是一款面向女性的私密情绪记录 App：写下当天的心情，AI 用朋友的口吻回应，每周收到一封回顾周信。
体验地址：https://warmnest.top
后端仓库（含项目介绍与分工说明）：https://github.com/lizzylee1231-del/Warmplace
来源：Herstory 黑客松作品（4 人团队，获优秀奖）

## 本地开发与验证

使用 Node 24，运行 npm ci 后执行 npm run dev。开发服务会先打包并从 dist 提供页面。默认代理正式后端；验证配套新后端时，先设置 WARMNEST_BACKEND_ORIGIN。

检查：npm run check、npm test、npm run build。Vercel 构建执行 npm run build，仅发布 dist；不发布 node_modules、测试或源码目录。

## 身份升级

通过 Supabase 匿名会话提供认证，所有 API 请求携带访问令牌，不再依赖可伪造的设备 ID。旧设备标识保留，但不会自动认领旧记录。

本版本须配套后端 fix/backend-reliability、公开认证配置、开启匿名认证及数据库归属迁移后发布。前端 API 代理必须指向配套后端。部署步骤见后端 docs/security-release-2026-10-23.md。

空记录显示空状态；AI 降级明确提示；保存失败可直接重试保存，相同 client_request_id 不重复新增。清除会话或换设备可能失去历史访问能力，尚无永久账号恢复功能。
