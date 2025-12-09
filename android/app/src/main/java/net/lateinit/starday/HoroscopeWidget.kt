package net.lateinit.starday

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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
    // SharedPreferences에서 데이터 읽기
    val prefs = context.getSharedPreferences("group.net.lateinit.starday", Context.MODE_PRIVATE)
    val jsonString = prefs.getString("WIDGET_DATA", null)

    val dateText = SimpleDateFormat("MM월 dd일", Locale.KOREA).format(Date())

    // 뷰 객체 생성
    val views = RemoteViews(context.packageName, R.layout.horoscope_widget)
    views.setTextViewText(R.id.widget_date, dateText)

    // JSON 데이터 파싱 및 UI 업데이트
    if (jsonString != null) {
        try {
            val json = JSONObject(jsonString)

            // 데이터 추출
            val rank = json.optString("rank", "")
            val sign = json.optString("sign", "")
            val luckyItem = json.optString("lucky_item", "")
            val luckyColor = json.optString("lucky_color", "")

            // 별자리 이모지 매핑
            val signEmoji = getSignEmoji(sign)

            // 뷰에 데이터 설정
            views.setTextViewText(R.id.widget_rank, "${rank}위")
            views.setTextViewText(R.id.widget_emoji, signEmoji)
            views.setTextViewText(R.id.widget_sign, sign)
            views.setTextViewText(R.id.widget_lucky_item, "아이템 #$luckyItem")
            views.setTextViewText(R.id.widget_lucky_color, "컬러 #$luckyColor")

        } catch (e: Exception) {
            e.printStackTrace()
            // 에러 발생 시 기본 UI
            views.setTextViewText(R.id.widget_rank, "")
            views.setTextViewText(R.id.widget_emoji, "✨")
            views.setTextViewText(R.id.widget_sign, "오늘의 운세")
            views.setTextViewText(R.id.widget_lucky_item, "데이터를 불러올 수")
            views.setTextViewText(R.id.widget_lucky_color, "없습니다")
        }
    } else {
        // 데이터가 없는 경우 초기 상태
        views.setTextViewText(R.id.widget_rank, "")
        views.setTextViewText(R.id.widget_emoji, "✨")
        views.setTextViewText(R.id.widget_sign, "오늘의 운세")
        views.setTextViewText(R.id.widget_lucky_item, "터치하여")
        views.setTextViewText(R.id.widget_lucky_color, "운세 확인하기 👉")
    }

    // 클릭 시 앱 실행
    val intent = Intent(context, MainActivity::class.java)
    val pendingIntent = PendingIntent.getActivity(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    // 위젯 전체를 클릭 가능하게 설정
    views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

    // 위젯 업데이트
    appWidgetManager.updateAppWidget(appWidgetId, views)
}

/**
 * 별자리에 맞는 이모지 반환
 */
private fun getSignEmoji(sign: String): String {
    return when {
        sign.contains("양자리") -> "♈️"
        sign.contains("황소자리") -> "♉️"
        sign.contains("쌍둥이자리") -> "♊️"
        sign.contains("게자리") -> "♋️"
        sign.contains("사자자리") -> "♌️"
        sign.contains("처녀자리") -> "♍️"
        sign.contains("천칭자리") -> "♎️"
        sign.contains("전갈자리") -> "♏️"
        sign.contains("사수자리") -> "♐️"
        sign.contains("염소자리") -> "♑️"
        sign.contains("물병자리") -> "♒️"
        sign.contains("물고기자리") -> "♓️"
        else -> "✨"
    }
}
