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

export const handler: Handler = async (event, context) => {
  console.log('Env check function called!');
  
  const envVars = {
    REACT_APP_MSDS_API_KEY: !!process.env.REACT_APP_MSDS_API_KEY,
    REACT_APP_GEMINI_API_KEY: !!process.env.REACT_APP_GEMINI_API_KEY,
    GCP_PROJECT_ID: !!process.env.GCP_PROJECT_ID,
    GCP_LOCATION: !!process.env.GCP_LOCATION,
    NODE_ENV: process.env.NODE_ENV
  };
  
  console.log('Environment variables:', envVars);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      message: 'Environment check complete',
      environment: envVars,
      timestamp: new Date().toISOString()
    })
  };
};
