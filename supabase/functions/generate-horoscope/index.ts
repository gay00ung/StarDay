// Deno 환경(서버)에서 돌아감
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const weekdayNames = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

// 프롬프트 (상수, 템플릿용)
const PROMPT_TEMPLATE = `
        당신은 일본 아침 방송에서 자주 볼 수 있는 밝고 경쾌한 '오하아사 스타일'의 점성술사입니다.
        특정 방송이나 사이트의 문장을 그대로 사용하지 말고, 전체적인 분위기만 참고하세요.

        오늘 날짜는 {{today}} ({{weekday_ko}})입니다.
        이 날짜는 운세 생성의 참고 정보일 뿐이며, 응답(JSON)에는 날짜, 요일, "오늘" 등의 시간 표현을 절대 포함하지 않습니다.

        아래 조건을 반드시 지키세요:

        - 출력은 반드시 JSON 형태로만 생성합니다.
        - JSON 외 텍스트는 절대 출력하지 않습니다.
        - "ranking" 배열은 순서에 상관없이 12개의 객체를 포함합니다.
        - rank는 1~12의 모든 정수를 한 번씩만 사용해야 합니다 (중복 금지).
        - 각 별자리가 어떤 순위를 받을지는 매 호출마다 완전히 랜덤으로 결정합니다.
        - 배열의 인덱스 순서는 자유롭게 생성해도 됩니다.


        - ⚠️ 매우 중요: rank(1~12)의 순서는 매 호출마다 완전히 새롭게 생성해야 합니다.
        - ⚠️ 고정된 순서 패턴을 반복해서는 안 됩니다.
        - ⚠️ 이전 응답과 동일한 순위 배열을 절대로 생성하지 마세요.
        - 순위는 완전히 무작위(random)로 결정하며, 균일한 확률로 모든 별자리가 어떤 순위든 올 수 있습니다.

        - sign은 다음 12개 중 하나여야 합니다:
          양자리, 황소자리, 쌍둥이자리, 게자리, 사자자리, 처녀자리,
          천칭자리, 전갈자리, 사수자리, 염소자리, 물병자리, 물고기자리.

        - content는 1~2문장, 밝고 긍정적 톤 사용.
        - content에는 시간 표현(오늘/내일/요일 등)을 포함하지 않습니다.
        - lucky_item, lucky_color는 매 호출마다 랜덤하며 하나의 결과 안에서 중복을 피하세요.

        - 응답은 반드시 유효한 JSON이어야 합니다.

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
`;

Deno.serve(async (req) => {
  try {
    // 1. 오늘 날짜 (KST 기준 계산) — 여기서 한 번만 계산해서 전체에 사용
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split("T")[0]; // "2025-11-25"
    const weekdayKo = weekdayNames[kstDate.getDay()];

    console.log(`📅 생성된 날짜(KST): ${todayStr} (${weekdayKo})`);

    // 2. 프롬프트에 날짜/요일 치환
    const PROMPT = PROMPT_TEMPLATE
      .replaceAll("{{today}}", todayStr)
      .replaceAll("{{weekday_ko}}", weekdayKo);

    // 3. OpenAI 호출
    const openAIResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          messages: [{ role: "system", content: PROMPT }],
          response_format: { type: "json_object" },
        }),
      },
    );

    const openAIJson = await openAIResponse.json();

    // (A) OpenAI 에러 먼저 처리
    if (!openAIResponse.ok) {
      console.error("OpenAI error response:", openAIJson);
      throw new Error(openAIJson.error?.message ?? "OpenAI request failed");
    }

    // (B) 구조 검증
    if (
      !openAIJson.choices ||
      !Array.isArray(openAIJson.choices) ||
      openAIJson.choices.length === 0 ||
      !openAIJson.choices[0].message ||
      typeof openAIJson.choices[0].message.content !== "string"
    ) {
      console.error("Unexpected OpenAI response structure:", openAIJson);
      throw new Error("Invalid response structure from OpenAI API");
    }

    const content = openAIJson.choices[0].message.content;

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON content:", content);
      throw new Error("Failed to parse OpenAI content as JSON");
    }

    console.log("✅ OpenAI JSON parsed:", parsedData);

    // 4. Supabase DB에 저장 (같은 todayStr 사용)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { error } = await supabase
      .from("daily_horoscopes")
      .upsert({
        date: todayStr,
        data: parsedData.ranking,
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Success!", date: todayStr }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("🔴 Handler error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
