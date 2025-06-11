// src/utils/dataValidation.ts
import { RefinementIssue } from '../api/dataRefinement';

export interface ValidationRule {
  field: string;
  rule: string;
  severity: 'error' | 'warning' | 'suggestion';
  description: string;
  autoFixable: boolean;
}

// 화학 성분 데이터 검증 규칙들
export const VALIDATION_RULES: ValidationRule[] = [
  // === 오류 (Error) - 반드시 수정해야 하는 문제들 ===
  {
    field: 'cas_number',
    rule: 'cas_format',
    severity: 'error',
    description: 'CAS 번호 형식이 올바르지 않습니다 (예: 123-45-6)',
    autoFixable: true
  },
  {
    field: 'content_percentage',
    rule: 'percentage_over_100',
    severity: 'error',
    description: '성분 함량의 합이 100%를 초과합니다',
    autoFixable: false
  },
  {
    field: 'main_ingredient',
    rule: 'ingredient_name_empty',
    severity: 'error',
    description: '성분명이 비어있습니다',
    autoFixable: false
  },
  {
    field: 'content_percentage',
    rule: 'negative_percentage',
    severity: 'error',
    description: '함량이 음수이거나 0%입니다',
    autoFixable: false
  },

  // === 경고 (Warning) - 수정 권장하는 문제들 ===
  {
    field: 'cas_number',
    rule: 'cas_not_found',
    severity: 'warning',
    description: 'CAS 번호가 화학물질 데이터베이스에서 찾을 수 없습니다',
    autoFixable: false
  },
  {
    field: 'content_percentage',
    rule: 'unusual_high_percentage',
    severity: 'warning',
    description: '단일 성분 함량이 비정상적으로 높습니다 (80% 이상)',
    autoFixable: false
  },
  {
    field: 'main_ingredient',
    rule: 'ingredient_name_mismatch',
    severity: 'warning',
    description: 'CAS 번호와 성분명이 일치하지 않을 가능성이 있습니다',
    autoFixable: true
  },
  {
    field: 'content_percentage',
    rule: 'sum_not_100',
    severity: 'warning',
    description: '전체 성분 함량의 합이 100%가 아닙니다',
    autoFixable: false
  },

  // === 제안 (Suggestion) - 개선할 수 있는 부분들 ===
  {
    field: 'cas_number',
    rule: 'cas_missing',
    severity: 'suggestion',
    description: 'CAS 번호가 누락되어 있습니다. 추가하시겠습니까?',
    autoFixable: true
  },
  {
    field: 'main_ingredient',
    rule: 'ingredient_name_standardization',
    severity: 'suggestion',
    description: '성분명을 표준 명칭으로 변경하는 것을 권장합니다',
    autoFixable: true
  },
  {
    field: 'content_percentage',
    rule: 'percentage_range_narrow',
    severity: 'suggestion',
    description: '함량 범위를 더 구체적으로 명시할 수 있습니다',
    autoFixable: false
  },
  {
    field: 'hazard_info',
    rule: 'hazard_missing',
    severity: 'suggestion',
    description: '유해성 정보가 누락되어 있습니다',
    autoFixable: true
  }
];

// CAS 번호 형식 검증 (XXX-XX-X 형식)
export const validateCASNumber = (casNumber: string): boolean => {
  if (!casNumber) return false;
  const casRegex = /^\d{2,7}-\d{2}-\d$/;
  return casRegex.test(casNumber);
};

// CAS 번호 체크섬 검증 (실제 CAS 번호의 유효성 검사)
export const validateCASChecksum = (casNumber: string): boolean => {
  if (!validateCASNumber(casNumber)) return false;
  
  const digits = casNumber.replace(/-/g, '');
  const checkDigit = parseInt(digits.slice(-1));
  const mainDigits = digits.slice(0, -1);
  
  let sum = 0;
  for (let i = 0; i < mainDigits.length; i++) {
    sum += parseInt(mainDigits[i]) * (mainDigits.length - i);
  }
  
  return (sum % 10) === checkDigit;
};

// 함량 범위 파싱 (예: "10-15%", "< 5%", "15%" 등)
export const parsePercentageRange = (percentage: string): { min: number; max: number } | null => {
  if (!percentage) return null;
  
  // "10-15%" 형식
  const rangeMatch = percentage.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)%?/);
  if (rangeMatch) {
    return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
  }
  
  // "< 5%" 형식
  const lessThanMatch = percentage.match(/<\s*(\d+(?:\.\d+)?)%?/);
  if (lessThanMatch) {
    return { min: 0, max: parseFloat(lessThanMatch[1]) };
  }
  
  // "> 90%" 형식
  const greaterThanMatch = percentage.match(/>\s*(\d+(?:\.\d+)?)%?/);
  if (greaterThanMatch) {
    return { min: parseFloat(greaterThanMatch[1]), max: 100 };
  }
  
  // "15%" 형식 (단일 값)
  const singleMatch = percentage.match(/(\d+(?:\.\d+)?)%?/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    return { min: value, max: value };
  }
  
  return null;
};

