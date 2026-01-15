package com.bienenfe.carmeizionshiurimupload.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.bienenfe.carmeizionshiurimupload.MainActivity
import com.bienenfe.carmeizionshiurimupload.R
import com.bienenfe.carmeizionshiurimupload.util.AudioRecorder
import java.io.File

class RecordingService : Service() {
    private lateinit var audioRecorder: AudioRecorder
    private lateinit var notificationManager: NotificationManager
    private val binder = RecordingBinder()
    private var recordingStartTime = 0L
    
    companion object {
        private const val TAG = "RecordingService"
        private const val CHANNEL_ID = "recording_channel"
        private const val NOTIFICATION_ID = 2
        
        const val ACTION_START_RECORDING = "com.bienenfe.carmeizionshiurimupload.START_RECORDING"
        const val ACTION_STOP_RECORDING = "com.bienenfe.carmeizionshiurimupload.STOP_RECORDING"
        
        const val EXTRA_RECORDING_FILE = "recording_file"
        const val EXTRA_RECORDING_URI = "recording_uri"
    }
    
    inner class RecordingBinder : Binder() {
        fun getService(): RecordingService = this@RecordingService
    }
    
    override fun onCreate() {
        super.onCreate()
        audioRecorder = AudioRecorder(this)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand called with action: ${intent?.action}")
        when (intent?.action) {
            ACTION_START_RECORDING -> {
                Log.d(TAG, "Starting recording...")
                startRecording()
            }
            ACTION_STOP_RECORDING -> {
                Log.d(TAG, "Stop action received")
                stopRecording()
            }
            else -> {
                Log.w(TAG, "Unknown action or null intent")
            }
        }
        return START_NOT_STICKY
    }
    
    private fun startRecording() {
        Log.d(TAG, "startRecording() called")
        val file = audioRecorder.startRecording()
        Log.d(TAG, "AudioRecorder.startRecording() returned: ${file?.absolutePath}")
        if (file != null) {
            recordingStartTime = System.currentTimeMillis()
            startForeground(NOTIFICATION_ID, createNotification("Recording in progress...", 0))
            Log.d(TAG, "Service started in foreground")
            
            // Update notification every second with duration
            updateNotificationPeriodically()
        } else {
            Log.e(TAG, "Failed to start recording, stopping service")
            stopSelf()
        }
    }
    
    private fun stopRecording() {
        Log.d(TAG, "Stopping recording...")
        val file = audioRecorder.stopRecording()
        val uri = audioRecorder.getRecordingUri()
        
        Log.d(TAG, "Recording stopped. File: ${file?.absolutePath}, exists: ${file?.exists()}, URI: $uri")
        
        // Send broadcast with result - use explicit intent for reliability
        val resultIntent = Intent(ACTION_STOP_RECORDING).apply {
            setPackage(packageName)
            putExtra(EXTRA_RECORDING_FILE, file?.absolutePath)
            putExtra(EXTRA_RECORDING_URI, uri?.toString())
        }
        sendBroadcast(resultIntent)
        Log.d(TAG, "Broadcast sent with file path: ${file?.absolutePath} and URI: $uri")
        
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }
    
    private fun updateNotificationPeriodically() {
        Thread {
            while (audioRecorder.isRecording()) {
                val duration = (System.currentTimeMillis() - recordingStartTime) / 1000
                val minutes = duration / 60
                val seconds = duration % 60
                val durationText = String.format("%d:%02d", minutes, seconds)
                
                notificationManager.notify(
                    NOTIFICATION_ID,
                    createNotification("Recording: $durationText", duration.toInt())
                )
                
                Thread.sleep(1000)
            }
        }.start()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Recording Progress",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows recording progress for shiurim"
            }
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(text: String, durationSeconds: Int): android.app.Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        val stopIntent = Intent(this, RecordingService::class.java).apply {
            action = ACTION_STOP_RECORDING
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Recording Shiur")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .addAction(
                android.R.drawable.ic_media_pause,
                "Stop",
                stopPendingIntent
            )
            .build()
    }
    
    fun isRecording(): Boolean = audioRecorder.isRecording()
    
    fun getRecordingDuration(): Int {
        return if (recordingStartTime > 0) {
            ((System.currentTimeMillis() - recordingStartTime) / 1000).toInt()
        } else {
            0
        }
    }
    
    override fun onBind(intent: Intent?): IBinder = binder
    
    override fun onDestroy() {
        super.onDestroy()
        audioRecorder.release()
    }
}
