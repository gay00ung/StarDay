import { supabase } from "@/lib/supabase";
import type { Fortune } from "@/types/horoscope";

export const fetchHoroscope = async (): Promise<Fortune[]> => {
  try {
    // 1. 오늘 날짜 구하기 (KST 기준, YYYY-MM-DD 형식)
    // Use Intl with a fixed timezone to avoid device-local offsets.
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const today = formatter.format(new Date()); // e.g., 2025-01-07

    console.log(`📅 Supabase에서 ${today} 운세를 조회합니다.`);

    // 2. Supabase DB에서 조회
    // "daily_horoscopes" 테이블에서 "date"가 오늘인 데이터의 "data" 컬럼만 가져옴
    const { data, error } = await supabase
      .from('daily_horoscopes')
      .select('data')
      .eq('date', today)
      .single(); // .single()은 결과가 딱 1개일 때 사용

    if (error) {
      // PGRST116 에러 코드는 "결과가 0개"라는 뜻 (아직 데이터가 없는 경우)
      if (error.code === 'PGRST116') {
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
      return result.ranking;
    }
    // 만약 [...] 배열 형태로 바로 저장되어 있다면
    if (Array.isArray(result)) {
      return result;
    }

    return [];

  } catch (error) {
    console.error("Fetch Error:", error);
    // UI가 멈추지 않게 빈 배열 반환 또는 에러 throw 선택
    throw error;
  }
};
