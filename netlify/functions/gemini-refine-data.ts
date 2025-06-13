// Netlify Functions 타입 정의
interface NetlifyEvent {
  httpMethod: string;
  path: string;
  queryStringParameters?: { [key: string]: string } | null;
  headers: { [key: string]: string };
  body?: string | null;
  isBase64Encoded: boolean;
}

interface NetlifyContext {
  callbackWaitsForEmptyEventLoop: boolean;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: { [key: string]: string };
  body: string;
  isBase64Encoded?: boolean;
}

type Handler = (event: NetlifyEvent, context: NetlifyContext) => Promise<NetlifyResponse>;

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

export const handler: Handler = async (event, context) => {
  console.log('Gemini refine-data function called!');
  
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // OPTIONS 요청 처리
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

    const { data, prompt = '다음 데이터를 정제하고 구조화해주세요:' } = JSON.parse(event.body || '{}');
    
    if (!data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '정제할 데이터가 필요합니다.' })
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

    console.log('🤖 데이터 정제 요청:', typeof data === 'object' ? data.name || 'Unknown' : 'Text data');

    // 프롬프트 간소화 - 응답 속도 최적화
    const fullPrompt = data.name 
      ? `${prompt}\n\n화학물질: ${data.name}
CAS: ${data.casNumber || '정보 없음'}
분자식: ${data.molecularFormula || '정보 없음'}`
      : `${prompt}\n\n${JSON.stringify(data, null, 2)}`;

    const apiRequest = {
      model: 'gemini-2.5-pro-preview-06-05',
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 1024,    // 대폭 줄임 (원래 65535) - 응답 속도 최적화
        temperature: 0.7,         // 줄임 (원래 1)
        topP: 0.9                 // 줄임 (원래 1)
      }
    };

    console.log('🚀 Gemini 데이터 정제 요청 전송 중...');
    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('✅ 데이터 정제 완료');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        result: responseText,
        source: 'google-generative-ai'
      })
    };

  } catch (error) {
    console.error('💥 데이터 정제 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '데이터 정제 중 오류가 발생했습니다.',
        details: (error as Error).message
      })
    };
  }
};