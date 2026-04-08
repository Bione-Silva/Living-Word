---
name: Dashboard hierarchy v2
description: Mobile-first dashboard layout order and componentization rules
type: feature
---
Dashboard follows strict vertical hierarchy (mobile-first, inspired by Zeal layout):
1. DashboardGreeting — verse of the day + time-based greeting with name in primary color
2. BomAmigoCard — emotional check-in with input + "Quero uma Palavra" button (calls ai-tool edge function)
3. DevotionalCard — "Palavra do Dia" section with title, category/audio/date badges, verse quote, CTA button
4. ToolsCircleGrid — circular icon buttons in horizontal scrollable row (8 tools)
5. StreakBar — weekly activity streak from generation_logs
6. MoreToolsAccordion — collapsed panel with all extra tools
7. RecentGenerations — last 5 materials feed

Components live in src/components/dashboard/. Removed: StatsCards, StartHereBlock, QuickAccessBar, CoreToolsGrid, UniversalSearch from dashboard.
Sidebar: always collapsed by default. Hierarchy: Logo → Core nav → separator → Account → Footer.
