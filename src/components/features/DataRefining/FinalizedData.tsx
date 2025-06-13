import React, { CSSProperties } from 'react';
import { RefinementStats } from '../../../api/dataRefinement';

interface FinalizedDataProps {
  stats: RefinementStats | null;
}

const sectionCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
};

const FinalizedData: React.FC<FinalizedDataProps> = ({ stats }) => {
  return (
    <div style={sectionCardStyle}>
      <div style={{padding: '20px'}}>
        <h3>완료된 데이터</h3>
        <p>최종 완료된 데이터 목록이 구현될 예정입니다.</p>
        <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px'}}>
          📊 현재 상태: 총 {stats?.completed_count || 0}건 완료
        </div>
      </div>
    </div>
  );
};

export default FinalizedData;
