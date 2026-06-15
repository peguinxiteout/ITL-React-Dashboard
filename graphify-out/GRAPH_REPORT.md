# Graph Report - .  (2026-06-12)

## Corpus Check
- Corpus is ~5,980 words - fits in a single context window. You may not need a graph.

## Summary
- 205 nodes · 306 edges · 14 communities
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.92)
- Token cost: 102,245 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Dashboard UI Components|Dashboard UI Components]]
- [[_COMMUNITY_Competitor Table & Brand Stats|Competitor Table & Brand Stats]]
- [[_COMMUNITY_Market Share Metrics|Market Share Metrics]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Dev Tooling Dependencies|Dev Tooling Dependencies]]
- [[_COMMUNITY_App Bootstrap & Screens|App Bootstrap & Screens]]
- [[_COMMUNITY_Magic Patterns Template Deps|Magic Patterns Template Deps]]
- [[_COMMUNITY_Vite Node TS Config|Vite Node TS Config]]
- [[_COMMUNITY_Source Entry Files|Source Entry Files]]
- [[_COMMUNITY_Project Manifests|Project Manifests]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `DateRangeKey` - 12 edges
3. `KpiCards Component` - 12 edges
4. `Dashboard Page Component` - 10 edges
5. `SentimentTab Component` - 10 edges
6. `compilerOptions` - 7 edges
7. `BrandStats` - 7 edges
8. `formatNumber()` - 7 edges
9. `MarketShareTab Component` - 7 edges
10. `KpiCards()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Src Package Manifest (magic-patterns-project)` --semantically_similar_to--> `Root Package Manifest (magic-patterns-vite-template)`  [INFERRED] [semantically similar]
  src/package.json → package.json
- `README Getting Started` --references--> `Root Package Manifest (magic-patterns-vite-template)`  [EXTRACTED]
  README.md → package.json
- `Tailwind CSS Config` --references--> `HTML Shell (Content Insights Dashboard)`  [EXTRACTED]
  tailwind.config.js → index.html
- `React Entry Point (render bootstrap)` --references--> `HTML Shell (Content Insights Dashboard)`  [EXTRACTED]
  src/index.tsx → index.html
- `Root Package Manifest (magic-patterns-vite-template)` --references--> `Vite Build Config`  [INFERRED]
  package.json → vite.config.ts

## Hyperedges (group relationships)
- **Vite + TypeScript + Tailwind Build Toolchain** — package_root_manifest, vite_config_defineConfig, tsconfig_main, tsconfig_node, postcss_config, tailwind_config [INFERRED 0.95]
- **Magic Patterns Canvas Screen-State Flow** — canvas_manifest_manifest, useScreenInit_useScreenInit, dashboard_Dashboard, concept_screen_state_init [INFERRED 0.85]
- **App Bootstrap Chain (HTML -> entry -> App -> Dashboard)** — index_html_root, index_entry_render, app_App, dashboard_Dashboard [EXTRACTED 1.00]
- **Date-Range Filter State Flow** — dashboard_Dashboard, dashboardheader_DashboardHeader, kpicards_KpiCards, marketsharetab_MarketShareTab, sentimenttab_SentimentTab, engagementtrendchart_EngagementTrendChart [EXTRACTED 1.00]
- **Duplicated Framer-Motion Stagger Animation Pattern** — kpicards_KpiCards, marketsharetab_MarketShareTab, sentimenttab_SentimentTab [INFERRED 0.85]
- **Sonalika Own-Brand Highlighting via SONALIKA_ID** — kpicards_KpiCards, competitortable_CompetitorTable, contentfrequencychart_ContentFrequencyChart, shareofvoicecharts_ShareOfVoiceCharts, marketsharetab_MarketShareTab [INFERRED 0.85]

## Communities (14 total, 0 thin omitted)

### Community 0 - "Dashboard UI Components"
Cohesion: 0.08
Nodes (41): DashboardHeader(), DashboardHeaderProps, container, item, Kpi, KpiCards(), KpiCardsProps, TabBar() (+33 more)

### Community 1 - "Competitor Table & Brand Stats"
Cohesion: 0.12
Nodes (22): SectionCard(), SectionCardProps, BrandStats, engagementOf(), getBrand(), SOV_TRENDS, COLUMNS, CompetitorTable() (+14 more)

### Community 2 - "Market Share Metrics"
Cohesion: 0.16
Nodes (24): CompetitorTable Component, Own-Brand (Sonalika) Highlighting Pattern, Date-Range Scaling Mechanism, Share of Engagement Metric, Share of Voice Metric, ContentFrequencyChart Component, EngagementTrendChart Component, KpiCards Component (+16 more)

### Community 3 - "TypeScript Compiler Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, @emotion/react, framer-motion, lucide-react, react, react-dom, recharts, name (+8 more)

### Community 5 - "Dev Tooling Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, postcss, tailwindcss, @types/node (+7 more)

### Community 6 - "App Bootstrap & Screens"
Cohesion: 0.16
Nodes (15): App Root Component, Canvas Manifest (Magic Patterns screens/sections), URL-Driven Screen State Initialization (mp_screen), Dashboard Page Component, DashboardHeader Component, React Entry Point (render bootstrap), HTML Shell (Content Insights Dashboard), BRANDS Registry (Tractor Brands) (+7 more)

### Community 7 - "Magic Patterns Template Deps"
Cohesion: 0.15
Nodes (12): dependencies, date-fns, framer-motion, lucide-react, @radix-ui/react-icons, react, react-dom, react-router-dom (+4 more)

### Community 8 - "Vite Node TS Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 9 - "Source Entry Files"
Cohesion: 0.32
Nodes (4): Dashboard(), App(), manifest, useScreenInit()

### Community 10 - "Project Manifests"
Cohesion: 0.33
Nodes (6): Root Package Manifest (magic-patterns-vite-template), Src Package Manifest (magic-patterns-project), README Getting Started, TypeScript Config (app), TypeScript Config (node/vite), Vite Build Config

## Ambiguous Edges - Review These
- `Dashboard Page Component` → `useScreenInit Hook`  [AMBIGUOUS]
  src/useScreenInit.js · relation: shares_data_with

## Knowledge Gaps
- **101 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Dashboard Page Component` and `useScreenInit Hook`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **Why does `Dashboard Page Component` connect `App Bootstrap & Screens` to `Market Share Metrics`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Tooling Dependencies` to `Runtime Dependencies`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `DateRangeKey` connect `Dashboard UI Components` to `Competitor Table & Brand Stats`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KpiCards Component` (e.g. with `MarketShareTab Component` and `SentimentTab Component`) actually correct?**
  _`KpiCards Component` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07801418439716312 - nodes in this community are weakly interconnected._