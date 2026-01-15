package com.bienenfe.carmeizionshiurimupload.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog

@Composable
fun CredentialDialog(
    onDismiss: () -> Unit,
    onCredentialsEntered: (accessKey: String, secretKey: String) -> Unit,
    isValidating: Boolean = false,
    validationError: String? = null
) {
    var credentials by remember { mutableStateOf("") }
    
    Dialog(onDismissRequest = { /* Prevent dismissal */ }) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "⚙️ ONE-TIME SETUP",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Text(
                    text = "🔐 AWS Credentials Required",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                
                Text(
                    text = "To use this uploader, you need AWS credentials. You can:",
                    style = MaterialTheme.typography.bodyMedium
                )
                
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "(a) Contact Ron or Zach to get the password",
                            style = MaterialTheme.typography.bodySmall
                        )
                        
                        Text(
                            text = "(b) Log into AWS Console:",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Text(
                            text = "1. Go to AWS Secrets Manager",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(start = 16.dp)
                        )
                        
                        Text(
                            text = "2. Find 'CarmeiZionUploader' secret",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(start = 16.dp)
                        )
                        
                        Text(
                            text = "3. Click 'Retrieve secret value'",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(start = 16.dp)
                        )
                        
                        Text(
                            text = "4. Copy the credentials",
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(start = 16.dp)
                        )
                    }
                }
                
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Format:",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "<AccessKeyID>+<SecretKey>",
                            style = MaterialTheme.typography.bodySmall,
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                        )
                        Text(
                            text = "Example:",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                        Text(
                            text = "MY_AWS_KEY+MY_AWS_SECRET",
                            style = MaterialTheme.typography.bodySmall,
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                        )
                    }
                }
                
                OutlinedTextField(
                    value = credentials,
                    onValueChange = { credentials = it },
                    label = { Text("Paste Credentials") },
                    placeholder = { Text("<AccessKeyID>+<SecretKey>") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isValidating,
                    singleLine = false,
                    maxLines = 3,
                    visualTransformation = PasswordVisualTransformation()
                )
                
                if (validationError != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            text = "❌ $validationError",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
                
                if (isValidating) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(40.dp)
                    )
                    Text(
                        text = "Testing credentials...",
                        style = MaterialTheme.typography.bodyMedium
                    )
                } else {
                    Button(
                        onClick = {
                            val trimmed = credentials.trim()
                            if (trimmed.isNotBlank()) {
                                val parts = trimmed.split("+")
                                if (parts.size == 2) {
                                    val accessKey = parts[0].trim()
                                    val secretKey = parts[1].trim()
                                    if (accessKey.isNotBlank() && secretKey.isNotBlank()) {
                                        onCredentialsEntered(accessKey, secretKey)
                                    }
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = credentials.isNotBlank() && credentials.contains("+")
                    ) {
                        Text("Validate & Save Credentials")
                    }
                }
            }
        }
    }
}
