-- =====================================================
-- ChemiGuard v1.0 추가 테이블 생성 SQL
-- 기존 workers 테이블과 함께 사용
-- =====================================================

-- 1. 제품 정보 테이블
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_name_anonymized VARCHAR(255),
  product_category VARCHAR(100),
  product_subcategory VARCHAR(100),
  manufacturer VARCHAR(255),
  manufacturer_anonymized VARCHAR(255),
  country_of_origin VARCHAR(50),
  usage_purpose TEXT,
  collected_date DATE,
  collected_source VARCHAR(255),
  collected_method VARCHAR(50),
  source_reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'collected',
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(product_category);
CREATE INDEX idx_products_assigned_to ON products(assigned_to);

-- 2. 제품 성분 테이블
CREATE TABLE IF NOT EXISTS product_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
  ingredient_id VARCHAR(50) UNIQUE NOT NULL,
  main_ingredient VARCHAR(255) NOT NULL,
  cas_number VARCHAR(50),
  chemical_formula VARCHAR(255),
  molecular_weight DECIMAL(10, 4),
  iupac_name TEXT,
  smiles_code TEXT,
  content_percentage DECIMAL(5, 2),
  status VARCHAR(20) DEFAULT 'collected',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID
);

CREATE INDEX idx_product_ingredients_product_id ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_cas_number ON product_ingredients(cas_number);
CREATE INDEX idx_product_ingredients_status ON product_ingredients(status);

-- 3. GHS 분류 정보 테이블
CREATE TABLE IF NOT EXISTS ghs_classifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id VARCHAR(50) REFERENCES product_ingredients(ingredient_id),
  ghs_code VARCHAR(50) NOT NULL,
  hazard_class VARCHAR(255),
  hazard_category VARCHAR(50),
  signal_word VARCHAR(50),
  hazard_statement TEXT,
  hazard_statement_code VARCHAR(50),
  precautionary_statement TEXT,
  precautionary_statement_code VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE INDEX idx_ghs_classifications_ingredient_id ON ghs_classifications(ingredient_id);
CREATE INDEX idx_ghs_classifications_ghs_code ON ghs_classifications(ghs_code);

-- 4. 독성 정보 테이블
CREATE TABLE IF NOT EXISTS toxicity_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id VARCHAR(50) REFERENCES product_ingredients(ingredient_id),
  toxicity_type VARCHAR(100),
  toxicity_value VARCHAR(100),
  exposure_route VARCHAR(50),
  test_species VARCHAR(100),
  health_effects TEXT,
  first_aid_measures TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_toxicity_info_ingredient_id ON toxicity_info(ingredient_id);

-- 5. AI 학습 데이터 테이블
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_id VARCHAR(50) UNIQUE NOT NULL,
  product_id VARCHAR(50) REFERENCES products(product_id),
  ingredient_id VARCHAR(50) REFERENCES product_ingredients(ingredient_id),
  data_version VARCHAR(10) DEFAULT '1.0',
  caption_type VARCHAR(50),
  caption TEXT NOT NULL,
  caption_created_by VARCHAR(50),
  caption_created_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft',
  review_status VARCHAR(20),
  review_feedback TEXT,
  gemini_prompt TEXT,
  gemini_response_raw TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modified_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  reviewed_by UUID
);

CREATE INDEX idx_ai_training_data_product_id ON ai_training_data(product_id);
CREATE INDEX idx_ai_training_data_caption_type ON ai_training_data(caption_type);
CREATE INDEX idx_ai_training_data_status ON ai_training_data(status);

-- 6. 질의응답 데이터 테이블
CREATE TABLE IF NOT EXISTS qa_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_data_id UUID REFERENCES ai_training_data(id) ON DELETE CASCADE,
  qa_user_type VARCHAR(20),
  qa_type VARCHAR(50),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sequence_order INTEGER DEFAULT 0,
  qa_created_by VARCHAR(50),
  qa_created_method VARCHAR(50),
  gemini_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE INDEX idx_qa_pairs_training_data_id ON qa_pairs(training_data_id);
