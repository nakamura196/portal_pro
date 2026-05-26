# UTokyo Digital Archive Portal Apps

[![Live demo](https://img.shields.io/badge/demo-nakamura196.github.io%2Fportal__pro-0B8BEE)](https://nakamura196.github.io/portal_pro/)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-FFCD00.svg)](./LICENSE)
[![DOI](https://img.shields.io/badge/cite-CITATION.cff-0B8BEE)](./CITATION.cff)

[東京大学デジタルアーカイブポータル](https://da.dl.itc.u-tokyo.ac.jp/portal/)（2024年5月に「学術資産等アーカイブズポータル」から改称）が提供するAPIを活用した、可視化・IIIF・3D・AR・WebGL のデモ集です。

🌐 **デモサイト:** [https://nakamura196.github.io/portal_pro/](https://nakamura196.github.io/portal_pro/)

## デモ一覧

### 可視化
- **[パズル](https://nakamura196.github.io/portal_pro/puzzle.html)** — IIIF Image API で東大所蔵資料をジグソーパズル化
- **[年表](https://nakamura196.github.io/portal_pro/timeline.html)** — 開成学校から現在までの東京大学の名称の変遷
- **[Word Cloud](https://nakamura196.github.io/portal_pro/wordcloud.html)** — D3.js ワードクラウド
- **[Image Transitions](https://nakamura196.github.io/portal_pro/transitions/)** — D3 + Primitive による画像変換アニメーション

### IIIF コレクション (Mirador 4 で統一)
- **[IIIF Collection (Mirador)](https://nakamura196.github.io/portal_pro/viewer/mirador.html?manifest=https://nakamura196.github.io/portal_pro/data/collection.json)** — 部局ごとのサブコレクションを集約した IIIF Collection
- **[Attributions from IIIF Collection](https://nakamura196.github.io/portal_pro/common/collection.html?collection=https://nakamura196.github.io/portal_pro/data/collection.json)** — Attribution 別の集計 (Highcharts)
- **[Javala (IIIF Viewer)](https://nakamura196.github.io/portal_pro/common/javala/?collection=https://nakamura196.github.io/portal_pro/data/collection.json)** — IIIF Collection の閲覧
- **[農学部 鳥瞰図 (Annotation)](https://nakamura196.github.io/portal_pro/viewer/mirador.html?manifest=https://nakamura196.github.io/portal_pro/usage/agriculture/manifest-v3.json)** — IIIF Presentation 3 + Web Annotation で 58 件のマーカーを付与
- **[IIIF Mosaic (Mirador)](https://nakamura196.github.io/portal_pro/viewer/mirador.html?manifest=https://nakamura196.github.io/portal_pro/mosaic/output/manifest.json)** — 画像をモザイク状に並べた IIIF Manifest
- **[石本コレクション分析例](https://nakamura196.github.io/portal_pro/usage/ishimoto/)** — Dydra SPARQL によるメタデータ集計

### 3D / VR / AR / WebGL
- **[three.js × IIIF](https://nakamura196.github.io/portal_pro/js/three/iiif/)** — IIIF 画像を 3D 空間に配置
- **[3D Gallery](https://nakamura196.github.io/portal_pro/js/three/gallery/)** — 3D 美術館ギャラリー
- **[AR (A-Frame + AR.js)](https://nakamura196.github.io/portal_pro/js/ar/)** — Hiro マーカーを使った AR
- **[Breakout (Unity WebGL)](https://nakamura196.github.io/portal_pro/unity/breakout/)** — ブロック崩し
- **[Obstacle Run (Unity WebGL)](https://nakamura196.github.io/portal_pro/unity/or/)** — 障害物走
- **[Roll a Ball (Unity WebGL)](https://nakamura196.github.io/portal_pro/unity/rab/)** — ボール転がし

## サービス停止のお知らせ

以前提供していた以下のサービスは停止しています:

- ~~SPARQL エンドポイント: `https://sparql.dl.itc.u-tokyo.ac.jp`~~
- ~~Snorql: `https://portal-pro.dl.itc.u-tokyo.ac.jp/snorql/`~~

これに依存していた可視化デモ (calendar / map / matrix / providers / freq / kwitem-frequency など) はリポジトリから整理しました。
履歴は [git log](https://github.com/nakamura196/portal_pro/commits/master) から参照できます。

## 関連リンク

- [東京大学デジタルアーカイブポータル](https://da.dl.itc.u-tokyo.ac.jp/portal/) — 公式ポータル
- [APIについて](https://da.dl.itc.u-tokyo.ac.jp/portal/help/api) — 検索 API / ハーベスト API (OAI-PMH)
- [Gallery](https://github.com/nakamura196/portal_pro/wiki/Gallery) — ポータルの活用事例
- [Usage](https://github.com/nakamura196/portal_pro/wiki/Usage) — コレクション別活用例

## デザインシステム

サイト全体に [@nakamura196/react-ui](https://github.com/nakamura196/react-ui) のスタンドアロン CSS (UTokyo Visual Identity Guidelines 準拠) を適用しています。

## ビューア

外部サービスのリンク切れに備え、**[Mirador 4](https://github.com/ProjectMirador/mirador)** (Apache-2.0) をローカル (`docs/assets/thirdparty/mirador/`) にバンドルしています。`./viewer/mirador.html?manifest=<URL>` で任意の IIIF Manifest/Collection を開けます。

## 貢献

Issue・Pull Request 歓迎です。詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 引用

本サイトを参照する場合は [`CITATION.cff`](./CITATION.cff) をご利用ください (GitHub の右サイドバー "Cite this repository" から取得可)。

## ライセンス

[![CC BY 4.0](http://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by.svg)](https://creativecommons.org/licenses/by/4.0/)
