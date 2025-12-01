import { supabase } from "@/lib/supabase";
import type { Fortune } from "@/types/horoscope";

// KST 기준 오늘 날짜 구하기
const getKSTToday = (): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // e.g., 2025-01-07
};

export const fetchHoroscope = async (date?: string): Promise<Fortune[]> => {
  try {
    // 날짜가 없으면 KST 기준 오늘 날짜 사용
    const targetDate = date || getKSTToday();

    console.log(`📅 Supabase에서 ${targetDate} 운세를 조회합니다.`);

    // Supabase DB에서 조회
    const { data, error } = await supabase
      .from("daily_horoscopes")
      .select("data")
      .eq("date", targetDate)
      .single();

    if (error) {
      // PGRST116 에러 코드는 "결과가 0개"라는 뜻 (아직 데이터가 없는 경우)
      if (error.code === "PGRST116") {
        console.warn("⚠️ 아직 오늘의 운세 데이터가 없습니다.");
        return []; // 빈 배열 반환 (에러 아님)
      }
      throw new Error(error.message);
    }

    // 3. 데이터 반환
    if (!data || !data.data) {
      return [];
    }

    // DB에 저장된 JSON 구조에 따라 유연하게 처리
    const result = data.data;

    // 만약 { ranking: [...] } 형태로 저장되어 있다면
    if (result.ranking) {
      const list: Fortune[] = result.ranking;

      return list
        .filter((item) => typeof item.rank === "number")
        .sort((a, b) => a.rank - b.rank);
    }

    // 만약 [...] 배열 형태로 바로 저장되어 있다면
    if (Array.isArray(result)) {
      const list: Fortune[] = result;

      return list.filter((item) => typeof item.rank === "number")
        .sort((a, b) => a.rank - b.rank);
    }

    return [];
  } catch (error) {
    console.error("Fetch Error:", error);
    // UI가 멈추지 않게 빈 배열 반환 또는 에러 throw 선택
    throw error;
  }
};