CREATE INDEX idx_qa_pairs_user_type ON qa_pairs(qa_user_type);
CREATE INDEX idx_qa_pairs_qa_type ON qa_pairs(qa_type);

-- 7. 메타데이터 테이블
CREATE TABLE IF NOT EXISTS metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type VARCHAR(50),
  reference_id VARCHAR(50),
  meta_key VARCHAR(100),
  meta_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metadata_reference_id ON metadata(reference_id);
CREATE INDEX idx_metadata_data_type ON metadata(data_type);

-- 8. 사용자 역할 추가 정보 테이블 (workers 테이블과 연동)
CREATE TABLE IF NOT EXISTS worker_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL,
  role_type VARCHAR(50) NOT NULL,
  permissions JSONB,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID,
  UNIQUE(worker_id, role_type)
);

-- 9. 작업 이력 테이블
CREATE TABLE IF NOT EXISTS work_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL,
  work_type VARCHAR(50),
  target_type VARCHAR(50),
  target_id UUID,
  action VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_logs_worker_id ON work_logs(worker_id);
CREATE INDEX idx_work_logs_created_at ON work_logs(created_at);

-- 10. MSDS 문서 분석 테이블
CREATE TABLE IF NOT EXISTS msds_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id VARCHAR(50) REFERENCES products(product_id),
  file_name VARCHAR(255),
  file_url TEXT,
  file_size INTEGER,
  extracted_data JSONB,
  extraction_status VARCHAR(20),
  extraction_error TEXT,
  gemini_model_used VARCHAR(50),
  gemini_prompt_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

-- 11. 프로젝트 관리 테이블
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  description TEXT,
  target_count INTEGER,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

-- 12. 작업 할당 테이블
CREATE TABLE IF NOT EXISTS work_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  assigned_to UUID NOT NULL,
  work_type VARCHAR(50),
  target_count INTEGER,
  completed_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'assigned',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

-- 13. 품질 검증 테이블
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_data_id UUID REFERENCES ai_training_data(id),
  check_type VARCHAR(50),
  check_result BOOLEAN,
  error_details JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  checked_by UUID
);

-- 14. 검수 피드백 테이블
CREATE TABLE IF NOT EXISTS review_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_data_id UUID REFERENCES ai_training_data(id),
  reviewer_id UUID NOT NULL,
  feedback_type VARCHAR(50),
  feedback_text TEXT,
  severity VARCHAR(20),
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

-- 15. 제품 카테고리 테이블
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  category_code VARCHAR(50) UNIQUE NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  target_percentage DECIMAL(5,2)
);

-- 제품 카테고리 초기 데이터 삽입
INSERT INTO product_categories (category_code, category_name, target_percentage) VALUES
('cleaning', '세정제품', 4.71),
('laundry', '세탁제품', 3.10),
('coating', '코팅제품', 2.64),
('adhesive', '접착·접합제품', 1.10),
('deodorant', '방향·탈취제품', 40.73),
('dyeing', '염색·도색제품', 3.54),
('automotive', '자동차 전용 제품', 0.21),
('printing', '인쇄 및 문서관련 제품', 7.19),
('beauty', '미용제품', 2.37),
('sports', '여가용품 관리제품', 0.02),
('biocide', '살균제품', 1.18),
('pesticide', '구제제품', 0.11),
('preservative', '보존·보존처리제품', 0.08),
('others', '기타', 33.01);

-- =====================================================
-- 뷰 생성
-- =====================================================

-- 제품군별 데이터 구축 현황
CREATE VIEW v_product_category_stats AS
SELECT 
  product_category,
  COUNT(*) as total_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_count,
  COUNT(CASE WHEN status = 'annotated' THEN 1 END) as annotated_count
FROM products
GROUP BY product_category;

