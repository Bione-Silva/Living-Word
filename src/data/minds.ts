import billyGrahamImg from '@/assets/minds/billy-graham.jpg';
import spurgeonImg from '@/assets/minds/charles-spurgeon.jpg';
import lloydJonesImg from '@/assets/minds/martyn-lloyd-jones.jpg';

type L = 'PT' | 'EN' | 'ES';

export interface MindWork {
  title: Record<L, string>;
  year?: string;
}

export interface MindFullData {
  id: string;
  name: string;
  image: string;
  subtitle: Record<L, string>;
  role: Record<L, string>;
  locked: boolean;
  badges: Record<L, string>[];
  bio: Record<L, string>;
  specialties: Record<L, string>[];
  signatures: Record<L, string>[];
  theologyMatrix: Record<L, string>;
  works: MindWork[];
}

export const minds: MindFullData[] = [
  {
    id: 'billy-graham',
    name: 'Billy Graham',
    image: billyGrahamImg,
    subtitle: { PT: 'O Evangelista da América', EN: 'America\'s Evangelist', ES: 'El Evangelista de América' },
    role: { PT: 'Apelo & Evangelismo em Massa', EN: 'Appeal & Mass Evangelism', ES: 'Apelación & Evangelismo Masivo' },
    locked: false,
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
  },
  {
    id: 'charles-spurgeon',
    name: 'Charles Spurgeon',
    image: spurgeonImg,
    subtitle: { PT: 'O Príncipe dos Pregadores', EN: 'The Prince of Preachers', ES: 'El Príncipe de los Predicadores' },
    role: { PT: 'Pregação Poética e Puritana', EN: 'Poetic & Puritan Preaching', ES: 'Predicación Poética y Puritana' },
    locked: true,
    badges: [
      { PT: '500+ Sermões Analisados', EN: '500+ Sermons Analyzed', ES: '500+ Sermones Analizados' },
      { PT: '8.200 Páginas Processadas', EN: '8,200 Pages Processed', ES: '8.200 Páginas Procesadas' },
      { PT: '45 Milhões de Tokens', EN: '45 Million Tokens', ES: '45 Millones de Tokens' },
    ],
    bio: {
      PT: 'Esta IA replica a mente do maior pregador da era vitoriana — o homem que lotava o Metropolitan Tabernacle com 6.000 pessoas todos os domingos, sem microfone, sem PowerPoint, apenas com a força bruta da Palavra exposta em poesia puritana. Spurgeon ditava seus sermões de memória e eles eram vendidos como jornais na segunda-feira seguinte. Esta mente digital carrega a densidade poética, o fervor calvinista e a capacidade sobrenatural de transformar doutrina seca em fogo vivo.',
      EN: 'This AI replicates the mind of the greatest preacher of the Victorian era — the man who filled the Metropolitan Tabernacle with 6,000 people every Sunday, without a microphone, without PowerPoint, solely through the brute force of the Word exposed in puritan poetry. Spurgeon dictated his sermons from memory and they were sold as newspapers the following Monday. This digital mind carries the poetic density, Calvinist fervor, and supernatural ability to transform dry doctrine into living fire.',
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
      PT: 'Calvinismo pastoral clássico (5 pontos) com ênfase na Graça Soberana e na Eleição Incondicional. Soteriologia centrada no sacrifício substitutivo de Cristo. Pneumatologia forte: a pregação só funciona quando o Espírito sopra sobre a Palavra. Escatologia historicista com foco na esperança da segunda vinda.',
      EN: 'Classic pastoral Calvinism (5 points) with emphasis on Sovereign Grace and Unconditional Election. Soteriology centered on the substitutionary sacrifice of Christ. Strong pneumatology: preaching only works when the Spirit breathes upon the Word. Historicist eschatology focused on the hope of the second coming.',
      ES: 'Calvinismo pastoral clásico (5 puntos) con énfasis en la Gracia Soberana y la Elección Incondicional.',
    },
    works: [
      { title: { PT: 'O Tesouro de Davi (Comentário dos Salmos)', EN: 'The Treasury of David (Psalms Commentary)', ES: 'El Tesoro de David' } },
      { title: { PT: 'Sermões Matutinos e Noturnos (63 Volumes)', EN: 'Morning & Evening Sermons (63 Volumes)', ES: 'Sermones Matutinos y Nocturnos' } },
      { title: { PT: 'Lições aos Meus Alunos', EN: 'Lectures to My Students', ES: 'Lecciones a Mis Estudiantes' } },
      { title: { PT: 'Devotional: Manhã e Noite', EN: 'Devotional: Morning & Evening', ES: 'Devocional: Mañana y Noche' } },
    ],
  },
  {
    id: 'martyn-lloyd-jones',
    name: 'Martyn Lloyd-Jones',
    image: lloydJonesImg,
    subtitle: { PT: 'O Doutor', EN: 'The Doctor', ES: 'El Doctor' },
    role: { PT: 'Método e Diagnóstico Lógico', EN: 'Method & Logical Diagnosis', ES: 'Método y Diagnóstico Lógico' },
    locked: true,
    badges: [
      { PT: '400+ Pregações Indexadas', EN: '400+ Sermons Indexed', ES: '400+ Predicaciones Indexadas' },
      { PT: '4.800 Páginas Processadas', EN: '4,800 Pages Processed', ES: '4.800 Páginas Procesadas' },
      { PT: '28 Milhões de Tokens', EN: '28 Million Tokens', ES: '28 Millones de Tokens' },
    ],
    bio: {
      PT: 'Esta IA traz a precisão cirúrgica de um médico à pregação. Lloyd-Jones abandonou a medicina no auge da carreira em Harley Street para se tornar pastor — e trouxe consigo a capacidade de diagnóstico clínico para a alma humana. Cada sermão é uma consulta médica espiritual: identificar o sintoma, rastrear a causa raiz e prescrever o remédio bíblico correto. A mente digital replica sua famosa fórmula de "Lógica em Chamas" — rigor intelectual inabalável servido com paixão ardente pelo evangelho.',
      EN: 'This AI brings a surgeon\'s precision to preaching. Lloyd-Jones abandoned medicine at the height of his Harley Street career to become a pastor — bringing with him the capacity for clinical diagnosis of the human soul. Each sermon is a spiritual medical consultation: identify the symptom, trace the root cause, and prescribe the correct biblical remedy. The digital mind replicates his famous "Logic on Fire" formula — unshakeable intellectual rigor served with burning passion for the gospel.',
      ES: 'Esta IA trae la precisión quirúrgica de un médico a la predicación. Lloyd-Jones abandonó la medicina en el apogeo de su carrera en Harley Street para convertirse en pastor — y trajo consigo la capacidad de diagnóstico clínico del alma humana.',
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
      PT: 'Calvinismo reformado clássico com ênfase na soberania absoluta de Deus na salvação. Pneumatologia robusta — defensor fervoroso do batismo com o Espírito Santo como experiência distinta da conversão. Cessacionismo moderado com abertura à ação extraordinária do Espírito. Eclesiologia centrada na pregação expositiva como ato central do culto.',
      EN: 'Classic Reformed Calvinism with emphasis on God\'s absolute sovereignty in salvation. Robust pneumatology — fervent defender of Spirit baptism as an experience distinct from conversion. Moderate cessationism with openness to the Spirit\'s extraordinary action. Ecclesiology centered on expository preaching as the central act of worship.',
      ES: 'Calvinismo reformado clásico con énfasis en la soberanía absoluta de Dios en la salvación.',
    },
    works: [
      { title: { PT: 'Pregação e Pregadores', EN: 'Preaching & Preachers', ES: 'Predicación y Predicadores' }, year: '1971' },
      { title: { PT: 'Estudos no Sermão do Monte (2 Vol.)', EN: 'Studies in the Sermon on the Mount (2 Vol.)', ES: 'Estudios en el Sermón del Monte' } },
      { title: { PT: 'Romanos (14 Volumes)', EN: 'Romans (14 Volumes)', ES: 'Romanos (14 Volúmenes)' } },
      { title: { PT: 'Depressão Espiritual', EN: 'Spiritual Depression', ES: 'Depresión Espiritual' }, year: '1965' },
      { title: { PT: 'Avivamento', EN: 'Revival', ES: 'Avivamiento' }, year: '1987' },
    ],
  },
];
