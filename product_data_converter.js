// 화학물질 성분 데이터를 제품 단위 데이터로 변환하는 스크립트
import Papa from 'papaparse';
import _ from 'lodash';

async function convertChemicalDataToProducts() {
    try {
        // CSV 파일 읽기
        const fileContent = await window.fs.readFile('/Users/travis/Project/ChemiGuardv1.0/chemiguard_bulk_test_한국어.csv', { encoding: 'utf8' });
        
        // CSV 파싱
        const parsedData = Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            delimitersToGuess: [',', '\t', '|', ';']
        });

        console.log(`📊 원본 데이터: ${parsedData.data.length}개 화학물질 성분 정보`);

        // 제품별로 그룹화 (제품코드 + 세부코드 조합으로)
        const productGroups = _.groupBy(parsedData.data, (row) => {
            return `${row['제품코드']}-${row['세부코드']}`;
        });

        console.log(`🔄 그룹화 결과: ${Object.keys(productGroups).length}개 제품`);

        // 제품 데이터로 변환
        const productData = Object.entries(productGroups).map(([productKey, ingredients]) => {
            // 첫 번째 성분에서 제품 기본 정보 추출 (모든 성분이 같은 제품 정보를 가지므로)
            const baseInfo = ingredients[0];
            
            // 성분 정보 추출 및 정리
            const ingredientsList = ingredients.map(ingredient => ({
                주성분명: ingredient['주성분명'],
                CAS번호: ingredient['CAS번호'],
                함량: ingredient['함량(%)'],
                InChI: ingredient['InChI'] || '',
                SMILES: ingredient['SMILES'] || '',
                화학식: ingredient['화학식'] || '',
                분자량: ingredient['분자량'] || '',
                GHS코드: ingredient['GHS코드'] || '',
                위험등급: ingredient['위험등급'] || '',
                유해문구: ingredient['유해문구'] || '',
                예방조치문구: ingredient['예방조치문구'] || '',
                LD50값: ingredient['LD50값'] || '',
                LD50단위: ingredient['LD50단위'] || '',
                노출경로: ingredient['노출경로'] || ''
            }));
            
            // 위험등급 중 가장 높은 것 선택 (숫자가 낮을수록 위험)
            const riskLevels = ingredients.map(ing => ing['위험등급']).filter(Boolean);
            const highestRisk = riskLevels.length > 0 ? riskLevels.find(level => level.includes('1등급')) || 
                                                        riskLevels.find(level => level.includes('2등급')) ||
                                                        riskLevels[0] : '';
            
            // 제품 단위 데이터 생성
            return {
                제품코드: baseInfo['제품코드'],
                세부코드: baseInfo['세부코드'],
                제품명: baseInfo['제품명'],
                브랜드명: baseInfo['브랜드명'],
                제조사: baseInfo['제조사'],
                제조국: baseInfo['제조국'],
                용도분류: baseInfo['용도분류'],
                성분수: ingredients.length,
                주요성분: ingredientsList.map(ing => ing.주성분명).join(', '),
                최고위험등급: highestRisk,
                전체유해문구: [...new Set(ingredients.map(ing => ing['유해문구']).filter(Boolean))].join('; '),
                전체예방조치: [...new Set(ingredients.map(ing => ing['예방조치문구']).filter(Boolean))].join('; '),
                안전지침: baseInfo['안전지침'],
                수집일자: baseInfo['수집일자'],
                수집자ID: baseInfo['수집자ID'],
                성분상세정보: JSON.stringify(ingredientsList)
            };
        });

        console.log(`✅ 변환 완료: ${productData.length}개 제품으로 변환됨`);

        // CSV 형태로 변환
        const productCsvHeaders = [
            '제품코드', '세부코드', '제품명', '브랜드명', '제조사', '제조국', '용도분류',
            '성분수', '주요성분', '최고위험등급', '전체유해문구', '전체예방조치', 
            '안전지침', '수집일자', '수집자ID', '성분상세정보'
        ];

        const productCsvData = productData.map(product => 
            productCsvHeaders.map(header => product[header] || '')
        );

        const productCsv = Papa.unparse({
            fields: productCsvHeaders,
            data: productCsvData
        });

        // 파일로 저장
        await window.fs.writeFile('/Users/travis/Project/ChemiGuardv1.0/chemiguard_products_한국어.csv', productCsv);
        
        console.log("📁 변환된 제품 데이터가 'chemiguard_products_한국어.csv'로 저장되었습니다!");
        
        // 통계 정보
        console.log("\n📈 변환 통계:");
        const categoryCount = _.countBy(productData, '용도분류');
        Object.entries(categoryCount).forEach(([category, count]) => {
            console.log(`  ${category}: ${count}개`);
        });
        
        const ingredientCounts = productData.map(p => p.성분수);
        console.log(`\n🧪 성분 통계:`);
        console.log(`  평균 성분수: ${(ingredientCounts.reduce((a,b) => a+b, 0) / ingredientCounts.length).toFixed(1)}개`);
        console.log(`  성분수 범위: ${Math.min(...ingredientCounts)}~${Math.max(...ingredientCounts)}개`);
        
        return productData;
        
    } catch (error) {
        console.error("❌ 변환 중 오류 발생:", error);
        return null;
    }
}

// 함수 실행
const result = await convertChemicalDataToProducts();
