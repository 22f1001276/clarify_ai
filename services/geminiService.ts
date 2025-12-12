import { GoogleGenAI, Modality } from "@google/genai";
import { AnalysisResult, AnalysisSchema, ChatMessage } from "../types";
import { ANALYSIS_SYSTEM_INSTRUCTION, CHAT_SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Audio Helper Functions ---

const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Wraps raw PCM data in a WAV container.
 * Gemini 2.5 Flash TTS standard output: 24kHz, 16-bit, Mono.
 */
const createWavBlobUrl = (pcmData: Uint8Array): string => {
  const numChannels = 1;
  const sampleRate = 24000;
  const bitsPerSample = 16;
  
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // RIFF chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write audio data
  const bytes = new Uint8Array(buffer);
  bytes.set(pcmData, 44);
  
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

// --- API Functions ---

/**
 * Analyzes the uploaded document image using Gemini 3 Pro.
 */
export const analyzeDocument = async (
  base64Image: string,
  mimeType: string,
  language: string
): Promise<AnalysisResult> => {
  try {
    const prompt = `Analyze this image. It is a legal, medical, or financial document. 
    Explain it to a 75-year-old in ${language} using the simplest language possible. 
    Follow the JSON schema strictly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: AnalysisSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Generates speech audio from text using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Aoede" }, // A comforting, deeper voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    // The API returns raw PCM. We must wrap it in a WAV container for the browser to play it.
    const pcmData = base64ToUint8Array(base64Audio);
    return createWavBlobUrl(pcmData);
  } catch (error) {
    console.error("TTS failed:", error);
    throw error;
  }
};

/**
 * Handles follow-up chat questions about the document.
 */
export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  base64Image: string,
  mimeType: string
): Promise<string> => {
  try {
    // Construct the chat history manually for the stateless generateContent or use Chat session
    // For simplicity and to include the image context easily every time (or just once), 
    // we'll use a fresh generateContent call with history as context since we need to persist the image context strongly.
    
    // We will use gemini-3-pro for reasoning on the image
    const parts: any[] = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      { text: "Here is the document we are discussing." }
    ];

    // Append history
    history.forEach(msg => {
      parts.push({ text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}` });
    });

    // Append new question
    parts.push({ text: `User: ${newMessage}\nAssistant:` });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      },
    });

    return response.text || "I'm sorry, I couldn't understand that.";
  } catch (error) {
    console.error("Chat failed:", error);
    return "I'm having trouble connecting right now. Please try again.";
  }
};