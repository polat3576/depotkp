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
  cancelInventoryCount,
  completeInventoryCount,
  getInventoryCount,
  updateInventoryItems,
} from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';

function displayQty(value) {
  if (value == null || value === '') return '-';
  const number = Number(value);
  return Number.isNaN(number) ? '-' : number;
}

const InventoryItemCard = memo(function InventoryItemCard({
  item,
  counted,
  isDraft,
  saving,
  onChange,
}) {
  const expected = Number(item.expected_quantity);
  const difference = counted === '' ? displayQty(item.difference_quantity) : Number(counted) - expected;
  const hasDifference = Number(difference) !== 0;

  return (
    <View style={styles.itemCard}>
      <Text style={styles.productName}>{item.product_name}</Text>
      <View style={styles.qtyRow}>
        <View>
          <Text style={styles.qtyLabel}>Beklenen</Text>
          <Text style={styles.qtyValue}>{displayQty(item.expected_quantity)} {item.unit_short_name}</Text>
        </View>
        <View>
          <Text style={styles.qtyLabel}>Fark</Text>
          <Text style={[styles.qtyValue, hasDifference && styles.diffText]}>{difference} {item.unit_short_name}</Text>
        </View>
      </View>
      <Text style={styles.label}>Sayılan miktar</Text>
      <TextInput
        value={counted}
        onChangeText={(value) => onChange(item.product_id, value)}
        editable={isDraft && !saving}
        keyboardType="numeric"
        placeholder="0"
        style={[styles.input, !isDraft && styles.disabledInput]}
      />
    </View>
  );
});

export default function InventoryDetailScreen({ route }) {
  const { isAdmin } = useAuth();
  const { id } = route.params || {};
  const [count, setCount] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadDetail = useCallback(async () => {
    setError('');
    try {
      const detail = await getInventoryCount(id);
      setCount(detail);
      setDrafts(Object.fromEntries(detail.items.map((item) => [
        item.product_id,
        item.counted_quantity == null ? '' : String(Number(item.counted_quantity)),
      ])));
    } catch (err) {
      setError(getErrorMessage(err, 'Sayım detayı alınamadı'));
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadDetail().finally(() => setLoading(false));
  }, [loadDetail]);

  const isDraft = count?.status === 'DRAFT';
  const changedItems = useMemo(() => {
    if (!count) return [];
    return count.items
      .filter((item) => drafts[item.product_id] !== '')
      .map((item) => ({
        product_id: item.product_id,
        counted_quantity: Number(drafts[item.product_id]),
        note: item.note || undefined,
      }));
  }, [count, drafts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDetail();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (changedItems.length === 0) {
      setError('Kaydetmek için en az bir sayılan miktar girin.');
      setMessage('');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateInventoryItems(id, changedItems);
      setCount(updated);
      setMessage('Sayım miktarları kaydedildi.');
    } catch (err) {
      setError(getErrorMessage(err, 'Sayım miktarları kaydedilemedi'));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => {
    Alert.alert('Sayımı tamamla', 'Sayım farkları stok düzeltmesi olarak işlenecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Tamamla',
        onPress: async () => {
          setSaving(true);
          setError('');
          setMessage('');
          try {
            const result = await completeInventoryCount(id);
            await loadDetail();
            setMessage(`Sayım tamamlandı. ${result.corrections_applied} stok düzeltmesi oluştu.`);
          } catch (err) {
            setError(getErrorMessage(err, 'Sayım tamamlanamadı'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Sayımı iptal et', 'İptal edilen sayım tekrar düzenlenemez.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setError('');
          setMessage('');
          try {
            await cancelInventoryCount(id);
            await loadDetail();
            setMessage('Sayım iptal edildi.');
          } catch (err) {
            setError(getErrorMessage(err, 'Sayım iptal edilemedi'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const updateDraft = useCallback((productId, value) => {
    setDrafts((prev) => ({ ...prev, [productId]: value }));
  }, []);

  const renderItem = useCallback(({ item }) => (
    <InventoryItemCard
      item={item}
      counted={drafts[item.product_id]}
      isDraft={isDraft}
      saving={saving}
      onChange={updateDraft}
    />
  ), [drafts, isDraft, saving, updateDraft]);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  const renderHeader = () => (
    <>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {loading || !count ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.muted}>Sayım detayı yükleniyor...</Text>
        </View>
      ) : null}
      {count ? (
        <View style={styles.summaryCard}>
          <Text style={styles.title}>Sayım Detayı</Text>
          <Text style={styles.status}>Durum: {count.status}</Text>
          {count.note ? <Text style={styles.muted}>{count.note}</Text> : null}
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading || !count) return null;
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>Sayım kalemi bulunmuyor</Text>
        <Text style={styles.muted}>Bu sayım için henüz ürün listesi oluşmamış.</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!count) return null;
    return (
      <>
        {isDraft ? (
          <Pressable onPress={handleSave} disabled={saving} style={[styles.primaryButton, saving && styles.disabledButton]}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Miktarları Kaydet</Text>}
          </Pressable>
        ) : null}
        {isAdmin && isDraft ? (
          <View style={styles.adminActions}>
            <Pressable onPress={handleComplete} disabled={saving} style={[styles.completeButton, saving && styles.disabledButton]}>
              <Text style={styles.actionText}>Tamamla</Text>
            </Pressable>
            <Pressable onPress={handleCancel} disabled={saving} style={[styles.cancelButton, saving && styles.disabledButton]}>
              <Text style={styles.cancelText}>İptal Et</Text>
            </Pressable>
          </View>
        ) : null}
      </>
    );
  };

  return (
    <FlatList
      data={loading ? [] : count?.items || []}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 28 },
  error: { marginBottom: 10, borderRadius: 10, padding: 10, color: '#DC2626', backgroundColor: '#FEF2F2' },
  success: { marginBottom: 10, borderRadius: 10, padding: 10, color: '#16A34A', backgroundColor: '#F0FDF4' },
  loadingBox: { alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 22, backgroundColor: '#FFFFFF' },
  summaryCard: { gap: 4, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, backgroundColor: '#FFFFFF' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  status: { fontWeight: '700', color: '#0F172A' },
  muted: { color: '#64748B' },
  separator: { height: 12 },
  emptyBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 18, backgroundColor: '#FFFFFF' },
  emptyTitle: { marginBottom: 4, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  itemCard: {
    gap: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#E2E8F0',
    borderLeftColor: '#0F766E',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  productName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  qtyLabel: { fontSize: 12, color: '#64748B' },
  qtyValue: { marginTop: 2, fontSize: 17, fontWeight: '800', color: '#0F172A' },
  diffText: { color: '#F59E0B' },
  label: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, fontSize: 16, color: '#0F172A', backgroundColor: '#FFFFFF' },
  disabledInput: { backgroundColor: '#F8FAFC', color: '#64748B' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderRadius: 12, backgroundColor: '#0F766E' },
  primaryButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  disabledButton: { opacity: 0.7 },
  adminActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  completeButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#16A34A' },
  cancelButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FEE2E2' },
  actionText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  cancelText: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
});
