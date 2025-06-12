// 디버깅용 상세 테스트 함수
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
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

let genAI: any;

async function initializeGenAI() {
  if (genAI) return;

  console.log('=== 디버깅: Google GenAI 초기화 시작 ===');
  console.log(`PROJECT_ID: ${PROJECT_ID}`);
  console.log(`LOCATION: ${LOCATION}`);
  console.log(`CREDENTIALS_PATH: ${CREDENTIALS_PATH}`);

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
      console.log('genAI 객체 타입:', typeof genAI);
      console.log('genAI.models 존재:', !!genAI.models);
      
      return true;
    } catch (error) {
      console.error('❌ Google GenAI 초기화 실패:', error);
      console.error('오류 상세:', error.message);
      console.error('오류 스택:', error.stack);
      return false;
    }
  } else {
    console.error('❌ PROJECT_ID가 설정되지 않음');
    return false;
  }
}

export const handler: Handler = async (event) => {
  console.log('🔍 디버깅 테스트 함수 시작');
  
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
    const initSuccess = await initializeGenAI();
    
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
          message: '디버깅 테스트 함수 실행',
          initSuccess,
          genAIAvailable: !!genAI,
          genAIType: typeof genAI,
          hasModels: !!genAI?.models,
          environmentVars: {
            PROJECT_ID: !!PROJECT_ID,
            LOCATION,
            CREDENTIALS_PATH: !!CREDENTIALS_PATH
          },
          timestamp: new Date().toISOString()
        })
      };
    }

    // POST 요청 - 실제 AI 호출 테스트
    if (event.httpMethod === 'POST') {
      if (!genAI) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Google GenAI가 초기화되지 않았습니다.',
            initSuccess
          })
        };
      }

      console.log('🚀 실제 AI 호출 테스트 시작');
      
      const testPrompt = '안녕하세요를 영어로 번역해주세요. 간단히 답해주세요.';
      
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

      console.log('API 요청 객체:', JSON.stringify(apiRequest, null, 2));

      try {
        console.log('genAI.models.generateContentStream 호출 중...');
        const streamingResp = await genAI.models.generateContentStream(apiRequest);
        
        console.log('스트리밍 응답 수신 중...');
        let responseText = '';
        let chunkCount = 0;
        
        for await (const chunk of streamingResp) {
          chunkCount++;
          console.log(`청크 ${chunkCount}:`, chunk);
          if (chunk.text) {
            responseText += chunk.text;
          }
        }
        
        console.log('✅ AI 호출 성공');
        console.log('최종 응답:', responseText);
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            result: responseText,
            chunkCount,
            message: 'AI 호출 테스트 성공!'
          })
        };
        
      } catch (apiError) {
        console.error('💥 AI 호출 중 오류:', apiError);
        console.error('오류 타입:', typeof apiError);
        console.error('오류 메시지:', apiError.message);
        console.error('오류 스택:', apiError.stack);
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'AI 호출 실패',
            details: apiError.message,
            errorType: typeof apiError,
            stack: apiError.stack?.substring(0, 500) // 스택을 일부만 포함
          })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('💥 전체 함수 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '함수 실행 실패',
        details: (error as Error).message
      })
    };
  }
};
