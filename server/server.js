const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
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

// Google AI 설정
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'global';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

let genAI;
let model;

// Google AI 초기화
console.log('=== Google GenAI 초기화 시작 ===');
console.log(`PROJECT_ID: ${PROJECT_ID}`);
console.log(`LOCATION: ${LOCATION}`);
console.log(`CREDENTIALS_PATH: ${CREDENTIALS_PATH}`);

if (PROJECT_ID) {
  try {
    // 환경변수로 GOOGLE_APPLICATION_CREDENTIALS 설정
    if (CREDENTIALS_PATH) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = CREDENTIALS_PATH;
      console.log(`환경변수 설정: ${CREDENTIALS_PATH}`);
    }
    
    // gcloud auth application-default login으로 인증된 상태에서 사용
    genAI = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION
    });
    
    // 모델은 사용 시점에 지정
    console.log('✅ Google GenAI 초기화 완료');
  } catch (error) {
    console.error('❌ Google GenAI 초기화 실패:', error);
  }
} else {
  console.log('⚠️ PROJECT_ID 누락');
}

// Google Generative AI를 활용한 MSDS PDF 분석
app.post('/api/gemini/extract-msds', async (req, res) => {
  console.log('=== PDF 분석 요청 시작 ===');
  
  try {
    const { fileData, fileName } = req.body;
    
    console.log(`파일명: ${fileName}`);
    console.log(`파일 데이터 크기: ${fileData ? fileData.length : 0} bytes`);
    console.log(`Google GenAI 사용 가능: ${genAI ? 'YES' : 'NO'}`);
    
    if (!fileData || !fileName) {
      console.log('❌ 파일 데이터 또는 파일명 누락');
      return res.status(400).json({ error: 'PDF 파일 데이터와 파일명이 필요합니다.' });
    }

    // Google GenAI가 초기화되지 않은 경우 즉시 실패
    if (!genAI) {
      console.log('❌ Google GenAI가 초기화되지 않았습니다.');
      return res.status(500).json({
        error: 'Google GenAI 서비스를 사용할 수 없습니다.',
        details: 'Google GenAI가 초기화되지 않았습니다. 설정을 확인해주세요.'
      });
    }

    const prompt = `이 MSDS PDF 문서를 분석하여 다음 JSON 형식으로 정보를 추출해주세요.

중요: 제품 정보와 화학물질 성분 정보를 명확히 구분해서 추출하세요.

제품 정보(productInfo):
- productName: 전체 제품의 이름 (예: "BIO 707 백색")
- manufacturer: 제조회사 이름
- emergencyContact: 긴급연락처
- recommendedUse: 제품 사용 용도
- restrictions: 사용상 제한사항

구성성분(composition):
- 제품에 포함된 각 화학물질들의 목록
- 각 화학물질마다 별도 객체로 생성

응답 형식:
{
  "productInfo": {
    "productName": "제품명 (화학물질명이 아님)",
    "manufacturer": "제조사명",
    "emergencyContact": "연락처",
    "recommendedUse": "사용용도",
    "restrictions": "제한사항"
  },
  "hazardInfo": {
    "ghs_classification": "GHS 분류",
    "pictograms": ["그림문자"],
    "signalWord": "신호어",
    "hazardStatements": ["유해위험문구"],
    "precautionaryStatements": ["예방조치문구"],
    "nfpaRatings": {
      "health": 0,
      "fire": 0,
      "reactivity": 0
    }
  },
  "composition": [
    {
      "substanceName": "화학물질명1",
      "synonym": "이명",
      "casNumber": "CAS번호",
      "percentage": "함유량"
    },
    {
      "substanceName": "화학물질명2",
      "synonym": "이명",
      "casNumber": "CAS번호",
      "percentage": "함유량"
    }
  ],
  "firstAid": {
    "eyeContact": "눈 접촉시 응급조치",
    "skinContact": "피부 접촉시 응급조치",
    "inhalation": "흡입시 응급조치",
    "ingestion": "섭취시 응급조치",
    "medicalAttention": "의료진 주의사항"
  },
  "physicalProperties": {
    "appearance": "외관",
    "odor": "냄새",
    "ph": "pH",
    "meltingPoint": "녹는점",
    "boilingPoint": "끓는점",
    "flashPoint": "인화점",
    "density": "밀도",
    "vaporPressure": "증기압",
    "solubility": "용해도"
  }
}

정보가 없는 경우 빈 문자열("")이나 빈 배열([])을 사용하세요.`;

    let responseResult;

    // Google GenAI 사용 (구글 정확한 예시 코드 방식)
    console.log('🔄 Google GenAI로 PDF 분석 시도...');
    
    const modelName = 'gemini-2.5-pro-preview-06-05';
    
    // 설정
    const generationConfig = {
      maxOutputTokens: 65535,
      temperature: 1,
      topP: 1,
      seed: 0,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'OFF',
        }
      ],
    };
    
    const apiRequest = {
      model: modelName,
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
      ],
      config: generationConfig
    };

    console.log('Google GenAI 요청 전송 중...');
    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    console.log('✅ Google GenAI 스트리밍 응답 시작');
    
    // 스트리밍 응답 처리
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    console.log('스트리밍 완료 - 응답 텍스트 길이:', responseText.length);
    
    // JSON 파싱 시도
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;
    
    console.log('JSON 파싱 시도...');
    const extractedData = JSON.parse(jsonText);
    console.log('✅ JSON 파싱 성공');
    
    return res.json({
      success: true,
      data: extractedData,
      fileName: fileName,
      source: 'google-generative-ai'
    });

  } catch (error) {
    console.error('💥 MSDS PDF 분석 최종 오류:', error);
    console.error('오류 스택:', error.stack);
    res.status(500).json({
      error: 'PDF 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  } finally {
    console.log('=== PDF 분석 요청 종료 ===\n');
  }
});

// 일반 텍스트 정제를 위한 Google Generative AI
app.post('/api/gemini/refine-data', async (req, res) => {
  try {
    const { data, prompt = '다음 데이터를 정제하고 구조화해주세요:' } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: '정제할 데이터가 필요합니다.' });
    }

    // Google Generative AI가 초기화되지 않은 경우 즉시 실패
    if (!genAI) {
      return res.status(500).json({
        error: 'Google Generative AI 서비스를 사용할 수 없습니다.',
        details: 'Google GenAI가 초기화되지 않았습니다. 설정을 확인해주세요.'
      });
    }

    const fullPrompt = `${prompt}\n\n${JSON.stringify(data, null, 2)}`;

    const apiRequest = {
      model: 'gemini-2.5-pro-preview-06-05',
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        maxOutputTokens: 65535,
        temperature: 1,
        topP: 1
      }
    };

    const streamingResp = await genAI.models.generateContentStream(apiRequest);
    
    let responseText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }
    
    return res.json({
      success: true,
      result: responseText,
      source: 'google-generative-ai'
    });

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
  console.log(`Google GenAI: ${genAI ? '사용 가능' : '사용 불가'}`);
});
