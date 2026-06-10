import * as fs from "fs";
import * as path from "path";
import { ENV } from "../utils/env";

export type TranscribeOptions = {
  audioUrl?: string; // File URL (S3 URL or local path like /uploads/audio_xxx.webm)
  audioBase64?: string; // Direct Base64 audio content
  mimeType?: string; // Mimetype of the Base64 audio
  language?: string; // e.g. "en", "es", "hi"
  prompt?: string; // Optional context prompt for Whisper
};

export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

export type WhisperResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
};

export type TranscriptionResponse = {
  text: string;
  language?: string;
  duration?: number;
};

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "SERVICE_ERROR";
  details?: string;
};

const getFileExtension = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
  };
  return mimeToExt[mimeType] || "webm";
};

/**
 * Transcribes audio using OpenAI's Whisper API via OpenRouter / Forge endpoint.
 * Optimizes local uploads by reading them directly from disk.
 */
export async function transcribeAudio(
  options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  try {
    let audioBuffer: Buffer;
    let mimeType = options.mimeType || "audio/webm";

    if (options.audioBase64) {
      audioBuffer = Buffer.from(options.audioBase64, "base64");
    } else if (options.audioUrl) {
      // 1. Resolve Audio Content (Optimized local read vs remote fetch)
      const localMatch = options.audioUrl.match(/\/uploads\/([^?#]+)/);
      if (localMatch && localMatch[1]) {
        const filename = localMatch[1];
        const isVercel = !!process.env.VERCEL;
        const uploadsDir = isVercel ? "/tmp/uploads" : path.resolve("./public/uploads");
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          audioBuffer = fs.readFileSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          if (ext === ".webm") mimeType = "audio/webm";
          else if (ext === ".mp3" || ext === ".mpeg") mimeType = "audio/mpeg";
          else if (ext === ".wav") mimeType = "audio/wav";
        } else {
          return {
            error: "Local audio file not found on disk",
            code: "INVALID_FORMAT",
            details: `Path checked: ${filePath}`
          };
        }
      } else {
        // Remote download fallback
        const fetchUrl = options.audioUrl.startsWith("http")
          ? options.audioUrl
          : `${ENV.oAuthServerUrl.replace(/\/$/, "")}${options.audioUrl}`;

        const response = await fetch(fetchUrl);
        if (!response.ok) {
          return {
            error: "Failed to download remote audio file",
            code: "INVALID_FORMAT",
            details: `HTTP ${response.status}: ${response.statusText}`
          };
        }
        audioBuffer = Buffer.from(await response.arrayBuffer());
        mimeType = response.headers.get("content-type") || "audio/webm";
      }
    } else {
      return {
        error: "No audio URL or Base64 data provided",
        code: "INVALID_FORMAT",
      };
    }

    // Check size limit (16MB)
    const sizeMB = audioBuffer.length / (1024 * 1024);
    if (sizeMB > 16) {
      return {
        error: "Audio file exceeds maximum size limit",
        code: "FILE_TOO_LARGE",
        details: `File size is ${sizeMB.toFixed(2)}MB, limit is 16MB`
      };
    }

    // Use Gemini if API key is provided
    if (ENV.geminiApiKey) {
      const base64Audio = audioBuffer.toString("base64");
      const promptText = options.prompt || (options.language
        ? `Transcribe the user's speech. The spoken language is ${options.language}. Return only the transcription text, nothing else.`
        : "Please provide a highly accurate transcription of the audio content. Return only the transcription text. Do not include any prefix, introduction, explanations, or commentary. If you hear no speech, output nothing.");

      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Audio
                }
              },
              {
                text: promptText
              }
            ]
          }
        ]
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${ENV.geminiApiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return {
          error: "Gemini transcription API request failed",
          code: "TRANSCRIPTION_FAILED",
          details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
        };
      }

      const data = await response.json() as any;
      const transcriptionText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof transcriptionText !== "string") {
        return {
          error: "Invalid Gemini transcription response",
          code: "SERVICE_ERROR",
          details: "Response did not contain transcription text"
        };
      }

      return {
        text: transcriptionText.trim(),
        language: "unknown"
      };
    }

    // Fallback logic starts here (Whisper)
    if (!ENV.forgeApiUrl) {
      return {
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL / OPENAI_API_KEY is not set"
      };
    }

    // 2. Prepare FormData
    const isGroq = process.env.OPENAI_API_KEY?.startsWith("gsk_");
    const modelName = isGroq ? "whisper-large-v3" : "whisper-1";
    
    const formData = new FormData();
    const filename = `audio.${getFileExtension(mimeType)}`;
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("file", audioBlob, filename);
    formData.append("model", modelName);
    formData.append("response_format", "verbose_json");

    if (options.prompt) {
      formData.append("prompt", options.prompt);
    } else if (options.language) {
      formData.append("prompt", `Transcribe the user's speech. The spoken language is ${options.language}.`);
    }

    // 3. Request Whisper Endpoint
    // Use real OpenAI/Groq API key and URL if available, otherwise fall back to Forge URL
    const hasOpenAI = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-or-");
    const apiKey = hasOpenAI ? process.env.OPENAI_API_KEY : ENV.forgeApiKey;
    const rawBaseUrl = hasOpenAI 
      ? (isGroq ? "https://api.groq.com/openai" : "https://api.openai.com") 
      : ENV.forgeApiUrl;
    
    if (!apiKey) {
      return {
        error: "Voice transcription API key is not configured",
        code: "SERVICE_ERROR",
        details: "Please set OPENAI_API_KEY in .env"
      };
    }

    const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;
    const fullUrl = new URL("v1/audio/transcriptions", baseUrl).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "Accept-Encoding": "identity",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Transcription API request failed",
        code: "TRANSCRIPTION_FAILED",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
      };
    }

    const whisperResponse = await response.json() as WhisperResponse;
    if (!whisperResponse.text) {
      return {
        error: "Invalid transcription response",
        code: "SERVICE_ERROR",
        details: "Whisper response did not contain text field"
      };
    }

    return {
      text: whisperResponse.text,
      language: whisperResponse.language,
      duration: whisperResponse.duration,
    };
  } catch (error) {
    return {
      error: "Audio transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
