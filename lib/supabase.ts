import { createClient } from '@supabase/supabase-js';
import { Alert } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseApiKey = process.env.EXPO_PUBLIC_SUPABASE_API_KEY;

// 환경 변수가 없을 때 안전한 처리
if (!supabaseUrl || !supabaseApiKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('EXPO_PUBLIC_SUPABASE_API_KEY:', supabaseApiKey ? '✓' : '✗');

  // 개발 환경에서만 Alert 표시 (프로덕션에서는 조용히 처리)
  if (__DEV__) {
    Alert.alert(
      '설정 오류',
      'Supabase 환경 변수가 설정되지 않았습니다. EAS Secrets를 확인해주세요.'
    );
  }
}

// 안전한 기본값으로 클라이언트 생성 (환경 변수가 없어도 앱이 크래시되지 않음)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseApiKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'starday-app',
      },
    },
  }
);