-- 작업자별 일일 실적
CREATE VIEW v_daily_work_stats AS
SELECT 
  DATE(created_at) as work_date,
  worker_id,
  work_type,
  COUNT(*) as work_count
FROM work_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), worker_id, work_type;

-- AI 학습 데이터 구축 현황
CREATE VIEW v_training_data_stats AS
SELECT 
  caption_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(DISTINCT product_id) as unique_products,
  AVG(CASE WHEN status = 'approved' THEN 
    (SELECT COUNT(*) FROM qa_pairs WHERE training_data_id = ai_training_data.id)
  END) as avg_qa_pairs_per_caption
FROM ai_training_data
GROUP BY caption_type;

-- AI 학습 데이터 통합 뷰
CREATE VIEW v_ai_training_complete AS
SELECT 
  atd.id as training_id,
  atd.data_id,
  atd.caption_type,
  atd.caption,
  p.product_id,
  p.product_name,
  p.product_category,
  pi.main_ingredient,
  pi.cas_number,
  json_agg(
    json_build_object(
      'qa_user_type', qp.qa_user_type,
      'qa_type', qp.qa_type,
      'question', qp.question,
      'answer', qp.answer
    ) ORDER BY qp.sequence_order
  ) as qa_pairs
FROM ai_training_data atd
LEFT JOIN products p ON atd.product_id = p.product_id
LEFT JOIN product_ingredients pi ON atd.ingredient_id = pi.ingredient_id
LEFT JOIN qa_pairs qp ON atd.id = qp.training_data_id
GROUP BY atd.id, atd.data_id, atd.caption_type, atd.caption, 
         p.product_id, p.product_name, p.product_category,
         pi.main_ingredient, pi.cas_number;

-- =====================================================
-- 함수 및 트리거
-- =====================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_product_ingredients_updated_at BEFORE UPDATE ON product_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ai_training_data_modified BEFORE UPDATE ON ai_training_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- JSON Export 함수
CREATE OR REPLACE FUNCTION export_training_data_json(p_data_id VARCHAR)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'info', json_build_object(
      'year', EXTRACT(YEAR FROM CURRENT_DATE),
      'version', data_version,
      'created_date', created_date,
      'modified_date', modified_date
    ),
    'origin_data', json_build_object(
      'id', p.product_id,
      'collected_category', p.product_category,
      'collected_item', p.product_subcategory,
      'product_name', p.product_name_anonymized,
      'collected_date', p.collected_date,
      'collected_source', p.collected_source,
      'collected_method', p.collected_method
    ),
    'source_data', json_build_object(
      'id', pi.ingredient_id,
      'main_ingredient', pi.main_ingredient,
      'cas_no', pi.cas_number,
      'ghs_code', gc.ghs_code,
      'toxicity_info', ti.toxicity_type,
      'hazard_statement', gc.hazard_statement,
      'precautionary_statement', gc.precautionary_statement,
      'exposure_pathway', ti.exposure_route,
      'health_effects', ti.health_effects,
      'source_reference', p.source_reference
    ),
    'annotations', json_build_object(
      'caption_type', atd.caption_type,
      'caption', atd.caption,
      'qa', (
        SELECT json_agg(
          json_build_object(
            'qa_user_type', qa_user_type,
            'qa_type', qa_type,
            'question', question,
            'answer', answer
          ) ORDER BY sequence_order
        )
        FROM qa_pairs
        WHERE training_data_id = atd.id
      )
    )
  ) INTO result
  FROM ai_training_data atd
  JOIN products p ON atd.product_id = p.product_id
  LEFT JOIN product_ingredients pi ON atd.ingredient_id = pi.ingredient_id
  LEFT JOIN ghs_classifications gc ON pi.ingredient_id = gc.ingredient_id
  LEFT JOIN toxicity_info ti ON pi.ingredient_id = ti.ingredient_id
  WHERE atd.data_id = p_data_id
    AND atd.status = 'approved';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 중복 검출 함수
