#!/bin/bash

# ChemiGuard 프로젝트 실행 스크립트

echo "🔧 ChemiGuard 프로젝트 시작 중..."

# 환경 변수 체크
if [ ! -f .env ]; then
    echo "❌ .env 파일이 없습니다. 환경 변수를 설정해주세요."
    echo "필요한 변수:"
    echo "- REACT_APP_MSDS_API_KEY=your_api_key_here"
    echo "- REACT_APP_SUPABASE_URL=your_supabase_url"
    echo "- REACT_APP_SUPABASE_ANON_KEY=your_supabase_key"
    exit 1
fi

# 서버 디렉토리가 없으면 생성
if [ ! -d "server" ]; then
    echo "❌ server 디렉토리가 없습니다."
    exit 1
fi

# 서버 의존성 설치
echo "📦 서버 의존성 설치 중..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
fi

# 서버 시작 (백그라운드)
echo "🚀 프록시 서버 시작 중..."
npm start &
SERVER_PID=$!

cd ..

# 프론트엔드 의존성 설치
echo "📦 프론트엔드 의존성 확인 중..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# 잠시 대기 (서버 시작을 위해)
echo "⏳ 서버 초기화 대기 중..."
sleep 3

# 프론트엔드 시작
echo "🎨 프론트엔드 시작 중..."
npm start

# 스크립트 종료 시 서버도 종료
trap "echo '🛑 서버 종료 중...'; kill $SERVER_PID 2>/dev/null; exit" INT TERM EXIT
