# Recording Service Implementation

## Overview
Implemented a foreground service to ensure audio recording continues when the user navigates away from the app or the screen turns off.

## What Was Changed

### 1. New RecordingService
Created `RecordingService.kt` that:
- Runs as a foreground service with a persistent notification
- Shows recording duration in real-time
- Includes a "Stop" button in the notification
- Uses the existing `AudioRecorder` class
- Broadcasts recording completion back to MainActivity
- Keeps CPU awake during recording with wake lock (via AudioRecorder)

### 2. Updated AndroidManifest.xml
- Added `RecordingService` declaration with `foregroundServiceType="microphone"`
- Added `FOREGROUND_SERVICE_MICROPHONE` permission (required for Android 14+)

### 3. Updated MainActivity.kt
- Removed direct `AudioRecorder` usage from activity
- Recording now starts/stops via service intents
- Added broadcast receiver to handle recording completion
- Recording state persists across app navigation

## How It Works

### Starting Recording
1. User taps "Record" button
2. MainActivity sends `ACTION_START_RECORDING` intent to RecordingService
3. Service starts as foreground service with notification
4. AudioRecorder begins recording with wake lock
5. Notification updates every second with duration

### Stopping Recording
1. User taps "Stop" button (in app or notification)
2. Service stops recording and saves file
3. Service broadcasts file path back to MainActivity
4. MainActivity updates UI with recorded file
5. Service stops itself

### Background Behavior
- Recording continues when user switches apps
- Recording continues when screen turns off
- Notification remains visible showing recording status
- User can stop recording from notification

## Benefits
- Reliable background recording
- Clear user feedback via notification
- Complies with Android foreground service requirements
- Battery-efficient with wake lock management
- Works on all Android versions (handles API differences)

## Testing
To test background recording:
1. Start recording in the app
2. Press home button or switch to another app
3. Verify notification shows recording duration
4. Return to app - recording should still be active
5. Stop recording from either app or notification
6. Verify file is saved and appears in the UI
