import requests
import json
import os

SUPABASE_URL = "https://priumwdestycikzfcysg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

user_id = "945f6c31-52a1-46a5-91f9-ed1954c3ae06" # bx4usa@gmail.com

series_data = [
    {
        "title": "Série: O Tesouro da Graça (Spurgeon)",
        "theme": "Charles Spurgeon",
        "overview": "Uma exploração da graça de Deus sob a perspectiva do Príncipe dos Pregadores. Vamos mergulhar na poesia e na profundidade teológica de Spurgeon para entender como a graça nos transforma.",
        "weeks": [
            {
                "week_number": 1,
                "title": "O Chamado Soberano",
                "overview": "Como a graça de Deus nos encontra antes mesmo de a buscarmos. O chamado irresistível que aquece a alma.",
                "texts": ["Salmo 34:8", "João 6:44"],
                "topics": ["Graça Preveniente", "Atratividade Divina", "Resposta de Fé"]
            },
            {
                "week_number": 2,
                "title": "A Rocha da Salvação",
                "overview": "A segurança inabalável do crente em Cristo. Firmando nossos pés na Rocha que nunca falha.",
                "texts": ["Salmo 18:2", "Mateus 7:24-25"],
                "topics": ["Segurança Eterna", "Confiança", "Fundamento"]
            },
            {
                "week_number": 3,
                "title": "O Incenso da Oração",
                "overview": "A oração como o motor da vida cristã. Como Spurgeon via a intercessão como o fôlego da alma.",
                "texts": ["Tiago 5:16", "Lucas 18:1"],
                "topics": ["Intercessão", "Poder", "Comunhão"]
            },
            {
                "week_number": 4,
                "title": "Firmes na Fé",
                "overview": "A perseverança dos santos em meio às provações. Correndo a carreira com os olhos fitos em Jesus.",
                "texts": ["1 Coríntios 16:13", "Filipenses 1:6"],
                "topics": ["Perseverança", "Resiliência", "Esperança"]
            }
        ]
    },
    {
        "title": "Série: Santidade ao Senhor (Wesley)",
        "theme": "John Wesley",
        "overview": "Inspirada no avivamento metodista, esta série busca o 'coração estranhamente aquecido' e a busca prática pela perfeição cristã no amor.",
        "weeks": [
            {
                "week_number": 1,
                "title": "O Coração Aquecido",
                "overview": "A experiência vital do novo nascimento e a certeza da salvação pelo testemunho do Espírito.",
                "texts": ["Lucas 24:32", "Atos 2:1-4"],
                "topics": ["Experiência", "Testemunho do Espírito", "Novidade de Vida"]
            },
            {
                "week_number": 2,
                "title": "O Caminho da Santidade",
                "overview": "A busca deliberada pela santificação como um processo contínuo de consagração total a Deus.",
                "texts": ["Mateus 5:48", "Hebreus 12:14"],
                "topics": ["Santificação", "Amor Perfeito", "Consagração"]
            },
            {
                "week_number": 3,
                "title": "Zelo Evangelístico",
                "overview": "O mundo é a minha paróquia. A urgência de levar o evangelho a cada pessoa sob o céu.",
                "texts": ["Marcos 16:15", "Atos 1:8"],
                "topics": ["Missões", "Paixão", "Urgência"]
            },
            {
                "week_number": 4,
                "title": "Vida Metódica",
                "overview": "A importância das disciplinas espirituais na manutenção do fogo de Deus em nossas vidas.",
                "texts": ["Colossenses 3:17", "Gálatas 5:25"],
                "topics": ["Disciplina", "Método", "Consistência"]
            }
        ]
    },
    {
        "title": "Série: A Glória de Deus Exposta (Calvino)",
        "theme": "João Calvino",
        "overview": "Uma série focada na soberania absoluta de Deus e no prazer de glorificá-Lo em todos os aspectos da nossa existência terrena.",
        "weeks": [
            {
                "week_number": 1,
                "title": "O Conhecimento de Deus",
                "overview": "O início da verdadeira sabedoria: conhecer a Deus e, a partir dEle, entender nossa própria condição.",
                "texts": ["Romanos 11:33", "Salmo 111:10"],
                "topics": ["Sabedoria", "Reverência", "Padrão Divino"]
            },
            {
                "week_number": 2,
                "title": "A Preeminência de Cristo",
                "overview": "Cristo como o centro de todas as coisas. Ele é o Profeta, Sacerdote e Rei soberano.",
                "texts": ["Colossenses 1:18", "Filipenses 2:9-11"],
                "topics": ["Cristocentrismo", "Soberania", "Reino"]
            },
            {
                "week_number": 3,
                "title": "A Vontade Revelada",
                "overview": "A autoridade suprema das Escrituras como nossa regra de fé e prática inquestionável.",
                "texts": ["Salmo 119:105", "2 Timóteo 3:16"],
                "topics": ["Escritura", "Autoridade", "Luta contra as Trevas"]
            },
            {
                "week_number": 4,
                "title": "Soli Deo Gloria",
                "overview": "A finalidade principal do homem: glorificar a Deus e gozá-Lo para sempre em tudo o que fazemos.",
                "texts": ["1 Coríntios 10:31", "Isaías 43:7"],
                "topics": ["Adoração", "Vida Integral", "Doxologia"]
            }
        ]
    },
    {
        "title": "Série: O Avivamento Verdadeiro (Lloyd-Jones)",
        "theme": "Martyn Lloyd-Jones",
        "overview": "Uma análise profunda e bíblica sobre o que constitui o verdadeiro avivamento e a necessidade vital da unção do Espírito.",
        "weeks": [
            {
                "week_number": 1,
                "title": "Lógica em Chamas",
                "overview": "A pregação que combina a verdade teológica sólida com o calor e o fogo do Espírito Santo.",
                "texts": ["Atos 17:2-3", "1 Tessalonicenses 1:5"],
                "topics": ["Homilética", "Fogo", "Razão"]
            },
            {
                "week_number": 2,
                "title": "O Poder do Espírito",
                "overview": "A necessidade desesperada da igreja pela visitação do Espírito Santo para o testemunho eficaz.",
                "texts": ["Efésios 5:18", "Atos 1:8"],
                "topics": ["Poder", "Visitação", "Avivamento"]
            },
            {
                "week_number": 3,
                "title": "Diagnóstico da Alma",
                "overview": "Como lidar com a depressão espiritual e reencontrar a alegria do Senhor através da verdade aplicada.",
                "texts": ["Salmo 42:11", "Jeremias 33:3"],
                "topics": ["Cura", "Mente Cristã", "Vitória"]
            },
            {
                "week_number": 4,
                "title": "A Autoridade da Palavra",
                "overview": "Manter-se firme na verdade infalível em um mundo de ceticismo e confusão doutrinária.",
                "texts": ["2 Timóteo 3:16", "Judas 1:3"],
                "topics": ["Verdade", "Combate", "Firmeza"]
            }
        ]
    }
]

for s in series_data:
    material = {
        "user_id": user_id,
        "title": s['title'],
        "type": "series_calendar",
        "content": s,  # The API might want an object or a stringified JSON depending on column type. 
        # But for 'jsonb' in Supabase Rest API, we send the object.
        "language": "PT"
    }
    insert_res = requests.post(f"{SUPABASE_URL}/rest/v1/materials", headers=headers, json=material)
    if insert_res.status_code in [201, 204]:
        print(f"Series inserted: {s['title']}")
    else:
        print(f"Error inserting {s['title']}: {insert_res.text}")

