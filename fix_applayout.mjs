import fs from 'fs';

let content = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf-8');

// Replace the groups with flat links
content = content.replace(/const sidebarGroups.*?\];/s, `
const forYouLinks = [
  { id: 'dashboard', to: '/dashboard', icon: LayoutDashboard, label: { PT: 'Início', EN: 'Home', ES: 'Inicio' } },
  { id: 'devocional', to: '/devocional', icon: BookOpen, label: { PT: 'Devocional Diário', EN: 'Daily Devotional', ES: 'Devocional Diario' }, badge: 'Novo' },
  { id: 'bible', to: '/bible', icon: Library, label: { PT: 'Bíblia', EN: 'Bible', ES: 'Biblia' } },
  { id: 'bom-amigo', to: '/bom-amigo', icon: MessageSquare, label: { PT: 'Palavra Amiga', EN: 'Friendly Word', ES: 'Palabra Amiga' } },
  { id: 'blog', to: '/blog', icon: PenTool, label: { PT: 'Meu Blog', EN: 'My Blog', ES: 'Mi Blog' }, pro: true },
];

const toolsLinks = [
  { id: 'sermon', to: '/sermoes/editor', icon: Wand2, label: { PT: 'Sermão', EN: 'Sermon', ES: 'Sermón' } },
  { id: 'bible-study', to: '/estudos/novo', icon: GraduationCap, label: { PT: 'Estudo Bíblico', EN: 'Bible Study', ES: 'Estudio Bíblico' } },
  { id: 'articles', to: '/redator-blog', icon: PenTool, label: { PT: 'Blog & Artigos', EN: 'Blog & Articles', ES: 'Blog & Artículos' } },
  { id: 'social', to: '/social-studio', icon: ImageIcon, label: { PT: 'Artes Bíblicas', EN: 'Biblical Arts', ES: 'Artes Bíblicas' } },
  { id: 'minds', to: '/dashboard/mentes', icon: Brain, label: { PT: 'Mentes Brilhantes', EN: 'Brilliant Minds', ES: 'Mentes Brillantes' }, pro: true },
];
`);

fs.writeFileSync('src/layouts/AppLayout.tsx', content);
