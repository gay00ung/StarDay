package net.lateinit.starday

import android.content.Context
import android.content.ComponentName
import android.appwidget.AppWidgetManager
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class HoroscopeUpdateWorker(
    context: Context,
    params: WorkerParameters
) :
    CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        // AppWidgetManager 인스턴스 가져오기
        val appWidgetManager = AppWidgetManager.getInstance(applicationContext)

        // 현재 활성화 된 앱의 모든 위젯 ID 가져오기
        val componentName = ComponentName(applicationContext, HoroscopeWidget::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

        // 각 위젯 ID에 대해 기존 업데이트 로직 실행
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(applicationContext, appWidgetManager, appWidgetId)
        }
        return Result.success()
    }
}
