// MSDS (Material Safety Data Sheet) API 서비스
// 한국 안전보건공단 화학물질정보시스템 Open API (프록시 서버 사용)

// 프록시 서버 기본 설정
const PROXY_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/msds'  // 프로덕션에서는 같은 도메인
  : 'http://localhost:3001/api/msds';  // 개발환경에서는 프록시 서버

// 검색 조건 상수
export const SEARCH_CONDITIONS = {
  KOREAN_NAME: 0,    // 국문명
  CAS_NO: 1,         // CAS No
  UN_NO: 2,          // UN No
  KE_NO: 3,          // KE No
  EN_NO: 4           // EN No
} as const;

// 타입 정의
export interface ChemicalListItem {
  casNo: string;
  chemId: number;
  chemNameKor: string;
  enNo: string;
  keNo: string;
  unNo: string;
  lastDate: string;
}

export interface ChemicalListResponse {
  items: ChemicalListItem[];
  numOfRows: number;
  pageNo: number;
  totalCount: number;
}

export interface ChemicalDetailItem {
  lev: number;
  msdsItemCode: number;
  upMsdsItemCode: string;
  msdsItemNameKor: string;
  msdsItemNo: string;
  ordrIdx: number;
  itemDetail: string;
}

export interface ChemicalDetailResponse {
  items: ChemicalDetailItem[];
}

// API 응답 XML을 파싱하는 유틸리티 함수
function parseXMLResponse(xmlText: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // 에러 체크
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML 파싱 오류: ' + parserError.textContent);
  }

  return xmlDoc;
}

// 화학물질 목록을 파싱하는 함수
function parseChemicalList(xmlDoc: Document): ChemicalListResponse {
  const items: ChemicalListItem[] = [];
  const itemElements = xmlDoc.querySelectorAll('item');
  
  itemElements.forEach(item => {
    const chemicalItem: ChemicalListItem = {
      casNo: item.querySelector('casNo')?.textContent || '',
      chemId: parseInt(item.querySelector('chemId')?.textContent || '0'),
      chemNameKor: item.querySelector('chemNameKor')?.textContent || '',
      enNo: item.querySelector('enNo')?.textContent || '',
      keNo: item.querySelector('keNo')?.textContent || '',
      unNo: item.querySelector('unNo')?.textContent || '',
      lastDate: item.querySelector('lastDate')?.textContent || ''
    };
    items.push(chemicalItem);
  });

  const numOfRows = parseInt(xmlDoc.querySelector('numOfRows')?.textContent || '0');
  const pageNo = parseInt(xmlDoc.querySelector('pageNo')?.textContent || '1');
  const totalCount = parseInt(xmlDoc.querySelector('totalCount')?.textContent || '0');

  return {
    items,
    numOfRows,
    pageNo,
    totalCount
  };
}

// 화학물질 상세정보를 파싱하는 함수
function parseChemicalDetail(xmlDoc: Document): ChemicalDetailResponse {
  const items: ChemicalDetailItem[] = [];
  const itemElements = xmlDoc.querySelectorAll('item');
  
  itemElements.forEach(item => {
    const detailItem: ChemicalDetailItem = {
      lev: parseInt(item.querySelector('lev')?.textContent || '0'),
      msdsItemCode: parseInt(item.querySelector('msdsItemCode')?.textContent || '0'),
      upMsdsItemCode: item.querySelector('upMsdsItemCode')?.textContent || '',
      msdsItemNameKor: item.querySelector('msdsItemNameKor')?.textContent || '',
      msdsItemNo: item.querySelector('msdsItemNo')?.textContent || '',
      ordrIdx: parseInt(item.querySelector('ordrIdx')?.textContent || '0'),
      itemDetail: item.querySelector('itemDetail')?.textContent || ''
    };
    items.push(detailItem);
  });

  return { items };
}

