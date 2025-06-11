// src/utils/debugDatabase.ts
import { supabase } from '../lib/supabaseClient';

interface IngredientDistribution {
  [count: number]: number;
}

export const debugDatabaseState = async () => {
  try {
    console.log('🔍 데이터베이스 상태 분석 시작...');
    
    // 1. 제품 테이블 전체 조회
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.error('❌ 제품 테이블 조회 오류:', productsError);
      return;
    }
    
    console.log(`📊 제품 테이블: ${products?.length || 0}개 제품`);
    
    // 2. 성분 테이블 전체 조회
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*');
    
    if (ingredientsError) {
      console.error('❌ 성분 테이블 조회 오류:', ingredientsError);
      return;
    }
    
    console.log(`🧪 성분 테이블: ${ingredients?.length || 0}개 성분`);
    
    // 3. 제품별 성분 분포 분석
    const productIngredientCounts = new Map<string, number>();
    ingredients?.forEach(ingredient => {
      const productId = ingredient.product_id;
      const count = productIngredientCounts.get(productId) || 0;
      productIngredientCounts.set(productId, count + 1);
    });
    
    console.log('🔢 제품별 성분 분포:');
    const productsWithIngredients = Array.from(productIngredientCounts.entries());
    const productsWithoutIngredients = products?.filter(p => !productIngredientCounts.has(p.id)) || [];
    
    console.log(`  - 성분이 있는 제품: ${productsWithIngredients.length}개`);
    console.log(`  - 성분이 없는 제품: ${productsWithoutIngredients.length}개`);
    
    // 4. 성분 분포 세부 분석
    const ingredientDistribution: IngredientDistribution = {};
    productsWithIngredients.forEach(([productId, count]) => {
      if (!ingredientDistribution[count]) {
        ingredientDistribution[count] = 0;
      }
      ingredientDistribution[count]++;
    });
    
    console.log('📈 성분 개수별 제품 분포:');
    Object.entries(ingredientDistribution).forEach(([count, productCount]) => {
      console.log(`  - ${count}개 성분: ${productCount}개 제품`);
    });
    
    // 5. 샘플 데이터 조회 (성분이 있는 제품)
    if (productsWithIngredients.length > 0) {
      const sampleProductId = productsWithIngredients[0][0];
      const sampleProduct = products?.find(p => p.id === sampleProductId);
      const sampleIngredients = ingredients?.filter(i => i.product_id === sampleProductId);
      
      console.log('🔍 샘플 제품 데이터:');
      console.log('  제품:', sampleProduct);
      console.log('  성분들:', sampleIngredients);
    }
    
    // 6. 성분이 없는 제품 샘플
    if (productsWithoutIngredients.length > 0) {
      console.log('🚫 성분이 없는 제품 샘플 (최대 5개):');
      productsWithoutIngredients.slice(0, 5).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.product_name} (ID: ${product.id})`);
      });
    }
    
    // 7. 데이터 정합성 확인
    const orphanIngredients = ingredients?.filter(ingredient => 
      !products?.some(product => product.id === ingredient.product_id)
    ) || [];
    
    if (orphanIngredients.length > 0) {
      console.warn(`⚠️ 고아 성분 발견: ${orphanIngredients.length}개 (제품이 없는 성분)`);
    }
    
    return {
      totalProducts: products?.length || 0,
      totalIngredients: ingredients?.length || 0,
      productsWithIngredients: productsWithIngredients.length,
      productsWithoutIngredients: productsWithoutIngredients.length,
      orphanIngredients: orphanIngredients.length,
      ingredientDistribution
    };
    
  } catch (error) {
    console.error('❌ 데이터베이스 디버깅 오류:', error);
    return null;
  }
};

// 데이터 정리 함수
export const cleanupDatabase = async () => {
  try {
    console.log('🧹 데이터베이스 정리 시작...');
    
    // 1. 먼저 현재 제품 ID 목록 가져오기
    const { data: productIds } = await supabase
      .from('products')
      .select('id');
    
    const validProductIds = productIds?.map(p => p.id) || [];
    
    // 2. 고아 성분 찾기 및 제거
    const { data: orphanIngredients } = await supabase
      .from('ingredients')
      .select('id')
      .not('product_id', 'in', `(${validProductIds.join(',') || '0'})`);
    
    let orphanIngredientsRemoved = 0;
    if (orphanIngredients && orphanIngredients.length > 0) {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .in('id', orphanIngredients.map(i => i.id));
      
      if (error) {
        console.error('❌ 고아 성분 제거 실패:', error);
      } else {
        orphanIngredientsRemoved = orphanIngredients.length;
        console.log(`✅ ${orphanIngredients.length}개 고아 성분 제거 완료`);
      }
    }
    
    // 3. 성분이 있는 제품 ID 목록 가져오기
    const { data: ingredientProductIds } = await supabase
      .from('ingredients')
      .select('product_id');
    
    const productsWithIngredients = new Set(ingredientProductIds?.map(i => i.product_id) || []);
    
    // 4. 빈 제품 찾기
    const { data: emptyProducts } = await supabase
      .from('products')
      .select('id, product_name')
      .not('id', 'in', `(${Array.from(productsWithIngredients).join(',') || '0'})`);
    
    if (emptyProducts && emptyProducts.length > 0) {
      console.log(`⚠️ 성분이 없는 제품 ${emptyProducts.length}개 발견`);
      console.log('이 제품들을 삭제하려면 cleanupEmptyProducts() 함수를 별도로 호출하세요.');
    }
    
    return {
      orphanIngredientsRemoved,
      emptyProductsFound: emptyProducts?.length || 0
    };
    
  } catch (error) {
    console.error('❌ 데이터베이스 정리 오류:', error);
    return null;
  }
};

// 빈 제품 제거 (별도 함수로 분리)
export const cleanupEmptyProducts = async () => {
  try {
    // 성분이 있는 제품 ID 목록 가져오기
    const { data: ingredientProductIds } = await supabase
      .from('ingredients')
      .select('product_id');
    
    const productsWithIngredients = new Set(ingredientProductIds?.map(i => i.product_id) || []);
    
    const { data: emptyProducts } = await supabase
      .from('products')
      .select('id, product_name')
      .not('id', 'in', `(${Array.from(productsWithIngredients).join(',') || '0'})`);
    
    if (emptyProducts && emptyProducts.length > 0) {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', emptyProducts.map(p => p.id));
      
      if (error) {
        console.error('❌ 빈 제품 제거 실패:', error);
        return false;
      } else {
        console.log(`✅ ${emptyProducts.length}개 빈 제품 제거 완료`);
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ 빈 제품 제거 오류:', error);
    return false;
  }
};