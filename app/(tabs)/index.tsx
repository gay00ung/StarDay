import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DefaultPreference from "react-native-default-preference";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppExitHandler } from "@/components/AppExitHandler";
import { FortuneCard } from "@/components/horoscope/FortuneCard";
import { LoadingView } from "@/components/horoscope/LoadingView";
import { SplashScreen } from "@/components/horoscope/SplashScreen";
import { Colors, Palette } from "@/constants/theme";
import { ZODIAC_SIGNS } from "@/constants/zodiac";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchHoroscope } from "@/services/horoscopeService";
import type { Fortune } from "@/types/horoscope";
import { scheduleDailyNotification } from "@/utils/notifications";

// 위젯과 공유할 그룹 이름
const APP_GROUP = "group.net.lateinit.starday";

const saveToWidget = async (fortuneData: any) => {
  try {
    // 위젯이 읽을 파일명(저장소 이름) 설정
    // Android: SharedPreferences 파일명 설정
    // iOS: App Group Suite Name 설정
    await DefaultPreference.setName(APP_GROUP);

    // JSON 데이터를 문자열로 변환
    const widgetData = {
      rank: fortuneData.rank.toString(),
      sign: fortuneData.sign,
      content: fortuneData.content,
      lucky_item: fortuneData.lucky_item,
      lucky_color: fortuneData.lucky_color,
    };

    // String 형태로 저장
    await DefaultPreference.set("WIDGET_DATA", JSON.stringify(widgetData));

    console.log("✅ 위젯용 데이터 저장 완료");
  } catch (error) {
    console.error("❌ 위젯용 운세 데이터 저장 실패:", error);
  }
};

const formatKoreanDate = (date: Date) => {
  const datePart = date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
  const weekdayPart = date.toLocaleDateString("ko-KR", { weekday: "long" });
  return `${datePart} ${weekdayPart}`;
};

