import * as Sharing from "expo-sharing";
import { Share2, Sparkles } from "lucide-react-native";
import { MotiView } from "moti";
import { useMemo, useRef } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors, Palette } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Fortune } from "@/types/horoscope";
import { getZodiacImage } from "@/utils/zodiacImage";
import ViewShot from "react-native-view-shot";

type FortuneCardProps = {
  fortune: Fortune;
  index: number;
};

export const FortuneCard = ({ fortune, index }: FortuneCardProps) => {
  const theme = useColorScheme() ?? "light";
  const themeColors = Colors[theme];
  const styles = useMemo(
    () => createStyles(themeColors, theme),
    [themeColors, theme]
  );
  const zodiacUri = getZodiacImage(fortune.sign);

  // 캡쳐를 위한 참조 생성
  const viewShotRef = useRef<ViewShot>(null);

  // 공유하기 기능 구현
  const onShare = async () => {
    try {
      if (viewShotRef.current?.capture) {
        // 이미지를 캡쳐해서 임시 경로 생성
        const uri = await viewShotRef.current.capture();

        // 공유 창 띄우기
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "운세 카드 공유하기",
          UTI: "public.png",
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("공유 실패", "이미지를 저장하지 못했습니다.");
    }
  };

  return (
    // ViewShot으로 카드 전체를 감싸서 캡처 영역 지정
    // options: 캡처 품질 설정
    <ViewShot
      ref={viewShotRef}
      options={{ format: "png", quality: 1.0 }}
      style={{ backgroundColor: "transparent" }} // ViewShot 자체 배경은 투명하게
    >
      <MotiView
        from={{ opacity: 0, translateY: 20 }} // 초기 상태: 투명하고 아래로 약간 이동
        animate={{ opacity: 1, translateY: 0 }} // 애니메이션 후 상태: 불투명하고 원래 위치
        transition={{
          delay: index * 100, // 인덱스에 따라 지연 시간 설정
          type: "timing",
          duration: 500,
        }} // 지연 시간과 지속 시간 설정
        style={[styles.card, fortune.rank === 1 && styles.firstPlaceCard]}
      >
        {/* 왼쪽: 등수 */}
        <View style={styles.rankContainer}>
          <Text
            style={[
              styles.rankText,
              fortune.rank === 1 && styles.firstPlaceText,
            ]}
          >
            {fortune.rank}위
          </Text>
        </View>

        {/* 오른쪽: 내용 */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            {/* 제목 영역 (왼쪽 정렬) */}
            <View style={styles.titleWrapper}>
              {zodiacUri ? (
                <Image
                  source={{ uri: zodiacUri }}
                  style={styles.zodiacImage}
                  resizeMode="contain"
                />
              ) : null}
              <Text style={styles.signText}>{fortune.sign}</Text>
              {fortune.rank === 1 && (
                <Sparkles color={themeColors.highlight} size={16} />
              )}
            </View>

            {/* 공유 버튼 (우측 상단 배치) */}
            <TouchableOpacity
              onPress={onShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Share2
                size={18}
                color={themeColors.icon}
                style={{ opacity: 0.6 }}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.fortuneText}>{fortune.content}</Text>

          <View style={styles.luckyContainer}>
            <Text style={styles.luckyLabel}>Lucky: </Text>
            <Text style={styles.luckyValue}>
              {fortune.lucky_item} / {fortune.lucky_color}
            </Text>
          </View>
        </View>
      </MotiView>
    </ViewShot>
  );
};

const createStyles = (
  themeColors: (typeof Colors)[keyof typeof Colors],
  theme: "light" | "dark"
) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      borderWidth: 1,
      borderColor: themeColors.border,
      shadowColor: themeColors.highlight,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    firstPlaceCard: {
      backgroundColor:
        theme === "light" ? Palette.starYellow : Palette.auroraIndigo,
      borderWidth: 1,
      borderColor: themeColors.highlight,
    },
    rankContainer: {
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
      width: 40,
    },
    rankText: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.mutedText,
    },
    firstPlaceText: {
      color: theme === "light" ? Palette.midnightPurple : themeColors.highlight,
      fontSize: 24,
    },
    contentContainer: {
      flex: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", // 공유 버튼과 제목 사이 간격 벌리기
      marginBottom: 6,
    },
    // 제목과 아이콘을 묶어주는 래퍼 스타일 추가
    titleWrapper: {
      flexDirection: "row",
      alignItems: "center",
    },
    signText: {
      fontSize: 16,
      fontWeight: "bold",
      color: themeColors.text,
      marginRight: 5,
    },
    zodiacImage: {
      width: 30,
      height: 30,
      marginRight: 8,
    },
    fortuneText: {
      fontSize: 14,
      color: themeColors.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    luckyContainer: {
      flexDirection: "row",
      backgroundColor:
        theme === "light" ? Palette.lavenderBase : Palette.neoBlue,
      padding: 6,
      borderRadius: 6,
      alignSelf: "flex-start",
    },
    luckyLabel: {
      fontSize: 11,
      fontWeight: "bold",
      color: themeColors.icon,
    },
    luckyValue: {
      fontSize: 11,
      color: themeColors.text,
    },
  });
