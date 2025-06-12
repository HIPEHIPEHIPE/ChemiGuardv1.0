// src/components/QAManager.tsx - 생성된 Q&A 관리 컴포넌트
import React, { useState, useEffect } from 'react';
import { 
  getStoredQAList, 
  deleteQA, 
  updateQA, 
  GeneratedQA 
} from '../api/qaGeneration';

interface QAManagerProps {
  onSelectQA?: (qa: GeneratedQA) => void;
  refreshTrigger?: number;
}

const QAManager: React.FC<QAManagerProps> = ({ onSelectQA, refreshTrigger }) => {
  const [qaList, setQAList] = useState<GeneratedQA[]>([]);
  const [filteredQAList, setFilteredQAList] = useState<GeneratedQA[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'chemical' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingQA, setEditingQA] = useState<GeneratedQA | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Q&A 목록 로드
  const loadQAList = () => {
    try {
      const stored = getStoredQAList();
      setQAList(stored);
      console.log('📋 Q&A 목록 로드됨:', stored.length);
    } catch (error) {
      console.error('💥 Q&A 목록 로드 실패:', error);
      setQAList([]);
    }
  };

  // 컴포넌트 마운트 시 및 새로고침 트리거 시 목록 로드
  useEffect(() => {
    loadQAList();
  }, [refreshTrigger]);

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...qaList];

    // 검색 필터
    if (searchTerm.trim()) {
      filtered = filtered.filter(qa => 
        qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qa.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qa.sourceData.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(qa => qa.category === categoryFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: string | Date, bValue: string | Date;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'chemical':
          aValue = a.sourceData.name;
          bValue = b.sourceData.name;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortBy === 'date') {
        const comparison = (aValue as Date).getTime() - (bValue as Date).getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as string).localeCompare(bValue as string);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });

    setFilteredQAList(filtered);
  }, [qaList, searchTerm, categoryFilter, sortBy, sortOrder]);

  // Q&A 삭제
  const handleDeleteQA = (qaId: string) => {
    try {
      deleteQA(qaId);
      loadQAList();
      setShowDeleteConfirm(null);
      console.log('🗑️ Q&A 삭제됨:', qaId);
    } catch (error) {
      console.error('💥 Q&A 삭제 실패:', error);
      alert('Q&A 삭제에 실패했습니다.');
    }
  };

  // Q&A 수정 저장
  const handleSaveEdit = () => {
    if (!editingQA) return;

    try {
      updateQA(editingQA);
      loadQAList();
      setEditingQA(null);
      console.log('✏️ Q&A 수정됨:', editingQA.id);
    } catch (error) {
      console.error('💥 Q&A 수정 실패:', error);
      alert('Q&A 수정에 실패했습니다.');
    }
  };

  // Q&A 수정 취소
  const handleCancelEdit = () => {
    setEditingQA(null);
  };

  // 카테고리 목록 추출
  const getUniqueCategories = () => {
    const categories = [...new Set(qaList.map(qa => qa.category))];
    return categories.sort();
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 전체 Q&A 내보내기
  const handleExportAll = () => {
    const exportData = filteredQAList.map(qa => ({
      화학물질: qa.sourceData.name,
      카테고리: qa.category,
      질문: qa.question,
      답변: qa.answer,
      생성일: formatDate(qa.createdAt),
      모델: qa.metadata.model,
      대상: qa.metadata.targetAudience
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(exportData[0] || {}).join(",") + "\n" +
      exportData.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qa_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="qa-manager">
      <div className="qa-manager-header">
        <h3>📚 Q&A 관리</h3>
        <div className="qa-stats">
          <span>총 {qaList.length}개 Q&A</span>
          {searchTerm || categoryFilter !== 'all' ? (
            <span> | 필터링됨: {filteredQAList.length}개</span>
          ) : null}
        </div>
      </div>

      <div className="qa-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Q&A 검색... (질문, 답변, 화학물질명)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">모든 카테고리</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy as any);
              setSortOrder(newSortOrder as any);
            }}
            className="sort-select"
          >
            <option value="date-desc">최신순</option>
            <option value="date-asc">오래된순</option>
            <option value="chemical-asc">화학물질명 A-Z</option>
            <option value="chemical-desc">화학물질명 Z-A</option>
            <option value="category-asc">카테고리 A-Z</option>
            <option value="category-desc">카테고리 Z-A</option>
          </select>
        </div>

        <div className="action-section">
          <button 
            onClick={handleExportAll}
            disabled={filteredQAList.length === 0}
            className="export-button"
          >
            📁 CSV 내보내기
          </button>
          <button 
            onClick={loadQAList}
            className="refresh-button"
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      <div className="qa-list">
        {filteredQAList.length === 0 ? (
          <div className="no-qa-message">
            {qaList.length === 0 ? (
              <p>생성된 Q&A가 없습니다. 화학물질을 선택하고 Q&A를 생성해보세요!</p>
            ) : (
              <p>검색 조건에 맞는 Q&A가 없습니다.</p>
            )}
          </div>
        ) : (
          filteredQAList.map(qa => (
            <div key={qa.id} className="qa-item">
              <div className="qa-item-header">
                <div className="qa-metadata">
                  <span className="chemical-name">{qa.sourceData.name}</span>
                  <span className="category-tag">{qa.category}</span>
                  <span className="date-info">{formatDate(qa.createdAt)}</span>
                </div>
                <div className="qa-actions">
                  {editingQA?.id === qa.id ? (
                    <>
                      <button onClick={handleSaveEdit} className="save-button">
                        💾 저장
                      </button>
                      <button onClick={handleCancelEdit} className="cancel-button">
                        ❌ 취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setEditingQA({...qa})}
                        className="edit-button"
                      >
                        ✏️ 수정
                      </button>
                      <button 
                        onClick={() => onSelectQA && onSelectQA(qa)}
                        className="select-button"
                      >
                        👁️ 보기
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(qa.id)}
                        className="delete-button"
                      >
                        🗑️ 삭제
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="qa-content">
                <div className="question-section">
                  <h5>❓ 질문</h5>
                  {editingQA?.id === qa.id ? (
                    <textarea
                      value={editingQA.question}
                      onChange={(e) => setEditingQA({...editingQA, question: e.target.value})}
                      className="edit-textarea"
                      rows={3}
                    />
                  ) : (
                    <p className="question-text">{qa.question}</p>
                  )}
                </div>

                <div className="answer-section">
                  <h5>💡 답변</h5>
                  {editingQA?.id === qa.id ? (
                    <textarea
                      value={editingQA.answer}
                      onChange={(e) => setEditingQA({...editingQA, answer: e.target.value})}
                      className="edit-textarea"
                      rows={6}
                    />
                  ) : (
                    <p className="answer-text">{qa.answer}</p>
                  )}
                </div>
              </div>

              <div className="qa-item-footer">
                <div className="technical-info">
                  <span>모델: {qa.metadata.model}</span>
                  <span>대상: {qa.metadata.targetAudience}</span>
                  <span>유형: {qa.metadata.questionType}</span>
                </div>
              </div>

              {/* 삭제 확인 모달 */}
              {showDeleteConfirm === qa.id && (
                <div className="delete-confirm-overlay">
                  <div className="delete-confirm-modal">
                    <h4>Q&A 삭제 확인</h4>
                    <p>이 Q&A를 정말 삭제하시겠습니까?</p>
                    <p className="delete-warning">삭제된 Q&A는 복구할 수 없습니다.</p>
                    <div className="delete-confirm-actions">
                      <button 
                        onClick={() => handleDeleteQA(qa.id)}
                        className="confirm-delete-button"
                      >
                        🗑️ 삭제
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        className="cancel-delete-button"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QAManager;