CREATE OR REPLACE FUNCTION check_duplicate_ingredients()
RETURNS TABLE(
  ingredient_id1 VARCHAR,
  ingredient_id2 VARCHAR,
  cas_number VARCHAR,
  main_ingredient VARCHAR,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.ingredient_id,
    b.ingredient_id,
    a.cas_number,
    a.main_ingredient,
    similarity(a.main_ingredient, b.main_ingredient) as similarity_score
  FROM product_ingredients a
  JOIN product_ingredients b 
    ON a.cas_number = b.cas_number 
    AND a.ingredient_id < b.ingredient_id
  WHERE a.cas_number IS NOT NULL
  ORDER BY similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ChemiGuard v1.1 개선된 데이터베이스 스키마
-- 독립적인 chemicals 테이블 추가
-- =====================================================

-- 새로 추가: 화학물질 마스터 테이블 (독립적)
CREATE TABLE IF NOT EXISTS chemicals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_id VARCHAR(50) UNIQUE NOT NULL,
  chemical_name_ko VARCHAR(255) NOT NULL,
  chemical_name_en VARCHAR(255),
  cas_no VARCHAR(50) UNIQUE,
  chemical_formula VARCHAR(255),
  molecular_weight DECIMAL(10, 4),
  iupac_name TEXT,
  smiles TEXT,
  physical_state VARCHAR(50), -- 물리적 상태 (고체/액체/기체)
  melting_point VARCHAR(100),
  boiling_point VARCHAR(100),
  density VARCHAR(100),
  solubility TEXT,
  ph_value VARCHAR(50),
  vapor_pressure VARCHAR(100),
  flash_point VARCHAR(100),
  autoignition_temp VARCHAR(100),
  -- 데이터 수집 정보
  collected_date DATE,
  collected_source VARCHAR(255),
  collected_method VARCHAR(50),
  source_reference VARCHAR(255),
  data_quality_score DECIMAL(3,2), -- 데이터 품질 점수 (0.00-1.00)
  verification_status VARCHAR(20) DEFAULT 'pending', -- verified, pending, rejected
  -- 메타정보
  status VARCHAR(20) DEFAULT 'collected',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  -- 원본 데이터 보존
  raw_data JSONB
);

CREATE INDEX idx_chemicals_cas_no ON chemicals(cas_no);
CREATE INDEX idx_chemicals_status ON chemicals(status);
CREATE INDEX idx_chemicals_chemical_name_ko ON chemicals(chemical_name_ko);
CREATE INDEX idx_chemicals_verification_status ON chemicals(verification_status);

-- GHS 분류 정보 테이블 (화학물질과 직접 연결)
CREATE TABLE IF NOT EXISTS chemical_ghs_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_id VARCHAR(50) REFERENCES chemicals(chemical_id) ON DELETE CASCADE,
  ghs_code VARCHAR(50) NOT NULL,
  hazard_class VARCHAR(255),
  hazard_category VARCHAR(50),
  signal_word VARCHAR(50), -- 위험, 경고
  hazard_statement TEXT,
  hazard_statement_code VARCHAR(50), -- H코드
  precautionary_statement TEXT,
  precautionary_statement_code VARCHAR(255), -- P코드
  ghs_pictogram VARCHAR(255), -- 그림문자 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE INDEX idx_chemical_ghs_chemical_id ON chemical_ghs_info(chemical_id);
CREATE INDEX idx_chemical_ghs_code ON chemical_ghs_info(ghs_code);

