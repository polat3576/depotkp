import { useEffect, useMemo, useState } from 'react';
import { getProducts } from '../../api/productApi';
import { getSuppliers } from '../../api/supplierApi';
import { createMovement } from '../../api/stockApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/common/Loader.jsx';

export default function StockEntryPage() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loadError, setLoadError] = useState('');

  // Form alanları
  const [productId, setProductId] = useState('');
  const [movementType, setMovementType] = useState('OUT'); // staff varsayılan
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [documentNo, setDocumentNo] = useState('');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([getProducts(), isAdmin ? getSuppliers() : Promise.resolve([])])
      .then(([prods, sups]) => {
        setProducts(prods);
        setSuppliers(sups);
      })
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, [isAdmin]);

  const selectedProduct = useMemo(
    () => products?.find((p) => p.id === productId),
    [products, productId]
  );

  const isIn = movementType === 'IN';

  const resetAfterSuccess = () => {
    setQuantity('');
    setUnitCost('');
    setSupplierId('');
    setDocumentNo('');
    setNote('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productId) {
      setError('Lütfen bir ürün seçin');
      return;
    }

    const payload = {
      product_id: productId,
      movement_type: movementType,
      quantity: Number(quantity),
      note: note.trim() || undefined,
    };

    if (isIn) {
      payload.unit_cost = Number(unitCost);
      if (supplierId) payload.supplier_id = supplierId;
      if (documentNo.trim()) payload.document_no = documentNo.trim();
    }

    setSubmitting(true);
    try {
      const result = await createMovement(payload);
      setSuccess(
        `${selectedProduct?.name} için hareket kaydedildi. Yeni stok: ${result.current_stock} ${selectedProduct?.unit_short_name}`
      );
      resetAfterSuccess();
      // Ürün listesindeki güncel stoğu tazele
      getProducts().then(setProducts).catch(() => {});
    } catch (err) {
      setError(getErrorMessage(err, 'Hareket kaydedilemedi'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>;
  }
  if (!products) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="app-hero">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-200">Depo Operasyonu</p>
        <h2 className="mt-2 text-2xl font-black">Stok hareketi</h2>
        <p className="mt-2 text-sm text-slate-100">
          Ürün giriş ve çıkışlarını hızlıca kaydet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="app-card space-y-4 p-5">

      {/* Ürün */}
      <div>
        <label className="app-label">Ürün</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="app-input"
        >
          <option value="">Ürün seçin...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({Number(p.current_stock)} {p.unit_short_name})
            </option>
          ))}
        </select>
        {selectedProduct && (
          <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Mevcut stok: {Number(selectedProduct.current_stock)} {selectedProduct.unit_short_name}
          </p>
        )}
      </div>

      {/* Hareket tipi - staff sadece OUT */}
      <div>
        <label className="app-label">İşlem</label>
        {isAdmin ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            {['OUT', 'IN'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMovementType(t)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                  movementType === t ? 'bg-[#46556b] text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t === 'OUT' ? 'Çıkış (Kullanım)' : 'Giriş (Alım)'}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Çıkış (Depodan kullanım)
          </div>
        )}
      </div>

      {/* Miktar */}
      <div>
        <label className="app-label">Miktar</label>
        <input
          type="number"
          min="0"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          className="app-input"
          placeholder="0"
        />
      </div>

      {/* Sadece GİRİŞ (IN) alanları */}
      {isIn && (
        <>
          <div>
            <label className="app-label">Birim Fiyat (₺)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              required
              className="app-input"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="app-label">Tedarikçi</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="app-input"
            >
              <option value="">(Opsiyonel)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="app-label">Belge No</label>
            <input
              type="text"
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              className="app-input"
              placeholder="Fatura / irsaliye no (opsiyonel)"
            />
          </div>
        </>
      )}

      {/* Not */}
      <div>
        <label className="app-label">Not</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="app-input"
          placeholder="Opsiyonel"
        />
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="app-button-primary w-full"
      >
        {submitting ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
      </form>
    </div>
  );
}
