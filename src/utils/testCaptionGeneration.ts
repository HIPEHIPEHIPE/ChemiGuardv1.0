// src/utils/testCaptionGeneration.ts
import { generateCaption } from '../api/captionGeneration';
import { ChemicalData } from '../types/dataProcessing';

// 테스트용 화학물질 데이터
const testChemical: ChemicalData = {
  id: 'TEST-001',
  name: '소듐라우릴황산염',
  casNumber: '151-21-3',
  molecularFormula: 'C12H25NaO4S',
  molecularWeight: '288.38 g/mol',
  physicalState: '고체',
  hazardClass: '자극성',
  usage: '음이온성 계면활성제',
  manufacturer: '테스트케미칼',
  status: 'refined',
  created_at: '2025-06-12',
  updated_at: '2025-06-12',
};

/**
 * AI 설명문 생성 기능 테스트
 */
export const testCaptionGeneration = async () => {
  console.log('🧪 AI 설명문 생성 테스트 시작...');
  
  try {
    // 1. 일반인용 설명문 생성 테스트
    console.log('\n1️⃣ 일반인용 설명문 생성 테스트');
    const generalResult = await generateCaption({
      chemical: testChemical,
      generationType: 'general',
      language: 'ko',
    });
    
    if (generalResult.success) {
      console.log('✅ 일반인용 설명문 생성 성공');
      console.log('📝 결과:', generalResult.result?.substring(0, 100) + '...');
    } else {
      console.log('❌ 일반인용 설명문 생성 실패:', generalResult.error);
    }

    // 2. 학술용 설명문 생성 테스트
    console.log('\n2️⃣ 학술용 설명문 생성 테스트');
    const academicResult = await generateCaption({
      chemical: testChemical,
      generationType: 'academic',
      language: 'ko',
    });
    
    if (academicResult.success) {
      console.log('✅ 학술용 설명문 생성 성공');
      console.log('📝 결과:', academicResult.result?.substring(0, 100) + '...');
    } else {
      console.log('❌ 학술용 설명문 생성 실패:', academicResult.error);
    }

    // 3. 안전성 설명문 생성 테스트
    console.log('\n3️⃣ 안전성 설명문 생성 테스트');
    const safetyResult = await generateCaption({
      chemical: testChemical,
      generationType: 'safety',
      language: 'ko',
    });
    
    if (safetyResult.success) {
      console.log('✅ 안전성 설명문 생성 성공');
      console.log('📝 결과:', safetyResult.result?.substring(0, 100) + '...');
    } else {
      console.log('❌ 안전성 설명문 생성 실패:', safetyResult.error);
    }

    console.log('\n🎉 모든 테스트 완료!');
    
  } catch (error) {
    console.error('💥 테스트 중 오류 발생:', error);
  }
};

/**
 * 서버 연결 테스트
 */
export const testServerConnection = async () => {
  console.log('🔗 서버 연결 테스트 시작...');
  
  try {
    const response = await fetch('/api/gemini/refine-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: { test: true },
        prompt: '간단한 연결 테스트입니다. "연결 성공"이라고 응답해주세요.',
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 서버 연결 성공');
      console.log('📡 응답:', result);
    } else {
      console.log('❌ 서버 연결 실패:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('💥 서버 연결 테스트 오류:', error);
  }
};
