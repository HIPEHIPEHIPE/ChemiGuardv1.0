const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MSDS API 기본 설정
const MSDS_BASE_URL = 'https://msds.kosha.or.kr/openapi/service/msdschem';
const SERVICE_KEY = process.env.REACT_APP_MSDS_API_KEY;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Vertex AI 설정
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'asia-northeast3';

let vertexAI;
let model;

// Vertex AI 초기화
if (PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
      googleAuthOptions: {
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      }
    });
    
    model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-pro-001',
    });
    
    console.log('Vertex AI 초기화 완료');
  } catch (error) {
    console.error('Vertex AI 초기화 실패:', error);
    console.log('Google AI Studio API를 대신 사용합니다.');
  }
}

// Vertex AI를 활용한 MSDS PDF 분석 (우선 사용)
app.post('/api/gemini/extract-msds', async (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    
    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'PDF 파일 데이터와 파일명이 필요합니다.' });
    }

    const prompt = `다음은 MSDS(Material Safety Data Sheet) PDF 문서입니다. 이 문서에서 화학물질 정보를 추출하여 JSON 형식으로 반환해주세요.

추출해야 할 정보:
1. 화학제품과 회사에 관한 정보
   - 제품명 (productName)
   - 회사명 (manufacturer)
   - 긴급연락처 (emergencyContact)
   - 제품의 권고용도 (recommendedUse)
   - 사용상의 제한 (restrictions)

2. 유해성·위험성
   - GHS 분류 (ghs_classification)
   - 그림문자 (pictograms)
   - 신호어 (signalWord)
   - 유해·위험 문구 (hazardStatements)
   - 예방조치문구 (precautionaryStatements)
   - NFPA 등급 (nfpaRatings: health, fire, reactivity)

3. 구성성분의 명칭 및 함유량
   - 배열 형태로 각 성분에 대해:
     - 물질명 (substanceName)
     - 이명 (synonym)
     - CAS 번호 (casNumber)
     - 함유량 (percentage)

4. 응급조치요령
   - 눈에 들어갔을 때 (eyeContact)
   - 피부에 접촉했을 때 (skinContact)
   - 흡입했을 때 (inhalation)
   - 먹었을 때 (ingestion)
   - 의사의 주의사항 (medicalAttention)

5. 물리화학적 특성
   - 외관 (appearance)
   - 냄새 (odor)
   - pH (ph)
   - 녹는점/어는점 (meltingPoint)
   - 초기 끓는점 (boilingPoint)
   - 인화점 (flashPoint)
   - 비중 (density)
   - 증기압 (vaporPressure)
   - 용해도 (solubility)

응답은 반드시 다음 JSON 형식으로 작성해주세요:
{
  "productInfo": {
    "productName": "...",
    "manufacturer": "...",
    "emergencyContact": "...",
    "recommendedUse": "...",
    "restrictions": "..."
  },
  "hazardInfo": {
    "ghs_classification": "...",
    "pictograms": ["...", "..."],
    "signalWord": "...",
    "hazardStatements": ["...", "..."],
    "precautionaryStatements": ["...", "..."],
    "nfpaRatings": {
      "health": 0,
      "fire": 0,
      "reactivity": 0
    }
  },
  "composition": [
    {
      "substanceName": "...",
      "synonym": "...",
      "casNumber": "...",
      "percentage": "..."
    }
  ],
  "firstAid": {
    "eyeContact": "...",
    "skinContact": "...",
    "inhalation": "...",
    "ingestion": "...",
    "medicalAttention": "..."
  },
  "physicalProperties": {
    "appearance": "...",
    "odor": "...",
    "ph": "...",
    "meltingPoint": "...",
    "boilingPoint": "...",
    "flashPoint": "...",
    "density": "...",
    "vaporPressure": "...",
    "solubility": "..."
  }
}

정보가 없는 경우 빈 문자열("")이나 빈 배열([])을 사용하세요.`;

    let result;

    // Vertex AI 우선 사용
    if (model) {
      try {
        console.log('Vertex AI로 PDF 분석 시도...');
        
        const request = {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt
                },
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: fileData
                  }
                }
              ]
            }
          ]
        };

        const response = await model.generateContent(request);
        const responseText = response.response.candidates[0].content.parts[0].text;
        
        // JSON 파싱 시도
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : responseText;
        
        const extractedData = JSON.parse(jsonText);
        
        return res.json({
          success: true,
          data: extractedData,
          fileName: fileName,
          source: 'vertex-ai'
        });
        
      } catch (vertexError) {
        console.error('Vertex AI 오류:', vertexError);
        console.log('Google AI Studio API로 대체 시도...');
      }
    }

    // Vertex AI 실패 시 Google AI Studio API 사용
    if (GEMINI_API_KEY) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "application/pdf",
                  data: fileData
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API 오류: ${response.status}`);
      }

      result = await response.json();
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const extractedText = result.candidates[0].content.parts[0].text;
        
        // JSON 파싱 시도
        const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : extractedText;
        
        const extractedData = JSON.parse(jsonText);
        
        return res.json({
          success: true,
          data: extractedData,
          fileName: fileName,
          source: 'google-ai-studio'
        });
      }
    }

    throw new Error('사용 가능한 AI 서비스가 없습니다.');

  } catch (error) {
    console.error('MSDS PDF 분석 오류:', error);
    res.status(500).json({
      error: 'PDF 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 일반 텍스트 정제를 위한 Gemini API
app.post('/api/gemini/refine-data', async (req, res) => {
  try {
    const { data, prompt = '다음 데이터를 정제하고 구조화해주세요:' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: '정제할 데이터가 필요합니다.' });
    }

    const fullPrompt = `${prompt}\n\n${JSON.stringify(data, null, 2)}`;
    let result;

    // Vertex AI 우선 사용
    if (model) {
      try {
        const request = {
          contents: [
            {
              role: 'user',
              parts: [{ text: fullPrompt }]
            }
          ]
        };

        const response = await model.generateContent(request);
        const responseText = response.response.candidates[0].content.parts[0].text;
        
        return res.json({
          success: true,
          result: responseText,
          source: 'vertex-ai'
        });
        
      } catch (vertexError) {
        console.error('Vertex AI 오류:', vertexError);
      }
    }

    // Google AI Studio API 사용
    if (GEMINI_API_KEY) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API 오류: ${response.status}`);
      }

      result = await response.json();
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const responseText = result.candidates[0].content.parts[0].text;
        
        return res.json({
          success: true,
          result: responseText,
          source: 'google-ai-studio'
        });
      }
    }

    throw new Error('사용 가능한 AI 서비스가 없습니다.');

  } catch (error) {
    console.error('데이터 정제 오류:', error);
    res.status(500).json({
      error: '데이터 정제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 화학물질 목록 조회 프록시
app.get('/api/msds/chemlist', async (req, res) => {
  try {
    const { searchWrd, searchCnd = '0', numOfRows = '10', pageNo = '1' } = req.query;
    
    if (!searchWrd) {
      return res.status(400).json({ error: '검색어가 필요합니다.' });
    }

    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      searchWrd: searchWrd,
      searchCnd: searchCnd,
      numOfRows: numOfRows,
      pageNo: pageNo
    });

    const url = `${MSDS_BASE_URL}/chemlist?${params.toString()}`;
    console.log('MSDS API 호출:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'ChemiGuard/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlData = await response.text();
    
    // XML을 그대로 반환하거나 JSON으로 변환할 수 있습니다
    res.setHeader('Content-Type', 'application/xml');
    res.send(xmlData);

  } catch (error) {
    console.error('MSDS API 프록시 오류:', error);
    res.status(500).json({ 
      error: '화학물질 목록 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 화학물질 상세정보 조회 프록시
app.get('/api/msds/chemdetail/:detailType', async (req, res) => {
  try {
    const { detailType } = req.params;
    const { chemId } = req.query;
    
    if (!chemId) {
      return res.status(400).json({ error: '화학물질 ID가 필요합니다.' });
    }

    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      chemId: chemId
    });

    const endpoint = `chemdetail${detailType.padStart(2, '0')}`;
    const url = `${MSDS_BASE_URL}/${endpoint}?${params.toString()}`;
    console.log('MSDS API 호출:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'ChemiGuard/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlData = await response.text();
    
    res.setHeader('Content-Type', 'application/xml');
    res.send(xmlData);

  } catch (error) {
    console.error('MSDS API 프록시 오류:', error);
    res.status(500).json({ 
      error: '화학물질 상세정보 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 정적 파일 서빙 (React 빌드 파일)
app.use(express.static(path.join(__dirname, '../build')));

// React 라우팅을 위한 catch-all 핸들러
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`MSDS API Key: ${SERVICE_KEY ? '설정됨' : '설정되지 않음'}`);
  console.log(`Gemini API Key: ${GEMINI_API_KEY ? '설정됨' : '설정되지 않음'}`);
  console.log(`GCP Project ID: ${PROJECT_ID ? PROJECT_ID : '설정되지 않음'}`);
  console.log(`Vertex AI: ${model ? '사용 가능' : '사용 불가 (Google AI Studio API 대체 사용)'}`);
});
