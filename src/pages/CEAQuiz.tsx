import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/quiz-lw.css';

const T: Record<string, Record<string, string>> = {
  title: { PT:'Quiz Bíblico', EN:'Bible Quiz', ES:'Quiz Bíblico' },
  sub: { PT:'Teste seus conhecimentos com perguntas geradas por IA sobre parábolas, personagens e livros.', EN:'Test your knowledge with AI-generated questions.', ES:'Pon a prueba tus conocimientos.' },
  back: { PT:'← Voltar ao Centro', EN:'← Back to Center', ES:'← Volver' },
  selCat: { PT:'Categoria', EN:'Category', ES:'Categoría' },
  selDiff: { PT:'Dificuldade', EN:'Difficulty', ES:'Dificultad' },
  selSize: { PT:'Perguntas', EN:'Questions', ES:'Preguntas' },
  start: { PT:'Começar Desafio', EN:'Start Challenge', ES:'Iniciar Desafío' },
  question: { PT:'PERGUNTA', EN:'QUESTION', ES:'PREGUNTA' },
  correct: { PT:'✓ Correto!', EN:'✓ Correct!', ES:'✓ Correcto!' },
  wrong: { PT:'✗ Incorreto', EN:'✗ Incorrect', ES:'✗ Incorrecto' },
  timeout: { PT:'⏱ Tempo esgotado!', EN:'⏱ Time\'s up!', ES:'⏱ Tiempo agotado!' },
  next: { PT:'Avançar →', EN:'Next →', ES:'Siguiente →' },
  finish: { PT:'Ver Resultado', EN:'View Result', ES:'Ver Resultado' },
  resultTitle: { PT:'Seu Resultado', EN:'Your Result', ES:'Tu Resultado' },
  playAgain: { PT:'Jogar Novamente', EN:'Play Again', ES:'Jugar de Nuevo' }
};
const t = (k: string, l: string) => T[k]?.[l] || T[k]?.PT || k;

