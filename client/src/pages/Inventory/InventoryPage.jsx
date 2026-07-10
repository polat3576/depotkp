import { useEffect, useMemo, useState } from 'react';
import {
  cancelInventoryCount,
  completeInventoryCount,
  createInventoryCount,
  getInventoryCount,
  getInventoryCounts,
  updateInventoryItems,
} from '../../api/inventoryApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/common/Loader.jsx';

const statusLabels = {
  DRAFT: { text: 'Taslak', cls: 'bg-blue-100 text-blue-700' },
  COMPLETED: { text: 'Tamamlandı', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { text: 'İptal', cls: 'bg-slate-200 text-slate-700' },
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function displayQty(value) {
  if (value == null || value === '') return '-';
  const parsed = Number(value);
  return Number.isNaN(parsed) ? '-' : parsed;
}

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const [counts, setCounts] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadCounts = async () => {
    const data = await getInventoryCounts();
    setCounts(data);
    return data;
  };

  const loadDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    setError('');
    try {
      const data = await getInventoryCount(id);
      setDetail(data);
      setDrafts(
        Object.fromEntries(
          data.items.map((item) => [
            item.product_id,
            item.counted_quantity == null ? '' : String(Number(item.counted_quantity)),
          ])
        )
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Sayım detayı alınamadı'));
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadCounts().catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId]);

  const selectedStatus = detail?.status || counts?.find((c) => c.id === selectedId)?.status;
  const isDraft = selectedStatus === 'DRAFT';

  const countedItems = useMemo(() => {
    if (!detail) return [];
    return detail.items
      .filter((item) => drafts[item.product_id] !== '')
      .map((item) => ({
        product_id: item.product_id,
        counted_quantity: Number(drafts[item.product_id]),
        note: item.note || undefined,
      }));
  }, [detail, drafts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const created = await createInventoryCount({ note: note.trim() || undefined });
      await loadCounts();
      setSelectedId(created.id);
      setMessage('Yeni sayım başlatıldı.');
      setNote('');
    } catch (err) {
      setError(getErrorMessage(err, 'Sayım başlatılamadı'));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (countedItems.length === 0) {
      setError('Kaydetmek için en az bir ürün miktarı girin.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateInventoryItems(selectedId, countedItems);
      setDetail(updated);
      setMessage('Sayım miktarları kaydedildi.');
    } catch (err) {
      setError(getErrorMessage(err, 'Sayım miktarları kaydedilemedi'));
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await completeInventoryCount(selectedId);
      await loadCounts();
      await loadDetail(selectedId);
      setMessage(`Sayım tamamlandı. ${result.corrections_applied} stok düzeltmesi oluştu.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Sayım tamamlanamadı'));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await cancelInventoryCount(selectedId);
      await loadCounts();
      await loadDetail(selectedId);
      setMessage('Sayım iptal edildi.');
    } catch (err) {
      setError(getErrorMessage(err, 'Sayım iptal edilemedi'));
    } finally {
      setBusy(false);
    }
  };

  if (!counts) {
    return <Loader />;
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="app-page-eyebrow">Depo operasyonu</p>
        <h2 className="app-page-title text-xl">Sayım</h2>
        <p className="app-page-subtitle">Ürün stoklarını fiziksel sayımla karşılaştırın.</p>
      </div>

      {error && <div className="app-alert-error">{error}</div>}
      {message && <div className="app-alert-success">{message}</div>}

      <form onSubmit={handleCreate} className="app-card space-y-3 p-4">
        <label className="app-label">Yeni sayım notu</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="app-input"
          placeholder="Opsiyonel"
        />
        <button type="submit" disabled={busy} className="app-button-primary w-full">
          {busy ? 'İşleniyor...' : 'Yeni Sayım Başlat'}
        </button>
      </form>

      <section>
        <h3 className="app-section-title mb-2">Sayım Listesi</h3>
        <div className="app-card divide-y divide-slate-100 overflow-hidden">
          {counts.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Henüz sayım yok.</p>
          ) : (
            counts.map((count) => {
              const status = statusLabels[count.status] || statusLabels.DRAFT;
              return (
                <button
                  key={count.id}
                  type="button"
                  onClick={() => setSelectedId(count.id)}
                  className={`app-list-row block w-full text-left ${
                    selectedId === count.id ? 'bg-slate-50' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {formatDate(count.started_at)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {count.counted_by_name} · {count.item_count} ürün
                      </p>
                    </div>
                    <span className={`app-pill ${status.cls}`}>{status.text}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {selectedId && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="app-section-title">Sayım Detayı</h3>
            {detail && (
              <span className={`app-pill ${(statusLabels[detail.status] || statusLabels.DRAFT).cls}`}>
                {(statusLabels[detail.status] || statusLabels.DRAFT).text}
              </span>
            )}
          </div>

          {loadingDetail || !detail ? (
            <Loader label="Sayım detayı yükleniyor..." />
          ) : (
            <>
              <div className="space-y-3">
                {detail.items.map((item) => {
                  const counted = drafts[item.product_id];
                  const expected = Number(item.expected_quantity);
                  const diff =
                    counted === ''
                      ? displayQty(item.difference_quantity)
                      : Number(counted) - expected;

                  return (
                    <div key={item.id} className="app-card p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Beklenen: {displayQty(item.expected_quantity)} {item.unit_short_name}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs text-slate-500">Fark</p>
                          <p
                            className={`text-sm font-semibold ${
                              Number(diff) !== 0 ? 'text-amber-700' : 'text-slate-800'
                            }`}
                          >
                            {diff} {item.unit_short_name}
                          </p>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={counted}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [item.product_id]: e.target.value }))
                        }
                        disabled={!isDraft || busy}
                        className="app-input mt-3 disabled:bg-slate-100"
                        placeholder="Sayılan miktar"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {isDraft && (
                  <button type="button" onClick={handleSave} disabled={busy} className="app-button-primary w-full">
                    {busy ? 'Kaydediliyor...' : 'Miktarları Kaydet'}
                  </button>
                )}

                {isAdmin && isDraft && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={busy}
                      className="rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                    >
                      Tamamla
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={busy}
                      className="rounded-lg bg-red-700 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                    >
                      İptal Et
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
