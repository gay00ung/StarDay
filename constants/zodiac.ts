// 별자리 한글 이름 -> 영어 이름 매핑 테이블
export const ZODIAC_MAP: { [key: string]: string } = {
  "양자리": "Aries",
  "황소자리": "Taurus",
  "쌍둥이자리": "Gemini",
  "게자리": "Cancer",
  "사자자리": "Leo",
  "처녀자리": "Virgo",
  "천칭자리": "Libra",
  "전갈자리": "Scorpio",
  "사수자리": "Sagittarius",
  "염소자리": "Capricorn",
  "물병자리": "Aquarius",
  "물고기자리": "Pisces",
};

// 별자리 목록 배열
export const ZODIAC_SIGNS = Object.keys(ZODIAC_MAP);