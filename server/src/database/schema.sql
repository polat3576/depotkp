-- ============================================================
-- Restoran Depo Takip Sistemi - Veritabanı Şeması
-- Neon PostgreSQL SQL Editor üzerinde doğrudan çalıştırılır.
-- Migration sistemi yoktur, bu dosya tek seferlik kurulum içindir.
-- Var olan tabloları silmez (DROP TABLE kullanılmaz).
--
-- NOT: Bu dosya hem SIFIRDAN kurulum hem de daha önce eski
-- versiyonu çalıştırılmış bir veritabanını GÜNCELLEME için
-- güvenlidir. Tüm CREATE TABLE / ADD COLUMN ifadeleri IF NOT
-- EXISTS ile korunur, tekrar çalıştırmak hata vermez.
-- ============================================================

-- UUID üretimi için gerekli
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1) businesses
-- Çoklu restoran (multi-tenant) yapısına ileride geçebilmek için
-- tüm ana tablolar business_id üzerinden bu tabloya bağlanır.
-- MVP'de tek bir restoran kaydı kullanılacak.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- email (restaurantEmail): login'de tenant'ı (restoranı) bulmak için kullanılır.
-- Uygulama katmanı zorunlu kılar; var olan kayıtları bozmamak için DB'de
-- nullable + partial unique index (büyük/küçük harf duyarsız).
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email VARCHAR(150);
CREATE UNIQUE INDEX IF NOT EXISTS uq_businesses_email ON businesses (LOWER(email)) WHERE email IS NOT NULL;

-- ------------------------------------------------------------
-- 2) suppliers
-- Stok girişlerinin (satın alma) hangi tedarikçiden yapıldığını
-- kaydetmek için. Cari hesap / borç-alacak takibi YOKTUR, sadece
-- "kimden alındı" bilgisi tutulur.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    phone           VARCHAR(30),
    email           VARCHAR(150),
    address         TEXT,
    note            TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_business_id ON suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_active_name ON suppliers(business_id, is_active, name);

-- ------------------------------------------------------------
-- 3) users
-- Yönetici (admin) ve çalışan (staff) rolleri tek tabloda tutulur.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_business_id ON users(business_id);
CREATE INDEX IF NOT EXISTS idx_users_business_active_name ON users(business_id, is_active, full_name);

-- user_code (userCode): restoran içinde kullanıcıyı ayırt eden kod. Login'de
-- restaurantEmail ile bulunan restoranın içinde bu kodla kullanıcı bulunur.
-- (business_id, user_code) benzersiz; FARKLI restoranlarda aynı kod olabilir.
-- Var olan kayıtları bozmamak için nullable + partial unique index.
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_code VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_business_usercode ON users (business_id, LOWER(user_code)) WHERE user_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_business_usercode_lookup ON users (business_id, LOWER(user_code));

-- ------------------------------------------------------------
-- 4) units
-- business_id NULL ise tüm restoranların ortak kullanabildiği
-- genel (global) birimdir (kg, lt, adet gibi). Bir restoran kendi
-- özel birimini eklerse business_id dolu olur.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS units (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL,
    short_name      VARCHAR(10) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_units_business_id ON units(business_id);

-- ------------------------------------------------------------
-- 5) product_categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_business_id ON product_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_business_active_name ON product_categories(business_id, is_active, name);

-- ------------------------------------------------------------
-- 6) products
-- current_stock hızlı okuma için üründe tutulan anlık stok miktarıdır.
-- Gerçek stok geçmişi stock_movements tablosundadır.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id         UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    unit_id             UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    name                VARCHAR(150) NOT NULL,
    sku                 VARCHAR(50),
    barcode             VARCHAR(50),
    current_stock       NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock_level     NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- default_supplier_id: ürünün varsayılan/tercih edilen tedarikçisi (opsiyonel).
