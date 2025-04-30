
const S3_BUCKET = "midrash-aggadah";
const S3_REGION = "eu-north-1";
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/`;

export const getAudioUrl = (audioPath: string): string => {
  if (audioPath.startsWith('http')) {
    return audioPath;
  }
  return `${S3_BASE_URL}${audioPath}`;
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
  return `${S3_BASE_URL}${docPath.replace('.docx', '.pdf')}`;
};
