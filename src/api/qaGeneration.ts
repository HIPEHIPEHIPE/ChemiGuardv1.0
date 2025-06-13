// src/api/qaGeneration.ts - 수정된 Gen AI API 연결
import { ChemicalData } from '../types/qaGeneration';

export interface QAGenerationRequest {
  chemical: ChemicalData;
  questionType: 'safety' | 'usage' | 'component' | 'regulation';
  difficultyLevel: 'general' | 'professional' | 'expert';
  customPrompt?: string;
  language?: 'ko' | 'en';
}

export interface QAGenerationResponse {
  success: boolean;
  result?: {
    question: string;
    answer: string;
    category?: string;
    metadata?: {
      generatedAt: string;
      model: string;
      temperature: number;
    };
  };
  error?: string;
  details?: string;
}

export interface GeneratedQA {
  id: string;
  question: string;
  answer: string;
  category: string;
  sourceData: ChemicalData;
  metadata: {
    generatedAt: string;
    model: string;
    temperature: number;
    dataSource: string;
    questionType: string;
    targetAudience: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 화학물질 데이터를 기반으로 AI Q&A를 생성합니다.
 */
export const generateQA = async (request: QAGenerationRequest): Promise<QAGenerationResponse> => {
  try {
    const { chemical, questionType, difficultyLevel, language = 'ko' } = request;
    
    console.log('🤖 QA 생성 API 호출:', {
      chemical: chemical.name,
      questionType,
      difficultyLevel
    });

    const response = await fetch('/.netlify/functions/gemini-generate-qa', {  // 직접 함수 호출로 우회
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chemical: chemical,
        qaType: questionType,
        difficultyLevel: difficultyLevel,
        language: language
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', response.status, errorText);
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ QA 생성 API 응답:', result);
    
    if (result.success && result.result) {
      return {
        success: true,
        result: {
          question: result.result.question || `${chemical.name}에 대한 ${questionType} 관련 질문`,
          answer: result.result.answer || result.result,
          category: getCategoryFromType(questionType),
          metadata: result.metadata || {
            generatedAt: new Date().toISOString(),
            model: 'gemini-2.5-pro',
            temperature: 0.7,
          }
        },
      };
    } else {
      throw new Error(result.error || 'Q&A 생성 실패');
    }

  } catch (error) {
    console.error('💥 Q&A 생성 오류:', error);
    return {
      success: false,
      error: 'Q&A 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
};

/**
 * 질문만 생성하는 함수
 */
export const generateQuestion = async (
  chemical: ChemicalData,
  questionType: string,
  difficultyLevel: string,
  language: string = 'ko'
): Promise<QAGenerationResponse> => {
  // generateQA와 동일한 함수 사용 (서버에서 구분 처리)
  return generateQA({
    chemical,
    questionType: questionType as 'safety' | 'usage' | 'component' | 'regulation',
    difficultyLevel: difficultyLevel as 'general' | 'professional' | 'expert',
    language: language as 'ko' | 'en'
  });
};

/**
 * 답변만 생성하는 함수
 */
export const generateAnswer = async (
  chemical: ChemicalData,
  question: string,
  questionType: string,
  difficultyLevel: string,
  language: string = 'ko'
): Promise<QAGenerationResponse> => {
  try {
    console.log('💬 답변 생성 API 호출:', {
      chemical: chemical.name,
      question: question.substring(0, 50) + '...',
      questionType,
      difficultyLevel
    });

    const response = await fetch('/.netlify/functions/gemini-generate-qa', {  // generate-answer도 동일 함수 사용
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chemical: chemical,
        question: question,
        qaType: questionType,
        difficultyLevel: difficultyLevel,
        language: language
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', response.status, errorText);
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ 답변 생성 API 응답:', result);
    
    if (result.success && result.result) {
      return {
        success: true,
        result: {
          question: question,
          answer: result.result.answer || result.result,
          category: getCategoryFromType(questionType),
          metadata: {
            generatedAt: new Date().toISOString(),
            model: 'gemini-2.5-pro',
            temperature: 0.7,
          },
        },
      };
    } else {
      throw new Error(result.error || '답변 생성 실패');
    }

  } catch (error) {
    console.error('💥 답변 생성 오류:', error);
    return {
      success: false,
      error: '답변 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
};

/**
 * 질문 타입을 카테고리로 변환
 */
function getCategoryFromType(questionType: string): string {
  const categoryMap = {
    safety: '안전성',
    usage: '사용법',
    component: '성분 정보',
    regulation: '규제 정보'
  };
  
  return categoryMap[questionType as keyof typeof categoryMap] || '일반';
}

/**
 * Q&A 품질 평가
 */
export const evaluateQA = async (
  chemical: ChemicalData,
  question: string,
  answer: string
): Promise<{
  score: number;
  feedback: string;
  suggestions: string[];
}> => {
  const prompt = `다음 화학물질 Q&A의 품질을 평가해주세요:

화학물질: ${chemical.name}
질문: ${question}
답변: ${answer}

평가 기준:
1. 정확성 (30점): 화학적 정보의 정확성
2. 완성도 (25점): 질문에 대한 충분한 답변
3. 유용성 (25점): 실제 도움이 되는 정보 제공
4. 명확성 (20점): 이해하기 쉬운 설명

다음 JSON 형식으로 응답해주세요:
{
  \"score\": 85,
  \"feedback\": \"전반적으로 우수한 Q&A입니다...\",
  \"suggestions\": [\"구체적인 개선사항1\", \"구체적인 개선사항2\"]
}`;

  try {
    const response = await fetch('/api/gemini/refine-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: { chemical, question, answer },
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      console.error('평가 API 오류:', response.status);
      throw new Error('평가 API 호출 실패');
    }

    const result = await response.json();
    
    if (result.success) {
      try {
        const evaluation = JSON.parse(result.result);
        return evaluation;
      } catch {
        return {
          score: 0,
          feedback: '평가 결과를 파싱할 수 없습니다.',
          suggestions: [],
        };
      }
    } else {
      throw new Error(result.error || '평가 실패');
    }
  } catch (error) {
    console.error('Q&A 평가 오류:', error);
    return {
      score: 0,
      feedback: '평가 중 오류가 발생했습니다.',
      suggestions: [],
    };
  }
};

// API 상태 확인
export const checkAPIStatus = async (): Promise<{
  available: boolean;
  genAI: boolean;
  error?: string;
}> => {
  try {
    console.log('🔍 API 상태 확인 중...');
    
    const response = await fetch('/api/genai-test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API 상태 확인 실패:', response.status);
      return {
        available: false,
        genAI: false,
        error: `API 상태 확인 실패: ${response.status}`,
      };
    }

    const status = await response.json();
    console.log('✅ API 상태:', status);
    
    return {
      available: status.success || false,
      genAI: status.genAI || false,
    };
  } catch (error) {
    console.error('API 상태 확인 중 오류:', error);
    return {
      available: false,
      genAI: false,
      error: error instanceof Error ? error.message : '상태 확인 실패',
    };
  }
};

// 로컬 스토리지 관리 함수들
export const saveQA = (qa: GeneratedQA): void => {
  try {
    const existingQAs = getStoredQAList();
    const updatedQAs = [...existingQAs, qa];
    localStorage.setItem('generated_qa_list', JSON.stringify(updatedQAs));
    console.log('💾 Q&A 저장 완료:', qa.id);
  } catch (error) {
    console.error('💥 Q&A 저장 실패:', error);
    throw error;
  }
};

export const getStoredQAList = (): GeneratedQA[] => {
  try {
    const stored = localStorage.getItem('generated_qa_list');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('💥 Q&A 조회 실패:', error);
    return [];
  }
};

export const updateQA = (updatedQA: GeneratedQA): void => {
  try {
    const qaList = getStoredQAList();
    const index = qaList.findIndex(qa => qa.id === updatedQA.id);
    
    if (index !== -1) {
      qaList[index] = { ...updatedQA, updatedAt: new Date().toISOString() };
      localStorage.setItem('generated_qa_list', JSON.stringify(qaList));
      console.log('✏️ Q&A 수정 완료:', updatedQA.id);
    }
  } catch (error) {
    console.error('💥 Q&A 수정 실패:', error);
    throw error;
  }
};

export const deleteQA = (qaId: string): void => {
  try {
    const qaList = getStoredQAList();
    const filteredList = qaList.filter(qa => qa.id !== qaId);
    localStorage.setItem('generated_qa_list', JSON.stringify(filteredList));
    console.log('🗑️ Q&A 삭제 완료:', qaId);
  } catch (error) {
    console.error('💥 Q&A 삭제 실패:', error);
    throw error;
  }
};

// Q&A 생성 유틸리티 함수들
export const createQAFromResult = (
  result: any,
  chemical: ChemicalData,
  questionType: string,
  difficultyLevel: string
): GeneratedQA => {
  return {
    id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question: result.question,
    answer: result.answer,
    category: getCategoryFromType(questionType),
    sourceData: chemical,
    metadata: {
      generatedAt: result.metadata?.generatedAt || new Date().toISOString(),
      model: result.metadata?.model || 'gemini-2.5-pro',
      temperature: result.metadata?.temperature || 0.7,
      dataSource: 'MSDS API',
      questionType: questionType,
      targetAudience: difficultyLevel,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// 에러 처리 유틸리티
export const handleAPIError = (error: any): QAGenerationResponse => {
  console.error('API 요청 오류:', error);
  
  let errorMessage = 'Q&A 생성 중 오류가 발생했습니다.';
  let details = '알 수 없는 오류';
  
  if (error instanceof Error) {
    details = error.message;
    
    if (error.message.includes('404')) {
      errorMessage = 'API 엔드포인트를 찾을 수 없습니다.';
    } else if (error.message.includes('500')) {
      errorMessage = '서버 내부 오류가 발생했습니다.';
    } else if (error.message.includes('network')) {
      errorMessage = '네트워크 연결 오류가 발생했습니다.';
    }
  }
  
  return {
    success: false,
    error: errorMessage,
    details: details,
  };
};
