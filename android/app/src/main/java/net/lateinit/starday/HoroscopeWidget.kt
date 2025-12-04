package net.lateinit.starday

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Implementation of App Widget functionality.
 */
class HoroscopeWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Enter relevant functionality for when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Enter relevant functionality for when the last widget is disabled
    }
}

internal fun updateAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
) {
    // 1. SharedPreferences에서 데이터 읽기 (RN에서 저장한 그 이름!)
    val prefs = context.getSharedPreferences("group.net.lateinit.starday", Context.MODE_PRIVATE)
    val jsonString = prefs.getString("WIDGET_DATA", null)

    // 뷰 객체 생성
    val views = RemoteViews(context.packageName, R.layout.horoscope_widget)

    // 2. & 3. 데이터 유무에 따른 UI 업데이트 (JSON 파싱)
    if (jsonString != null) {
        try {
            // JSON 문자열을 객체로 변환
            val json = JSONObject(jsonString)

            // 데이터 뽑기 (optString을 쓰면 키가 없을 때 null 대신 "" 반환해서 안전함)
            val rank = json.optString("rank", "?")
            val sign = json.optString("sign", "")
            val luckyItem = json.optString("lucky_item", "내용 없음")

            // 뷰에 텍스트 꽂기
            views.setTextViewText(R.id.widget_title, "${rank}위 $sign")
            views.setTextViewText(R.id.widget_content, luckyItem)

        } catch (e: Exception) {
            // JSON 파싱 에러 방지
            e.printStackTrace()
            views.setTextViewText(R.id.widget_title, "오류 발생")
            views.setTextViewText(R.id.widget_content, "데이터를 읽을 수 없습니다.")
        }
    } else {
        // 데이터가 없는 경우 (초기 상태)
        views.setTextViewText(R.id.widget_title, "오늘의 운세")
        views.setTextViewText(R.id.widget_content, "터치하여 운세 확인하기 👉")
    }

    // 4. 클릭 시 앱 실행 (PendingIntent 연결)
    // React Native 앱의 메인 액티비티는 보통 'MainActivity'입니다.
    val intent = Intent(context, MainActivity::class.java)

    // PendingIntent 생성 (Android 12 이상을 위해 FLAG_IMMUTABLE 필수)
    val pendingIntent = PendingIntent.getActivity(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    // 위젯의 글자나 배경을 누르면 앱이 켜지도록 리스너 등록
    // (레이아웃 파일의 최상위 LinearLayout에 ID를 주고 거기에 거는 게 제일 좋지만,
    // 지금은 텍스트뷰들에 각각 걸어줍니다.)
    views.setOnClickPendingIntent(R.id.widget_title, pendingIntent)
    views.setOnClickPendingIntent(R.id.widget_content, pendingIntent)

    // 위젯 매니저에게 업데이트 요청
    appWidgetManager.updateAppWidget(appWidgetId, views)
}
