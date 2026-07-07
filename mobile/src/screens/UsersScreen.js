import { memo, useCallback, useEffect, useState } from 'react';
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
import { createUser, deactivateUser, getUsers } from '../api/userApi';
import { useAuth } from '../context/AuthContext';

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

const UserCard = memo(function UserCard({ user, isSelf, onDeactivate, disabled }) {
  return (
    <View style={[styles.userCard, !user.is_active && styles.passiveCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.userName}>{user.full_name}</Text>
          <Text style={styles.cardMeta}>Kod: {user.user_code || '-'}</Text>
          <Text style={styles.cardMeta}>{user.email}</Text>
        </View>
        <View style={styles.badgeColumn}>
          <Text style={[styles.badge, user.role === 'admin' ? styles.adminBadge : styles.staffBadge]}>
            {roleLabels[user.role] || user.role}
          </Text>
          <Text style={[styles.badge, user.is_active ? styles.activeBadge : styles.passiveBadge]}>
            {user.is_active ? 'Aktif' : 'Pasif'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {isSelf ? (
          <View style={styles.selfNote}>
            <Text style={styles.selfNoteText}>Bu hesap sizsiniz</Text>
          </View>
        ) : user.is_active ? (
          <Pressable
            onPress={() => onDeactivate(user)}
            disabled={disabled}
            style={[styles.dangerButton, disabled && styles.disabledButton]}
          >
            <Text style={styles.dangerButtonText}>Pasifleştir</Text>
          </Pressable>
        ) : (
          <View style={styles.selfNote}>
            <Text style={styles.mutedSmall}>Pasif kullanıcı</Text>
          </View>
        )}
      </View>
    </View>
  );
});

export default function UsersScreen({ navigation }) {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setError('');
    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(getErrorMessage(err, 'Kullanıcılar alınamadı'));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      navigation.replace('Dashboard');
      return;
    }
    setLoading(true);
    loadUsers().finally(() => setLoading(false));
  }, [isAdmin, loadUsers, navigation]);

  const updateForm = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setShowForm(false);
  }, []);

  const openCreateForm = useCallback(() => {
    setForm(emptyForm);
    setShowForm(true);
    setMessage('');
    setError('');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const validate = () => {
    if (!form.full_name.trim()) return 'Ad Soyad zorunlu.';
    if (!form.email.trim()) return 'E-posta zorunlu.';
    if (!form.user_code.trim()) return 'Kullanıcı kodu zorunlu.';
    if (form.password.length < 6) return 'Şifre en az 6 karakter olmalı.';
    if (!['admin', 'staff'].includes(form.role)) return 'Rol seçilmeli.';
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

  const handleDeactivate = useCallback((user) => {
    Alert.alert('Kullanıcıyı pasifleştir', `${user.full_name} pasife alınsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Pasifleştir',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setError('');
          setMessage('');
          try {
            await deactivateUser(user.id);
            setMessage('Kullanıcı pasife alındı.');
            await loadUsers();
          } catch (err) {
            setError(getErrorMessage(err, 'Kullanıcı pasife alınamadı'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }, [loadUsers]);

  const renderUser = useCallback(({ item }) => (
    <UserCard
      user={item}
      isSelf={item.id === currentUser?.id}
      onDeactivate={handleDeactivate}
      disabled={saving}
    />
  ), [currentUser?.id, handleDeactivate, saving]);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  if (!isAdmin) {
    return null;
  }

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Kullanıcılar</Text>
          <Text style={styles.subtitle}>İşletmenizdeki yönetici ve çalışan hesapları.</Text>
        </View>
        <Pressable onPress={openCreateForm} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Yeni Kullanıcı Ekle</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {showForm ? (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Yeni kullanıcı</Text>
            <Pressable onPress={resetForm}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              value={form.full_name}
              onChangeText={(value) => updateForm('full_name', value)}
              placeholder="Ad Soyad"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              value={form.email}
              onChangeText={(value) => updateForm('email', value)}
              placeholder="ornek@restoran.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Kullanıcı Kodu</Text>
            <TextInput
              value={form.user_code}
              onChangeText={(value) => updateForm('user_code', value)}
              placeholder="Örn. AHM001"
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
            <Text style={styles.hint}>Giriş bu kodla yapılır. Restoran içinde benzersiz olmalı.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              value={form.password}
              onChangeText={(value) => updateForm('password', value)}
              placeholder="En az 6 karakter"
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Rol</Text>
            <View style={styles.roleRow}>
              {['staff', 'admin'].map((role) => (
                <Pressable
                  key={role}
                  onPress={() => updateForm('role', role)}
                  style={[styles.roleButton, form.role === role && styles.roleButtonActive]}
                >
                  <Text style={[styles.roleButtonText, form.role === role && styles.roleButtonTextActive]}>
                    {roleLabels[role]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={saving}
            style={[styles.saveButton, saving && styles.disabledButton]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Kaydet</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {loading || !users ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.muted}>Kullanıcılar yükleniyor...</Text>
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading || !users) return null;
    return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Henüz kullanıcı eklenmemiş</Text>
          <Text style={styles.muted}>Yeni kullanıcı ekleyerek başlayabilirsin.</Text>
        </View>
    );
  };

  return (
    <FlatList
      data={loading ? [] : users || []}
      keyExtractor={(item) => item.id}
      renderItem={renderUser}
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
  hint: { fontSize: 12, color: '#94A3B8' },
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
  roleRow: { flexDirection: 'row', gap: 10 },
  roleButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleButtonActive: {
    borderColor: '#0F766E',
    backgroundColor: '#0F766E',
  },
  roleButtonText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  roleButtonTextActive: { color: '#FFFFFF' },
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
  mutedSmall: { color: '#94A3B8', fontSize: 13 },
  separator: { height: 12 },
  userCard: {
    gap: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#E2E8F0',
    borderLeftColor: '#0F766E',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  passiveCard: { borderLeftColor: '#94A3B8', backgroundColor: '#F8FAFC' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitleBlock: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  cardMeta: { marginTop: 3, color: '#64748B' },
  badgeColumn: { gap: 6, alignItems: 'flex-end' },
  badge: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  adminBadge: { color: '#115E59', backgroundColor: '#CCFBF1' },
  staffBadge: { color: '#0F766E', backgroundColor: '#CCFBF1' },
  activeBadge: { color: '#16A34A', backgroundColor: '#DCFCE7' },
  passiveBadge: { color: '#64748B', backgroundColor: '#F1F5F9' },
  actions: { flexDirection: 'row', gap: 10 },
  selfNote: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  selfNoteText: { fontWeight: '700', color: '#64748B' },
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
