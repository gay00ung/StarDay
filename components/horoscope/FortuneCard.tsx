import { Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Fortune } from '@/types/horoscope';
import { getZodiacImage } from '@/utils/zodiacImage';

type FortuneCardProps = {
  fortune: Fortune;
};

export const FortuneCard = ({ fortune }: FortuneCardProps) => {
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];
  const styles = useMemo(() => createStyles(themeColors, theme), [themeColors, theme]);
  const zodiacUri = getZodiacImage(fortune.sign);

  return (
    <View style={[styles.card, fortune.rank === 1 && styles.firstPlaceCard]}>
      {/* 왼쪽: 등수 */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, fortune.rank === 1 && styles.firstPlaceText]}>
          {fortune.rank}위
        </Text>
      </View>

      {/* 오른쪽: 내용 */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          {/* 이미지를 띄움 */}
          {zodiacUri ? (
            <Image source={{ uri: zodiacUri }} style={styles.zodiacImage} resizeMode="contain" />
          ) : null}

          <Text style={styles.signText}>{fortune.sign}</Text>
          {fortune.rank === 1 && <Sparkles color={themeColors.highlight} size={16} />}
        </View>

        <Text style={styles.fortuneText}>{fortune.content}</Text>

        <View style={styles.luckyContainer}>
          <Text style={styles.luckyLabel}>Lucky: </Text>
          <Text style={styles.luckyValue}>
            {fortune.lucky_item} / {fortune.lucky_color}
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (
  themeColors: (typeof Colors)[keyof typeof Colors],
  theme: 'light' | 'dark'
) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
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
      backgroundColor: theme === 'light' ? Palette.starYellow : Palette.auroraIndigo,
      borderWidth: 1,
      borderColor: themeColors.highlight,
    },
    rankContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      width: 40,
    },
    rankText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.mutedText,
    },
    firstPlaceText: {
      color: theme === 'light' ? Palette.midnightPurple : themeColors.highlight,
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
      flexDirection: 'row',
      backgroundColor: theme === 'light' ? Palette.lavenderBase : Palette.neoBlue,
      padding: 6,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    luckyLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      color: themeColors.icon,
    },
    luckyValue: {
      fontSize: 11,
      color: themeColors.text,
    },
  });
