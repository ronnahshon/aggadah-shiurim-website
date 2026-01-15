package com.bienenfe.carmeizionshiurimupload.util

import android.content.ContentValues
import android.content.Context
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.PowerManager
import android.provider.MediaStore
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class AudioRecorder(private val context: Context) {
    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: File? = null
    private var outputUri: Uri? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var isUsingMediaStore = false
    
    fun startRecording(): File? {
        try {
            // Acquire wake lock to keep CPU running during recording
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "CarmeiZionShiurim::AudioRecordingWakeLock"
            )
            wakeLock?.acquire(3 * 60 * 60 * 1000L) // 3 hours max
            
            // Create output file
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val fileName = "recording_$timestamp.m4a"
            
            // Initialize MediaRecorder
            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }
            
            // Android 10+ (API 29+): Use MediaStore for scoped storage
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.Audio.Media.DISPLAY_NAME, fileName)
                    put(MediaStore.Audio.Media.MIME_TYPE, "audio/mp4")
                    put(MediaStore.Audio.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MUSIC}/Shiurim")
                    put(MediaStore.Audio.Media.IS_PENDING, 1)
                }
                
                outputUri = context.contentResolver.insert(
                    MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                    contentValues
                )
                
                if (outputUri == null) {
                    releaseWakeLock()
                    return null
                }
                
                val fileDescriptor = context.contentResolver.openFileDescriptor(outputUri!!, "w")
                    ?: throw IOException("Failed to open file descriptor")
                
                mediaRecorder?.apply {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioEncodingBitRate(128000)
                    setAudioSamplingRate(44100)
                    setOutputFile(fileDescriptor.fileDescriptor)
                    
                    prepare()
                    start()
                }
                
                fileDescriptor.close()
                isUsingMediaStore = true
                
                // Return a temporary file reference (actual file is managed by MediaStore)
                outputFile = File(context.cacheDir, fileName)
                
            } else {
                // Android 9 and below: Use direct file access
                val recordingsDir = File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC),
                    "Shiurim"
                )
                recordingsDir.mkdirs()
                
                outputFile = File(recordingsDir, fileName)
                
                mediaRecorder?.apply {
                    setAudioSource(MediaRecorder.AudioSource.MIC)
                    setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                    setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                    setAudioEncodingBitRate(128000)
                    setAudioSamplingRate(44100)
                    setOutputFile(outputFile?.absolutePath)
                    
                    prepare()
                    start()
                }
                
                isUsingMediaStore = false
            }
            
            return outputFile
        } catch (e: IOException) {
            e.printStackTrace()
            releaseWakeLock()
            release()
            return null
        }
    }
    
    fun stopRecording(): File? {
        return try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null
            releaseWakeLock()
            
            // Mark file as complete in MediaStore (Android 10+)
            if (isUsingMediaStore && outputUri != null) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.Audio.Media.IS_PENDING, 0)
                }
                context.contentResolver.update(outputUri!!, contentValues, null, null)
            }
            
            outputFile
        } catch (e: Exception) {
            e.printStackTrace()
            releaseWakeLock()
            release()
            null
        }
    }
    
    fun release() {
        mediaRecorder?.release()
        mediaRecorder = null
        releaseWakeLock()
    }
    
    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null
    }
    
    fun isRecording(): Boolean {
        return mediaRecorder != null
    }
    
    fun getRecordingUri(): Uri? {
        return outputUri
    }
}
