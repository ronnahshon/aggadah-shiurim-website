package com.bienenfe.carmeizionshiurimupload.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AudioUploadScreen(
    onResetCredentials: () -> Unit,
    onRecordAudio: () -> Unit,
    onSelectFile: () -> Unit,
    onSelectAttachment: () -> Unit,
    onTakePhoto: () -> Unit,
    onPlayAudio: () -> Unit,
    onUpload: (AudioMetadata) -> Unit,
    selectedFileName: String? = null,
    selectedAttachmentName: String? = null,
    savedMetadata: AudioMetadata? = null,
    isRecording: Boolean = false,
    recordingDuration: Int = 0,
    isUploading: Boolean = false,
    uploadProgress: Int = 0,
    isRecordedFile: Boolean = false,
    isPlaying: Boolean = false,
    modifier: Modifier = Modifier
) {
    var showVerificationDialog by remember { mutableStateOf(false) }
    var hebrewTitle by remember { mutableStateOf(savedMetadata?.hebrewTitle ?: "") }
    var englishTitle by remember { mutableStateOf(savedMetadata?.englishTitle ?: "") }
    var speaker by remember { mutableStateOf(savedMetadata?.speaker ?: "") }
    var hebrewSefer by remember { mutableStateOf(savedMetadata?.hebrewSefer ?: "") }
    var englishSefer by remember { mutableStateOf(savedMetadata?.englishSefer ?: "") }
    var shiurNum by remember { mutableStateOf(savedMetadata?.shiurNum ?: "") }
    var subCategory by remember { mutableStateOf(savedMetadata?.subCategory ?: "") }
    var sourceSheetLink by remember { mutableStateOf(savedMetadata?.sourceSheetLink ?: "") }
    var globalId by remember { mutableStateOf(savedMetadata?.globalId ?: "") }
    var shiurType by remember { mutableStateOf(savedMetadata?.shiurType ?: "Ein Yaakov") }
    var customFolder by remember { mutableStateOf(savedMetadata?.customFolder ?: "") }
    var expandedShiurDropdown by remember { mutableStateOf(false) }
    
    // Daf Yomi specific fields
    var hebrewMesechet by remember { mutableStateOf(savedMetadata?.hebrewMesechet ?: "") }
    var englishMesechet by remember { mutableStateOf(savedMetadata?.englishMesechet ?: "") }
    var dafNumber by remember { mutableStateOf(savedMetadata?.dafNumber ?: "") }
    
    val shiurTypes = listOf("Ein Yaakov", "Daf Yomi", "Gemara Iyun", "Meyuchadim", "Other")
    val isEinYaakov = shiurType == "Ein Yaakov"
    val isDafYomi = shiurType == "Daf Yomi"

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Upload Shiurim",
            style = MaterialTheme.typography.headlineMedium
        )

        // Audio Source Selection
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Audio Source",
                    style = MaterialTheme.typography.titleMedium
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onRecordAudio,
                        modifier = Modifier.weight(1f),
                        colors = if (isRecording) {
                            ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.error
                            )
                        } else {
                            ButtonDefaults.buttonColors()
                        }
                    ) {
                        Text(if (isRecording) "⏹️ Stop" else "🎤 Record")
                    }

                    Button(
                        onClick = onSelectFile,
                        modifier = Modifier.weight(1f),
                        enabled = !isRecording
                    ) {
                        Text("📁 Select File")
                    }
                }

                if (isRecording) {
                    val minutes = recordingDuration / 60
                    val seconds = recordingDuration % 60
                    Text(
                        text = "🔴 Recording: %d:%02d".format(minutes, seconds),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                selectedFileName?.let { fileName ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Selected: $fileName",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.weight(1f)
                        )
                        
                        IconButton(
                            onClick = onPlayAudio,
                            modifier = Modifier.size(40.dp)
                        ) {
                            Text(
                                text = if (isPlaying) "⏸️" else "▶️",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                    }
                }
            }
        }

        // Attachment Selection (Optional)
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Attachment (Optional)",
                    style = MaterialTheme.typography.titleMedium
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onTakePhoto,
                        modifier = Modifier.weight(1f),
                        enabled = !isRecording
                    ) {
                        Text("📷 Take Photo")
                    }

                    Button(
                        onClick = onSelectAttachment,
                        modifier = Modifier.weight(1f),
                        enabled = !isRecording
                    ) {
                        Text("📎 Select File")
                    }
                }

                selectedAttachmentName?.let { attachmentName ->
                    Text(
                        text = "Attachment: $attachmentName",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }
        }

        // Metadata Form
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Metadata",
                    style = MaterialTheme.typography.titleMedium
                )

                // Shiur Type Dropdown (moved to top)
                ExposedDropdownMenuBox(
                    expanded = expandedShiurDropdown,
                    onExpandedChange = { expandedShiurDropdown = it },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = shiurType,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Shiur Type") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedShiurDropdown) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedShiurDropdown,
                        onDismissRequest = { expandedShiurDropdown = false }
                    ) {
                        shiurTypes.forEach { type ->
                            DropdownMenuItem(
                                text = { Text(type) },
                                onClick = {
                                    shiurType = type
                                    expandedShiurDropdown = false
                                    if (type != "Other") {
                                        customFolder = ""
                                    }
                                }
                            )
                        }
                    }
                }

                // Custom Folder Input (only shown when "Other" is selected)
                if (shiurType == "Other") {
                    OutlinedTextField(
                        value = customFolder,
                        onValueChange = { customFolder = it },
                        label = { Text("S3 Folder Path") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("e.g., audio/custom_folder") }
                    )
                }

                // Common fields for all types (except Daf Yomi)
                if (!isDafYomi) {
                    OutlinedTextField(
                        value = hebrewTitle,
                        onValueChange = { hebrewTitle = it },
                        label = { Text("Hebrew Title *") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = englishTitle,
                        onValueChange = { englishTitle = it },
                        label = { Text("English Title *") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Speaker field for ALL types
                OutlinedTextField(
                    value = speaker,
                    onValueChange = { speaker = it },
                    label = { Text("Speaker *") },
                    modifier = Modifier.fillMaxWidth()
                )

                // Ein Yaakov specific fields
                if (isEinYaakov) {
                    OutlinedTextField(
                        value = subCategory,
                        onValueChange = { subCategory = it },
                        label = { Text("Sub Category") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = hebrewSefer,
                        onValueChange = { hebrewSefer = it },
                        label = { Text("Hebrew Sefer") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = englishSefer,
                        onValueChange = { englishSefer = it },
                        label = { Text("English Sefer") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = globalId,
                        onValueChange = { globalId = it },
                        label = { Text("Global ID") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = sourceSheetLink,
                        onValueChange = { sourceSheetLink = it },
                        label = { Text("Source Sheet Link") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("https://...") }
                    )
                } else {
                    // Other shiurim types (not Ein Yaakov, not Daf Yomi)
                    if (!isDafYomi) {
                        OutlinedTextField(
                            value = hebrewSefer,
                            onValueChange = { hebrewSefer = it },
                            label = { Text("Hebrew Sefer") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
                
                // Daf Yomi specific fields
                if (isDafYomi) {
                    OutlinedTextField(
                        value = hebrewMesechet,
                        onValueChange = { hebrewMesechet = it },
                        label = { Text("מסכת בעברית *") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("ברכות") }
                    )

                    OutlinedTextField(
                        value = englishMesechet,
                        onValueChange = { englishMesechet = it },
                        label = { Text("Mesechet in English *") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Berachos") }
                    )

                    OutlinedTextField(
                        value = dafNumber,
                        onValueChange = { dafNumber = it },
                        label = { Text("Daf Number *") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("2") }
                    )
                }
            }
        }

        // Verification and Upload Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = { showVerificationDialog = true },
                modifier = Modifier
                    .weight(1f)
                    .height(56.dp),
                enabled = selectedFileName != null && 
                         speaker.isNotBlank() &&
                         (isDafYomi || (hebrewTitle.isNotBlank() && englishTitle.isNotBlank())) &&
                         (shiurType != "Other" || customFolder.isNotBlank()) &&
                         (!isDafYomi || (hebrewMesechet.isNotBlank() && englishMesechet.isNotBlank() && dafNumber.isNotBlank())) &&
                         !isUploading
            ) {
                Text("🔍 Verify")
            }
            
            Button(
                onClick = {
                    onUpload(
                        AudioMetadata(
                            hebrewTitle = hebrewTitle,
                            englishTitle = englishTitle,
                            speaker = speaker,
                            hebrewSefer = hebrewSefer,
                            englishSefer = englishSefer,
                            shiurNum = shiurNum,
                            subCategory = subCategory,
                            sourceSheetLink = sourceSheetLink,
                            globalId = globalId,
                            shiurType = shiurType,
                            customFolder = customFolder,
                            hebrewMesechet = hebrewMesechet,
                            englishMesechet = englishMesechet,
                            dafNumber = dafNumber
                        )
                    )
                },
                modifier = Modifier
                    .weight(2f)
                    .height(56.dp),
                enabled = selectedFileName != null && 
                         speaker.isNotBlank() &&
                         (isDafYomi || (hebrewTitle.isNotBlank() && englishTitle.isNotBlank())) &&
                         (shiurType != "Other" || customFolder.isNotBlank()) &&
                         (!isDafYomi || (hebrewMesechet.isNotBlank() && englishMesechet.isNotBlank() && dafNumber.isNotBlank())) &&
                         !isUploading
            ) {
                Text(if (isUploading) "Uploading..." else "Upload to S3")
            }
        }
        
        // Reset Credentials Button
        OutlinedButton(
            onClick = onResetCredentials,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("🔄 Reset AWS Credentials")
        }
        
        // Upload Progress
        if (isUploading) {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Uploading: $uploadProgress%",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    LinearProgressIndicator(
                        progress = { uploadProgress / 100f },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
    
    // Verification Dialog
    if (showVerificationDialog) {
        val metadata = AudioMetadata(
            hebrewTitle = hebrewTitle,
            englishTitle = englishTitle,
            speaker = speaker,
            hebrewSefer = hebrewSefer,
            englishSefer = englishSefer,
            shiurNum = shiurNum,
            subCategory = subCategory,
            sourceSheetLink = sourceSheetLink,
            globalId = globalId,
            shiurType = shiurType,
            customFolder = customFolder,
            hebrewMesechet = hebrewMesechet,
            englishMesechet = englishMesechet,
            dafNumber = dafNumber
        )
        
        val audioFolder = metadata.getS3FolderPath()
        
        // Use the single source of truth for filename generation
        val originalFileName = selectedFileName ?: "audio_file.m4a"
        val fileName = metadata.generateS3FileName(originalFileName, isRecordedFile)
        
        val audioKey = audioFolder + fileName
        val manifestKey = audioFolder + fileName.substringBeforeLast(".") + ".manifest"
        
        // Generate attachment info if present (same logic as upload)
        val attachmentKey = if (selectedAttachmentName != null) {
            val attachmentFolder = metadata.getAttachmentFolderPath()
            val fileNameWithoutExt = fileName.substringBeforeLast(".")
            val attachmentExt = selectedAttachmentName.substringAfterLast(".", "jpg")
            attachmentFolder + fileNameWithoutExt + "." + attachmentExt
        } else null
        
        // Generate attachment link if present (same logic as upload)
        val attachmentLink = if (attachmentKey != null) {
            "https://midrash-aggadah.s3.eu-north-1.amazonaws.com/$attachmentKey"
        } else ""
        
        // Update metadata with attachment link (same as upload)
        val finalMetadata = metadata.copy(attachmentLink = attachmentLink)
        
        AlertDialog(
            onDismissRequest = { showVerificationDialog = false },
            title = { Text("Upload Verification") },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "S3 Upload Locations:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                    
                    Text(
                        text = "Audio: $audioKey",
                        style = MaterialTheme.typography.bodySmall
                    )
                    
                    Text(
                        text = "Manifest: $manifestKey",
                        style = MaterialTheme.typography.bodySmall
                    )
                    
                    if (attachmentKey != null) {
                        Text(
                            text = "Attachment: $attachmentKey",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    
                    Text(
                        text = "Metadata JSON:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )
                    
                    Text(
                        text = finalMetadata.toJsonMetadata(fileName),
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showVerificationDialog = false }) {
                    Text("Close")
                }
            }
        )
    }
}

data class AudioMetadata(
    val hebrewTitle: String = "",
    val englishTitle: String = "",
    val speaker: String = "",
    val hebrewSefer: String = "",
    val englishSefer: String = "",
    val shiurNum: String = "",
    val subCategory: String = "",
    val sourceSheetLink: String = "",
    val globalId: String = "",
    val shiurType: String = "Ein Yaakov",
    val customFolder: String = "",
    val length: String = "",
    val attachmentLink: String = "",
    val hebrewMesechet: String = "",
    val englishMesechet: String = "",
    val dafNumber: String = ""
) {
    fun getS3FolderPath(): String {
        return when (shiurType) {
            "Ein Yaakov" -> "audio/"
            "Daf Yomi" -> "carmei_zion_daf_yomi/"
            "Gemara Iyun" -> "carmei_zion_gemara_beiyyun/"
            "Meyuchadim" -> "carmei_zion_shiurim_meyuhadim/"
            "Other" -> customFolder
            else -> "audio/"
        }
    }
    
    fun getAttachmentFolderPath(): String {
        return when (shiurType) {
            "Ein Yaakov" -> "source_sheets/"
            "Daf Yomi" -> "carmei_zion_daf_yomi-sources/"
            "Gemara Iyun" -> "carmei_zion_gemara_beiyyun-sources/"
            "Meyuchadim" -> "carmei_zion_shiurim_meyuhadim-sources/"
            "Other" -> {
                val folder = customFolder.trimEnd('/')
                "$folder-sources/"
            }
            else -> "source_sheets/"
        }
    }
    
    /**
     * Generate the final filename for S3 upload.
     * This is the single source of truth for filename generation.
     * 
     * @param originalFileName The original filename from recording or file selection
     * @param isRecordedFile Whether the file was recorded in-app (true) or selected (false)
     * @return The final filename to use for S3 upload
     */
    fun generateS3FileName(originalFileName: String, isRecordedFile: Boolean): String {
        val fileExtension = originalFileName.substringAfterLast(".", "m4a")
        
        return if (isRecordedFile) {
            // File was recorded - use YYYY:MM:DD-englishTitle format
            val dateFormat = java.text.SimpleDateFormat("yyyy:MM:dd", java.util.Locale.getDefault())
            val dateStr = dateFormat.format(java.util.Date())
            
            // Get english title based on shiur type
            val englishTitleText = if (shiurType == "Daf Yomi") {
                // For Daf Yomi, generate from mesechet and daf number
                val mesechet = englishMesechet.ifBlank { "Unknown" }
                val daf = dafNumber.ifBlank { "1" }
                "${mesechet}_${daf}"
            } else {
                englishTitle.ifBlank { "Shiur" }
            }
            
            val sanitizedTitle = englishTitleText
                .trim()
                .replace(" ", "_")
                .replace(Regex("[^a-zA-Z0-9_-]"), "")
            "$dateStr-$sanitizedTitle.$fileExtension"
        } else {
            // File was selected - use original file name
            originalFileName
        }
    }
    
    private fun numberToHebrewLetters(num: Int): String {
        val ones = arrayOf("", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט")
        val tens = arrayOf("", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ")
        val hundreds = arrayOf("", "ק", "ר", "ש", "ת")
        
        val h = num / 100
        val remainder = num % 100
        
        // Special cases for 15 and 16 (to avoid spelling God's name)
        val tensAndOnes = when (remainder) {
            15 -> "טו"
            16 -> "טז"
            else -> {
                val t = remainder / 10
                val o = remainder % 10
                buildString {
                    if (t > 0) append(tens[t])
                    if (o > 0) append(ones[o])
                }
            }
        }
        
        return buildString {
            if (h > 0) append(hundreds[h])
            append(tensAndOnes)
        }
    }
    
    fun toJsonMetadata(fileName: String): String {
        val timestamp = System.currentTimeMillis() / 1000
        val fileNameWithoutExt = fileName.substringBeforeLast(".")
        val audioExtension = fileName.substringAfterLast(".", "m4a")
        
        return if (shiurType == "Daf Yomi") {
            // Daf Yomi metadata schema
            val dafNum = dafNumber.toIntOrNull() ?: 1
            val hebrewDaf = numberToHebrewLetters(dafNum)
            val generatedHebrewTitle = "$hebrewMesechet $hebrewDaf"
            val generatedEnglishTitle = "$englishMesechet $dafNum"
            val s3Key = getS3FolderPath() + fileNameWithoutExt
            
            buildString {
                append("{\n")
                append("  \"id\": \"$s3Key\",\n")
                append("  \"hebrew_title\": \"$generatedHebrewTitle\",\n")
                append("  \"english_title\": \"$generatedEnglishTitle\",\n")
                append("  \"hebrew_sefer\": \"$hebrewMesechet\",\n")
                append("  \"shiur_num\": $dafNum,\n")
                append("  \"speaker\": \"$speaker\"")
                if (this@AudioMetadata.length.isNotBlank()) append(",\n  \"length\": \"${this@AudioMetadata.length}\"")
                append(",\n  \"audio_extension\": \"$audioExtension\"")
                if (attachmentLink.isNotBlank()) append(",\n  \"link\": \"$attachmentLink\"")
                append("\n}")
            }
        } else if (shiurType == "Ein Yaakov") {
            // Ein Yaakov metadata schema
            buildString {
                append("{\n")
                append("  \"id\": \"${fileNameWithoutExt}_$timestamp\",\n")
                append("  \"hebrew_title\": \"$hebrewTitle\",\n")
                append("  \"english_title\": \"$englishTitle\",\n")
                append("  \"category\": \"ein_yaakov\",\n")
                append("  \"speaker\": \"$speaker\"")
                if (subCategory.isNotBlank()) append(",\n  \"sub_category\": \"$subCategory\"")
                if (hebrewSefer.isNotBlank()) append(",\n  \"hebrew_sefer\": \"$hebrewSefer\"")
                if (englishSefer.isNotBlank()) append(",\n  \"english_sefer\": \"$englishSefer\"")
                if (globalId.isNotBlank()) {
                    val gid = globalId.toIntOrNull()
                    if (gid != null) append(",\n  \"global_id\": $gid")
                }
                if (sourceSheetLink.isNotBlank()) append(",\n  \"source_sheet_link\": \"$sourceSheetLink\"")
                if (this@AudioMetadata.length.isNotBlank()) append(",\n  \"length\": \"${this@AudioMetadata.length}\"")
                append(",\n  \"audio_extension\": \"$audioExtension\"")
                if (attachmentLink.isNotBlank()) append(",\n  \"link\": \"$attachmentLink\"")
                append("\n}")
            }
        } else {
            // Other shiurim metadata schema
            val s3Key = getS3FolderPath() + fileNameWithoutExt
            buildString {
                append("{\n")
                append("  \"id\": \"$s3Key\",\n")
                append("  \"hebrew_title\": \"$hebrewTitle\",\n")
                append("  \"english_title\": \"$englishTitle\",\n")
                append("  \"speaker\": \"$speaker\"")
                if (hebrewSefer.isNotBlank()) append(",\n  \"hebrew_sefer\": \"$hebrewSefer\"")
                if (this@AudioMetadata.length.isNotBlank()) append(",\n  \"length\": \"${this@AudioMetadata.length}\"")
                append(",\n  \"audio_extension\": \"$audioExtension\"")
                if (attachmentLink.isNotBlank()) append(",\n  \"link\": \"$attachmentLink\"")
                append("\n}")
            }
        }
    }
}
