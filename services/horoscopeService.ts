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

    // 타임아웃 설정 (30초) - 간헐적 네트워크 문제 대응
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 30000)
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
          code: err.message === 'TIMEOUT' ? 'TIMEOUT' : 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : String(err),
          details: null,
          hint: null
        }
      };
    });

    if (result.error) {
      // PGRST116 에러 코드는 "결과가 0개"라는 뜻 (아직 데이터가 없는 경우)
      if (result.error.code === "PGRST116") {
        console.warn("⚠️ 아직 오늘의 운세 데이터가 없습니다.");
        throw new Error("아직 운세가 생성되지 않았습니다. 잠시 후 다시 시도해주세요.");
      }

      // 타임아웃 에러인 경우
      if (result.error.code === 'TIMEOUT') {
        console.warn("⚠️ 서버 응답 시간 초과");
        throw new Error("서버 응답이 느립니다. 잠시 후 다시 시도해주세요.");
      }
      
      // 네트워크 에러인 경우
      if (result.error.code === 'NETWORK_ERROR') {
        console.warn("⚠️ 네트워크 연결 문제로 운세를 불러올 수 없습니다.");
        throw new Error("인터넷 연결을 확인해주세요.");
      }

      // 기타 에러
      console.error('❌ Supabase 에러:', result.error.message);
      throw new Error(`운세 데이터를 불러올 수 없습니다: ${result.error.message}`);
    }

    // 3. 데이터 반환
    if (!result.data || !result.data.data) {
      throw new Error("운세 데이터가 비어있습니다.");
    }

    // DB에 저장된 JSON 구조에 따라 유연하게 처리
    const horoscopeData = result.data.data;

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
