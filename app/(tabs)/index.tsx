import { API_URLS } from '@/config/apiUrls';
import { FortuneCard } from '@/components/horoscope/FortuneCard';
import { LoadingView } from '@/components/horoscope/LoadingView';
import { fetchHoroscope } from '@/services/horoscopeService';
import type { Fortune } from '@/types/horoscope';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [data, setData] = useState<Fortune[]>([]);
  const [loading, setLoading] = useState(true);

  // 안드로이드의 onCreate() 같은 느낌 (화면 켜지면 실행)
  useEffect(() => {
    loadHoroscope();
  }, []);

  const loadHoroscope = async () => {
    try {
      const result = await fetchHoroscope();
      setData(result);
    } catch (error) {
      console.error(error);
      Alert.alert("오류", error instanceof Error ? error.message : "운세를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image
            source={{ uri: API_URLS.CRYSTAL_BALL_EMOJI }}
            style={styles.titleEmoji}
            resizeMode="contain"
          />
          <Text style={styles.title}>오늘의 별자리 랭킹</Text>
        </View>
      </View>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={data}
          renderItem={({ item }) => <FortuneCard fortune={item} />}
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
    paddingTop: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleEmoji: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
});