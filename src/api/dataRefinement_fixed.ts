// src/api/dataRefinement_fixed.ts - 수정된 데이터 정제 API
import { supabase } from '../lib/supabaseClient';

// 제품과 성분 통합 데이터 타입
export interface ProductWithIngredients {
  product_id: string;
  product_name: string;
  product_name_anonymized?: string;
  product_category: string;
  status: 'collected' | 'refining' | 'refined' | 'approved';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  ingredients: ProductIngredient[];
}

export interface ProductIngredient {
  ingredient_id: string;
  main_ingredient: string;
  cas_number?: string;
  chemical_formula?: string;
  content_percentage?: number;
  status: 'collected' | 'refining' | 'refined' | 'approved';
  issues?: RefinementIssue[];
}

export interface RefinementIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  title: string;
  description: string;
  field: string;
  original_value: string;
  suggested_value?: string;
  auto_fixable: boolean;
  ingredientId?: string;
}

export interface RefinementStats {
  total_products: number;
  total_ingredients: number;
  error_count: number;
  warning_count: number;
  suggestion_count: number;
  completed_count: number;
}

// 강화된 CAS 번호 검증 함수
export const validateCASNumber = (casNumber: string): { isValid: boolean; suggestion?: string } => {
  if (!casNumber || casNumber.trim() === '') return { isValid: false };
  
  const cleaned = casNumber.trim();
  
  // CAS 번호 기본 형식: XXXX-XX-X 또는 XXXXX-XX-X 등
  const casRegex = /^\d{2,7}-\d{2}-\d$/;
  
  if (!casRegex.test(cleaned)) {
    // 숫자만 있는 경우 형식 제안
    if (/^\d+$/.test(cleaned) && cleaned.length >= 5) {
      const digits = cleaned;
      if (digits.length === 7) {
        const suggested = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
        return { isValid: false, suggestion: suggested };
      } else if (digits.length === 6) {
        const suggested = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
        return { isValid: false, suggestion: suggested };
      }
    }
    return { isValid: false };
  }

  // 체크섬 검증
  try {
    const parts = cleaned.split('-');
    if (parts.length !== 3) return { isValid: false };
    
    const checkDigit = parseInt(parts[2]);
    const digits = (parts[0] + parts[1]).split('').map(Number);
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (digits.length - i);
    }
    
    const calculatedCheckDigit = sum % 10;
    
    if (calculatedCheckDigit !== checkDigit) {
      const correctedCAS = `${parts[0]}-${parts[1]}-${calculatedCheckDigit}`;
      return { isValid: false, suggestion: correctedCAS };
    }
  } catch (error) {
    return { isValid: false };
  }

  return { isValid: true };
};

// 강화된 성분명 검증 함수
export const validateIngredientName = (name: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!name || name.trim().length === 0) {
    issues.push('성분명이 누락되었습니다.');
    return { isValid: false, issues };
  }
  
  const trimmed = name.trim();
  
  // 의심스러운 패턴들 강화
  if (trimmed.length < 2) {
    issues.push('성분명이 너무 짧습니다.');
  }
  
  if (/^\d+$/.test(trimmed)) {
    issues.push('성분명이 숫자로만 구성되어 있습니다.');
  }
  
  // 테스트 데이터의 오류 패턴 탐지
  if (trimmed.includes('잘못된') || trimmed.includes('오류') || trimmed.includes('테스트')) {
    issues.push('테스트용 또는 오류 데이터로 보입니다.');
  }
  
  // 특수문자만으로 구성된 경우
  if (/^[^a-zA-Z가-힣0-9]+$/.test(trimmed)) {
    issues.push('성분명이 특수문자로만 구성되어 있습니다.');
  }
  
  // 너무 긴 경우 (일반적인 화학물질명 범위 초과)
  if (trimmed.length > 100) {
    issues.push('성분명이 비정상적으로 깁니다.');
  }
  
  return { isValid: issues.length === 0, issues };
};

// 강화된 함량 검증 함수 (숫자형 데이터 처리)
export const validateContentPercentage = (percentage: number | null | undefined): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (percentage === null || percentage === undefined) {
    issues.push('함량 정보가 누락되었습니다.');
    return { isValid: false, issues };
  }
  
  if (percentage < 0) {
    issues.push('함량이 음수입니다.');
  } else if (percentage > 100) {
    issues.push('함량이 100%를 초과합니다.');
  } else if (percentage === 0) {
    issues.push('함량이 0%입니다.');
  }
  
  // 비정상적으로 높은 함량 경고
  if (percentage > 80) {
    issues.push('단일 성분 함량이 비정상적으로 높습니다 (80% 이상).');
  }
  
  // 소수점 자리수 검사
  if (percentage % 1 !== 0 && percentage.toString().split('.')[1]?.length > 2) {
    issues.push('함량의 소수점 자리수가 너무 많습니다.');
  }
  
  return { isValid: issues.length === 0, issues };
};

