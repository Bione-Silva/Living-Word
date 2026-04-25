const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase URL or KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PARABOLAS = [
  { numero:1, titulo:'O Semeador', referencia:'Mateus 13:3-23', evangelho:'Mateus', temas:['ensino','reino'], mensagem_central: 'A parábola inverte a expectativa: o foco não está no semeador (qualidade), mas no solo (receptividade). Jesus redefine produtividade espiritual.' },
  { numero:2, titulo:'O Joio e o Trigo', referencia:'Mateus 13:24-30', evangelho:'Mateus', temas:['juízo','paciência'] },
  { numero:3, titulo:'O Grão de Mostarda', referencia:'Mateus 13:31-32', evangelho:'Mateus', temas:['reino','crescimento'] },
  { numero:4, titulo:'O Fermento', referencia:'Mateus 13:33', evangelho:'Mateus', temas:['reino','transformação'] },
  { numero:5, titulo:'O Tesouro Escondido', referencia:'Mateus 13:44', evangelho:'Mateus', temas:['reino','valor'] },
  { numero:6, titulo:'A Pérola de Grande Valor', referencia:'Mateus 13:45-46', evangelho:'Mateus', temas:['reino','decisão'] },
  { numero:7, titulo:'A Rede', referencia:'Mateus 13:47-50', evangelho:'Mateus', temas:['juízo','separação'] },
  { numero:8, titulo:'O Credor Incompassivo', referencia:'Mateus 18:23-35', evangelho:'Mateus', temas:['perdão','graça'] },
  { numero:9, titulo:'Os Trabalhadores da Vinha', referencia:'Mateus 20:1-16', evangelho:'Mateus', temas:['graça','justiça'] },
  { numero:10, titulo:'Os Dois Filhos', referencia:'Mateus 21:28-32', evangelho:'Mateus', temas:['obediência','arrependimento'] },
  { numero:11, titulo:'Os Lavradores Maus', referencia:'Mateus 21:33-46', evangelho:'Mateus', temas:['juízo','rejeição'] },
  { numero:12, titulo:'A Festa de Casamento', referencia:'Mateus 22:1-14', evangelho:'Mateus', temas:['convite','juízo'] },
  { numero:13, titulo:'As Dez Virgens', referencia:'Mateus 25:1-13', evangelho:'Mateus', temas:['preparo','vigilância'] },
  { numero:14, titulo:'Os Talentos', referencia:'Mateus 25:14-30', evangelho:'Mateus', temas:['fidelidade','mordomia'] },
  { numero:15, titulo:'O Bom Samaritano', referencia:'Lucas 10:30-37', evangelho:'Lucas', temas:['amor','próximo'] },
  { numero:16, titulo:'O Amigo Importuno', referencia:'Lucas 11:5-13', evangelho:'Lucas', temas:['oração','persistência'] },
  { numero:17, titulo:'O Rico Insensato', referencia:'Lucas 12:16-21', evangelho:'Lucas', temas:['avareza','morte'] },
  { numero:18, titulo:'A Figueira Estéril', referencia:'Lucas 13:6-9', evangelho:'Lucas', temas:['juízo','oportunidade'] },
  { numero:19, titulo:'A Ovelha Perdida', referencia:'Lucas 15:3-7', evangelho:'Lucas', temas:['busca','alegria'] },
  { numero:20, titulo:'A Moeda Perdida', referencia:'Lucas 15:8-10', evangelho:'Lucas', temas:['busca','valor'] },
  { numero:21, titulo:'O Filho Pródigo', referencia:'Lucas 15:11-32', evangelho:'Lucas', temas:['graça','restauração'] },
  { numero:22, titulo:'O Administrador Infiel', referencia:'Lucas 16:1-13', evangelho:'Lucas', temas:['sabedoria','dinheiro'] },
  { numero:23, titulo:'O Rico e Lázaro', referencia:'Lucas 16:19-31', evangelho:'Lucas', temas:['juízo','compaixão'] },
  { numero:24, titulo:'O Juiz Iníquo', referencia:'Lucas 18:1-8', evangelho:'Lucas', temas:['oração','justiça'] },
  { numero:25, titulo:'O Fariseu e o Publicano', referencia:'Lucas 18:9-14', evangelho:'Lucas', temas:['humildade','oração'] },
];

