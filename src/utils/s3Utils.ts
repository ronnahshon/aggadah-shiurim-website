const S3_BUCKET = "midrash-aggadah";
const S3_REGION = "eu-north-1";
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/`;

export const getAudioUrl = (audioPath: string): string => {
  if (audioPath.startsWith('http')) {
    return audioPath;
  }
  return `${S3_BASE_URL}audio/${audioPath}`;
};

export const getGoogleDriveDownloadUrl = (driveUrl: string): string => {
  if (!driveUrl || !driveUrl.includes('drive.google.com')) {
    return driveUrl;
  }
  
  // Extract file ID from Google Drive URL
  // URL format: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
  const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  
  if (!fileIdMatch) {
    return driveUrl;
  }
  
  const fileId = fileIdMatch[1];
  
  // Convert to download URL format
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

export const getDocumentUrl = (docPath: string): string => {
  if (docPath.startsWith('http')) {
    return docPath;
  }
  return `${S3_BASE_URL}${docPath}`;
};

export const getPdfUrl = (docPath: string): string => {
  if (docPath.startsWith('http')) {
    // Convert Google Doc links to PDF export links if needed
    if (docPath.includes('docs.google.com')) {
      return docPath.replace('/edit?usp=drive_link', '/export?format=pdf');
    }
    return docPath;
  }
  return `${S3_BASE_URL}source_sheets/${docPath.replace('.docx', '.pdf')}`;
};
