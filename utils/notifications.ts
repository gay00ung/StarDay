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
    try {
        // 권한 요청 (에러 처리 추가)
        const { status: existingStatus } = await Notifications
            .getPermissionsAsync()
            .catch((err) => {
                console.error('⚠️ 알림 권한 확인 실패:', err);
                return { status: 'undetermined' as const };
            });

        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync()
                .catch((err) => {
                    console.error('⚠️ 알림 권한 요청 실패:', err);
                    return { status: 'undetermined' as const };
                });
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            console.log("ℹ️ 알림 권한이 거부되었습니다. (앱은 정상 작동합니다)");
            return;
        }

        // 기존 알림 모두 취소 (에러 처리)
        await Notifications.cancelAllScheduledNotificationsAsync()
            .catch((err) => {
                console.error('⚠️ 기존 알림 취소 실패:', err);
            });

        // 매일 오전 8시에 알림 예약 (에러 처리)
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
        }).catch((err) => {
            console.error('⚠️ 알림 예약 실패:', err);
        });

        console.log("✅ 매일 오전 8시에 알림이 예약되었습니다.");
    } catch (error) {
        // 최상위 에러 처리 - 알림 기능이 실패해도 앱은 계속 실행
        console.error("❌ 알림 설정 중 예상치 못한 오류:", error);
    }
}