import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const LoadingView = () => {
  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={themeColors.tint} />
      <Text style={[styles.loadingText, { color: themeColors.mutedText }]}>
        별들에게 물어보는 중...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
});