const CHARACTERS = [
  { numero:1, nome:'Abraão', cargo_funcao:'Patriarca', periodo_historico:'~2000 aC', testamento:'AT', temas:['fé','aliança'], biografia:'Pai da fé e patriarca do povo de Israel. Chamado por Deus para deixar Ur dos Caldeus e ir para uma terra desconhecida.' },
  { numero:2, nome:'Moisés', cargo_funcao:'Libertador / Legislador', periodo_historico:'~1400 aC', testamento:'AT', temas:['liderança','lei'], biografia:'Líder escolhido por Deus para guiar os israelitas.' },
  { numero:3, nome:'Davi', cargo_funcao:'Rei / Salmista', periodo_historico:'~1000 aC', testamento:'AT', temas:['adoração','pecado'], biografia:'Homem segundo o coração de Deus.' },
  { numero:4, nome:'Elias', cargo_funcao:'Profeta', periodo_historico:'~850 aC', testamento:'AT', temas:['fé','confronto'], biografia:'Profeta do fogo.' },
  { numero:5, nome:'Daniel', cargo_funcao:'Profeta / Estadista', periodo_historico:'~600 aC', testamento:'AT', temas:['fidelidade'], biografia:'Fiel no exílio.' },
  { numero:6, nome:'Ester', cargo_funcao:'Rainha', periodo_historico:'~480 aC', testamento:'AT', temas:['coragem'], biografia:'Rainha escolhida.' },
  { numero:7, nome:'Pedro', cargo_funcao:'Apóstolo', periodo_historico:'~30 dC', testamento:'NT', temas:['liderança','falha'], biografia:'A pedra.' },
  { numero:8, nome:'Paulo', cargo_funcao:'Apóstolo', periodo_historico:'~35-67 dC', testamento:'NT', temas:['missão'], biografia:'Apóstolo dos gentios.' },
  { numero:9, nome:'Maria Madalena', cargo_funcao:'Discípula', periodo_historico:'~30 dC', testamento:'NT', temas:['fé','restauração'], biografia:'Primeira testemunha da ressurreição.' },
  { numero:10, nome:'Rute', cargo_funcao:'Estrangeira fiel', periodo_historico:'~1100 aC', testamento:'AT', temas:['lealdade'], biografia:'A moabita que entrou para a linhagem de Cristo.' },
  { numero:11, nome:'José', cargo_funcao:'Patriarca / Governador', periodo_historico:'~1800 aC', testamento:'AT', temas:['perdão','sonhos'], biografia:'Governador do Egito.' },
  { numero:12, nome:'Josué', cargo_funcao:'Líder Militar', periodo_historico:'~1400 aC', testamento:'AT', temas:['coragem','obediência'], biografia:'Sucessor de Moisés.' },
  { numero:13, nome:'Samuel', cargo_funcao:'Profeta / Juiz', periodo_historico:'~1050 aC', testamento:'AT', temas:['chamado','serviço'], biografia:'Último juiz.' },
  { numero:14, nome:'Salomão', cargo_funcao:'Rei / Sábio', periodo_historico:'~970 aC', testamento:'AT', temas:['sabedoria','queda'], biografia:'O homem mais sábio.' },
  { numero:15, nome:'Isaías', cargo_funcao:'Profeta', periodo_historico:'~740 aC', testamento:'AT', temas:['visão','messias'], biografia:'Profeta messiânico.' },
  { numero:16, nome:'Jeremias', cargo_funcao:'Profeta', periodo_historico:'~626 aC', testamento:'AT', temas:['sofrimento','fidelidade'], biografia:'O profeta chorão.' },
  { numero:17, nome:'João Batista', cargo_funcao:'Profeta / Precursor', periodo_historico:'~30 dC', testamento:'NT', temas:['arrependimento'], biografia:'A voz que clama no deserto.' },
  { numero:18, nome:'Tiago', cargo_funcao:'Apóstolo', periodo_historico:'~30-62 dC', testamento:'NT', temas:['obras','fé'], biografia:'Irmão do Senhor.' },
  { numero:19, nome:'Barnabé', cargo_funcao:'Apóstolo / Encorajador', periodo_historico:'~35-61 dC', testamento:'NT', temas:['encorajamento'], biografia:'Filho da consolação.' },
  { numero:20, nome:'Maria, mãe de Jesus', cargo_funcao:'Mãe do Messias', periodo_historico:'~6 aC-33 dC', testamento:'NT', temas:['fé','humildade'], biografia:'Mãe do Salvador.' },
];

