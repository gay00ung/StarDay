import React from "react";
import {
    ImageBackground,
    StyleSheet
} from "react-native";

export function SplashScreen() {
  return (
    <ImageBackground
      source={require("../../assets/images/splash.png")}
      style={styles.background}
      resizeMode="cover"
    >
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
