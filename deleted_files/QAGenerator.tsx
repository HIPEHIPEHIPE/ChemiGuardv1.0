// src/components/QAGenerator.tsx - AI Q&A 생성 컴포넌트
import React, { useState, useEffect } from 'react';
import { ChemicalData } from '../types/qaGeneration';
import { 
  generateQA, 
  generateQuestion, 
  generateAnswer, 
  checkAPIStatus,
  saveQA,
  createQAFromResult,
  QAGenerationResponse 
} from '../api/qaGeneration';

interface QAGeneratorProps {
  chemicalData: ChemicalData;
  onQAGenerated?: (qa: any) => void;
}

const QAGenerator: React.FC<QAGeneratorProps> = ({ chemicalData, onQAGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qaType, setQAType] = useState<'safety' | 'usage' | 'component' | 'regulation'>('safety');
  const [difficultyLevel, setDifficultyLevel] = useState<'general' | 'professional' | 'expert'>('general');
  const [generatedQA, setGeneratedQA] = useState<{ question: string; answer: string } | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isAPIAvailable, setIsAPIAvailable] = useState(false);
  const [apiStatus, setApiStatus] = useState<string>('확인 중...');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // API 상태 확인
  useEffect(() => {
    const checkAPI = async () => {
      try {
        const status = await checkAPIStatus();
        setIsAPIAvailable(status.available && status.genAI);
        setApiStatus(status.available ? 
          (status.genAI ? '✅ 사용 가능' : '⚠️ GenAI 비활성화') : 
          '❌ 연결 실패'
        );
      } catch (error) {
        setIsAPIAvailable(false);
        setApiStatus('❌ 상태 확인 실패');
      }
    };

    checkAPI();
  }, []);

  // 전체 Q&A 생성
  const handleGenerateQA = async () => {
    if (!chemicalData || isGenerating) return;

    setIsGenerating(true);
    try {
      console.log('🤖 Q&A 생성 시작:', {
        chemical: chemicalData.name,
        qaType,
        difficultyLevel
      });

      const response: QAGenerationResponse = await generateQA({
        chemical: chemicalData,
        questionType: qaType,
        difficultyLevel: difficultyLevel,
        language: 'ko'
      });

      if (response.success && response.result) {
        const newQA = {
          question: response.result.question,
          answer: response.result.answer
        };
        
        setGeneratedQA(newQA);
        
        // 생성된 Q&A를 저장
        const qaData = createQAFromResult(response.result, chemicalData, qaType, difficultyLevel);
        saveQA(qaData);
        
        // 부모 컴포넌트에 알림
        if (onQAGenerated) {
          onQAGenerated(qaData);
        }

        console.log('✅ Q&A 생성 완료');
      } else {
        console.error('❌ Q&A 생성 실패:', response.error);
        alert(`Q&A 생성 실패: ${response.error}\n${response.details || ''}`);
      }
    } catch (error) {
      console.error('💥 Q&A 생성 오류:', error);
      alert('Q&A 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 질문만 생성
  const handleGenerateQuestion = async () => {
    if (!chemicalData || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await generateQuestion(chemicalData, qaType, difficultyLevel);
      
      if (response.success && response.result) {
        setGeneratedQA({
          question: response.result.question,
          answer: generatedQA?.answer || ''
        });
      } else {
        alert(`질문 생성 실패: ${response.error}`);
      }
    } catch (error) {
      console.error('질문 생성 오류:', error);
      alert('질문 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 답변만 생성
  const handleGenerateAnswer = async () => {
    const questionToUse = customQuestion || generatedQA?.question;
    if (!chemicalData || !questionToUse || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await generateAnswer(chemicalData, questionToUse, qaType, difficultyLevel);
      
      if (response.success && response.result) {
        setGeneratedQA({
          question: questionToUse,
          answer: response.result.answer
        });
      } else {
        alert(`답변 생성 실패: ${response.error}`);
      }
    } catch (error) {
      console.error('답변 생성 오류:', error);
      alert('답변 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Q&A 초기화
  const handleReset = () => {
    setGeneratedQA(null);
    setCustomQuestion('');
  };

  if (!chemicalData) {
    return (
      <div className="qa-generator-placeholder">
        <p>화학물질을 선택하여 Q&A를 생성해보세요.</p>
      </div>
    );
  }

  return (
    <div className="qa-generator">
      <div className="qa-generator-header">
        <h3>🤖 AI Q&A 생성기</h3>
        <div className="api-status">
          <span>API 상태: {apiStatus}</span>
        </div>
      </div>

      <div className="chemical-info">
        <h4>📋 선택된 화학물질</h4>
        <div className="chemical-details">
          <p><strong>물질명:</strong> {chemicalData.name}</p>
          {chemicalData.casNumber && (
            <p><strong>CAS 번호:</strong> {chemicalData.casNumber}</p>
          )}
          {chemicalData.usage && (
            <p><strong>용도:</strong> {chemicalData.usage}</p>
          )}
        </div>
      </div>

      <div className="generation-controls">
        <h4>⚙️ 생성 설정</h4>
        
        <div className="control-group">
          <label>Q&A 유형:</label>
          <select 
            value={qaType} 
            onChange={(e) => setQAType(e.target.value as any)}
            disabled={isGenerating}
          >
            <option value="safety">안전성 관련</option>
            <option value="usage">사용법 관련</option>
            <option value="component">성분 정보</option>
            <option value="regulation">규제 정보</option>
          </select>
        </div>

        <div className="control-group">
          <label>난이도 수준:</label>
          <select 
            value={difficultyLevel} 
            onChange={(e) => setDifficultyLevel(e.target.value as any)}
            disabled={isGenerating}
          >
            <option value="general">일반인 대상</option>
            <option value="professional">전문가 대상</option>
            <option value="expert">연구자 대상</option>
          </select>
        </div>

        <div className="generation-buttons">
          <button 
            onClick={handleGenerateQA}
            disabled={!isAPIAvailable || isGenerating}
            className="primary-button"
          >
            {isGenerating ? '생성 중...' : '🎯 전체 Q&A 생성'}
          </button>

          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="secondary-button"
          >
            {showAdvanced ? '📁 간단히 보기' : '🔧 고급 설정'}
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-controls">
            <h5>🔧 고급 생성 옵션</h5>
            
            <div className="control-group">
              <label>커스텀 질문 (선택사항):</label>
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="특정 질문이 있다면 입력해주세요..."
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <div className="advanced-buttons">
              <button 
                onClick={handleGenerateQuestion}
                disabled={!isAPIAvailable || isGenerating}
                className="secondary-button"
              >
                ❓ 질문만 생성
              </button>

              <button 
                onClick={handleGenerateAnswer}
                disabled={!isAPIAvailable || isGenerating || (!customQuestion && !generatedQA?.question)}
                className="secondary-button"
              >
                💬 답변만 생성
              </button>

              <button 
                onClick={handleReset}
                disabled={isGenerating}
                className="reset-button"
              >
                🔄 초기화
              </button>
            </div>
          </div>
        )}
      </div>

      {generatedQA && (
        <div className="generated-qa">
          <h4>✨ 생성된 Q&A</h4>
          
          <div className="qa-item">
            <div className="question-section">
              <h5>❓ 질문</h5>
              <div className="question-content">
                {generatedQA.question}
              </div>
            </div>

            {generatedQA.answer && (
              <div className="answer-section">
                <h5>💡 답변</h5>
                <div className="answer-content">
                  {generatedQA.answer.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="qa-actions">
            <button 
              className="copy-button"
              onClick={() => {
                const qaText = `Q: ${generatedQA.question}\n\nA: ${generatedQA.answer}`;
                navigator.clipboard.writeText(qaText);
                alert('Q&A가 클립보드에 복사되었습니다!');
              }}
            >
              📋 복사하기
            </button>
            
            <button 
              className="regenerate-button"
              onClick={handleGenerateQA}
              disabled={!isAPIAvailable || isGenerating}
            >
              🔄 다시 생성
            </button>
          </div>
        </div>
      )}

      {!isAPIAvailable && (
        <div className="api-warning">
          <p>⚠️ AI API가 사용할 수 없는 상태입니다.</p>
          <p>서버 설정을 확인해주세요.</p>
        </div>
      )}
    </div>
  );
};

export default QAGenerator;