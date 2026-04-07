-- Delete English and Spanish test articles (auto-generated duplicates)
DELETE FROM materials WHERE id IN (
  '0a8212fa-8d37-432e-8a36-2066a23d30c1',
  '00a08a26-2b16-4193-b1b6-b29230bfbadb',
  '8ec24431-fc4c-49d2-b5c8-467cd58ecb7b',
  '0f03d97c-3695-4e81-8c05-efc1378ef1ba',
  '1ef7fd7c-62c4-47a0-9e30-ddfb8d0a0ced',
  '82e866f5-9fa5-46ce-bb5e-51ec9abd20e4',
  'fdd8b9f3-3e0d-4ca2-a910-dc6cd6ed09e4',
  'e2f94d56-b384-44c9-a303-4a7a010c99f6',
  'a979e8da-434e-4520-a829-cd906b59a1fe',
  'aeaa2268-797b-4d4a-b7f4-3a9462b42eb1',
  'b1b390c7-bba2-4930-a81a-a6e9ca0a75ae',
  'fe88e11b-3f8e-4897-b592-6fe5aeff40e4',
  'c9ed21ff-cbf6-4ad9-92cf-83cd13ce2026',
  '5d1f208c-3c4a-4c4d-9416-73ff948d4f9c'
);

-- Clean up prefixes from remaining article titles
UPDATE materials SET title = regexp_replace(title, '^Blog & Artigos\s*[-—–:]\s*', '', 'i') WHERE title ~* '^Blog & Artigos';
UPDATE materials SET title = regexp_replace(title, '^Sermão\s*[-—–:]\s*', '', 'i') WHERE title ~* '^Sermão\s*[-—–:]';
UPDATE materials SET title = regexp_replace(title, '^Pesquisa Lexical\s*[-—–:]\s*', '', 'i') WHERE title ~* '^Pesquisa Lexical\s*[-—–:]';