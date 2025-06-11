// src/types/processingTypes.ts
export enum ProcessingStep {
  REFINING = 'refining',
  STANDARDIZING = 'standardizing', 
  ANONYMIZING = 'anonymizing',
  COMPLETED = 'completed'
}

export interface ProcessingStepInfo {
  id: ProcessingStep;
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'active' | 'pending' | 'locked';
}

export interface ProcessingStats {
  total: number;
  refining: number;
  standardizing: number;  
  anonymizing: number;
  completed: number;
}

export interface StandardizationRule {
  id: string;
  field: 'main_ingredient' | 'cas_number' | 'content_percentage' | 'chemical_formula';
  type: 'normalize' | 'synonym' | 'format' | 'unit_conversion';
  pattern: string;
  replacement: string;
  description: string;
  enabled: boolean;
}

export interface AnonymizationRule {
  id: string;
  field: 'product_name' | 'manufacturer' | 'brand';
  type: 'mask' | 'hash' | 'remove' | 'generalize';
  maskPattern?: string;
  description: string;
  enabled: boolean;
}