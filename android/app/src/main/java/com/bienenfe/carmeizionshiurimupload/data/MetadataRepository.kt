package com.bienenfe.carmeizionshiurimupload.data

import android.content.Context
import android.content.SharedPreferences
import com.bienenfe.carmeizionshiurimupload.ui.AudioMetadata

class MetadataRepository(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "audio_metadata_prefs",
        Context.MODE_PRIVATE
    )

    fun saveMetadata(metadata: AudioMetadata) {
        prefs.edit().apply {
            putString(KEY_SPEAKER, metadata.speaker)
            putString(KEY_HEBREW_SEFER, metadata.hebrewSefer)
            putString(KEY_ENGLISH_SEFER, metadata.englishSefer)
            putString(KEY_SUB_CATEGORY, metadata.subCategory)
            putString(KEY_SHIUR_TYPE, metadata.shiurType)
            putString(KEY_CUSTOM_FOLDER, metadata.customFolder)
            putString(KEY_HEBREW_MESECHET, metadata.hebrewMesechet)
            putString(KEY_ENGLISH_MESECHET, metadata.englishMesechet)
            putString(KEY_DAF_NUMBER, metadata.dafNumber)
            apply()
        }
    }

    fun loadMetadata(): AudioMetadata {
        return AudioMetadata(
            hebrewTitle = "", // Should be unique per upload
            englishTitle = "", // Should be unique per upload
            speaker = prefs.getString(KEY_SPEAKER, "") ?: "",
            hebrewSefer = prefs.getString(KEY_HEBREW_SEFER, "") ?: "",
            englishSefer = prefs.getString(KEY_ENGLISH_SEFER, "") ?: "",
            shiurNum = "",
            subCategory = prefs.getString(KEY_SUB_CATEGORY, "") ?: "",
            sourceSheetLink = "",
            globalId = "",
            shiurType = prefs.getString(KEY_SHIUR_TYPE, "Ein Yaakov") ?: "Ein Yaakov",
            customFolder = prefs.getString(KEY_CUSTOM_FOLDER, "") ?: "",
            hebrewMesechet = prefs.getString(KEY_HEBREW_MESECHET, "") ?: "",
            englishMesechet = prefs.getString(KEY_ENGLISH_MESECHET, "") ?: "",
            dafNumber = prefs.getString(KEY_DAF_NUMBER, "") ?: ""
        )
    }

    companion object {
        private const val KEY_SPEAKER = "speaker"
        private const val KEY_HEBREW_SEFER = "hebrew_sefer"
        private const val KEY_ENGLISH_SEFER = "english_sefer"
        private const val KEY_SUB_CATEGORY = "sub_category"
        private const val KEY_SHIUR_TYPE = "shiur_type"
        private const val KEY_CUSTOM_FOLDER = "custom_folder"
        private const val KEY_HEBREW_MESECHET = "hebrew_mesechet"
        private const val KEY_ENGLISH_MESECHET = "english_mesechet"
        private const val KEY_DAF_NUMBER = "daf_number"
    }
}
