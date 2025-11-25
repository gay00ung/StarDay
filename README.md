# 🌟 호시링링 (StarDay)

<p align="center">
  <img src="./assets/images/icon.png" width="120" alt="호시링링 앱 아이콘" />
</p>

<p align="center">
  <b>AI가 매일 전해주는 별자리 운세</b><br/>
  밝고 긍정적인 에너지로 하루를 시작하세요! ✨
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-54-000020?logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenAI-GPT-412991?logo=openai" alt="OpenAI" />
</p>

---

## 📱 앱 소개

**호시링링**은 일본의 아침 정보 프로그램 '오하아사' 스타일의 밝고 긍정적인 별자리 운세를 매일 제공하는 앱입니다.

OpenAI GPT를 활용하여 매일 자정에 자동으로 12별자리 운세 랭킹을 생성하고, 사용자에게 오늘의 운세, 럭키 아이템, 럭키 컬러를 알려드립니다.

### ✨ 주요 기능

- 🔮 **일일 별자리 운세 랭킹** - 1위부터 12위까지 오늘의 운세 확인
- 🍀 **럭키 아이템 & 럭키 컬러** - 행운을 부르는 아이템과 색상
- 🌙 **다크 모드 지원** - 눈이 편안한 다크/라이트 테마
- ⏰ **매일 자동 업데이트** - 자정마다 새로운 운세 생성

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React Native, Expo, TypeScript |
| **Navigation** | Expo Router (File-based routing) |
| **Backend** | Supabase (PostgreSQL, Edge Functions) |
| **AI** | OpenAI GPT API |
| **Automation** | Supabase Cron Job (매일 00:00 KST) |
| **Build** | EAS Build (Android/iOS) |

---

## 🏗️ 프로젝트 구조

```
StarDay/
├── app/                      # 화면 (Expo Router)
│   ├── (tabs)/               # 탭 네비게이션
│   └── _layout.tsx           # 루트 레이아웃
├── components/
│   ├── horoscope/            # 운세 관련 컴포넌트
│   │   ├── FortuneCard.tsx   # 운세 카드 UI
│   │   └── LoadingView.tsx   # 로딩 화면
│   └── ui/                   # 공통 UI 컴포넌트
├── services/                 # API 서비스 레이어
│   └── horoscopeService.ts   # 운세 데이터 조회
├── lib/                      # 외부 라이브러리 설정
│   └── supabase.ts           # Supabase 클라이언트
├── constants/                # 상수 정의
│   ├── openai.ts             # OpenAI 프롬프트
│   ├── theme.ts              # 테마 색상
│   └── zodiac.ts             # 별자리 정보
├── types/                    # TypeScript 타입
├── utils/                    # 유틸리티 함수
└── supabase/
    └── functions/
        └── generate-horoscope/  # Edge Function (Deno)
```

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- Expo CLI
- Supabase 계정
- OpenAI API 키

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/gay00ung/StarDay.git
cd StarDay

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env 파일 생성 후 아래 값 설정
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. 개발 서버 실행
npx expo start
```

### 빌드

```bash
# Android Preview 빌드
eas build -p android --profile preview

# iOS Preview 빌드
eas build -p ios --profile preview

# Production 빌드
eas build --profile production
```

---

## ⚙️ 자동화 시스템

```
┌─────────────────────────────────────────────────────────┐
│                    매일 00:00 KST                        │
│                         ↓                               │
│              Supabase Cron Job 트리거                    │
│                         ↓                               │
│         Edge Function (generate-horoscope) 실행          │
│                         ↓                               │
│              OpenAI API 호출 → 운세 생성                  │
│                         ↓                               │
│           Supabase DB 저장 (daily_horoscopes)            │
│                         ↓                               │
│              앱에서 오늘 날짜 운세 조회                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📄 라이선스

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

© 2025 gayoung. All rights reserved.

---

## 👩‍💻 개발자

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/gay00ung">
        <img src="https://github.com/gay00ung.png" width="100px;" alt="gayoung"/>
        <br />
        <sub><b>gayoung</b></sub>
      </a>
    </td>
  </tr>
</table>

---

<p align="center">
  Made with 💜 by gayoung
</p>
