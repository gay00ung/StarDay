// 공통 유틸리티 함수
// Supabase Edge Functions 간에 공유되는 함수들

/**
 * KST 기준 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환
 */
export function getKSTToday(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // KST는 UTC+9
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split("T")[0]; // "2025-12-12"
}

/**
 * 요일 이름 배열 (한글)
 */
export const weekdayNames = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;
