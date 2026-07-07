import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getErrorMessage } from '../api/apiClient';
import { getDashboardSummary } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../theme';

const baseMenu = [
  { label: 'Ürünler', detail: 'Liste, stok seviyesi ve barkod', route: 'Products', mark: 'ÜR' },
  { label: 'Stok', detail: 'Giriş ve çıkış hareketleri', route: 'Stock', mark: 'ST' },
  { label: 'Sayım', detail: 'Fiziksel sayım ve farklar', route: 'Inventory', mark: 'SY' },
  { label: 'Profil / Çıkış', detail: 'Hesap bilgileri', route: 'Profile', mark: 'PR' },
];

const adminMenu = [
  { label: 'Raporlar', detail: 'Tüketim, alım ve düşük stok', route: 'Reports', mark: 'RP' },
  { label: 'Tedarikçiler', detail: 'Alım yapılan firmalar', route: 'Suppliers', mark: 'TD' },
  { label: 'Kullanıcılar', detail: 'Yetki ve personel yönetimi', route: 'Users', mark: 'KY' },
];

function StatCard({ label, value, helper, tone }) {
  return (
    <View style={[styles.statCard, tone === 'warning' && styles.warningStat]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === 'warning' && styles.warningText]}>{value}</Text>
      <Text style={styles.statHelper}>{helper}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(async () => {
    setError('');
    try {
      setSummary(await getDashboardSummary());
    } catch (err) {
      setError(getErrorMessage(err, 'Özet bilgiler alınamadı. Lütfen tekrar dene.'));
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  };

  const menu = isAdmin ? [...baseMenu.slice(0, 3), ...adminMenu, baseMenu[3]] : baseMenu;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.heroKicker}>DepotKP</Text>
          <Text style={styles.welcome}>Merhaba, {user?.full_name || 'kullanıcı'}</Text>
          <Text style={styles.role}>{isAdmin ? 'Yönetici hesabı' : 'Çalışan hesabı'}</Text>
        </View>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{isAdmin ? 'ADMIN' : 'STAFF'}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!summary ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0F766E" />
          <Text style={styles.loadingText}>Özet bilgiler yükleniyor...</Text>
        </View>
      ) : (
        <View style={styles.stats}>
          <StatCard label="Aktif ürün" value={summary.totalProducts} helper="Depoda takip edilen ürün" />
          <StatCard
            label="Kritik stok"
            value={summary.lowStockProductsCount}
            helper="Minimum seviyeye yaklaşan"
            tone={summary.lowStockProductsCount > 0 ? 'warning' : undefined}
          />
          <StatCard label="Bugün giriş" value={summary.todayInCount} helper="Satın alma / ekleme" />
          <StatCard label="Bugün çıkış" value={summary.todayOutCount} helper="Kullanım / tüketim" />
        </View>
      )}

      <Text style={styles.sectionTitle}>İşlemler</Text>
      <View style={styles.menu}>
        {menu.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuMark}>
              <Text style={styles.menuMarkText}>{item.mark}</Text>
            </View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuText}>{item.label}</Text>
              <Text style={styles.menuDetail}>{item.detail}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  heroCard: {
    marginBottom: 14,
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroKicker: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#CCFBF1',
    letterSpacing: 0.6,
  },
  welcome: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.surface,
  },
  role: {
    marginTop: 6,
    color: '#CCFBF1',
  },
  rolePill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.surface,
  },
  error: {
    marginBottom: 12,
    borderRadius: 10,
    padding: 10,
    color: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  loadingBox: {
    ...commonStyles.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    marginTop: 8,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    ...commonStyles.card,
    flexBasis: '48%',
    flexGrow: 1,
    padding: 16,
  },
  warningStat: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statValue: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  statHelper: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  warningText: {
    color: colors.warning,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  menu: {
    gap: 10,
  },
  menuItem: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.surface,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: colors.mutedSurface,
  },
  menuMark: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
  },
  menuMarkText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  menuCopy: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  menuDetail: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
});
