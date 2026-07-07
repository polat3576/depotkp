import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { createUser, deactivateUser, getUsers } from '../../api/userApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/common/Loader.jsx';

const emptyForm = {
  full_name: '',
  email: '',
  user_code: '',
  password: '',
  role: 'staff',
};

const roleLabels = {
  admin: 'Yönetici',
  staff: 'Çalışan',
};

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(getErrorMessage(err, 'Kullanıcılar alınamadı'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim() || !form.email.trim() || !form.user_code.trim()) {
      setError('Ad Soyad, e-posta ve kullanıcı kodu zorunludur.');
      return;
    }
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      user_code: form.user_code.trim(),
      password: form.password,
      role: form.role,
    };

    try {
      await createUser(payload);
      setMessage('Kullanıcı eklendi.');
      resetForm();
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Kullanıcı eklenemedi'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`${user.full_name} pasife alınsın mı?`)) return;

    setSaving(true);
    setMessage('');
    setError('');
    try {
      await deactivateUser(user.id);
      setMessage('Kullanıcı pasife alındı.');
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Kullanıcı pasife alınamadı'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Kullanıcılar</h2>
          <p className="text-xs text-slate-500">İşletmenizdeki yönetici ve çalışan hesapları.</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openCreateForm}
            className="shrink-0 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900"
          >
            + Yeni Kullanıcı
          </button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Yeni Kullanıcı</h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-slate-500 hover:underline"
            >
              Vazgeç
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ad Soyad</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Ad Soyad"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">E-posta</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                placeholder="ornek@restoran.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kullanıcı Kodu</label>
              <input
                type="text"
                value={form.user_code}
                onChange={(e) => handleChange('user_code', e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                placeholder="Örn. AHM001"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Şifre</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="En az 6 karakter"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
            <div className="flex gap-2">
              {['staff', 'admin'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleChange('role', role)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    form.role === role
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Kullanıcı Listesi</h3>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {loading || !users ? (
            <Loader label="Kullanıcılar yükleniyor..." />
          ) : users.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Henüz kullanıcı yok.</p>
          ) : (
            users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <div key={user.id} className="border-b border-slate-100 px-4 py-3 last:border-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-800">{user.full_name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {roleLabels[user.role] || user.role}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {user.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Kod: {user.user_code || '-'} · {user.email}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isSelf ? (
                        <span className="text-xs font-medium text-slate-400">Bu hesap sizsiniz</span>
                      ) : user.is_active ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(user)}
                          disabled={saving}
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          Pasifleştir
                        </button>
                      ) : null}
                    </div>
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