// 성분명 표준화 (일반적인 오타나 다른 표기법 수정)
export const standardizeIngredientName = (name: string): string => {
  const standardizations: { [key: string]: string } = {
    // 일반적인 오타들
    '소디움라우릴황산염': '소듐라우릴황산염',
    '소디움라우레스황산염': '소듐라우레스황산염',
    '에틸렌디아민테트라아세트산': 'EDTA',
    'EDTA-2Na': 'EDTA 이나트륨',
    '계면활성제': '음이온계면활성제', // 더 구체적으로
    '방부제': '파라벤류', // 더 구체적으로
    
    // 영어-한국어 표준화
    'Sodium Lauryl Sulfate': '소듐라우릴황산염',
    'Sodium Laureth Sulfate': '소듐라우레스황산염',
    'Cocamidopropyl Betaine': '코카미도프로필베타인',
    'Ethanol': '에탄올',
    'Water': '정제수',
    
    // 약어 확장
    'SLS': '소듐라우릴황산염',
    'SLES': '소듐라우레스황산염',
    'CAPB': '코카미도프로필베타인'
  };
  
  return standardizations[name] || name;
};

// 알려진 CAS-성분명 매핑 (샘플)
export const KNOWN_CAS_INGREDIENTS: { [key: string]: string } = {
  '151-21-3': '소듐라우릴황산염',
  '68585-34-2': '소듐라우레스황산염',
  '61789-40-0': '코카미도프로필베타인',
  '64-17-5': '에탄올',
  '7732-18-5': '정제수',
  '56-81-5': '글리세린',
  '6381-92-6': 'EDTA 이나트륨'
};

// 위험한 화학물질 목록 (고농도 시 경고)
export const HAZARDOUS_INGREDIENTS: { [key: string]: { maxSafePercentage: number; warning: string } } = {
  '151-21-3': { // 소듐라우릴황산염
    maxSafePercentage: 30,
    warning: '소듐라우릴황산염은 30% 이상 시 피부 자극을 유발할 수 있습니다'
  },
  '64-17-5': { // 에탄올
    maxSafePercentage: 70,
    warning: '에탄올 70% 이상은 인화성이 매우 높습니다'
  },
  '67-56-1': { // 메탄올
    maxSafePercentage: 5,
    warning: '메탄올은 독성이 강하므로 5% 이상 사용 시 주의가 필요합니다'
  }
};

