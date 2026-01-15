package com.bienenfe.carmeizionshiurimupload.config

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model.ObjectMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayInputStream

class CredentialManager(private val context: Context) {
    
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "aws_credentials",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    companion object {
        private const val KEY_ACCESS_KEY = "access_key"
        private const val KEY_SECRET_KEY = "secret_key"
        private const val KEY_VALIDATED = "validated"
    }
    
    fun saveCredentials(accessKey: String, secretKey: String) {
        sharedPreferences.edit().apply {
            putString(KEY_ACCESS_KEY, accessKey)
            putString(KEY_SECRET_KEY, secretKey)
            putBoolean(KEY_VALIDATED, true)
            apply()
        }
    }
    
    fun getAccessKey(): String? {
        return sharedPreferences.getString(KEY_ACCESS_KEY, null)
    }
    
    fun getSecretKey(): String? {
        return sharedPreferences.getString(KEY_SECRET_KEY, null)
    }
    
    fun hasCredentials(): Boolean {
        return getAccessKey() != null && getSecretKey() != null
    }
    
    fun areCredentialsValidated(): Boolean {
        return sharedPreferences.getBoolean(KEY_VALIDATED, false)
    }
    
    fun clearCredentials() {
        sharedPreferences.edit().clear().apply()
    }
    
    suspend fun testCredentials(accessKey: String, secretKey: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val credentials = BasicAWSCredentials(accessKey, secretKey)
            val s3Client = AmazonS3Client(credentials, com.amazonaws.regions.Region.getRegion(
                com.amazonaws.regions.Regions.fromName(AwsConfig.REGION)
            ))
            
            // Upload a 0-byte test file
            val testKey = "testing/${System.currentTimeMillis()}"
            val metadata = ObjectMetadata()
            metadata.contentLength = 0
            
            s3Client.putObject(
                AwsConfig.BUCKET_NAME,
                testKey,
                ByteArrayInputStream(ByteArray(0)),
                metadata
            )
            
            true
        } catch (e: Exception) {
            android.util.Log.e("CredentialManager", "Credential test failed", e)
            false
        }
    }
    
    fun needsCredentials(): Boolean {
        // Check if hardcoded credentials are still REPLACE_ME
        if (AwsConfig.ACCESS_KEY != "REPLACE_ME" && AwsConfig.SECRET_KEY != "REPLACE_ME") {
            return false
        }
        
        // Check if we have stored credentials
        return !hasCredentials()
    }
    
    fun getEffectiveAccessKey(): String {
        return if (AwsConfig.ACCESS_KEY != "REPLACE_ME") {
            AwsConfig.ACCESS_KEY
        } else {
            getAccessKey() ?: "REPLACE_ME"
        }
    }
    
    fun getEffectiveSecretKey(): String {
        return if (AwsConfig.SECRET_KEY != "REPLACE_ME") {
            AwsConfig.SECRET_KEY
        } else {
            getSecretKey() ?: "REPLACE_ME"
        }
    }
}
