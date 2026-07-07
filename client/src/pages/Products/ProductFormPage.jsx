import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProduct } from '../../api/productApi';
import { getCategories, createCategory } from '../../api/categoryApi';
import { getUnits } from '../../api/unitApi';
import { getSuppliers } from '../../api/supplierApi';
import { getErrorMessage } from '../../api/axiosClient';
import Loader from '../../components/common/Loader.jsx';

export default function ProductFormPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState(null);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadError, setLoadError] = useState('');

  // Form alanları
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');

  // Satır içi yeni kategori
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getCategories(), getUnits(), getSuppliers()])
      .then(([cats, us, sups]) => {
        setCategories(cats);
        setUnits(us);
        setSuppliers(sups);
      })
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, []);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setError('');
    setAddingCategory(true);
    try {
      const created = await createCategory({ name: trimmed });
      setCategories((prev) => [...prev, created]);
      setCategoryId(created.id); // yeni kategoriyi otomatik seç
      setNewCategoryName('');
    } catch (err) {
      setError(getErrorMessage(err, 'Kategori eklenemedi'));
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !categoryId || !unitId) {
      setError('Ürün adı, kategori ve birim zorunludur');
      return;
    }

    const payload = {
      name: name.trim(),
      category_id: categoryId,
      unit_id: unitId,
    };
    if (sku.trim()) payload.sku = sku.trim();
    if (barcode.trim()) payload.barcode = barcode.trim();
    if (minStockLevel !== '') payload.min_stock_level = Number(minStockLevel);
    if (supplierId) payload.default_supplier_id = supplierId;

    setSubmitting(true);
    try {
      await createProduct(payload);
      navigate('/products', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Ürün eklenemedi'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>;
  }
  if (!categories) {
    return <Loader />;
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800">Yeni Ürün</h2>
        <Link to="/products" className="text-sm text-slate-500 hover:underline">
          ← Ürünler
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-4 shadow-sm sm:p-5">
        {/* Ürün adı */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ürün Adı</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Örn. Tavuk But"
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
          {categories.length > 0 && (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">Kategori seçin...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Satır içi yeni kategori ekleme */}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder={categories.length === 0 ? 'İlk kategoriyi ekleyin' : 'Yeni kategori adı'}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={addingCategory || !newCategoryName.trim()}
              className="w-full rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50 sm:w-auto"
            >
              {addingCategory ? '...' : 'Ekle'}
            </button>
          </div>
          {categories.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Ürün eklemek için önce en az bir kategori oluşturun.
            </p>
          )}
        </div>

        {/* Birim */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Birim</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">Birim seçin...</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.short_name})
              </option>
            ))}
          </select>
        </div>

        {/* Varsayılan Tedarikçi */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Varsayılan Tedarikçi
          </label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">(Opsiyonel)</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Bu ürünü genelde hangi tedarikçiden aldığınız. Her alımın kendi tedarikçisi/fiyatı
            "Stok" ekranından ayrıca kaydedilir.
          </p>
        </div>

        {/* SKU / Barkod / Min stok */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Opsiyonel"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Min. Stok</label>
            <input
              type="number"
              min="0"
              step="any"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Barkod</label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Opsiyonel"
          />
        </div>

        <p className="text-xs text-slate-500">
          Not: Başlangıç stoğu 0 olarak oluşur. Stok, "Stok" ekranından giriş/çıkış ile değişir.
        </p>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {submitting ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
        </button>
      </form>
    </div>
  );
}