// 주 검증 함수
export const validateIngredientData = (
  productName: string,
  ingredients: Array<{
    ingredient_id: string;
    main_ingredient: string;
    cas_number?: string;
    content_percentage?: string;
  }>
): RefinementIssue[] => {
  const issues: RefinementIssue[] = [];
  let totalPercentage = 0;
  
  ingredients.forEach((ingredient, index) => {
    const { ingredient_id, main_ingredient, cas_number, content_percentage } = ingredient;
    
    // 1. 성분명 검증
    if (!main_ingredient || main_ingredient.trim() === '') {
      issues.push({
        id: `${ingredient_id}_name_empty`,
        type: 'error',
        title: '성분명 누락',
        description: '성분명이 입력되지 않았습니다',
        field: 'main_ingredient',
        original_value: main_ingredient || '',
        suggested_value: undefined,
        auto_fixable: false,
        ingredientId: ingredient_id
      });
    }
    
    // 2. CAS 번호 검증
    if (cas_number) {
      if (!validateCASNumber(cas_number)) {
        issues.push({
          id: `${ingredient_id}_cas_format`,
          type: 'error',
          title: 'CAS 번호 형식 오류',
          description: 'CAS 번호 형식이 올바르지 않습니다 (XXX-XX-X 형식이어야 함)',
          field: 'cas_number',
          original_value: cas_number,
          suggested_value: formatCASNumber(cas_number) || undefined,
          auto_fixable: true,
          ingredientId: ingredient_id
        });
      } else if (!validateCASChecksum(cas_number)) {
        issues.push({
          id: `${ingredient_id}_cas_invalid`,
          type: 'warning',
          title: 'CAS 번호 유효성 의심',
          description: 'CAS 번호의 체크섬이 올바르지 않습니다',
          field: 'cas_number',
          original_value: cas_number,
          suggested_value: undefined,
          auto_fixable: false,
          ingredientId: ingredient_id
        });
      }
      
      // CAS-성분명 일치성 검사
      if (KNOWN_CAS_INGREDIENTS[cas_number]) {
        const expectedName = KNOWN_CAS_INGREDIENTS[cas_number];
        if (!main_ingredient.includes(expectedName) && !expectedName.includes(main_ingredient)) {
          issues.push({
            id: `${ingredient_id}_name_mismatch`,
            type: 'warning',
            title: 'CAS 번호와 성분명 불일치',
            description: `CAS 번호 ${cas_number}는 보통 "${expectedName}"를 의미합니다`,
            field: 'main_ingredient',
            original_value: main_ingredient,
            suggested_value: expectedName,
            auto_fixable: true,
            ingredientId: ingredient_id
          });
        }
      }
    } else {
      // CAS 번호 누락
      issues.push({
        id: `${ingredient_id}_cas_missing`,
        type: 'suggestion',
        title: 'CAS 번호 누락',
        description: 'CAS 번호를 추가하면 성분 식별이 더 정확해집니다',
        field: 'cas_number',
        original_value: '',
        suggested_value: findCASByName(main_ingredient) || undefined,
        auto_fixable: !!findCASByName(main_ingredient),
        ingredientId: ingredient_id
      });
    }
    
    // 3. 함량 검증
    if (content_percentage) {
      const range = parsePercentageRange(content_percentage);
      if (range) {
        if (range.min < 0) {
          issues.push({
            id: `${ingredient_id}_negative_percentage`,
            type: 'error',
            title: '음수 함량',
            description: '함량이 음수일 수 없습니다',
            field: 'content_percentage',
            original_value: content_percentage,
            suggested_value: `${Math.abs(range.min)}-${range.max}%`,
            auto_fixable: true,
            ingredientId: ingredient_id
          });
        }
        
        totalPercentage += range.max;
        
        // 위험 물질 고농도 경고
        if (cas_number && HAZARDOUS_INGREDIENTS[cas_number]) {
          const hazardInfo = HAZARDOUS_INGREDIENTS[cas_number];
          if (range.max > hazardInfo.maxSafePercentage) {
            issues.push({
              id: `${ingredient_id}_high_hazard`,
              type: 'warning',
              title: '위험 물질 고농도',
              description: hazardInfo.warning,
              field: 'content_percentage',
              original_value: content_percentage,
              suggested_value: undefined,
              auto_fixable: false,
              ingredientId: ingredient_id
            });
          }
        }
      }
    }
    
    // 4. 성분명 표준화 제안
    const standardizedName = standardizeIngredientName(main_ingredient);
    if (standardizedName !== main_ingredient) {
      issues.push({
        id: `${ingredient_id}_name_standardize`,
        type: 'suggestion',
        title: '성분명 표준화',
        description: '더 표준적인 성분명으로 변경을 권장합니다',
        field: 'main_ingredient',
        original_value: main_ingredient,
        suggested_value: standardizedName,
        auto_fixable: true,
        ingredientId: ingredient_id
      });
    }
  });
  
  // 5. 전체 함량 검증
  if (totalPercentage > 100) {
    issues.push({
      id: `${productName}_total_over_100`,
      type: 'error',
      title: '총 함량 초과',
      description: `전체 성분의 함량이 ${totalPercentage.toFixed(1)}%로 100%를 초과합니다`,
      field: 'content_percentage',
      original_value: `${totalPercentage.toFixed(1)}%`,
      suggested_value: undefined,
      auto_fixable: false,
      ingredientId: 'all'
    });
  } else if (totalPercentage < 95 && totalPercentage > 0) {
    issues.push({
      id: `${productName}_total_under_95`,
      type: 'warning',
      title: '총 함량 부족',
      description: `전체 성분의 함량이 ${totalPercentage.toFixed(1)}%로 너무 낮습니다`,
      field: 'content_percentage',
      original_value: `${totalPercentage.toFixed(1)}%`,
      suggested_value: undefined,
      auto_fixable: false,
      ingredientId: 'all'
    });
  }
  
  return issues;
};

// 유틸리티 함수들
const formatCASNumber = (casNumber: string): string | null => {
  const digits = casNumber.replace(/[^0-9]/g, '');
  if (digits.length >= 5) {
    return `${digits.slice(0, -3)}-${digits.slice(-3, -1)}-${digits.slice(-1)}`;
  }
  return null;
};

const findCASByName = (ingredientName: string): string | null => {
  for (const [cas, name] of Object.entries(KNOWN_CAS_INGREDIENTS)) {
    if (name.includes(ingredientName) || ingredientName.includes(name)) {
      return cas;
    }
  }
  return null;
};
