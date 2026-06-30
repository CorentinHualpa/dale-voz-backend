import axios from 'axios';
import { config } from '../config.js';

export async function textToSpeech(
  text: string,
  language: string = 'es'
): Promise<string> {
  try {
    // Use ElevenLabs or Grok Voice
    // For MVP, use simple placeholder
    // In production: integrate ElevenLabs API

    const voiceId = getVoiceId(language);

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // Upload to CDN / storage and return URL
    const audioUrl = await uploadAudio(response.data, language);
    return audioUrl;
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw error;
  }
}

function getVoiceId(language: string): string {
  const voices: Record<string, string> = {
    es: '9BWtsMINqrJLrRacOk9x', // Spanish voice
    en: 'EXAVITQu4vr4xnSDxMaL', // English voice
    fr: 'VR6AewLTigWG4xSOuO5B', // French voice
  };

  return voices[language] || voices['es'];
}

async function uploadAudio(audioBuffer: ArrayBuffer, language: string): Promise<string> {
  // Upload to storage (AWS S3, Cloudinary, etc.)
  // For MVP, return placeholder URL
  return `https://cdn.example.com/audio/${Date.now()}.mp3`;
}
