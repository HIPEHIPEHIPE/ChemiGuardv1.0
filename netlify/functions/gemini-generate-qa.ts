// Netlify Functions 타입 정의
interface NetlifyEvent {
  httpMethod: string;
  path: string;
  queryStringParameters?: { [key: string]: string } | null;
  headers: { [key: string]: string };
  body?: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: { [key: string]: string };
  body: string;
  isBase64Encoded?: boolean;
}

type Handler = (event: NetlifyEvent) => Promise<NetlifyResponse>;

const { GoogleGenAI } = require('@google/genai');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'global';
const GCP_CREDS_BASE64 = process.env.GCP_CREDS_BASE64;

let genAI: any;

async function initializeGenAI() {
  if (genAI) return;

  console.log('=== Google GenAI 초기화 시작 ===');
  console.log(`PROJECT_ID: ${PROJECT_ID}`);
  console.log(`GCP_CREDS_BASE64 exists: ${!!GCP_CREDS_BASE64}`);
  
  if (!PROJECT_ID) {
    console.error('❌ PROJECT_ID가 없습니다!');
    return;
  }
  
  if (!GCP_CREDS_BASE64) {
    console.error('❌ GCP_CREDS_BASE64가 없습니다!');
    return;
  }

  try {
    console.log('🔑 Base64 디코딩 시작...');
    
    // Base64 디코딩하여 서비스 계정 키 파싱
    const credentialsJson = Buffer.from(GCP_CREDS_BASE64, 'base64').toString('utf-8');
    console.log('🔑 Base64 디코딩 완료, JSON 파싱 시작...');
    
    const credentials = JSON.parse(credentialsJson);
    
    console.log('🔑 서비스 계정 키 디코딩 완료');
    console.log(`Client Email: ${credentials.client_email}`);
    
    console.log('🔐 JWT 클라이언트 생성 시작...');
    
    // JWT 클라이언트 직접 생성
    const jwtClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    console.log('🔐 JWT 클라이언트 생성 완료');
    
    console.log('🔐 JWT 인증 시작...');
    
    // JWT 토큰 획득 테스트
    await jwtClient.authorize();
    console.log('✅ JWT 인증 성공');
    
    // 임시 파일로 인증 정보 저장
    const tmpDir = os.tmpdir();
    const credentialsPath = path.join(tmpDir, 'gcp-credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials));
    
    // 환경 변수로 Google 인증 정보 설정
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
    process.env.GOOGLE_CLOUD_LOCATION = LOCATION;
    
    console.log('🔧 임시 파일 생성 및 환경 변수 설정 완료');
    
    console.log('🚀 GoogleGenAI 인스턴스 생성 시작...');
    
    genAI = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION
    });
    
    console.log('✅ Google GenAI 초기화 완료');
  } catch (error) {
    console.error('❌ Google GenAI 초기화 실패:', error);
    console.error('에러 상세:', error.message);
  }
}

export const handler: Handler = async (event) => {
  console.log('Gemini QA 생성 함수 호출!');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    await initializeGenAI();

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { chemical, qaType = 'safety', difficultyLevel = 'general' } = JSON.parse(event.body || '{}');
    
    if (!chemical) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '화학물질 정보가 필요합니다.' })
      };
    }

    if (!genAI) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Google GenAI 서비스를 사용할 수 없습니다.',
          details: 'Google GenAI가 초기화되지 않았습니다.'
        })
      };
    }

    console.log(`🤖 QA 생성 요청: ${chemical.name} (${qaType})`);

    const audienceLevel = difficultyLevel === 'general' ? '일반인' : '전문가';
    
    const specificPrompt = `화학물질 ${chemical.name}에 대한 안전성 관련 Q&A를 생성해주세요.

화학물질 정보:
- 물질명: ${chemical.name}
- CAS 번호: ${chemical.casNumber || '정보 없음'}

작성 지침:
- 대상: ${audienceLevel}
- 질문은 실제 사용자가 안전성에 대해 궁금해할 만한 내용
- 답변은 정확하고 실용적인 안전 정보 제공

다음 JSON 형식으로 응답해주세요:
{
  "question": "구체적이고 실용적인 안전성 질문",
  "answer": "상세하고 유용한 안전 정보 및 주의사항"
}`;

    const apiRequest = {
      model: 'gemini-2.0-flash-lite-001',  // GCP에서 확인된 정확한 모델명
      contents: [
        {
          role: 'user',
          parts: [{ text: specificPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 512,     // Flash Lite에 적합한 길이
        temperature: 0.5,
        topP: 0.9
      }
    };

    console.log('🚀 Google GenAI QA 생성 요청 전송 중...');
    
    // 타임아웃 대비책 - 8초 내에 응답 없으면 부분 결과라도 반환
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('QA 생성 시간 초과 (8초)')), 8000)
    );
    
    const aiRequest = genAI.models.generateContentStream(apiRequest);
    
    const streamingResp = await Promise.race([aiRequest, timeout]);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('✅ QA 생성 완료');
    
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
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
      })
    };

  } catch (error) {
    console.error('💥 QA 생성 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'QA 생성 중 오류가 발생했습니다.',
        details: (error as Error).message
      })
    };
  }
};
