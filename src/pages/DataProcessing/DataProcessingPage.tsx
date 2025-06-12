// src/pages/DataProcessing/DataProcessingPage.tsx
import React, { useState, CSSProperties } from 'react';
import { DataProcessingTable, CaptionGenerationSystem } from '../../components/DataProcessing';
import { ChemicalData } from '../../types/dataProcessing';

// --- 스타일 객체 정의 ---
const pageWrapperStyle: CSSProperties = {
  padding: '24px',
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
};

// 호환성을 위한 데이터 변환 함수
const transformChemicalData = (data: any): ChemicalData => ({
  ...data,
  name: data.main_ingredient || data.name || '알 수 없는 화학물질',
  casNumber: data.cas_no || data.casNumber,
  usage: data.usage_category || data.usage,
});

const DataProcessingPage: React.FC = () => {
  // 상태 관리
  const [selectedChemical, setSelectedChemical] = useState<ChemicalData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 목업 데이터
  const rawChemicalData = [
    {
      id: 'CHEM-001',
      name: '소듐라우릴황산염',
      product_name: '클린원시 주방세정',
      main_ingredient: '소듐라우릴황산염',
      cas_no: '151-21-3',
      casNumber: '151-21-3',
      molecularFormula: 'C12H25NaO4S',
      molecularWeight: '288.38 g/mol',
      physicalState: '고체',
      content_percentage: '15-20%',
      ghs_codes: ['H315', 'H318', 'H412'],
      hazardClass: 'Class 2 - 자극성',
      ld50_value: '1200 mg/kg',
      usage_category: '세정제',
      usage: '음이온성 계면활성제',
      manufacturer: '케미칼코리아',
      status: 'refined',
      caption_status: {
        main_component: false,
        toxicity: false,
        warning: false,
      },
      created_at: '2025-06-10',
      updated_at: '2025-06-10',
    },
    {
      id: 'CHEM-002',
      name: '벤젠술폰산나트륨',
      product_name: '다목적 클리너',
      main_ingredient: '벤젠술폰산나트륨',
      cas_no: '25155-30-0',
      casNumber: '25155-30-0',
      molecularFormula: 'C6H5SO3Na',
      molecularWeight: '180.16 g/mol',
      physicalState: '고체',
      content_percentage: '10-15%',
      ghs_codes: ['H302', 'H315', 'H319'],
      hazardClass: 'Class 2 - 자극성',
      ld50_value: '1500 mg/kg',
      usage_category: '세정제',
      usage: '방향족 술폰산염',
      manufacturer: '클린케미칼',
      status: 'processing',
      caption_status: {
        main_component: true,
        toxicity: false,
        warning: false,
      },
      created_at: '2025-06-09',
      updated_at: '2025-06-12',
    },
    {
      id: 'CHEM-003',
      name: '차아염소산나트륨',
      product_name: '퓨어클린 표백제',
      main_ingredient: '차아염소산나트륨',
      cas_no: '7681-52-9',
      casNumber: '7681-52-9',
      molecularFormula: 'NaClO',
      molecularWeight: '74.44 g/mol',
      physicalState: '액체',
      content_percentage: '3-5%',
      ghs_codes: ['H290', 'H314', 'H411'],
      hazardClass: 'Class 3 - 부식성',
      ld50_value: '8500 mg/kg',
      usage_category: '표백제',
      usage: '산화성 표백제',
      manufacturer: '표백케미칼',
      status: 'completed',
      caption_status: {
        main_component: true,
        toxicity: true,
        warning: true,
      },
      created_at: '2025-06-08',
      updated_at: '2025-06-11',
    },
    // 더 많은 목업 데이터...
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `CHEM-${String(i + 4).padStart(3, '0')}`,
      name: `화학성분 ${i + 4}`,
      product_name: `화학제품 ${i + 4}`,
      main_ingredient: `화학성분 ${i + 4}`,
      cas_no: `${100 + i}-${20 + i}-${i}`,
      casNumber: `${100 + i}-${20 + i}-${i}`,
      molecularFormula: `C${i + 1}H${i + 2}O`,
      molecularWeight: `${100 + i * 10} g/mol`,
      physicalState: ['고체', '액체', '기체'][i % 3],
      content_percentage: `${5 + (i % 20)}%`,
      ghs_codes: ['H315', 'H318'],
      hazardClass: `Class ${(i % 3) + 1}`,
      ld50_value: `${1000 + i * 100} mg/kg`,
      usage_category: ['세정제', '표백제', '방향제'][i % 3],
      usage: ['계면활성제', '산화제', '방향족 화합물'][i % 3],
      manufacturer: ['케미칼코리아', '클린케미칼', '표백케미칼'][i % 3],
      status: ['refined', 'processing', 'completed'][i % 3] as any,
      caption_status: {
        main_component: Math.random() > 0.5,
        toxicity: Math.random() > 0.5,
        warning: Math.random() > 0.5,
      },
      created_at: '2025-06-10',
      updated_at: '2025-06-12',
    })),
  ];

  const [chemicalDataList] = useState<ChemicalData[]>(
    rawChemicalData.map(transformChemicalData)
  );

  const handleSelectChemical = (chemical: ChemicalData) => {
    setSelectedChemical(transformChemicalData(chemical));
  };

  return (
    <div style={pageWrapperStyle}>
      {/* 데이터 리스트 섹션 */}
      <DataProcessingTable
        chemicalDataList={chemicalDataList}
        selectedChemical={selectedChemical}
        onSelectChemical={handleSelectChemical}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
      />

      {/* 설명문 생성 시스템 */}
      {selectedChemical && (
        <CaptionGenerationSystem selectedChemical={selectedChemical} />
      )}
    </div>
  );
};

export default DataProcessingPage;