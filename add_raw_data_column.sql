-- products 테이블에 raw_data 컬럼 추가
ALTER TABLE products ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- 인덱스 추가 (옵션)
CREATE INDEX IF NOT EXISTS idx_products_raw_data ON products USING GIN (raw_data);
