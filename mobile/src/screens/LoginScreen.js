import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getErrorMessage } from '../api/apiClient';
import { API_BASE_URL } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [restaurantEmail, setRestaurantEmail] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login({
        restaurantEmail: restaurantEmail.trim(),
        userCode: userCode.trim(),
        password,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Giriş yapılamadı. Bilgilerini kontrol edip tekrar dene.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.shell}>
        <View style={styles.brandPanel}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>DK</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.kicker}>Restoran Depo Yönetimi</Text>
            <Text style={styles.title}>DepotKP</Text>
            <Text style={styles.subtitle}>Stok, sayım ve raporlar tek mobil ekranda.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.formTitle}>İşletme girişi</Text>

          <Text style={styles.label}>Restoran e-postası</Text>
          <TextInput
            value={restaurantEmail}
            onChangeText={setRestaurantEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="organizationName"
            placeholder="info@restoran.com"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.label}>Kullanıcı kodu</Text>
          <TextInput
            value={userCode}
            onChangeText={setUserCode}
            autoCapitalize="characters"
            autoCorrect={false}
            textContentType="username"
            placeholder="Örn. AHM001"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            placeholder="Şifreniz"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              (pressed || loading) && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </Pressable>

          <Text style={styles.apiText}>Sunucu: {API_BASE_URL}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
    backgroundColor: colors.background,
  },
  shell: {
    gap: 14,
  },
  brandPanel: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoMark: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  brandCopy: {
    flex: 1,
  },
  card: {
    ...commonStyles.card,
    padding: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CCFBF1',
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: '800',
    color: colors.surface,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#CCFBF1',
  },
  formTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    minHeight: 48,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  error: {
    marginBottom: 12,
    borderRadius: 10,
    padding: 10,
    color: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  apiText: {
    marginTop: 14,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
