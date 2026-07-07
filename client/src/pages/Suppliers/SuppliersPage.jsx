import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from '../../api/supplierApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/common/Loader.jsx';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  note: '',
};

export default function SuppliersPage() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSuppliers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      setSuppliers(await getSuppliers({ includeInactive: true }));
    } catch (err) {
      setError(getErrorMessage(err, 'Tedarikçiler alınamadı'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      note: supplier.note || '',
    });
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      note: form.note.trim() || undefined,
    };

    try {
      if (editingId) {
        await updateSupplier(editingId, payload);
        setMessage('Tedarikçi güncellendi.');
      } else {
        await createSupplier(payload);
        setMessage('Tedarikçi eklendi.');
      }
      resetForm();
      await loadSuppliers();
    } catch (err) {
      setError(getErrorMessage(err, 'İşlem tamamlanamadı'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await deleteSupplier(supplier.id);
      if (editingId === supplier.id) resetForm();
      setMessage('Tedarikçi pasife alındı.');
      await loadSuppliers();
    } catch (err) {
      setError(getErrorMessage(err, 'Tedarikçi pasife alınamadı'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Tedarikçiler</h2>
        <p className="text-xs text-slate-500">Stok girişlerinde kullanılacak tedarikçi kayıtları.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-700">
            {editingId ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-slate-500 hover:underline"
            >
              Vazgeç
            </button>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ad</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Tedarikçi adı"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Telefon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Opsiyonel"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Opsiyonel"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Adres</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Opsiyonel"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Not</label>
          <input
            type="text"
            value={form.note}
            onChange={(e) => handleChange('note', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Opsiyonel"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
        </button>
      </form>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Tedarikçi Listesi</h3>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {loading || !suppliers ? (
            <Loader label="Tedarikçiler yükleniyor..." />
          ) : suppliers.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Henüz tedarikçi yok.</p>
          ) : (
            suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="border-b border-slate-100 px-4 py-3 last:border-0"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800">{supplier.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          supplier.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {supplier.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {[supplier.phone, supplier.email].filter(Boolean).join(' · ') || 'İletişim yok'}
                    </p>
                    {(supplier.address || supplier.note) && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {[supplier.address, supplier.note].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => handleEdit(supplier)}
                      disabled={saving}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                    >
                      Düzenle
                    </button>
                    {supplier.is_active && (
                      <button
                        type="button"
                        onClick={() => handleDelete(supplier)}
                        disabled={saving}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
