// src/types/qaGeneration.ts

export interface QAData {
  id: string;
  question: string;
  answer: string;
  tagType: 'ingredient' | 'toxicity' | 'regulation' | 'safety';
  tagText: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
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
