// src/pages/QaGeneration/QaGenerationPage.tsx
import React, { useState, CSSProperties } from 'react';
import { QADataList, QAGenerationSystem, QAResultsList } from '../../components/features/QAGeneration';
import { ChemicalData, GeneratedQA } from '../../types/qaGeneration';

// --- 스타일 정의 ---
const pageWrapperStyle: CSSProperties = {
  padding: '24px',
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
};

const headerStyle: CSSProperties = {
  marginBottom: '24px',
};

const titleStyle: CSSProperties = {
  fontSize: '1.875rem',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '8px',
};

const descriptionStyle: CSSProperties = {
  fontSize: '1rem',
  color: '#6b7280',
};

// --- 메인 컴포넌트 ---
const QaGenerationPage: React.FC = () => {
  // 상태 관리
  const [selectedChemical, setSelectedChemical] = useState<ChemicalData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 목업 데이터 - QA 생성이 필요한 화학물질들
  const mockChemicalData: ChemicalData[] = [
    {
      id: 'CHEM-001',
      name: '소듐라우릴황산염',
      product_name: '클린원시 주방세정제',
      casNumber: '151-21-3',
      molecularFormula: 'C12H25NaO4S',
      molecularWeight: '288.38 g/mol',
      physicalState: '고체',
      content_percentage: '15-20%',
      ghs_codes: ['H315', 'H318', 'H412'],
      hazardClass: 'Class 2 - 자극성',
      ld50_value: '1200 mg/kg',
      usage: '음이온성 계면활성제',
      manufacturer: '케미칼코리아',
      status: 'pending',
      qa_status: {
        safety: false,
        usage: true,
        component: false,
        regulation: false,
      },
      created_at: '2025-06-10',
      updated_at: '2025-06-12',
    },
    {
      id: 'CHEM-002',
      name: '벤젠술폰산나트륨',
      product_name: '다목적 클리너',
      casNumber: '25155-30-0',
      molecularFormula: 'C6H5SO3Na',
      molecularWeight: '180.16 g/mol',
      physicalState: '고체',
      content_percentage: '10-15%',
      ghs_codes: ['H302', 'H315', 'H319'],
      hazardClass: 'Class 2 - 자극성',
      ld50_value: '1500 mg/kg',
      usage: '방향족 술폰산염',
      manufacturer: '클린케미칼',
      status: 'processing',
      qa_status: {
        safety: true,
        usage: false,
        component: true,
        regulation: false,
      },
      created_at: '2025-06-09',
      updated_at: '2025-06-12',
    },
    {
      id: 'CHEM-003',
      name: '차아염소산나트륨',
      product_name: '퓨어클린 표백제',
      casNumber: '7681-52-9',
      molecularFormula: 'NaClO',
      molecularWeight: '74.44 g/mol',
      physicalState: '액체',
      content_percentage: '3-5%',
      ghs_codes: ['H290', 'H314', 'H411'],
      hazardClass: 'Class 3 - 부식성',
      ld50_value: '8500 mg/kg',
      usage: '산화성 표백제',
      manufacturer: '표백케미칼',
      status: 'completed',
      qa_status: {
        safety: true,
        usage: true,
        component: true,
        regulation: true,
      },
      created_at: '2025-06-08',
      updated_at: '2025-06-11',
    },
    {
      id: 'CHEM-004',
      name: '에탄올',
      product_name: '의료용 알코올',
      casNumber: '64-17-5',
      molecularFormula: 'C₂H₆O',
      molecularWeight: '46.07 g/mol',
      physicalState: '액체',
      content_percentage: '70-80%',
      ghs_codes: ['H225', 'H319'],
      hazardClass: 'Class 1 - 인화성',
      ld50_value: '7080 mg/kg',
      usage: '살균소독제',
      manufacturer: '메디칼케미칼',
      status: 'pending',
      qa_status: {
        safety: false,
        usage: false,
        component: false,
        regulation: true,
      },
      created_at: '2025-06-12',
      updated_at: '2025-06-12',
    },
    {
      id: 'CHEM-005',
      name: '수산화나트륨',
      product_name: '강력 배수구 청소제',
      casNumber: '1310-73-2',
      molecularFormula: 'NaOH',
      molecularWeight: '39.997 g/mol',
      physicalState: '고체',
      content_percentage: '5-10%',
      ghs_codes: ['H290', 'H314'],
      hazardClass: 'Class 3 - 부식성',
      ld50_value: '325 mg/kg',
      usage: '알칼리성 세정제',
      manufacturer: '스트롱케미칼',
      status: 'processing',
      qa_status: {
        safety: true,
        usage: false,
        component: false,
        regulation: false,
      },
      created_at: '2025-06-11',
      updated_at: '2025-06-12',
    },
  ];

  // 목업 데이터 - 생성된 Q&A 목록
  const mockGeneratedQAs: GeneratedQA[] = [
    {
      id: 'QA-001',
      chemicalId: 'CHEM-001',
      chemicalName: '소듐라우릴황산염',
      casNumber: '151-21-3',
      type: 'safety',
      difficulty: 'general',
      question: '소듐라우릴황산염과 다른 성분을 함께 사용해도 안전한가요?',
      answer: '소듐라우릴황산염(SLS)은 일반적으로 다른 세정 성분들과 안전하게 혼합하여 사용할 수 있습니다. 다만, 산성이 강한 물질(예: 염산, 구연산 등)과 직접 혼합할 경우 화학적 반응이 일어날 수 있으므로 주의가 필요합니다. 제품 라벨의 사용 지침을 반드시 확인하고, 다른 청소용품과 혼합 사용 시에는 환기가 잘 되는 곳에서 사용하시기 바랍니다.',
      tags: ['안전성', '혼합사용', '주의사항'],
      isVerified: true,
      createdAt: '2025-06-12',
      updatedAt: '2025-06-12',
      createdBy: 'AI Assistant',
    },
    {
      id: 'QA-002',
      chemicalId: 'CHEM-001',
      chemicalName: '소듐라우릴황산염',
      casNumber: '151-21-3',
      type: 'usage',
      difficulty: 'general',
      question: '소듐라우릴황산염이 포함된 세정제 사용법을 알려주세요.',
      answer: '소듐라우릴황산염이 포함된 세정제는 다음과 같이 사용하세요:\n\n1. 사용 전 환기를 충분히 합니다\n2. 보호장갑을 착용합니다\n3. 적당량을 물에 희석하여 사용합니다 (제품 설명서 참조)\n4. 거품이 많이 생기므로 과량 사용을 피합니다\n5. 사용 후 충분히 헹구어 잔여물을 제거합니다\n6. 눈이나 피부에 직접 닿지 않도록 주의합니다',
      tags: ['사용법', '세정제', '안전수칙'],
      isVerified: true,
      createdAt: '2025-06-12',
      updatedAt: '2025-06-12',
      createdBy: 'AI Assistant',
    },
    {
      id: 'QA-003',
      chemicalId: 'CHEM-004',
      chemicalName: '에탄올',
      casNumber: '64-17-5',
      type: 'safety',
      difficulty: 'professional',
      question: '에탄올의 LD50 값과 그 의미를 설명해주세요.',
      answer: '에탄올의 LD50 값은 7080 mg/kg (경구, 쥐)입니다. LD50은 Lethal Dose 50의 약자로, 실험동물의 50%를 치사시키는 화학물질의 양을 의미합니다. 이 값이 높을수록 급성 독성이 낮다는 것을 나타냅니다.\n\n에탄올의 경우 상대적으로 높은 LD50 값을 가지고 있어 급성 독성이 낮은 편이지만, 대량 섭취 시에는 여전히 위험할 수 있습니다. 산업용 에탄올 사용 시에는 적절한 환기와 개인보호구 착용이 필요합니다.',
      tags: ['독성학', 'LD50', '전문지식', '안전성평가'],
      isVerified: true,
      createdAt: '2025-06-12',
      updatedAt: '2025-06-12',
      createdBy: 'AI Assistant',
    },
    {
      id: 'QA-004',
      chemicalId: 'CHEM-003',
      chemicalName: '차아염소산나트륨',
      casNumber: '7681-52-9',
      type: 'regulation',
      difficulty: 'professional',
      question: '차아염소산나트륨의 국내 규제 현황은 어떻게 되나요?',
      answer: '차아염소산나트륨은 국내에서 다음과 같이 규제되고 있습니다:\n\n**화학물질관리법**: 유독물질로 지정되어 제조·수입·판매 시 신고 의무\n**산업안전보건법**: 관리대상 유해물질로 분류, 작업환경측정 대상\n**생활화학제품법**: 살생물제품으로 안전확인 대상\n**먹는물관리법**: 정수처리제로 사용 시 품질기준 적용\n\n농도 3% 이상 제품은 위험물안전관리법의 적용을 받으며, 보관 및 취급 시 특별한 주의가 필요합니다.',
      tags: ['법규', '규제현황', '화관법', '안전관리'],
      isVerified: true,
      createdAt: '2025-06-11',
      updatedAt: '2025-06-11',
      createdBy: 'AI Assistant',
    },
  ];

  // 데이터 필터링 및 페이지네이션
  const filteredData = mockChemicalData.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.casNumber.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // 이벤트 핸들러
  const handleSelectChemical = (chemical: ChemicalData) => {
    setSelectedChemical(chemical);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleEditQA = (qa: GeneratedQA) => {
    console.log('Edit QA:', qa);
    // QA 편집 로직 구현
  };

  const handleDeleteQA = (id: string) => {
    console.log('Delete QA:', id);
    // QA 삭제 로직 구현
  };

  const handleBulkAction = (action: string, ids: string[]) => {
    console.log('Bulk action:', action, ids);
    // 일괄 작업 로직 구현
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Q&A 생성 관리</h1>
        <p style={descriptionStyle}>
          화학물질 정보를 기반으로 전문적인 Q&A를 생성하고 관리합니다.
        </p>
      </div>

      {/* QA 생성이 필요한 데이터 목록 */}
      <QADataList
        data={paginatedData}
        selectedChemical={selectedChemical}
        onSelectChemical={handleSelectChemical}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        filterStatus={filterStatus}
        onFilterChange={handleFilterChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {/* QA 생성 시스템 */}
      <QAGenerationSystem selectedChemical={selectedChemical} />

      {/* 생성된 QA 결과 목록 */}
      <QAResultsList
        qaList={mockGeneratedQAs}
        onEdit={handleEditQA}
        onDelete={handleDeleteQA}
        onBulkAction={handleBulkAction}
      />
    </div>
  );
};

export default QaGenerationPage;
