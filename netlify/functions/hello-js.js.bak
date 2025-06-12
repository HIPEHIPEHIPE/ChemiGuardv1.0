// JavaScript 버전 간단한 테스트 함수
exports.handler = async (event, context) => {
  console.log('✅ JS 버전 테스트 함수 실행됨');
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: 'JavaScript 테스트 함수가 작동합니다!',
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
      path: event.path || 'unknown'
    })
  };
};
