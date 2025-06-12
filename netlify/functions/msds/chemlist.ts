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

const MSDS_BASE_URL = 'https://msds.kosha.or.kr/openapi/service/msdschem';
const SERVICE_KEY = process.env.REACT_APP_MSDS_API_KEY;

export const handler: Handler = async (event, context) => {
  console.log('MSDS chemlist function called:', event.path, event.queryStringParameters);
  
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
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const params = event.queryStringParameters || {};
    const { searchWrd, searchCnd = '0', pageNo = '1', numOfRows = '10' } = params;
    
    if (!searchWrd) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'searchWrd query parameter required' })
      };
    }
    
    if (!SERVICE_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'MSDS API key not configured' })
      };
    }

    const url = `${MSDS_BASE_URL}/getMsdsChemList?serviceKey=${SERVICE_KEY}&searchWrd=${encodeURIComponent(searchWrd)}&searchCnd=${searchCnd}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=json`;
    
    console.log('Fetching URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MSDS API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('MSDS API response received');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
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
