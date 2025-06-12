// src/api/qaGeneration.ts - Updated for improved system
import { QAGenerationRequest, GeneratedQA } from '../types/qa';

// Mock API - 실제 환경에서는 실제 Gen AI API로 교체
export const generateQA = async (request: QAGenerationRequest): Promise<GeneratedQA[]> => {
  // 실제 API 호출 시뮬레이션을 위한 지연
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  const { chemicals, questionTypes, targetAudience, count = 3 } = request;
  const qaList: GeneratedQA[] = [];

  // 선택된 화학물질을 기반으로 Q&A 생성 시뮬레이션
  chemicals.forEach((chemical: any, index: number) => {
    const questionCount = Math.min(count, 5);
    
    for (let i = 0; i < questionCount; i++) {
      const questionType = questionTypes[i % questionTypes.length];
      const qa: GeneratedQA = {
        id: `qa_${Date.now()}_${index}_${i}`,
        question: generateQuestionFromChemical(chemical, questionType, targetAudience),
        answer: generateAnswerFromChemical(chemical, questionType, targetAudience),
        category: getCategoryFromChemical(chemical),
        sourceData: chemical,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'mock-ai-v1',
          temperature: 0.7,
          dataSource: `chemical_${index + 1}`,
          questionType,
          targetAudience
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      qaList.push(qa);
    }
  });

  return qaList;
};

// 실제 Gen AI API 호출 함수 (환경변수로 설정된 API 키 사용)
export const generateQAWithGenAI = async (request: QAGenerationRequest): Promise<GeneratedQA[]> => {
  const apiKey = process.env.REACT_APP_GENAI_API_KEY;
  const apiEndpoint = process.env.REACT_APP_GENAI_ENDPOINT;

  if (!apiKey || !apiEndpoint) {
    console.warn('Gen AI API 설정이 없어 Mock API를 사용합니다.');
    return generateQA(request);
  }

  try {
    const { chemicals, questionTypes, targetAudience, count } = request;
    const qaList: GeneratedQA[] = [];

    for (const chemical of chemicals) {
      const prompt = buildPromptFromChemical(chemical, questionTypes, targetAudience, count);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          temperature: 0.7,
          max_tokens: 2000,
          question_count: count,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // API 응답을 GeneratedQA 형식으로 변환
      const generatedQAs = parseGenAIResponse(result, chemical, request);
      qaList.push(...generatedQAs);
    }

    return qaList;
  } catch (error) {
    console.error('Gen AI API 호출 실패:', error);
    // 실패 시 Mock API로 fallback
    return generateQA(request);
  }
};

// 화학물질에서 질문 생성 (Mock)
function generateQuestionFromChemical(chemical: any, questionType: string, targetAudience: string): string {
  const name = chemical.name || '이 화학물질';
  const audience = targetAudience === 'expert' ? '전문적인' : '일반적인';
  
  const questionTemplates: Record<string, string[]> = {
    simple: [
      `${name}이란 무엇인가요?`,
      `${name}의 주요 특징은 무엇인가요?`,
      `${name}은 어디에 사용되나요?`,
      `${name}의 화학적 성질은 무엇인가요?`,
      `${name}은 안전한가요?`
    ],
    detailed: [
      `${name}의 분자 구조와 화학적 성질에 대해 자세히 설명해주세요.`,
      `${name}이 인체와 환경에 미치는 영향을 상세히 분석해주세요.`,
      `${name}의 산업적 활용 방법과 제조 과정은 어떻게 되나요?`,
      `${name}의 독성학적 특성과 안전 관리 방안은 무엇인가요?`,
      `${name}과 관련된 법적 규제와 관리 기준은 어떻게 되나요?`
    ],
    comparison: [
      `${name}과 유사한 화학물질들과 비교했을 때의 차이점은 무엇인가요?`,
      `${name}의 장단점을 다른 대체 물질과 비교해주세요.`,
      `${name}과 기존 물질 대비 개선된 점은 무엇인가요?`,
      `${name}을 사용하는 것과 사용하지 않는 것의 차이는 무엇인가요?`,
      `${name}의 비용 효율성을 다른 옵션과 비교하면 어떤가요?`
    ]
  };

  const templates = questionTemplates[questionType] || questionTemplates.simple;
  return templates[Math.floor(Math.random() * templates.length)];
}

// 화학물질에서 답변 생성 (Mock)
function generateAnswerFromChemical(chemical: any, questionType: string, targetAudience: string): string {
  const name = chemical.name || '이 화학물질';
  const casNumber = chemical.casNumber || chemical.cas_no || '정보 없음';
  const usage = chemical.usage || '다양한 용도';
  const hazardClass = chemical.hazardClass || '위험성 정보 없음';
  
  if (targetAudience === 'expert') {
    return `${name} (CAS: ${casNumber})은 ${usage} 분야에서 활용되는 화학물질입니다. 
    
주요 특성:
- 분자식: ${chemical.molecularFormula || '정보 없음'}
- 분자량: ${chemical.molecularWeight || '정보 없음'}  
- 물리적 상태: ${chemical.physicalState || '정보 없음'}
- 위험성 분류: ${hazardClass}
- LD50 값: ${chemical.ld50Value || chemical.ld50_value || '정보 없음'}
- GHS 코드: ${chemical.ghsCodes?.join(', ') || chemical.ghs_codes?.join(', ') || '정보 없음'}

이 화학물질은 ${usage} 목적으로 사용되며, 적절한 안전 관리 하에 취급해야 합니다. 관련 법규와 안전 지침을 준수하는 것이 중요합니다.`;
  } else {
    return `${name}은 ${usage}에 사용되는 화학물질입니다. 
    
이 물질의 주요 정보:
• 용도: ${usage}
• 안전성: ${hazardClass}
• 취급 시 주의사항: 적절한 보호구 착용 필요

일상생활에서 ${chemical.productName || '관련 제품'}과 같은 제품에 포함되어 있을 수 있으며, 제품 사용 시 라벨의 주의사항을 꼭 확인하시기 바랍니다. 안전한 사용을 위해서는 환기가 잘 되는 곳에서 사용하고, 어린이의 손이 닿지 않는 곳에 보관해야 합니다.`;
  }
}

// 화학물질에서 카테고리 결정
function getCategoryFromChemical(chemical: any): string {
  if (chemical.usageCategory) return chemical.usageCategory;
  if (chemical.usage?.includes('세정')) return '세정제';
  if (chemical.usage?.includes('표백')) return '표백제';
  if (chemical.usage?.includes('소독')) return '소독제';
  if (chemical.usage?.includes('방향')) return '방향제';
  return '일반 화학물질';
}

// 화학물질에서 프롬프트 생성
function buildPromptFromChemical(chemical: any, questionTypes: string[], targetAudience: string, count: number): string {
  const chemicalData = JSON.stringify(chemical, null, 2);
  const audience = targetAudience === 'expert' ? '전문가' : '일반인';
  
  return `
다음 화학물질 데이터를 바탕으로 ${audience}를 대상으로 한 질문과 답변을 ${count}개 생성해주세요.

화학물질 정보:
${chemicalData}

요구사항:
- 질문 유형: ${questionTypes.join(', ')}
- 대상: ${audience}
- 질문은 명확하고 구체적이어야 합니다.
- 답변은 제공된 데이터를 기반으로 정확하고 유용한 정보를 포함해야 합니다.
- ${audience === '전문가' ? '전문적이고 기술적인 내용' : '이해하기 쉬운 일반적인 내용'}으로 설명해주세요.
- 각 Q&A는 독립적이어야 합니다.

형식:
Q1: [질문1]
A1: [답변1]
Category: [카테고리1]

Q2: [질문2] 
A2: [답변2]
Category: [카테고리2]
...
`;
}

// Gen AI API 응답 파싱
function parseGenAIResponse(response: any, sourceData: any, request: QAGenerationRequest): GeneratedQA[] {
  const qaList: GeneratedQA[] = [];
  
  try {
    // API 응답 형식에 따라 파싱 로직 구현
    const content = response.choices?.[0]?.message?.content || response.text || '';
    const qaMatches = content.match(/Q\d+:([\s\S]*?)A\d+:([\s\S]*?)(?:Category:([\s\S]*?))?(?=Q\d+:|$)/g);

    qaMatches?.forEach((match: string, index: number) => {
      const parts = match.match(/Q\d+:([\s\S]*?)A\d+:([\s\S]*?)(?:Category:([\s\S]*?))?(?=Q\d+:|$)/);
      
      if (parts && parts[1] && parts[2]) {
        const qa: GeneratedQA = {
          id: `genai_${Date.now()}_${index}`,
          question: parts[1].trim(),
          answer: parts[2].trim(),
          category: parts[3]?.trim() || getCategoryFromChemical(sourceData),
          sourceData,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: response.model || 'genai-v1',
            temperature: 0.7,
            apiResponse: response,
            targetAudience: request.targetAudience,
            questionTypes: request.questionTypes
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        qaList.push(qa);
      }
    });
  } catch (error) {
    console.error('Gen AI 응답 파싱 실패:', error);
  }

  return qaList;
}

// Q&A 저장 (로컬 스토리지 또는 서버)
export const saveQAList = (qaList: GeneratedQA[]): void => {
  try {
    const existingQAs = getStoredQAList();
    const updatedQAs = [...existingQAs, ...qaList];
    localStorage.setItem('generated_qa_list', JSON.stringify(updatedQAs));
  } catch (error) {
    console.error('Q&A 저장 실패:', error);
  }
};

// 저장된 Q&A 목록 조회
export const getStoredQAList = (): GeneratedQA[] => {
  try {
    const stored = localStorage.getItem('generated_qa_list');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Q&A 조회 실패:', error);
    return [];
  }
};

// Q&A 수정
export const updateQA = (updatedQA: GeneratedQA): void => {
  try {
    const qaList = getStoredQAList();
    const index = qaList.findIndex(qa => qa.id === updatedQA.id);
    
    if (index !== -1) {
      qaList[index] = { ...updatedQA, updatedAt: new Date().toISOString() };
      localStorage.setItem('generated_qa_list', JSON.stringify(qaList));
    }
  } catch (error) {
    console.error('Q&A 수정 실패:', error);
  }
};

// Q&A 삭제
export const deleteQA = (qaId: string): void => {
  try {
    const qaList = getStoredQAList();
    const filteredList = qaList.filter(qa => qa.id !== qaId);
    localStorage.setItem('generated_qa_list', JSON.stringify(filteredList));
  } catch (error) {
    console.error('Q&A 삭제 실패:', error);
  }
};

// Q&A 목록 초기화
export const clearQAList = (): void => {
  try {
    localStorage.removeItem('generated_qa_list');
  } catch (error) {
    console.error('Q&A 목록 초기화 실패:', error);
  }
};