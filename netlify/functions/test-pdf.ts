// 간단한 PDF 테스트 함수
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

export const handler: Handler = async (event) => {
  console.log('=== PDF 테스트 함수 호출 ===');
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
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'PDF 테스트 함수가 성공적으로 작동합니다!',
          timestamp: new Date().toISOString()
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const { fileData, fileName } = JSON.parse(event.body || '{}');
      
      console.log(`파일명: ${fileName}`);
      console.log(`파일 데이터 크기: ${fileData ? fileData.length : 0} bytes`);
      
      // 간단한 모의 응답
      const mockData = {
        productInfo: {
          productName: fileName ? fileName.replace('.pdf', '') : '테스트 제품',
          manufacturer: '테스트 제조사'
        },
        composition: [
          {
            substanceName: '테스트 화학물질',
            casNumber: '123-45-6',
            percentage: '50-60%'
          }
        ],
        hazardInfo: {
          ghs_classification: '테스트 분류',
          signalWord: '경고'
        }
      };

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: mockData,
          fileName: fileName,
          source: 'test-function'
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('💥 테스트 함수 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '테스트 함수 오류',
        details: (error as Error).message
      })
    };
  }
};
