import express, { Request, Response } from 'express';
import cors from 'cors';
import serverless from 'serverless-http';

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// 루트 경로
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'API is working', 
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 상태 확인
app.get('/gemini/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Gemini status endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// 간단한 테스트 엔드포인트
app.post('/gemini/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Test endpoint is working',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method 
  });
});

export const handler = serverless(app);
