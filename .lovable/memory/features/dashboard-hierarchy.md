---
name: Dashboard hierarchy v2
description: Mobile-first dashboard layout order and componentization rules
type: feature
---
Dashboard follows strict vertical hierarchy (mobile-first, "first fold" = greeting + search + Start Here only):
1. DashboardGreeting — short, human
2. UniversalSearch — bible-focused search bar
3. StartHereBlock — 4 hero cards (Sermon, Study, Article, Social)
4. QuickAccessBar — 4 adaptive shortcuts based on usage
5. CoreToolsGrid — 6 main tools (Studio, Study, Blog, Research, Social Studio, Library)
6. MoreToolsAccordion — collapsed panel with all extra tools
7. AccountInfoBar — plan/usage info (below fold)
8. RecentGenerations — last 5 materials feed

Components live in src/components/dashboard/. No stats cards, no upgrade banners above fold.
Sidebar: always collapsed by default. Hierarchy: Logo → Core nav → separator → Account → Footer.
