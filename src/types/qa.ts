// src/types/qa.ts - Updated for improved system
export interface QAGenerationSettings {
  questionCount: number;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answerLength: 'short' | 'medium' | 'long';
  temperature: number;
  maxTokens?: number;
  includeSourceData: boolean;
  language: 'ko' | 'en';
}

export interface QAGenerationRequest {
  chemicals: any[];
  questionTypes: ('simple' | 'detailed' | 'comparison')[];
  targetAudience: 'general' | 'expert';
  language: 'ko' | 'en';
  count: number;
  settings?: QAGenerationSettings;
  selectedData?: any[]; // For backward compatibility
}

export interface GeneratedQA {
  id: string;
  question: string;
  answer: string;
  category: string;
  sourceData?: any;
  metadata?: {
    generatedAt: string;
    model?: string;
    temperature?: number;
    dataSource?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface QAValidationResult {
  qaId: string;
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  score: number;
}