// MSDS 패턴을 정확히 따른 GenAI 테스트 함수
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
  console.log('🔍 initializeGenAI 함수 진입!');
  
  if (genAI) {
    console.log('ℹ️ genAI 이미 초기화됨, 스킵');
    return;
  }

  console.log('=== Google GenAI 초기화 시작 ===');
  console.log(`PROJECT_ID: ${PROJECT_ID}`);
  console.log(`LOCATION: ${LOCATION}`);
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
    console.log(`Project ID from creds: ${credentials.project_id}`);
    
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
    console.log(`인증 파일 경로: ${credentialsPath}`);
    
    console.log('🚀 GoogleGenAI 인스턴스 생성 시작...');
    
    genAI = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION
      // credentials 제거 - 환경 변수 사용
    });
    
    console.log('✅ Google GenAI 초기화 완료');
  } catch (error) {
    console.error('❌ Google GenAI 초기화 실패:', error);
    console.error('에러 상세:', error.message);
    console.error('에러 스택:', error.stack);
  }
}

export const handler: Handler = async (event, context) => {
  console.log('GenAI test function called!');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('PROJECT_ID exists:', !!PROJECT_ID);
  console.log('GCP_CREDS_BASE64 exists:', !!GCP_CREDS_BASE64);
  
  console.log('🚀 initializeGenAI 호출 시작...');
  
  try {
    await initializeGenAI();
    console.log('✅ initializeGenAI 완료');
  } catch (error) {
    console.error('❌ initializeGenAI 에러:', error);
  }
  
  console.log('🔄 CORS 헤더 설정 시작...');
  
  // CORS 헤더 (msds-chemlist와 동일)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // OPTIONS 요청 처리 (msds-chemlist와 동일)
  if (event.httpMethod === 'OPTIONS') {
    console.log('OPTIONS request received');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // GET 요청 - 상태 확인
    if (event.httpMethod === 'GET') {
      console.log('GET request - status check');
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'GenAI 테스트 함수가 작동합니다!',
          genAI: !!genAI,
          projectId: PROJECT_ID,
          location: LOCATION,
          timestamp: new Date().toISOString()
        })
      };
    }

    // POST 요청 - 실제 AI 테스트
    if (event.httpMethod === 'POST') {
      console.log('POST request - AI test');
      
      if (!genAI) {
        console.log('GenAI not initialized');
        return {
          statusCode: 500,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Google GenAI가 초기화되지 않았습니다.'
          })
        };
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
      
      try {
        const streamingResp = await genAI.models.generateContentStream(apiRequest);
        
        let responseText = '';
        for await (const chunk of streamingResp) {
          if (chunk.text) {
            responseText += chunk.text;
          }
        }
        
        console.log('✅ GenAI 테스트 완료');
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            result: responseText,
            message: 'GenAI 테스트 성공!',
            source: 'google-genai'
          })
        };
        
      } catch (apiError) {
        console.error('💥 GenAI API 호출 오류:', apiError);
        return {
          statusCode: 500,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'GenAI API 호출 실패',
            details: (apiError as Error).message
          })
        };
      }
    }

    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('GenAI test error:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'GenAI test error', 
        details: (error as Error).message 
      })
    };
  }
};
