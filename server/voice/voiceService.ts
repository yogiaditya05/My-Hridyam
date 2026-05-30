import * as fs from "fs";
import * as path from "path";
import { ENV } from "../utils/env";

export type TranscribeOptions = {
  audioUrl: string; // File URL (S3 URL or local path like /uploads/audio_xxx.webm)
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
    if (!ENV.forgeApiUrl) {
      return {
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL / OPENAI_API_KEY is not set"
      };
    }

    let audioBuffer: Buffer;
    let mimeType = "audio/webm";

    // 1. Resolve Audio Content (Optimized local read vs remote fetch)
    const localMatch = options.audioUrl.match(/\/uploads\/([^?#]+)/);
    if (localMatch && localMatch[1]) {
      const filename = localMatch[1];
      const filePath = path.join(path.resolve("./public/uploads"), filename);
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

    // Check size limit (16MB)
    const sizeMB = audioBuffer.length / (1024 * 1024);
    if (sizeMB > 16) {
      return {
        error: "Audio file exceeds maximum size limit",
        code: "FILE_TOO_LARGE",
        details: `File size is ${sizeMB.toFixed(2)}MB, limit is 16MB`
      };
    }

    // 2. Prepare FormData
    const formData = new FormData();
    const filename = `audio.${getFileExtension(mimeType)}`;
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("file", audioBlob, filename);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");

    if (options.prompt) {
      formData.append("prompt", options.prompt);
    } else if (options.language) {
      formData.append("prompt", `Transcribe the user's speech. The spoken language is ${options.language}.`);
    }

    // 3. Request Whisper Endpoint
    // Use real OpenAI API key and URL if available, otherwise fall back to Forge URL
    const hasOpenAI = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-or-");
    const apiKey = hasOpenAI ? process.env.OPENAI_API_KEY : ENV.forgeApiKey;
    const rawBaseUrl = hasOpenAI ? "https://api.openai.com" : ENV.forgeApiUrl;

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
