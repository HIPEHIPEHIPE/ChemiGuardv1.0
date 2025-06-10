import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

// 데이터 타입 정의 (새로운 스키마에 맞춤)
interface DataItem {
  id: string;
  // 제품 정보
  product_id?: string;
  product_name?: string;
  product_category?: string;
  // 성분 정보
  ingredient_id?: string;
  main_ingredient?: string;
  cas_number?: string;
  content_percentage?: number;
  molecular_weight?: number;
  // 공통 정보
  status: string;
  created_at: string;
  updated_at: string;
  data_type: 'products' | 'ingredients';
}

interface DataCounts {
  all: number;
  collected: number;
  annotated: number;
  reviewed: number;
  approved: number;
  rejected: number;
}

const DataManagementPage = () => {
  const [activeTab, setActiveTab] = useState('all-data');
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [dataCounts, setDataCounts] = useState<DataCounts>({
    all: 0,
    collected: 0,
    annotated: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0
  });

  const itemsPerPage = 20;

  // 모든 데이터 가져오기 (새로운 스키마 구조)
  const getAllData = useCallback(async () => {
    try {
      console.log('새로운 스키마로 데이터 가져오기 시작...');
      
      const [productsResult, ingredientsResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, product_id, product_name, product_category, status, created_at, updated_at')
          .order('updated_at', { ascending: false }),
        supabase
          .from('product_ingredients')
          .select(`
            id, 
            ingredient_id, 
            product_id,
            main_ingredient, 
            cas_number, 
            content_percentage,
            molecular_weight,
            status, 
            created_at, 
            updated_at
          `)
          .order('updated_at', { ascending: false })
      ]);

      console.log('가져온 제품 데이터:', productsResult.data?.length || 0);
      console.log('가져온 성분 데이터:', ingredientsResult.data?.length || 0);

      // 제품 데이터 포맷팅
      const productsData: DataItem[] = (productsResult.data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_category: item.product_category,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        data_type: 'products' as const
      }));

      // 성분 데이터 포맷팅
      const ingredientsData: DataItem[] = (ingredientsResult.data || []).map(item => ({
        id: item.id,
        ingredient_id: item.ingredient_id,
        product_id: item.product_id,
        main_ingredient: item.main_ingredient,
        cas_number: item.cas_number,
        content_percentage: item.content_percentage,
        molecular_weight: item.molecular_weight,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        data_type: 'ingredients' as const
      }));

      const allData = [...productsData, ...ingredientsData]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      console.log('통합된 전체 데이터:', allData.length);
      return allData;
    } catch (error) {
      console.error('데이터 가져오기 에러:', error);
      return [];
    }
  }, []);

  // 상태별 데이터 개수 계산
  const calculateDataCounts = useCallback((allData: DataItem[]) => {
    const counts = {
      all: allData.length,
      collected: 0,
      annotated: 0,
      reviewed: 0,
      approved: 0,
      rejected: 0
    };

    allData.forEach(item => {
      switch (item.status) {
        case 'collected':
          counts.collected++;
          break;
        case 'annotated':
          counts.annotated++;
          break;
        case 'reviewed':
          counts.reviewed++;
          break;
        case 'approved':
          counts.approved++;
          break;
        case 'rejected':
          counts.rejected++;
          break;
      }
    });

    setDataCounts(counts);
    return counts;
  }, []);

  // 전체 데이터 로딩
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const allData = await getAllData();
      setTotalCount(allData.length);
      
      // 페이지네이션 적용
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedData = allData.slice(startIndex, startIndex + itemsPerPage);
      
      setDataItems(paginatedData);
      calculateDataCounts(allData);

    } catch (error) {
      console.error('데이터 로딩 에러:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, getAllData, calculateDataCounts]);

  // 탭별 데이터 필터링
  const fetchFilteredData = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const allData = await getAllData();
      
      let filteredData = allData;

      if (status !== 'all-data') {
        filteredData = allData.filter(item => item.status === status);
      }

      setTotalCount(filteredData.length);

      // 페이지네이션 적용
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

      setDataItems(paginatedData);

    } catch (error) {
      console.error('필터링된 데이터 로딩 에러:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, getAllData]);

  // 검색 기능
  const searchData = useCallback(async () => {
    if (!searchTerm.trim()) {
      setIsSearching(false);
      if (activeTab === 'all-data') {
        fetchData();
      } else {
        fetchFilteredData(activeTab);
      }
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      console.log('검색 시작:', searchTerm);
      
      const [productsResult, ingredientsResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, product_id, product_name, product_category, status, created_at, updated_at')
          .or(`product_name.ilike.%${searchTerm}%,product_id.ilike.%${searchTerm}%`)
          .order('updated_at', { ascending: false }),
        supabase
          .from('product_ingredients')
          .select(`
            id, 
            ingredient_id, 
            product_id,
            main_ingredient, 
            cas_number, 
            content_percentage,
            molecular_weight,
            status, 
            created_at, 
            updated_at
          `)
          .or(`main_ingredient.ilike.%${searchTerm}%,cas_number.ilike.%${searchTerm}%,ingredient_id.ilike.%${searchTerm}%`)
          .order('updated_at', { ascending: false })
      ]);

      const productsData: DataItem[] = (productsResult.data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_category: item.product_category,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        data_type: 'products' as const
      }));

      const ingredientsData: DataItem[] = (ingredientsResult.data || []).map(item => ({
        id: item.id,
        ingredient_id: item.ingredient_id,
        product_id: item.product_id,
        main_ingredient: item.main_ingredient,
        cas_number: item.cas_number,
        content_percentage: item.content_percentage,
        molecular_weight: item.molecular_weight,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        data_type: 'ingredients' as const
      }));

      const searchResults = [...productsData, ...ingredientsData]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      // 검색 결과 페이지네이션
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedResults = searchResults.slice(startIndex, startIndex + itemsPerPage);
      
      setDataItems(paginatedResults);
      setTotalCount(searchResults.length);

    } catch (error) {
      console.error('검색 에러:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, fetchData, fetchFilteredData, activeTab]);

  // 항목 삭제
  const deleteItems = async (ids: string[]) => {
    if (!window.confirm(`선택한 ${ids.length}개 항목을 삭제하시겠습니까?`)) return;

    try {
      const itemsToDelete = dataItems.filter(item => ids.includes(item.id));
      
      const productIds = itemsToDelete.filter(item => item.data_type === 'products').map(item => item.id);
      const ingredientIds = itemsToDelete.filter(item => item.data_type === 'ingredients').map(item => item.id);

      const deletePromises = [];

      if (productIds.length > 0) {
        deletePromises.push(
          supabase.from('products').delete().in('id', productIds)
        );
      }

      if (ingredientIds.length > 0) {
        deletePromises.push(
          supabase.from('product_ingredients').delete().in('id', ingredientIds)
        );
      }

      await Promise.all(deletePromises);
      
      setSelectedItems([]);
      
      // 삭제 후 새로고침
      if (isSearching) {
        searchData();
      } else if (activeTab === 'all-data') {
        fetchData();
      } else {
        fetchFilteredData(activeTab);
      }
      
      alert('선택한 항목이 삭제되었습니다.');

    } catch (error) {
      console.error('삭제 에러:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 체크박스 핸들러
  const handleCheckboxChange = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === dataItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(dataItems.map(item => item.id));
    }
  };

  // 탭 클릭 핸들러
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedItems([]);
    setIsSearching(false);
    
    if (searchTerm) {
      setSearchTerm('');
    }
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    searchData();
  };

  // 초기화 핸들러
  const handleReset = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setIsSearching(false);
    if (activeTab === 'all-data') {
      fetchData();
    } else {
      fetchFilteredData(activeTab);
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    if (!isSearching) {
      if (activeTab === 'all-data') {
        fetchData();
      } else {
        fetchFilteredData(activeTab);
      }
    }
  }, [activeTab, currentPage, fetchData, fetchFilteredData, isSearching]);

  useEffect(() => {
    if (isSearching) {
      searchData();
    }
  }, [currentPage, searchData, isSearching]);

  // 상태 표시 함수
  const getStatusInfo = (status: string) => {
    const statusMap: {[key: string]: {label: string, color: string}} = {
      'collected': { label: '수집완료', color: '#10b981' },
      'annotated': { label: '주석완료', color: '#3b82f6' },
      'reviewed': { label: '검수완료', color: '#8b5cf6' },
      'approved': { label: '승인완료', color: '#059669' },
      'rejected': { label: '반려', color: '#ef4444' },
      'draft': { label: '초안', color: '#f59e0b' }
    };
    
    return statusMap[status] || { label: status, color: '#6b7280' };
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>데이터 관리</h2>
        <p style={{ color: '#6b7280', fontSize: '16px', marginTop: '4px' }}>
          수집된 제품 정보와 성분 데이터를 관리하고 품질을 검수합니다
        </p>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}
      >
        {/* 탭 메뉴 */}
        <div style={{ borderBottom: 'none', padding: '20px 20px 0 20px' }}>
          {[
            ['all-data', `전체 데이터 (${dataCounts.all})`],
            ['collected', `수집완료 (${dataCounts.collected})`],
            ['annotated', `주석완료 (${dataCounts.annotated})`],
            ['reviewed', `검수완료 (${dataCounts.reviewed})`],
            ['approved', `승인완료 (${dataCounts.approved})`],
            ['rejected', `반려 (${dataCounts.rejected})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleTabClick(key)}
              style={{
                padding: '12px 20px',
                marginRight: '8px',
                border: 'none',
                borderBottom: activeTab === key ? '3px solid #4f46e5' : '3px solid transparent',
                background: 'none',
                fontWeight: activeTab === key ? 'bold' : 'normal',
                color: activeTab === key ? '#4f46e5' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div style={{ padding: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="제품명, 성분명, CAS 번호로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#4f46e5',
                color: '#fff',
                fontSize: '14px',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🔍 검색
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                backgroundColor: '#6b7280',
                color: '#fff',
                fontSize: '14px',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              초기화
            </button>
          </form>
          
          {/* 검색 상태 표시 */}
          {isSearching && (
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              fontSize: '14px',
              color: '#1e40af',
              marginBottom: '12px',
              border: '1px solid #bfdbfe'
            }}>
              📍 "{searchTerm}" 검색 결과: {totalCount}건
            </div>
          )}
        </div>
      </div>

      {/* 데이터 테이블 */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px', 
          backgroundColor: 'white',
          borderRadius: '12px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>⏳</div>
          데이터를 불러오는 중...
        </div>
      ) : dataItems.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px', 
          backgroundColor: 'white',
          borderRadius: '12px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>📭</div>
          {searchTerm ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedItems.length === dataItems.length && dataItems.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>이름/식별자</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>타입</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>카테고리/CAS</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>함량/분자량</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>상태</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>수정일</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {dataItems.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  
                  return (
                    <tr key={`${item.data_type}-${item.id}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '16px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleCheckboxChange(item.id)}
                        />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                          {item.data_type === 'products' ? item.product_name : item.main_ingredient}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          ID: {item.data_type === 'products' ? item.product_id : item.ingredient_id}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          backgroundColor: item.data_type === 'products' ? '#dbeafe' : '#fef3c7',
                          color: item.data_type === 'products' ? '#1e40af' : '#92400e',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {item.data_type === 'products' ? '제품' : '성분'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#374151' }}>
                        {item.data_type === 'products' ? 
                          (item.product_category || '-') : 
                          (item.cas_number || '-')
                        }
                      </td>
                      <td style={{ padding: '16px', color: '#374151' }}>
                        {item.data_type === 'products' ? 
                          '-' : 
                          (item.content_percentage ? `${item.content_percentage}%` : 
                           item.molecular_weight ? `${item.molecular_weight} g/mol` : '-')
                        }
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          backgroundColor: `${statusInfo.color}15`,
                          color: statusInfo.color,
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#6b7280', fontSize: '13px' }}>
                        {formatDate(item.updated_at)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={{
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              cursor: 'pointer'
                            }}
                            title="상세보기"
                          >🔍</button>
                          <button
                            style={{
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              cursor: 'pointer'
                            }}
                            title="편집"
                          >✏️</button>
                          <button
                            onClick={() => deleteItems([item.id])}
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #fca5a5',
                              cursor: 'pointer'
                            }}
                            title="삭제"
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 선택 요약 및 일괄 작업 */}
          {selectedItems.length > 0 && (
            <div style={{
              background: "#f9fafb",
              padding: "20px 24px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ color: "#374151", fontSize: "16px", fontWeight: '500' }}>
                {selectedItems.length}개 항목 선택됨 
                <button 
                  onClick={() => setSelectedItems([])}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: "#4f46e5", 
                    cursor: 'pointer',
                    marginLeft: '12px',
                    textDecoration: 'underline',
                    fontWeight: '500'
                  }}
                >
                  선택 해제
                </button>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  style={{
                    backgroundColor: '#4f46e5',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >📊 일괄 편집</button>
                <button
                  style={{
                    backgroundColor: '#059669',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >🔄 내보내기</button>
                <button
                  onClick={() => deleteItems(selectedItems)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >🗑️삭제</button>
              </div>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                borderTop: '1px solid #e5e7eb'
              }}
            >
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >← 이전</button>
              
              {/* 페이지 번호들 */}
              {(() => {
                const pageNumbers = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      style={{
                        backgroundColor: currentPage === i ? '#4f46e5' : '#f3f4f6',
                        color: currentPage === i ? 'white' : '#374151',
                        border: '1px solid #d1d5db',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        margin: '0 4px',
                        cursor: 'pointer',
                        fontWeight: currentPage === i ? '600' : '400'
                      }}
                    >
                      {i}
                    </button>
                  );
                }
                
                return pageNumbers;
              })()}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >다음 →</button>
            </div>
          )}

          <div style={{
            textAlign: "center",
            color: "#6b7280",
            fontSize: "14px",
            padding: "16px",
            borderTop: "1px solid #f3f4f6"
          }}>
            {isSearching ? 
              `검색 결과 ${totalCount}개 중 ${Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-${Math.min(currentPage * itemsPerPage, totalCount)} 표시` :
              `총 ${totalCount}개 항목 중 ${Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-${Math.min(currentPage * itemsPerPage, totalCount)} 표시`
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementPage;