import type { Fortune } from '@/types/horoscope';
import { getZodiacImage } from '@/utils/zodiacImage';
import { Sparkles } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';

type FortuneCardProps = {
  fortune: Fortune;
};

export const FortuneCard = ({ fortune }: FortuneCardProps) => {
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
          <Image
            source={{ uri: getZodiacImage(fortune.sign) || undefined }}
            style={styles.zodiacImage}
            resizeMode="contain"
          />

          <Text style={styles.signText}>{fortune.sign}</Text>
          {fortune.rank === 1 && <Sparkles color="#FFD700" size={16} />}
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

const styles = StyleSheet.create({
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
    marginRight: 10,
    width: 40,
  },
  rankText: {
    fontSize: 18,
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
    marginRight: 8,
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
