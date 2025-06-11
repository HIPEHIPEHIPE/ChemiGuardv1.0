// src/utils/uploadTestData.ts - 테스트 데이터 업로드 스크립트
import { supabase } from '../lib/supabaseClient';

// CSV 데이터를 파싱하고 DB에 삽입하는 함수
export const uploadTestDataToDB = async () => {
  try {
    console.log('🚀 테스트 데이터 업로드 시작...');

    // 테스트용 화학제품 데이터 (CSV에서 가져온 일부 데이터 + 의도적 오류 포함)
    const testProducts = [
      {
        product_id: 'TEST-001',
        product_name: '프레쉬샤워클린',
        product_category: 'cleaning',
        manufacturer: '헬로클린',
        status: 'collected',
        ingredients: [
          {
            ingredient_id: 'ING-001',
            main_ingredient: '피이지-7글리세릴코코에이트',
            cas_number: '68201-46-7',
            content_percentage: 12.0,
            hazard_info: '유해성·위험성 분류: 인화성 액체 2급'
          }
        ]
      },
      {
        product_id: 'TEST-002',
        product_name: '에코세제',
        product_category: 'cleaning',
        manufacturer: '헬로클린',
        status: 'collected',
        ingredients: [
          {
            ingredient_id: 'ING-002',
            main_ingredient: '벤잘코늄클로라이드',
            cas_number: '8001-54-5',
            content_percentage: 15.2,
            hazard_info: '유해성·위험성 분류: 눈 자극성 2급'
          }
        ]
      },
      {
        product_id: 'TEST-003',
        product_name: '스마일드롭',
        product_category: 'deodorant',
        manufacturer: '헬로클린',
        status: 'collected',
        ingredients: [
          {
            ingredient_id: 'ING-003',
            main_ingredient: '리날룰',
            cas_number: '78-70-6',
            content_percentage: 46.4,
            hazard_info: ''
          }
        ]
      },
      // 의도적 오류가 포함된 데이터
      {
        product_id: 'TEST-004-ERROR',
        product_name: '클린원스프레이',
        product_category: 'cleaning',
        manufacturer: '세이프홈',
        status: 'collected',
        ingredients: [
          {
            ingredient_id: 'ING-004-ERROR',
            main_ingredient: '에탄올',
            cas_number: '64-17-5',
            content_percentage: -13.2, // 음수 오류
            hazard_info: '잘못된 분류 텍스트' // 의도적 오류
          }
        ]
      },
      {
        product_id: 'TEST-005-ERROR',
        product_name: '오류제품',
        product_category: 'cleaning',
        manufacturer: '테스트회사',
        status: 'collected',
        ingredients: [
          {
            ingredient_id: 'ING-005-ERROR',
            main_ingredient: '잘못된성분명', // 의도적 오류
            cas_number: '1234567', // 잘못된 CAS 형식
            content_percentage: 120.5, // 100% 초과 오류
            hazard_info: '잘못된 분류 텍스트'
          }
        ]
      },
      {
        product_id: 'TEST-006-ERROR',
        product_name: '빈데이터제품',
        product_category: 'cleaning',
        manufacturer: '테스트회사',
        status: 'collected',
        ingredients: [
          {
            ingredient_id: 'ING-006-ERROR',
            main_ingredient: '', // 빈 성분명
            cas_number: '', // 빈 CAS
            content_percentage: null, // null 함량
            hazard_info: ''
          }
        ]
      },
      {
        product_id: 'TEST-007-ERROR',
        product_name: '숫자성분제품',
        product_category: 'cleaning',
        manufacturer: '테스트회사',
        status: 'collected',
        ingredients: [
          {
            ingredient_id: 'ING-007-ERROR',
            main_ingredient: '123456', // 숫자로만 된 성분명
            cas_number: '151213', // 하이픈 없는 CAS
            content_percentage: 85.5, // 80% 이상 고농도
            hazard_info: '유해성·위험성 분류: 급성 독성 4급'
          }
        ]
      }
    ];

    // 기존 테스트 데이터 삭제
    console.log('🧹 기존 테스트 데이터 삭제...');
    
    const testProductIds = testProducts.map(p => p.product_id);
    
    // 성분 데이터 삭제
    await supabase
      .from('product_ingredients')
      .delete()
      .in('product_id', testProductIds);
    
    // 메타데이터 삭제
    await supabase
      .from('metadata')
      .delete()
      .in('reference_id', testProductIds);
    
    // 제품 데이터 삭제
    await supabase
      .from('products')
      .delete()
      .in('product_id', testProductIds);

    console.log('✅ 기존 테스트 데이터 삭제 완료');

    // 새 테스트 데이터 삽입
    console.log('📊 새 테스트 데이터 삽입...');

    let insertedProducts = 0;
    let insertedIngredients = 0;
    let insertedMetadata = 0;

    for (const testProduct of testProducts) {
      // 1. 제품 데이터 삽입
      const { error: productError } = await supabase
        .from('products')
        .insert({
          product_id: testProduct.product_id,
          product_name: testProduct.product_name,
          product_category: testProduct.product_category,
          status: testProduct.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (productError) {
        console.error(`❌ 제품 ${testProduct.product_id} 삽입 실패:`, productError);
        continue;
      }

      insertedProducts++;

      // 2. 성분 데이터 삽입
      for (const ingredient of testProduct.ingredients) {
        const { error: ingredientError } = await supabase
          .from('product_ingredients')
          .insert({
            product_id: testProduct.product_id,
            ingredient_id: ingredient.ingredient_id,
            main_ingredient: ingredient.main_ingredient,
            cas_number: ingredient.cas_number || null,
            content_percentage: ingredient.content_percentage,
            status: 'collected',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (ingredientError) {
          console.error(`❌ 성분 ${ingredient.ingredient_id} 삽입 실패:`, ingredientError);
          continue;
        }

        insertedIngredients++;

        // 3. 유해성 정보 메타데이터 삽입 (있는 경우)
        if (ingredient.hazard_info) {
          const { error: metaError } = await supabase
            .from('metadata')
            .insert({
              data_type: 'product',
              reference_id: testProduct.product_id,
              meta_key: 'hazard_info',
              meta_value: ingredient.hazard_info,
              created_at: new Date().toISOString()
            });

          if (metaError) {
            console.warn(`⚠️ 메타데이터 ${testProduct.product_id} 삽입 실패:`, metaError);
          } else {
            insertedMetadata++;
          }
        }
      }
    }

    console.log('✅ 테스트 데이터 업로드 완료!');
    console.log(`  - 제품: ${insertedProducts}개`);
    console.log(`  - 성분: ${insertedIngredients}개`);
    console.log(`  - 메타데이터: ${insertedMetadata}개`);

    return {
      success: true,
      summary: {
        products: insertedProducts,
        ingredients: insertedIngredients,
        metadata: insertedMetadata
      }
    };

  } catch (error) {
    console.error('❌ 테스트 데이터 업로드 중 오류:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 데이터베이스 연결 테스트
export const testDatabaseConnection = async () => {
  try {
    console.log('🔍 데이터베이스 연결 테스트...');
    
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ 데이터베이스 연결 실패:', error);
      return { connected: false, error };
    }

    console.log('✅ 데이터베이스 연결 성공');
    return { connected: true, data };

  } catch (error) {
    console.error('❌ 데이터베이스 연결 테스트 중 오류:', error);
    return { connected: false, error };
  }
};

// 현재 데이터 상태 확인
export const checkCurrentDataStatus = async () => {
  try {
    console.log('📊 현재 데이터 상태 확인...');

    // 제품 수 확인
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productError) {
      console.error('❌ 제품 수 조회 실패:', productError);
    }

    // 성분 수 확인
    const { count: ingredientCount, error: ingredientError } = await supabase
      .from('product_ingredients')
      .select('*', { count: 'exact', head: true });

    if (ingredientError) {
      console.error('❌ 성분 수 조회 실패:', ingredientError);
    }

    // 메타데이터 수 확인
    const { count: metadataCount, error: metadataError } = await supabase
      .from('metadata')
      .select('*', { count: 'exact', head: true });

    if (metadataError) {
      console.error('❌ 메타데이터 수 조회 실패:', metadataError);
    }

    // 테스트 데이터 확인
    const { data: testProducts, error: testError } = await supabase
      .from('products')
      .select('product_id, product_name')
      .like('product_id', 'TEST-%');

    if (testError) {
      console.error('❌ 테스트 데이터 조회 실패:', testError);
    }

    const status = {
      totalProducts: productCount || 0,
      totalIngredients: ingredientCount || 0,
      totalMetadata: metadataCount || 0,
      testProducts: testProducts || [],
      hasTestData: (testProducts?.length || 0) > 0
    };

    console.log('📊 현재 데이터 상태:');
    console.log(`  - 총 제품: ${status.totalProducts}개`);
    console.log(`  - 총 성분: ${status.totalIngredients}개`);
    console.log(`  - 총 메타데이터: ${status.totalMetadata}개`);
    console.log(`  - 테스트 데이터: ${status.testProducts.length}개`);

    if (status.testProducts.length > 0) {
      console.log('  테스트 제품 목록:');
      status.testProducts.forEach(product => {
        console.log(`    - ${product.product_id}: ${product.product_name}`);
      });
    }

    return status;

  } catch (error) {
    console.error('❌ 데이터 상태 확인 중 오류:', error);
    return null;
  }
};

// 브라우저 콘솔에서 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).testDataUpload = {
    uploadTestDataToDB,
    testDatabaseConnection,
    checkCurrentDataStatus
  };

  console.log('🔧 테스트 데이터 업로드 도구가 로드되었습니다!');
  console.log('사용법:');
  console.log('  - window.testDataUpload.testDatabaseConnection() // DB 연결 테스트');
  console.log('  - window.testDataUpload.checkCurrentDataStatus() // 현재 데이터 상태 확인');
  console.log('  - window.testDataUpload.uploadTestDataToDB() // 테스트 데이터 업로드');
}
