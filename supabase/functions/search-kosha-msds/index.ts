// supabase/functions/search-kosha-msds/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { XMLParser } from "https://deno.land/x/fast_xml_parser@v4.2.7/mod.ts";

const KOSHA_API_URL = "https://msds.kosha.or.kr/openapi/service/msdschem/chemlist";

// KOSHA API의 실제 응답 item 구조에 대한 타입
interface KoshaApiItem {
  casNo: string;
  chemId: string;
  chemNameKor: string;
  enNo: string;
  keNo: string;
  unNo: string;
  lastDate: string;
}

// 우리가 가공하여 프론트엔드에 전달할 데이터 구조
interface ProcessedChemData {
  cas_no: string;
  chemical_name_ko: string;
  ghs_code: string | null;
  smiles: string | null;
  source_api: string;
  source_chem_id: string;
}

serve(async (req: Request) => {
  // <<< 이 부분이 바로 CORS를 처리하는 로직입니다. >>>
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*', // 모든 출처 허용
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } });
  }

  try {
    const { searchTerm } = await req.json();
    const serviceKey = Deno.env.get("KOSHA_API_KEY");

    if (!serviceKey) throw new Error("KOSHA API 키가 설정되지 않았습니다.");

    const params = new URLSearchParams({
      serviceKey: serviceKey,
      searchWrd: searchTerm,
      searchCnd: '0',
    });

    const response = await fetch(`${KOSHA_API_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`KOSHA API 호출 실패: ${response.statusText}`);

    const xmlText = await response.text();
    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlText);

    let items: KoshaApiItem[] = jsonObj?.response?.body?.items?.item;
    if (!items) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!Array.isArray(items)) {
      items = [items];
    }
    
    // 수행계획서의 필드를 고려하여 데이터 가공
    const processedData: ProcessedChemData[] = items.map((item: KoshaApiItem) => ({
      cas_no: item.casNo,
      chemical_name_ko: item.chemNameKor,
      ghs_code: null, 
      smiles: null,
      source_api: "KOSHA_MSDS",
      source_chem_id: item.chemId,
    }));

 return new Response(JSON.stringify(processedData), {
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*' // 모든 출처 허용
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 에러가 발생했습니다.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*' // 모든 출처 허용
      },
    });
  }
});