-- ChemiGuard 데이터베이스 스키마
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. 화학물질 테이블
CREATE TABLE IF NOT EXISTS chemicals (
    id BIGSERIAL PRIMARY KEY,
    chemical_name_ko TEXT,
    chemical_name_en TEXT,
    cas_no TEXT,
    un_no TEXT,
    ke_no TEXT,
    en_no TEXT,
    ghs_code TEXT,
    smiles TEXT,
    molecular_formula TEXT,
    toxicity_info TEXT,
    source_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 제품 성분 테이블
CREATE TABLE IF NOT EXISTS product_ingredients (
    id BIGSERIAL PRIMARY KEY,
    product_name_alias TEXT,
    chemical_name_ko TEXT,
    chemical_name_en TEXT,
    cas_no TEXT,
    content_percentage NUMERIC,
    ghs_code TEXT,
    smiles TEXT,
    toxicity_info TEXT,
    source_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 업로드 이력 테이블
CREATE TABLE IF NOT EXISTS upload_history (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    file_size TEXT,
    file_type TEXT,
    data_type TEXT CHECK (data_type IN ('chemicals', 'products')),
    records_count INTEGER DEFAULT 0,
    status TEXT DEFAULT '업로드 완료',
    failed_records JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성 (성능 향상을 위함)
CREATE INDEX IF NOT EXISTS idx_chemicals_cas_no ON chemicals(cas_no);
CREATE INDEX IF NOT EXISTS idx_chemicals_name_ko ON chemicals(chemical_name_ko);
CREATE INDEX IF NOT EXISTS idx_products_cas_no ON product_ingredients(cas_no);
CREATE INDEX IF NOT EXISTS idx_products_name ON product_ingredients(product_name_alias);
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON upload_history(created_at);

-- 5. RLS (Row Level Security) 정책 - 필요시 활성화
-- ALTER TABLE chemicals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

-- 6. 공개 정책 (모든 사용자가 읽기/쓰기 가능)
-- CREATE POLICY "Allow all operations on chemicals" ON chemicals FOR ALL USING (true);
-- CREATE POLICY