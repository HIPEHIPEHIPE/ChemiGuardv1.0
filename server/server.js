const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MSDS API 기본 설정
const MSDS_BASE_URL = 'https://msds.kosha.or.kr/openapi/service/msdschem';
const SERVICE_KEY = process.env.REACT_APP_MSDS_API_KEY;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Google AI 설정
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'global';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

let genAI;
let model;

// Google AI 초기화
console.log('=== Google GenAI 초기화 시작 ===');
console.log(`PROJECT_ID: ${PROJECT_ID}`);
console.log(`LOCATION: ${LOCATION}`);
console.log(`CREDENTIALS_PATH: ${CREDENTIALS_PATH}`);

if (PROJECT_ID) {
  try {
    // 환경변수로 GOOGLE_APPLICATION_CREDENTIALS 설정
    if (CREDENTIALS_PATH) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = CREDENTIALS_PATH;
      console.log(`환경변수 설정: ${CREDENTIALS_PATH}`);
    }
    
    // gcloud auth application-default login으로 인증된 상태에서 사용
    genAI = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION
    });
    
    // 모델은 사용 시점에 지정
    console.log('✅ Google GenAI 초기화 완료');
  } catch (error) {
    console.error('❌ Google GenAI 초기화 실패:', error);
  }
} else {
  console.log('⚠️ PROJECT_ID 누락');
}

// Google Generative AI를 활용한 MSDS PDF 분석
app.post('/api/gemini/extract-msds', async (req, res) => {
  console.log('=== PDF 분석 요청 시작 ===');
  
  try {
    const { fileData, fileName } = req.body;
    
    console.log(`파일명: ${fileName}`);
    console.log(`파일 데이터 크기: ${fileData ? fileData.length : 0} bytes`);
    console.log(`Google GenAI 사용 가능: ${genAI ? 'YES' : 'NO'}`);
    
    if (!fileData || !fileName) {
      console.log('❌ 파일 데이터 또는 파일명 누락');
      return res.status(400).json({ error: 'PDF 파일 데이터와 파일명이 필요합니다.' });
    }

    // Google GenAI가 초기화되지 않은 경우 즉시 실패
    if (!genAI) {
      console.log('❌ Google GenAI가 초기화되지 않았습니다.');
      return res.status(500).json({
        error: 'Google GenAI 서비스를 사용할 수 없습니다.',
        details: 'Google GenAI가 초기화되지 않았습니다. 설정을 확인해주세요.'
      });
    }

    const prompt = `이 MSDS PDF 문서를 분석하여 다음 JSON 형식으로 정보를 추출해주세요.

중요: 제품 정보와 화학물질 성분 정보를 명확히 구분해서 추출하세요.

제품 정보(productInfo):
- productName: 전체 제품의 이름 (예: "BIO 707 백색")
- manufacturer: 제조회사 이름
- emergencyContact: 긴급연락처
- recommendedUse: 제품 사용 용도
- restrictions: 사용상 제한사항

구성성분(composition):
- 제품에 포함된 각 화학물질들의 목록
- 각 화학물질마다 별도 객체로 생성

응답 형식:
{
  "productInfo": {
    "productName": "제품명 (화학물질명이 아님)",
    "manufacturer": "제조사명",
    "emergencyContact": "연락처",
    "recommendedUse": "사용용도",
    "restrictions": "제한사항"
  },
  "hazardInfo": {
    "ghs_classification": "GHS 분류",
    "pictograms": ["그림문자"],
    "signalWord": "신호어",
    "hazardStatements": ["유해위험문구"],
    "precautionaryStatements": ["예방조치문구"],
    "nfpaRatings": {
      "health": 0,
      "fire": 0,
      "reactivity": 0
    }
  },
  "composition": [
    {
      "substanceName": "화학물질명1",
      "synonym": "이명",
      "casNumber": "CAS번호",
      "percentage": "함유량"
    },
    {
      "substanceName": "화학물질명2",
      "synonym": "이명",
      "casNumber": "CAS번호",
      "percentage": "함유량"
    }
  ],
  "firstAid": {
    "eyeContact": "눈 접촉시 응급조치",
    "skinContact": "피부 접촉시 응급조치",
    "inhalation": "흡입시 응급조치",
    "ingestion": "섭취시 응급조치",
    "medicalAttention": "의료진 주의사항"
  },
  "physicalProperties": {
    "appearance": "외관",
    "odor": "냄새",
    "ph": "pH",
    "meltingPoint": "녹는점",
    "boilingPoint": "끓는점",
    "flashPoint": "인화점",
    "density": "밀도",
    "vaporPressure": "증기압",
    "solubility": "용해도"
  }
}

정보가 없는 경우 빈 문자열("")이나 빈 배열([])을 사용하세요.`;

    let responseResult;

    // Google GenAI 사용 (구글 정확한 예시 코드 방식)
    console.log('🔄 Google GenAI로 PDF 분석 시도...');
    
    const modelName = 'gemini-2.5-pro-preview-06-05';
    
    // 설정
    const generationConfig = {
      maxOutputTokens: 65535,
      temperature: 1,
      topP: 1,
      seed: 0,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'OFF',
        }
      ],
    };
    
    const apiRequest = {
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: fileData
              }
            }
          ]
        }
      ],
      config: generationConfig
    };

    console.log('Google GenAI 요청 전송 중...');
    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    console.log('✅ Google GenAI 스트리밍 응답 시작');
    
    // 스트리밍 응답 처리
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('스트리밍 완료 - 응답 텍스트 길이:', responseText.length);
    
    // JSON 파싱 시도
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;
    
    console.log('JSON 파싱 시도...');
    const extractedData = JSON.parse(jsonText);
    console.log('✅ JSON 파싱 성공');
    
    return res.json({
      success: true,
      data: extractedData,
      fileName: fileName,
      source: 'google-generative-ai'
    });

  } catch (error) {
    console.error('💥 MSDS PDF 분석 최종 오류:', error);
    console.error('오류 스택:', error.stack);
    res.status(500).json({
      error: 'PDF 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    console.log('=== PDF 분석 요청 종료 ===\n');
  }
});

