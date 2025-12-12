import { Type } from "@google/genai";

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface AnalysisResult {
  summary: string;
  action_required: string[];
  risk_level: RiskLevel;
  simple_explanation: string;
}

// Schema for Gemini JSON output
export const AnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A one-sentence bottom line summary of the document."
    },
    action_required: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of specific actions the user needs to take (e.g., 'Pay $50', 'Sign the back')."
    },
    risk_level: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "The risk level of the document (High for scams, urgent legal threats)."
    },
    simple_explanation: {
      type: Type.STRING,
      description: "A conversational, comforting, and simple explanation of the document content, suitable for a 75-year-old."
    }
  },
  required: ["summary", "action_required", "risk_level", "simple_explanation"]
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
