// src/types/dataProcessing.ts

export interface ChemicalData {
  id: string;
  name: string; // 통합된 화학물질명
  product_name?: string;
  main_ingredient?: string;
  casNumber?: string;
  cas_no?: string; // 호환성을 위해 유지
  molecularFormula?: string;
  molecularWeight?: string;
  physicalState?: string;
  content_percentage?: string;
  ghs_codes?: string[];
  hazardClass?: string;
  ld50_value?: string;
  usage?: string;
  usage_category?: string;
  manufacturer?: string;
  status: 'refined' | 'processing' | 'completed';
  caption_status?: {
    main_component: boolean;
    toxicity: boolean;
    warning: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface GeneratedCaption {
  [key: string]: string | undefined; // 인덱스 시그니처 추가
  'main-component'?: string;
  'toxicity'?: string;
  'warning'?: string;
  main_component?: string; // snake_case 호환성을 위해 유지 (kebab-case와 다른 키)
  // toxicity, warning은 이미 kebab-case로 정의되어 있으므로 중복 제거
}

export interface CaptionEvaluation {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface AIGenerationRequest {
  chemical: ChemicalData;
  generationType: 'academic' | 'general' | 'safety' | 'regulatory';
  language?: 'ko' | 'en';
  customPrompt?: string;
}

export interface AIGenerationResponse {
  success: boolean;
  result?: string;
  error?: string;
  details?: string;
  source?: string;
}
