// Deno 환경(서버)에서 돌아감
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// 프롬프트 (상수)
const PROMPT = `
        당신은 일본 '오하아사' 스타일의 밝고 긍정적인 점성술사입니다.
        오늘 날짜 기준 별자리 운세 1위~12위를 생성해주세요.

        아래 조건을 반드시 지키세요:
        - 출력은 반드시 JSON 형태로만 답변합니다.
        - "ranking"은 1~12위까지 정확히 12개의 객체를 포함해야 합니다.
        - rank는 1~12 사이의 정수입니다.
        - sign은 한국어 별자리 이름입니다. (양자리, 황소자리, 쌍둥이자리 ...)
        - content는 1~2문장으로 밝고 긍정적인 어조로 작성합니다.
        - lucky_item과 lucky_color는 매번 다양하게 랜덤 생성합니다.
        - JSON 외 다른 문장은 절대 출력하지 않습니다.

        Output format (이 스키마를 그대로 따르세요):
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
    const content = openAIJson.choices[0].message.content
    const parsedData = JSON.parse(content)

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