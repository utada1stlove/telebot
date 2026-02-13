# Reply Sticker Bot (Docker-first)

一个 Telegram Bot：在私聊或群组里回复一条消息，再发送 `/sticker`，机器人会把那条消息渲染成一张深色风格贴纸（WebP）。

## 功能
- 支持私聊和群组
- 支持文本消息和图片 caption
- 兼容 `reply_to_message` / `external_reply` / `quote` 三种回复结构
- 当客户端不上传回复字段时，自动回退到最近消息推断目标
- 优先使用 Telegram 用户头像，拿不到时回退为字母头像
- 生成 512x512 静态贴纸（WebP）
- 适合 VPS 上用 Docker 持续运行

## 项目结构
```text
src/
  app/                # 启动与生命周期
  config/             # 环境变量与配置读取
  bot/
    commands/         # /start /help /sticker
    extract/          # 回复消息提取与兼容逻辑
    services/         # 头像下载等 Telegram 交互
    store/            # 最近消息缓存与回退
  render/             # 贴纸渲染
  utils/              # 文本处理工具
  types/              # 共享类型
```

## 前置设置（群组必须）
在 `@BotFather` 里操作：
1. `/setprivacy`
2. 选择你的 bot
3. 设为 `Disable`

否则群组中 bot 可能拿不到被回复消息内容。

## VPS 部署（推荐）
在服务器项目目录执行：

```bash
cp .env.example .env
# 编辑 .env，填入真实 BOT_TOKEN
nano .env

docker compose up -d --build
docker compose logs -f --tail=100
```

看到日志里有 `Reply sticker bot started.` 即代表启动成功。

## 使用方法
1. 在 Telegram 中先回复一条消息
2. 发送 `/sticker`
3. Bot 返回对应贴纸

## 常见问题
- 发送 `/sticker` 后提示“请先回复一条消息”
  - 确认你使用的是 Telegram 的真正 Reply，不是仅引用文本
  - 群组里确认已关闭 privacy
- 无响应
  - 先看日志：`docker compose logs -f --tail=100`
- 中文变方块
  - 本项目镜像已安装 Noto CJK 字体；如果你自定义镜像请保留字体安装步骤
