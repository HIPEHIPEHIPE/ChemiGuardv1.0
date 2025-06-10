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

