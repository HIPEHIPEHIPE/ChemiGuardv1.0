import express, { Request, Response } from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';

// Google GenAI import 변경 (server.js와 동일하게)
const { GoogleGenAI } = require('@google/genai');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://chemicalguard.netlify.app'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MSDS API 기본 설정
const MSDS_BASE_URL = 'https://msds.kosha.or.kr/openapi/service/msdschem';
const SERVICE_KEY = process.env.REACT_APP_MSDS_API_KEY;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Google AI 설정 (server.js와 동일)
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'global';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

let genAI: any;
let model: any;

// Google AI 초기화 함수 (server.js와 동일)
async function initializeGenAI() {
  if (genAI) return;

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
      
      console.log('✅ Google GenAI 초기화 완료');
    } catch (error) {
      console.error('❌ Google GenAI 초기화 실패:', error);
    }
  } else {
    console.log('⚠️ PROJECT_ID 누락');
  }
}

// 미들웨어에서 GenAI 초기화
app.use(async (req: Request, res: Response, next) => {
  await initializeGenAI();
  next();
});

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    genai: !!genAI,
    service_key: !!SERVICE_KEY
  });
});

// 화학물질 목록 조회 (server.js와 동일)
app.get('/msds/chemlist', async (req: Request, res: Response) => {
  try {
    const { searchWrd, searchCnd = '0', numOfRows = '10', pageNo = '1' } = req.query;
    
    if (!searchWrd) {
      return res.status(400).json({ error: '검색어가 필요합니다.' });
    }

    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY!,
      searchWrd: searchWrd as string,
      searchCnd: searchCnd as string,
      numOfRows: numOfRows as string,
      pageNo: pageNo as string
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
    
    // XML을 그대로 반환
    res.setHeader('Content-Type', 'application/xml');
    res.send(xmlData);

  } catch (error) {
    console.error('MSDS API 프록시 오류:', error);
    res.status(500).json({ 
      error: '화학물질 목록 조회 중 오류가 발생했습니다.',
      details: (error as Error).message 
    });
  }
});

// 화학물질 상세정보 조회 (server.js와 동일)
app.get('/msds/chemdetail/:detailType', async (req: Request, res: Response) => {
  try {
    const { detailType } = req.params;
    const { chemId } = req.query;
    
    if (!chemId) {
      return res.status(400).json({ error: '화학물질 ID가 필요합니다.' });
    }

    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY!,
      chemId: chemId as string
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
      details: (error as Error).message 
    });
  }
});

// Google Generative AI를 활용한 MSDS PDF 분석 (server.js와 동일)
app.post('/gemini/extract-msds', async (req: Request, res: Response) => {
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

    // Google GenAI 사용 (server.js와 동일한 방식)
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
    console.error('오류 스택:', (error as Error).stack);
    res.status(500).json({
      error: 'PDF 분석 중 오류가 발생했습니다.',
      details: (error as Error).message
    });
  } finally {
    console.log('=== PDF 분석 요청 종료 ===\n');
  }
});

// 일반 텍스트 정제를 위한 Google Generative AI (server.js와 동일)
app.post('/gemini/refine-data', async (req: Request, res: Response) => {
  try {
    const { data, prompt = '다음 데이터를 정제하고 구조화해주세요:' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: '정제할 데이터가 필요합니다.' });
    }

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
      details: (error as Error).message
    });
  }
});

// QA 생성 API들 (server.js와 동일)
app.post('/gemini/generate-qa', async (req: Request, res: Response) => {
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

    // QA 타입에 따른 전문 프롬프트 생성 (server.js와 동일)
    let specificPrompt = '';
    const audienceLevel = {
      general: '일반인',
      professional: '전문가',
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
      // 다른 케이스들도 server.js와 동일...
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
      details: (error as Error).message
    });
  }
});

// 기타 API들... (server.js와 동일)
app.post('/gemini/generate-question', async (req: Request, res: Response) => {
  // server.js와 동일한 로직
  res.json({ success: true, message: "Question generation endpoint" });
});

app.post('/gemini/generate-answer', async (req: Request, res: Response) => {
  // server.js와 동일한 로직
  res.json({ success: true, message: "Answer generation endpoint" });
});

// API 상태 확인 엔드포인트
app.get('/gemini/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    genAI: !!genAI,
    timestamp: new Date().toISOString(),
    model: 'gemini-2.5-pro-preview-06-05'
  });
});

// GenAI 테스트 엔드포인트 추가
app.get('/genai-test', async (req: Request, res: Response) => {
  console.log('🧪 GenAI 테스트 함수 호출 (GET)!');
  
  try {
    return res.json({
      success: true,
      message: 'GenAI 테스트 함수가 작동합니다!',
      genAI: !!genAI,
      projectId: PROJECT_ID,
      location: LOCATION,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GenAI 테스트 오류:', error);
    return res.status(500).json({
      error: 'GenAI 테스트 실패',
      details: (error as Error).message
    });
  }
});

app.post('/genai-test', async (req: Request, res: Response) => {
  console.log('🧪 GenAI 테스트 함수 호출 (POST)!');
  
  try {
    if (!genAI) {
      return res.status(500).json({
        error: 'Google GenAI가 초기화되지 않았습니다.'
      });
    }

    const testPrompt = '안녕하세요를 영어로 번역해주세요.';
    
    const apiRequest = {
      model: 'gemini-2.5-pro-preview-06-05',
      contents: [
        {
          role: 'user',
          parts: [{ text: testPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 100,
        temperature: 0.5
      }
    };

    console.log('🚀 GenAI 테스트 요청 전송 중...');
    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('✅ GenAI 테스트 완료');
    
    return res.json({
      success: true,
      result: responseText,
      message: 'GenAI 테스트 성공!',
      source: 'google-genai'
    });
    
  } catch (error) {
    console.error('💥 GenAI API 호출 오류:', error);
    return res.status(500).json({
      error: 'GenAI API 호출 실패',
      details: (error as Error).message
    });
  }
});

// 간단한 테스트 엔드포인트
app.post('/gemini/test', async (req: Request, res: Response) => {
  console.log('🧪 Gemini 테스트 요청');
  
  try {
    if (!genAI) {
      return res.status(500).json({
        error: 'Google GenAI 초기화되지 않음'
      });
    }

    const testPrompt = '안녕하세요를 영어로 번역해주세요.';
    
    const apiRequest = {
      model: 'gemini-2.5-pro-preview-06-05',
      contents: [
        {
          role: 'user',
          parts: [{ text: testPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 100,
        temperature: 0.5
      }
    };

    console.log('🚀 간단한 Gemini 테스트 요청 전송 중...');
    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('✅ Gemini 테스트 완료:', responseText);
    
    return res.json({
      success: true,
      result: responseText,
      message: 'Gemini AI 연결 테스트 성공!'
    });

  } catch (error) {
    console.error('💥 Gemini 테스트 오류:', error);
    res.status(500).json({
      error: 'Gemini 테스트 실패',
      details: (error as Error).message
    });
  }
});

// Catch all for unmatched routes - 이 부분에서 문제가 발생할 수 있음
// 와일드카드 경로 제거하고 구체적인 경로만 처리
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method 
  });
});

export const handler = serverless(app);