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

    // 타임아웃 설정 (15초) - 간헐적 네트워크 문제 대응
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('네트워크 요청 시간 초과')), 15000)
    );

    // Supabase DB에서 조회 (타임아웃과 함께)
    const fetchPromise = supabase
      .from("daily_horoscopes")
      .select("data")
      .eq("date", targetDate)
      .single();

    const result = await Promise.race([
      fetchPromise,
      timeoutPromise
    ]).catch((err) => {
      console.error('⚠️ 네트워크 에러 발생:', err);
      // 타임아웃이나 네트워크 에러 시 에러 객체 반환
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : String(err),
          details: null,
          hint: null
        }
      };
    });

    const { data, error } = result;

    if (error) {
      // PGRST116 에러 코드는 "결과가 0개"라는 뜻 (아직 데이터가 없는 경우)
      if (error.code === "PGRST116") {
        console.warn("⚠️ 아직 오늘의 운세 데이터가 없습니다.");
        return []; // 빈 배열 반환 (에러 아님)
      }

      // 네트워크 에러인 경우 빈 배열 반환 (앱 크래시 방지)
      if (error.code === 'NETWORK_ERROR') {
        console.warn("⚠️ 네트워크 연결 문제로 운세를 불러올 수 없습니다.");
        return [];
      }

      // 기타 에러는 로그만 남기고 빈 배열 반환
      console.error('❌ Supabase 에러:', error.message);
      return [];
    }

    // 3. 데이터 반환
    if (!data || !data.data) {
      return [];
    }

    // DB에 저장된 JSON 구조에 따라 유연하게 처리
    const horoscopeData = data.data;

    // 만약 { ranking: [...] } 형태로 저장되어 있다면
    if (horoscopeData.ranking) {
      const list: Fortune[] = horoscopeData.ranking;

      return list
        .filter((item) => typeof item.rank === "number")
        .sort((a, b) => a.rank - b.rank);
    }

    // 만약 [...] 배열 형태로 바로 저장되어 있다면
    if (Array.isArray(horoscopeData)) {
      const list: Fortune[] = horoscopeData;

      return list.filter((item) => typeof item.rank === "number")
        .sort((a, b) => a.rank - b.rank);
    }

    return [];
  } catch (error) {
    console.error("❌ Fetch Error:", error);
    // UI가 멈추지 않게 빈 배열 반환 (앱 크래시 방지)
    return [];
  }
};
