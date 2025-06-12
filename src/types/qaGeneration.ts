// src/types/qaGeneration.ts

export interface QAData {
  id: string;
  question: string;
  answer: string;
  tagType: 'ingredient' | 'toxicity' | 'regulation' | 'safety';
  tagText: string;
  difficulty: 'beginner' | 'expert';
  category: 'safety' | 'usage' | 'ingredient' | 'regulation';
  createdAt: string;
  updatedAt: string;
  isValidated: boolean;
}

export interface ChemicalDataForQA {
  id: string;
  name: string;
  casNumber: string;
  productName: string;
  mainIngredient: string;
  molecularFormula: string;
  molecularWeight: string;
  physicalState: string;
  contentPercentage: string;
  ghsCodes: string[];
  hazardClass: string;
  ld50Value: string;
  usageCategory: string;
  usage: string;
  manufacturer: string;
  status: 'pending' | 'in_progress' | 'completed';
  qaCount: number;
  hasQA: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QAGenerationConfig {
  targetLevel: 'beginner' | 'intermediate' | 'expert';
  questionType: 'info_request' | 'safety_inquiry' | 'usage_inquiry' | 'ingredient_inquiry';
  filters: {
    country?: string;
    infoType?: string;
    classification?: string;
    difficulty?: string;
  };
}

// 새로운 QA 생성 시스템을 위한 타입들
export interface ChemicalData {
  id: string;
  name: string;
  product_name: string;
  casNumber: string;
  molecularFormula: string;
  molecularWeight: string;
  physicalState: string;
  content_percentage: string;
  ghs_codes: string[];
  hazardClass: string;
  ld50_value: string;
  usage: string;
  manufacturer: string;
  status: 'pending' | 'processing' | 'completed';
  qa_status: {
    safety: boolean;
    usage: boolean;
    component: boolean;
    regulation: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface GeneratedQA {
  id: string;
  chemicalId: string;
  chemicalName: string;
  casNumber: string;
  type: 'safety' | 'usage' | 'component' | 'regulation';
  difficulty: 'general' | 'professional' | 'expert';
  question: string;
  answer: string;
  tags: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface QAGenerationRequest {
  chemicalId: string;
  type: 'safety' | 'usage' | 'component' | 'regulation';
  difficulty: 'general' | 'professional' | 'expert';
  customPrompt?: string;
  includeReferences?: boolean;
}

export interface QAGenerationResponse {
  success: boolean;
  data?: GeneratedQA;
  error?: string;
}
