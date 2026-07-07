import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Tablo', code: 'TB', end: true },
  { to: '/products', label: 'Ürünler', code: 'UR' },
  { to: '/stock', label: 'Stoklar', code: 'ST' },
  { to: '/inventory', label: 'Sayım', code: 'SY' },
];

const adminNavItems = [
  { to: '/suppliers', label: 'Tedarikçiler', code: 'TD' },
  { to: '/users', label: 'Kullanıcılar', code: 'KY' },
  { to: '/reports', label: 'Raporlar', code: 'RP' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = [...navItems, ...(isAdmin ? adminNavItems : [])];
  const [globalSearch, setGlobalSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setGlobalSearch(params.get('q') || '');
    setStockFilter(params.get('stock') || 'all');
  }, [location.search]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openProductSearch = (nextSearch = globalSearch, nextStock = stockFilter) => {
    const params = new URLSearchParams();
    const query = nextSearch.trim();

    if (query) params.set('q', query);
    if (nextStock !== 'all') params.set('stock', nextStock);

    navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    openProductSearch();
  };

  const handleStockFilterChange = (event) => {
    const nextStock = event.target.value;
    setStockFilter(nextStock);
    openProductSearch(globalSearch, nextStock);
  };

  const sidebarLinkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 border-l-4 px-4 py-3 text-sm font-medium transition',
      isActive
        ? 'border-l-[#f0642f] bg-white/10 text-white'
        : 'border-l-transparent text-slate-200 hover:bg-white/10 hover:text-white',
    ].join(' ');

  const mobileLinkClass = ({ isActive }) =>
    [
      'min-w-max rounded-lg border px-3 py-2 text-sm font-semibold transition',
      isActive
        ? 'border-[#4d5a70] bg-[#4d5a70] text-white'
        : 'border-slate-200 bg-white text-slate-700',
    ].join(' ');

  return (
    <div className="min-h-full bg-[#e9eef5] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 bg-[#46556b] text-white shadow-xl md:flex md:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0642f] text-sm font-black text-white shadow-sm">
              DK
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-tight">DepotKP</p>
              <p className="truncate text-xs text-slate-200">Restoran depo takip</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-3">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={sidebarLinkClass}>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs text-white">
                  {item.code}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Çıkış yap
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f3f6fb]/95 px-4 py-3 backdrop-blur">
            <form onSubmit={handleSearchSubmit} className="flex w-full items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0642f] text-xs font-black text-white md:hidden">
                DK
              </div>

              <div className="relative min-w-0 flex-1">
                <input
                  type="search"
                  value={globalSearch}
                  onChange={(event) => setGlobalSearch(event.target.value)}
                  placeholder="Ara..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-300/50"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 h-8 min-h-0 -translate-y-1/2 rounded-md px-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  Ara
                </button>
              </div>

              <select
                value={stockFilter}
                onChange={handleStockFilterChange}
                className="hidden h-11 w-44 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 lg:block"
              >
                <option value="all">Tüm kayıtlar</option>
                <option value="ok">Stokta</option>
                <option value="low">Kritik stok</option>
              </select>

              <div className="hidden items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200 md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff1e8] text-xs font-black text-[#b9481f]">
                  {(user?.full_name || user?.email || 'K').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-400">Merhaba</p>
                  <p className="max-w-40 truncate text-sm font-semibold text-slate-700">
                    {user?.full_name || user?.email}
                  </p>
                </div>
              </div>
            </form>

            <nav className="mt-3 flex gap-2 overflow-x-auto md:hidden">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={mobileLinkClass}>
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="min-w-max rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Çıkış
              </button>
            </nav>
          </header>

          <main className="flex-1 p-4 sm:p-5 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
