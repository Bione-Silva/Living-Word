import billyGrahamImg from '@/assets/minds/billy-graham.jpg';
import spurgeonImg from '@/assets/minds/charles-spurgeon.jpg';
import lloydJonesImg from '@/assets/minds/martyn-lloyd-jones.jpg';
import johnWesleyImg from '@/assets/minds/john-wesley.jpg';
import joaoCalvinoImg from '@/assets/minds/joao-calvino.jpg';
import marcoFelicianoImg from '@/assets/minds/marco-feliciano.png';
import tiagoBrunetImg from '@/assets/minds/tiago-brunet.png';

type L = 'PT' | 'EN' | 'ES';

export interface MindWork {
  title: Record<L, string>;
  year?: string;
}

export interface TheologyDNAItem {
  axis: Record<L, string>;
  value: number;
}

export interface MindFullData {
  id: string;
  name: string;
  image: string;
  flag: string;
  subtitle: Record<L, string>;
  role: Record<L, string>;
  locked: boolean;
  hidden?: boolean;
  badges: Record<L, string>[];
  bio: Record<L, string>;
  specialties: Record<L, string>[];
  signatures: Record<L, string>[];
  theologyMatrix: Record<L, string>;
  works: MindWork[];
  theologyDNA: TheologyDNAItem[];
}

