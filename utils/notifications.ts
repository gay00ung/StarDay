import * as Notifications from "expo-notifications";

// 알림 핸들러 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// 권한 요청 및 알림 예약 필수
export async function scheduleDailyNotification() {
    // 권한 요청
    const { status: existingStatus } = await Notifications
        .getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("알림 권한이 거부되었습니다.");
        return;
    }

    // 기존 알림 모두 취소
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 매일 오전 9시에 알림 예약
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "오늘의 운세가 도착했어요! 🔮",
            body: "지금 바로 확인하고 행운을 잡으세요!",
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 8,
            minute: 0,
        },
    });

    console.log("매일 오전 8시에 알림이 예약되었습니다.");
}