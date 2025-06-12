const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const serverless = require('serverless-http'); // <-- 1. serverless-http 가져오기
const fs = require('fs'); // <-- 파일 시스템 모듈 추가

// .env 파일 경로는 로컬 테스트 시에만 필요합니다.
// Netlify에서는 환경 변수를 사용하므로 이 부분은 문제가 되지 않습니다.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

// CORS 설정 등 나머지 코드는 거의 동일합니다.
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'https://your-netlify-site-name.netlify.app'], // <-- Netlify 배포 주소 추가
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ... (MSDS API, Gemini API 키 설정은 그대로 둡니다) ...
const MSDS_BASE_URL = 'https://msds.kosha.or.kr/openapi/service/msdschem';
const SERVICE_KEY = process.env.REACT_APP_MSDS_API_KEY;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Google AI 설정
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'global';
// GOOGLE_APPLICATION_CREDENTIALS는 Netlify 환경 변수로 다르게 처리합니다. (아래 4단계 참고)

let genAI;

// Google AI 초기화 (서버리스 환경에 맞게 수정)
async function initializeGenAI() {
  if (genAI) return; // 이미 초기화되었으면 반환

  console.log('=== Google GenAI 초기화 시작 ===');
  if (PROJECT_ID) {
    try {
      // Netlify 환경에서는 환경 변수에서 인증 정보를 읽어 임시 파일로 생성
      if (process.env.GCP_CREDS_BASE64) {
        const credentialsJson = Buffer.from(process.env.GCP_CREDS_BASE64, 'base64').toString('utf-8');
        const tempCredsPath = '/tmp/gcp-creds.json';
        fs.writeFileSync(tempCredsPath, credentialsJson);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredsPath;
        console.log('Netlify 환경에서 GCP 인증 정보 임시 파일 생성 완료');
      }

      genAI = new GoogleGenAI({
        vertexai: true,
        project: PROJECT_ID,
        location: LOCATION
      });
      console.log('✅ Google GenAI 초기화 완료');
    } catch (error) {
      console.error('❌ Google GenAI 초기화 실패:', error);
      genAI = null; // 실패 시 null로 설정
    }
  } else {
    console.log('⚠️ PROJECT_ID 누락');
    genAI = null;
  }
}

// 모든 API 라우터 앞에 초기화 로직을 미들웨어로 추가
app.use(async (req, res, next) => {
  await initializeGenAI();
  next();
});

// 라우터 경로 수정: Netlify Functions는 경로를 인식해야 함
const router = express.Router();

// 기존 app.post, app.get 등을 router.post, router.get으로 변경
router.post('/gemini/extract-msds', async (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'fileData, fileName required' });
    }
    // Gemini API 호출 (예시: 텍스트 추출)
    if (!genAI) {
      return res.status(500).json({ error: 'Google GenAI not initialized' });
    }
    // 예시 프롬프트 (실제 프롬프트는 비즈니스 로직에 맞게 수정 필요)
    const prompt = `아래는 MSDS PDF에서 추출한 텍스트입니다. 핵심 정보를 표 형태로 정리해 주세요.\n\n${fileData}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ extracted: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gemini extract MSDS error', details: error.message });
  }
});

router.post('/gemini/refine-data', async (req, res) => {
  try {
    const { extractedData, fileName } = req.body;
    if (!extractedData || !fileName) {
      return res.status(400).json({ error: 'extractedData, fileName required' });
    }
    if (!genAI) {
      return res.status(500).json({ error: 'Google GenAI not initialized' });
    }
    // 예시 프롬프트 (추출 데이터 정제)
    const prompt = `다음은 MSDS에서 추출된 정보입니다. 표준화된 JSON 포맷으로 정제해 주세요.\n\n${extractedData}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ refined: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gemini refine data error', details: error.message });
  }
});

router.get('/msds/chemlist', async (req, res) => {
  try {
    const { search, pageNo = 1, numOfRows = 10 } = req.query;
    if (!search) {
      return res.status(400).json({ error: 'search query required' });
    }
    const url = `${MSDS_BASE_URL}/getMsdsChemList?serviceKey=${SERVICE_KEY}&searchWord=${encodeURIComponent(
      search
    )}&pageNo=${pageNo}&numOfRows=${numOfRows}&type=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('MSDS API fetch error');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'MSDS chemlist error', details: error.message });
  }
});

router.get('/msds/chemdetail/:detailType', async (req, res) => {
  try {
    const { detailType } = req.params;
    const { chemno } = req.query;
    if (!detailType || !chemno) {
      return res.status(400).json({ error: 'detailType and chemno required' });
    }
    const url = `${MSDS_BASE_URL}/getMsdsChem${detailType}?serviceKey=${SERVICE_KEY}&chemno=${encodeURIComponent(
      chemno
    )}&type=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('MSDS API fetch error');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'MSDS chemdetail error', details: error.message });
  }
});

router.post('/gemini/generate-qa', async (req, res) => {
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
    console.error(error);
    res.status(500).json({ error: 'Gemini generate QA error', details: error.message });
  }
});

router.post('/gemini/generate-question', async (req, res) => {
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
    console.error(error);
    res.status(500).json({ error: 'Gemini generate question error', details: error.message });
  }
});

router.post('/gemini/generate-answer', async (req, res) => {
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
    console.error(error);
    res.status(500).json({ error: 'Gemini generate answer error', details: error.message });
  }
});

// Express 앱에 라우터 마운트
// Netlify 리다이렉트 설정과 일치하도록 '/api' 경로를 사용
app.use('/.netlify/functions/api', router);

// --- 가장 중요한 변경점 ---
// app.listen()을 제거하고 handler를 내보냅니다.
module.exports.handler = serverless(app);