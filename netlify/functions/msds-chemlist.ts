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

import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

const MSDS_BASE_URL = 'https://msds.kosha.or.kr/openapi/service/msdschem';
const SERVICE_KEY = process.env.REACT_APP_MSDS_API_KEY;

export const handler: Handler = async (event, context) => {
  console.log('MSDS chemlist function called!');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Query params:', event.queryStringParameters);
  console.log('SERVICE_KEY exists:', !!SERVICE_KEY);
  
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    console.log('OPTIONS request received');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'GET') {
      console.log('Method not allowed:', event.httpMethod);
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const params = event.queryStringParameters || {};
    const { searchWrd, searchCnd = '0', pageNo = '1', numOfRows = '10' } = params;
    
    console.log('Extracted params:', { searchWrd, searchCnd, pageNo, numOfRows });
    
    if (!searchWrd) {
      console.log('Missing searchWrd parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'searchWrd query parameter required' })
      };
    }
    
    if (!SERVICE_KEY) {
      console.log('Missing SERVICE_KEY');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'MSDS API key not configured' })
      };
    }

    const url = `${MSDS_BASE_URL}/chemlist?serviceKey=${SERVICE_KEY}&searchWrd=${encodeURIComponent(searchWrd)}&searchCnd=${searchCnd}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
    
    console.log('Fetching MSDS API...');
    console.log('URL (without key):', url.replace(SERVICE_KEY, '[HIDDEN]'));
    
    const response = await fetch(url);
    
    console.log('MSDS API response status:', response.status);
    console.log('MSDS API response headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('MSDS API error response:', errorText);
      throw new Error(`MSDS API responded with status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log('MSDS API XML response (first 500 chars):', xmlText.substring(0, 500));
    
    try {
      // XML을 JSON으로 변환
      const jsonData = await parseStringPromise(xmlText, {
        explicitArray: false,
        ignoreAttrs: false,
        mergeAttrs: true
      });
      
      console.log('✅ XML을 JSON으로 변환 완료');
      
      // JSON으로 응답
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: jsonData,
          source: 'msds-api'
        })
      };
      
    } catch (xmlParseError) {
      console.log('⚠️ XML 파싱 실패, 원본 XML 반환');
      // XML 파싱 실패시 원본 XML 반환
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/xml'
        },
        body: xmlText
      };
    }
    
  } catch (error) {
    console.error('MSDS chemlist error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'MSDS chemlist error', 
        details: (error as Error).message 
      })
    };
  }
};