// 유해성 정보 검증 함수 (새로 추가)
export const validateHazardInfo = (hazardInfo: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!hazardInfo || hazardInfo.trim().length === 0) {
    return { isValid: true, issues }; // 유해성 정보는 선택사항
  }
  
  const trimmed = hazardInfo.trim();
  
  // 의심스러운 패턴 탐지
  if (trimmed.includes('잘못된 분류 텍스트')) {
    issues.push('유해성 정보에 오류 표시가 포함되어 있습니다.');
  }
  
  if (trimmed.length < 10 && !trimmed.match(/^\s*$/)) {
    issues.push('유해성 정보가 너무 간단합니다.');
  }
  
  // GHS 표준 형식 확인
  const hasGHSFormat = /유해성.*분류|급성.*독성|인화성.*액체|자극성.*물질/i.test(trimmed);
  if (trimmed.length > 5 && !hasGHSFormat) {
    issues.push('표준 GHS 분류 형식과 다른 것 같습니다.');
  }
  
  return { isValid: issues.length === 0, issues };
};

// 강화된 성분별 이슈 탐지 로직
export const detectIngredientIssues = (ingredient: ProductIngredient, hazardInfo?: string): RefinementIssue[] => {
  const issues: RefinementIssue[] = [];

  // 1. CAS 번호 검증
  if (ingredient.cas_number) {
    const casValidation = validateCASNumber(ingredient.cas_number);
    if (!casValidation.isValid) {
      issues.push({
        id: `cas-${ingredient.ingredient_id}`,
        type: casValidation.suggestion ? 'error' : 'warning',
        title: 'CAS 번호 형식 오류',
        description: casValidation.suggestion 
          ? `CAS 번호 "${ingredient.cas_number}"의 형식이 올바르지 않습니다.`
          : `CAS 번호 "${ingredient.cas_number}"를 검증할 수 없습니다.`,
        field: 'cas_number',
        original_value: ingredient.cas_number,
        suggested_value: casValidation.suggestion,
        auto_fixable: !!casValidation.suggestion,
        ingredientId: ingredient.ingredient_id
      });
    }
  } else {
    // CAS 번호 누락
    issues.push({
      id: `cas-missing-${ingredient.ingredient_id}`,
      type: 'suggestion',
      title: 'CAS 번호 누락',
      description: `성분 "${ingredient.main_ingredient}"의 CAS 번호가 누락되었습니다.`,
      field: 'cas_number',
      original_value: '',
      auto_fixable: false,
      ingredientId: ingredient.ingredient_id
    });
  }

  // 2. 성분명 검증 (강화됨)
  const nameValidation = validateIngredientName(ingredient.main_ingredient);
  if (!nameValidation.isValid) {
    nameValidation.issues.forEach((issue, index) => {
      issues.push({
        id: `name-${ingredient.ingredient_id}-${index}`,
        type: issue.includes('테스트용') || issue.includes('오류') ? 'error' : 'warning',
        title: '성분명 문제',
        description: issue,
        field: 'main_ingredient',
        original_value: ingredient.main_ingredient || '',
        auto_fixable: false,
        ingredientId: ingredient.ingredient_id
      });
    });
  }

  // 3. 함량 검증 (숫자형 처리)
  const percentageValidation = validateContentPercentage(ingredient.content_percentage);
  if (!percentageValidation.isValid) {
    percentageValidation.issues.forEach((issue, index) => {
      let suggestedValue: string | undefined;
      let autoFixable = false;
      
      // 음수일 경우 절댓값으로 수정 제안
      if (issue.includes('음수') && ingredient.content_percentage && ingredient.content_percentage < 0) {
        suggestedValue = Math.abs(ingredient.content_percentage).toString();
        autoFixable = true;
      }
      
      issues.push({
        id: `percentage-${ingredient.ingredient_id}-${index}`,
        type: issue.includes('100%를 초과') || issue.includes('음수') ? 'error' : 
              issue.includes('비정상적으로 높습니다') ? 'warning' : 'suggestion',
        title: '함량 문제',
        description: issue,
        field: 'content_percentage',
        original_value: ingredient.content_percentage?.toString() || '',
        suggested_value: suggestedValue,
        auto_fixable: autoFixable,
        ingredientId: ingredient.ingredient_id
      });
    });
  }

  // 4. 유해성 정보 검증 (새로 추가)
  if (hazardInfo) {
    const hazardValidation = validateHazardInfo(hazardInfo);
    if (!hazardValidation.isValid) {
      hazardValidation.issues.forEach((issue, index) => {
        issues.push({
          id: `hazard-${ingredient.ingredient_id}-${index}`,
          type: issue.includes('오류 표시') ? 'error' : 'warning',
          title: '유해성 정보 문제',
          description: issue,
          field: 'hazard_info',
          original_value: hazardInfo,
          auto_fixable: false,
          ingredientId: ingredient.ingredient_id
        });
      });
    }
  }

  return issues;
};

