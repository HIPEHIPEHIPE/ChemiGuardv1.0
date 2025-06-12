// MSDS 패턴을 따른 간단한 GenAI 함수
interface NetlifyEvent {
  httpMethod: string;
  body?: string | null;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: { [key: string]: string };
  body: string;
}

type Handler = (event: NetlifyEvent) => Promise<NetlifyResponse>;

const { GoogleGenAI } = require('@google/genai');

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'global';

let genAI: any;

async function initializeGenAI() {
  if (genAI) return;

  console.log('=== Google GenAI 초기화 시작 ===');
  console.log(`PROJECT_ID: ${PROJECT_ID}`);
  console.log(`LOCATION: ${LOCATION}`);

  if (PROJECT_ID) {
    try {
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

export const handler: Handler = async (event) => {
  console.log('🧪 GenAI 테스트 함수 호출!');
  
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

    // GET 요청 - 상태 확인
    if (event.httpMethod === 'GET') {
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
          timestamp: new Date().toISOString()
        })
      };
    }

    // POST 요청 - 실제 AI 테스트
    if (event.httpMethod === 'POST') {
      if (!genAI) {
        return {
          statusCode: 500,
          headers,
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
          message: 'GenAI 테스트 성공!'
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('💥 GenAI 테스트 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'GenAI 테스트 실패',
        details: (error as Error).message
      })
    };
  }
};
