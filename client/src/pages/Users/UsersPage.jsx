import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUserPermanently,
  getUsers,
} from '../../api/userApi';
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

  const handleActivate = async (user) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await activateUser(user.id);
      setMessage('Kullanıcı yeniden aktif edildi.');
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Kullanıcı aktif edilemedi'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `${user.full_name} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`
      )
    )
      return;

    setSaving(true);
    setMessage('');
    setError('');
    try {
      await deleteUserPermanently(user.id);
      setMessage('Kullanıcı kalıcı olarak silindi.');
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, 'Kullanıcı silinemedi'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="app-page-eyebrow">Depo yönetimi</p>
          <h2 className="app-page-title text-xl">Kullanıcılar</h2>
          <p className="app-page-subtitle">İşletmenizdeki yönetici ve çalışan hesapları.</p>
        </div>
        {!showForm && (
          <button type="button" onClick={openCreateForm} className="app-button-primary shrink-0">
            + Yeni Kullanıcı
          </button>
        )}
      </div>

      {error && <div className="app-alert-error">{error}</div>}
      {message && <div className="app-alert-success">{message}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="app-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="app-section-title">Yeni Kullanıcı</h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-slate-500 hover:underline"
            >
              Vazgeç
            </button>
          </div>

          <div>
            <label className="app-label">Ad Soyad</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              required
              className="app-input"
              placeholder="Ad Soyad"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="app-label">E-posta</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="app-input"
                placeholder="ornek@restoran.com"
              />
            </div>
            <div>
              <label className="app-label">Kullanıcı Kodu</label>
              <input
                type="text"
                value={form.user_code}
                onChange={(e) => handleChange('user_code', e.target.value)}
                required
                className="app-input"
                placeholder="Örn. AHM001"
              />
            </div>
          </div>

          <div>
            <label className="app-label">Şifre</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              minLength={6}
              className="app-input"
              placeholder="En az 6 karakter"
            />
          </div>

          <div>
            <label className="app-label">Rol</label>
            <div className="flex gap-2">
              {['staff', 'admin'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleChange('role', role)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                    form.role === role
                      ? 'bg-[#46556b] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="app-button-primary w-full">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      )}

      <section>
        <h3 className="app-section-title mb-2">Kullanıcı Listesi</h3>
        <div className="app-card divide-y divide-slate-100 overflow-hidden">
          {loading || !users ? (
            <Loader label="Kullanıcılar yükleniyor..." />
          ) : users.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Henüz kullanıcı yok.</p>
          ) : (
            users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <div key={user.id} className="app-list-row">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">{user.full_name}</p>
                        <span
                          className={`app-pill ${
                            user.role === 'admin'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {roleLabels[user.role] || user.role}
                        </span>
                        <span
                          className={`app-pill ${
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
                    <div className="flex shrink-0 gap-2">
                      {isSelf ? (
                        <span className="text-xs font-medium text-slate-400">Bu hesap sizsiniz</span>
                      ) : (
                        <>
                          {user.is_active ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(user)}
                              disabled={saving}
                              className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                            >
                              Pasifleştir
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(user)}
                              disabled={saving}
                              className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
                            >
                              Aktif Et
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            disabled={saving}
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            Sil
                          </button>
                        </>
                      )}
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
