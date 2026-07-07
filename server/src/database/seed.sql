-- ============================================================
-- Restoran Depo Takip Sistemi - Demo Veri (Seed)
-- schema.sql çalıştırıldıktan SONRA çalıştırılmalıdır.
-- Sabit UUID'ler kullanılır ve ON CONFLICT DO NOTHING ile
-- birden fazla çalıştırılsa da veri tekrar eklenmez (idempotent).
--
-- NOT: current_stock alanı burada demo amaçlı sabit bir değer
-- olarak set edilmiştir. Gerçek kullanımda her stok hareketi
-- eklendiğinde current_stock'un uygulama katmanında güncellenmesi
-- gerekir; bu yüzden aşağıdaki demo stock_movements kayıtlarının
-- toplamı current_stock ile birebir uyuşmayabilir - amaç sadece
-- alım geçmişi sorgularını test edebilmektir.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Demo business
-- ------------------------------------------------------------
INSERT INTO businesses (id, name, email, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Demo Restoran', 'info@demorestoran.com', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2) Demo admin kullanıcı
-- NOT: password_hash burada gerçek bir bcrypt hash DEĞİLDİR.
-- Auth modülü yazılınca bu kullanıcı gerçek bir hash ile
-- güncellenmeli veya kayıt API üzerinden yeniden oluşturulmalıdır.
-- ------------------------------------------------------------
INSERT INTO users (id, business_id, full_name, email, user_code, password_hash, role, is_active) VALUES
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
     'Demo Yönetici', 'admin@demorestoran.com', 'ADM001', 'REPLACE_WITH_BCRYPT_HASH', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 3) Temel birimler (global - business_id NULL, tüm restoranlar kullanabilir)
-- ------------------------------------------------------------
INSERT INTO units (id, business_id, name, short_name) VALUES
    ('33333333-3333-3333-3333-333333333001', NULL, 'Kilogram', 'kg'),
    ('33333333-3333-3333-3333-333333333002', NULL, 'Gram', 'g'),
    ('33333333-3333-3333-3333-333333333003', NULL, 'Litre', 'lt'),
    ('33333333-3333-3333-3333-333333333004', NULL, 'Mililitre', 'ml'),
    ('33333333-3333-3333-3333-333333333005', NULL, 'Adet', 'adet'),
    ('33333333-3333-3333-3333-333333333006', NULL, 'Paket', 'paket')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 4) Demo kategoriler
-- ------------------------------------------------------------
INSERT INTO product_categories (id, business_id, name, description, is_active) VALUES
    ('44444444-4444-4444-4444-444444444001', '11111111-1111-1111-1111-111111111111', 'Et Ürünleri', NULL, true),
    ('44444444-4444-4444-4444-444444444002', '11111111-1111-1111-1111-111111111111', 'Sebze & Meyve', NULL, true),
    ('44444444-4444-4444-4444-444444444003', '11111111-1111-1111-1111-111111111111', 'Temel Gıda', NULL, true),
    ('44444444-4444-4444-4444-444444444004', '11111111-1111-1111-1111-111111111111', 'Temizlik Malzemeleri', NULL, true),
    ('44444444-4444-4444-4444-444444444005', '11111111-1111-1111-1111-111111111111', 'İçecekler', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 5) Demo ürünler
-- ------------------------------------------------------------
INSERT INTO products (id, business_id, category_id, unit_id, name, sku, current_stock, min_stock_level, is_active) VALUES
    ('55555555-5555-5555-5555-555555555001', '11111111-1111-1111-1111-111111111111',
     '44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333001',
     'Tavuk But', 'ET-001', 25.5, 10, true),

    ('55555555-5555-5555-5555-555555555002', '11111111-1111-1111-1111-111111111111',
     '44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333001',
     'Domates', 'SEB-001', 40, 15, true),

    ('55555555-5555-5555-5555-555555555003', '11111111-1111-1111-1111-111111111111',
     '44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333003',
     'Zeytinyağı', 'GID-001', 12, 5, true),

    ('55555555-5555-5555-5555-555555555004', '11111111-1111-1111-1111-111111111111',
     '44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333003',
     'Çamaşır Suyu', 'TEM-001', 8, 3, true),

    ('55555555-5555-5555-5555-555555555005', '11111111-1111-1111-1111-111111111111',
     '44444444-4444-4444-4444-444444444005', '33333333-3333-3333-3333-333333333005',
     'Kola (33cl)', 'ICE-001', 120, 40, true),

    ('55555555-5555-5555-5555-555555555006', '11111111-1111-1111-1111-111111111111',
     '44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333006',
     'Peçete', 'TEM-002', 30, 10, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6) Demo tedarikçiler
-- ------------------------------------------------------------
INSERT INTO suppliers (id, business_id, name, phone, is_active) VALUES
    ('66666666-6666-6666-6666-666666666001', '11111111-1111-1111-1111-111111111111', 'Ana Gıda Tedarik', NULL, true),
    ('66666666-6666-6666-6666-666666666002', '11111111-1111-1111-1111-111111111111', 'Et Tavuk Market', NULL, true),
    ('66666666-6666-6666-6666-666666666003', '11111111-1111-1111-1111-111111111111', 'Ambalaj Dünyası', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 7) Demo stok hareketleri (IN / alım geçmişi test verisi)
-- Tavuk But bilinçli olarak iki farklı tarihte iki farklı
-- fiyattan alınmış gibi eklendi; fiyat değişim sorgusunu
-- test edebilmek için.
-- ------------------------------------------------------------
INSERT INTO stock_movements
    (id, business_id, product_id, user_id, supplier_id, movement_type, direction, quantity, unit_cost, document_no, occurred_at) VALUES
    ('77777777-7777-7777-7777-777777777001', '11111111-1111-1111-1111-111111111111',
     '55555555-5555-5555-5555-555555555001', '22222222-2222-2222-2222-222222222222',
     '66666666-6666-6666-6666-666666666002', 'IN', 'in', 15, 185.50, 'FTR-2026-0601-01', '2026-06-01 09:00:00+03'),

    ('77777777-7777-7777-7777-777777777002', '11111111-1111-1111-1111-111111111111',
     '55555555-5555-5555-5555-555555555001', '22222222-2222-2222-2222-222222222222',
     '66666666-6666-6666-6666-666666666002', 'IN', 'in', 20, 199.90, 'FTR-2026-0620-01', '2026-06-20 10:30:00+03'),

    ('77777777-7777-7777-7777-777777777003', '11111111-1111-1111-1111-111111111111',
     '55555555-5555-5555-5555-555555555002', '22222222-2222-2222-2222-222222222222',
     '66666666-6666-6666-6666-666666666001', 'IN', 'in', 30, 22.75, 'IRS-2026-0605-01', '2026-06-05 08:15:00+03'),

    ('77777777-7777-7777-7777-777777777004', '11111111-1111-1111-1111-111111111111',
     '55555555-5555-5555-5555-555555555006', '22222222-2222-2222-2222-222222222222',
     '66666666-6666-6666-6666-666666666003', 'IN', 'in', 25, 45.00, 'FIS-2026-0610-01', '2026-06-10 14:00:00+03')
ON CONFLICT (id) DO NOTHING;
