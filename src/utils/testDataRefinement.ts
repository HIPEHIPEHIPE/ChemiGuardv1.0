// 데이터 정제 기능 테스트 스크립트
// 이 파일은 개발 단계에서만 사용하며, 실제 API 동작을 확인하기 위한 것입니다.

import { 
  getRefinementStats, 
  getProductsForRefinement, 
  detectIngredientIssues,
  validateCASNumber,
  validateIngredientName,
  validateContentPercentage
} from '../api/dataRefinement';

// 테스트용 가상 데이터
const testIngredients = [
  {
    ingredient_id: 'test-1',
    main_ingredient: '소듐라우릴황산염',
    cas_number: '151-21-3',
    content_percentage: 15.5,
    status: 'collected' as const
  },
  {
    ingredient_id: 'test-2',
    main_ingredient: '에탄올',
    cas_number: '64-17-5',
    content_percentage: 105, // 의도적 오류
    status: 'collected' as const
  },
  {
    ingredient_id: 'test-3',
    main_ingredient: '잘못된 성분명', // 의도적 오류
    cas_number: '1234567', // 잘못된 형식
    content_percentage: -5, // 의도적 오류
    status: 'collected' as const
  },
  {
    ingredient_id: 'test-4',
    main_ingredient: '',
    cas_number: '',
    content_percentage: undefined,
    status: 'collected' as const
  }
];

// 단위 테스트 함수들
export const runValidationTests = () => {
  console.log('🧪 데이터 검증 테스트 시작...');
  
  // CAS 번호 검증 테스트
  console.log('\n📋 CAS 번호 검증 테스트:');
  const casTests = [
    '151-21-3',     // 올바른 형식
    '64-17-5',      // 올바른 형식
    '1234567',      // 잘못된 형식
    '151213',       // 하이픈 없음
    '151-21-4',     // 체크섬 오류
    '',             // 빈 값
    '68201-46-7'    // 올바른 형식
  ];
  
  casTests.forEach(cas => {
    const result = validateCASNumber(cas);
    console.log(`  ${cas || '(빈값)'}: ${result.isValid ? '✅' : '❌'} ${result.suggestion ? `(제안: ${result.suggestion})` : ''}`);
  });
  
  // 성분명 검증 테스트
  console.log('\n📋 성분명 검증 테스트:');
  const nameTests = [
    '소듐라우릴황산염',
    '에탄올',
    '잘못된 성분명',
    '',
    '123',
    'A'
  ];
  
  nameTests.forEach(name => {
    const result = validateIngredientName(name);
    console.log(`  "${name}": ${result.isValid ? '✅' : '❌'} ${result.issues.length > 0 ? `(${result.issues.join(', ')})` : ''}`);
  });
  
  // 함량 검증 테스트
  console.log('\n📋 함량 검증 테스트:');
  const percentageTests = [50, 0, 100, 105, -5, undefined, null];
  
  percentageTests.forEach(percentage => {
    const result = validateContentPercentage(percentage);
    console.log(`  ${percentage ?? '(없음)'}%: ${result.isValid ? '✅' : '❌'} ${result.issues.length > 0 ? `(${result.issues.join(', ')})` : ''}`);
  });
  
  // 종합 이슈 탐지 테스트
  console.log('\n📋 종합 이슈 탐지 테스트:');
  testIngredients.forEach(ingredient => {
    const issues = detectIngredientIssues(ingredient);
    console.log(`  ${ingredient.main_ingredient || '(이름없음)'}: ${issues.length}개 이슈`);
    issues.forEach(issue => {
      console.log(`    - ${issue.type}: ${issue.title} (${issue.field})`);
    });
  });
  
  console.log('\n✅ 검증 테스트 완료!');
};

// API 연결 테스트
export const runApiTests = async () => {
  console.log('🌐 API 연결 테스트 시작...');
  
  try {
    // 통계 조회 테스트
    console.log('\n📊 통계 조회 테스트:');
    const statsResult = await getRefinementStats();
    if (statsResult.error) {
      console.log('  ❌ 통계 조회 실패:', statsResult.error.message);
    } else {
      console.log('  ✅ 통계 조회 성공:', statsResult.data);
    }
    
    // 제품 조회 테스트
    console.log('\n📦 제품 조회 테스트:');
    const productsResult = await getProductsForRefinement(10, 0);
    if (productsResult.error) {
      console.log('  ❌ 제품 조회 실패:', productsResult.error.message);
    } else {
      console.log('  ✅ 제품 조회 성공:', productsResult.data.length, '건');
      
      // 첫 번째 제품의 이슈 확인
      if (productsResult.data.length > 0) {
        const firstProduct = productsResult.data[0];
        console.log('  📋 첫 번째 제품 이슈 분석:');
        console.log(`    제품명: ${firstProduct.product_name}`);
        console.log(`    성분 수: ${firstProduct.ingredients.length}`);
        
        firstProduct.ingredients.forEach((ingredient, index) => {
          console.log(`    성분 ${index + 1}: ${ingredient.main_ingredient}`);
          console.log(`      이슈 수: ${ingredient.issues?.length || 0}`);
          ingredient.issues?.forEach(issue => {
            console.log(`        - ${issue.type}: ${issue.title}`);
          });
        });
      }
    }
    
  } catch (error) {
    console.log('❌ API 테스트 중 오류:', error);
  }
  
  console.log('\n✅ API 테스트 완료!');
};

// 전체 테스트 실행
export const runAllTests = async () => {
  console.log('🚀 데이터 정제 기능 전체 테스트 시작');
  //console.log('=' * 50);
  
  // 검증 로직 테스트
  runValidationTests();
  
  // API 연결 테스트
  await runApiTests();
  
  //console.log('=' * 50);
  console.log('🎉 모든 테스트 완료!');
};

// 브라우저 콘솔에서 실행할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).testDataRefinement = {
    runValidationTests,
    runApiTests,
    runAllTests
  };
  
  console.log('🔧 데이터 정제 테스트 도구가 로드되었습니다!');
  console.log('사용법:');
  console.log('  - window.testDataRefinement.runValidationTests() // 검증 로직 테스트');
  console.log('  - window.testDataRefinement.runApiTests() // API 연결 테스트');
  console.log('  - window.testDataRefinement.runAllTests() // 전체 테스트');
}
