package com.bienenfe.carmeizionshiurimupload.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.bienenfe.carmeizionshiurimupload.MainActivity
import com.bienenfe.carmeizionshiurimupload.R
import com.bienenfe.carmeizionshiurimupload.config.AwsConfig
import com.bienenfe.carmeizionshiurimupload.config.CredentialManager
import com.bienenfe.carmeizionshiurimupload.util.S3Uploader
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class UploadService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var s3Uploader: S3Uploader
    private lateinit var notificationManager: NotificationManager
    private var wakeLock: PowerManager.WakeLock? = null
    
    companion object {
        private const val CHANNEL_ID = "upload_channel"
        private const val NOTIFICATION_ID = 1
        
        const val EXTRA_AUDIO_URI = "audio_uri"
        const val EXTRA_AUDIO_KEY = "audio_key"
        const val EXTRA_ATTACHMENT_URI = "attachment_uri"
        const val EXTRA_ATTACHMENT_KEY = "attachment_key"
        const val EXTRA_MANIFEST_KEY = "manifest_key"
        const val EXTRA_MANIFEST_JSON = "manifest_json"
        
        const val ACTION_UPLOAD_COMPLETE = "com.bienenfe.carmeizionshiurimupload.UPLOAD_COMPLETE"
        const val ACTION_UPLOAD_ERROR = "com.bienenfe.carmeizionshiurimupload.UPLOAD_ERROR"
        const val EXTRA_ERROR_MESSAGE = "error_message"
        const val EXTRA_AUDIO_URL = "audio_url"
        const val EXTRA_MANIFEST_URL = "manifest_url"
        const val EXTRA_ATTACHMENT_URL = "attachment_url"
    }
    
    override fun onCreate() {
        super.onCreate()
        
        val credentialManager = CredentialManager(this)
        s3Uploader = S3Uploader(
            context = this,
            accessKey = credentialManager.getEffectiveAccessKey(),
            secretKey = credentialManager.getEffectiveSecretKey(),
            bucketName = AwsConfig.BUCKET_NAME
        )
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
        
        // Acquire wake lock to keep CPU running during upload
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "CarmeiZionShiurim::UploadWakeLock"
        )
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val audioUriString = intent?.getStringExtra(EXTRA_AUDIO_URI)
        val audioKey = intent?.getStringExtra(EXTRA_AUDIO_KEY)
        val attachmentUriString = intent?.getStringExtra(EXTRA_ATTACHMENT_URI)
        val attachmentKey = intent?.getStringExtra(EXTRA_ATTACHMENT_KEY)
        val manifestKey = intent?.getStringExtra(EXTRA_MANIFEST_KEY)
        val manifestJson = intent?.getStringExtra(EXTRA_MANIFEST_JSON)
        
        if (audioUriString == null || audioKey == null || manifestKey == null || manifestJson == null) {
            stopSelf()
            return START_NOT_STICKY
        }
        
        val audioUri = Uri.parse(audioUriString)
        val attachmentUri = attachmentUriString?.let { Uri.parse(it) }
        
        // Acquire wake lock for the duration of the upload (max 1 hour)
        wakeLock?.acquire(60 * 60 * 1000L)
        
        startForeground(NOTIFICATION_ID, createNotification("Starting upload...", 0))
        
        serviceScope.launch {
            performUpload(audioUri, audioKey, attachmentUri, attachmentKey, manifestKey, manifestJson)
        }
        
        return START_NOT_STICKY
    }
    
    private suspend fun performUpload(
        audioUri: Uri,
        audioKey: String,
        attachmentUri: Uri?,
        attachmentKey: String?,
        manifestKey: String,
        manifestJson: String
    ) {
        try {
            var attachmentUrl = ""
            
            // Upload attachment if present
            if (attachmentUri != null && attachmentKey != null) {
                updateNotification("Uploading attachment...", 0)
                
                val attachmentResult = s3Uploader.uploadFile(
                    uri = attachmentUri,
                    s3Key = attachmentKey,
                    bucketName = AwsConfig.BUCKET_NAME
                )
                
                when (attachmentResult) {
                    is S3Uploader.UploadResult.Success -> {
                        attachmentUrl = attachmentResult.s3Url
                    }
                    is S3Uploader.UploadResult.Error -> {
                        sendErrorBroadcast("Attachment upload failed: ${attachmentResult.message}")
                        stopSelf()
                        return
                    }
                }
            }
            
            // Upload audio file
            updateNotification("Uploading audio...", 0)
            
            val audioResult = s3Uploader.uploadFile(
                uri = audioUri,
                s3Key = audioKey,
                onProgress = { progress ->
                    updateNotification("Uploading audio...", progress)
                }
            )
            
            val audioUrl = when (audioResult) {
                is S3Uploader.UploadResult.Success -> audioResult.s3Url
                is S3Uploader.UploadResult.Error -> {
                    sendErrorBroadcast("Audio upload failed: ${audioResult.message}")
                    stopSelf()
                    return
                }
            }
            
            // Upload manifest
            updateNotification("Uploading metadata...", 100)
            
            val metadataResult = s3Uploader.uploadJsonMetadata(
                jsonContent = manifestJson,
                s3Key = manifestKey
            )
            
            val manifestUrl = when (metadataResult) {
                is S3Uploader.UploadResult.Success -> metadataResult.s3Url
                is S3Uploader.UploadResult.Error -> {
                    sendErrorBroadcast("Metadata upload failed: ${metadataResult.message}")
                    stopSelf()
                    return
                }
            }
            
            // Success
            sendSuccessBroadcast(audioUrl, manifestUrl, attachmentUrl)
            updateNotification("Upload complete!", 100)
            
            // Stop service after a short delay
            kotlinx.coroutines.delay(2000)
            stopSelf()
            
        } catch (e: Exception) {
            sendErrorBroadcast("Upload error: ${e.message}")
            stopSelf()
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Upload Progress",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows upload progress for shiurim"
            }
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(text: String, progress: Int): android.app.Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Uploading Shiur")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setProgress(100, progress, progress == 0)
            .build()
    }
    
    private fun updateNotification(text: String, progress: Int) {
        notificationManager.notify(NOTIFICATION_ID, createNotification(text, progress))
    }
    
    private fun sendSuccessBroadcast(audioUrl: String, manifestUrl: String, attachmentUrl: String) {
        val intent = Intent(ACTION_UPLOAD_COMPLETE).apply {
            putExtra(EXTRA_AUDIO_URL, audioUrl)
            putExtra(EXTRA_MANIFEST_URL, manifestUrl)
            putExtra(EXTRA_ATTACHMENT_URL, attachmentUrl)
        }
        sendBroadcast(intent)
    }
    
    private fun sendErrorBroadcast(errorMessage: String) {
        val intent = Intent(ACTION_UPLOAD_ERROR).apply {
            putExtra(EXTRA_ERROR_MESSAGE, errorMessage)
        }
        sendBroadcast(intent)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        
        // Release wake lock
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}
