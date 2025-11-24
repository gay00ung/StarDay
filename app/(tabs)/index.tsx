import { HOROSCOPE_PROMPT, OPENAI_CONFIG } from '@/constants/openai';
import { Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_KEY = OPENAI_CONFIG.apiKey;

// 데이터 타입 정의
type Fortune = {
  rank: number;
  sign: string;
  content: string;
  lucky_item: string;
  lucky_color: string;
};

// 별자리 한글 이름 -> 영어 이름 매핑 테이블
const ZODIAC_MAP: { [key: string]: string } = {
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

// 이미지를 가져오는 함수 (마이크로소프트 3D 이모지 CDN 사용)
const getZodiacImage = (koreanSign: string) => {
  const englishName = ZODIAC_MAP[koreanSign];
  if (!englishName) return null; // 매핑 안되면 없음

  // MS Fluent Emoji 저장소 URL 조합
  return `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${englishName}/3D/${englishName.toLowerCase()}_3d.png`;
};

export default function App() {
  const [data, setData] = useState<Fortune[]>([]);
  const [loading, setLoading] = useState(true);

  // 안드로이드의 onCreate() 같은 느낌 (화면 켜지면 실행)
  useEffect(() => {
    fetchHoroscope();
  }, []);

  const fetchHoroscope = async () => {
    try {
      if (!API_KEY) {
        Alert.alert("오류", "API 키가 설정되지 않았습니다.");
        setLoading(false);
        return;
      }

      // OpenAI API 호출 (Retrofit 대신 fetch 사용)
      const response = await fetch(OPENAI_CONFIG.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          messages: [{ role: "system", content: HOROSCOPE_PROMPT }],
          response_format: { type: "json_object" },
          // temperature: OPENAI_CONFIG.temperature,
        })
      });

      const json = await response.json();

      // 데이터 파싱
      if (json.choices && json.choices[0].message.content) {
        const result = JSON.parse(json.choices[0].message.content);
        setData(result.ranking); // 데이터 상태 업데이트
      } else {
        throw new Error("데이터 형식이 올바르지 않습니다.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("오류", "운세를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false); // 로딩 끝
    }
  };

  const renderItem = ({ item }: { item: Fortune }) => (
    <View style={[styles.card, item.rank === 1 && styles.firstPlaceCard]}>
      {/* 왼쪽: 등수 */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, item.rank === 1 && styles.firstPlaceText]}>
          {item.rank}위
        </Text>
      </View>

      {/* 오른쪽: 내용 */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          {/* 이미지를 띄움 */}
          <Image 
            source={{ uri: getZodiacImage(item.sign) || undefined }} 
            style={styles.zodiacImage}
            resizeMode="contain"
          />

          <Text style={styles.signText}>{item.sign}</Text>
          {item.rank === 1 && <Sparkles color="#FFD700" size={16} />}
        </View>

        <Text style={styles.fortuneText}>{item.content}</Text>

        <View style={styles.luckyContainer}>
          <Text style={styles.luckyLabel}>Lucky: </Text>
          <Text style={styles.luckyValue}>{item.lucky_item} / {item.lucky_color}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>오늘의 별자리 랭킹 🔮</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>별들에게 물어보는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.rank.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // Expo Router에서는 상단 여백이 자동 처리되기도 하지만, 안전하게 추가
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#888' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  firstPlaceCard: {
    backgroundColor: '#FFF5F7',
    borderWidth: 1,
    borderColor: '#FFC0CB',
  },
  rankContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    width: 40,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#BDC3C7',
  },
  firstPlaceText: {
    color: '#FF6B6B',
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  signText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  zodiacImage: {
    width: 30, 
    height: 30, 
    marginRight: 8
  },
  fortuneText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  luckyContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F7',
    padding: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  luckyLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  luckyValue: {
    fontSize: 11,
    color: '#333',
  },
});