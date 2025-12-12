export interface DiffFile {
  name: string;
  language: string;
  originalContent: string;
  modifiedContent: string; // If simplified, or just raw diff lines
  diffLines: string[];
}

export interface ReviewResult {
  summary: string;
  issues: Issue[];
  score: number;
  refactoredCode?: string;
}

export interface Issue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  description: string;
  suggestion: string;
}

export type AppState = 'IDLE' | 'ANALYZING' | 'REVIEW_READY';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  choices: {
    message: ChatMessage;
  }[];
}
