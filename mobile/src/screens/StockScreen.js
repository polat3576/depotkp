import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getErrorMessage } from '../api/apiClient';
import { getProducts } from '../api/productApi';
import { createMovement } from '../api/stockApi';
import { getSuppliers } from '../api/supplierApi';
import { useAuth } from '../context/AuthContext';

// Okunabilecek barkod türleri (yaygın ürün barkodları + QR).
const BARCODE_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'codabar',
  'itf14',
  'qr',
];

const initialForm = {
  product_id: '',
  movement_type: 'OUT',
  quantity: '',
  unit_cost: '',
  supplier_id: '',
  document_no: '',
  note: '',
};

const ChoiceList = memo(function ChoiceList({ label, value, items, getLabel, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceList}>
        {items.map((item, index) => {
          const itemValue = item.id || item.value;
          const active = value === itemValue;
          return (
            <Pressable
              key={item.id || item.value || `${item.label || item.name}-${index}`}
              onPress={() => onChange(itemValue)}
              style={[styles.choice, active && styles.choiceActive]}
            >
              <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                {getLabel(item)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

export default function StockScreen() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLock = useRef(false); // aynı taramanın birden çok kez işlenmesini önler

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [productData, supplierData] = await Promise.all([
        getProducts({ includeInactive: false }),
        isAdmin ? getSuppliers() : Promise.resolve([]),
      ]);
      setProducts(productData);
      setSuppliers(supplierData);
    } catch (err) {
      setError(getErrorMessage(err, 'Stok verileri alınamadı'));
    }
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    if (!isAdmin && form.movement_type !== 'OUT') {
      setForm((prev) => ({ ...prev, movement_type: 'OUT' }));
    }
  }, [isAdmin, form.movement_type]);

  const selectedProduct = useMemo(
    () => products?.find((product) => product.id === form.product_id),
    [products, form.product_id]
  );

  const isIn = form.movement_type === 'IN';
  const movementTypes = useMemo(() => (
    isAdmin
      ? [
        { value: 'OUT', label: 'Çıkış' },
        { value: 'IN', label: 'Giriş' },
      ]
      : [{ value: 'OUT', label: 'Çıkış' }]
  ), [isAdmin]);

  const supplierOptions = useMemo(
    () => [{ id: '', name: 'Tedarikçi seçme' }, ...suppliers],
    [suppliers]
  );

  const productsByBarcode = useMemo(() => {
    const entries = (products || [])
      .filter((product) => product.barcode)
      .map((product) => [String(product.barcode).trim(), product]);
    return new Map(entries);
  }, [products]);

  const updateForm = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const resetAfterSuccess = () => {
    setForm((prev) => ({
      ...initialForm,
      movement_type: isAdmin ? prev.movement_type : 'OUT',
    }));
  };

  const validate = () => {
    if (!form.product_id) return 'Lütfen ürün seçin.';
    const quantity = Number(form.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) return 'Miktar 0’dan büyük olmalı.';
    if (isIn) {
      const unitCost = Number(form.unit_cost);
      if (Number.isNaN(unitCost) || unitCost <= 0) return 'Giriş için birim fiyat zorunlu.';
    }
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      product_id: form.product_id,
      movement_type: form.movement_type,
      quantity: Number(form.quantity),
      note: form.note.trim() || undefined,
    };

    if (isIn) {
      payload.unit_cost = Number(form.unit_cost);
      if (form.supplier_id) payload.supplier_id = form.supplier_id;
      if (form.document_no.trim()) payload.document_no = form.document_no.trim();
    }

    try {
      const result = await createMovement(payload);
      setSuccess(
        `${selectedProduct?.name || 'Ürün'} için hareket kaydedildi. Yeni stok: ${result.current_stock} ${selectedProduct?.unit_short_name || ''}`
      );
      resetAfterSuccess();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Stok hareketi kaydedilemedi'));
    } finally {
      setSubmitting(false);
    }
  };

  // Kamerayı açar (gerekirse izin ister).
  const openScanner = async () => {
    setError('');
    setSuccess('');
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setError('Kamera izni verilmedi. Barkod okutmak için izin gerekli.');
        return;
      }
    }
    scanLock.current = false;
    setScannerVisible(true);
  };

  // Barkod okununca ürünü yerel listede eşleştirip seçer.
  const handleBarcodeScanned = ({ data }) => {
    if (scanLock.current) return; // callback çok hızlı tetiklenir; tek seferlik işle
    scanLock.current = true;

    const code = String(data).trim();
    const match = productsByBarcode.get(code);

    setScannerVisible(false);

    if (match) {
      updateForm('product_id', match.id);
      setSuccess(`Barkod okundu: ${match.name}`);
      setError('');
    } else {
      setError(`Barkod (${code}) ile eşleşen ürün bulunamadı.`);
      setSuccess('');
    }
  };

  const getProductLabel = useCallback(
    (product) => `${product.name} · ${Number(product.current_stock)} ${product.unit_short_name}`,
    []
  );

  const getOptionLabel = useCallback((item) => item.label, []);
  const getSupplierLabel = useCallback((supplier) => supplier.name, []);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Stok Hareketi</Text>
        <Text style={styles.subtitle}>
          {isAdmin ? 'Stok giriş ve çıkış işlemleri.' : 'Depodan kullanım için çıkış işlemi.'}
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {loading || !products ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.muted}>Stok formu hazırlanıyor...</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Pressable onPress={openScanner} style={styles.scanButton}>
            <Text style={styles.scanButtonText}>📷 Barkod ile ürün seç</Text>
          </Pressable>

          <ChoiceList
            label="Ürün"
            value={form.product_id}
            items={products}
            getLabel={getProductLabel}
            onChange={(value) => updateForm('product_id', value)}
          />

          {selectedProduct ? (
            <View style={styles.stockInfo}>
              <Text style={styles.stockInfoText}>
                Mevcut stok: {Number(selectedProduct.current_stock)} {selectedProduct.unit_short_name}
              </Text>
              <Text style={styles.stockInfoSub}>
                Minimum: {Number(selectedProduct.min_stock_level)} {selectedProduct.unit_short_name}
              </Text>
            </View>
          ) : null}

          <ChoiceList
            label="İşlem"
            value={form.movement_type}
            items={movementTypes}
            getLabel={getOptionLabel}
            onChange={(value) => updateForm('movement_type', value)}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Miktar</Text>
            <TextInput
              value={form.quantity}
              onChangeText={(value) => updateForm('quantity', value)}
              keyboardType="numeric"
              placeholder="0"
              style={styles.input}
            />
          </View>

          {isIn ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Birim fiyat</Text>
                <TextInput
                  value={form.unit_cost}
                  onChangeText={(value) => updateForm('unit_cost', value)}
                  keyboardType="numeric"
                  placeholder="0.00"
                  style={styles.input}
                />
              </View>

              <ChoiceList
                label="Tedarikçi"
                value={form.supplier_id}
                items={supplierOptions}
                getLabel={getSupplierLabel}
                onChange={(value) => updateForm('supplier_id', value)}
              />

              <View style={styles.field}>
                <Text style={styles.label}>Belge no</Text>
                <TextInput
                  value={form.document_no}
                  onChangeText={(value) => updateForm('document_no', value)}
                  placeholder="Fatura / irsaliye no"
                  style={styles.input}
                />
              </View>
            </>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Not</Text>
            <TextInput
              value={form.note}
              onChangeText={(value) => updateForm('note', value)}
              placeholder="Opsiyonel"
              style={styles.input}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.disabledButton]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Kaydet</Text>
            )}
          </Pressable>
        </View>
      )}

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerHint}>Barkodu çerçeveye getirin</Text>
            <Pressable onPress={() => setScannerVisible(false)} style={styles.scannerClose}>
              <Text style={styles.scannerCloseText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 4,
    color: '#64748B',
  },
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
  loadingBox: {
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 22,
    backgroundColor: '#FFFFFF',
  },
  muted: {
    color: '#64748B',
  },
  card: {
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
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
  choiceList: {
    gap: 8,
  },
  choice: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  choiceActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F1F5F9',
  },
  choiceText: {
    fontWeight: '600',
    color: '#0F172A',
  },
  choiceTextActive: {
    color: '#0F172A',
  },
  stockInfo: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  stockInfoText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockInfoSub: {
    marginTop: 2,
    color: '#64748B',
  },
  submitButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#0F766E',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scanButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0F766E',
    backgroundColor: '#F8FAFC',
  },
  scanButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F766E',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 14,
    padding: 28,
  },
  scannerHint: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scannerClose: {
    minHeight: 48,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  scannerCloseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
});
