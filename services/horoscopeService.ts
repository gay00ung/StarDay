import { API_URLS } from "@/config/apiUrls";
import { HOROSCOPE_PROMPT, OPENAI_CONFIG } from "@/constants/openai";
import type { Fortune } from "@/types/horoscope";

export const fetchHoroscope = async (): Promise<Fortune[]> => {
  const API_KEY = OPENAI_CONFIG.apiKey;

  if (!API_KEY) {
    throw new Error("API 키가 설정되지 않았습니다.");
  }

  // OpenAI API 호출
  const response = await fetch(API_URLS.OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_CONFIG.model,
      messages: [{ role: "system", content: HOROSCOPE_PROMPT }],
      response_format: { type: "json_object" },
    })
  });

  const json = await response.json();

  // 데이터 파싱
  if (json.choices && json.choices[0].message.content) {
    const result = JSON.parse(json.choices[0].message.content);
    return result.ranking;
  } else {
    throw new Error("데이터 형식이 올바르지 않습니다.");
  }
};