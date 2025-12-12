// Edge Function: 매일 자정 5분에 실행 (한글 생성 후)
// 역할: 한글 운세 -> DeepL 번역 -> 영문 DB 저장

import { createClient } from "@supabase/supabase-js";
import { getKSTToday } from "../_shared/utils.ts";

const DEEPL_API_KEY = Deno.env.get("DEEPL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// DeepL API 번역 함수 (REST API 직접 호출)
async function translateWithDeepL(texts: {
  content: string;
  lucky_item: string;
  lucky_color: string;
}) {
  console.log("🌐 DeepL 번역 시작:", texts);

  try {
    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [texts.content, texts.lucky_item, texts.lucky_color],
        target_lang: "EN",
        source_lang: "KO",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ DeepL API 에러:", error);
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ 번역 완료:", result.translations.length, "개");

    // 응답 검증
    if (!result.translations || result.translations.length !== 3) {
      throw new Error("Invalid DeepL response: expected 3 translations");
    }

    return {
      content: result.translations[0].text,
      lucky_item: result.translations[1].text,
      lucky_color: result.translations[2].text,
    };
  } catch (error) {
    console.error("❌ 번역 실패:", error);
    throw error;
  }
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 한글 운세 데이터 가져오기
    const today = getKSTToday();
    const { data: koData } = await supabase
      .from("daily_horoscopes") // 한글 테이블
      .select("data")
      .eq("date", today)
      .single();

    if (!koData) {
      return new Response(
        JSON.stringify({ error: "No Korean horoscope data found for today" }),
        { status: 404 },
      );
    }

    // DeepL API를 사용하여 번역
    const translatedData = [];
    const ranking = koData.data?.ranking || koData.data;
    
    if (!Array.isArray(ranking)) {
      console.error("❌ ranking is not an array:", ranking);
      return new Response(
        JSON.stringify({ error: "Invalid data structure", data: koData.data }),
        { status: 500 },
      );
    }

    for (const item of ranking) {
      const translated = await translateWithDeepL({
        content: item.content,
        lucky_item: item.lucky_item,
        lucky_color: item.lucky_color,
      });

      translatedData.push({
        rank: item.rank,
        sign: item.sign,
        content: translated.content,
        lucky_item: translated.lucky_item,
        lucky_color: translated.lucky_color,
      });
    }

    // 영문 운세 데이터 저장
    await supabase
      .from("daily_horoscopes_en") // 영문 테이블
      .upsert({
        date: today,
        data: { ranking: translatedData },
      });
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
});
