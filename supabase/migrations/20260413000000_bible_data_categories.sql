ALTER TABLE content_sections DROP CONSTRAINT IF EXISTS content_sections_category_check;
ALTER TABLE content_sections ADD CONSTRAINT content_sections_category_check
CHECK (category IN ('ilustracoes', 'esboços', 'citacoes', 'referencias_cruzadas', 'personagens', 'parabolas', 'milagres', 'quiz', 'panorama'));

ALTER TABLE content_library DROP CONSTRAINT IF EXISTS content_library_category_check;
ALTER TABLE content_library ADD CONSTRAINT content_library_category_check
CHECK (category IN ('ilustracoes', 'esboços', 'citacoes', 'referencias_cruzadas', 'personagens', 'parabolas', 'milagres', 'quiz', 'panorama'));
