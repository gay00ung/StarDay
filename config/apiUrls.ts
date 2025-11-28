export const API_URLS = {
  FLUENT_EMOJI_BASE: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets',
  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  CRYSTAL_BALL_EMOJI: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crystal%20ball/3D/crystal_ball_3d.png',
  
  getZodiacEmojiUrl: (englishName: string) => 
    `${API_URLS.FLUENT_EMOJI_BASE}/${englishName}/3D/${englishName.toLowerCase()}_3d.png`,
};
