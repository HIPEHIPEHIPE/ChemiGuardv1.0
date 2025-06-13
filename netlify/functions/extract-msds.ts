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
  console.log('=== MSDS PDF 분석 함수 호출 ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Body length:', event.body ? event.body.length : 0);
  
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

    const { fileData, fileName } = JSON.parse(event.body || '{}');
    
    console.log(`파일명: ${fileName}`);
    console.log(`파일 데이터 크기: ${fileData ? fileData.length : 0} bytes`);
    console.log(`Google GenAI 사용 가능: ${genAI ? 'YES' : 'NO'}`);
    
    if (!fileData || !fileName) {
      console.log('❌ 파일 데이터 또는 파일명 누락');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'PDF 파일 데이터와 파일명이 필요합니다.' })
      };
    }

    // Google GenAI가 초기화되지 않은 경우 실패
    if (!genAI) {
      console.log('❌ Google GenAI가 초기화되지 않았습니다.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Google GenAI 서비스를 사용할 수 없습니다.',
          details: 'Google GenAI가 초기화되지 않았습니다. 설정을 확인해주세요.'
        })
      };
    }

    const prompt = `이 MSDS PDF에서 핵심 정보만 간단히 추출해주세요. 10초 내에 완료해야 합니다.

다음 JSON 형식으로 응답:
{
  "productInfo": {
    "productName": "제품명",
    "manufacturer": "제조사"
  },
  "composition": [
    {
      "substanceName": "화학물질명",
      "casNumber": "CAS번호",
      "percentage": "함유량"
    }
  ],
  "hazardInfo": {
    "ghs_classification": "GHS 분류",
    "signalWord": "신호어"
  }
}

정보가 없으면 빈 문자열("")을 사용하세요.`;

    console.log('🔄 Google GenAI로 PDF 분석 시도...');
    
    // Gemini Pro Vision 사용 (PDF 분석에 적합)
    const modelName = 'gemini-2.0-flash-lite-001';
    
    // Flash Lite에 적합한 설정
    const generationConfig = {
      maxOutputTokens: 4096,  // Flash Lite 제한에 맞춤
      temperature: 0.5,
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
    
    // Netlify 무료 계정 제한 (10초) 고려한 타임아웃
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PDF 분석 시간 초과 (8초)')), 8000)
    );
    
    const aiRequest = genAI.models.generateContentStream(apiRequest);
    const streamingResp = await Promise.race([aiRequest, timeout]);
    
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
    let extractedData;
    try {
      // JSON 코드 블록 제거
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```$/, '');
      }
      
      extractedData = JSON.parse(cleanedResponse);
      console.log('✅ JSON 파싱 성공');
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      // 기본 구조 반환 (간소화된 버전)
      extractedData = {
        productInfo: {
          productName: fileName.replace('.pdf', ''),
          manufacturer: ''
        },
        composition: [],
        hazardInfo: {
          ghs_classification: '',
          signalWord: ''
        }
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
        data: extractedData,
        fileName: fileName,
        source: 'google-generative-ai'
      })
    };

  } catch (error) {
    console.error('💥 MSDS PDF 분석 최종 오류:', error);
    console.error('오류 스택:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'PDF 분석 중 오류가 발생했습니다.',
        details: (error as Error).message
      })
    };
  }
};
