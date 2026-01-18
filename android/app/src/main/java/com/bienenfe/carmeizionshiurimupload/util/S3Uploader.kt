package com.bienenfe.carmeizionshiurimupload.util

import android.content.Context
import android.net.Uri
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.mobileconnectors.s3.transferutility.TransferListener
import com.amazonaws.mobileconnectors.s3.transferutility.TransferState
import com.amazonaws.mobileconnectors.s3.transferutility.TransferUtility
import com.amazonaws.regions.Region
import com.amazonaws.regions.Regions
import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model.ObjectMetadata
import com.amazonaws.services.s3.model.PutObjectRequest
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.File
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class S3Uploader(
    private val context: Context,
    private val accessKey: String,
    private val secretKey: String,
    private val bucketName: String = "midrash-aggadah",
    private val region: Regions = Regions.EU_NORTH_1
) {
    private val s3Client: AmazonS3Client
    private val transferUtility: TransferUtility

    init {
        val credentials = BasicAWSCredentials(accessKey, secretKey)
        s3Client = AmazonS3Client(credentials, Region.getRegion(region))
        transferUtility = TransferUtility.builder()
            .context(context)
            .s3Client(s3Client)
            .build()
    }

    suspend fun uploadFile(
        uri: Uri,
        s3Key: String,
        bucketName: String = this.bucketName,
        onProgress: (Int) -> Unit = {}
    ): UploadResult = suspendCancellableCoroutine { continuation ->
        try {
            // Copy URI content to a temporary file
            val tempFile = createTempFileFromUri(uri)

            // IMPORTANT: Set Content-Type explicitly.
            // Without this, S3 will often store `application/octet-stream` which can cause
            // podcast clients (notably Apple Podcasts) to ignore M4A enclosures.
            val metadata = ObjectMetadata().apply {
                contentType = contentTypeForS3Key(s3Key)
            }
            val putRequest = PutObjectRequest(bucketName, s3Key, tempFile).apply {
                this.metadata = metadata
            }

            val uploadObserver = transferUtility.upload(putRequest)

            uploadObserver.setTransferListener(object : TransferListener {
                override fun onStateChanged(id: Int, state: TransferState) {
                    when (state) {
                        TransferState.COMPLETED -> {
                            tempFile.delete()
                            val s3Url = "https://$bucketName.s3.amazonaws.com/$s3Key"
                            if (continuation.isActive) {
                                continuation.resume(UploadResult.Success(s3Url))
                            }
                        }
                        TransferState.FAILED, TransferState.CANCELED -> {
                            tempFile.delete()
                            if (continuation.isActive) {
                                continuation.resume(
                                    UploadResult.Error("Upload failed: ${state.name}")
                                )
                            }
                        }
                        else -> {
                            // IN_PROGRESS, WAITING, etc.
                        }
                    }
                }

                override fun onProgressChanged(id: Int, bytesCurrent: Long, bytesTotal: Long) {
                    if (bytesTotal > 0) {
                        val progress = ((bytesCurrent * 100) / bytesTotal).toInt()
                        onProgress(progress)
                    }
                }

                override fun onError(id: Int, ex: Exception) {
                    tempFile.delete()
                    if (continuation.isActive) {
                        continuation.resumeWithException(ex)
                    }
                }
            })

            continuation.invokeOnCancellation {
                // TransferUtility doesn't support cancellation in this way
                // The upload will continue but we'll clean up the temp file
                tempFile.delete()
            }
        } catch (e: Exception) {
            if (continuation.isActive) {
                continuation.resumeWithException(e)
            }
        }
    }

    suspend fun uploadJsonMetadata(
        jsonContent: String,
        s3Key: String
    ): UploadResult = suspendCancellableCoroutine { continuation ->
        try {
            // Create a temporary file with JSON content
            val tempFile = File.createTempFile("metadata_", ".json", context.cacheDir)
            tempFile.writeText(jsonContent)

            val metadata = ObjectMetadata().apply {
                contentType = "application/json; charset=utf-8"
            }
            val putRequest = PutObjectRequest(bucketName, s3Key, tempFile).apply {
                this.metadata = metadata
            }

            val uploadObserver = transferUtility.upload(putRequest)

            uploadObserver.setTransferListener(object : TransferListener {
                override fun onStateChanged(id: Int, state: TransferState) {
                    when (state) {
                        TransferState.COMPLETED -> {
                            tempFile.delete()
                            val s3Url = "https://$bucketName.s3.amazonaws.com/$s3Key"
                            if (continuation.isActive) {
                                continuation.resume(UploadResult.Success(s3Url))
                            }
                        }
                        TransferState.FAILED, TransferState.CANCELED -> {
                            tempFile.delete()
                            if (continuation.isActive) {
                                continuation.resume(
                                    UploadResult.Error("Metadata upload failed: ${state.name}")
                                )
                            }
                        }
                        else -> {
                            // IN_PROGRESS, WAITING, etc.
                        }
                    }
                }

                override fun onProgressChanged(id: Int, bytesCurrent: Long, bytesTotal: Long) {
                    // JSON files are small, no need to track progress
                }

                override fun onError(id: Int, ex: Exception) {
                    tempFile.delete()
                    if (continuation.isActive) {
                        continuation.resumeWithException(ex)
                    }
                }
            })

            continuation.invokeOnCancellation {
                tempFile.delete()
            }
        } catch (e: Exception) {
            if (continuation.isActive) {
                continuation.resumeWithException(e)
            }
        }
    }

    private fun contentTypeForS3Key(s3Key: String): String {
        val ext = s3Key.substringAfterLast('.', "").lowercase()
        return when (ext) {
            "m4a", "mp4" -> "audio/mp4"
            "mp3" -> "audio/mpeg"
            "aac" -> "audio/aac"
            "wav" -> "audio/wav"
            "json" -> "application/json; charset=utf-8"
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "pdf" -> "application/pdf"
            else -> "application/octet-stream"
        }
    }

    private fun createTempFileFromUri(uri: Uri): File {
        val inputStream = context.contentResolver.openInputStream(uri)
            ?: throw IllegalArgumentException("Cannot open URI: $uri")
        
        val tempFile = File.createTempFile("upload_", ".tmp", context.cacheDir)
        tempFile.outputStream().use { outputStream ->
            inputStream.copyTo(outputStream)
        }
        inputStream.close()
        
        return tempFile
    }

    sealed class UploadResult {
        data class Success(val s3Url: String) : UploadResult()
        data class Error(val message: String) : UploadResult()
    }
}