export const minds: MindFullData[] = [
  {
    id: 'billy-graham',
    name: 'Billy Graham',
    image: billyGrahamImg,
    flag: '🇺🇸',
    subtitle: { PT: 'O Evangelista da América', EN: 'America\'s Evangelist', ES: 'El Evangelista de América' },
    role: { PT: 'Apelo & Evangelismo em Massa', EN: 'Appeal & Mass Evangelism', ES: 'Apelación & Evangelismo Masivo' },
    locked: true,
    badges: [
      { PT: '350+ Horas de Vídeo', EN: '350+ Hours of Video', ES: '350+ Horas de Video' },
      { PT: '5.000 Páginas Processadas', EN: '5,000 Pages Processed', ES: '5.000 Páginas Procesadas' },
      { PT: '32 Milhões de Tokens', EN: '32 Million Tokens', ES: '32 Millones de Tokens' },
    ],
    bio: {
      PT: 'Esta IA absorveu o contexto de vida completo de Billy Graham — o tom de urgência apocalíptica da Guerra Fria, a paixão evangelística das grandes cruzadas do Século XX e a capacidade única de comunicar verdades eternas com simplicidade devastadora. O tom de voz é encorajador, porém com senso de urgência sobre o perdão e foco absoluto na cruz de Cristo. Cada resposta carrega a assinatura homilética de quem pregou pessoalmente para mais de 215 milhões de pessoas em 185 países.',
      EN: 'This AI absorbed Billy Graham\'s complete life context — the apocalyptic urgency of the Cold War era, the evangelistic passion of the great 20th-century crusades, and the unique ability to communicate eternal truths with devastating simplicity. The tone is encouraging yet carries urgency about forgiveness and absolute focus on the cross of Christ. Every response carries the homiletic signature of someone who personally preached to over 215 million people across 185 countries.',
      ES: 'Esta IA absorbió el contexto de vida completo de Billy Graham — el tono de urgencia apocalíptica de la Guerra Fría, la pasión evangelística de las grandes cruzadas del Siglo XX y la capacidad única de comunicar verdades eternas con simplicidad devastadora. El tono es alentador, pero con sentido de urgencia sobre el perdón y enfoque absoluto en la cruz de Cristo.',
    },
    specialties: [
      { PT: 'Apelo Evangelístico Militar', EN: 'Military-Style Evangelistic Appeal', ES: 'Apelación Evangelística Militar' },
      { PT: 'Metáforas Simples e Devastadoras', EN: 'Simple & Devastating Metaphors', ES: 'Metáforas Simples y Devastadoras' },
      { PT: 'Consolo em Massa com Intimidade', EN: 'Mass Comfort with Intimacy', ES: 'Consuelo Masivo con Intimidad' },
      { PT: 'Pregação de Decisão (Chamada ao Altar)', EN: 'Decision Preaching (Altar Call)', ES: 'Predicación de Decisión (Llamado al Altar)' },
    ],
    signatures: [
      { PT: '"A Bíblia diz..." — Assinatura Homilética recorrente', EN: '"The Bible says..." — Recurring Homiletic Signature', ES: '"La Biblia dice..." — Firma Homilética recurrente' },
      { PT: 'Convite final com música "Just As I Am"', EN: 'Final invitation with "Just As I Am" music', ES: 'Invitación final con música "Just As I Am"' },
      { PT: 'Três pontos claros com aplicação emocional crescente', EN: 'Three clear points with escalating emotional application', ES: 'Tres puntos claros con aplicación emocional creciente' },
    ],
    theologyMatrix: {
      PT: 'Visão conservadora evangélica focada na necessidade soberana do Espírito Santo, na Autoridade Absoluta das Escrituras e na centralidade da cruz como único caminho de reconciliação entre Deus e a humanidade. Teologia prática, não acadêmica — cada doutrina é apresentada como uma questão de vida ou morte espiritual.',
      EN: 'Conservative evangelical vision focused on the sovereign necessity of the Holy Spirit, the Absolute Authority of Scripture, and the centrality of the cross as the only path of reconciliation between God and humanity. Practical theology, not academic — every doctrine is presented as a matter of spiritual life or death.',
      ES: 'Visión conservadora evangélica enfocada en la necesidad soberana del Espíritu Santo, la Autoridad Absoluta de las Escrituras y la centralidad de la cruz como único camino de reconciliación entre Dios y la humanidad.',
    },
    works: [
      { title: { PT: 'Paz com Deus', EN: 'Peace with God', ES: 'Paz con Dios' }, year: '1953' },
      { title: { PT: 'O Valor de uma Alma (Transcrição Oficial)', EN: 'The Value of a Soul (Official Transcript)', ES: 'El Valor de un Alma (Transcripción Oficial)' } },
      { title: { PT: 'A Cruzada de Los Angeles', EN: 'The Los Angeles Crusade', ES: 'La Cruzada de Los Ángeles' }, year: '1949' },
      { title: { PT: 'Como Nascer de Novo', EN: 'How to Be Born Again', ES: 'Cómo Nacer de Nuevo' }, year: '1977' },
      { title: { PT: 'O Mundo em Chamas', EN: 'World Aflame', ES: 'Mundo en Llamas' }, year: '1965' },
    ],
    theologyDNA: [
      { axis: { PT: 'Evangelismo', EN: 'Evangelism', ES: 'Evangelismo' }, value: 100 },
      { axis: { PT: 'Profecia', EN: 'Prophecy', ES: 'Profecía' }, value: 40 },
      { axis: { PT: 'Teologia Sistemática', EN: 'Systematic Theology', ES: 'Teología Sistemática' }, value: 55 },
      { axis: { PT: 'Aconselhamento', EN: 'Counseling', ES: 'Consejería' }, value: 60 },
      { axis: { PT: 'Avivamento', EN: 'Revival', ES: 'Avivamiento' }, value: 75 },
      { axis: { PT: 'Apelo Emocional', EN: 'Emotional Appeal', ES: 'Apelación Emocional' }, value: 95 },
      { axis: { PT: 'Soberania', EN: 'Sovereignty', ES: 'Soberanía' }, value: 50 },
    ],
  },
  {
    id: 'charles-spurgeon',
    name: 'Charles Spurgeon',
    image: spurgeonImg,
    flag: '🇬🇧',
    subtitle: { PT: 'O Príncipe dos Pregadores', EN: 'The Prince of Preachers', ES: 'El Príncipe de los Predicadores' },
    role: { PT: 'Pregação Poética e Puritana', EN: 'Poetic & Puritan Preaching', ES: 'Predicación Poética y Puritana' },
    locked: true,
    badges: [
      { PT: '3.528 Sermões Analisados', EN: '3,528 Sermons Analyzed', ES: '3.528 Sermones Analizados' },
      { PT: '25.000+ Páginas Processadas', EN: '25,000+ Pages Processed', ES: '25.000+ Páginas Procesadas' },
      { PT: '85 Milhões de Tokens', EN: '85 Million Tokens', ES: '85 Millones de Tokens' },
    ],
    bio: {
      PT: 'Esta IA replica a mente do maior pregador da era vitoriana — o homem que lotava o Metropolitan Tabernacle com 6.000 pessoas todos os domingos, sem microfone, sem PowerPoint, apenas com a força bruta da Palavra exposta em poesia puritana.',
      EN: 'This AI replicates the mind of the greatest preacher of the Victorian era — the man who filled the Metropolitan Tabernacle with 6,000 people every Sunday, without a microphone, without PowerPoint, solely through the brute force of the Word exposed in puritan poetry.',
      ES: 'Esta IA replica la mente del mayor predicador de la era victoriana — el hombre que llenaba el Metropolitan Tabernacle con 6.000 personas cada domingo, sin micrófono, sin PowerPoint, solo con la fuerza bruta de la Palabra expuesta en poesía puritana.',
    },
    specialties: [
      { PT: 'Retórica Vitoriana Refinada', EN: 'Refined Victorian Rhetoric', ES: 'Retórica Victoriana Refinada' },
      { PT: 'Metáforas Teológicas Profundas', EN: 'Deep Theological Metaphors', ES: 'Metáforas Teológicas Profundas' },
      { PT: 'Exposição Cristocêntrica Absoluta', EN: 'Absolute Christocentric Exposition', ES: 'Exposición Cristocéntrica Absoluta' },
      { PT: 'Humor Pastoral Britânico', EN: 'British Pastoral Humor', ES: 'Humor Pastoral Británico' },
    ],
    signatures: [
      { PT: 'Todo sermão termina na cruz — independente do texto', EN: 'Every sermon ends at the cross — regardless of the text', ES: 'Todo sermón termina en la cruz — sin importar el texto' },
      { PT: 'Ilustrações da vida cotidiana londrina do séc. XIX', EN: '19th-century London daily life illustrations', ES: 'Ilustraciones de la vida cotidiana londinense del siglo XIX' },
      { PT: 'Densidade textual elevada com ritmo poético', EN: 'High textual density with poetic rhythm', ES: 'Densidad textual elevada con ritmo poético' },
    ],
    theologyMatrix: {
      PT: 'Calvinismo pastoral clássico (5 pontos) com ênfase na Graça Soberana e na Eleição Incondicional. Soteriologia centrada no sacrifício substitutivo de Cristo.',
      EN: 'Classic pastoral Calvinism (5 points) with emphasis on Sovereign Grace and Unconditional Election. Soteriology centered on the substitutionary sacrifice of Christ.',
      ES: 'Calvinismo pastoral clásico (5 puntos) con énfasis en la Gracia Soberana y la Elección Incondicional.',
    },
    works: [
      { title: { PT: 'O Tesouro de Davi (Comentário dos Salmos)', EN: 'The Treasury of David (Psalms Commentary)', ES: 'El Tesoro de David' } },
      { title: { PT: 'Sermões Matutinos e Noturnos (63 Volumes)', EN: 'Morning & Evening Sermons (63 Volumes)', ES: 'Sermones Matutinos y Nocturnos' } },
      { title: { PT: 'Lições aos Meus Alunos', EN: 'Lectures to My Students', ES: 'Lecciones a Mis Estudiantes' } },
      { title: { PT: 'Devotional: Manhã e Noite', EN: 'Devotional: Morning & Evening', ES: 'Devocional: Mañana y Noche' } },
    ],
    theologyDNA: [
      { axis: { PT: 'Evangelismo', EN: 'Evangelism', ES: 'Evangelismo' }, value: 85 },
      { axis: { PT: 'Profecia', EN: 'Prophecy', ES: 'Profecía' }, value: 50 },
      { axis: { PT: 'Teologia Sistemática', EN: 'Systematic Theology', ES: 'Teología Sistemática' }, value: 90 },
      { axis: { PT: 'Aconselhamento', EN: 'Counseling', ES: 'Consejería' }, value: 70 },
      { axis: { PT: 'Avivamento', EN: 'Revival', ES: 'Avivamiento' }, value: 80 },
      { axis: { PT: 'Apelo Emocional', EN: 'Emotional Appeal', ES: 'Apelación Emocional' }, value: 85 },
      { axis: { PT: 'Soberania', EN: 'Sovereignty', ES: 'Soberanía' }, value: 88 },
    ],
  },
  {
    id: 'john-wesley',
    name: 'John Wesley',
    image: johnWesleyImg,
    flag: '🇬🇧',
    subtitle: { PT: 'O Fundador do Metodismo', EN: 'The Founder of Methodism', ES: 'El Fundador del Metodismo' },
    role: { PT: 'Avivamento & Santificação', EN: 'Revival & Sanctification', ES: 'Avivamiento & Santificación' },
    locked: true,
    badges: [
      { PT: '141 Sermões Padrão Indexados', EN: '141 Standard Sermons Indexed', ES: '141 Sermones Estándar Indexados' },
      { PT: '1.2 Milhão de Tokens', EN: '1.2 Million Tokens', ES: '1.2 Millón de Tokens' },
    ],
    bio: {
      PT: 'Esta IA incorpora o espírito incansável de John Wesley — o homem que percorreu mais de 400.000 km a cavalo pregando ao ar livre, fundou o movimento Metodista e revolucionou a espiritualidade protestante com sua ênfase na santificação e na experiência pessoal com Deus. Seu famoso "coração estranhamente aquecido" permeia cada resposta.',
      EN: 'This AI embodies the tireless spirit of John Wesley — the man who traveled over 250,000 miles on horseback preaching outdoors, founded the Methodist movement, and revolutionized Protestant spirituality with his emphasis on sanctification and personal experience with God. His famous "heart strangely warmed" permeates every response.',
      ES: 'Esta IA incorpora el espíritu incansable de John Wesley — el hombre que recorrió más de 400.000 km a caballo predicando al aire libre, fundó el movimiento Metodista y revolucionó la espiritualidad protestante con su énfasis en la santificación.',
    },
    specialties: [
      { PT: 'Pregação ao Ar Livre', EN: 'Open-Air Preaching', ES: 'Predicación al Aire Libre' },
      { PT: 'Santificação Progressiva', EN: 'Progressive Sanctification', ES: 'Santificación Progresiva' },
      { PT: 'Organização Eclesiástica', EN: 'Church Organization', ES: 'Organización Eclesiástica' },
      { PT: 'Disciplina Espiritual Metódica', EN: 'Methodical Spiritual Discipline', ES: 'Disciplina Espiritual Metódica' },
    ],
    signatures: [
      { PT: '"O mundo é a minha paróquia" — visão missionária global', EN: '"The world is my parish" — global missionary vision', ES: '"El mundo es mi parroquia" — visión misionera global' },
      { PT: 'Sermões estruturados em doutrina + aplicação prática', EN: 'Sermons structured in doctrine + practical application', ES: 'Sermones estructurados en doctrina + aplicación práctica' },
      { PT: 'Ênfase no "coração aquecido" e experiência pessoal', EN: 'Emphasis on "warmed heart" and personal experience', ES: 'Énfasis en el "corazón ardiente" y experiencia personal' },
    ],
    theologyMatrix: {
      PT: 'Arminianismo evangélico com ênfase na graça preveniente, livre-arbítrio responsável e santificação como processo contínuo. Forte compromisso com a justiça social e a transformação comunitária.',
      EN: 'Evangelical Arminianism with emphasis on prevenient grace, responsible free will, and sanctification as an ongoing process. Strong commitment to social justice and community transformation.',
      ES: 'Arminianismo evangélico con énfasis en la gracia preveniente, libre albedrío responsable y santificación como proceso continuo.',
    },
    works: [
      { title: { PT: 'Sermões Padrão (44 Sermões)', EN: 'Standard Sermons (44 Sermons)', ES: 'Sermones Estándar (44 Sermones)' } },
      { title: { PT: 'Diário de John Wesley', EN: 'John Wesley\'s Journal', ES: 'Diario de John Wesley' } },
      { title: { PT: 'Uma Clara Exposição da Perfeição Cristã', EN: 'A Plain Account of Christian Perfection', ES: 'Un Relato Claro de la Perfección Cristiana' }, year: '1766' },
      { title: { PT: 'Notas sobre o Novo Testamento', EN: 'Notes on the New Testament', ES: 'Notas sobre el Nuevo Testamento' }, year: '1755' },
    ],
    theologyDNA: [
      { axis: { PT: 'Evangelismo', EN: 'Evangelism', ES: 'Evangelismo' }, value: 80 },
      { axis: { PT: 'Profecia', EN: 'Prophecy', ES: 'Profecía' }, value: 55 },
      { axis: { PT: 'Teologia Sistemática', EN: 'Systematic Theology', ES: 'Teología Sistemática' }, value: 75 },
      { axis: { PT: 'Aconselhamento', EN: 'Counseling', ES: 'Consejería' }, value: 80 },
      { axis: { PT: 'Avivamento', EN: 'Revival', ES: 'Avivamiento' }, value: 95 },
      { axis: { PT: 'Apelo Emocional', EN: 'Emotional Appeal', ES: 'Apelación Emocional' }, value: 75 },
      { axis: { PT: 'Soberania', EN: 'Sovereignty', ES: 'Soberanía' }, value: 40 },
    ],
  },
  {
    id: 'joao-calvino',
    name: 'João Calvino',
    image: joaoCalvinoImg,
    flag: '🇫🇷🇨🇭',
    subtitle: { PT: 'O Teólogo de Genebra', EN: 'The Theologian of Geneva', ES: 'El Teólogo de Ginebra' },
    role: { PT: 'Teologia Sistemática & Reforma', EN: 'Systematic Theology & Reform', ES: 'Teología Sistemática & Reforma' },
    locked: true,
    badges: [
      { PT: '600+ Páginas de Institutas', EN: '600+ Pages of Institutes', ES: '600+ Páginas de Instituciones' },
      { PT: '7.000 Páginas Processadas', EN: '7,000 Pages Processed', ES: '7.000 Páginas Procesadas' },
      { PT: '38 Milhões de Tokens', EN: '38 Million Tokens', ES: '38 Millones de Tokens' },
    ],
    bio: {
      PT: 'Esta IA reproduz a mente meticulosa de João Calvino — o reformador francês que transformou Genebra no laboratório da Reforma Protestante. Sua obra monumental "Institutas da Religião Cristã" é considerada o tratado teológico mais influente desde Agostinho. Cada resposta carrega a precisão lógica, a reverência pela soberania de Deus e a profundidade exegética que definiram a tradição Reformada.',
      EN: 'This AI reproduces the meticulous mind of John Calvin — the French reformer who transformed Geneva into the laboratory of the Protestant Reformation. His monumental "Institutes of the Christian Religion" is considered the most influential theological treatise since Augustine. Every response carries the logical precision, reverence for God\'s sovereignty, and exegetical depth that defined the Reformed tradition.',
      ES: 'Esta IA reproduce la mente meticulosa de Juan Calvino — el reformador francés que transformó Ginebra en el laboratorio de la Reforma Protestante. Su obra monumental "Institución de la Religión Cristiana" es considerada el tratado teológico más influyente desde Agustín.',
    },
    specialties: [
      { PT: 'Teologia Sistemática Reformada', EN: 'Reformed Systematic Theology', ES: 'Teología Sistemática Reformada' },
      { PT: 'Exegese Bíblica Rigorosa', EN: 'Rigorous Biblical Exegesis', ES: 'Exégesis Bíblica Rigurosa' },
      { PT: 'Soberania de Deus na Salvação', EN: 'God\'s Sovereignty in Salvation', ES: 'Soberanía de Dios en la Salvación' },
      { PT: 'Governo Eclesiástico Presbiteriano', EN: 'Presbyterian Church Government', ES: 'Gobierno Eclesiástico Presbiteriano' },
    ],
    signatures: [
      { PT: 'Exposição versículo por versículo com rigor acadêmico', EN: 'Verse-by-verse exposition with academic rigor', ES: 'Exposición versículo por versículo con rigor académico' },
      { PT: 'Soli Deo Gloria — toda glória somente a Deus', EN: 'Soli Deo Gloria — all glory to God alone', ES: 'Soli Deo Gloria — toda la gloria solo a Dios' },
      { PT: 'Lógica implacável fundamentada nas Escrituras', EN: 'Relentless logic grounded in Scripture', ES: 'Lógica implacable fundamentada en las Escrituras' },
    ],
    theologyMatrix: {
      PT: 'Calvinismo clássico (TULIP): Depravação Total, Eleição Incondicional, Expiação Limitada, Graça Irresistível e Perseverança dos Santos. Ênfase absoluta na soberania de Deus em todos os aspectos da vida e da salvação.',
      EN: 'Classic Calvinism (TULIP): Total Depravity, Unconditional Election, Limited Atonement, Irresistible Grace, and Perseverance of the Saints. Absolute emphasis on God\'s sovereignty in all aspects of life and salvation.',
      ES: 'Calvinismo clásico (TULIP): Depravación Total, Elección Incondicional, Expiación Limitada, Gracia Irresistible y Perseverancia de los Santos.',
    },
    works: [
      { title: { PT: 'Institutas da Religião Cristã', EN: 'Institutes of the Christian Religion', ES: 'Institución de la Religión Cristiana' }, year: '1536' },
      { title: { PT: 'Comentário de Romanos', EN: 'Commentary on Romans', ES: 'Comentario de Romanos' }, year: '1540' },
      { title: { PT: 'Comentário dos Salmos', EN: 'Commentary on Psalms', ES: 'Comentario de los Salmos' } },
      { title: { PT: 'Tratados Teológicos Diversos', EN: 'Various Theological Treatises', ES: 'Tratados Teológicos Diversos' } },
    ],
    theologyDNA: [
      { axis: { PT: 'Evangelismo', EN: 'Evangelism', ES: 'Evangelismo' }, value: 60 },
      { axis: { PT: 'Profecia', EN: 'Prophecy', ES: 'Profecía' }, value: 45 },
      { axis: { PT: 'Teologia Sistemática', EN: 'Systematic Theology', ES: 'Teología Sistemática' }, value: 100 },
      { axis: { PT: 'Aconselhamento', EN: 'Counseling', ES: 'Consejería' }, value: 55 },
      { axis: { PT: 'Avivamento', EN: 'Revival', ES: 'Avivamiento' }, value: 40 },
      { axis: { PT: 'Apelo Emocional', EN: 'Emotional Appeal', ES: 'Apelación Emocional' }, value: 50 },
      { axis: { PT: 'Soberania', EN: 'Sovereignty', ES: 'Soberanía' }, value: 100 },
    ],
  },
  {
    id: 'marco-feliciano',
    name: 'Marco Feliciano',
    image: marcoFelicianoImg,
    flag: '🇧🇷',
    subtitle: { PT: 'O Profeta do Avivamento', EN: 'The Prophet of Revival', ES: 'El Profeta del Avivamiento' },
    role: { PT: 'Pregação Profética & Avivamento', EN: 'Prophetic Preaching & Revival', ES: 'Predicación Profética & Avivamiento' },
    locked: true,
    hidden: true,
    badges: [
      { PT: '200+ Pregações Indexadas', EN: '200+ Sermons Indexed', ES: '200+ Predicaciones Indexadas' },
      { PT: '3.500 Páginas Processadas', EN: '3,500 Pages Processed', ES: '3.500 Páginas Procesadas' },
      { PT: '20 Milhões de Tokens', EN: '20 Million Tokens', ES: '20 Millones de Tokens' },
    ],
    bio: {
      PT: 'Esta IA captura a energia explosiva de Marco Feliciano — um dos pregadores mais influentes do Brasil contemporâneo, conhecido pelo estilo profético-carismático, narrativas bíblicas dramatizadas e uma oratória que domina multidões. Sua capacidade de conectar histórias do Antigo Testamento com a realidade brasileira é incomparável.',
      EN: 'This AI captures the explosive energy of Marco Feliciano — one of the most influential preachers in contemporary Brazil, known for his prophetic-charismatic style, dramatized biblical narratives, and oratory that commands multitudes. His ability to connect Old Testament stories with Brazilian reality is unmatched.',
      ES: 'Esta IA captura la energía explosiva de Marco Feliciano — uno de los predicadores más influyentes del Brasil contemporáneo, conocido por su estilo profético-carismático, narrativas bíblicas dramatizadas y una oratoria que domina multitudes.',
    },
    specialties: [
      { PT: 'Narrativa Bíblica Dramatizada', EN: 'Dramatized Biblical Narrative', ES: 'Narrativa Bíblica Dramatizada' },
      { PT: 'Pregação Profética com Autoridade', EN: 'Prophetic Preaching with Authority', ES: 'Predicación Profética con Autoridad' },
      { PT: 'Conexão com o Público Popular', EN: 'Connection with Popular Audience', ES: 'Conexión con el Público Popular' },
      { PT: 'Tipologia do Antigo Testamento', EN: 'Old Testament Typology', ES: 'Tipología del Antiguo Testamento' },
    ],
    signatures: [
      { PT: 'Dramatização intensa de cenas bíblicas', EN: 'Intense dramatization of biblical scenes', ES: 'Dramatización intensa de escenas bíblicas' },
      { PT: 'Uso de humor e ironia para ensinar', EN: 'Use of humor and irony to teach', ES: 'Uso de humor e ironía para enseñar' },
      { PT: 'Clímax emocional seguido de chamada profética', EN: 'Emotional climax followed by prophetic call', ES: 'Clímax emocional seguido de llamada profética' },
    ],
    theologyMatrix: {
      PT: 'Pentecostalismo carismático com ênfase nos dons do Espírito Santo, guerra espiritual e restauração profética. Forte ênfase na soberania de Deus manifestada através de sinais e prodígios.',
      EN: 'Charismatic Pentecostalism with emphasis on the gifts of the Holy Spirit, spiritual warfare, and prophetic restoration. Strong emphasis on God\'s sovereignty manifested through signs and wonders.',
      ES: 'Pentecostalismo carismático con énfasis en los dones del Espíritu Santo, guerra espiritual y restauración profética.',
    },
    works: [
      { title: { PT: 'Maquiavel no Inferno', EN: 'Machiavelli in Hell', ES: 'Maquiavelo en el Infierno' } },
      { title: { PT: 'Pregações Históricas (Coletânea)', EN: 'Historical Sermons (Collection)', ES: 'Predicaciones Históricas (Colección)' } },
      { title: { PT: 'Conferências de Avivamento', EN: 'Revival Conferences', ES: 'Conferencias de Avivamiento' } },
    ],
    theologyDNA: [
      { axis: { PT: 'Evangelismo', EN: 'Evangelism', ES: 'Evangelismo' }, value: 85 },
      { axis: { PT: 'Profecia', EN: 'Prophecy', ES: 'Profecía' }, value: 95 },
      { axis: { PT: 'Teologia Sistemática', EN: 'Systematic Theology', ES: 'Teología Sistemática' }, value: 55 },
      { axis: { PT: 'Aconselhamento', EN: 'Counseling', ES: 'Consejería' }, value: 65 },
      { axis: { PT: 'Avivamento', EN: 'Revival', ES: 'Avivamiento' }, value: 100 },
      { axis: { PT: 'Apelo Emocional', EN: 'Emotional Appeal', ES: 'Apelación Emocional' }, value: 90 },
      { axis: { PT: 'Soberania', EN: 'Sovereignty', ES: 'Soberanía' }, value: 45 },
    ],
  },
  {
    id: 'tiago-brunet',
    name: 'Tiago Brunet',
    image: tiagoBrunetImg,
    flag: '🇧🇷',
    subtitle: { PT: 'O Mentor de Destinos', EN: 'The Destiny Mentor', ES: 'El Mentor de Destinos' },
    role: { PT: 'Liderança & Inteligência Emocional', EN: 'Leadership & Emotional Intelligence', ES: 'Liderazgo & Inteligencia Emocional' },
    locked: true,
    hidden: true,
    badges: [
      { PT: '150+ Palestras Indexadas', EN: '150+ Lectures Indexed', ES: '150+ Conferencias Indexadas' },
      { PT: '2.800 Páginas Processadas', EN: '2,800 Pages Processed', ES: '2.800 Páginas Procesadas' },
      { PT: '18 Milhões de Tokens', EN: '18 Million Tokens', ES: '18 Millones de Tokens' },
    ],
    bio: {
      PT: 'Esta IA encarna a visão prática e motivacional de Tiago Brunet — pastor, escritor best-seller e mentor de líderes que conecta princípios bíblicos com desenvolvimento pessoal, liderança e inteligência emocional. Seu estilo combina espiritualidade com pragmatismo empresarial, ajudando pastores a desenvolverem não apenas ministérios, mas vidas de excelência.',
      EN: 'This AI embodies the practical and motivational vision of Tiago Brunet — pastor, best-selling author, and leadership mentor who connects biblical principles with personal development, leadership, and emotional intelligence. His style combines spirituality with business pragmatism, helping pastors develop not just ministries but lives of excellence.',
      ES: 'Esta IA encarna la visión práctica y motivacional de Tiago Brunet — pastor, escritor best-seller y mentor de líderes que conecta principios bíblicos con desarrollo personal, liderazgo e inteligencia emocional.',
    },
    specialties: [
      { PT: 'Liderança Bíblica Aplicada', EN: 'Applied Biblical Leadership', ES: 'Liderazgo Bíblico Aplicado' },
      { PT: 'Inteligência Emocional Pastoral', EN: 'Pastoral Emotional Intelligence', ES: 'Inteligencia Emocional Pastoral' },
      { PT: 'Desenvolvimento Pessoal Cristão', EN: 'Christian Personal Development', ES: 'Desarrollo Personal Cristiano' },
      { PT: 'Gestão de Equipes Ministeriais', EN: 'Ministry Team Management', ES: 'Gestión de Equipos Ministeriales' },
    ],
    signatures: [
      { PT: 'Princípios bíblicos aplicados à vida prática', EN: 'Biblical principles applied to practical life', ES: 'Principios bíblicos aplicados a la vida práctica' },
      { PT: 'Linguagem acessível e motivacional', EN: 'Accessible and motivational language', ES: 'Lenguaje accesible y motivacional' },
      { PT: 'Foco em resultados e transformação pessoal', EN: 'Focus on results and personal transformation', ES: 'Enfoque en resultados y transformación personal' },
    ],
    theologyMatrix: {
      PT: 'Teologia prática neopentecostal com forte ênfase em prosperidade integral (espiritual, emocional e profissional). Visão de que princípios bíblicos são ferramentas de transformação aplicáveis a todas as áreas da vida.',
      EN: 'Practical neo-Pentecostal theology with strong emphasis on integral prosperity (spiritual, emotional, and professional). Vision that biblical principles are transformation tools applicable to all areas of life.',
      ES: 'Teología práctica neopentecostal con fuerte énfasis en prosperidad integral (espiritual, emocional y profesional).',
    },
    works: [
      { title: { PT: 'O Poder da Autoridade', EN: 'The Power of Authority', ES: 'El Poder de la Autoridad' } },
      { title: { PT: 'Pessoas Inteligentes Emocionalmente', EN: 'Emotionally Intelligent People', ES: 'Personas Emocionalmente Inteligentes' } },
      { title: { PT: 'Destino', EN: 'Destiny', ES: 'Destino' } },
      { title: { PT: '12 Dias para Atualizar Sua Vida', EN: '12 Days to Update Your Life', ES: '12 Días para Actualizar Tu Vida' } },
    ],
    theologyDNA: [
      { axis: { PT: 'Evangelismo', EN: 'Evangelism', ES: 'Evangelismo' }, value: 70 },
      { axis: { PT: 'Profecia', EN: 'Prophecy', ES: 'Profecía' }, value: 60 },
      { axis: { PT: 'Teologia Sistemática', EN: 'Systematic Theology', ES: 'Teología Sistemática' }, value: 60 },
      { axis: { PT: 'Aconselhamento', EN: 'Counseling', ES: 'Consejería' }, value: 100 },
      { axis: { PT: 'Avivamento', EN: 'Revival', ES: 'Avivamiento' }, value: 65 },
      { axis: { PT: 'Apelo Emocional', EN: 'Emotional Appeal', ES: 'Apelación Emocional' }, value: 95 },
      { axis: { PT: 'Soberania', EN: 'Sovereignty', ES: 'Soberanía' }, value: 45 },
    ],
  },
  {
    id: 'martyn-lloyd-jones',
    name: 'Martyn Lloyd-Jones',
    image: lloydJonesImg,
    flag: '🇬🇧',
    subtitle: { PT: 'O Doutor', EN: 'The Doctor', ES: 'El Doctor' },
    role: { PT: 'Método e Diagnóstico Lógico', EN: 'Method & Logical Diagnosis', ES: 'Método y Diagnóstico Lógico' },
    locked: true,
    badges: [
      { PT: '400+ Pregações Indexadas', EN: '400+ Sermons Indexed', ES: '400+ Predicaciones Indexadas' },
      { PT: '4.800 Páginas Processadas', EN: '4,800 Pages Processed', ES: '4.800 Páginas Procesadas' },
      { PT: '28 Milhões de Tokens', EN: '28 Million Tokens', ES: '28 Millones de Tokens' },
    ],
    bio: {
      PT: 'Esta IA traz a precisão cirúrgica de um médico à pregação. Lloyd-Jones abandonou a medicina no auge da carreira em Harley Street para se tornar pastor — e trouxe consigo a capacidade de diagnóstico clínico para a alma humana.',
      EN: 'This AI brings a surgeon\'s precision to preaching. Lloyd-Jones abandoned medicine at the height of his Harley Street career to become a pastor — bringing with him the capacity for clinical diagnosis of the human soul.',
      ES: 'Esta IA trae la precisión quirúrgica de un médico a la predicación. Lloyd-Jones abandonó la medicina en el apogeo de su carrera en Harley Street para convertirse en pastor.',
    },
    specialties: [
      { PT: 'Exposição Bíblica Sistemática', EN: 'Systematic Bible Exposition', ES: 'Exposición Bíblica Sistemática' },
      { PT: 'Diagnóstico Espiritual Preciso', EN: 'Precise Spiritual Diagnosis', ES: 'Diagnóstico Espiritual Preciso' },
      { PT: '"Lógica em Chamas" (Razão + Paixão)', EN: '"Logic on Fire" (Reason + Passion)', ES: '"Lógica en Llamas" (Razón + Pasión)' },
      { PT: 'Refutação de Heresias com Elegância', EN: 'Elegant Heresy Refutation', ES: 'Refutación de Herejías con Elegancia' },
    ],
    signatures: [
      { PT: 'Exposição versículo por versículo com profundidade crescente', EN: 'Verse-by-verse exposition with increasing depth', ES: 'Exposición versículo por versículo con profundidad creciente' },
      { PT: 'Diagnóstico negativo antes da prescrição positiva', EN: 'Negative diagnosis before positive prescription', ES: 'Diagnóstico negativo antes de la prescripción positiva' },
      { PT: 'Refutação sistemática de objeções antes da conclusão', EN: 'Systematic refutation of objections before conclusion', ES: 'Refutación sistemática de objeciones antes de la conclusión' },
    ],
    theologyMatrix: {
      PT: 'Calvinismo reformado clássico com ênfase na soberania absoluta de Deus na salvação. Pneumatologia robusta — defensor fervoroso do batismo com o Espírito Santo como experiência distinta da conversão.',
      EN: 'Classic Reformed Calvinism with emphasis on God\'s absolute sovereignty in salvation. Robust pneumatology — fervent defender of Spirit baptism as an experience distinct from conversion.',
      ES: 'Calvinismo reformado clásico con énfasis en la soberanía absoluta de Dios en la salvación.',
    },
    works: [
      { title: { PT: 'Pregação e Pregadores', EN: 'Preaching & Preachers', ES: 'Predicación y Predicadores' }, year: '1971' },
      { title: { PT: 'Estudos no Sermão do Monte (2 Vol.)', EN: 'Studies in the Sermon on the Mount (2 Vol.)', ES: 'Estudios en el Sermón del Monte' } },
      { title: { PT: 'Romanos (14 Volumes)', EN: 'Romans (14 Volumes)', ES: 'Romanos (14 Volúmenes)' } },
      { title: { PT: 'Depressão Espiritual', EN: 'Spiritual Depression', ES: 'Depresión Espiritual' }, year: '1965' },
    ],
    theologyDNA: [
      { axis: { PT: 'Evangelismo', EN: 'Evangelism', ES: 'Evangelismo' }, value: 75 },
      { axis: { PT: 'Profecia', EN: 'Prophecy', ES: 'Profecía' }, value: 45 },
      { axis: { PT: 'Teologia Sistemática', EN: 'Systematic Theology', ES: 'Teología Sistemática' }, value: 95 },
      { axis: { PT: 'Aconselhamento', EN: 'Counseling', ES: 'Consejería' }, value: 60 },
      { axis: { PT: 'Avivamento', EN: 'Revival', ES: 'Avivamiento' }, value: 70 },
      { axis: { PT: 'Apelo Emocional', EN: 'Emotional Appeal', ES: 'Apelación Emocional' }, value: 80 },
      { axis: { PT: 'Soberania', EN: 'Sovereignty', ES: 'Soberanía' }, value: 85 },
    ],
  },
];
