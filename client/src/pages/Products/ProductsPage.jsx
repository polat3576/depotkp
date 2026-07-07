import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../../api/productApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/common/Loader.jsx';

const initialsFor = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'Ü';

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || 'all');

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
    setStockFilter(searchParams.get('stock') || 'all');
  }, [searchParams]);

  const updateSearchParams = (nextSearch, nextStock) => {
    const params = new URLSearchParams();
    const query = nextSearch.trim();

    if (query) params.set('q', query);
    if (nextStock !== 'all') params.set('stock', nextStock);

    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (event) => {
    const nextSearch = event.target.value;
    setSearch(nextSearch);
    updateSearchParams(nextSearch, stockFilter);
  };

  const handleStockFilterChange = (event) => {
    const nextStock = event.target.value;
    setStockFilter(nextStock);
    updateSearchParams(search, nextStock);
  };

  const filtered = useMemo(() => {
    if (!products) return [];
    const term = search.trim().toLowerCase();

    return products.filter((p) =>
      [p.name, p.category_name, p.sku, p.barcode, p.default_supplier_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    ).filter((p) => {
      if (stockFilter === 'all') return true;
      const currentStock = Number(p.current_stock || 0);
      const minStock = Number(p.min_stock_level || 0);
      const low = currentStock <= minStock && minStock > 0;

      return stockFilter === 'low' ? low : !low;
    });
  }, [products, search, stockFilter]);

  const clearSearch = () => {
    setSearch('');
    setStockFilter('all');
    setSearchParams({}, { replace: true });
  };

  const hasActiveSearch = search.trim() || stockFilter !== 'all';

  const resultText = useMemo(() => {
    if (!hasActiveSearch) return `${filtered.length} kayıt`;
    return `${filtered.length} sonuç`;
  }, [filtered.length, hasActiveSearch]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Bir şeyler ters gitti. Lütfen tekrar dene.
      </div>
    );
  }

  if (!products) {
    return <Loader />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ürün yönetimi</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Ürün listesi</h2>
          <p className="mt-1 text-sm text-slate-500">
            Depodaki ürünleri, mevcut miktarı ve kritik stok durumunu takip et.
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/products/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#f0642f] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95727]"
          >
            + Yeni ürün
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#dfe6ef] p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Ürün, kategori veya tedarikçi ara..."
            className="h-11 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50"
          />
          <select
            value={stockFilter}
            onChange={handleStockFilterChange}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">Tüm stoklar</option>
            <option value="ok">Stokta</option>
            <option value="low">Kritik stok</option>
          </select>
          <div className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
            {resultText}
          </div>
          {hasActiveSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Temizle
            </button>
          )}
        </div>

        <div className="hidden grid-cols-[72px_1.4fr_1fr_120px_110px_110px] gap-3 px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 lg:grid">
          <span>Görsel</span>
          <span>Ürün</span>
          <span>Kod / Tedarikçi</span>
          <span>Durum</span>
          <span>Miktar</span>
          <span className="text-right">İşlem</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg bg-white px-4 py-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz ürün eklenmemiş veya aramana uygun ürün bulunmuyor.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => {
              const currentStock = Number(p.current_stock || 0);
              const minStock = Number(p.min_stock_level || 0);
              const low = currentStock <= minStock && minStock > 0;
              const code = p.sku || p.barcode || `#${String(p.id).slice(0, 8)}`;

              return (
                <div
                  key={p.id}
                  className="grid gap-3 rounded-lg bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200/80 transition hover:ring-slate-300 lg:grid-cols-[72px_1.4fr_1fr_120px_110px_110px] lg:items-center"
                >
                  <div className="flex items-center gap-3 lg:block">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-sm font-black text-slate-500">
                      {initialsFor(p.name)}
                    </div>
                    <div className="min-w-0 lg:hidden">
                      <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">{code}</p>
                    </div>
                  </div>

                  <div className="hidden min-w-0 lg:block">
                    <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {p.category_name || 'Kategori yok'}
                    </p>
                  </div>

                  <div className="min-w-0 text-sm text-slate-600">
                    <p className="truncate font-semibold text-slate-700">{code}</p>
                    <p className="truncate text-xs text-slate-400">
                      {p.default_supplier_name || 'Tedarikçi yok'}
                    </p>
                  </div>

                  <div>
                    <span
                      className={[
                        'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold',
                        low
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700',
                      ].join(' ')}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {low ? 'Kritik' : 'Stokta'}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {currentStock} {p.unit_short_name}
                    </p>
                    <p className="text-xs text-slate-400">min {minStock}</p>
                  </div>

                  <div className="flex items-center justify-start gap-2 lg:justify-end">
                    <Link
                      to="/stock"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-lg leading-none text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
                      title="Stok işlemi"
                    >
                      +
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/products/new"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f7c8b6] bg-[#fff1e8] text-sm font-black text-[#b9481f] transition hover:bg-[#ffe4d6]"
                        title="Yeni ürün"
                      >
                        E
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
