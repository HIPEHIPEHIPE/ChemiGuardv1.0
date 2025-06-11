// src/types/processing.ts
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

export interface StandardizationRule {
  id: string;
  field: string;
  type: 'merge' | 'format' | 'normalize';
  description: string;
  from: string | string[];
  to: string;
  enabled: boolean;
}

export interface AnonymizationRule {
  id: string;
  field: string;
  type: 'mask' | 'remove' | 'aggregate' | 'pseudonymize';
  description: string;
  pattern?: string;
  replacement?: string;
  enabled: boolean;
}