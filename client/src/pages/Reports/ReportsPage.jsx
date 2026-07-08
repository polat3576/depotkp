import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  getConsumptionReport,
  getLowStockReport,
  getPurchasesReport,
} from '../../api/reportApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/common/Loader.jsx';

const reportTypes = {
  consumption: 'Tüketim raporu',
  purchases: 'Alım raporu',
  lowStock: 'Düşük stok raporu',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function sevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}

function formatNumber(value) {
  if (value == null || value === '') return '-';
  const parsed = Number(value);
  return Number.isNaN(parsed) ? '-' : parsed.toLocaleString('tr-TR');
}

function formatMoney(value) {
  if (value == null || value === '') return '-';
  const parsed = Number(value);
  return Number.isNaN(parsed)
    ? '-'
    : parsed.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [type, setType] = useState('consumption');
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rows = data?.items || [];
  const isRangeReport = type !== 'lowStock';

  const loadReport = async (overrides = {}) => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const filters = { from: overrides.from ?? from, to: overrides.to ?? to };
      if (type === 'consumption') {
        setData(await getConsumptionReport(filters));
      } else if (type === 'purchases') {
        setData(await getPurchasesReport(filters));
      } else {
        setData(await getLowStockReport());
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Rapor alınamadı'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (days) => {
    const start = days === 7 ? sevenDaysAgo() : thirtyDaysAgo();
    const end = today();
    setFrom(start);
    setTo(end);
    loadReport({ from: start, to: end });
  };

  useEffect(() => {
    loadReport();
  }, [type]);

  const columns = useMemo(() => {
    if (type === 'purchases') {
      return ['Ürün', 'Miktar', 'Toplam maliyet', 'Hareket'];
    }
    if (type === 'lowStock') {
      return ['Ürün', 'Mevcut', 'Minimum', 'Eksik'];
    }
    return ['Ürün', 'Miktar', 'Hareket'];
  }, [type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    loadReport();
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Raporlar</h2>
        <p className="text-xs text-slate-500">Tüketim, alım ve düşük stok özetleri.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rapor tipi</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {Object.entries(reportTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {isRangeReport && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Haftalık
            </button>
            <button
              type="button"
              onClick={() => applyPreset(30)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Aylık
            </button>
          </div>
        )}

        {isRangeReport && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Başlangıç</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bitiş</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {loading ? 'Yükleniyor...' : 'Raporu Getir'}
        </button>
      </form>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">{reportTypes[type]}</h3>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          {loading ? (
            <Loader label="Rapor yükleniyor..." />
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Bu filtrelere uygun veri yok.</p>
          ) : (
            <table className="min-w-[560px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="whitespace-nowrap px-4 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.product_id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                      {row.product_name}
                    </td>
                    {type === 'lowStock' ? (
                      <>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatNumber(row.current_stock)} {row.unit}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatNumber(row.min_stock_level)} {row.unit}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-red-700">
                          {formatNumber(Number(row.min_stock_level) - Number(row.current_stock))}{' '}
                          {row.unit}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatNumber(row.total_quantity)} {row.unit}
                        </td>
                        {type === 'purchases' && (
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                            {formatMoney(row.total_cost)}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatNumber(row.movement_count)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
