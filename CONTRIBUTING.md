# Contributing / 貢献ガイド

Thanks for your interest in **UTokyo Digital Archive Portal Apps**! Issues and pull requests are welcome.
**UTokyo Digital Archive Portal Apps** へのご関心をお寄せいただきありがとうございます。Issue・Pull Request を歓迎します。

## Overview / 概要

This repository is a **static site** (plain HTML + JS) served from `docs/` via GitHub Pages — no build step.
本リポジトリは `docs/` をそのまま GitHub Pages から配信する**静的サイト**で、ビルドステップはありません。

```
portal_pro/
├── docs/                  # GitHub Pages root
│   ├── index.html         # landing page (demo gallery, i18n)
│   ├── puzzle.html        # IIIF puzzle demo
│   ├── timeline.html      # UTokyo names timeline (static)
│   ├── wordcloud.html     # D3 word cloud
│   ├── transitions/       # D3 + Primitive image transitions
│   ├── viewer/mirador.html        # local Mirador 4 host
│   ├── assets/thirdparty/mirador/ # vendored Mirador bundle
│   ├── usage/agriculture/         # IIIF Prez 3 manifest + annotations
│   ├── usage/ishimoto/            # Dydra SPARQL analysis
│   ├── common/                    # shared IIIF demos (collection chart, Javala)
│   ├── data/                      # static IIIF data (collection.json, timeline.json)
│   ├── mosaic/, unity/, js/       # other demos
│   └── ogp.* / favicon.*          # OG image and icons
├── CITATION.cff
├── CONTRIBUTING.md
├── LICENSE                # CC BY 4.0
└── README.md
```

## Local preview / ローカル確認

```bash
cd docs
python3 -m http.server 8080
# Open http://localhost:8080
```

Any static server works (`npx serve`, `caddy file-server`, etc.).
他の静的サーバ (`npx serve`, `caddy file-server` 等) でも構いません。

## Design system / デザインシステム

All landing pages share [`@nakamura196/react-ui`](https://github.com/nakamura196/react-ui)'s standalone CSS, which encodes the [University of Tokyo Visual Identity Guidelines](https://www.u-tokyo.ac.jp/) (logo / symbol mark not used).
全ランディングページで [`@nakamura196/react-ui`](https://github.com/nakamura196/react-ui) のスタンドアロンCSS（[東京大学 Visual Identity Guidelines](https://www.u-tokyo.ac.jp/) 準拠、ロゴ・シンボルマーク不使用）を共有しています。

Prefer the design tokens (`var(--ds-primary)`, `var(--ds-accent)`, …) and structural classes (`ds-header`, `ds-card`, `ds-btn`, …) over hardcoded colors.
ハードコードした色ではなく、デザイントークン (`var(--ds-primary)` 等) と構造クラス (`ds-header`, `ds-card`, `ds-btn` 等) を優先してください。

## Adding a new demo / 新しいデモを追加するには

1. Place the demo under `docs/`.
2. Apply the shared design system (DS header + footer + CSS link).
3. Add a card entry to `docs/index.html` (and i18n strings in `I18N.ja` / `I18N.en`).
4. Update `README.md`.

1. デモを `docs/` 配下に追加します。
2. 共有デザインシステム（DS の header / footer / CSS リンク）を適用します。
3. `docs/index.html` にカードを追加し、`I18N.ja` / `I18N.en` に文言を追記します。
4. `README.md` を更新します。

## IIIF data conventions / IIIF データの方針

- New IIIF data should be **Presentation 3** + **W3C Web Annotation**, viewable by the local Mirador (`./viewer/mirador.html?manifest=<URL>`).
- 既存の Presentation 2 / CODH Curation 形式は参考資料として `usage/agriculture/manifest.json` と `curation.json` に保存しています。
- 新規 IIIF データは **Presentation 3** + **W3C Web Annotation** を使い、ローカル Mirador (`./viewer/mirador.html?manifest=<URL>`) で閲覧可能にしてください。
- Existing Presentation 2 / CODH Curation files are kept as reference under `usage/agriculture/manifest.json` and `curation.json`.

## Reporting issues / 不具合報告

Please use [GitHub Issues](https://github.com/nakamura196/portal_pro/issues).
[GitHub Issues](https://github.com/nakamura196/portal_pro/issues) をご利用ください。
