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

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'global';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

let genAI: any;

async function initializeGenAI() {
  if (genAI) return;

  console.log('=== Google GenAI 초기화 시작 ===');
  console.log(`PROJECT_ID: ${PROJECT_ID}`);

  if (PROJECT_ID) {
    try {
      if (CREDENTIALS_PATH) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = CREDENTIALS_PATH;
      }
      
      genAI = new GoogleGenAI({
        vertexai: true,
        project: PROJECT_ID,
        location: LOCATION
      });
      
      console.log('✅ Google GenAI 초기화 완료');
    } catch (error) {
      console.error('❌ Google GenAI 초기화 실패:', error);
    }
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
