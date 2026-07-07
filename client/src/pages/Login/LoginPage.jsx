import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage } from '../../api/axiosClient';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Zaten girişliyse panele gönder.
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({
        restaurantEmail: restaurantEmail.trim(),
        userCode: userCode.trim(),
        password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Giriş başarısız'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-[#e9eef5] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[#46556b] p-7 text-white sm:p-9">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#f0642f] text-lg font-black text-white">
              DK
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Restoran Depo Yönetimi</p>
              <h1 className="text-3xl font-black">DepotKP</h1>
            </div>
          </div>
          <p className="mt-8 max-w-sm text-sm leading-6 text-slate-100">
            Stok giriş-çıkışları, sayım, tedarikçiler ve kullanıcı yönetimi için sade işletme paneli.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              Günlük stok hareketlerini hızlı gir.
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              Kritik ürünleri ve sayım farklarını takip et.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-9">
          <div className="mb-7">
            <h2 className="text-xl font-black text-slate-950">İşletme girişi</h2>
            <p className="mt-1 text-sm text-slate-500">Restoran e-postası ve kullanıcı kodunla devam et.</p>
          </div>

          <div className="space-y-4">
          <div>
            <label className="app-label">Restoran e-postası</label>
            <input
              type="email"
              value={restaurantEmail}
              onChange={(e) => setRestaurantEmail(e.target.value)}
              required
              autoComplete="organization"
              className="app-input"
              placeholder="info@restoran.com"
            />
          </div>

          <div>
            <label className="app-label">Kullanıcı kodu</label>
            <input
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              required
              autoCapitalize="characters"
              autoComplete="username"
              className="app-input"
              placeholder="Örn. AHM001"
            />
          </div>

          <div>
            <label className="app-label">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="app-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="app-button-primary w-full"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="font-semibold text-[#46556b] hover:underline">
              İşletme kaydı oluşturun
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
