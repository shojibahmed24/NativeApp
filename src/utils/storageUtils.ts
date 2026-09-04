import { api } from '../services/api';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const uploadMediaToSupabase = async (
  uri: string, 
  type: 'image' | 'audio' | 'document', 
  originalFileName?: string
): Promise<string | null> => {
  try {
    const fileExt = originalFileName ? originalFileName.split('.').pop() : type === 'image' ? 'jpg' : type === 'audio' ? 'm4a' : 'bin';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // For Web, fetch as blob and use uploadFile (FormData doesn't need FileSystem)
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
      const res = await api.uploadFile(file as any, type === 'image' ? 'profile' : 'chat');
      return res.success ? (res.file?.url || res.url) : null;
    }

    // For Native, use FileSystem to read as base64 to avoid fetch blob network issues
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const mimeType = type === 'image' ? 'image/jpeg' : type === 'audio' ? 'audio/m4a' : 'application/octet-stream';
    
    const res = await api.uploadBase64(base64, fileName, mimeType, type === 'image' ? 'profile' : 'chat');
    return res.success ? (res.file?.url || res.url) : null;
  } catch (err) {
    console.error('Error uploading media:', err);
    return null;
  }
};
