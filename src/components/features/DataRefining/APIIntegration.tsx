import React, { useState, CSSProperties } from 'react';
import { Search, Database, CheckCircle, AlertCircle, Loader, FileText, Download } from 'lucide-react';

interface ChemicalSearchResult {
  casNo: string;
  chemId: string;
  chemNameKor: string;
  enNo: string;
  keNo: string;
  unNo: string;
  lastDate: string;
}

interface MSdsDetail {
  lev: number;
  msdsItemCode: string;
  upMsdsItemCode: string;
  msdsItemNameKor: string;
  msdsItemNo: string;
  ordrIdx: number;
  itemDetail: string;
}

interface APIIntegrationProps {
  onDataMapped: (data: any) => void;
}

const cardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
  padding: '24px'
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px'
};

const buttonStyle: CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'background-color 0.2s'
};

const resultCardStyle: CSSProperties = {
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  marginBottom: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const selectedResultStyle: CSSProperties = {
  ...resultCardStyle,
  backgroundColor: '#dbeafe',
  border: '1px solid #3b82f6'
};

const detailSectionStyle: CSSProperties = {
  marginBottom: '16px',
  padding: '12px',
  backgroundColor: 'white',
  borderRadius: '6px',
  border: '1px solid #e5e7eb'
};

const APIIntegration: React.FC<APIIntegrationProps> = ({ onDataMapped }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('0'); // 0: 국문명, 1: CAS No, 2: UN No, 3: KE No, 4: EN No
  const [searchResults, setSearchResults] = useState<ChemicalSearchResult[]>([]);
  const [selectedChemical, setSelectedChemical] = useState<ChemicalSearchResult | null>(null);
  const [chemicalDetails, setChemicalDetails] = useState<{ [key: string]: MSdsDetail[] }>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string>('');

  const searchTypeOptions = [
    { value: '0', label: '국문명' },
    { value: '1', label: 'CAS No' },
    { value: '2', label: 'UN No' },
    { value: '3', label: 'KE No' },
    { value: '4', label: 'EN No' }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);
    setSelectedChemical(null);
    setChemicalDetails({});

    try {
      const response = await fetch(`/api/msds/chemlist?searchWrd=${encodeURIComponent(searchQuery)}&searchCnd=${searchType}&numOfRows=20`);
      
      if (!response.ok) {
        throw new Error('API 호출 중 오류가 발생했습니다.');
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // XML 파싱 오류 확인
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('XML 파싱 오류');
      }

      // 결과 추출
      const items = xmlDoc.querySelectorAll('item');
      const results: ChemicalSearchResult[] = [];

      items.forEach(item => {
        const result: ChemicalSearchResult = {
          casNo: item.querySelector('casNo')?.textContent || '',
          chemId: item.querySelector('chemId')?.textContent || '',
          chemNameKor: item.querySelector('chemNameKor')?.textContent || '',
          enNo: item.querySelector('enNo')?.textContent || '',
          keNo: item.querySelector('keNo')?.textContent || '',
          unNo: item.querySelector('unNo')?.textContent || '',
          lastDate: item.querySelector('lastDate')?.textContent || ''
        };
        results.push(result);
      });

      setSearchResults(results);

      if (results.length === 0) {
        setError('검색 결과가 없습니다.');
      }

    } catch (err) {
      console.error('검색 오류:', err);
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectChemical = async (chemical: ChemicalSearchResult) => {
    setSelectedChemical(chemical);
    setIsLoadingDetails(true);
    setError('');

    try {
      // 16개 섹션 모두 조회
      const details: { [key: string]: MSdsDetail[] } = {};
      
      for (let i = 1; i <= 16; i++) {
        const detailType = i.toString().padStart(2, '0');
        
        try {
          const response = await fetch(`/api/msds/chemdetail/${detailType}?chemId=${chemical.chemId}`);
          
          if (response.ok) {
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const items = xmlDoc.querySelectorAll('item');
            const sectionDetails: MSdsDetail[] = [];
            
            items.forEach(item => {
              const detail: MSdsDetail = {
                lev: parseInt(item.querySelector('lev')?.textContent || '0'),
                msdsItemCode: item.querySelector('msdsItemCode')?.textContent || '',
                upMsdsItemCode: item.querySelector('upMsdsItemCode')?.textContent || '',
                msdsItemNameKor: item.querySelector('msdsItemNameKor')?.textContent || '',
                msdsItemNo: item.querySelector('msdsItemNo')?.textContent || '',
                ordrIdx: parseInt(item.querySelector('ordrIdx')?.textContent || '0'),
                itemDetail: item.querySelector('itemDetail')?.textContent || ''
              };
              sectionDetails.push(detail);
            });
            
            details[`section${detailType}`] = sectionDetails;
          }
        } catch (sectionError) {
          console.warn(`섹션 ${detailType} 조회 실패:`, sectionError);
        }
        
        // API 호출 간격 조절
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setChemicalDetails(details);
      
    } catch (err) {
      console.error('상세정보 조회 오류:', err);
      setError('상세정보 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleMapToDatabase = () => {
    if (!selectedChemical || Object.keys(chemicalDetails).length === 0) {
      setError('화학물질을 선택하고 상세정보를 로드해주세요.');
      return;
    }

    // MSDS 데이터를 데이터베이스 형식으로 매핑
    const mappedData = {
      basicInfo: {
        chemicalName: selectedChemical.chemNameKor,
        casNumber: selectedChemical.casNo,
        chemId: selectedChemical.chemId,
        lastUpdated: selectedChemical.lastDate
      },
      msdsDetails: chemicalDetails,
      source: 'KOSHA_MSDS_API',
      retrievedAt: new Date().toISOString()
    };

    onDataMapped(mappedData);
    alert('화학물질 정보가 성공적으로 매핑되었습니다!');
  };

  const getSectionTitle = (sectionKey: string) => {
    const sectionTitles: { [key: string]: string } = {
      'section01': '1. 화학제품과 회사에 관한 정보',
      'section02': '2. 유해성·위험성',
      'section03': '3. 구성성분의 명칭 및 함유량',
      'section04': '4. 응급조치요령',
      'section05': '5. 폭발·화재시 대처방법',
      'section06': '6. 누출사고시 대처방법',
      'section07': '7. 취급 및 저장방법',
      'section08': '8. 노출방지 및 개인보호구',
      'section09': '9. 물리화학적 특성',
      'section10': '10. 안정성 및 반응성',
      'section11': '11. 독성에 관한 정보',
      'section12': '12. 환경에 미치는 영향',
      'section13': '13. 폐기시 주의사항',
      'section14': '14. 운송에 필요한 정보',
      'section15': '15. 법적 규제현황',
      'section16': '16. 그 밖의 참고사항'
    };
    return sectionTitles[sectionKey] || sectionKey;
  };

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>
          MSDS Open API 연동
        </h3>
        <p style={{ margin: 0, color: '#6b7280' }}>
          안전보건공단 MSDS Open API를 활용하여 화학물질 정보를 검색하고 데이터베이스에 매핑합니다.
        </p>
      </div>

      {/* 검색 섹션 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
              검색 유형
            </label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              style={inputStyle}
            >
              {searchTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '3', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
              검색어
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="화학물질명, CAS 번호 등을 입력하세요"
              style={inputStyle}
            />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              style={{
                ...buttonStyle,
                backgroundColor: isSearching ? '#9ca3af' : '#3b82f6'
              }}
            >
              {isSearching ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search size={16} />
                  검색
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            검색 결과 ({searchResults.length}건)
          </h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSelectChemical(result)}
                style={selectedChemical?.chemId === result.chemId ? selectedResultStyle : resultCardStyle}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {result.chemNameKor}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {result.casNo && <span>CAS: {result.casNo}</span>}
                  {result.keNo && <span>KE: {result.keNo}</span>}
                  {result.unNo && <span>UN: {result.unNo}</span>}
                  <span>ID: {result.chemId}</span>
                </div>
                {result.lastDate && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    최종 갱신: {result.lastDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 선택된 화학물질 상세 정보 */}
      {selectedChemical && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              상세 정보: {selectedChemical.chemNameKor}
            </h4>
            {!isLoadingDetails && Object.keys(chemicalDetails).length > 0 && (
              <button
                onClick={handleMapToDatabase}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#16a34a'
                }}
              >
                <Database size={16} />
                데이터베이스에 매핑
              </button>
            )}
          </div>

          {isLoadingDetails ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <Loader size={24} className="animate-spin" style={{ color: '#3b82f6', marginBottom: '12px' }} />
              <div>16개 섹션의 상세 정보를 불러오는 중...</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                잠시만 기다려주세요.
              </div>
            </div>
          ) : Object.keys(chemicalDetails).length > 0 ? (
            <div>
              {Object.entries(chemicalDetails).map(([sectionKey, details]) => (
                <div key={sectionKey} style={detailSectionStyle}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    {getSectionTitle(sectionKey)}
                  </h5>
                  {details.length > 0 ? (
                    <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      {details.map((detail, idx) => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>
                            {detail.msdsItemNameKor}
                          </div>
                          {detail.itemDetail && (
                            <div style={{ color: '#4b5563', marginTop: '2px', paddingLeft: '8px' }}>
                              {detail.itemDetail}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                      정보 없음
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default APIIntegration;