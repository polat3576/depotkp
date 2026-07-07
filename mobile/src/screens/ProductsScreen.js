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
import { getCategories } from '../api/categoryApi';
import { getErrorMessage } from '../api/apiClient';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../api/productApi';
import { getSuppliers } from '../api/supplierApi';
import { getUnits } from '../api/unitApi';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  category_id: '',
  unit_id: '',
  default_supplier_id: '',
  min_stock_level: '',
  sku: '',
  barcode: '',
};

function SelectList({ label, value, items, labelKey, onChange, emptyText }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionList}>
        {items.length === 0 ? (
          <Text style={styles.muted}>{emptyText}</Text>
        ) : (
          items.map((item) => {
            const active = value === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onChange(item.id)}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {item[labelKey]}
                  {item.short_name ? ` (${item.short_name})` : ''}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const ProductCard = memo(function ProductCard({ product, isAdmin, onEdit, onDelete }) {
  const currentStock = Number(product.current_stock);
  const minStock = Number(product.min_stock_level);
  const isLow = minStock > 0 && currentStock <= minStock;

  return (
    <View style={[styles.productCard, isLow && styles.lowCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productMeta}>
            {product.category_name || 'Kategori yok'} · {product.unit_name || product.unit_short_name}
          </Text>
          {product.default_supplier_name ? (
            <Text style={styles.productMeta}>Tedarikçi: {product.default_supplier_name}</Text>
          ) : null}
        </View>
        <Text style={[styles.badge, product.is_active ? styles.activeBadge : styles.passiveBadge]}>
          {product.is_active ? 'Aktif' : 'Pasif'}
        </Text>
      </View>

      <View style={styles.stockRow}>
        <View>
          <Text style={styles.stockLabel}>Mevcut</Text>
          <Text style={[styles.stockValue, isLow && styles.lowText]}>
            {currentStock} {product.unit_short_name}
          </Text>
        </View>
        <View>
          <Text style={styles.stockLabel}>Minimum</Text>
          <Text style={styles.stockValue}>
            {minStock} {product.unit_short_name}
          </Text>
        </View>
      </View>

      {isLow ? <Text style={styles.lowNotice}>Düşük stok</Text> : null}

      {isAdmin ? (
        <View style={styles.actions}>
          <Pressable onPress={() => onEdit(product)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Düzenle</Text>
          </Pressable>
          {product.is_active ? (
            <Pressable onPress={() => onDelete(product)} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>Pasifleştir</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

export default function ProductsScreen() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [productData, categoryData, unitData, supplierData] = await Promise.all([
        getProducts({ includeInactive: true }),
        getCategories(),
        getUnits(),
        getSuppliers(),
      ]);
      setProducts(productData);
      setCategories(categoryData);
      setUnits(unitData);
      setSuppliers(supplierData);
    } catch (err) {
      setError(getErrorMessage(err, 'Ürünler alınamadı'));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const selectedProduct = useMemo(
    () => products?.find((product) => product.id === editingId),
    [products, editingId]
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

  const openEditForm = useCallback((product) => {
    setForm({
      name: product.name || '',
      category_id: product.category_id || '',
      unit_id: product.unit_id || '',
      default_supplier_id: product.default_supplier_id || '',
      min_stock_level:
        product.min_stock_level == null ? '' : String(Number(product.min_stock_level)),
      sku: product.sku || '',
      barcode: product.barcode || '',
    });
    setEditingId(product.id);
    setShowForm(true);
    setMessage('');
    setError('');
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      name: form.name.trim(),
      category_id: form.category_id,
      unit_id: form.unit_id,
      default_supplier_id: form.default_supplier_id || undefined,
      sku: form.sku.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      min_stock_level: form.min_stock_level === '' ? 0 : Number(form.min_stock_level),
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage('Ürün güncellendi.');
      } else {
        await createProduct(payload);
        setMessage('Ürün oluşturuldu.');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Ürün kaydedilemedi'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback((product) => {
    Alert.alert('Ürünü pasifleştir', `${product.name} pasife alınsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Pasifleştir',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setError('');
          setMessage('');
          try {
            await deleteProduct(product.id);
            setMessage('Ürün pasife alındı.');
            await loadData();
          } catch (err) {
            setError(getErrorMessage(err, 'Ürün pasife alınamadı'));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }, [loadData]);

  const renderProduct = useCallback(({ item }) => (
    <ProductCard
      product={item}
      isAdmin={isAdmin}
      onEdit={openEditForm}
      onDelete={handleDelete}
    />
  ), [handleDelete, isAdmin, openEditForm]);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Ürünler</Text>
          <Text style={styles.subtitle}>Depodaki ürünleri ve stok seviyelerini takip edin.</Text>
        </View>
        {isAdmin ? (
          <Pressable onPress={openCreateForm} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Yeni Ürün Ekle</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {isAdmin && showForm ? (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {editingId ? `${selectedProduct?.name || 'Ürün'} düzenle` : 'Yeni ürün'}
            </Text>
            <Pressable onPress={resetForm}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ürün adı</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => updateForm('name', value)}
              placeholder="Örn. Domates"
              style={styles.input}
            />
          </View>

          <SelectList
            label="Kategori"
            value={form.category_id}
            items={categories}
            labelKey="name"
            onChange={(value) => updateForm('category_id', value)}
            emptyText="Kategori bulunamadı."
          />

          <SelectList
            label="Birim"
            value={form.unit_id}
            items={units}
            labelKey="name"
            onChange={(value) => updateForm('unit_id', value)}
            emptyText="Birim bulunamadı."
          />

          <SelectList
            label="Varsayılan Tedarikçi (opsiyonel)"
            value={form.default_supplier_id}
            items={[{ id: '', name: 'Yok' }, ...suppliers]}
            labelKey="name"
            onChange={(value) => updateForm('default_supplier_id', value)}
            emptyText="Tedarikçi bulunamadı."
          />

          <View style={styles.field}>
            <Text style={styles.label}>Minimum stok</Text>
            <TextInput
              value={form.min_stock_level}
              onChangeText={(value) => updateForm('min_stock_level', value)}
              placeholder="0"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SKU</Text>
            <TextInput
              value={form.sku}
              onChangeText={(value) => updateForm('sku', value)}
              placeholder="Opsiyonel"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Barkod</Text>
            <TextInput
              value={form.barcode}
              onChangeText={(value) => updateForm('barcode', value)}
              placeholder="Opsiyonel"
              style={styles.input}
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

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.muted}>Ürünler yükleniyor...</Text>
        </View>
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading || !products) return null;
    return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Ürün yok</Text>
          <Text style={styles.muted}>Henüz ürün eklenmemiş.</Text>
        </View>
    );
  };

  return (
    <FlatList
      data={loading ? [] : products || []}
      keyExtractor={(item) => item.id}
      renderItem={renderProduct}
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
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  optionList: { gap: 8 },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  optionActive: { borderColor: '#0F766E', backgroundColor: '#F1F5F9' },
  optionText: { color: '#0F172A', fontWeight: '600' },
  optionTextActive: { color: '#0F172A' },
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
  productCard: {
    gap: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#E2E8F0',
    borderLeftColor: '#0F766E',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  lowCard: { borderColor: '#F59E0B', borderLeftColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitleBlock: { flex: 1 },
  productName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  productMeta: { marginTop: 3, color: '#64748B' },
  badge: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  activeBadge: { color: '#16A34A', backgroundColor: '#DCFCE7' },
  passiveBadge: { color: '#64748B', backgroundColor: '#F1F5F9' },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  stockLabel: { fontSize: 12, color: '#64748B' },
  stockValue: { marginTop: 2, fontSize: 18, fontWeight: '800', color: '#0F172A' },
  lowText: { color: '#F59E0B' },
  lowNotice: { fontWeight: '800', color: '#F59E0B' },
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
