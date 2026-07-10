import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getErrorMessage } from '../api/apiClient';
import {
  getConsumptionReport,
  getLowStockReport,
  getPurchasesReport,
} from '../api/reportApi';
import { useAuth } from '../context/AuthContext';

const reportTypes = [
  { value: 'consumption', label: 'Tüketim raporu' },
  { value: 'purchases', label: 'Alım raporu' },
  { value: 'lowStock', label: 'Düşük stok raporu' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function formatNumber(value) {
  if (value == null || value === '') return '-';
  const number = Number(value);
  return Number.isNaN(number) ? '-' : number.toLocaleString('tr-TR');
}

function formatMoney(value) {
  if (value == null || value === '') return '-';
  const number = Number(value);
  return Number.isNaN(number)
    ? '-'
    : number.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('tr-TR');
}

const ReportCard = memo(function ReportCard({ type, row }) {
  if (type === 'purchases') {
    return (
      <View style={styles.resultCard}>
        <Text style={styles.productName}>{row.product_name}</Text>
        <Text style={styles.meta}>Tarih: {formatDate(row.purchase_date)}</Text>
        <Text style={styles.meta}>Miktar: {formatNumber(row.quantity)} {row.unit}</Text>
        <Text style={styles.meta}>Birim fiyat: {formatMoney(row.unit_cost)}</Text>
        <Text style={styles.meta}>Toplam tutar: {formatMoney(row.total_cost)}</Text>
        {row.supplier_name ? <Text style={styles.meta}>Tedarikçi: {row.supplier_name}</Text> : null}
        <Text style={styles.meta}>Tüketilen: {formatNumber(row.consumed_quantity)} {row.unit}</Text>
        <Text style={styles.meta}>Kalan (tahmini): {formatNumber(row.remaining_quantity)} {row.unit}</Text>
        <Text style={row.is_active ? styles.activeText : styles.meta}>
          {row.is_active
            ? `Aktif · ${row.days_covered} gün`
            : `${row.days_covered} gün sonra yeni alım`}
        </Text>
      </View>
    );
  }

  if (type === 'lowStock') {
    const missing = Number(row.min_stock_level) - Number(row.current_stock);
    return (
      <View style={[styles.resultCard, styles.lowCard]}>
        <Text style={styles.productName}>{row.product_name}</Text>
        {row.category_name || row.category ? (
          <Text style={styles.meta}>Kategori: {row.category_name || row.category}</Text>
        ) : null}
        <Text style={styles.meta}>Mevcut stok: {formatNumber(row.current_stock)} {row.unit}</Text>
        <Text style={styles.meta}>Minimum stok: {formatNumber(row.min_stock_level)} {row.unit}</Text>
        <Text style={styles.lowText}>Eksik: {formatNumber(missing)} {row.unit}</Text>
      </View>
    );
  }

  return (
    <View style={styles.resultCard}>
      <Text style={styles.productName}>{row.product_name}</Text>
      <Text style={styles.meta}>Toplam çıkış: {formatNumber(row.total_quantity)} {row.unit}</Text>
      <Text style={styles.meta}>Hareket sayısı: {formatNumber(row.movement_count)}</Text>
    </View>
  );
});

export default function ReportsScreen() {
  const { isAdmin } = useAuth();
  const [type, setType] = useState('consumption');
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const filtersRef = useRef({ startDate: '', endDate: '' });

  const isRangeReport = type !== 'lowStock';

  useEffect(() => {
    filtersRef.current = { startDate, endDate };
  }, [endDate, startDate]);

  const loadReport = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const filters = filtersRef.current;
      let result;
      if (type === 'consumption') {
        result = await getConsumptionReport(filters);
      } else if (type === 'purchases') {
        result = await getPurchasesReport(filters);
      } else {
        result = await getLowStockReport();
      }
      setRows(result.items || []);
    } catch (err) {
      setRows([]);
      setError(getErrorMessage(err, 'Rapor alınamadı'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, type]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (!isAdmin) {
    return (
      <View style={styles.blocked}>
        <Text style={styles.title}>Yetkisiz erişim</Text>
        <Text style={styles.meta}>Raporlar yalnızca yöneticiler tarafından görüntülenebilir.</Text>
      </View>
    );
  }

  const renderReport = useCallback(({ item }) => (
    <ReportCard type={type} row={item} />
  ), [type]);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Raporlar</Text>
        <Text style={styles.subtitle}>Tüketim, alım ve düşük stok özetleri.</Text>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.label}>Rapor tipi</Text>
        <View style={styles.choiceList}>
          {reportTypes.map((item) => {
            const active = type === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setType(item.value)}
                style={[styles.choice, active && styles.choiceActive]}
              >
                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isRangeReport ? (
          <>
            <Text style={styles.label}>Başlangıç tarihi</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />
            <Text style={styles.label}>Bitiş tarihi</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />
          </>
        ) : null}

        <Pressable
          onPress={loadReport}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.disabledButton]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Raporu Getir</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>{reportTypes.find((item) => item.value === type)?.label}</Text>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.meta}>Rapor yükleniyor...</Text>
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>Rapor verisi bulunmuyor</Text>
        <Text style={styles.meta}>Bu filtrelere uygun hareket kaydı yok.</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={loading ? [] : rows}
      keyExtractor={(item, index) => String(item.movement_id || item.product_id || item.id || index)}
      renderItem={renderReport}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.content}
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
  blocked: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F8FAFC' },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 4, color: '#64748B' },
  filterCard: { gap: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, backgroundColor: '#FFFFFF' },
  label: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  choiceList: { gap: 8 },
  choice: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  choiceActive: { borderColor: '#0F766E', backgroundColor: '#F1F5F9' },
  choiceText: { fontWeight: '600', color: '#0F172A' },
  choiceTextActive: { color: '#0F172A' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#0F766E',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  disabledButton: { opacity: 0.7 },
  error: { marginTop: 12, borderRadius: 10, padding: 10, color: '#DC2626', backgroundColor: '#FEF2F2' },
  sectionTitle: { marginTop: 18, marginBottom: 10, fontSize: 15, fontWeight: '800', color: '#0F172A' },
  loadingBox: { alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 22, backgroundColor: '#FFFFFF' },
  emptyBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 18, backgroundColor: '#FFFFFF' },
  emptyTitle: { marginBottom: 4, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  separator: { height: 12 },
  resultCard: {
    gap: 5,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#E2E8F0',
    borderLeftColor: '#0F766E',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  lowCard: { borderColor: '#F59E0B', borderLeftColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  productName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  meta: { color: '#64748B' },
  lowText: { fontWeight: '800', color: '#F59E0B' },
  activeText: { fontWeight: '700', color: '#0F766E' },
});
