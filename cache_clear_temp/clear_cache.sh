#!/bin/bash

echo "🧹 ChemiGuard 프로젝트 캐시 정리 중..."

# 현재 디렉토리를 프로젝트 루트로 이동
cd /Users/travis/Project/ChemiGuardv1.0

echo "1. Build 폴더 제거 중..."
if [ -d "build" ]; then
    rm -rf build
    echo "   ✅ build 폴더 제거됨"
else
    echo "   ℹ️ build 폴더가 없습니다"
fi

echo "2. node_modules/.cache 폴더 제거 중..."
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "   ✅ node_modules/.cache 제거됨"
else
    echo "   ℹ️ node_modules/.cache 폴더가 없습니다"
fi

echo "3. React Scripts 캐시 제거 중..."
if [ -d "node_modules/react-scripts/.cache" ]; then
    rm -rf node_modules/react-scripts/.cache
    echo "   ✅ react-scripts 캐시 제거됨"
else
    echo "   ℹ️ react-scripts 캐시가 없습니다"
fi

echo "4. TypeScript 빌드 정보 제거 중..."
if [ -f "tsconfig.tsbuildinfo" ]; then
    rm -f tsconfig.tsbuildinfo
    echo "   ✅ tsconfig.tsbuildinfo 제거됨"
else
    echo "   ℹ️ tsconfig.tsbuildinfo가 없습니다"
fi

echo ""
echo "🎯 캐시 정리 완료! 이제 다음 명령어로 다시 빌드해보세요:"
echo "   npm run build"
echo ""
echo "💡 여전히 오류가 발생한다면:"
echo "   1. npm install --force"
echo "   2. npm run build"
echo ""
