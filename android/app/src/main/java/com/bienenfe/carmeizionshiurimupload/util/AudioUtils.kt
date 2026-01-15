package com.bienenfe.carmeizionshiurimupload.util

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri

object AudioUtils {
    /**
     * Get audio duration from URI and format it as HH:MM:SS or MM:SS
     * @param context Android context
     * @param uri URI of the audio file
     * @return Formatted duration string (e.g., "45:52" or "1:23:45")
     */
    fun getAudioDuration(context: Context, uri: Uri): String {
        val retriever = MediaMetadataRetriever()
        return try {
            retriever.setDataSource(context, uri)
            val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()
            retriever.release()
            
            if (durationMs != null) {
                formatDuration(durationMs)
            } else {
                ""
            }
        } catch (e: Exception) {
            retriever.release()
            ""
        }
    }
    
    /**
     * Format duration in milliseconds to HH:MM:SS or MM:SS format
     * @param durationMs Duration in milliseconds
     * @return Formatted string (e.g., "45:52" or "1:23:45")
     */
    private fun formatDuration(durationMs: Long): String {
        val totalSeconds = durationMs / 1000
        val hours = totalSeconds / 3600
        val minutes = (totalSeconds % 3600) / 60
        val seconds = totalSeconds % 60
        
        return if (hours > 0) {
            String.format("%d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format("%d:%02d", minutes, seconds)
        }
    }
}
