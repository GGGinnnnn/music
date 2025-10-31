# 無想のMusicPlayer

静的な音楽プレイヤーを ES Modules で再構成しました。`index.html` から `assets/css/main.css` と `assets/js` 配下のモジュールを読み込み、GitHub API から `songs/` と `lyrics/` を参照して再生・歌詞同期を行います。

## 開発メモ
- `assets/js/app.js` がエントリーポイントで、型打ちログ、バイナリ雨エフェクト、音声プレイヤーを初期化します。
- API アクセスや歌詞処理は `assets/js/songsService.js` と `assets/js/lyrics.js` に分割しています。
- スタイルは `assets/css/main.css` に集約し、レイアウトと CRT 演出を管理しています。

ローカルで確認する際は任意の静的サーバー（例: `npx serve` など）でプロジェクトルートを配信してください。