// 제품 상태 결정 로직
export const determineProductStatus = (product: ProductWithIngredients): {
  status: 'error' | 'warning' | 'suggestion' | 'completed';
  issueCount: number;
} => {
  const allIssues = product.ingredients.flatMap(ingredient => ingredient.issues || []);
  
  if (allIssues.length === 0) {
    return { status: 'completed', issueCount: 0 };
  }
  
  const hasErrors = allIssues.some(issue => issue.type === 'error');
  const hasWarnings = allIssues.some(issue => issue.type === 'warning');
  
  if (hasErrors) {
    return { status: 'error', issueCount: allIssues.length };
  } else if (hasWarnings) {
    return { status: 'warning', issueCount: allIssues.length };
  } else {
    return { status: 'suggestion', issueCount: allIssues.length };
  }
};

// 1. 정제 대상 제품 목록 조회 (CSV 데이터 처리 개선)
export const getProductsForRefinement = async (
  limit: number = 50,
  offset: number = 0,
  status?: string[]
): Promise<{ data: ProductWithIngredients[]; error: any }> => {
  try {
    console.log('🔍 정제 대상 제품 조회 시작...', { limit, offset, status });
    
    // 제품과 성분을 함께 조회
    let query = supabase
      .from('products')
      .select(`
        product_id,
        product_name,
        product_name_anonymized,
        product_category,
        status,
        assigned_to,
        created_at,
        updated_at,
        product_ingredients (
          ingredient_id,
          main_ingredient,
          cas_number,
          chemical_formula,
          content_percentage,
          status
        )
      `)
      .order('created_at', { ascending: false });

    // 상태 필터 적용
    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    // 모든 데이터를 가져오기 위해 조건부 제한 적용
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ 제품 조회 오류:', error);
      return { data: [], error };
    }

    console.log('✅ 제품 데이터 조회 완료:', data?.length || 0, '건');

    // 추가 정보를 위해 유해성 정보도 함께 조회 (metadata 테이블에서)
    const productIds = (data || []).map(p => p.product_id);
    let hazardInfoMap: { [key: string]: string } = {};
    
    if (productIds.length > 0) {
      try {
        const { data: hazardData } = await supabase
          .from('metadata')
          .select('reference_id, meta_value')
          .eq('data_type', 'product')
          .eq('meta_key', 'hazard_info')
          .in('reference_id', productIds);

        if (hazardData) {
          hazardInfoMap = hazardData.reduce((acc, item) => {
            acc[item.reference_id] = item.meta_value;
            return acc;
          }, {} as { [key: string]: string });
        }
      } catch (hazardError) {
        console.warn('⚠️ 유해성 정보 조회 실패:', hazardError);
      }
    }

    // 데이터 가공 및 이슈 탐지 (유해성 정보 포함)
    const productsWithIssues: ProductWithIngredients[] = (data || []).map(product => ({
      ...product,
      ingredients: (product.product_ingredients || []).map((ingredient: any) => ({
        ...ingredient,
        issues: detectIngredientIssues(ingredient, hazardInfoMap[product.product_id])
      }))
    }));

    // 디버깅을 위한 상세 로깅
    console.log('🔍 이슈 탐지 상세 결과:');
    productsWithIssues.forEach((product, idx) => {
      const totalIssues = product.ingredients.reduce((sum, ing) => sum + (ing.issues?.length || 0), 0);
      console.log(`  제품 ${idx + 1}: ${product.product_name} - ${totalIssues}개 이슈`);
      
      product.ingredients.forEach((ingredient, ingIdx) => {
        if (ingredient.issues && ingredient.issues.length > 0) {
          console.log(`    성분 ${ingIdx + 1}: ${ingredient.main_ingredient}`);
          ingredient.issues.forEach(issue => {
            console.log(`      - ${issue.type}: ${issue.title} (${issue.original_value})`);
          });
        }
      });
    });

    return { data: productsWithIssues, error: null };
  } catch (error) {
    console.error('❌ getProductsForRefinement 오류:', error);
    return { data: [], error };
  }
};