const BOOKS = [
  { numero_canon:1, nome:'Gênesis', abreviacao:'Gn', testamento:'AT', secao:'Pentateuco', autor:'Moisés', total_capitulos:50 },
  { numero_canon:2, nome:'Êxodo', abreviacao:'Ex', testamento:'AT', secao:'Pentateuco', autor:'Moisés', total_capitulos:40 },
  { numero_canon:3, nome:'Levítico', abreviacao:'Lv', testamento:'AT', secao:'Pentateuco', autor:'Moisés', total_capitulos:27 },
  { numero_canon:4, nome:'Números', abreviacao:'Nm', testamento:'AT', secao:'Pentateuco', autor:'Moisés', total_capitulos:36 },
  { numero_canon:5, nome:'Deuteronômio', abreviacao:'Dt', testamento:'AT', secao:'Pentateuco', autor:'Moisés', total_capitulos:34 },
  { numero_canon:19, nome:'Salmos', abreviacao:'Sl', testamento:'AT', secao:'Poético', autor:'Davi e outros', total_capitulos:150 },
  { numero_canon:20, nome:'Provérbios', abreviacao:'Pv', testamento:'AT', secao:'Poético', autor:'Salomão', total_capitulos:31 },
  { numero_canon:23, nome:'Isaías', abreviacao:'Is', testamento:'AT', secao:'Prof. Maior', autor:'Isaías', total_capitulos:66 },
  { numero_canon:24, nome:'Jeremias', abreviacao:'Jr', testamento:'AT', secao:'Prof. Maior', autor:'Jeremias', total_capitulos:52 },
  { numero_canon:39, nome:'Malaquias', abreviacao:'Ml', testamento:'AT', secao:'Prof. Menor', autor:'Malaquias', total_capitulos:4 },
  { numero_canon:40, nome:'Mateus', abreviacao:'Mt', testamento:'NT', secao:'Evangelho', autor:'Mateus', total_capitulos:28 },
  { numero_canon:41, nome:'Marcos', abreviacao:'Mc', testamento:'NT', secao:'Evangelho', autor:'Marcos', total_capitulos:16 },
  { numero_canon:42, nome:'Lucas', abreviacao:'Lc', testamento:'NT', secao:'Evangelho', autor:'Lucas', total_capitulos:24 },
  { numero_canon:43, nome:'João', abreviacao:'Jo', testamento:'NT', secao:'Evangelho', autor:'João', total_capitulos:21 },
  { numero_canon:44, nome:'Atos', abreviacao:'At', testamento:'NT', secao:'Histórico', autor:'Lucas', total_capitulos:28 },
  { numero_canon:45, nome:'Romanos', abreviacao:'Rm', testamento:'NT', secao:'Paulina', autor:'Paulo', total_capitulos:16 },
  { numero_canon:46, nome:'1 Coríntios', abreviacao:'1Co', testamento:'NT', secao:'Paulina', autor:'Paulo', total_capitulos:16 },
  { numero_canon:48, nome:'Gálatas', abreviacao:'Gl', testamento:'NT', secao:'Paulina', autor:'Paulo', total_capitulos:6 },
  { numero_canon:49, nome:'Efésios', abreviacao:'Ef', testamento:'NT', secao:'Paulina', autor:'Paulo', total_capitulos:6 },
  { numero_canon:58, nome:'Hebreus', abreviacao:'Hb', testamento:'NT', secao:'Epístola Geral', autor:'Desconhecido', total_capitulos:13 },
  { numero_canon:66, nome:'Apocalipse', abreviacao:'Ap', testamento:'NT', secao:'Profecia', autor:'João', total_capitulos:22 },
];

async function seed() {
  console.log("Seeding parables...");
  const { error: err1 } = await supabase.from('lw_parables').upsert(PARABOLAS, { onConflict: 'numero' });
  if (err1) console.error("Error seeding parables:", err1);
  else console.log("Parables seeded.");

  console.log("Seeding characters...");
  const { error: err2 } = await supabase.from('lw_characters').upsert(CHARACTERS, { onConflict: 'numero' });
  if (err2) console.error("Error seeding characters:", err2);
  else console.log("Characters seeded.");

  console.log("Seeding books...");
  const { error: err3 } = await supabase.from('lw_bible_books').upsert(BOOKS, { onConflict: 'numero_canon' });
  if (err3) console.error("Error seeding books:", err3);
  else console.log("Books seeded.");
}

seed();
