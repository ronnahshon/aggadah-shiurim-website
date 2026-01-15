package com.bienenfe.carmeizionshiurimupload

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.bienenfe.carmeizionshiurimupload.config.AwsConfig
import com.bienenfe.carmeizionshiurimupload.config.CredentialManager
import com.bienenfe.carmeizionshiurimupload.data.MetadataRepository
import com.bienenfe.carmeizionshiurimupload.service.RecordingService
import com.bienenfe.carmeizionshiurimupload.service.UploadService
import com.bienenfe.carmeizionshiurimupload.ui.AudioUploadScreen
import com.bienenfe.carmeizionshiurimupload.ui.CredentialDialog
import com.bienenfe.carmeizionshiurimupload.ui.theme.CarmeiZionShiurimUploadTheme
import com.bienenfe.carmeizionshiurimupload.util.AudioUtils
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : ComponentActivity() {
    private lateinit var metadataRepository: MetadataRepository
    private lateinit var credentialManager: CredentialManager
    private var mediaPlayer: MediaPlayer? = null
    
    // Callback for recording completion
    private var onRecordingComplete: ((File?) -> Unit)? = null
    
    private val uploadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                UploadService.ACTION_UPLOAD_COMPLETE -> {
                    val audioUrl = intent.getStringExtra(UploadService.EXTRA_AUDIO_URL) ?: ""
                    val manifestUrl = intent.getStringExtra(UploadService.EXTRA_MANIFEST_URL) ?: ""
                    val attachmentUrl = intent.getStringExtra(UploadService.EXTRA_ATTACHMENT_URL) ?: ""
                    
                    val message = buildString {
                        append("Upload successful!\n")
                        append("Audio: $audioUrl\n")
                        append("Metadata: $manifestUrl")
                        if (attachmentUrl.isNotEmpty()) {
                            append("\nAttachment: $attachmentUrl")
                        }
                    }
                    Toast.makeText(this@MainActivity, message, Toast.LENGTH_LONG).show()
                }
                UploadService.ACTION_UPLOAD_ERROR -> {
                    val errorMessage = intent.getStringExtra(UploadService.EXTRA_ERROR_MESSAGE) ?: "Unknown error"
                    Toast.makeText(this@MainActivity, "Upload failed: $errorMessage", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private val recordingReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            Log.d("MainActivity", "Recording broadcast received: ${intent?.action}")
            when (intent?.action) {
                RecordingService.ACTION_STOP_RECORDING -> {
                    val uriString = intent.getStringExtra(RecordingService.EXTRA_RECORDING_URI)
                    val filePath = intent.getStringExtra(RecordingService.EXTRA_RECORDING_FILE)
                    
                    Log.d("MainActivity", "URI: $uriString, File path: $filePath")
                    
                    // Prefer URI (Android 10+) over file path
                    if (uriString != null) {
                        val uri = Uri.parse(uriString)
                        recordedFileUri = uri
                        
                        // Get the file name from the URI
                        val fileName = getFileName(uri)
                        // Pass a dummy file just for the name
                        val tempFile = File(fileName)
                        onRecordingComplete?.invoke(tempFile)
                    } else if (filePath != null) {
                        val file = File(filePath)
                        Log.d("MainActivity", "File exists: ${file.exists()}, size: ${file.length()}")
                        recordedFileUri = null
                        onRecordingComplete?.invoke(file)
                    } else {
                        Log.e("MainActivity", "Both URI and file path are null!")
                        recordedFileUri = null
                        onRecordingComplete?.invoke(null)
                    }
                }
            }
        }
    }
    
    private var recordedFileUri: Uri? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        metadataRepository = MetadataRepository(this)
        credentialManager = CredentialManager(this)
        
        // Register broadcast receiver for upload results
        val uploadFilter = IntentFilter().apply {
            addAction(UploadService.ACTION_UPLOAD_COMPLETE)
            addAction(UploadService.ACTION_UPLOAD_ERROR)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(uploadReceiver, uploadFilter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(uploadReceiver, uploadFilter)
        }
        
        // Register broadcast receiver for recording results
        val recordingFilter = IntentFilter().apply {
            addAction(RecordingService.ACTION_STOP_RECORDING)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(recordingReceiver, recordingFilter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(recordingReceiver, recordingFilter)
        }
        Log.d("MainActivity", "Recording receiver registered in onCreate")
        
        val savedMetadata = metadataRepository.loadMetadata()
        
        setContent {
            var showCredentialDialog by remember { mutableStateOf(credentialManager.needsCredentials()) }
            var isValidatingCredentials by remember { mutableStateOf(false) }
            var credentialError by remember { mutableStateOf<String?>(null) }
            var selectedFileUri by remember { mutableStateOf<Uri?>(null) }
            var selectedFileName by remember { mutableStateOf<String?>(null) }
            var selectedAttachmentUri by remember { mutableStateOf<Uri?>(null) }
            var selectedAttachmentName by remember { mutableStateOf<String?>(null) }
            var isRecording by remember { mutableStateOf(false) }
            var recordingDuration by remember { mutableStateOf(0) }
            var isUploading by remember { mutableStateOf(false) }
            var uploadProgress by remember { mutableStateOf(0) }
            var isRecordedFile by remember { mutableStateOf(false) } // Track if file was recorded
            var isPlaying by remember { mutableStateOf(false) }
            val scope = rememberCoroutineScope()
            
            // Set up callback for recording completion
            onRecordingComplete = { file ->
                isRecording = false
                if (file != null) {
                    // Stop any playing audio when a new recording is complete
                    mediaPlayer?.stop()
                    mediaPlayer?.release()
                    mediaPlayer = null
                    isPlaying = false
                    
                    // Use the stored URI if available (Android 10+), otherwise create from file
                    if (recordedFileUri != null) {
                        // Android 10+: Use MediaStore URI directly
                        selectedFileUri = recordedFileUri
                        selectedFileName = file.name
                        
                        // Grant read permission to ourselves for the URI
                        try {
                            grantUriPermission(
                                packageName,
                                recordedFileUri,
                                Intent.FLAG_GRANT_READ_URI_PERMISSION
                            )
                        } catch (e: Exception) {
                            Log.w("MainActivity", "Could not grant URI permission", e)
                        }
                    } else {
                        // Android 9 and below: Create FileProvider URI from file
                        selectedFileUri = FileProvider.getUriForFile(
                            this@MainActivity,
                            "${packageName}.fileprovider",
                            file
                        )
                        selectedFileName = file.name
                    }
                    isRecordedFile = true
                    Toast.makeText(this@MainActivity, "Recording saved: ${file.name}", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@MainActivity, "Failed to save recording", Toast.LENGTH_SHORT).show()
                }
            }
            
            // Timer effect for recording duration
            LaunchedEffect(isRecording) {
                if (isRecording) {
                    recordingDuration = 0
                    while (isRecording) {
                        kotlinx.coroutines.delay(1000)
                        recordingDuration++
                    }
                }
            }
            
            val permissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestMultiplePermissions()
            ) { permissions ->
                val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
                val storageGranted = if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
                    permissions[Manifest.permission.WRITE_EXTERNAL_STORAGE] ?: false
                } else {
                    true // Not needed on Android 10+
                }
                
                if (audioGranted && storageGranted) {
                    val startIntent = Intent(this, RecordingService::class.java).apply {
                        action = RecordingService.ACTION_START_RECORDING
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(startIntent)
                    } else {
                        startService(startIntent)
                    }
                    isRecording = true
                } else {
                    Toast.makeText(this, "Microphone and storage permissions required", Toast.LENGTH_SHORT).show()
                }
            }
            
            val filePickerLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.GetContent()
            ) { uri: Uri? ->
                uri?.let {
                    // Stop any playing audio when selecting a new file
                    mediaPlayer?.stop()
                    mediaPlayer?.release()
                    mediaPlayer = null
                    isPlaying = false
                    
                    selectedFileUri = it
                    selectedFileName = getFileName(it)
                    isRecordedFile = false // Mark as selected file
                }
            }
            
            val attachmentPickerLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.GetContent()
            ) { uri: Uri? ->
                uri?.let {
                    selectedAttachmentUri = it
                    selectedAttachmentName = getFileName(it)
                }
            }
            
            val cameraLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.TakePicture()
            ) { success ->
                if (success) {
                    // Photo was saved to the URI
                    selectedAttachmentName?.let {
                        Toast.makeText(this, "Photo captured: $it", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            
            val cameraPermissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestPermission()
            ) { isGranted ->
                if (isGranted) {
                    // Create a file for the photo
                    val photoFile = File(cacheDir, "attachment_${System.currentTimeMillis()}.jpg")
                    val photoUri = FileProvider.getUriForFile(
                        this,
                        "${packageName}.fileprovider",
                        photoFile
                    )
                    selectedAttachmentUri = photoUri
                    selectedAttachmentName = photoFile.name
                    cameraLauncher.launch(photoUri)
                } else {
                    Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
                }
            }
            
            val notificationPermissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestPermission()
            ) { isGranted ->
                if (!isGranted) {
                    Toast.makeText(this, "Notification permission recommended for upload progress", Toast.LENGTH_SHORT).show()
                }
            }
            
            // Request notification permission on Android 13+
            LaunchedEffect(Unit) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.POST_NOTIFICATIONS
                        ) != PackageManager.PERMISSION_GRANTED
                    ) {
                        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }
            }
            
            CarmeiZionShiurimUploadTheme {
                // Show credential dialog if needed
                if (showCredentialDialog) {
                    CredentialDialog(
                        onDismiss = { /* Don't allow dismissal */ },
                        onCredentialsEntered = { accessKey, secretKey ->
                            isValidatingCredentials = true
                            credentialError = null
                            
                            scope.launch {
                                val isValid = credentialManager.testCredentials(accessKey, secretKey)
                                isValidatingCredentials = false
                                
                                if (isValid) {
                                    credentialManager.saveCredentials(accessKey, secretKey)
                                    showCredentialDialog = false
                                    Toast.makeText(
                                        this@MainActivity,
                                        "✅ Credentials validated successfully!",
                                        Toast.LENGTH_LONG
                                    ).show()
                                } else {
                                    credentialError = "Invalid credentials. Please check the format: <AccessKeyID>+<SecretKey>"
                                }
                            }
                        },
                        isValidating = isValidatingCredentials,
                        validationError = credentialError
                    )
                }
                
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    AudioUploadScreen(
                        onResetCredentials = {
                            credentialManager.clearCredentials()
                            showCredentialDialog = true
                            Toast.makeText(
                                this@MainActivity,
                                "Credentials cleared. Please enter new credentials.",
                                Toast.LENGTH_SHORT
                            ).show()
                        },
                        onRecordAudio = {
                            if (isRecording) {
                                // Stop recording via service (don't set isRecording = false yet, wait for broadcast)
                                Log.d("MainActivity", "Stop button clicked, sending stop intent")
                                val stopIntent = Intent(this, RecordingService::class.java).apply {
                                    action = RecordingService.ACTION_STOP_RECORDING
                                }
                                startService(stopIntent)
                                Log.d("MainActivity", "Stop intent sent")
                            } else {
                                // Start recording via service
                                when {
                                    ContextCompat.checkSelfPermission(
                                        this,
                                        Manifest.permission.RECORD_AUDIO
                                    ) == PackageManager.PERMISSION_GRANTED &&
                                    (Build.VERSION.SDK_INT > Build.VERSION_CODES.P ||
                                    ContextCompat.checkSelfPermission(
                                        this,
                                        Manifest.permission.WRITE_EXTERNAL_STORAGE
                                    ) == PackageManager.PERMISSION_GRANTED) -> {
                                        val startIntent = Intent(this, RecordingService::class.java).apply {
                                            action = RecordingService.ACTION_START_RECORDING
                                        }
                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                            startForegroundService(startIntent)
                                        } else {
                                            startService(startIntent)
                                        }
                                        isRecording = true
                                    }
                                    else -> {
                                        val permissionsToRequest = mutableListOf(Manifest.permission.RECORD_AUDIO)
                                        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
                                            permissionsToRequest.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                                        }
                                        permissionLauncher.launch(permissionsToRequest.toTypedArray())
                                    }
                                }
                            }
                        },
                        onSelectFile = {
                            filePickerLauncher.launch("audio/*")
                        },
                        onSelectAttachment = {
                            attachmentPickerLauncher.launch("image/*,application/pdf")
                        },
                        onTakePhoto = {
                            when {
                                ContextCompat.checkSelfPermission(
                                    this,
                                    Manifest.permission.CAMERA
                                ) == PackageManager.PERMISSION_GRANTED -> {
                                    // Create a file for the photo
                                    val photoFile = File(cacheDir, "attachment_${System.currentTimeMillis()}.jpg")
                                    val photoUri = FileProvider.getUriForFile(
                                        this,
                                        "${packageName}.fileprovider",
                                        photoFile
                                    )
                                    selectedAttachmentUri = photoUri
                                    selectedAttachmentName = photoFile.name
                                    cameraLauncher.launch(photoUri)
                                }
                                else -> {
                                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                                }
                            }
                        },
                        onPlayAudio = {
                            selectedFileUri?.let { uri ->
                                if (isPlaying) {
                                    // Stop playback
                                    mediaPlayer?.stop()
                                    mediaPlayer?.release()
                                    mediaPlayer = null
                                    isPlaying = false
                                } else {
                                    // Start playback
                                    try {
                                        Log.d("MainActivity", "Attempting to play audio from URI: $uri")
                                        mediaPlayer?.release()
                                        mediaPlayer = MediaPlayer().apply {
                                            setDataSource(this@MainActivity, uri)
                                            prepare()
                                            start()
                                            setOnCompletionListener {
                                                isPlaying = false
                                            }
                                        }
                                        isPlaying = true
                                        Log.d("MainActivity", "Audio playback started successfully")
                                    } catch (e: Exception) {
                                        Log.e("MainActivity", "Error playing audio", e)
                                        Toast.makeText(
                                            this@MainActivity,
                                            "Error playing audio: ${e.message}",
                                            Toast.LENGTH_SHORT
                                        ).show()
                                        isPlaying = false
                                    }
                                }
                            }
                        },
                        onUpload = { metadata ->
                            selectedFileUri?.let { uri ->
                                // Extract audio duration
                                val duration = AudioUtils.getAudioDuration(this, uri)
                                val metadataWithDuration = metadata.copy(length = duration)
                                
                                // Save metadata for next time
                                metadataRepository.saveMetadata(metadataWithDuration)
                                
                                // Get the S3 folder path
                                val s3FolderPath = metadataWithDuration.getS3FolderPath()
                                
                                // Use the single source of truth for filename generation
                                val originalFileName = selectedFileName ?: "audio_${System.currentTimeMillis()}.m4a"
                                val fileName = metadataWithDuration.generateS3FileName(originalFileName, isRecordedFile)
                                
                                val s3Key = s3FolderPath + fileName
                                val manifestS3Key = s3FolderPath + fileName.substringBeforeLast(".") + ".manifest"
                                
                                // Prepare attachment info if present
                                var attachmentS3Key: String? = null
                                var attachmentLink = ""
                                
                                selectedAttachmentUri?.let { attachmentUri ->
                                    val attachmentFileName = selectedAttachmentName ?: "attachment_${System.currentTimeMillis()}"
                                    val fileNameWithoutExt = fileName.substringBeforeLast(".")
                                    val attachmentExtension = attachmentFileName.substringAfterLast(".", "jpg")
                                    val attachmentFolderPath = metadataWithDuration.getAttachmentFolderPath()
                                    attachmentS3Key = attachmentFolderPath + fileNameWithoutExt + "." + attachmentExtension
                                    attachmentLink = "https://midrash-aggadah.s3.eu-north-1.amazonaws.com/$attachmentS3Key"
                                }
                                
                                // Update metadata with attachment link
                                val finalMetadata = metadataWithDuration.copy(attachmentLink = attachmentLink)
                                val jsonContent = finalMetadata.toJsonMetadata(fileName)
                                
                                // Start upload service
                                val serviceIntent = Intent(this, UploadService::class.java).apply {
                                    putExtra(UploadService.EXTRA_AUDIO_URI, uri.toString())
                                    putExtra(UploadService.EXTRA_AUDIO_KEY, s3Key)
                                    putExtra(UploadService.EXTRA_ATTACHMENT_URI, selectedAttachmentUri?.toString())
                                    putExtra(UploadService.EXTRA_ATTACHMENT_KEY, attachmentS3Key)
                                    putExtra(UploadService.EXTRA_MANIFEST_KEY, manifestS3Key)
                                    putExtra(UploadService.EXTRA_MANIFEST_JSON, jsonContent)
                                }
                                
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                    startForegroundService(serviceIntent)
                                } else {
                                    startService(serviceIntent)
                                }
                                
                                Toast.makeText(
                                    this,
                                    "Upload started in background",
                                    Toast.LENGTH_SHORT
                                ).show()
                                
                                // Stop any playing audio and clear selection
                                mediaPlayer?.stop()
                                mediaPlayer?.release()
                                mediaPlayer = null
                                isPlaying = false
                                selectedFileUri = null
                                selectedFileName = null
                                selectedAttachmentUri = null
                                selectedAttachmentName = null
                                isRecordedFile = false
                                isUploading = false
                                
                            } ?: run {
                                Toast.makeText(
                                    this,
                                    "No file selected",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        },
                        selectedFileName = selectedFileName,
                        selectedAttachmentName = selectedAttachmentName,
                        savedMetadata = savedMetadata,
                        isRecording = isRecording,
                        recordingDuration = recordingDuration,
                        isUploading = isUploading,
                        uploadProgress = uploadProgress,
                        isRecordedFile = isRecordedFile,
                        isPlaying = isPlaying,
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        onRecordingComplete = null
        mediaPlayer?.release()
        mediaPlayer = null
        unregisterReceiver(uploadReceiver)
        unregisterReceiver(recordingReceiver)
    }
    
    private fun getFileName(uri: Uri): String {
        var result: String? = null
        if (uri.scheme == "content") {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (nameIndex != -1) {
                        result = cursor.getString(nameIndex)
                    }
                }
            }
        }
        if (result == null) {
            result = uri.path
            val cut = result?.lastIndexOf('/') ?: -1
            if (cut != -1) {
                result = result?.substring(cut + 1)
            }
        }
        return result ?: "Unknown file"
    }
}