-- Bu SADECE "genelde kimden alıyoruz" bilgisidir; gerçek alım geçmişi (hangi
-- tarihte hangi tedarikçiden/fiyattan alındığı) stock_movements.supplier_id
-- üzerinden ayrıca ve bağımsız olarak tutulmaya devam eder.
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_active_name ON products(business_id, is_active, name);
CREATE INDEX IF NOT EXISTS idx_products_business_barcode ON products(business_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_default_supplier_id ON products(default_supplier_id);

-- ------------------------------------------------------------
-- 7) stock_movements
-- Her stok girişi, çıkışı, sayım farkı ve manuel düzeltme burada
-- kalıcı bir kayıt olarak tutulur. Kayıtlar değiştirilmez (immutable
-- log), bu yüzden updated_at yoktur. quantity her zaman pozitif
-- tutulur; yön movement_type ile belirlenir:
--   IN                -> stok girişi / ürün alımı (satın alma)
--   OUT               -> depodan ürün çıkışı / kullanım
--   COUNT_CORRECTION  -> sayım sonucu oluşan fark düzeltmesi
--   ADJUSTMENT        -> manuel düzeltme (kayıp, fire, hata vb.)
--
-- supplier_id, unit_cost, document_no alanları öncelikle IN
-- hareketlerinde doldurulur. OUT / COUNT_CORRECTION / ADJUSTMENT
-- hareketlerinde genelde boş (NULL) kalır. unit_cost veritabanında
-- nullable'dır; "IN hareketinde zorunlu olsun" kuralı bilinçli
-- olarak veritabanı constraint'i değil, uygulama (service) katmanı
-- validasyonu olarak uygulanacaktır.
--
-- Toplam tutar (quantity * unit_cost) ayrı bir kolon olarak
-- SAKLANMAZ, ihtiyaç duyulan sorgularda hesaplanır.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    movement_type   VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'COUNT_CORRECTION', 'ADJUSTMENT')),
    quantity        NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit_cost       NUMERIC(12, 2),
    note            TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alım geçmişi (tedarikçi + belge no) için eklenen kolonlar.
-- ADD COLUMN IF NOT EXISTS sayesinde bu blok, tablo daha önce eski
-- haliyle oluşturulmuş olsa bile güvenle tekrar çalıştırılabilir.
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS document_no VARCHAR(100);

-- direction: hareketin stok üzerindeki yönü ('in' = artırır, 'out' = azaltır).
-- Miktar (quantity) her zaman pozitiftir; artı/eksi etkisi bu kolonla belirlenir.
-- IN -> 'in', OUT -> 'out' otomatik; ADJUSTMENT/COUNT_CORRECTION için yön
-- uygulama tarafından belirlenir. Uygulama katmanı bu alanı her zaman doldurur.
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS direction VARCHAR(3) CHECK (direction IN ('in', 'out'));

CREATE INDEX IF NOT EXISTS idx_stock_movements_business_id ON stock_movements(business_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_type_occurred ON stock_movements(business_id, movement_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_product_occurred ON stock_movements(business_id, product_id, occurred_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_supplier_id ON stock_movements(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_occurred_at ON stock_movements(occurred_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_document_no ON stock_movements(document_no);

-- ------------------------------------------------------------
-- 8) inventory_counts
-- Bir sayım oturumunun başlığı (kim yaptı, ne zaman, durumu).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_counts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    counted_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
    note            TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_counts_business_id ON inventory_counts(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_business_created ON inventory_counts(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_business_status_created ON inventory_counts(business_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_counted_by ON inventory_counts(counted_by);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_status ON inventory_counts(status);

-- ------------------------------------------------------------
-- 9) inventory_count_items
-- Bir sayım oturumu içindeki her ürün satırı.
-- difference_quantity, counted_quantity - expected_quantity olarak
-- otomatik hesaplanan bir kolondur (trigger değildir, generated column'dur).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_count_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_count_id      UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
    product_id              UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    expected_quantity       NUMERIC(12, 3) NOT NULL DEFAULT 0,
    counted_quantity        NUMERIC(12, 3),
    difference_quantity     NUMERIC(12, 3) GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
    note                    TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (inventory_count_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_count_items_inventory_count_id ON inventory_count_items(inventory_count_id);
CREATE INDEX IF NOT EXISTS idx_inventory_count_items_product_id ON inventory_count_items(product_id);
