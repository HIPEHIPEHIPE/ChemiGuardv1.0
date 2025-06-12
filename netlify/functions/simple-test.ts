// 가장 간단한 테스트 함수
interface NetlifyEvent {
  httpMethod: string;
  body?: string | null;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: { [key: string]: string };
  body: string;
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  console.log('🧪 간단한 테스트 함수 실행!');
  
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
    const requestData = event.body ? JSON.parse(event.body) : {};
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: '테스트 함수가 정상 작동합니다!',
        timestamp: new Date().toISOString(),
        requestData: requestData
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '테스트 함수 오류',
        details: (error as Error).message
      })
    };
  }
};
