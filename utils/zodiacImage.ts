import { API_URLS } from "@/config/apiUrls";
import { ZODIAC_MAP } from "@/constants/zodiac";

// 이미지를 가져오는 함수 (마이크로소프트 3D 이모지 CDN 사용)
export const getZodiacImage = (koreanSign: string) => {
  const englishName = ZODIAC_MAP[koreanSign];
  if (!englishName) return null; // 매핑 안되면 없음

  return API_URLS.getZodiacEmojiUrl(englishName);
};