-- 화학물질 독성 정보 테이블
CREATE TABLE IF NOT EXISTS chemical_toxicity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_id VARCHAR(50) REFERENCES chemicals(chemical_id) ON DELETE CASCADE,
  toxicity_type VARCHAR(100), -- 급성독성, 피부부식성, 발암성 등
  toxicity_category VARCHAR(50), -- 카테고리 1, 2, 3 등
  exposure_route VARCHAR(50), -- 경구, 경피, 흡입
  test_species VARCHAR(100), -- 실험동물 종류
  test_value VARCHAR(100), -- LD50, LC50 등 수치
  test_unit VARCHAR(50), -- mg/kg, ppm 등
  health_effects TEXT, -- 건강 영향
  symptoms TEXT, -- 증상
  first_aid_measures TEXT, -- 응급조치
  chronic_effects TEXT, -- 만성 영향
  target_organs TEXT, -- 표적장기
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_source VARCHAR(255), -- 데이터 출처
  reliability_score DECIMAL(3,2) -- 신뢰도 점수
);

CREATE INDEX idx_chemical_toxicity_chemical_id ON chemical_toxicity(chemical_id);
CREATE INDEX idx_chemical_toxicity_type ON chemical_toxicity(toxicity_type);

-- 화학물질 규제 정보 테이블
CREATE TABLE IF NOT EXISTS chemical_regulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_id VARCHAR(50) REFERENCES chemicals(chemical_id) ON DELETE CASCADE,
  regulation_type VARCHAR(100), -- REACH, K-REACH, TSCA 등
  regulation_status VARCHAR(50), -- 등록완료, 제한물질, 금지물질 등
  restriction_info TEXT, -- 제한 내용
  registration_number VARCHAR(100), -- 등록번호
  effective_date DATE, -- 시행일
  restriction_limit VARCHAR(100), -- 제한 농도/양
  country_code VARCHAR(10), -- 국가코드
  regulatory_body VARCHAR(100), -- 규제기관
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chemical_regulations_chemical_id ON chemical_regulations(chemical_id);
CREATE INDEX idx_chemical_regulations_type ON chemical_regulations(regulation_type);

-- 화학물질 사용용도 테이블
CREATE TABLE IF NOT EXISTS chemical_uses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_id VARCHAR(50) REFERENCES chemicals(chemical_id) ON DELETE CASCADE,
  use_category VARCHAR(100), -- 산업용, 소비자용, 전문가용
  specific_use VARCHAR(255), -- 구체적 용도
  use_description TEXT, -- 용도 설명
  concentration_range VARCHAR(100), -- 농도 범위
  frequency_of_use VARCHAR(50), -- 사용 빈도
  exposure_potential VARCHAR(50), -- 노출 가능성 (높음/중간/낮음)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chemical_uses_chemical_id ON chemical_uses(chemical_id);

-- 기존 product_ingredients 테이블 수정 (chemicals 테이블과 연결)
-- ALTER TABLE product_ingredients ADD COLUMN chemical_id VARCHAR(50) REFERENCES chemicals(chemical_id);
-- CREATE INDEX idx_product_ingredients_chemical_id ON product_ingredients(chemical_id);

-- AI 학습 데이터를 위한 화학물질 설명문 테이블
CREATE TABLE IF NOT EXISTS chemical_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_id VARCHAR(50) REFERENCES chemicals(chemical_id) ON DELETE CASCADE,
  description_type VARCHAR(50), -- 주성분설명, 독성설명, 경고문설명
  description TEXT NOT NULL,
  target_audience VARCHAR(50), -- 일반사용자, 전문가
  language_code VARCHAR(10) DEFAULT 'ko',
  generated_by VARCHAR(50), -- AI, 전문가, 크롤링
  quality_score DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'draft', -- draft, reviewed, approved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

CREATE INDEX idx_chemical_descriptions_chemical_id ON chemical_descriptions(chemical_id);
CREATE INDEX idx_chemical_descriptions_type ON chemical_descriptions(description_type);
CREATE INDEX idx_chemical_descriptions_status ON chemical_descriptions(status);

