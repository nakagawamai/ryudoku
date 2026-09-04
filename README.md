# 流読（りゅうどく）

青空文庫の作品を、1行ずつ流れるように読むツール。サーバー不要の静的サイトです。

## 仕組み
- 本文は aozorahack の GitHub ミラー（aozorabunko_text）から、ブラウザが直接取得します（CORS対応、Shift_JIS をブラウザ側で変換）
- 作品一覧 `index.json` は、青空文庫の「作家別作品一覧（拡張版）CSV」から生成した静的ファイルです

## 作品一覧の更新
```
npm install
npm run build-index      # aozora.gr.jp から CSV を取得して index.json を生成
```
CSV を手元に置いている場合: `node build-index.mjs ./list_person_all_extended_utf8.zip`

## デプロイ
Vercel / Netlify / GitHub Pages など、静的ホスティングにこのフォルダをそのまま置くだけです。
`?id=作品ID` で作品を直接開けます（例: `/?id=789`）。

## 権利表記
- 作品一覧: 青空文庫「作家別作品一覧CSV」 CC BY 4.0
- 本文: 各作品ページの記載および「青空文庫収録ファイルの取り扱い規準」に従います

## 作品一覧の自動更新
`.github/workflows/update-index.yml` が毎週月曜の早朝に `npm run build-index` を実行し、
index.json に変更があればコミットします。Vercel を GitHub 連携にしておけば、そのまま自動で再デプロイされます。
初回だけ GitHub の Actions タブ →「作品一覧を更新」→ Run workflow で手動実行すると、すぐ全作品分の index.json ができます。
