import express, { Request, Response } from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://chemicalguard.netlify.app'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const MSDS_BASE_URL = 'https://msds.kosha.or.kr/openapi/service/msdschem';
const SERVICE_KEY = process.env.REACT_APP_MSDS_API_KEY;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'global';

let genAI: GoogleGenerativeAI | null = null;

// Debug logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.query, req.body);
  next();
});

async function initializeGenAI() {
  if (genAI) return;

  console.log('=== Google GenAI 초기화 시작 ===');
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your-actual-api-key-here') {
    try {
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      console.log('✅ Google GenAI 초기화 완료');
    } catch (error) {
      console.error('❌ Google GenAI 초기화 실패:', error);
      genAI = null;
    }
  } else {
    console.log('⚠️ GEMINI_API_KEY 누락 또는 기본값');
    genAI = null;
  }
}

app.use(async (req: Request, res: Response, next) => {
  await initializeGenAI();
  next();
});

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    genai: !!genAI,
    service_key: !!SERVICE_KEY
  });
});

// MSDS API endpoints
app.get('/msds/chemlist', async (req: Request, res: Response) => {
  try {
    console.log('MSDS chemlist request:', req.query);
    
    const { searchWrd, searchCnd = '0', pageNo = '1', numOfRows = '10' } = req.query;
    
    if (!searchWrd || typeof searchWrd !== 'string') {
      return res.status(400).json({ error: 'searchWrd query parameter required' });
    }
    
    if (!SERVICE_KEY) {
      return res.status(500).json({ error: 'MSDS API key not configured' });
    }

    const url = `${MSDS_BASE_URL}/chemlist?serviceKey=${SERVICE_KEY}&searchWrd=${encodeURIComponent(searchWrd)}&searchCnd=${searchCnd}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
    
    console.log('Fetching URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MSDS API responded with status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log('MSDS API XML response received');
    
    // XML 응답을 그대로 반환 (클라이언트에서 파싱)
    res.set('Content-Type', 'application/xml');
    res.send(xmlText);
  } catch (error) {
    console.error('MSDS chemlist error:', error);
    res.status(500).json({ 
      error: 'MSDS chemlist error', 
      details: (error as Error).message 
    });
  }
});

app.get('/msds/chemdetail/:detailType', async (req: Request, res: Response) => {
  try {
    const { detailType } = req.params;
    const { chemno } = req.query;
    
    if (!detailType || !chemno || typeof chemno !== 'string') {
      return res.status(400).json({ error: 'detailType and chemno required' });
    }
    
    if (!SERVICE_KEY) {
      return res.status(500).json({ error: 'MSDS API key not configured' });
    }

    const url = `${MSDS_BASE_URL}/chemdetail${detailType}?serviceKey=${SERVICE_KEY}&chemno=${encodeURIComponent(chemno)}`;
    
    console.log('Fetching MSDS detail URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MSDS API responded with status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // XML 응답을 그대로 반환
    res.set('Content-Type', 'application/xml');
    res.send(xmlText);
  } catch (error) {
    console.error('MSDS chemdetail error:', error);
    res.status(500).json({ 
      error: 'MSDS chemdetail error', 
      details: (error as Error).message 
    });
  }
});

// Gemini API endpoints
app.post('/gemini/extract-msds', async (req: Request, res: Response) => {
  try {
    const { fileData, fileName } = req.body;
    
    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'fileData, fileName required' });
    }
    
    if (!genAI) {
      return res.status(500).json({ error: 'Google GenAI not initialized' });
    }
    
    const prompt = `아래는 MSDS PDF에서 추출한 텍스트입니다. 핵심 정보를 표 형태로 정리해 주세요.\n\n${fileData}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ extracted: text });
  } catch (error) {
    console.error('Gemini extract MSDS error:', error);
    res.status(500).json({ 
      error: 'Gemini extract MSDS error', 
      details: (error as Error).message 
    });
  }
});

app.post('/gemini/refine-data', async (req: Request, res: Response) => {
  try {
    const { extractedData, fileName } = req.body;
    
    if (!extractedData || !fileName) {
      return res.status(400).json({ error: 'extractedData, fileName required' });
    }
    
    if (!genAI) {
      return res.status(500).json({ error: 'Google GenAI not initialized' });
    }
    
    const prompt = `다음은 MSDS에서 추출된 정보입니다. 표준화된 JSON 포맷으로 정제해 주세요.\n\n${extractedData}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ refined: text });
  } catch (error) {
    console.error('Gemini refine data error:', error);
    res.status(500).json({ 
      error: 'Gemini refine data error', 
      details: (error as Error).message 
    });
  }
});

app.post('/gemini/generate-qa', async (req: Request, res: Response) => {
  try {
    const { msdsContent } = req.body;
    
    if (!msdsContent) {
      return res.status(400).json({ error: 'msdsContent required' });
    }
    
    if (!genAI) {
      return res.status(500).json({ error: 'Google GenAI not initialized' });
    }
    
    const prompt = `아래 MSDS 내용을 기반으로 5개의 Q&A를 생성해 주세요.\n\n${msdsContent}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ qa: text });
  } catch (error) {
    console.error('Gemini generate QA error:', error);
    res.status(500).json({ 
      error: 'Gemini generate QA error', 
      details: (error as Error).message 
    });
  }
});

app.post('/gemini/generate-question', async (req: Request, res: Response) => {
  try {
    const { msdsContent } = req.body;
    
    if (!msdsContent) {
      return res.status(400).json({ error: 'msdsContent required' });
    }
    
    if (!genAI) {
      return res.status(500).json({ error: 'Google GenAI not initialized' });
    }
    
    const prompt = `아래 MSDS 내용을 바탕으로 1개의 퀴즈(문제)만 만들어 주세요.\n\n${msdsContent}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ question: text });
  } catch (error) {
    console.error('Gemini generate question error:', error);
    res.status(500).json({ 
      error: 'Gemini generate question error', 
      details: (error as Error).message 
    });
  }
});

app.post('/gemini/generate-answer', async (req: Request, res: Response) => {
  try {
    const { msdsContent, question } = req.body;
    
    if (!msdsContent || !question) {
      return res.status(400).json({ error: 'msdsContent and question required' });
    }
    
    if (!genAI) {
      return res.status(500).json({ error: 'Google GenAI not initialized' });
    }
    
    const prompt = `아래 MSDS 내용을 참고하여 다음 질문에 대한 답변을 작성해 주세요.\n\nMSDS 내용:\n${msdsContent}\n\n질문:\n${question}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ answer: text });
  } catch (error) {
    console.error('Gemini generate answer error:', error);
    res.status(500).json({ 
      error: 'Gemini generate answer error', 
      details: (error as Error).message 
    });
  }
});

// Catch all for unmatched routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method 
  });
});

export const handler = serverless(app);