// KST 기준으로 날짜를 "YYYY-MM-DD" 형식으로 변환
const formatDateString = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // "YYYY-MM-DD" 형식
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
  const [isInitialMount, setIsInitialMount] = useState(true);
  const colorScheme = useColorScheme() ?? "light";

  const themeColors = Colors[colorScheme];
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const [mySign, setMySign] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      retryCount = 0,
    }: { withLoading?: boolean; minDuration?: number; date?: Date; retryCount?: number } = {}) => {
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

        // 오늘 날짜 + 사용자의 별자리가 존재하는 경우에만 위젯용 데이터 저장
        if (isSameDay(targetDate, new Date()) && mySign && result.length > 0) {
          const myFortuneData = result.find((item) => item.sign === mySign);
          if (myFortuneData) {
            await saveToWidget(myFortuneData);
          }
        }
      } catch (error) {
        console.error(error);
        
        // 재시도 로직 (최대 2번)
        if (retryCount < 2 && error instanceof Error && 
            (error.message.includes("시간 초과") || error.message.includes("느립니다"))) {
          
          console.log(`🔄 재시도 중... (${retryCount + 1}/2)`);
          
          // 1초 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadHoroscope({ withLoading, minDuration, date, retryCount: retryCount + 1 });
        }
        
        // 재시도 실패 또는 다른 에러
        Alert.alert(
          "오류",
          error instanceof Error
            ? error.message
            : "운세를 불러오는데 실패했습니다.",
          [
            { text: "취소", style: "cancel" },
            { text: "다시 시도", onPress: () => loadHoroscope({ withLoading, date }) }
          ]
        );
      } finally {
        if (withLoading) {
          setLoading(false);
        }
      }
    },
    [selectedDate, mySign]
  );

  useEffect(() => {
    loadMySign();
  }, []);

  const loadMySign = async () => {
    try {
      const savedSign = await AsyncStorage.getItem("myZodiacSign");
      if (savedSign) setMySign(savedSign);
    } catch (error) {
      console.error("⚠️ 별자리 불러오기 실패:", error);
      // 불러오기 실패는 조용히 처리 (사용자에게 알리지 않음)
    }
  };

  const saveMySign = async (sign: string) => {
    try {
      await AsyncStorage.setItem("myZodiacSign", sign);
      setMySign(sign);
      setIsModalVisible(false);
      Alert.alert("저장 완료", `나의 별자리가 ${sign}로 설정되었습니다.`, [
        { text: "확인" },
      ]);
    } catch (error) {
      console.error("❌ 별자리 저장 실패:", error);
      Alert.alert("오류", "별자리 저장에 실패했습니다. 다시 시도해주세요.", [
        { text: "확인" },
      ]);
    }
  };

  const deleteMySign = async () => {
    try {
      await AsyncStorage.removeItem("myZodiacSign");
      setMySign(null);
      setIsModalVisible(false);
      Alert.alert("삭제 완료", `나의 별자리가 삭제되었습니다.`, [
        { text: "확인" },
      ]);
    } catch (error) {
      console.error("❌ 별자리 삭제 실패:", error);
      Alert.alert("오류", "별자리 삭제에 실패했습니다. 다시 시도해주세요.", [
        { text: "확인" },
      ]);
    }
  };

  const myFortuneData = useMemo(() => {
    if (!mySign || data.length === 0) return null;
    return data.find((item) => item.sign === mySign);
  }, [data, mySign]);

  // 초기 마운트 시 실행 (알림 예약 + 운세 로드)
  useEffect(() => {
    scheduleDailyNotification();
    loadHoroscope({ withLoading: true, minDuration: 2000, date: selectedDate });
    setIsInitialMount(false);
  }, []);

  // 날짜 변경 시 데이터 다시 로드 (초기 마운트 제외)
  useEffect(() => {
    if (!isInitialMount) {
      loadHoroscope({ withLoading: true, date: selectedDate });
    }
  }, [selectedDate, isInitialMount]);

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
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={styles.settingButton}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={data}
          renderItem={({ item, index }) => (
            <FortuneCard fortune={item} index={index} />
          )}
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
          ListHeaderComponent={
            myFortuneData ? (
              <View style={styles.pinnedContainer}>
                <View style={styles.pinnedLabelRow}>
                  <Text style={styles.pinnedLabel}>
                    📌 나의 운세 ({mySign})
                  </Text>
                </View>
                <FortuneCard fortune={myFortuneData} index={-1} />
                <View style={styles.divider} />
                <Text style={styles.rankingTitle}>🏆 전체 랭킹</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsModalVisible(true)}
                style={styles.emptyPinContainer}
              >
                <Text style={styles.emptyPinText}>
                  내 별자리를 설정하고 상단에 고정해보세요! 👉
                </Text>
              </TouchableOpacity>
            )
          }
        />
      )}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>내 별자리 선택</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.zodiacList}>
              <View style={styles.zodiacGrid}>
                {ZODIAC_SIGNS.map((sign) => (
                  <TouchableOpacity
                    key={sign}
                    style={[
                      styles.zodiacButton,
                      mySign === sign && styles.zodiacButtonSelected,
                    ]}
                    onPress={() => {
                      if (mySign === sign) {
                        deleteMySign();
                      } else {
                        saveMySign(sign);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.zodiacText,
                        mySign === sign && styles.zodiacTextSelected,
                      ]}
                    >
                      {sign}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    // 설정 버튼
    settingButton: {
      position: "absolute",
      right: 20,
      top: 20,
      padding: 8,
    },
    // 핀 고정 스타일
    pinnedContainer: {
      marginBottom: 16,
    },
    pinnedLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    pinnedLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: themeColors.tint,
    },
    divider: {
      height: 1,
      backgroundColor: themeColors.border,
      marginVertical: 16,
    },
    rankingTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: 10,
    },
    emptyPinContainer: {
      padding: 16,
      backgroundColor:
        theme === "dark" ? themeColors.surface : Palette.lavenderBase,
      borderRadius: 12,
      marginBottom: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: themeColors.border,
      borderStyle: "dashed",
    },
    emptyPinText: {
      color: themeColors.text,
      fontWeight: "600",
      fontSize: 14,
    },
    // 모달 스타일
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: "55%",
      padding: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: themeColors.text,
    },
    zodiacList: {
      flex: 1,
    },
    zodiacGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    zodiacButton: {
      width: "30%",
      padding: 14,
      backgroundColor: themeColors.background,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    zodiacButtonSelected: {
      backgroundColor: themeColors.tint,
      borderColor: themeColors.highlight,
    },
    zodiacText: {
      fontWeight: "600",
      color: themeColors.text,
      fontSize: 14,
    },
    zodiacTextSelected: {
      color: Palette.sparkleWhite,
    },
  });
