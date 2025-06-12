// src/api/captionGeneration.ts
import { ChemicalData, GeneratedCaption } from '../types/dataProcessing';

export interface CaptionGenerationRequest {
  chemical: ChemicalData;
  generationType: 'academic' | 'general' | 'safety' | 'regulatory';
  language?: 'ko' | 'en';
  customPrompt?: string;
}

export interface CaptionGenerationResponse {
  success: boolean;
  result?: string;
  error?: string;
  details?: string;
}

/**
 * 화학물질 데이터를 기반으로 AI 설명문을 생성합니다.
 */
export const generateCaption = async (request: CaptionGenerationRequest): Promise<CaptionGenerationResponse> => {
  try {
    const { chemical, generationType, language = 'ko', customPrompt } = request;
    
    // AI 프롬프트 생성
    const prompt = createPrompt(chemical, generationType, language, customPrompt);
    
    const response = await fetch('/api/gemini/refine-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: chemical,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('설명문 생성 오류:', error);
    return {
      success: false,
      error: '설명문 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
};

/**
 * 생성 타입에 따른 프롬프트 생성
 */
function createPrompt(
  chemical: ChemicalData, 
  generationType: string, 
  language: string,
  customPrompt?: string
): string {
  const baseInfo = `
화학물질 정보:
- 물질명: ${chemical.name}
- CAS 번호: ${chemical.casNumber || '정보 없음'}
- 분자식: ${chemical.molecularFormula || '정보 없음'}
- 분자량: ${chemical.molecularWeight || '정보 없음'}
- 물리적 상태: ${chemical.physicalState || '정보 없음'}
- 위험성 분류: ${chemical.hazardClass || '정보 없음'}
- 용도: ${chemical.usage || '정보 없음'}
- 제조사: ${chemical.manufacturer || '정보 없음'}
  `;

  if (customPrompt) {
    return `${customPrompt}\n\n${baseInfo}`;
  }

  const prompts = {
    academic: `
다음 화학물질에 대한 간결하고 중립적인 설명문을 작성해주세요.

[작성 지침]
• 문장 수는 3~4문장으로 제한해주세요.
• '~입니다.' 형태의 단정적이고 중립적인 어투로 작성해주세요.
• 문장은 간결하게 유지하며, 핵심적인 용도와 특성만 언급해주세요.
• 과도한 수식어나 부드러운 표현은 사용하지 마세요.

[출력 예시]
소듐라우릴황산염은 강력한 세정력과 발포작용을 가진 음이온성 계면활성제로, 다양한 세정제와 화장품에 널리 사용됩니다. 이 성분은 기름과 오염물질을 효과적으로 제거하며 풍부한 거품을 생성하는 특성이 있습니다. 다만, 일부 사용자에게 피부 자극을 유발할 수 있으므로 민감성 피부의 경우 사용 시 주의가 필요합니다.

언어: ${language === 'ko' ? '한국어' : '영어'}
길이: 300-400자
    `,
    general: `
위의 화학물질에 대해 일반인도 이해할 수 있도록 설명문을 작성해주세요.

[작성 지침]
• 중립적이고 정확한 어조로 작성해주세요.
• '~입니다', '~할 수 있습니다' 등 단정적이고 정중한 문장으로 구성해주세요.
• 다음 항목을 포함해주세요:
  1. 화학물질의 기본 소개
  2. 주요 용도
  3. 사용 시 유의사항
  4. 환경과의 관련성
• 불필요한 수식어나 감성적 표현은 사용하지 마세요.
• 문장은 3~5문장 이내로 작성해주세요.

[출력 예시]
소듐라우릴황산염은 세정력과 발포력이 우수한 계면활성제로, 주로 세제나 샴푸 등 생활용품에 사용됩니다. 피부나 눈에 자극을 줄 수 있으므로 사용 시 주의가 필요합니다. 환경에 영향을 줄 수 있으므로 적절한 용량을 사용하는 것이 권장됩니다.

언어: ${language === 'ko' ? '한국어' : '영어'}
톤: 중립적이고 사실 중심
길이: 300-400자
`,
    safety: `
다음 화학물질의 독성 정보를 중심으로 주의사항 중심의 설명문을 작성해주세요.

[작성 지침]
• 문장은 3~5문장 이내로 작성해주세요.
• '~할 수 있습니다.', '~경우가 있습니다.' 형태로 표현해주세요.
• 주요 노출 경로, 위험성, 장기 노출 시 영향 등을 간단히 언급해주세요.
• 일반 독자를 대상으로, 단정적이고 과장되지 않은 표현을 사용해주세요.

[출력 예시]
소듐라우릴황산염은 피부와 눈에 자극을 유발할 수 있습니다. 특히 눈에 직접 접촉할 경우 심한 자극 또는 손상을 일으킬 수 있으므로 주의해야 합니다. 장기간 또는 반복적인 피부 접촉은 피부염을 유발할 수 있으며, 일부 민감한 개인에게는 알레르기 반응이 나타날 수 있습니다. 수생 환경에 유해할 수 있습니다.

언어: ${language === 'ko' ? '한국어' : '영어'}
톤: 명확하고 경고적
길이: 300-400자
    `,
    regulatory: `
다음 화학물질에 대한 경고 및 응급처치 정보를 구조화된 형태로 작성해주세요.

[작성 지침]
• 아래의 형식을 따라 작성해주세요:

【경고】
• 항목1
• 항목2
• ...

【응급처치】
• 항목1
• 항목2
• ...

• 항목은 반드시 • 기호로 시작하세요.
• 간결하고 명확한 문장으로 구성해주세요.
• '~하십시오' 또는 '~하지 마십시오' 형태로 통일해주세요.

[출력 예시]
【경고】
• 눈에 들어가지 않도록 주의하십시오.
• 피부에 직접적인 접촉을 피하십시오.
• 어린이의 손이 닿지 않는 곳에 보관하십시오.
• 사용 후에는 손을 깨끗이 씻으십시오.

【응급처치】
• 눈에 들어갔을 때: 즉시 다량의 물로 15분 이상 씻어내고 의사의 진료를 받으십시오.
• 피부에 접촉했을 때: 비누와 물로 깨끗이 씻어내십시오. 자극이 지속되면 의사의 진료를 받으십시오.
• 삼켰을 때: 물을 마시게 하고 즉시 의사의 진료를 받으십시오. (억지로 토하게 하지 마십시오.)

언어: ${language === 'ko' ? '한국어' : '영어'}
톤: 공식적이고 정확한
길이: 400-500자
    `
  };

  return `${prompts[generationType as keyof typeof prompts]}\n\n${baseInfo}`;
}

/**
 * 배치 설명문 생성 (여러 화학물질)
 */
export const generateBatchCaptions = async (
  chemicals: ChemicalData[],
  generationType: 'academic' | 'general' | 'safety' | 'regulatory',
  language: 'ko' | 'en' = 'ko'
): Promise<Array<{ chemical: ChemicalData; result: CaptionGenerationResponse }>> => {
  const results = [];
  
  for (const chemical of chemicals) {
    const result = await generateCaption({
      chemical,
      generationType,
      language,
    });
    
    results.push({ chemical, result });
    
    // API 호출 간격 조절 (과부하 방지)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
};

/**
 * 설명문 품질 평가
 */
export const evaluateCaption = async (
  chemical: ChemicalData,
  generatedCaption: string
): Promise<{
  score: number;
  feedback: string;
  suggestions: string[];
}> => {
  const prompt = `
다음 화학물질에 대한 생성된 설명문의 품질을 평가해주세요:

화학물질: ${chemical.name}
생성된 설명문:
${generatedCaption}

평가 기준:
1. 정확성 (30점): 화학적 정보의 정확성
2. 완성도 (25점): 필요한 정보의 포함 여부
3. 가독성 (25점): 이해하기 쉬운 문장 구성
4. 전문성 (20점): 전문 용어의 적절한 사용

다음 JSON 형식으로 응답해주세요:
{
  "score": 85,
  "feedback": "전반적으로 우수한 설명문입니다...",
  "suggestions": ["구체적인 개선사항1", "구체적인 개선사항2"]
}
  `;

  try {
    const response = await fetch('/api/gemini/refine-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: { chemical, caption: generatedCaption },
        prompt: prompt,
      }),
    });

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
    console.error('설명문 평가 오류:', error);
    return {
      score: 0,
      feedback: '평가 중 오류가 발생했습니다.',
      suggestions: [],
    };
  }
};