-- 화학물질 QA 데이터 테이블
CREATE TABLE IF NOT EXISTS chemical_qa_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_id VARCHAR(50) REFERENCES chemicals(chemical_id) ON DELETE CASCADE,
  description_id UUID REFERENCES chemical_descriptions(id),
  qa_user_type VARCHAR(20), -- 일반사용자, 전문가
  qa_type VARCHAR(50), -- 성분이해, 독성설명, 경고문이해, 사용법안내
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sequence_order INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2), -- 답변 신뢰도
  generated_by VARCHAR(50), -- AI모델명 또는 전문가
  validation_status VARCHAR(20) DEFAULT 'pending', -- validated, pending, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID
);

CREATE INDEX idx_chemical_qa_chemical_id ON chemical_qa_pairs(chemical_id);
CREATE INDEX idx_chemical_qa_user_type ON chemical_qa_pairs(qa_user_type);
CREATE INDEX idx_chemical_qa_type ON chemical_qa_pairs(qa_type);

-- 화학물질 동의어/별명 테이블
CREATE TABLE IF NOT EXISTS chemical_synonyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_id VARCHAR(50) REFERENCES chemicals(chemical_id) ON DELETE CASCADE,
  synonym_name VARCHAR(255) NOT NULL,
  synonym_type VARCHAR(50), -- 상품명, 일반명, 학명, 약어
  language_code VARCHAR(10) DEFAULT 'ko',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chemical_synonyms_chemical_id ON chemical_synonyms(chemical_id);
CREATE INDEX idx_chemical_synonyms_name ON chemical_synonyms(synonym_name);

-- =====================================================
-- 데이터 뷰 (PDF 요구사항에 맞춘 통합 뷰)
-- =====================================================

-- 화학물질 완전 정보 뷰 (AI 학습용)
CREATE VIEW v_chemical_complete_info AS
SELECT 
  c.chemical_id,
  c.chemical_name_ko,
  c.chemical_name_en,
  c.cas_no,
  c.chemical_formula,
  c.smiles,
  -- GHS 정보
  cg.ghs_code,
  cg.hazard_class,
  cg.signal_word,
  cg.hazard_statement,
  cg.precautionary_statement,
  -- 독성 정보
  ct.toxicity_type,
  ct.exposure_route,
  ct.health_effects,
  ct.first_aid_measures,
  -- 설명문
  cd.description,
  cd.description_type,
  cd.target_audience,
  -- QA 정보
  json_agg(
    json_build_object(
      'qa_user_type', cqa.qa_user_type,
      'qa_type', cqa.qa_type,
      'question', cqa.question,
      'answer', cqa.answer,
      'confidence_score', cqa.confidence_score
    ) ORDER BY cqa.sequence_order
  ) FILTER (WHERE cqa.id IS NOT NULL) as qa_pairs
FROM chemicals c
LEFT JOIN chemical_ghs_info cg ON c.chemical_id = cg.chemical_id
LEFT JOIN chemical_toxicity ct ON c.chemical_id = ct.chemical_id
LEFT JOIN chemical_descriptions cd ON c.chemical_id = cd.chemical_id
LEFT JOIN chemical_qa_pairs cqa ON c.chemical_id = cqa.chemical_id
WHERE c.status = 'collected' 
  AND c.verification_status IN ('verified', 'pending')
GROUP BY c.chemical_id, c.chemical_name_ko, c.chemical_name_en, c.cas_no, 
         c.chemical_formula, c.smiles, cg.ghs_code, cg.hazard_class, cg.signal_word,
         cg.hazard_statement, cg.precautionary_statement, ct.toxicity_type, 
         ct.exposure_route, ct.health_effects, ct.first_aid_measures,
         cd.description, cd.description_type, cd.target_audience;

-- 화학물질 통계 뷰
CREATE VIEW v_chemical_stats AS
SELECT 
  COUNT(*) as total_chemicals,
  COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_count,
  COUNT(CASE WHEN cas_no IS NOT NULL THEN 1 END) as with_cas_count,
  COUNT(CASE WHEN smiles IS NOT NULL THEN 1 END) as with_smiles_count,
  COUNT(DISTINCT collected_source) as data_sources_count
