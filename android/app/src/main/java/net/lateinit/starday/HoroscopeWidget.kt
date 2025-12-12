package net.lateinit.starday

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.RemoteViews
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit
import androidx.work.ExistingPeriodicWorkPolicy

class HoroscopeWidget : AppWidgetProvider() {
    companion object {
        const val ACTION_REFRESH = "net.lateinit.starday.WIDGET_REFRESH"
        private const val TAG = "HoroscopeWidget"
        const val WORK_TAG = "horoscope_widget_update_work"
    }


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
        super.onEnabled(context)
        // 위젯이 하나라도 생성되면 주기적 작업 시작
        startPeriodUpdate(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        // 모든 위젯이 제거되면 작업 취소 (배터리 절약)
        WorkManager.getInstance(context).cancelUniqueWork(WORK_TAG)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)
                ?: appWidgetManager.getAppWidgetIds(
                    ComponentName(context, HoroscopeWidget::class.java)
                )
            val prefs =
                context.getSharedPreferences("group.net.lateinit.starday", Context.MODE_PRIVATE)
            val snapshot = prefs.getString("WIDGET_DATA", "null")
            Log.d(TAG, "Refresh click: ids=${ids.joinToString()} data=$snapshot")
            ids.forEach { id ->
                updateAppWidget(context, appWidgetManager, id)
            }
        }
    }

    private fun startPeriodUpdate(context: Context) {
        val updateRequest = PeriodicWorkRequestBuilder<HoroscopeUpdateWorker>(
            15, TimeUnit.MINUTES // 최소 간격 15분
        ).build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WORK_TAG,
            ExistingPeriodicWorkPolicy.KEEP, // 이미 예약된 작업이 있으면 유지 (중복 실행 방지)
            updateRequest
        )
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

    // 위젯 업데이트 버튼 연동
    val refreshIntent = Intent(context, HoroscopeWidget::class.java).apply {
        action = HoroscopeWidget.ACTION_REFRESH
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
    }
    val refreshPendingIntent = PendingIntent.getBroadcast(
        context,
        appWidgetId,
        refreshIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    views.setOnClickPendingIntent(R.id.widget_refresh, refreshPendingIntent)

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
