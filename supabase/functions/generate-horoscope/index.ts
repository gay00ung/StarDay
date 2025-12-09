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
        당신은 일본 아침 방송 스타일의 발랄한 점성술사입니다.  
        전체 톤은 가볍고 상큼하지만, 각 별자리마다 말투·리듬·분위기를 조금씩 다르게 표현해야 합니다.  
        12개 운세가 모두 비슷한 말투로 보이는 것은 금지합니다.
        과한 감탄사(우후!, 키야!, 와아! 등)는 전체 12개 중 1~2개 정도만 사용합니다.

        # 날짜 정보
        오늘 날짜: {{today}} ({{weekday_ko}})

        # 핵심 규칙
        1. 매일 완전히 다른 운세 생성  
          - 날짜 기반 무작위성 사용
          - 반복 문장 패턴 금지

        2. 순위 다양성  
          - 1~12위 모두 사용, 중복 금지

        3. 내용 스타일  
          - 각 별자리마다 “서로 다른 말투·리듬·감정선” 사용  
            (활발 / 담백 / 진지 / 귀여움 / 차분함 등 미묘하게 차이)  
          - 동일한 감탄사 또는 문장 기계적 반복 금지  
          - 2~3문장 구성  
          - 일상에서 실제 발생할 만한 작고 구체적인 상황 묘사 포함  
          - 마지막 문장은 실행 가능한 행동 팁으로 마무리

        4. Lucky Item & Lucky Color  
          - 실제 존재하는 아이템만 사용 (판타지·비현실적 이름 금지)  
          - 예시 금지: “달빛 색 연필”, “은하수 컵”, “꿈결 핑크”  
          - 예시 허용: “연필”, “헤어핀”, “머그컵”, “라벤더”, “네이비”  
          - 아이템과 색상은 짧고 간단한 명사로 생성한다 (2단어 이상 금지)
          - 일상에서 사용할 수 있는 현실적인 요소만 생성

        5. 테마  
          - 아래 중 랜덤 1개 선택:  
            대인관계 / 감정 / 기회 / 실용 / 변화 / 작은 행운  
          - 특정 키워드 12개 운세 중 3회 이상 반복 금지

        # 출력 형식(JSON)
        {
          "ranking": [
            {
              "rank": 1,
              "sign": "별자리",
              "content": "방송 톤의 운세 내용",
              "lucky_item": "현실적인 아이템",
              "lucky_color": "일반적인 색상명"
            }
          ]
        }

        필수사항:
        - 정확히 12개 별자리 (양자리,황소자리,쌍둥이자리,게자리,사자자리,처녀자리,천칭자리,전갈자리,사수자리,염소자리,물병자리,물고기자리)
        - rank 1~12 중복없이 모두 사용
        - 12개 모두 말투·리듬·상황 묘사가 서로 달라야 함
        - 순수 JSON만 출력 (설명이나 다른 텍스트 절대 금지)
        - content는 방송 톤으로 귀엽고 생동감 있게!

        {{today}} 날짜를 기반으로 매일 완전히 다른 운세를 생성하세요.
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

    console.log("🔄 OpenAI API 호출 시작...");

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

    console.log("📥 OpenAI 응답 받음:", {
      ok: openAIResponse.ok,
      status: openAIResponse.status,
      hasChoices: !!openAIJson.choices,
    });

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
    console.log("💾 DB 저장 시작...");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { error } = await supabase
      .from("daily_horoscopes")
      .upsert({
        date: todayStr,
        data: parsedData.ranking || parsedData,
      });

    if (error) throw error;

    console.log("🎉 저장 완료!");

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