FROM chemicals
WHERE status = 'collected';

-- =====================================================
-- 트리거 추가
-- =====================================================

-- chemicals 테이블 updated_at 트리거
CREATE TRIGGER update_chemicals_updated_at 
  BEFORE UPDATE ON chemicals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 데이터 마이그레이션을 위한 함수
-- =====================================================

-- product_ingredients에서 chemicals로 데이터 마이그레이션
CREATE OR REPLACE FUNCTION migrate_ingredients_to_chemicals()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  ingredient_record RECORD;
BEGIN
  -- product_ingredients의 화학물질 정보를 chemicals 테이블로 복사
  FOR ingredient_record IN 
    SELECT DISTINCT ON (cas_number) 
      main_ingredient, cas_number, chemical_formula, 
      molecular_weight, iupac_name, smiles_code, status
    FROM product_ingredients 
    WHERE cas_number IS NOT NULL
  LOOP
    INSERT INTO chemicals (
      chemical_id, chemical_name_ko, cas_no, chemical_formula,
      molecular_weight, iupac_name, smiles, status,
      collected_method, collected_source
    ) VALUES (
      'CHEM-' || EXTRACT(epoch FROM NOW()) || '-' || migrated_count,
      ingredient_record.main_ingredient,
      ingredient_record.cas_number,
      ingredient_record.chemical_formula,
      ingredient_record.molecular_weight,
      ingredient_record.iupac_name,
      ingredient_record.smiles_code,
      ingredient_record.status,
      'migration_from_ingredients',
      'product_ingredients_table'
    ) ON CONFLICT (cas_no) DO NOTHING;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- JSON 내보내기 함수 (AI 학습용)
-- =====================================================

CREATE OR REPLACE FUNCTION export_chemical_training_data(p_chemical_id VARCHAR)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'info', json_build_object(
      'chemical_id', c.chemical_id,
      'created_date', c.created_at,
      'data_version', '1.0'
    ),
    'chemical_data', json_build_object(
      'chemical_name_ko', c.chemical_name_ko,
      'chemical_name_en', c.chemical_name_en,
      'cas_no', c.cas_no,
      'chemical_formula', c.chemical_formula,
      'smiles', c.smiles,
      'physical_properties', json_build_object(
        'melting_point', c.melting_point,
        'boiling_point', c.boiling_point,
        'density', c.density
      )
    ),
    'ghs_info', (
      SELECT json_agg(
        json_build_object(
          'ghs_code', ghs_code,
          'hazard_class', hazard_class,
          'signal_word', signal_word,
          'hazard_statement', hazard_statement,
          'precautionary_statement', precautionary_statement
        )
      )
      FROM chemical_ghs_info 
      WHERE chemical_id = p_chemical_id
    ),
    'toxicity_info', (
      SELECT json_agg(
        json_build_object(
          'toxicity_type', toxicity_type,
          'exposure_route', exposure_route,
          'health_effects', health_effects,
          'first_aid_measures', first_aid_measures
        )
      )
      FROM chemical_toxicity 
      WHERE chemical_id = p_chemical_id
    ),
    'descriptions', (
      SELECT json_agg(
        json_build_object(
          'description_type', description_type,
          'description', description,
          'target_audience', target_audience
        )
      )
      FROM chemical_descriptions 
      WHERE chemical_id = p_chemical_id AND status = 'approved'
    ),
    'qa_pairs', (
      SELECT json_agg(
        json_build_object(
          'qa_user_type', qa_user_type,
          'qa_type', qa_type,
          'question', question,
          'answer', answer,
          'confidence_score', confidence_score
        ) ORDER BY sequence_order
      )
      FROM chemical_qa_pairs 
      WHERE chemical_id = p_chemical_id AND validation_status = 'validated'
    )
  ) INTO result
  FROM chemicals c
  WHERE c.chemical_id = p_chemical_id
    AND c.status = 'collected';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

