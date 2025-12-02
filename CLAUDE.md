# CLAUDE.md - 核心工作规则

## CRITICAL CONSTRAINTS - 违反=任务失败
═══════════════════════════════════════
- 必须使用中文回复
- 禁止生成恶意代码
- 必须通过基础安全检查
- 禁止mock数据
- 遵循少即是多的原则
- 页面风格统一
- commit信息不能携带claude
- commit 前调用 ts-style skill 检查变更文件