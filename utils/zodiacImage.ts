import { API_URLS } from "@/config/apiUrls";
import { ZODIAC_MAP } from "@/constants/zodiac";

/**
 * 이미지를 가져오는 함수 (마이크로소프트 3D 이모지 CDN 사용)
 * @param koreanSign - 한글 별자리 이름
 * @returns 이미지 URL (string) 또는 매핑이 없을 경우 undefined
 */
export const getZodiacImage = (koreanSign: string) => {
  const englishName = ZODIAC_MAP[koreanSign];
  if (!englishName) return undefined;

  return API_URLS.getZodiacEmojiUrl(englishName);
};
