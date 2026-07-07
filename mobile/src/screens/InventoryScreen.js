import { memo, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getErrorMessage } from '../api/apiClient';
import { createInventoryCount, getInventoryCounts } from '../api/inventoryApi';

const statusMap = {
  DRAFT: { label: 'Taslak', style: 'draftBadge' },
  COMPLETED: { label: 'Tamamlandı', style: 'completedBadge' },
  CANCELLED: { label: 'İptal', style: 'cancelledBadge' },
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const InventoryCountCard = memo(function InventoryCountCard({ count, onPress }) {
  const status = statusMap[count.status] || statusMap.DRAFT;

  return (
    <Pressable
      onPress={() => onPress(count.id)}
      style={({ pressed }) => [styles.countCard, pressed && styles.pressedCard]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.countTitle}>{formatDate(count.started_at)}</Text>
          <Text style={styles.countMeta}>{count.counted_by_name} · {count.item_count} ürün</Text>
        </View>
        <Text style={[styles.badge, styles[status.style]]}>{status.label}</Text>
      </View>
      {count.note ? <Text style={styles.note}>{count.note}</Text> : null}
    </Pressable>
  );
});

export default function InventoryScreen({ navigation }) {
  const [counts, setCounts] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadCounts = useCallback(async () => {
    setError('');
    try {
      setCounts(await getInventoryCounts());
    } catch (err) {
      setError(getErrorMessage(err, 'Sayımlar alınamadı'));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCounts);
    setLoading(true);
    loadCounts().finally(() => setLoading(false));
    return unsubscribe;
  }, [navigation, loadCounts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounts();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    setMessage('');
    try {
      const created = await createInventoryCount({ note: note.trim() || undefined });
      setNote('');
      setMessage('Yeni sayım başlatıldı.');
      await loadCounts();
      navigation.navigate('InventoryDetail', { id: created.id });
    } catch (err) {
      setError(getErrorMessage(err, 'Sayım başlatılamadı'));
    } finally {
      setCreating(false);
    }
  };

  const openDetail = useCallback((countId) => {
    navigation.navigate('InventoryDetail', { id: countId });
  }, [navigation]);

  const renderCount = useCallback(({ item }) => (
    <InventoryCountCard count={item} onPress={openDetail} />
  ), [openDetail]);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Sayım</Text>
        <Text style={styles.subtitle}>Fiziksel depo sayımlarını başlatın ve takip edin.</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <View style={styles.createCard}>
        <Text style={styles.label}>Yeni sayım notu</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Opsiyonel" style={styles.input} />
        <Pressable onPress={handleCreate} disabled={creating} style={[styles.primaryButton, creating && styles.disabledButton]}>
          {creating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Yeni Sayım Başlat</Text>}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Sayım Listesi</Text>
      {loading || !counts ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.muted}>Sayımlar yükleniyor...</Text>
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading || !counts) return null;
    return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Henüz sayım başlatılmamış</Text>
          <Text style={styles.muted}>Yeni sayım başlatarak depo durumunu kontrol edebilirsin.</Text>
        </View>
    );
  };

  return (
    <FlatList
      data={loading ? [] : counts || []}
      keyExtractor={(item) => item.id}
      renderItem={renderCount}
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
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 4, color: '#64748B' },
  error: { marginBottom: 10, borderRadius: 10, padding: 10, color: '#DC2626', backgroundColor: '#FEF2F2' },
  success: { marginBottom: 10, borderRadius: 10, padding: 10, color: '#16A34A', backgroundColor: '#F0FDF4' },
  createCard: { gap: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, backgroundColor: '#FFFFFF' },
  label: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, fontSize: 16, color: '#0F172A', backgroundColor: '#FFFFFF' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#0F766E' },
  primaryButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  disabledButton: { opacity: 0.7 },
  sectionTitle: { marginTop: 18, marginBottom: 10, fontSize: 15, fontWeight: '800', color: '#0F172A' },
  loadingBox: { alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 22, backgroundColor: '#FFFFFF' },
  emptyBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 18, backgroundColor: '#FFFFFF' },
  emptyTitle: { marginBottom: 4, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  muted: { color: '#64748B' },
  separator: { height: 12 },
  countCard: {
    gap: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#E2E8F0',
    borderLeftColor: '#0F766E',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  pressedCard: { backgroundColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitleBlock: { flex: 1 },
  countTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  countMeta: { marginTop: 3, color: '#64748B' },
  badge: { overflow: 'hidden', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, fontSize: 12, fontWeight: '800' },
  draftBadge: { color: '#1d4ed8', backgroundColor: '#dbeafe' },
  completedBadge: { color: '#16A34A', backgroundColor: '#DCFCE7' },
  cancelledBadge: { color: '#64748B', backgroundColor: '#F1F5F9' },
  note: { color: '#64748B' },
});
