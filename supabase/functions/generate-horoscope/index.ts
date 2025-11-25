// Deno 환경(서버)에서 돌아감
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// 오늘 날짜 생성
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const weekday = weekdayNames[today.getDay()];

// 날짜 문자열
const TODAY_STRING = `${yyyy}-${mm}-${dd}`;
const TODAY_KOREAN = weekday;

// 프롬프트 (상수)
const PROMPT = `
        당신은 일본 아침 방송에서 자주 볼 수 있는, 밝고 경쾌한 '오하아사 스타일'의 점성술사입니다.  
        단, 특정 실제 방송이나 사이트의 문장을 모방하거나 재현하지는 말고, 전체적인 분위기와 말투만 참고하세요.

        오늘 날짜는 {{today}} ({{weekday_ko}})입니다.  
        이 날짜는 운세를 생성할 때 참고만 하며, **응답(JSON)에는 절대 날짜, 요일, 오늘({{today}} 등)를 직접적으로 언급하지 않습니다.**  
        예:  
        - "2025-11-25 기준으로는…"  
        - "화요일에는…"  
        - "11월 25일의 운세는…"  
        => 모두 금지합니다.

        content는 날짜를 언급하지 않고, 분위기·기운·흐름 같은 **중립적이고 밝은 표현**으로 작성하세요.  
        예:  
        - "기회가 자연스럽게 다가오는 날입니다."  
        - "활기찬 에너지가 흐르며 새로운 만남에 좋은 기운이에요."  
        (날짜/요일 X)

        아래 조건을 반드시 지키세요:
        - 출력은 반드시 **JSON 형태로만** 생성합니다.  
        - JSON 외 텍스트는 절대 출력하지 않습니다.
        - "ranking" 배열은 정확히 12개의 객체를 포함해야 합니다.
        - rank는 1~12의 모든 정수를 한 번씩 포함해야 합니다.
        - sign은 한국어 별자리 이름 12종 중 하나여야 합니다.
        - content는 1~2문장, 밝고 긍정적, 날짜·요일·"오늘" 표시 금지.
        - lucky_item과 lucky_color는 매번 다양하게 랜덤 생성하고, 가능한 한 중복을 피하세요.
        - JSON은 유효한 형식으로 생성하세요.

        Output format:
        {
          "ranking": [
            {
              "rank": 1,
              "sign": "별자리이름",
              "content": "운세내용",
              "lucky_item": "아이템",
              "lucky_color": "색상"
            }
          ]
        }
`

Deno.serve(async (req) => {
  try {
    // 1. OpenAI 호출
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
      model:  "gpt-5-nano", // 별로면 gpt-5-mini 이걸로 교체 예정 ,,
        messages: [{ role: 'system', content: PROMPT }],
        response_format: { type: 'json_object' },
      }),
    })

    const openAIJson = await openAIResponse.json()

    // Validate OpenAI response structure
    if (
      !openAIResponse.ok ||
      !openAIJson.choices ||
      !Array.isArray(openAIJson.choices) ||
      openAIJson.choices.length === 0 ||
      !openAIJson.choices[0].message ||
      typeof openAIJson.choices[0].message.content !== 'string'
    ) {
      throw new Error('Invalid response structure from OpenAI API')
    }

    const content = openAIJson.choices[0].message.content
    let parsedData
    try {
      parsedData = JSON.parse(content)
    } catch (e) {
      throw new Error('Failed to parse OpenAI content as JSON')
    }

    // 2. 오늘 날짜 (KST 기준 계산)
    // 서버는 UTC이므로 9시간을 더해야 한국 날짜가 됩니다.
    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000
    const kstDate = new Date(now.getTime() + kstOffset)
    const todayStr = kstDate.toISOString().split('T')[0] // "2025-11-25"

    console.log(`📅 생성된 날짜(KST): ${todayStr}`)

    // 3. Supabase DB에 저장 (Service Role Key 사용 -> 권한 무시하고 쓰기 가능)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await supabase
      .from('daily_horoscopes')
      .upsert({ 
        date: todayStr, 
        data: parsedData.ranking // { ranking: [...] } 에서 배열만 추출해서 저장
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Success!', date: todayStr }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
