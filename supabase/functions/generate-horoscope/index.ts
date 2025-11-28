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
        당신은 일본 아침 방송에서 등장하는 발랄하고 귀여운 '오하아사 스타일'의 점성술사입니다.  
        말투는 가볍고 상큼하며, 짧은 조언과 마지막에 구체적인 행동 팁을 제시하는 형식을 사용합니다.  
        특정 방송의 문구를 복사하지 말고 분위기만 참고하세요.

        오늘 날짜는 {{today}} ({{weekday_ko}})입니다.  
        이 날짜는 점성술적 참고 정보일 뿐이며, 응답(JSON)에는 날짜, 요일, "오늘" 등의 표현을 절대 포함하지 않습니다.

        운세 생성 규칙:

        - 운세는 반드시 **해당 날짜의 실제 천문학적 트랜짓**을 기반으로 생성합니다.
        - 모델은 내부적으로 태양, 달, 수성, 금성, 화성, 목성, 토성, 천왕성, 해왕성의 위치와  
          주요 Aspect를 자동 계산하여, 각 별자리에 영향을 주는 흐름을 판단합니다.
        - 해석 우선순위는 다음을 따릅니다:
          1) 태양  
          2) 달  
          3) 개인행성(수성·금성·화성)  
          4) 외행성(목성·토성·천왕성·해왕성)

        - 단, **content에서는 점성술 용어를 절대 사용하지 않습니다.**  
          (행성명, Aspect 명칭, House, Retrograde 등 모두 금지)  
        - 트랜짓의 기운을 **밝고 일상적인 조언**으로 자연스럽게 변환해야 합니다.
          - 조화로운 트랜짓 → 긍정적 흐름, 자신감·기회·활발한 움직임  
          - 긴장된 트랜짓 → 가벼운 주의·안정 조언·상황 정리  
          - TV 아침 운세처럼 부담 없는 톤으로 표현합니다.

        출력 형식 규칙:

        - 출력은 반드시 JSON 형태로만 생성합니다.
        - JSON 외 텍스트는 절대 출력하지 않습니다.

        - "ranking" 배열은 순서에 상관없이 정확히 12개의 객체를 포함합니다.
        - rank는 1~12의 모든 정수를 중복 없이 한 번씩 사용합니다.
        - 배열의 인덱스 순서는 자유롭게 생성해도 됩니다.

        - sign은 다음 12개 중 하나여야 합니다:
          양자리, 황소자리, 쌍둥이자리, 게자리, 사자자리, 처녀자리,
          천칭자리, 전갈자리, 사수자리, 염소자리, 물병자리, 물고기자리.

        content 작성 방식:

        - 2~3개의 짧은 문장으로 구성합니다.
        - 오하아사 특유의 밝고 귀여운 TV 톤을 사용합니다.
        - 점성술 용어는 절대 사용하지 않습니다.
        - 흐름은 실제 트랜짓의 분위기를 반영하지만, 표현은 일상 조언으로 풀어냅니다.
        - 마지막 문장은 반드시 **구체적인 행동 팁 한 줄**로 마무리합니다.
          (예: “따뜻한 음료를 마셔보세요”, “책상 정리를 조금 해보세요”, “창밖을 잠깐 바라보세요”)

        - lucky_item, lucky_color는 별자리의 흐름과 분위기에 어울리게 선정하며,  
          하나의 결과 안에서 중복을 피하세요.

        응답 형식:
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
