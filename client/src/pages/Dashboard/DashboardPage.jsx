import { useEffect, useState } from 'react';
import { getSummary } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/axiosClient';
import Loader from '../../components/common/Loader.jsx';

// Küçük özet kartı
function StatCard({ label, value, helper, highlight }) {
  return (
    <div className={`app-card p-5 ${highlight ? 'border-amber-200 bg-amber-50' : ''}`}>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${highlight ? 'text-amber-600' : 'text-slate-950'}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

const typeLabels = {
  IN: { text: 'Giriş', cls: 'bg-emerald-100 text-emerald-700' },
  OUT: { text: 'Çıkış', cls: 'bg-amber-100 text-amber-700' },
  COUNT_CORRECTION: { text: 'Sayım', cls: 'bg-slate-100 text-slate-700' },
  ADJUSTMENT: { text: 'Düzeltme', cls: 'bg-slate-200 text-slate-700' },
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSummary()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) {
    return <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  }
  if (!data) {
    return <Loader />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="app-hero">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-200">Günlük Operasyon</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Depo paneli</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-100">
              Stok, sayım ve kritik ürünleri tek ekrandan takip et.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100">
            Bugünkü hareketler: <span className="font-black text-white">{data.todayInCount + data.todayOutCount}</span>
          </div>
        </div>
      </section>

      {/* Özet kartları */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aktif ürün" value={data.totalProducts} helper="Takip edilen ürün" />
        <StatCard label="Kritik stok" value={data.lowStockProductsCount} helper="Minimum seviyede" highlight={data.lowStockProductsCount > 0} />
        <StatCard label="Bugün giriş" value={data.todayInCount} helper="Alım / ekleme" />
        <StatCard label="Bugün çıkış" value={data.todayOutCount} helper="Kullanım / tüketim" />
      </div>

      {/* Düşük stoktaki ürünler */}
      <section>
        <h2 className="app-section-title mb-3">En düşük stoklu ürünler</h2>
        <div className="app-card overflow-hidden">
          {data.lowStockProducts.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Kritik stokta ürün yok.</p>
          ) : (
            data.lowStockProducts.map((p) => {
              const low = p.currentStock <= p.minStockLevel && p.minStockLevel > 0;
              return (
                <div key={p.id} className="flex flex-col gap-2 border-b border-l-4 border-b-slate-100 border-l-amber-400 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{p.productName}</p>
                    <p className="text-xs text-slate-500">{p.category}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className={`text-sm font-semibold ${low ? 'text-red-600' : 'text-slate-800'}`}>
                      {p.currentStock} {p.unit}
                    </span>
                    <p className="text-xs text-slate-400">min {p.minStockLevel}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Son hareketler */}
      <section>
        <h2 className="app-section-title mb-3">Son hareketler</h2>
        <div className="app-card overflow-hidden">
          {data.recentMovements.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Bu restorana ait stok hareketi bulunmuyor.</p>
          ) : (
            data.recentMovements.map((m) => {
              const t = typeLabels[m.movementType] || typeLabels.ADJUSTMENT;
              return (
                <div key={m.id} className="flex flex-col gap-2 border-b border-l-4 border-b-slate-100 border-l-[#46556b] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{m.productName}</p>
                    <p className="text-xs text-slate-500">
                      {m.userName}
                      {m.supplierName ? ` · ${m.supplierName}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:ml-3 sm:justify-end">
                    <span className={`app-badge ${t.cls}`}>{t.text}</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {m.quantity} {m.unit}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
