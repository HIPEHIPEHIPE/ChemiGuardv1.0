@echo off
setlocal

echo 🔧 ChemiGuard 프로젝트 시작 중...

:: 환경 변수 체크
if not exist .env (
    echo ❌ .env 파일이 없습니다. 환경 변수를 설정해주세요.
    echo 필요한 변수:
    echo - REACT_APP_MSDS_API_KEY=your_api_key_here
    echo - REACT_APP_SUPABASE_URL=your_supabase_url
    echo - REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
    pause
    exit /b 1
)

:: 서버 디렉토리 체크
if not exist server (
    echo ❌ server 디렉토리가 없습니다.
    pause
    exit /b 1
)

:: 서버 의존성 설치
echo 📦 서버 의존성 설치 중...
cd server
if not exist node_modules (
    call npm install
)

:: 서버 시작 (백그라운드)
echo 🚀 프록시 서버 시작 중...
start /b npm start

cd ..

:: 프론트엔드 의존성 설치
echo 📦 프론트엔드 의존성 확인 중...
if not exist node_modules (
    call npm install
)

:: 잠시 대기 (서버 시작을 위해)
echo ⏳ 서버 초기화 대기 중...
timeout /t 3 /nobreak >nul

:: 프론트엔드 시작
echo 🎨 프론트엔드 시작 중...
call npm start

pause
