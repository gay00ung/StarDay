import { API_URLS } from "@/config/apiUrls";
import { ZODIAC_EN_TO_KO, ZODIAC_MAPPING } from "@/constants/zodiac";

/**
 * 이미지를 가져오는 함수 (마이크로소프트 3D 이모지 CDN 사용)
 * @param sign - 한글 또는 영어 별자리 이름
 * @returns 이미지 URL (string) 또는 매핑이 없을 경우 undefined
 */
export const getZodiacImage = (sign: string) => {
  // 한글인 경우 영어로 변환
  let englishName = ZODIAC_MAPPING[sign];
  
  // 이미 영어인 경우 그대로 사용
  if (!englishName && ZODIAC_EN_TO_KO[sign]) {
    englishName = sign;
  }
  
  if (!englishName) return undefined;

  return API_URLS.getZodiacEmojiUrl(englishName);
};