// MSDS API 클래스 (프록시 서버 사용)
export class MSDSApiService {
  /**
   * 화학물질 목록 조회
   * @param searchWord 검색어
   * @param searchCondition 검색조건 (0: 국문명, 1: CAS No, 2: UN No, 3: KE No, 4: EN No)
   * @param numOfRows 한 페이지 결과 수 (기본값: 10)
   * @param pageNo 페이지 번호 (기본값: 1)
   */
  async getChemicalList(
    searchWord: string,
    searchCondition: number = SEARCH_CONDITIONS.KOREAN_NAME,
    numOfRows: number = 10,
    pageNo: number = 1
  ): Promise<ChemicalListResponse> {
    try {
      const params = new URLSearchParams({
        searchWrd: searchWord,
        searchCnd: searchCondition.toString(),
        numOfRows: numOfRows.toString(),
        pageNo: pageNo.toString()
      });

      const url = `${PROXY_BASE_URL}/chemlist?${params.toString()}`;
      console.log('프록시 서버를 통한 MSDS API 호출:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 오류:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const xmlDoc = parseXMLResponse(xmlText);
      
      // 결과 코드 확인
      const resultCode = xmlDoc.querySelector('resultCode')?.textContent;
      const resultMsg = xmlDoc.querySelector('resultMsg')?.textContent;
      
      if (resultCode !== '00') {
        throw new Error(`API 오류: ${resultMsg} (코드: ${resultCode})`);
      }

      return parseChemicalList(xmlDoc);
    } catch (error) {
      console.error('화학물질 목록 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 화학물질 상세정보 조회
   * @param chemId 화학물질 ID
   * @param detailType 상세정보 타입 (01~16)
   */
  async getChemicalDetail(
    chemId: number,
    detailType: string = '01'
  ): Promise<ChemicalDetailResponse> {
    try {
      const params = new URLSearchParams({
        chemId: chemId.toString()
      });

      const url = `${PROXY_BASE_URL}/chemdetail/${detailType.padStart(2, '0')}?${params.toString()}`;
      console.log('프록시 서버를 통한 MSDS API 호출:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 오류:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const xmlDoc = parseXMLResponse(xmlText);
      
      // 결과 코드 확인
      const resultCode = xmlDoc.querySelector('resultCode')?.textContent;
      const resultMsg = xmlDoc.querySelector('resultMsg')?.textContent;
      
      if (resultCode !== '00') {
        throw new Error(`API 오류: ${resultMsg} (코드: ${resultCode})`);
      }

      return parseChemicalDetail(xmlDoc);
    } catch (error) {
      console.error('화학물질 상세정보 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 모든 상세정보 항목을 한 번에 조회 (01~16)
   * @param chemId 화학물질 ID
   */
  async getAllChemicalDetails(chemId: number): Promise<Record<string, ChemicalDetailResponse>> {
    const results: Record<string, ChemicalDetailResponse> = {};
    const detailTypes = [
      '01', '02', '03', '04', '05', '06', '07', '08',
      '09', '10', '11', '12', '13', '14', '15', '16'
    ];

    try {
      // 병렬로 모든 상세정보 조회 (단, 서버 부하를 고려해 일부만 병렬 처리)
      const promises = detailTypes.slice(0, 5).map(async (type) => {
        try {
          const result = await this.getChemicalDetail(chemId, type);
          return { type, result };
        } catch (error) {
          console.warn(`상세정보 ${type} 조회 실패:`, error);
          return { type, result: { items: [] } };
        }
      });

      const responses = await Promise.allSettled(promises);
      
      responses.forEach((response) => {
        if (response.status === 'fulfilled' && response.value) {
          results[response.value.type] = response.value.result;
        }
      });

      // 나머지 타입들도 순차적으로 조회
      for (const type of detailTypes.slice(5)) {
        try {
          const result = await this.getChemicalDetail(chemId, type);
          results[type] = result;
        } catch (error) {
          console.warn(`상세정보 ${type} 조회 실패:`, error);
          results[type] = { items: [] };
        }
        
        // API 호출 간격 조절 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return results;
    } catch (error) {
      console.error('전체 상세정보 조회 오류:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const msdsApi = new MSDSApiService();

// 상세정보 타입별 한국어 이름 매핑
export const DETAIL_TYPE_NAMES: Record<string, string> = {
  '01': '화학제품과 회사에 관한 정보',
  '02': '유해성·위험성',
  '03': '구성성분의 명칭 및 함유량',
  '04': '응급조치요령',
  '05': '폭발·화재시 대처방법',
  '06': '누출사고시 대처방법',
  '07': '취급 및 저장방법',
  '08': '노출방지 및 개인보호구',
  '09': '물리화학적 특성',
  '10': '안정성 및 반응성',
  '11': '독성에 관한 정보',
  '12': '환경에 미치는 영향',
  '13': '폐기시 주의사항',
  '14': '운송에 필요한 정보',
  '15': '법적 규제현황',
  '16': '그 밖의 참고사항'
};
