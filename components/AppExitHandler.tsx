import { useEffect, useRef } from "react";
import { BackHandler, ToastAndroid } from "react-native";

export function AppExitHandler() {
  const backPressCount = useRef(0);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (backPressCount.current === 0) {
          backPressCount.current += 1;
          ToastAndroid.show("한 번 더 누르면 종료됩니다.", ToastAndroid.SHORT);

          setTimeout(() => {
            backPressCount.current = 0;
          }, 2000);

          return true; // 뒤로 가기 이벤트 처리 완료
        } else if (backPressCount.current === 1) {
          BackHandler.exitApp(); // 앱 종료
          return true;
        }
        return false;
      }
    );
    return () => subscription.remove();
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다.
}
