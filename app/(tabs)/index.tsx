import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppExitHandler } from "@/components/AppExitHandler";
import { FortuneCard } from "@/components/horoscope/FortuneCard";
import { LoadingView } from "@/components/horoscope/LoadingView";
import { SplashScreen } from "@/components/horoscope/SplashScreen";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchHoroscope } from "@/services/horoscopeService";
import type { Fortune } from "@/types/horoscope";
import { scheduleDailyNotification } from "@/utils/notifications";

const formatKoreanDate = (date: Date) => {
  const datePart = date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
  const weekdayPart = date.toLocaleDateString("ko-KR", { weekday: "long" });
  return `${datePart} ${weekdayPart}`;
};

const formatDateString = (date: Date) => {
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD" 형식
};

const isSameDay = (date1: Date, date2: Date) => {
  return formatDateString(date1) === formatDateString(date2);
};

export default function App() {
  AppExitHandler();

  const [data, setData] = useState<Fortune[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const colorScheme = useColorScheme() ?? "light";

  const themeColors = Colors[colorScheme];
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const styles = useMemo(
    () => createStyles(themeColors, colorScheme),
    [themeColors, colorScheme]
  );

  const todayLabel = useMemo(
    () => formatKoreanDate(selectedDate),
    [selectedDate]
  );

  const goToPreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    if (isToday) return; // 오늘 이후로는 못 감
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, [isToday]);

  const loadHoroscope = useCallback(
    async ({
      withLoading = false,
      minDuration = 0,
      date,
    }: { withLoading?: boolean; minDuration?: number; date?: Date } = {}) => {
      if (withLoading) {
        setLoading(true);
      }

      try {
        const targetDate = date || selectedDate;
        const dateString = formatDateString(targetDate);

        // API 호출과 타이머를 동시에 돌리고, 둘 다 끝날 때까지 기다림 (Promise.all)
        // 안드로이드 Coroutine의 awaitAll() 이나 RxJava의 zip()과 비슷한 개념
        const [result] = await Promise.all([
          fetchHoroscope(dateString),
          new Promise((resolve) => setTimeout(resolve, minDuration)), // 최소 시간만큼 대기
        ]);

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
    loadHoroscope({ withLoading: true, minDuration: 2000 });
    scheduleDailyNotification();
  }, []);

  // 날짜 변경 시 데이터 다시 로드
  useEffect(() => {
    loadHoroscope({ withLoading: true, date: selectedDate });
  }, [selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadHoroscope();
    } finally {
      setRefreshing(false);
    }
  }, [loadHoroscope]);

  if (loading && data.length === 0) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>오늘의 별자리 랭킹</Text>
        </View>
        <View style={styles.dateNavContainer}>
          <TouchableOpacity
            onPress={goToPreviousDay}
            style={styles.arrowButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={themeColors.text} />
          </TouchableOpacity>

          <View style={styles.subTitleContainer}>
            <Text style={styles.subTitle} numberOfLines={1}>
              {todayLabel}
            </Text>
          </View>

          <TouchableOpacity
            onPress={goToNextDay}
            style={[styles.arrowButton, isToday && styles.arrowButtonDisabled]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isToday}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={isToday ? themeColors.border : themeColors.text}
            />
          </TouchableOpacity>
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
    dateNavContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 10,
      paddingHorizontal: 10,
    },
    arrowButton: {
      padding: 8,
    },
    arrowButtonDisabled: {
      opacity: 0.3,
    },
    subTitleContainer: {
      flex: 1,
      alignItems: "center",
    },
    subTitle: {
      fontSize: 18,
      color: themeColors.text,
      lineHeight: 20,
    },
    listContent: {
      padding: 16,
    },
  });