// 2. 정제 통계 조회 (수정된 버전)
export const getRefinementStats = async (): Promise<{ data: RefinementStats | null; error: any }> => {
  try {
    console.log('📊 정제 통계 조회 시작...');

    // 모든 제품 데이터를 조회해서 정확한 통계 계산
    const { data: productsWithIssues, error: productsError } = await getProductsForRefinement(0); // 제한 없이 모든 데이터
    
    if (productsError) {
      throw productsError;
    }

    // 제품 단위로 상태 분류
    let errorProducts = 0;
    let warningProducts = 0;
    let suggestionProducts = 0;
    let completedProducts = 0;
    
    let totalIssues = 0;
    let totalIngredients = 0;

    productsWithIssues.forEach(product => {
      const { status } = determineProductStatus(product);
      const productIssueCount = product.ingredients.reduce((sum, ing) => sum + (ing.issues?.length || 0), 0);
      
      totalIssues += productIssueCount;
      totalIngredients += product.ingredients.length;
      
      switch (status) {
        case 'error':
          errorProducts++;
          break;
        case 'warning':
          warningProducts++;
          break;
        case 'suggestion':
          suggestionProducts++;
          break;
        case 'completed':
          completedProducts++;
          break;
      }
    });

    const stats: RefinementStats = {
      total_products: productsWithIssues.length,
      total_ingredients: totalIngredients,
      error_count: errorProducts,
      warning_count: warningProducts,
      suggestion_count: suggestionProducts,
      completed_count: completedProducts
    };

    console.log('✅ 정제 통계 계산 완료:');
    console.log(`  총 제품: ${stats.total_products}개`);
    console.log(`  총 성분: ${stats.total_ingredients}개`);
    console.log(`  오류 제품: ${stats.error_count}개`);
    console.log(`  경고 제품: ${stats.warning_count}개`);
    console.log(`  검토필요 제품: ${stats.suggestion_count}개`);
    console.log(`  정상완료 제품: ${stats.completed_count}개`);
    console.log(`  총 이슈: ${totalIssues}건`);

    return { data: stats, error: null };
  } catch (error) {
    console.error('❌ getRefinementStats 오류:', error);
    return { data: null, error };
  }
};

// 3. 성분 정보 수정
export const updateIngredient = async (
  ingredientId: string,
  updates: Partial<ProductIngredient>
): Promise<{ data: ProductIngredient | null; error: any }> => {
  try {
    console.log('✏️ 성분 정보 수정:', ingredientId, updates);

    const { data, error } = await supabase
      .from('product_ingredients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('ingredient_id', ingredientId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ 성분 정보 수정 완료');
    return { data: data as ProductIngredient, error: null };
  } catch (error) {
    console.error('❌ updateIngredient 오류:', error);
    return { data: null, error };
  }
};

// 4. 자동 정제 적용
export const applyAutoRefinement = async (
  ingredientId: string,
  fixes: RefinementIssue[]
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('🔧 자동 정제 적용:', ingredientId, fixes.length, '개 수정사항');

    const autoFixableIssues = fixes.filter(issue => issue.auto_fixable && issue.suggested_value);
    
    if (autoFixableIssues.length === 0) {
      console.log('⚠️ 자동 수정 가능한 항목 없음');
      return { success: true };
    }

    const updates: Partial<ProductIngredient> = {};
    
    autoFixableIssues.forEach(issue => {
      if (issue.field === 'cas_number') {
        updates.cas_number = issue.suggested_value;
      } else if (issue.field === 'content_percentage') {
        updates.content_percentage = parseFloat(issue.suggested_value || '0');
      }
    });

    const result = await updateIngredient(ingredientId, updates);
    
    console.log('✅ 자동 정제 완료');
    return { success: !result.error, error: result.error };
  } catch (error) {
    console.error('❌ applyAutoRefinement 오류:', error);
    return { success: false, error };
  }
};

// 5. 작업 로그 기록
export const logRefinementAction = async (
  action: string,
  details: any,
  workerId: string,
  targetId?: string
) => {
  try {
    const { error } = await supabase
      .from('work_logs')
      .insert({
        worker_id: workerId,
        work_type: 'refinement',
        target_type: 'ingredient',
        target_id: targetId,
        action: action,
        details: details
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('❌ 작업 로그 기록 오류:', error);
    return { success: false, error };
  }
};
