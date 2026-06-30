import axios from 'axios';
import { config } from '../config.js';

// Transcribe audio using Whisper (OpenAI) or Groq
export async function transcribeAudio(mediaId: string): Promise<string> {
  try {
    // Get media URL from Meta (simplified - in production, need access token)
    const mediaUrl = await getMediaUrl(mediaId);

    // Download audio
    const audioBuffer = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
    });

    // Transcribe with Whisper
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([audioBuffer.data], { type: 'audio/ogg' }),
      'audio.ogg'
    );
    formData.append('model', 'whisper-1');

    const transcription = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
        },
      }
    );

    return transcription.data.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

async function getMediaUrl(mediaId: string): Promise<string> {
  // This would need Meta API authentication
  // For now, return a placeholder
  return `https://graph.instagram.com/v18.0/${mediaId}`;
}
