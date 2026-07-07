import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getErrorMessage } from '../api/apiClient';
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from '../api/supplierApi';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  note: '',
};

function InfoLine({ label, value, emptyText }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, !value && styles.emptyValue]}>
        {value || emptyText || '-'}
      </Text>
    </View>
  );
}

const SupplierCard = memo(function SupplierCard({ supplier, onEdit, onDelete, disabled }) {
  return (
    <View style={[styles.supplierCard, !supplier.is_active && styles.passiveCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.supplierName}>{supplier.name}</Text>
          <Text style={styles.cardMeta}>Tedarikçi kaydı</Text>
        </View>
        <Text style={[styles.badge, supplier.is_active ? styles.activeBadge : styles.passiveBadge]}>
          {supplier.is_active ? 'Aktif' : 'Pasif'}
        </Text>
      </View>

      <View style={styles.infoBlock}>
        <InfoLine label="Telefon" value={supplier.phone} emptyText="Telefon yok" />
        <InfoLine label="E-posta" value={supplier.email} emptyText="E-posta yok" />
        <InfoLine label="Adres" value={supplier.address} emptyText="Adres yok" />
        <InfoLine label="Not" value={supplier.note} emptyText="Not yok" />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => onEdit(supplier)}
          disabled={disabled}
          style={[styles.secondaryButton, disabled && styles.disabledButton]}
        >
          <Text style={styles.secondaryButtonText}>Düzenle</Text>
        </Pressable>
        {supplier.is_active ? (
          <Pressable
            onPress={() => onDelete(supplier)}
            disabled={disabled}
            style={[styles.dangerButton, disabled && styles.disabledButton]}
          >
            <Text style={styles.dangerButtonText}>Pasifleştir</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

export default function SuppliersScreen({ navigation }) {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuppliers = useCallback(async () => {
    if (!isAdmin) return;
    setError('');
    try {
      setSuppliers(await getSuppliers({ includeInactive: true }));
    } catch (err) {
      setError(getErrorMessage(err, 'Tedarikçiler alınamadı'));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      navigation.replace('Dashboard');
      return;
    }

    setLoading(true);
    loadSuppliers().finally(() => setLoading(false));
  }, [isAdmin, loadSuppliers, navigation]);

  const selectedSupplier = useMemo(
    () => suppliers?.find((supplier) => supplier.id === editingId),
    [suppliers, editingId]
  );

  const updateForm = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setEditingId('');
    setShowForm(false);
  }, []);

  const openCreateForm = useCallback(() => {
    setForm(emptyForm);
    setEditingId('');
    setShowForm(true);
    setMessage('');
    setError('');
  }, []);

  const openEditForm = useCallback((supplier) => {
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      note: supplier.note || '',
    });
    setEditingId(supplier.id);
    setShowForm(true);
    setMessage('');
    setError('');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSuppliers();
    setRefreshing(false);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Tedarikçi adı zorunlu.';
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

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

  const handleDelete = useCallback((supplier) => {
    Alert.alert('Tedarikçiyi pasifleştir', `${supplier.name} pasife alınsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Pasifleştir',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setError('');
          setMessage('');
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
        },
      },
    ]);
  }, [editingId, loadSuppliers, resetForm]);

  const renderSupplier = useCallback(({ item }) => (
    <SupplierCard
      supplier={item}
      onEdit={openEditForm}
      onDelete={handleDelete}
      disabled={saving}
    />
  ), [handleDelete, openEditForm, saving]);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  if (!isAdmin) {
    return null;
  }

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Tedarikçiler</Text>
          <Text style={styles.subtitle}>Stok girişlerinde kullanılan tedarikçi kayıtları.</Text>
        </View>
        <Pressable onPress={openCreateForm} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Yeni Tedarikçi Ekle</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {showForm ? (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {editingId
                ? `${selectedSupplier?.name || 'Tedarikçi'} düzenle`
                : 'Yeni tedarikçi'}
            </Text>
            <Pressable onPress={resetForm}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ad</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => updateForm('name', value)}
              placeholder="Tedarikçi adı"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefon</Text>
            <TextInput
              value={form.phone}
              onChangeText={(value) => updateForm('phone', value)}
              placeholder="Opsiyonel"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              value={form.email}
              onChangeText={(value) => updateForm('email', value)}
              placeholder="Opsiyonel"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Adres</Text>
            <TextInput
              value={form.address}
              onChangeText={(value) => updateForm('address', value)}
              placeholder="Opsiyonel"
              multiline
              style={[styles.input, styles.multilineInput]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Not</Text>
            <TextInput
              value={form.note}
              onChangeText={(value) => updateForm('note', value)}
              placeholder="Opsiyonel"
              multiline
              style={[styles.input, styles.multilineInput]}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={saving}
            style={[styles.saveButton, saving && styles.disabledButton]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{editingId ? 'Güncelle' : 'Kaydet'}</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {loading || !suppliers ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.muted}>Tedarikçiler yükleniyor...</Text>
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading || !suppliers) return null;
    return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Henüz tedarikçi eklenmemiş</Text>
          <Text style={styles.muted}>Stok girişlerinde kullanmak için tedarikçi ekleyebilirsin.</Text>
        </View>
    );
  };

  return (
    <FlatList
      data={loading ? [] : suppliers || []}
      keyExtractor={(item) => item.id}
      renderItem={renderSupplier}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 28 },
  header: { gap: 12, marginBottom: 12 },
  headerText: { gap: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B' },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#0F766E',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  error: {
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  success: {
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
    color: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  formCard: {
    gap: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  formTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  saveButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#0F766E',
  },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  disabledButton: { opacity: 0.7 },
  loadingBox: {
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 22,
    backgroundColor: '#FFFFFF',
  },
  emptyBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 18, backgroundColor: '#FFFFFF' },
  emptyTitle: { marginBottom: 4, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  muted: { color: '#64748B' },
  separator: { height: 12 },
  supplierCard: {
    gap: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#E2E8F0',
    borderLeftColor: '#0F766E',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  passiveCard: {
    borderLeftColor: '#94A3B8',
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitleBlock: { flex: 1 },
  supplierName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  cardMeta: { marginTop: 3, color: '#64748B' },
  badge: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  activeBadge: { color: '#16A34A', backgroundColor: '#DCFCE7' },
  passiveBadge: { color: '#64748B', backgroundColor: '#F1F5F9' },
  infoBlock: { gap: 8 },
  infoLine: { gap: 2 },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  infoValue: { fontSize: 14, color: '#0F172A' },
  emptyValue: { color: '#94A3B8' },
  actions: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  secondaryButtonText: { fontWeight: '800', color: '#0F766E' },
  dangerButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  dangerButtonText: { fontWeight: '800', color: '#DC2626' },
});
