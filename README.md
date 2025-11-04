# 無想のMusicPlayer

静态音乐播放器已使用 ES 模块重新配置。 index.html 加载 assets/css/main.css 和  assets/js 下的模块，并引用 GitHub API 中的 songs/ 和 lyrics/ 来进行播放和歌词同步。

## 开发说明
- `assets/js/app.js` 是初始化排版日志、二进制雨效果和语音播放器的入口点。

- API 访问和歌词处理分为 `assets/js/songsService.js` 和 `assets/js/lyrics.js`。

- 样式聚合在 `assets/css/main.css` 中，以管理布局和 CRT 演示。
