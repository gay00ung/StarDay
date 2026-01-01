import { ZODIAC_MAPPING } from "@/constants/zodiac";
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
  return formatter.format(new Date());
};

// 언어별 테이블 이름 매핑
const TABLE_MAP = {
  ko: "daily_horoscopes",
  en: "daily_horoscopes_en",
} as const;

type Language = keyof typeof TABLE_MAP;

/**
 * 운세 데이터 조회 (다국어 지원)
 * @param date - 조회할 날짜 (YYYY-MM-DD), 없으면 오늘
 * @param language - 언어 ("ko" | "en"), 기본값: "ko"
 */
export const fetchHoroscope = async (
  date?: string,
  language: Language = "ko"
): Promise<Fortune[]> => {
  try {
    const targetDate = date || getKSTToday();
    const tableName = TABLE_MAP[language];

    console.log(`📅 Supabase에서 ${targetDate} 운세를 조회합니다 (${language.toUpperCase()}).`);

    // 타임아웃 설정 (30초)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 30000)
    );

    // Supabase DB에서 조회
    const fetchPromise = supabase
      .from(tableName)
      .select("data")
      .eq("date", targetDate)
      .single();

    const result = await Promise.race([fetchPromise, timeoutPromise]).catch(
      (err) => {
        console.error("⚠️ 네트워크 에러 발생:", err);
        return {
          data: null,
          error: {
            code: err.message === "TIMEOUT" ? "TIMEOUT" : "NETWORK_ERROR",
            message: err instanceof Error ? err.message : String(err),
            details: null,
            hint: null,
          },
        };
      }
    );

    // 에러 처리
    if (result.error) {
      if (result.error.code === "PGRST116") {
        console.warn(`⚠️ 아직 오늘의 ${language} 운세 데이터가 없습니다.`);
        throw new Error(
          language === "ko"
            ? "아직 운세가 생성되지 않았습니다. 잠시 후 다시 시도해주세요."
            : "English horoscope is not available yet. Please try again later."
        );
      }

      if (result.error.code === "TIMEOUT") {
        console.warn("⚠️ 서버 응답 시간 초과");
        throw new Error("서버 응답이 느립니다. 잠시 후 다시 시도해주세요.");
      }

      if (result.error.code === "NETWORK_ERROR") {
        console.warn("⚠️ 네트워크 연결 문제");
        throw new Error("인터넷 연결을 확인해주세요.");
      }

      console.error("❌ Supabase 에러:", result.error.message);
      throw new Error(`운세 데이터를 불러올 수 없습니다: ${result.error.message}`);
    }

    // 데이터 검증
    if (!result.data || !result.data.data) {
      throw new Error("운세 데이터가 비어있습니다.");
    }

    const horoscopeData = result.data.data;
    let list: Fortune[] = [];

    // { ranking: [...] } 형태
    if (horoscopeData.ranking) {
      list = horoscopeData.ranking;
    }
    // [...] 배열 형태
    else if (Array.isArray(horoscopeData)) {
      list = horoscopeData;
    } else {
      return [];
    }

    // 영문인 경우 별자리 이름 매핑 (한글 → 영문)
    if (language === "en") {
      list = list.map((item) => ({
        ...item,
        sign:
          ZODIAC_MAPPING[item.sign as keyof typeof ZODIAC_MAPPING] || item.sign,
      }));
    }

    // 필터링 및 정렬
    return list
      .filter((item) => typeof item.rank === "number")
      .sort((a, b) => a.rank - b.rank);
  } catch (error) {
    console.error("❌ Fetch Error:", error);
    throw error;
  }
};
