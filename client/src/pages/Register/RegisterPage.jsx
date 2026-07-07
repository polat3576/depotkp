import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage } from '../../api/axiosClient';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [fullName, setFullName] = useState('');
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
      await register({
        restaurantName: restaurantName.trim(),
        restaurantEmail: restaurantEmail.trim(),
        full_name: fullName.trim(),
        userCode: userCode.trim(),
        password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Kayıt başarısız'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-3 py-6 sm:p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-md sm:rounded-2xl sm:p-6">
        <h1 className="text-center text-xl font-bold text-slate-900">İşletme Kaydı</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Restoranınız için yönetici hesabı oluşturun
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Restoran Adı</label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Örn. Lezzet Restoran"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Restoran E-postası</label>
            <input
              type="email"
              value={restaurantEmail}
              onChange={(e) => setRestaurantEmail(e.target.value)}
              required
              autoComplete="organization"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="info@restoran.com"
            />
            <p className="mt-1 text-xs text-slate-400">Giriş için kullanılacak restoran adresi.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ad Soyad</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Adınız Soyadınız"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kullanıcı Kodu</label>
            <input
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              required
              autoCapitalize="characters"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Örn. ADM001"
            />
            <p className="mt-1 text-xs text-slate-400">Girişte kullanacağınız yönetici kodu.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="En az 6 karakter"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-medium text-slate-800 hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
