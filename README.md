# telebot
according to teleboxdev
written by gpt5.2

---
# Reply Sticker Bot (Telegram Dark Style)

功能：在群里回复一条消息并发送 /sticker，Bot 会把被回复的消息渲染成 Telegram 深色聊天气泡贴纸（512x512 WebP）。

## 重要设置（必须）
在 @BotFather：
- /setprivacy
- 选择你的 bot
- 设为 Disable（关闭群隐私模式）
否则 bot 在群里可能拿不到 reply_to_message。

## 运行（Docker）
1. 在项目根目录创建 `.env`：
   BOT_TOKEN=你的真实BotToken
2. 启动：
   docker compose up -d --build

查看日志：
   docker compose logs -f

## 使用
在群里：长按某条消息 → Reply → 输入 /sticker 发送
