import React from 'react';

const StyledButton = ({ children, bgColor }: { children: React.ReactNode; bgColor: string }) => (
  <button
    style={{
      backgroundColor: bgColor,
      color: '#fff',
      fontSize: '13px',
      fontWeight: 'bold',
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      marginRight: '8px'
    }}
  >
    {children}
  </button>
);

const DataAcquisitionPage = () => {
  return (
    <div className="content-section" id="data-acquisition" style={{ padding: '24px' }}>
      <div className="card" style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>데이터 획득</h2>
          <div>
            <StyledButton bgColor="#3b82f6">자동 정제</StyledButton>
            <StyledButton bgColor="#10b981">정제 완료</StyledButton>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
          {[
            { color: '#3b82f6', label: '오류', value: '32건' },
            { color: '#10b981', label: '경고', value: '5건' },
            { color: '#f59e0b', label: '검토필요', value: '8건' },
            { color: '#8b5cf6', label: '처리 완료', value: '12건' },
          ].map((item, idx) => (
            <div className="stat-card" key={idx} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <div className="stat-number" style={{ color: item.color, fontWeight: 'bold', fontSize: '18px' }}>{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>발견된 문제점 및 제안사항</h3>

          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
            <div style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '5px' }}>❌ CAS 번호 형식 오류</div>
            <div style={{ color: '#7f1d1d', fontSize: '14px' }}>
              내용: 소듐라우릴황산염의 CAS 번호 형식이 올바르지 않습니다.
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '12px', color: '#7f1d1d' }}>입력 형식: <span style={{ color: '#dc2626' }}>151-21-3</span></div>
              <div style={{ fontSize: '12px', color: '#7f1d1d' }}>정정 제안: <span style={{ color: '#dc2626' }}>151-21-3</span></div>
              <div style={{ marginTop: '5px' }}>
                <StyledButton bgColor="#10b981">수정 적용</StyledButton>
                <StyledButton bgColor="#6b7280">무시</StyledButton>
                <StyledButton bgColor="#f59e0b">상세 보기</StyledButton>
              </div>
            </div>
          </div>

          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
            <div style={{ color: '#d97706', fontWeight: 'bold', marginBottom: '5px' }}>⚠️ 함량 범위 오류</div>
            <div style={{ color: '#92400e', fontSize: '14px' }}>
              내용: 소듐라우릴황산염의 함량 범위가 100%를 초과합니다. (현재값: 15-20%)
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '12px', color: '#92400e' }}>현재 함량: <span style={{ color: '#d97706' }}>15-20%</span></div>
              <div style={{ fontSize: '12px', color: '#92400e' }}>정정 제안: <span style={{ color: '#d97706' }}>5-10%</span></div>
              <div style={{ marginTop: '5px' }}>
                <StyledButton bgColor="#10b981">수정 적용</StyledButton>
                <StyledButton bgColor="#6b7280">무시</StyledButton>
                <StyledButton bgColor="#f59e0b">상세 보기</StyledButton>
              </div>
            </div>
          </div>

          <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '15px' }}>
            <div style={{ color: '#059669', fontWeight: 'bold', marginBottom: '5px' }}>✅ 독성 설명 표준화 제안</div>
            <div style={{ color: '#065f46', fontSize: '14px' }}>성분들의 안전성에 대한 설명을 표준화할 수 있습니다.</div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '12px', color: '#065f46' }}>현재 설명 예시: <span style={{ color: '#059669' }}>Ethanol 과 안전함</span></div>
              <div style={{ fontSize: '12px', color: '#065f46' }}>표준화 제안: <span style={{ color: '#059669' }}>"안전성 확인됨", "주의 필요" 등 일관된 용어 사용</span></div>
              <div style={{ marginTop: '5px' }}>
                <StyledButton bgColor="#10b981">자동 정제</StyledButton>
                <StyledButton bgColor="#f59e0b">무시</StyledButton>
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={() => document.getElementById('fileInput')?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) {
              alert(`드래그로 업로드된 파일: ${file.name}`);
              // 추가 처리 가능
            }
          }}
          style={{
            border: '2px dashed #ccc',
            padding: '30px',
            textAlign: 'center',
            borderRadius: '10px',
            cursor: 'pointer',
            backgroundColor: '#f9fafb',
            marginTop: '20px',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📁</div>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            파일을 여기에 드래그하거나 클릭하여 업로드
          </div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            Excel, CSV 파일 지원 (최대 10MB)
          </div>
          <input
            id="fileInput"
            type="file"
            accept=".csv, .xlsx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                alert(`선택된 파일: ${file.name}`);
                // 선택된 파일 처리 로직
              }
            }}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '10px' }}>최근 업로드 이력</h4>
          <div className="table-container">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                  <th>파일명</th>
                  <th>크기</th>
                  <th>업로드일</th>
                  <th>상태</th>
                  <th>처리된 데이터</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>📊 화학제품_데이터_2025_0430.xlsx</td>
                  <td>2.1 MB</td>
                  <td>2025-04-30 14:23</td>
                  <td><span style={{ color: '#10b981' }}>정제 완료</span></td>
                  <td>287건 / 총 287건</td>
                  <td>
                    <StyledButton bgColor="#3b82f6">🔍</StyledButton>
                    <StyledButton bgColor="#6b7280">📥</StyledButton>
                  </td>
                </tr>
                <tr>
                  <td>📊 추가_세정제_정보_2025_0429.csv</td>
                  <td>1.8 MB</td>
                  <td>2025-04-29 09:15</td>
                  <td><span style={{ color: '#f59e0b' }}>정제 진행중</span></td>
                  <td>152건 / 총 200건</td>
                  <td>
                    <StyledButton bgColor="#3b82f6">🔍</StyledButton>
                    <StyledButton bgColor="#f59e0b">⏸️</StyledButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAcquisitionPage;