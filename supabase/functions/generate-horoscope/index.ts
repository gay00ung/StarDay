// Deno 환경(서버)에서 돌아감
import { createClient } from "@supabase/supabase-js";
import { getKSTToday, weekdayNames } from "../_shared/utils.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// 프롬프트 (상수, 템플릿용)
const PROMPT_TEMPLATE = `
        당신은 일본 아침 방송 스타일의 발랄한 점성술사입니다.  
        전체 톤은 가볍고 상큼하지만, 12개 별자리 각각은 말투·리듬·감정선이 모두 달라야 합니다.  
        12개 운세가 비슷한 말투로 보이는 것은 절대 금지합니다.  
        과한 감탄사는 12개 중 최대 2개까지만 허용합니다.

        # 날짜 정보
        오늘 날짜: {{today}} ({{weekday_ko}})

        # 지난 일주일 운세 참고 데이터
        {{previous_week_data}}

        # 핵심 생성 규칙

        1) **완전 비중복 콘텐츠 생성**
        - 오늘 생성되는 모든 내용은 지난 7일간 사용된 단어/상황/문장 패턴과 절대 겹치면 안 됩니다.
        - "금지 리스트"를 내부적으로 생성하여, 지난 7일 데이터에서 사용된 상황·아이템·색상·문장 어미·리듬 구조를 모두 제외하고 작성하세요.
        - 문장 구조(문장 길이, 쉼표 위치, 리듬), 문장 어미(-해요 / -됩니다 / -할 수 있어요 등)도 7일 내 1회만 허용합니다.
        - 유사한 구조나 키워드가 감지되면, 모델은 내부적으로 재작성하여 완전 새로운 문장으로 교체합니다.
        - "커피 흘릴 뻔했다", "문자 한 줄", "옛 친구 만남", "날씨 언급" 등 지난 7일 유사 상황 절대 금지.

        2) **순위 배정 규칙**
        - rank 1~12 모두 사용하며, 중복 금지.
        - 어제(지난 데이터의 가장 최근 날짜)와 동일한 별자리-순위 조합은 절대 금지.
        - 지난 7일간 동일 별자리가 같은 순위에 2회 이상 배치되었다면, 오늘은 그 순위를 부여할 수 없음.
        - 12개 항목은 최종 출력 시 rank 기준 오름차순 정렬.

        3) **스타일 차별화 규칙**
        - 각 별자리는 말투, 문장 길이, 리듬, 감정선, 속도감이 모두 달라야 합니다.
        - 12개 중 3개 이상이 비슷한 말투처럼 보이면 즉시 재작성합니다.
        - 2~3문장 구성으로, 중간에 뚜렷한 상황 묘사를 1회 포함.
        - 마지막 문장은 반드시 "실행 가능한 행동 팁"으로 마무리.

        4) **테마 규칙**
        - 다음 중 랜덤 1개 선택: 대인관계 / 감정 / 기회 / 실용 / 변화 / 작은 행운
        - 같은 테마는 최근 3일 내 반복 금지.
        - 지난 7일 동안 2회 등장한 테마는 오늘 금지.

        5) **Lucky Item & Lucky Color 규칙**
        - 현실에서 존재하는 간단한 명사만 사용 (2단어 금지)
          예: 연필, 우산, 카드지갑, 볼펜, 머그컵, 가방  
          예: 네이비, 레드, 민트, 브라운, 베이지
        - 지난 7일 안에 등장했던 item·color 조합은 금지.
        - item만 동일하거나 color만 동일한 경우도 7일 내 1회만 허용.

        6) **자동 품질 점검(중요!)**
        - 각 별자리 문장을 생성한 후, 모델은 내부적으로 다음 항목을 점검하고 문제가 발견되면 자동 재작성합니다:
          - 과거 문장·상황·패턴과의 유사도
          - 말투 중복
          - 키워드 중복
          - 지나치게 비슷한 구조
          - 감탄사 사용 횟수 제한
        - 이 내부 점검 과정은 출력에 포함하지 않습니다.

        # 반드시 포함해야 하는 별자리
        양자리, 황소자리, 쌍둥이자리, 게자리, 사자자리, 처녀자리, 천칭자리, 전갈자리, 사수자리, 염소자리, 물병자리, 물고기자리

        # 최종 출력 형식(JSON만!)
        {
          "ranking": [
            {
              "rank": 1,
              "sign": "별자리",
              "content": "방송 톤의 완전 새로운 운세 내용",
              "lucky_item": "현실적 아이템",
              "lucky_color": "일반 색상"
            },
            ...
          ]
        }

        출력은 반드시 **JSON만**, 여분 문장 금지.
`;

Deno.serve(async (_req) => {
  try {
    // Supabase 클라이언트 초기화
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. 오늘 날짜 (KST 기준) - 공통 함수 사용
    const todayStr = getKSTToday();
    const kstDate = new Date(todayStr + "T00:00:00+09:00"); // KST 기준 Date 객체
    const weekdayKo = weekdayNames[kstDate.getDay()];

    console.log(`📅 생성된 날짜(KST): ${todayStr} (${weekdayKo})`);

    // 일주일 전 날짜 계산
    const oneWeekAgo = new Date(kstDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

    console.log(`📅 일주일 범위: ${oneWeekAgoStr} ~ ${todayStr}`);

    const { data: previousWeekData, error: fetchError } = await supabase
      .from("daily_horoscopes")
      .select("date, data") // 컬럼 선택
      .gte("date", oneWeekAgoStr) // 필터 : 날짜 >= 일주일 전
      .lt("date", todayStr) // 필터 : 날짜 < 오늘
      .order("date", { ascending: false }); // 정렬 : 날짜 내림차순

    if (fetchError) {
      console.error("⚠️ 지난 운세 조회 실패:", fetchError);
      // 에러가 나도 계속 진행 (신규 DB일 수 있음)
    }

    console.log(
      `📚 지난 일주일 운세 ${previousWeekData?.length || 0}개 조회됨`,
    );

    // 지난 운세 데이터를 텍스트로 변환 (프롬프트 삽입용)
    let previousWeekText = "";

    if (previousWeekData && previousWeekData.length > 0) {
      previousWeekText = previousWeekData
        .map((item) => {
          const rankings = Array.isArray(item.data)
            ? item.data
            : item.data?.ranking || [];
          const summary = rankings
            .map((r: any) =>
              `${r.sign}(${r.rank}위): "${r.content}" / ${r.lucky_item} / ${r.lucky_color}`
            )
            .join("\n");
          return `[${item.date}]\n${summary}`;
        })
        .join("\n\n");
    }

    // 2. 프롬프트에 날짜/요일/지난주 데이터 치환
    const PROMPT = PROMPT_TEMPLATE
      .replaceAll("{{today}}", todayStr)
      .replaceAll("{{weekday_ko}}", weekdayKo)
      .replaceAll("{{previous_week_data}}", previousWeekText);

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