const FALLBACK_QUESTIONS = [
  {
    "n": 1,
    "q": "Qual o nome da pessoa com mais idade já mencionada na Bíblia?",
    "opts": {
      "A": "Noé (viveu 990 anos)",
      "B": "Enos (viveu 905 anos)",
      "C": "Matusalém (viveu 969 anos)",
      "D": "Sem (viveu 823 anos)"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 2,
    "q": "Qual personagem abaixo não teve seu nome mudado?",
    "opts": {
      "A": "Sara",
      "B": "Abraão",
      "C": "Jacó",
      "D": "Davi"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 3,
    "q": "Sobre o profeta Samuel, assinale a alternativa incorreta!",
    "opts": {
      "A": "Ana era a sua mãe",
      "B": "Ungiu os três reis de Israel (Saul, Davi e Salomão)",
      "C": "Sucedeu o profeta Eli",
      "D": "Teve uma visão quando ainda era novo"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 4,
    "q": "Deus usou um animal para falar com Balaão. Qual foi?",
    "opts": {
      "A": "Jumenta",
      "B": "Cordeiro",
      "C": "Pomba",
      "D": "Cavalo"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 5,
    "q": "Davi era pastor de ovelhas. Com quais animais ele lutou para proteger seu rebanho?",
    "opts": {
      "A": "Urso e Tigre",
      "B": "Leão e Águia",
      "C": "Leão e Urso",
      "D": "Cavalo e Urso"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 6,
    "q": "Qual o nome da ilha em que o apóstolo João escreveu o livro de Apocalipse?",
    "opts": {
      "A": "Ilha de Malta",
      "B": "Ilha de Creta",
      "C": "Ilha de Pátmos",
      "D": "Ilha de Pérgamo"
    },
    "c": "C",
    "cat": "NT"
  },
  {
    "n": 7,
    "q": "Em quais livros da Bíblia contam a história do nascimento de Jesus?",
    "opts": {
      "A": "Mateus, Marcos, Lucas e João",
      "B": "Somente Mateus",
      "C": "Mateus e Marcos",
      "D": "Mateus e Lucas"
    },
    "c": "D",
    "cat": "Jesus"
  },
  {
    "n": 8,
    "q": "Quantos casais humanos entraram na arca de Noé?",
    "opts": {
      "A": "4 casais",
      "B": "1 casal",
      "C": "2 casais",
      "D": "3 casais"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 9,
    "q": "Qual discípulo negou a Jesus?",
    "opts": {
      "A": "Judas Iscariotes",
      "B": "Pedro",
      "C": "Bartolomeu",
      "D": "João"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 10,
    "q": "Qual o nome da cidade fundada por Caim, depois que saiu da presença de Deus?",
    "opts": {
      "A": "Sodoma",
      "B": "Gomorra",
      "C": "Enoque",
      "D": "Ur"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 11,
    "q": "Judas traiu a Jesus por qual valor?",
    "opts": {
      "A": "10 moedas de ouro",
      "B": "20 moedas de prata",
      "C": "30 moedas de ouro",
      "D": "30 moedas de prata"
    },
    "c": "D",
    "cat": "Jesus"
  },
  {
    "n": 12,
    "q": "Qual o nome dos dois irmãos de Moisés?",
    "opts": {
      "A": "Esaú e Jacó",
      "B": "Josué e Calebe",
      "C": "Priscila e Aquila",
      "D": "Miriã e Arão"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 13,
    "q": "Quem foi o juiz hebreu que Dalila seduziu para entregar ao exército filisteu?",
    "opts": {
      "A": "Salomão",
      "B": "Jefté",
      "C": "Sansão",
      "D": "Abimeleque"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 14,
    "q": "Como e onde aconteceu a conversão do apóstolo Paulo?",
    "opts": {
      "A": "Pescando com os discípulos",
      "B": "Sonhando que via Jesus",
      "C": "Ouvindo o Evangelho numa sinagoga",
      "D": "A caminho de Damasco para perseguir cristãos"
    },
    "c": "D",
    "cat": "NT"
  },
  {
    "n": 15,
    "q": "Quantos livros tem a Bíblia Protestante?",
    "opts": {
      "A": "72 Livros",
      "B": "66 Livros",
      "C": "88 Livros",
      "D": "91 Livros"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 16,
    "q": "Qual o significado original da palavra 'Bíblia'?",
    "opts": {
      "A": "Bíblia é o plural de 'biblos' do grego e significa conjunto de livros",
      "B": "Bíblia quer dizer em hebraico 'escritos religiosos'",
      "C": "No original, Bíblia significa 'livros religiosos'",
      "D": "No original, Bíblia significa 'palavra escrita por homens'"
    },
    "c": "A",
    "cat": "Estrutura"
  },
  {
    "n": 17,
    "q": "De acordo com 2 Timóteo 3:16, toda a Escritura é:",
    "opts": {
      "A": "Ditada por Deus, palavra por palavra",
      "B": "Inspirada por Deus e útil para seus propósitos",
      "C": "Influenciada pelos homens que a escreveram",
      "D": "Inspirada pelos anjos aos homens"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 18,
    "q": "Como a Bíblia está dividida?",
    "opts": {
      "A": "Pentateuco e Evangelhos",
      "B": "Antigo e Novo Testamento",
      "C": "Livro da Lei e Livro da Graça",
      "D": "Pentateuco, Salmos, Profetas e Novo Testamento"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 19,
    "q": "Qual é o tema central da Bíblia?",
    "opts": {
      "A": "Salvação em Cristo Jesus",
      "B": "Justiça de Deus",
      "C": "Amor de Deus",
      "D": "História de Jesus"
    },
    "c": "A",
    "cat": "Estrutura"
  },
  {
    "n": 20,
    "q": "Qual é o menor versículo da Bíblia?",
    "opts": {
      "A": "João 11:35",
      "B": "Ester 8:9",
      "C": "Êxodo 20:13",
      "D": "Jó 3:2"
    },
    "c": "A",
    "cat": "Estrutura"
  },
  {
    "n": 21,
    "q": "Qual o nome da cidade onde Jesus nasceu?",
    "opts": {
      "A": "Nazaré",
      "B": "Jerusalém",
      "C": "Belém",
      "D": "Galileia"
    },
    "c": "C",
    "cat": "Jesus"
  },
  {
    "n": 22,
    "q": "Com que idade Jesus começou seu ministério?",
    "opts": {
      "A": "Com 12 anos de idade",
      "B": "Quando nasceu",
      "C": "Com aproximadamente 30 anos de idade",
      "D": "Na sua adolescência"
    },
    "c": "C",
    "cat": "Jesus"
  },
  {
    "n": 23,
    "q": "Sobre Jesus, é errado dizer:",
    "opts": {
      "A": "Jesus pecou em poucas situações",
      "B": "Jesus Cristo é Deus",
      "C": "Jesus foi 100% humano",
      "D": "Jesus ressuscitou ao terceiro dia"
    },
    "c": "A",
    "cat": "Jesus"
  },
  {
    "n": 24,
    "q": "Qual foi o primeiro milagre de Jesus?",
    "opts": {
      "A": "Curou o cego Bartimeu",
      "B": "Andou sobre as águas",
      "C": "Multiplicou os pães e peixes",
      "D": "Transformou a água em vinho"
    },
    "c": "D",
    "cat": "Jesus"
  },
  {
    "n": 25,
    "q": "Qual mulher foi tida por bêbada enquanto orava pedindo um filho ao Senhor?",
    "opts": {
      "A": "Raquel",
      "B": "Ester",
      "C": "Ana",
      "D": "Bete-Saba"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 26,
    "q": "Quem foi a mulher sensata que impediu Davi de destruir Nabal?",
    "opts": {
      "A": "Abigail",
      "B": "Mical",
      "C": "Bete-Saba",
      "D": "Merabe"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 27,
    "q": "Qual o nome da filha mais velha de Saul prometida em casamento a Davi, mas dada a outro?",
    "opts": {
      "A": "Sulamita",
      "B": "Mical",
      "C": "Tamar",
      "D": "Merabe"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 28,
    "q": "Qual mulher desejou mudar seu próprio nome para Mara (significa amarga)?",
    "opts": {
      "A": "Ana",
      "B": "Noemi",
      "C": "Orfa",
      "D": "Ester"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 29,
    "q": "Com quantos anos Davi foi ungido a rei?",
    "opts": {
      "A": "Aprox. 27 anos",
      "B": "Aprox. 39 anos",
      "C": "Aprox. 19 anos",
      "D": "Aprox. 16 anos"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 30,
    "q": "Quem era a mulher que ameaçou de morte ao profeta Elias?",
    "opts": {
      "A": "Ester",
      "B": "Jerusa",
      "C": "Jezabel",
      "D": "A viúva de Serepta"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 31,
    "q": "Quantos anos viveu Sara?",
    "opts": {
      "A": "176 anos",
      "B": "127 anos",
      "C": "117 anos",
      "D": "106 anos"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 32,
    "q": "Qual era o ofício de Priscila?",
    "opts": {
      "A": "Vendedora",
      "B": "Fabricante de tendas",
      "C": "Fabricante de ídolos",
      "D": "Serva do Rei"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 33,
    "q": "Qual o nome do primeiro casal criado por Deus?",
    "opts": {
      "A": "João e Maria",
      "B": "Abrão e Sara",
      "C": "Adão e Eva",
      "D": "Moisés e Isabel"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 34,
    "q": "O que Deus disse para Noé construir?",
    "opts": {
      "A": "Um altar em honra a Deus",
      "B": "Uma torre muito alta",
      "C": "Um Templo",
      "D": "Uma arca onde seriam salvos do dilúvio"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 35,
    "q": "Qual foi o sinal que Deus deu a Noé, como promessa de não mais destruir a terra com água?",
    "opts": {
      "A": "Um arco-íris",
      "B": "Uma cruz",
      "C": "Um castiçal",
      "D": "Um anel de ouro"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 36,
    "q": "Qual o nome do menino que venceu o gigante Golias?",
    "opts": {
      "A": "Davi",
      "B": "Daniel",
      "C": "Levi",
      "D": "Salomão"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 37,
    "q": "Quantos eram os discípulos de Jesus?",
    "opts": {
      "A": "2",
      "B": "7",
      "C": "12",
      "D": "16"
    },
    "c": "C",
    "cat": "Jesus"
  },
  {
    "n": 38,
    "q": "Em qual livro bíblico está escrito 'O Senhor é o meu pastor, nada me faltará'?",
    "opts": {
      "A": "Romanos",
      "B": "Provérbios",
      "C": "Salmos",
      "D": "Juízes"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 39,
    "q": "Que profeta foi engolido por um grande peixe?",
    "opts": {
      "A": "Amós",
      "B": "Elias",
      "C": "Obadias",
      "D": "Jonas"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 40,
    "q": "Sou o filho prometido por Deus a Abraão. Quem sou eu?",
    "opts": {
      "A": "Ló",
      "B": "Jonatas",
      "C": "Isaque",
      "D": "Ismael"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 41,
    "q": "Quem foi o líder usado por Deus para libertar os israelitas da escravidão no Egito?",
    "opts": {
      "A": "Arão",
      "B": "Moisés",
      "C": "Josué",
      "D": "Abraão"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 42,
    "q": "Sou a mulher estéril que orei pedindo um filho. Entreguei-o ao Senhor para servi-lo por toda a vida. Quem sou eu?",
    "opts": {
      "A": "Maria",
      "B": "Isabel",
      "C": "Ana",
      "D": "Sara"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 43,
    "q": "Sou o 1º filho de Adão, odiei e matei o meu irmão por inveja. Quem sou eu?",
    "opts": {
      "A": "Abel",
      "B": "Caim",
      "C": "Sem",
      "D": "Sete"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 44,
    "q": "Fui lançado numa cova de leões famintos, porque não deixei de orar a Deus. Quem sou eu?",
    "opts": {
      "A": "Sadraque",
      "B": "Daniel",
      "C": "Levi",
      "D": "Elias"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 45,
    "q": "Pedi a Deus sabedoria e me tornei o homem mais sábio da terra. Quem sou eu?",
    "opts": {
      "A": "Samuel",
      "B": "Davi",
      "C": "Salomão",
      "D": "Eliseu"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 46,
    "q": "Eu vestia roupas de pelos de camelos e comia gafanhotos e mel. Batizava e pregava o arrependimento. Quem sou eu?",
    "opts": {
      "A": "João Batista",
      "B": "Apóstolo João",
      "C": "Apóstolo Paulo",
      "D": "Jesus Cristo"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 47,
    "q": "Qual o nome dos filhos de Isaque?",
    "opts": {
      "A": "Sem, Cam e Jafé",
      "B": "Elias e Eliseu",
      "C": "José e Benjamim",
      "D": "Esaú e Jacó"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 48,
    "q": "Quais dessas não fazem parte das 10 pragas do Egito?",
    "opts": {
      "A": "Praga das moscas e praga do sangue",
      "B": "Peste dos animais e praga das rãs",
      "C": "Praga das serpentes e praga da esterilidade",
      "D": "Praga dos gafanhotos e morte dos primogênitos"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 49,
    "q": "Que cidade foi conquistada pelos israelitas rodeando-a por 7 dias, ao som de trombetas?",
    "opts": {
      "A": "Canaã",
      "B": "Jericó",
      "C": "Midiã",
      "D": "Jerusalém"
    },
    "c": "B",
    "cat": "AT"
  },
  {
    "n": 50,
    "q": "Quem foi chamado por Deus, ainda menino, para ser profeta e juiz em Israel?",
    "opts": {
      "A": "Sansão",
      "B": "Eliseu",
      "C": "Jeremias",
      "D": "Samuel"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 51,
    "q": "Qual o nome dos 3 amigos de Daniel que foram lançados numa fornalha de fogo ardente?",
    "opts": {
      "A": "Elifaz, Bildade e Zofar",
      "B": "Josué, Calebe e Jefoné",
      "C": "Jeremias, Isaías e Malaquias",
      "D": "Sadraque, Mesaque e Abedenego"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 52,
    "q": "Quem vendeu José para uma caravana de ismaelitas?",
    "opts": {
      "A": "Potifar, oficial do Faraó",
      "B": "Jacó, durante a seca",
      "C": "O carcereiro da prisão",
      "D": "Seus irmãos, por inveja"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 53,
    "q": "Qual o nome do anjo que anunciou o nascimento de Jesus Cristo e de João Batista?",
    "opts": {
      "A": "Miguel",
      "B": "Gabriel",
      "C": "Serafim",
      "D": "Santos"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 54,
    "q": "Qual foi o único episódio registrado sobre a adolescência de Jesus na Bíblia?",
    "opts": {
      "A": "Jesus ressuscitou um pássaro, aos 6 anos",
      "B": "Jesus visitou o templo em Jerusalém e foi encontrado entre os mestres, aos 12 anos",
      "C": "Jesus era ensinado na escola de Gamaliel",
      "D": "Jesus ajudava José a fabricar barcos e móveis"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 55,
    "q": "Durante quantos dias Jesus foi tentado no deserto pelo diabo?",
    "opts": {
      "A": "25",
      "B": "33",
      "C": "35",
      "D": "40"
    },
    "c": "D",
    "cat": "Jesus"
  },
  {
    "n": 56,
    "q": "Destes apóstolos, qual não foi um dos 12 discípulos de Jesus?",
    "opts": {
      "A": "Tiago",
      "B": "Pedro",
      "C": "Paulo",
      "D": "João"
    },
    "c": "C",
    "cat": "NT"
  },
  {
    "n": 57,
    "q": "Que apóstolo teve a visão do fim dos tempos, descrita no livro do Apocalipse?",
    "opts": {
      "A": "João",
      "B": "Pedro",
      "C": "Paulo",
      "D": "Mateus"
    },
    "c": "A",
    "cat": "NT"
  },
  {
    "n": 58,
    "q": "Segundo Jesus, quais são os mandamentos mais importantes?",
    "opts": {
      "A": "Não matar e não adulterar",
      "B": "Amar a Deus e honrar pai e mãe",
      "C": "Amar a Deus sobre todas as coisas e ao próximo como a si mesmo",
      "D": "Não fazer ídolos nem adorar imagens"
    },
    "c": "C",
    "cat": "Jesus"
  },
  {
    "n": 59,
    "q": "Que animal fez um som enquanto Pedro negava Jesus?",
    "opts": {
      "A": "Uma coruja chirriou",
      "B": "Um lobo uivou",
      "C": "Uma ovelha baliu",
      "D": "Um galo cantou"
    },
    "c": "D",
    "cat": "Jesus"
  },
  {
    "n": 60,
    "q": "Em João 14:6 Jesus disse: 'Eu sou... ninguém vem ao Pai senão por mim'. Complete corretamente.",
    "opts": {
      "A": "'Eu sou a videira verdadeira...'",
      "B": "'Eu sou o caminho, a verdade e a vida...'",
      "C": "'Eu sou o pão vivo que desceu do céu...'",
      "D": "'Eu sou a luz do mundo e o sal da terra...'"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 61,
    "q": "O rei Salomão teve muitas esposas e concubinas. Quantas eram?",
    "opts": {
      "A": "7 princesas e 3 concubinas",
      "B": "27 princesas e 30 concubinas",
      "C": "70 princesas e 130 concubinas",
      "D": "700 princesas e 300 concubinas"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 62,
    "q": "Quem foi a mãe de Caim, Abel e Sete?",
    "opts": {
      "A": "Eva",
      "B": "Ana",
      "C": "Lia",
      "D": "Raquel"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 63,
    "q": "O nome Adão, 'Adam' em hebraico significa:",
    "opts": {
      "A": "Primeiro, Primogênito",
      "B": "Pai, Patriarca",
      "C": "Semelhante, Parecido",
      "D": "Solo, Terra"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 64,
    "q": "Sobre Jesus, é correto afirmar:",
    "opts": {
      "A": "Nasceu na cidade de Nazaré",
      "B": "Não foi filho único de Maria e José",
      "C": "Seu sobrenome era Cristo",
      "D": "Jesus nunca falou sobre o inferno"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 65,
    "q": "Quantos magos do Oriente foram visitar o bebê Jesus, segundo a Bíblia?",
    "opts": {
      "A": "2",
      "B": "3",
      "C": "5",
      "D": "Nenhum"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 66,
    "q": "Qual o maior livro da Bíblia?",
    "opts": {
      "A": "Jeremias",
      "B": "Salmos",
      "C": "Gênesis",
      "D": "Isaías"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 67,
    "q": "Qual autor bíblico escreveu mais de 5 mil canções?",
    "opts": {
      "A": "Davi",
      "B": "Asafe",
      "C": "Salomão",
      "D": "Moisés"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 68,
    "q": "Quais os livros da Bíblia que possuem apenas 1 capítulo?",
    "opts": {
      "A": "Obadias, Filemom, Judas, 2ª João e 3ª João",
      "B": "Amós, 2ª Pedro, 2ª João e 3ª João",
      "C": "Naum, Obadias, Joel e Judas",
      "D": "Habacuque, Filemom, Esdras, 1ª Pedro e 2ª Pedro"
    },
    "c": "A",
    "cat": "Estrutura"
  },
  {
    "n": 69,
    "q": "O que Deus fez para interromper a construção da Torre de Babel?",
    "opts": {
      "A": "Destruiu a torre com um grande terremoto",
      "B": "Confundiu a língua dos homens e os espalhou pela terra",
      "C": "Fez com que a torre fosse invadida por povos inimigos",
      "D": "Enviou pragas e fogo para consumir a construção"
    },
    "c": "B",
    "cat": "AT"
  },
  {
    "n": 70,
    "q": "Qual o nome do sogro de Jacó que o enganou dando-lhe a filha mais velha, em vez de Raquel?",
    "opts": {
      "A": "Labão",
      "B": "Naor",
      "C": "Betuel",
      "D": "Jetro"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 71,
    "q": "Qual rei da história ficou leproso?",
    "opts": {
      "A": "Josias",
      "B": "Uzias",
      "C": "Josafá",
      "D": "Acazias"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 72,
    "q": "Qual dos profetas fez flutuar o ferro de um machado?",
    "opts": {
      "A": "Elias",
      "B": "Eliseu",
      "C": "Isaías",
      "D": "Ezequiel"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 73,
    "q": "Qual foi o primeiro mártir da história da Igreja?",
    "opts": {
      "A": "Saulo",
      "B": "Matias",
      "C": "Tiago",
      "D": "Estevão"
    },
    "c": "D",
    "cat": "NT"
  },
  {
    "n": 74,
    "q": "Qual dos discípulos substituiu Judas Iscariotes depois da ressurreição de Jesus?",
    "opts": {
      "A": "Matias",
      "B": "Mateus",
      "C": "José, o justo",
      "D": "Saulo"
    },
    "c": "A",
    "cat": "NT"
  },
  {
    "n": 75,
    "q": "Quem discursou no dia de Pentecostes, tendo o resultado de quase 3 mil almas acrescentadas?",
    "opts": {
      "A": "Pedro",
      "B": "Paulo",
      "C": "Barnabé",
      "D": "Mateus"
    },
    "c": "A",
    "cat": "NT"
  },
  {
    "n": 76,
    "q": "Qual dessas parábolas ensina sobre o amor ao próximo?",
    "opts": {
      "A": "Parábola do Joio",
      "B": "Parábola da rede",
      "C": "Parábola do bom samaritano",
      "D": "Parábola dos dois filhos"
    },
    "c": "C",
    "cat": "Jesus"
  },
  {
    "n": 77,
    "q": "Qual destes livros não foi escrito pelo apóstolo Paulo?",
    "opts": {
      "A": "Tito",
      "B": "Filemom",
      "C": "Tiago",
      "D": "Romanos"
    },
    "c": "C",
    "cat": "Estrutura"
  },
  {
    "n": 78,
    "q": "Quantos homens foram alimentados com os vinte pães abençoados por Eliseu?",
    "opts": {
      "A": "40",
      "B": "60",
      "C": "80",
      "D": "100"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 79,
    "q": "O que aconteceu quando Paulo e Silas oravam e louvavam a Deus na prisão?",
    "opts": {
      "A": "Um tsunami",
      "B": "Um terremoto",
      "C": "Um vendaval muito forte",
      "D": "A noite se tornou dia"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 80,
    "q": "Quem morreu ao tentar proteger a Arca da Aliança de uma possível queda?",
    "opts": {
      "A": "Uzá",
      "B": "Sangar",
      "C": "Teófilo",
      "D": "Mesaque"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 81,
    "q": "Que homem pretendia exterminar todos os judeus nos dias da rainha Ester?",
    "opts": {
      "A": "Acã",
      "B": "Naamã",
      "C": "Hamã",
      "D": "Issacar"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 82,
    "q": "Qual era o outro nome do profeta Daniel?",
    "opts": {
      "A": "Beltessazar",
      "B": "Sadraque",
      "C": "Iraque",
      "D": "Jedidias"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 83,
    "q": "Como a Bíblia descreve Hofni e Fineias?",
    "opts": {
      "A": "Néscios",
      "B": "Filhos da Sabedoria",
      "C": "Filhos de Belial",
      "D": "Filhos da Juventude"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 84,
    "q": "Por quantos dias Paulo permaneceu cego?",
    "opts": {
      "A": "2",
      "B": "3",
      "C": "4",
      "D": "5"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 85,
    "q": "Quais eram os alimentos que os corvos traziam ao profeta Elias?",
    "opts": {
      "A": "Pão e carne",
      "B": "Leite e mel",
      "C": "Mel e gafanhotos",
      "D": "Queijo e peixes"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 86,
    "q": "Em que ilha Paulo estava quando foi mordido por uma víbora?",
    "opts": {
      "A": "Malvinas",
      "B": "Chipre",
      "C": "Malta",
      "D": "Malva"
    },
    "c": "C",
    "cat": "NT"
  },
  {
    "n": 87,
    "q": "Onde Eliseu se hospedava quando passava por Suném?",
    "opts": {
      "A": "Na casa de um leproso",
      "B": "Na casa de uma viúva pobre",
      "C": "Na casa de um militar",
      "D": "Na casa de uma mulher rica"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 88,
    "q": "Que amigo de Paulo foi neto de Loide e filho de Eunice?",
    "opts": {
      "A": "Tito",
      "B": "Timóteo",
      "C": "Filemom",
      "D": "Marcos"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 89,
    "q": "Por que Deus feriu os homens de Bete-Semes?",
    "opts": {
      "A": "Derrubaram a arca do Senhor",
      "B": "Olharam para o interior da arca do Senhor",
      "C": "Quebraram a arca do Senhor",
      "D": "Desdenharam da arca do Senhor"
    },
    "c": "B",
    "cat": "AT"
  },
  {
    "n": 90,
    "q": "O que acontecia quando alguém deixava do maná para o dia seguinte?",
    "opts": {
      "A": "Evaporava",
      "B": "Enchia de bichos e cheirava mal",
      "C": "Transformava-se em areia",
      "D": "Multiplicava-se"
    },
    "c": "B",
    "cat": "AT"
  },
  {
    "n": 91,
    "q": "Quais eram os nomes das noras de Noemi?",
    "opts": {
      "A": "Bila e Zilpa",
      "B": "Penina e Ana",
      "C": "Rute e Orfa",
      "D": "Raquel e Ester"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 92,
    "q": "O que aconteceu ao homem que contou a Davi que Saul estava morto?",
    "opts": {
      "A": "Teve todas as suas dívidas perdoadas",
      "B": "Davi mandou matá-lo",
      "C": "Foi homenageado",
      "D": "Foi condenado a prisão"
    },
    "c": "B",
    "cat": "AT"
  },
  {
    "n": 93,
    "q": "Nos dias de Samuel, como os profetas eram chamados?",
    "opts": {
      "A": "Diáconos",
      "B": "Anciãos",
      "C": "Videntes",
      "D": "Anátemas"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 94,
    "q": "Onde os discípulos de Jesus foram pela primeira vez chamados de cristãos?",
    "opts": {
      "A": "Jerusalém",
      "B": "Samaria",
      "C": "Roma",
      "D": "Antioquia"
    },
    "c": "D",
    "cat": "NT"
  },
  {
    "n": 95,
    "q": "Quantos livros tem o Antigo Testamento?",
    "opts": {
      "A": "27",
      "B": "33",
      "C": "39",
      "D": "45"
    },
    "c": "C",
    "cat": "Estrutura"
  },
  {
    "n": 96,
    "q": "Quantos livros tem o Novo Testamento?",
    "opts": {
      "A": "15",
      "B": "27",
      "C": "32",
      "D": "39"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 97,
    "q": "Quanto tempo a Bíblia demorou para ser escrita?",
    "opts": {
      "A": "Aproximadamente 1000 anos",
      "B": "Aproximadamente 1400 anos",
      "C": "Aproximadamente 1600 anos",
      "D": "Aproximadamente 2000 anos"
    },
    "c": "C",
    "cat": "Estrutura"
  },
  {
    "n": 98,
    "q": "Em quantas línguas a Bíblia foi escrita no original?",
    "opts": {
      "A": "2: Hebraico e Grego",
      "B": "2: Hebraico e Aramaico",
      "C": "1: Hebraico",
      "D": "3: Hebraico, Aramaico e Grego"
    },
    "c": "D",
    "cat": "Estrutura"
  },
  {
    "n": 99,
    "q": "Em quais continentes a Bíblia foi escrita originalmente?",
    "opts": {
      "A": "África e Ásia",
      "B": "Ásia e Europa",
      "C": "África, Europa e Ásia",
      "D": "África, Europa e América"
    },
    "c": "C",
    "cat": "Estrutura"
  },
  {
    "n": 100,
    "q": "Qual foi o primeiro livro da Bíblia a ser escrito?",
    "opts": {
      "A": "Jó",
      "B": "Gênesis",
      "C": "Deuteronômio",
      "D": "Isaías"
    },
    "c": "A",
    "cat": "Estrutura"
  },
  {
    "n": 101,
    "q": "Quais são os livros que fazem parte do Pentateuco?",
    "opts": {
      "A": "Gênesis, Êxodo, Levítico e Números",
      "B": "Gênesis, Êxodo, Levítico, Números e Josué",
      "C": "Gênesis, Êxodo, Levítico, Deuteronômio e Isaias",
      "D": "Gênesis, Êxodo, Levítico, Números e Deuteronômio"
    },
    "c": "D",
    "cat": "Estrutura"
  },
  {
    "n": 102,
    "q": "Qual dos livros abaixo não é poético?",
    "opts": {
      "A": "Romanos",
      "B": "Provérbios",
      "C": "Salmos",
      "D": "Eclesiastes"
    },
    "c": "A",
    "cat": "Estrutura"
  },
  {
    "n": 103,
    "q": "Qual livro abaixo não é um profeta menor?",
    "opts": {
      "A": "Amós",
      "B": "Filemom",
      "C": "Obadias",
      "D": "Jonas"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 104,
    "q": "Quem são os profetas maiores?",
    "opts": {
      "A": "Isaías, Jeremias, Lamentações, Ezequiel e Daniel",
      "B": "Isaías, Jeremias, Habacuque, Ezequiel e Daniel",
      "C": "Isaías, Jeremias, Lamentações, Amós e Daniel",
      "D": "Obadias, Jeremias, Lamentações, Ezequiel e Daniel"
    },
    "c": "A",
    "cat": "Estrutura"
  },
  {
    "n": 105,
    "q": "O que Deus criou no 5º dia?",
    "opts": {
      "A": "Separou a luz das trevas",
      "B": "Criou o sol, a lua e as estrelas",
      "C": "Criou as criaturas aquáticas e os pássaros",
      "D": "Criou o ser humano"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 106,
    "q": "Qual o nome do sobrinho que caminhou com seu tio Abraão?",
    "opts": {
      "A": "Jó",
      "B": "Ló",
      "C": "Abimeleque",
      "D": "Samuel"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 107,
    "q": "Quem foram as 4 mulheres de Jacó?",
    "opts": {
      "A": "Lia, Zilpa, Bila e Miriã",
      "B": "Zilpa, Raquel, Ester e Bila",
      "C": "Lia, Raquel, Zilpa e Bila",
      "D": "Lia, Raquel, Bila e Rute"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 108,
    "q": "O rei Saul é descendente de qual tribo de Israel?",
    "opts": {
      "A": "Benjamim",
      "B": "Dã",
      "C": "Issacar",
      "D": "Judá"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 109,
    "q": "Sansão é descendente de qual tribo de Israel?",
    "opts": {
      "A": "Dã",
      "B": "Rúben",
      "C": "Zebulom",
      "D": "Gade"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 110,
    "q": "Qual foi a primeira praga enviada ao Egito?",
    "opts": {
      "A": "Morte dos primogênitos",
      "B": "Granizo",
      "C": "Piolhos",
      "D": "A água se tornou em sangue"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 111,
    "q": "Quem foi o sucessor de Moisés para liderar o povo de Israel?",
    "opts": {
      "A": "José",
      "B": "Josué",
      "C": "Samuel",
      "D": "Os Juízes"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 112,
    "q": "Qual é o 8º livro da Bíblia?",
    "opts": {
      "A": "Juízes",
      "B": "Jó",
      "C": "Rute",
      "D": "Ester"
    },
    "c": "C",
    "cat": "Estrutura"
  },
  {
    "n": 121,
    "q": "Qual livro conta a história do profeta Elias?",
    "opts": {
      "A": "1 Samuel",
      "B": "2 Samuel",
      "C": "1 Reis",
      "D": "Ageu"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 122,
    "q": "Qual o nome dos dois filhos que Jacó teve com Zilpa?",
    "opts": {
      "A": "José e Benjamim",
      "B": "Ruben e Simeão",
      "C": "Gade e Aser",
      "D": "Dã e Naftali"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 123,
    "q": "O reino do Norte (Israel) foi invadido por qual povo?",
    "opts": {
      "A": "Babilônico",
      "B": "Assírio",
      "C": "Cananeu",
      "D": "Amorreu"
    },
    "c": "B",
    "cat": "AT"
  },
  {
    "n": 124,
    "q": "O reino do Sul (Judá) foi invadido por qual povo?",
    "opts": {
      "A": "Babilônico",
      "B": "Moabitas",
      "C": "Jebuzeus",
      "D": "Assírio"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 125,
    "q": "Qual o nome do filho de Saul que era muito amigo de Davi?",
    "opts": {
      "A": "Jônatas",
      "B": "Abner",
      "C": "Joabe",
      "D": "Ziba"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 126,
    "q": "Qual o nome do neto de Saul que era aleijado?",
    "opts": {
      "A": "Mefibosete",
      "B": "Jeosafá",
      "C": "Ailude",
      "D": "Zadoque"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 128,
    "q": "Qual o nome do pai do profeta Samuel?",
    "opts": {
      "A": "Isaías",
      "B": "Eli",
      "C": "Elcana",
      "D": "Zofim"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 140,
    "q": "A conversão do apóstolo Paulo acontece em qual capítulo do livro de Atos?",
    "opts": {
      "A": "Capítulo 2",
      "B": "Capítulo 7",
      "C": "Capítulo 9",
      "D": "Capítulo 15"
    },
    "c": "C",
    "cat": "NT"
  },
  {
    "n": 141,
    "q": "Quantos livros da Bíblia o apóstolo Paulo escreveu?",
    "opts": {
      "A": "7",
      "B": "12",
      "C": "13",
      "D": "16"
    },
    "c": "C",
    "cat": "Estrutura"
  },
  {
    "n": 147,
    "q": "Ao invés de ir para Nínive, Jonas embarcou rumo a qual cidade?",
    "opts": {
      "A": "Galileia",
      "B": "Ilha de Creta",
      "C": "Ilha de Pátmos",
      "D": "Tarsis"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 148,
    "q": "Qual pessoa tratou de sepultar o corpo de Jesus?",
    "opts": {
      "A": "Simão Cirineu",
      "B": "Gamaliel",
      "C": "José de Arimateia",
      "D": "Pilatos"
    },
    "c": "C",
    "cat": "Jesus"
  },
  {
    "n": 149,
    "q": "Qual a idade de Calebe ao entrar na Terra Prometida?",
    "opts": {
      "A": "85 anos",
      "B": "100 anos",
      "C": "120 anos",
      "D": "160 anos"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 150,
    "q": "Qual o último livro do Antigo Testamento?",
    "opts": {
      "A": "Habacuque",
      "B": "Malaquias",
      "C": "Miquéias",
      "D": "Obadias"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 151,
    "q": "Para quem Jesus disse ser necessário 'nascer de novo'?",
    "opts": {
      "A": "Herodes",
      "B": "Nicodemos",
      "C": "João Batista",
      "D": "Pedro"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 152,
    "q": "Quais personagens eram gêmeos?",
    "opts": {
      "A": "João e Tiago",
      "B": "José e Benjamim",
      "C": "Jacó e Esaú",
      "D": "Moisés e Arão"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 153,
    "q": "Quem teve os seus olhos perfurados ao ser preso?",
    "opts": {
      "A": "Apóstolo Paulo",
      "B": "Daniel",
      "C": "Saul",
      "D": "Sansão"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 154,
    "q": "Qual oferta Abel apresentou a Deus?",
    "opts": {
      "A": "Frutos da terra",
      "B": "Carne gorda",
      "C": "Especiarias e ervas",
      "D": "Primícias do seu rebanho"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 155,
    "q": "Em quais livros da Bíblia o nome Deus não é citado?",
    "opts": {
      "A": "Rute e Ester",
      "B": "Ester e Cânticos",
      "C": "Juízes e Esdras",
      "D": "Habacuque e Ester"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 163,
    "q": "André era irmão de qual apóstolo?",
    "opts": {
      "A": "Pedro",
      "B": "João",
      "C": "Tiago",
      "D": "Mateus"
    },
    "c": "A",
    "cat": "NT"
  },
  {
    "n": 165,
    "q": "Por que Caim matou Abel?",
    "opts": {
      "A": "Por uma herança",
      "B": "Pelo poder",
      "C": "Por inveja",
      "D": "Por aposta"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 166,
    "q": "Quem ficou temporariamente mudo?",
    "opts": {
      "A": "Zacarias",
      "B": "Obadias",
      "C": "Jeremias",
      "D": "Daniel"
    },
    "c": "A",
    "cat": "NT"
  },
  {
    "n": 167,
    "q": "Quem era rei e sacerdote no período de Abraão?",
    "opts": {
      "A": "Azalias",
      "B": "Nabucodonosor",
      "C": "Acabe",
      "D": "Melquisedeque"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 170,
    "q": "Qual é o maior salmo da Bíblia?",
    "opts": {
      "A": "23",
      "B": "91",
      "C": "119",
      "D": "136"
    },
    "c": "C",
    "cat": "Estrutura"
  },
  {
    "n": 172,
    "q": "A história da Torre de Babel se encontra em que livro bíblico?",
    "opts": {
      "A": "Apocalipse",
      "B": "Ezequiel",
      "C": "Gênesis",
      "D": "Daniel"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 173,
    "q": "Quem foi vendido por seus irmãos como escravo?",
    "opts": {
      "A": "José",
      "B": "Esaú",
      "C": "Jacó",
      "D": "Davi"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 176,
    "q": "Qual desses personagens também era romano?",
    "opts": {
      "A": "Paulo",
      "B": "Pedro",
      "C": "João",
      "D": "Mateus"
    },
    "c": "A",
    "cat": "NT"
  },
  {
    "n": 177,
    "q": "Quem apareceu no Monte da Transfiguração junto com Jesus?",
    "opts": {
      "A": "Abraão e Moisés",
      "B": "Moisés e Elias",
      "C": "Elias e Eliseu",
      "D": "Esaú e Jacó"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 178,
    "q": "Qual profeta foi arrebatado?",
    "opts": {
      "A": "Eliseu",
      "B": "Elias",
      "C": "Moisés",
      "D": "Jeremias"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 180,
    "q": "Qual o nome da mãe de João Batista?",
    "opts": {
      "A": "Maria",
      "B": "Isabel",
      "C": "Sara",
      "D": "Abigail"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 182,
    "q": "Quem foi a mulher que pediu a cabeça de João Batista?",
    "opts": {
      "A": "Herodias",
      "B": "A filha de Herodias",
      "C": "Dalila",
      "D": "Jezabel"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 183,
    "q": "Qual era o nome da mãe de Ismael?",
    "opts": {
      "A": "Sete",
      "B": "Sara",
      "C": "Agar",
      "D": "Diná"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 184,
    "q": "Quantos capítulos tem o livro de Gênesis?",
    "opts": {
      "A": "25",
      "B": "38",
      "C": "47",
      "D": "50"
    },
    "c": "D",
    "cat": "Estrutura"
  },
  {
    "n": 185,
    "q": "Qual o nome da esposa do rei Acabe?",
    "opts": {
      "A": "Salomé",
      "B": "Dalila",
      "C": "Abigail",
      "D": "Jezabel"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 186,
    "q": "Qual o nome do monte onde a arca de Noé repousou?",
    "opts": {
      "A": "Ararate",
      "B": "Sinai",
      "C": "Oliveiras",
      "D": "Carmelo"
    },
    "c": "A",
    "cat": "AT"
  },
  {
    "n": 196,
    "q": "Qual instrumento Davi gostava de tocar?",
    "opts": {
      "A": "Flauta",
      "B": "Violão",
      "C": "Harpa",
      "D": "Tambor"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 198,
    "q": "Qual é o último capítulo da Bíblia?",
    "opts": {
      "A": "Apocalipse 22",
      "B": "Apocalipse 23",
      "C": "Apocalipse 24",
      "D": "Apocalipse 25"
    },
    "c": "A",
    "cat": "Estrutura"
  },
  {
    "n": 200,
    "q": "Quem a Bíblia diz que foi pior que todos os reis de Israel?",
    "opts": {
      "A": "Davi",
      "B": "Saul",
      "C": "Acabe",
      "D": "Salomão"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 202,
    "q": "Quem ajudou Jesus a carregar a cruz?",
    "opts": {
      "A": "João",
      "B": "Simão Cirineu",
      "C": "Timóteo",
      "D": "José de Arimatéia"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 203,
    "q": "Quem foi arrebatado por Deus e não viu a morte?",
    "opts": {
      "A": "Jó",
      "B": "Enoque",
      "C": "Sansão",
      "D": "Davi"
    },
    "c": "B",
    "cat": "AT"
  },
  {
    "n": 204,
    "q": "Quem era Joabe?",
    "opts": {
      "A": "Chefe do exército de Saul",
      "B": "Chefe do exército de Davi",
      "C": "Chefe do exército de Salomão",
      "D": "Um profeta"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 206,
    "q": "Quem foi o pai de Abraão?",
    "opts": {
      "A": "Joaz",
      "B": "Torá",
      "C": "Terá",
      "D": "Tamom"
    },
    "c": "C",
    "cat": "Personagens"
  },
  {
    "n": 209,
    "q": "Quando o reino se dividiu, quais tribos formaram o reino do sul?",
    "opts": {
      "A": "Issacar e Zebulom",
      "B": "Dã e Manasses",
      "C": "Judá e Zebulom",
      "D": "Judá e Benjamim"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 211,
    "q": "João Batista era descendente de qual tribo?",
    "opts": {
      "A": "Benjamim",
      "B": "Levi",
      "C": "Zebulom",
      "D": "Judá"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 212,
    "q": "Qual é o versículo mais longo da Bíblia?",
    "opts": {
      "A": "Salmos 119:3",
      "B": "Ester 8:9",
      "C": "Provérbios 1:17",
      "D": "Salmos 17:2"
    },
    "c": "B",
    "cat": "Estrutura"
  },
  {
    "n": 214,
    "q": "Quem foi vendido por 20 moedas de prata?",
    "opts": {
      "A": "Jesus",
      "B": "Jacó",
      "C": "José",
      "D": "Davi"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 220,
    "q": "Quem encontrou um reino quando procurava umas jumentas pertencentes ao seu pai?",
    "opts": {
      "A": "Jeroboão",
      "B": "Salomão",
      "C": "Davi",
      "D": "Saul"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 225,
    "q": "Quem ganhou uma esposa por matar 200 homens?",
    "opts": {
      "A": "Saul",
      "B": "Davi",
      "C": "Salomão",
      "D": "Josafá"
    },
    "c": "B",
    "cat": "Personagens"
  },
  {
    "n": 226,
    "q": "Qual dos apóstolos foi mordido por uma cobra?",
    "opts": {
      "A": "Pedro",
      "B": "João",
      "C": "Paulo",
      "D": "André"
    },
    "c": "C",
    "cat": "NT"
  },
  {
    "n": 227,
    "q": "Qual foi o rei cujas unhas cresceram como as de um pássaro?",
    "opts": {
      "A": "Nabucodonosor",
      "B": "Ciro",
      "C": "Jorão",
      "D": "Acabe"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 233,
    "q": "Quantas vezes naufragou o apóstolo Paulo?",
    "opts": {
      "A": "1 vez",
      "B": "3 vezes",
      "C": "4 vezes",
      "D": "Nenhuma"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 235,
    "q": "Quem orou e o sol e a lua pararam?",
    "opts": {
      "A": "Gideão",
      "B": "Sansão",
      "C": "Josué",
      "D": "Arão"
    },
    "c": "C",
    "cat": "AT"
  },
  {
    "n": 236,
    "q": "Os amigos de quem sentaram-se com o seu amigo 7 dias sem falar?",
    "opts": {
      "A": "Jó",
      "B": "Salomão",
      "C": "Davi",
      "D": "Moisés"
    },
    "c": "A",
    "cat": "Personagens"
  },
  {
    "n": 241,
    "q": "Qual foi a bisavó de Davi?",
    "opts": {
      "A": "Ester",
      "B": "Noemi",
      "C": "Ana",
      "D": "Rute"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 244,
    "q": "Que discípulo encontrou uma moeda na boca de um peixe?",
    "opts": {
      "A": "André",
      "B": "Pedro",
      "C": "Tiago",
      "D": "João"
    },
    "c": "B",
    "cat": "Jesus"
  },
  {
    "n": 246,
    "q": "Quem foi a mulher hebraica que se tornou rainha da Pérsia?",
    "opts": {
      "A": "Rute",
      "B": "Ana",
      "C": "Raabe",
      "D": "Ester"
    },
    "c": "D",
    "cat": "Personagens"
  },
  {
    "n": 247,
    "q": "Quem Deus ordenou que sacrificasse seu único filho?",
    "opts": {
      "A": "Jacó",
      "B": "Isaque",
      "C": "Moisés",
      "D": "Abraão"
    },
    "c": "D",
    "cat": "AT"
  },
  {
    "n": 248,
    "q": "Quem foi o governador romano que condenou Cristo à morte?",
    "opts": {
      "A": "Pilatos",
      "B": "Quirino",
      "C": "Cesar",
      "D": "Herodes"
    },
    "c": "A",
    "cat": "Jesus"
  },
  {
    "n": 249,
    "q": "Qual é a raiz de todos os tipos de mal?",
    "opts": {
      "A": "O dinheiro",
      "B": "O amor ao dinheiro",
      "C": "O desejo pelo dinheiro",
      "D": "A pobreza"
    },
    "c": "B",
    "cat": "NT"
  },
  {
    "n": 250,
    "q": "Qual é o primeiro mandamento?",
    "opts": {
      "A": "Não terás outros deuses diante de mim",
      "B": "Não adulterarás",
      "C": "Não amarás o dinheiro",
      "D": "Respeite o próximo"
    },
    "c": "A",
    "cat": "AT"
  }
];

export default function CEAQuiz() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  
  const [questionsPool, setQuestionsPool] = useState<any[]>(FALLBACK_QUESTIONS);
  
  // Hub states
  const [view, setView] = useState<'hub'|'session'|'result'>('hub');
  const [cat, setCat] = useState('Geral');
  const [diff, setDiff] = useState('todos');
  const [size, setSize] = useState(10);
  
  // Session states
  const [sessionQs, setSessionQs] = useState<any[]>([]);
  const [curIdx, setCurIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<string|null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [history, setHistory] = useState<any[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [curStreak, setCurStreak] = useState(0);
  const [streakDots, setStreakDots] = useState<string[]>([]);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Fetch external questions from Supabase knowledge.chunks
    const fetchDBQs = async () => {
      try {
        const { data, error } = await supabase
          .schema('knowledge')
          .from('chunks')
          .select('metadata')
          .eq('metadata->>item_type', 'quiz');
        if (data && !error && data.length > 0) {
          const dbQs = data.map(r => r.metadata).filter(m => m && m.q && m.opts && m.c);
          if (dbQs.length > 0) {
            setQuestionsPool(prev => {
              // merge unique based on question text
              const map = new Map(prev.map(p => [p.q, p]));
              dbQs.forEach(dq => map.set(dq.q, dq));
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {}
    };
    fetchDBQs();
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (view === 'session' && !answered) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopTimer();
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return stopTimer;
  }, [view, answered, curIdx, stopTimer]);

  const startQuiz = () => {
    let pool = [...questionsPool];
    if (cat !== 'Geral') pool = pool.filter(q => q.cat === cat);
    // Shuffle
    pool = pool.sort(() => Math.random() - 0.5);
    const selectedQs = pool.slice(0, Math.min(size, pool.length));
    
    setSessionQs(selectedQs);
    setCurIdx(0);
    setScore(0);
    setBestStreak(0);
    setCurStreak(0);
    setHistory([]);
    setStreakDots(new Array(selectedQs.length).fill('pending'));
    setAnswered(false);
    setChosen(null);
    setTimeLeft(30);
    setView('session');
  };

  const handleTimeout = () => {
    if (answered) return;
    setAnswered(true);
    setChosen(null);
    setCurStreak(0);
    setStreakDots(prev => {
      const n = [...prev];
      n[curIdx] = 'miss';
      return n;
    });
    const q = sessionQs[curIdx];
    setHistory(prev => [...prev, { q: q.q, chosen: null, correct: q.c, ok: false }]);
  };

  const answer = (letter: string) => {
    if (answered) return;
    stopTimer();
    setAnswered(true);
    setChosen(letter);
    const q = sessionQs[curIdx];
    const ok = letter === q.c;
    
    if (ok) {
      setScore(s => s + 1);
      const ns = curStreak + 1;
      setCurStreak(ns);
      if (ns > bestStreak) setBestStreak(ns);
    } else {
      setCurStreak(0);
    }
    
    setStreakDots(prev => {
      const n = [...prev];
      n[curIdx] = ok ? 'hit' : 'miss';
      return n;
    });
    setHistory(prev => [...prev, { q: q.q, chosen: letter, correct: q.c, ok }]);
  };

  const next = async () => {
    if (curIdx + 1 >= sessionQs.length) {
      // Save progress
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.schema('knowledge').from('user_progress').insert({
            user_id: session.user.id,
            module: 'quiz',
            score: Math.round((score / sessionQs.length) * 100),
            metadata: {
              category: cat,
              size,
              correct: score,
              total: sessionQs.length,
              best_streak: bestStreak
            }
          });
        }
      } catch (err) {}
      setView('result');
    } else {
      setCurIdx(i => i + 1);
      setAnswered(false);
      setChosen(null);
      setTimeLeft(30);
    }
  };

  if (view === 'hub') {
    const bestScore = localStorage.getItem('lw_quiz_best');
    const totalSessions = localStorage.getItem('lw_quiz_sessions') || '0';
    const streak = localStorage.getItem('lw_quiz_streak') || '0';
    return (
      <div className="quiz-lw" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{flex:1,overflowY:'auto'}}>
          <div className="hub-inner">
            <div className="page-title">
              <h1>Quiz <span>Bíblico</span> 🎯</h1>
              <div className="streak-pill">🔥 {streak} dias seguidos</div>
            </div>
            <p className="page-subtitle">250 perguntas e respostas para testar seu conhecimento das Escrituras.</p>

            <div className="stats-row">
              <div className="stat-card"><div className="lbl">Total de perguntas</div><div className="val">250</div><div className="sub">banco de questões</div></div>
              <div className="stat-card"><div className="lbl">Categorias</div><div className="val">6</div><div className="sub">Personagens, Jesus, AT…</div></div>
              <div className="stat-card"><div className="lbl">Seu melhor score</div><div className="val">{bestScore ? bestScore+'%' : '—'}</div><div className="sub">recorde pessoal</div></div>
              <div className="stat-card"><div className="lbl">Sessões concluídas</div><div className="val">{totalSessions}</div><div className="sub">total de partidas</div></div>
            </div>

            <div className="bonus-ranking-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px', marginBottom: '28px' }}>
              {/* Bônus Diário */}
              <div style={{ backgroundColor: '#fcfbfe', border: '1px solid #ede8f7', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(124,58,237,0.03)' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#130d24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0 }}>
                    🎁 Bônus Diário
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Resgate seu XP hoje!</p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[10, 15, 20, 25, 35, 50].map((xp, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: i === 0 ? '#f3eeff' : '#ffffff', border: i === 0 ? '2px solid #7c3aed' : '1px solid #ede8f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: i === 0 ? '#7c3aed' : '#4b5563' }}>
                        +{xp}
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>D{i + 1}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffffff', border: '1px solid #ede8f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      🎁
                    </div>
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>🎁</span>
                  </div>
                </div>
                
                <button style={{ width: '100%', padding: '12px', backgroundColor: '#7c3aed', color: '#ffffff', borderRadius: '8px', fontWeight: 600, fontSize: '15px', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}>
                  RESGATAR DIA 1 (+10 XP)
                </button>
              </div>

              {/* Ranking Global */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #ede8f7', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#130d24', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <span style={{ color: '#7c3aed' }}>🏆</span> Ranking Global
                  </h3>
                  <div style={{ backgroundColor: '#f3eeff', color: '#7c3aed', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                    #1
                  </div>
                </div>
                
                <div style={{ backgroundColor: '#fdfbfe', border: '1px solid #f3eeff', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: '#fffbeb', color: '#f59e0b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '1px solid rgba(245,158,11,0.2)' }}>
                      👑
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: '#130d24', fontSize: '15px' }}>Bione </span>
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>(Você)</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: '15px' }}>215 XP</span>
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>Lv.3</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sec-hdr"><div className="sec-title">Escolha a categoria</div></div>
            <div className="cat-grid">
              {[{id:'Geral',ico:'📖',nm:'Geral',sub:'Todas as 250 perguntas',cc:'cc-1'},{id:'Personagens',ico:'👤',nm:'Personagens',sub:'Reis, profetas, apóstolos',cc:'cc-2'},{id:'Jesus',ico:'✝️',nm:'Vida de Jesus',sub:'Nascimento, milagres, ressurreição',cc:'cc-3'},{id:'AT',ico:'📜',nm:'Antigo Testamento',sub:'Patriarcas, Êxodo, Profetas',cc:'cc-4'},{id:'NT',ico:'🕊',nm:'Novo Testamento',sub:'Apóstolos, Igreja, Epístolas',cc:'cc-5'},{id:'Estrutura',ico:'🗂',nm:'Estrutura da Bíblia',sub:'Livros, cânon, idiomas',cc:'cc-6'}].map(c => (
                <div key={c.id} className={`cat-card ${c.cc} ${cat===c.id?'selected':''}`} onClick={()=>setCat(c.id)}>
                  <div className="cat-icon">{c.ico}</div>
                  <div><div className="cat-name">{c.nm}</div><div className="cat-count">{c.sub}</div></div>
                </div>
              ))}
            </div>

            <div className="diff-row">
              <span className="diff-lbl">Nível:</span>
              {[{id:'todos',l:'Todos'},{id:'fácil',l:'Básico'},{id:'médio',l:'Intermediário'},{id:'difícil',l:'Avançado'}].map(d => (
                <button key={d.id} className={`diff-btn ${diff===d.id?'sel':''}`} onClick={()=>setDiff(d.id)}>{d.l}</button>
              ))}
            </div>

            <div className="sec-hdr"><div className="sec-title">Quantas perguntas?</div></div>
            <div className="size-row">
              {[{n:10,t:'~ 5 minutos'},{n:20,t:'~ 10 minutos'},{n:50,t:'~ 25 minutos'}].map(s => (
                <div key={s.n} className={`size-card ${size===s.n?'sel':''}`} onClick={()=>setSize(s.n)}>
                  <div className="size-n">{s.n}</div>
                  <div className="size-l">perguntas</div>
                  <div className="size-t">{s.t}</div>
                </div>
              ))}
            </div>

            <button className="start-btn" onClick={startQuiz}>🎯 Iniciar Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'result') {
    const pct = sessionQs.length > 0 ? Math.round((score / sessionQs.length) * 100) : 0;
    const cfg = pct>=90 ? {e:'🏆',t:'Excelente!',col:'#10B981',strip:'linear-gradient(90deg,#10B981,#059669)'}
              : pct>=70 ? {e:'🎉',t:'Muito bem!',col:'#7C3AED',strip:'linear-gradient(90deg,#7C3AED,#5b21b6)'}
              : pct>=50 ? {e:'👍',t:'Bom esforço!',col:'#F59E0B',strip:'linear-gradient(90deg,#F59E0B,#D97706)'}
              :           {e:'📖',t:'Continue estudando!',col:'#EF4444',strip:'linear-gradient(90deg,#EF4444,#DC2626)'};
    // persist
    const prev = parseInt(localStorage.getItem('lw_quiz_sessions')||'0');
    localStorage.setItem('lw_quiz_sessions', String(prev+1));
    const oldBest = localStorage.getItem('lw_quiz_best');
    if(!oldBest || pct > parseInt(oldBest)) localStorage.setItem('lw_quiz_best', String(pct));

    return (
      <div className="quiz-lw" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{flex:1,overflowY:'auto',padding:28,display:'flex',justifyContent:'center',background:'#f5f0ff'}}>
          <div className="res-inner fade-up">
            <div className="res-header">
              <div className="res-header-strip" style={{background:cfg.strip}}></div>
              <div className="res-header-body">
                <span className="res-emoji">{cfg.e}</span>
                <div className="res-score-big" style={{color:cfg.col}}>{pct}%</div>
                <div className="res-score-lbl">{score} de {sessionQs.length} corretas</div>
                <div className="res-title">{cfg.t}</div>
              </div>
            </div>

            <div className="res-grid">
              <div className="res-stat"><div className="lbl">Corretas</div><div className="val val-grn">{score}</div><div className="sub">respostas certas</div></div>
              <div className="res-stat"><div className="lbl">Erradas</div><div className="val val-red">{sessionQs.length-score}</div><div className="sub">precisam de revisão</div></div>
              <div className="res-stat"><div className="lbl">Melhor sequência</div><div className="val val-pur">{bestStreak}</div><div className="sub">acertos consecutivos</div></div>
            </div>

            <div className="msg-box">
              {pct>=90 ? <><strong>Conhecimento bíblico impressionante!</strong> Continue estudando no CEA!</> : pct>=70 ? <><strong>Ótimo resultado!</strong> Revise os erros e tente novamente.</> : pct>=50 ? <><strong>Bom começo!</strong> Explore os módulos de Personagens e Parábolas.</> : <><strong>A jornada começa aqui.</strong> A Bíblia é um tesouro. Tente novamente!</>}
            </div>

            <div className="res-actions">
              <button className="ra-btn ra-primary" onClick={startQuiz}>🔄 Jogar novamente</button>
              <button className="ra-btn ra-ghost" onClick={() => setView('hub')}>← Trocar categoria</button>
            </div>

            <div className="review-title">📋 Revisão das questões</div>
            <div>
              {history.map((h, i) => (
                <div className="review-item" key={i}>
                  <div className={`ri-icon ${h.ok?'ri-ok':'ri-fail'}`}>{h.ok?'✓':'✗'}</div>
                  <div>
                    <div className="ri-q">{i+1}. {h.q}</div>
                    <div className="ri-ans">Correta: <b>{h.correct}</b>{!h.ok ? ` · Sua resposta: ${h.chosen||'tempo esgotado'}` : '.'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = sessionQs[curIdx];
  const timerPct = timeLeft / 30;
  const dashoffset = 100.5 * (1 - timerPct);
  const timerColor = timeLeft <= 10 ? '#EF4444' : timeLeft <= 20 ? '#F59E0B' : '#7C3AED';

  return (
    <div className="quiz-lw" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div className="sess-top">
        <button className="sess-back" onClick={() => {stopTimer(); setView('hub');}}>←</button>
        <div className="prog-wrap"><div className="prog-fill" style={{width:`${Math.max(4,(curIdx/sessionQs.length)*100)}%`}}></div></div>
        <div className="sess-counter">{curIdx+1} / {sessionQs.length}</div>
        <div className="timer-wrap">
          <div className="timer-ring">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="#ede8f7" strokeWidth="3.5"/>
              <circle cx="20" cy="20" r="16" fill="none" stroke={timerColor} strokeWidth="3.5"
                strokeDasharray="100.5" strokeDashoffset={dashoffset} strokeLinecap="round" style={{transition:'stroke-dashoffset 1s linear'}} />
            </svg>
            <div className="timer-num">{timeLeft}</div>
          </div>
        </div>
        <div className="score-badge">✓ {score}</div>
      </div>

      <div className="sess-body">
        <div className="q-wrap fade-up">
          <div className="streak-bar">
            {streakDots.map((s, i) => (
              <div key={i} className={`streak-dot ${s} ${i===curIdx?'active':''}`}></div>
            ))}
          </div>
          <div className="q-meta">
            <div className="q-num-lbl">PERGUNTA {curIdx+1} DE {sessionQs.length}</div>
            <div className="q-cat-chip">{(q?.cat||cat).toUpperCase()}</div>
          </div>
          <div className="q-card">
            <div className="q-text">{q ? q.q : 'Carregando…'}</div>
          </div>

          <div className="opts">
            {q && Object.entries(q.opts).map(([letter, txt]) => {
              let optClass = "opt";
              if (answered) {
                if (letter === q.c) optClass += " correct";
                else if (letter === chosen) optClass += " wrong";
                optClass += " disabled";
              }
              return (
                <div key={letter} className={optClass} onClick={() => answer(letter)}>
                  <div className="opt-letter">{letter}</div>
                  <div className="opt-text">{String(txt)}</div>
                </div>
              );
            })}
          </div>

          <div className={`feedback-box ${answered?'show':''} ${chosen===q?.c?'ok':'fail'}`}>
            <div className={`fb-result ${chosen===q?.c?'ok':'fail'}`}>
              {chosen===q?.c ? '✓ Correto!' : chosen===null ? '⏱ Tempo esgotado!' : '✗ Incorreto'}
            </div>
            <div className="fb-explain">
              {chosen===q?.c ? `Ótimo! Resposta: ${q?.c} — ${q?.opts[q?.c as keyof typeof q.opts]}` : `Correta: ${q?.c} — ${q?.opts[q?.c as keyof typeof q.opts]}`}
            </div>
          </div>

          <button className={`next-btn ${answered ? 'show' : ''}`} onClick={next}>
            {curIdx + 1 >= sessionQs.length ? 'Finalizar Quiz →' : 'Próxima →'}
          </button>
        </div>
      </div>
    </div>
  );
}
