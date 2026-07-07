# DepotKP Teslim Test Checklist

## Auth ve Yetki

- [ ] Admin login başarılı.
- [ ] Staff login başarılı.
- [ ] Yanlış şifre ile login reddediliyor.
- [ ] Pasif kullanıcı login olamıyor.
- [ ] Login response içinde `password_hash` dönmüyor.
- [ ] Admin kullanıcı ekleyebiliyor.
- [ ] Staff kullanıcı ekleyemiyor.
- [ ] Staff kullanıcı yönetimi ekranını göremiyor.
- [ ] Staff admin endpointlerine erişemiyor (`403`).

## Ürün ve Stok

- [ ] Ürün listeleme çalışıyor.
- [ ] Admin ürün ekleyebiliyor.
- [ ] Admin ürün güncelleyebiliyor.
- [ ] Staff ürün ekleme/güncelleme yapamıyor.
- [ ] Stok çıkışı admin ve staff için çalışıyor.
- [ ] Stok girişi sadece admin için çalışıyor.
- [ ] Yetersiz stokta hareket reddediliyor.
- [ ] Barkodla ürün seçimi çalışıyor.

## Sayım ve Rapor

- [ ] Sayım başlatma çalışıyor.
- [ ] Sayım detayı ürünleri listeliyor.
- [ ] Sayım miktarları kaydediliyor.
- [ ] Sayım tamamlama sadece admin için çalışıyor.
- [ ] Sayım tamamlama stok düzeltmesi oluşturuyor.
- [ ] Rapor görüntüleme sadece admin için çalışıyor.
- [ ] Tüketim raporu tarih aralığıyla çalışıyor.
- [ ] Alım raporu tarih aralığıyla çalışıyor.
- [ ] Düşük stok raporu çalışıyor.

## Multi-Tenant ve Altyapı

- [ ] RestaurantId veri izolasyonu doğrulandı.
- [ ] Farklı restoran tokenı başka restoran verisini göremiyor.
- [ ] Neon bağlantısı health check üzerinden başarılı.
- [ ] Linux backend dış ağdan API çağrısı alıyor.
- [ ] Backend `HOST=0.0.0.0` ile dinliyor.
- [ ] `CORS_ORIGIN` production frontend URL'siyle yapılandırıldı.
- [ ] `.env` GitHub'a gitmiyor.

## Mobile

- [ ] `npm install` başarılı.
- [ ] `npx expo-doctor` hatasız.
- [ ] `npm list expo --depth=0` Expo SDK 54 gösteriyor.
- [ ] `npx expo start --clear` açılıyor.
- [ ] iPhone Expo Go QR ile uygulamayı açıyor.