// 일반 텍스트 정제를 위한 Google Generative AI
app.post('/api/gemini/refine-data', async (req, res) => {
  try {
    const { data, prompt = '다음 데이터를 정제하고 구조화해주세요:' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: '정제할 데이터가 필요합니다.' });
    }

    // Google Generative AI가 초기화되지 않은 경우 즉시 실패
    if (!genAI) {
      return res.status(500).json({
        error: 'Google Generative AI 서비스를 사용할 수 없습니다.',
        details: 'Google GenAI가 초기화되지 않았습니다. 설정을 확인해주세요.'
      });
    }

    const fullPrompt = `${prompt}\n\n${JSON.stringify(data, null, 2)}`;

    const apiRequest = {
      model: 'gemini-2.5-pro-preview-06-05',
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 65535,
        temperature: 1,
        topP: 1
      }
    };

    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    return res.json({
      success: true,
      result: responseText,
      source: 'google-generative-ai'
    });

  } catch (error) {
    console.error('데이터 정제 오류:', error);
    res.status(500).json({
      error: '데이터 정제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 화학물질 목록 조회 프록시
app.get('/api/msds/chemlist', async (req, res) => {
  try {
    const { searchWrd, searchCnd = '0', numOfRows = '10', pageNo = '1' } = req.query;
    
    if (!searchWrd) {
      return res.status(400).json({ error: '검색어가 필요합니다.' });
    }

    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      searchWrd: searchWrd,
      searchCnd: searchCnd,
      numOfRows: numOfRows,
      pageNo: pageNo
    });

    const url = `${MSDS_BASE_URL}/chemlist?${params.toString()}`;
    console.log('MSDS API 호출:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'ChemiGuard/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlData = await response.text();
    
    // XML을 그대로 반환하거나 JSON으로 변환할 수 있습니다
    res.setHeader('Content-Type', 'application/xml');
    res.send(xmlData);

  } catch (error) {
    console.error('MSDS API 프록시 오류:', error);
    res.status(500).json({ 
      error: '화학물질 목록 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 화학물질 상세정보 조회 프록시
app.get('/api/msds/chemdetail/:detailType', async (req, res) => {
  try {
    const { detailType } = req.params;
    const { chemId } = req.query;
    
    if (!chemId) {
      return res.status(400).json({ error: '화학물질 ID가 필요합니다.' });
    }

    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      chemId: chemId
    });

    const endpoint = `chemdetail${detailType.padStart(2, '0')}`;
    const url = `${MSDS_BASE_URL}/${endpoint}?${params.toString()}`;
    console.log('MSDS API 호출:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'ChemiGuard/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlData = await response.text();
    
    res.setHeader('Content-Type', 'application/xml');
    res.send(xmlData);

  } catch (error) {
    console.error('MSDS API 프록시 오류:', error);
    res.status(500).json({ 
      error: '화학물질 상세정보 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// QA 생성 전용 API
app.post('/api/gemini/generate-qa', async (req, res) => {
  try {
    const { chemical, qaType = 'safety', difficultyLevel = 'general', language = 'ko' } = req.body;
    
    if (!chemical) {
      return res.status(400).json({ error: '화학물질 정보가 필요합니다.' });
    }

    if (!genAI) {
      return res.status(500).json({
        error: 'Google Generative AI 서비스를 사용할 수 없습니다.',
        details: 'Google GenAI가 초기화되지 않았습니다. 설정을 확인해주세요.'
      });
    }

    console.log(`🤖 QA 생성 요청: ${chemical.name} (${qaType}, ${difficultyLevel})`);

    // QA 타입에 따른 전문 프롬프트 생성
    let specificPrompt = '';
    const audienceLevel = {
      general: '일반인',
      professional: '전문가',
      expert: '연구자'
    }[difficultyLevel] || '일반인';

    switch (qaType) {
      case 'safety':
        specificPrompt = `화학물질 ${chemical.name}에 대한 안전성 관련 Q&A를 생성해주세요.

화학물질 정보:
- 물질명: ${chemical.name}
- CAS 번호: ${chemical.casNumber || '정보 없음'}
- 분자식: ${chemical.molecularFormula || '정보 없음'}
- 위험성 분류: ${chemical.hazardClass || '정보 없음'}
- LD50: ${chemical.ld50_value || '정보 없음'}
- GHS 분류: ${chemical.ghs_codes?.join(', ') || '정보 없음'}

작성 지침:
- 대상: ${audienceLevel}
- 질문은 실제 사용자가 안전성에 대해 궁금해할 만한 내용
- 답변은 정확하고 실용적인 안전 정보 제공
- ${difficultyLevel === 'general' ? '이해하기 쉬운 언어' : '전문적이고 기술적인 내용'}로 작성

다음 JSON 형식으로 응답해주세요:
{
  "question": "구체적이고 실용적인 안전성 질문",
  "answer": "상세하고 유용한 안전 정보 및 주의사항"
}`;
        break;

      case 'usage':
        specificPrompt = `화학물질 ${chemical.name}에 대한 사용법 관련 Q&A를 생성해주세요.

화학물질 정보:
- 물질명: ${chemical.name}
- 용도: ${chemical.usage || '정보 없음'}
- 함량: ${chemical.content_percentage || '정보 없음'}
- 제품명: ${chemical.product_name || '정보 없음'}

작성 지침:
- 대상: ${audienceLevel}
- 질문은 제품 사용 시 실제로 도움이 되는 내용
- 답변은 단계별 사용법과 주의사항 포함
- ${difficultyLevel === 'general' ? '일반 사용자가 쉽게 따라할 수 있는' : '전문적이고 정확한'} 내용

다음 JSON 형식으로 응답해주세요:
{
  "question": "실용적인 사용법 질문",
  "answer": "단계별 사용법 및 주의사항"
}`;
        break;

      case 'component':
        specificPrompt = `화학물질 ${chemical.name}에 대한 성분 정보 관련 Q&A를 생성해주세요.

화학물질 정보:
- 물질명: ${chemical.name}
- CAS 번호: ${chemical.casNumber || '정보 없음'}
- 분자식: ${chemical.molecularFormula || '정보 없음'}
- 분자량: ${chemical.molecularWeight || '정보 없음'}
- 물리적 상태: ${chemical.physicalState || '정보 없음'}

작성 지침:
- 대상: ${audienceLevel}
- 질문은 화학물질의 특성이나 성분에 대한 궁금증
- 답변은 화학적 특성과 제품 내 역할 포함
- ${difficultyLevel === 'general' ? '일반인이 이해할 수 있는' : '전문적이고 과학적인'} 설명

다음 JSON 형식으로 응답해주세요:
{
  "question": "성분 특성이나 역할에 대한 질문",
  "answer": "화학적 특성과 제품 내 기능 설명"
}`;
        break;

      case 'regulation':
        specificPrompt = `화학물질 ${chemical.name}에 대한 규제 정보 관련 Q&A를 생성해주세요.

화학물질 정보:
- 물질명: ${chemical.name}
- GHS 분류: ${chemical.ghs_codes?.join(', ') || '정보 없음'}
- 위험 등급: ${chemical.hazardClass || '정보 없음'}

작성 지침:
- 대상: ${audienceLevel}
- 질문은 법적 규제나 관리 기준에 대한 내용
- 답변은 국내 법규와 관리 방안 포함
- ${difficultyLevel === 'general' ? '일반인도 알아야 할 기본적인' : '상세하고 전문적인'} 규제 정보

다음 JSON 형식으로 응답해주세요:
{
  "question": "규제나 법적 기준에 대한 질문",
  "answer": "관련 법규와 관리 기준 설명"
}`;
        break;

      default:
        specificPrompt = `화학물질 ${chemical.name}에 대한 Q&A를 생성해주세요.`;
    }

    const apiRequest = {
      model: 'gemini-2.5-pro-preview-06-05',
      contents: [
        {
          role: 'user',
          parts: [{ text: specificPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.9,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'OFF',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'OFF',
          }
        ]
      }
    };

    console.log('🚀 Google GenAI QA 생성 요청 전송 중...');
    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('✅ QA 생성 완료 - 응답 길이:', responseText.length);
    
    // JSON 파싱 시도
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.log('⚠️ JSON 파싱 실패, 텍스트로 처리');
      parsedResponse = {
        question: `${chemical.name}에 대한 ${qaType} 관련 질문`,
        answer: responseText.trim()
      };
    }
    
    return res.json({
      success: true,
      result: parsedResponse,
      metadata: {
        chemical: chemical.name,
        qaType,
        difficultyLevel,
        generatedAt: new Date().toISOString(),
        model: 'gemini-2.5-pro'
      },
      source: 'google-generative-ai'
    });

  } catch (error) {
    console.error('💥 QA 생성 오류:', error);
    res.status(500).json({
      error: 'QA 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 질문만 생성하는 API
app.post('/api/gemini/generate-question', async (req, res) => {
  try {
    const { chemical, qaType = 'safety', difficultyLevel = 'general', language = 'ko' } = req.body;
    
    if (!chemical) {
      return res.status(400).json({ error: '화학물질 정보가 필요합니다.' });
    }

    if (!genAI) {
      return res.status(500).json({
        error: 'Google Generative AI 서비스를 사용할 수 없습니다.',
        details: 'Google GenAI가 초기화되지 않았습니다.'
      });
    }

    console.log(`❓ 질문 생성 요청: ${chemical.name} (${qaType})`);

    const audienceLevel = {
      general: '일반인',
      professional: '전문가',
      expert: '연구자'
    }[difficultyLevel] || '일반인';

    const questionPrompt = `화학물질 "${chemical.name}"에 대한 ${qaType === 'safety' ? '안전성' : qaType === 'usage' ? '사용법' : qaType === 'component' ? '성분 정보' : '규제 정보'} 관련 질문을 하나 생성해주세요.

화학물질 정보:
- 이름: ${chemical.name}
- CAS 번호: ${chemical.casNumber || '정보 없음'}
- 용도: ${chemical.usage || '정보 없음'}

질문은 ${audienceLevel}이 궁금해할 만한 실용적인 내용이어야 합니다.
질문만 반환해주세요 (다른 텍스트는 포함하지 마세요).`;

    const apiRequest = {
      model: 'gemini-2.5-pro-preview-06-05',
      contents: [
        {
          role: 'user',
          parts: [{ text: questionPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 1024,
        temperature: 0.8,
        topP: 0.9
      }
    };

    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('✅ 질문 생성 완료');
    
    return res.json({
      success: true,
      result: {
        question: responseText.trim()
      },
      source: 'google-generative-ai'
    });

  } catch (error) {
    console.error('💥 질문 생성 오류:', error);
    res.status(500).json({
      error: '질문 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 답변만 생성하는 API
app.post('/api/gemini/generate-answer', async (req, res) => {
  try {
    const { chemical, question, qaType = 'safety', difficultyLevel = 'general', language = 'ko' } = req.body;
    
    if (!chemical || !question) {
      return res.status(400).json({ error: '화학물질 정보와 질문이 필요합니다.' });
    }

    if (!genAI) {
      return res.status(500).json({
        error: 'Google Generative AI 서비스를 사용할 수 없습니다.',
        details: 'Google GenAI가 초기화되지 않았습니다.'
      });
    }

    console.log(`💬 답변 생성 요청: ${chemical.name}, 질문: ${question.substring(0, 50)}...`);

    const audienceLevel = {
      general: '일반인',
      professional: '전문가',
      expert: '연구자'
    }[difficultyLevel] || '일반인';

    const answerPrompt = `다음 질문에 대해 ${audienceLevel}을 대상으로 정확하고 유용한 답변을 작성해주세요.

질문: ${question}

화학물질 정보:
- 이름: ${chemical.name}
- CAS 번호: ${chemical.casNumber || '정보 없음'}
- 분자식: ${chemical.molecularFormula || '정보 없음'}
- 용도: ${chemical.usage || '정보 없음'}
- LD50: ${chemical.ld50_value || '정보 없음'}
- GHS 분류: ${chemical.ghs_codes?.join(', ') || '정보 없음'}
- 위험 등급: ${chemical.hazardClass || '정보 없음'}
- 제품 내 함량: ${chemical.content_percentage || '정보 없음'}

작성 지침:
- ${difficultyLevel === 'general' ? '이해하기 쉽고 실용적인' : '전문적이고 정확한'} 답변을 작성해주세요.
- 제공된 화학물질 정보를 기반으로 답변하세요.
- 안전 관련 내용은 반드시 포함해주세요.
- 3-5문단으로 구성해주세요.

답변만 반환해주세요.`;

    const apiRequest = {
      model: 'gemini-2.5-pro-preview-06-05',
      contents: [
        {
          role: 'user',
          parts: [{ text: answerPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 4096,
        temperature: 0.5,
        topP: 0.9
      }
    };

    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('✅ 답변 생성 완료');
    
    return res.json({
      success: true,
      result: {
        answer: responseText.trim()
      },
      source: 'google-generative-ai'
    });

  } catch (error) {
    console.error('💥 답변 생성 오류:', error);
    res.status(500).json({
      error: '답변 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});
// API 상태 확인 엔드포인트
app.get('/api/gemini/status', (req, res) => {
  res.json({
    success: true,
    genAI: !!genAI,
    timestamp: new Date().toISOString(),
    model: 'gemini-2.5-pro-preview-06-05'
  });
});

// 정적 파일 서빙 (React 빌드 파일)
app.use(express.static(path.join(__dirname, '../build')));

// React 라우팅을 위한 catch-all 핸들러
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`MSDS API Key: ${SERVICE_KEY ? '설정됨' : '설정되지 않음'}`);
  console.log(`Gemini API Key: ${GEMINI_API_KEY ? '설정됨' : '설정되지 않음'}`);
  console.log(`Google GenAI: ${genAI ? '사용 가능' : '사용 불가'}`);
});
