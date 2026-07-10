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
    <div className="flex min-h-full items-center justify-center bg-[#e9eef5] px-3 py-6 sm:p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-center text-2xl font-black tracking-tight text-slate-900">İşletme Kaydı</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Restoranınız için yönetici hesabı oluşturun
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="app-label">Restoran Adı</label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              className="app-input"
              placeholder="Örn. Lezzet Restoran"
            />
          </div>

          <div>
            <label className="app-label">Restoran E-postası</label>
            <input
              type="email"
              value={restaurantEmail}
              onChange={(e) => setRestaurantEmail(e.target.value)}
              required
              autoComplete="organization"
              className="app-input"
              placeholder="info@restoran.com"
            />
            <p className="mt-1 text-xs text-slate-400">Giriş için kullanılacak restoran adresi.</p>
          </div>

          <div>
            <label className="app-label">Ad Soyad</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="app-input"
              placeholder="Adınız Soyadınız"
            />
          </div>

          <div>
            <label className="app-label">Kullanıcı Kodu</label>
            <input
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              required
              autoCapitalize="characters"
              className="app-input"
              placeholder="Örn. ADM001"
            />
            <p className="mt-1 text-xs text-slate-400">Girişte kullanacağınız yönetici kodu.</p>
          </div>

          <div>
            <label className="app-label">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="app-input"
              placeholder="En az 6 karakter"
            />
          </div>

          {error && <div className="app-alert-error">{error}</div>}

          <button type="submit" disabled={loading} className="app-button-primary w-full">
            {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-semibold text-[#46556b] hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
