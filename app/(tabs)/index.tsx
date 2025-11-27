import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppExitHandler } from "@/components/AppExitHandler";
import { FortuneCard } from "@/components/horoscope/FortuneCard";
import { LoadingView } from "@/components/horoscope/LoadingView";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchHoroscope } from "@/services/horoscopeService";
import type { Fortune } from "@/types/horoscope";
import { scheduleDailyNotification } from "@/utils/notifications";

const formatKoreanDate = () => {
  const now = new Date();
  const datePart = now.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
  const weekdayPart = now.toLocaleDateString("ko-KR", { weekday: "long" });
  return `${datePart} ${weekdayPart}`;
};

export default function App() {
  AppExitHandler();

  const [data, setData] = useState<Fortune[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayLabel, setTodayLabel] = useState(() => formatKoreanDate());
  const colorScheme = useColorScheme() ?? "light";

  const themeColors = Colors[colorScheme];

  const styles = useMemo(
    () => createStyles(themeColors, colorScheme),
    [themeColors, colorScheme]
  );

  const loadHoroscope = useCallback(
    async ({ withLoading = false }: { withLoading?: boolean } = {}) => {
      setTodayLabel(formatKoreanDate());

      if (withLoading) {
        setLoading(true);
      }

      try {
        const result = await fetchHoroscope();
        setData(result);
      } catch (error) {
        console.error(error);
        Alert.alert(
          "오류",
          error instanceof Error
            ? error.message
            : "운세를 불러오는데 실패했습니다."
        );
      } finally {
        if (withLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  // 안드로이드의 onCreate() 같은 느낌 (화면 켜지면 실행)
  useEffect(() => {
    loadHoroscope({ withLoading: true });
    scheduleDailyNotification();
  }, [loadHoroscope]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadHoroscope();
    } finally {
      setRefreshing(false);
    }
  }, [loadHoroscope]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>오늘의 별자리 랭킹</Text>
        </View>
        <View style={styles.subTitleContainer}>
          {/* <Image
            source={{ uri: API_URLS.CALENDAR_EMOJI }}
            style={styles.titleEmoji}
            resizeMode="contain"
          /> */}
          <Text style={styles.subTitle} numberOfLines={1}>
            {todayLabel}
          </Text>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.text}
              colors={[themeColors.text]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (
  themeColors: (typeof Colors)[keyof typeof Colors],
  theme: "light" | "dark"
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      padding: 20,
      backgroundColor: themeColors.surface,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      paddingTop: 20,
      shadowColor: themeColors.highlight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    titleEmoji: {
      width: 28,
      height: 28,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: themeColors.text,
    },
    subTitleContainer: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    subTitle: {
      fontSize: 20,
      color: themeColors.text,
      lineHeight: 20,
    },
    listContent: {
      padding: 16,
    },
  });
