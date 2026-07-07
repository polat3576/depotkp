import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function PlaceholderScreen({ route }) {
  const { isAdmin } = useAuth();
  const title = route.params?.title || 'Ekran';
  const adminOnly = route.params?.adminOnly;

  if (adminOnly && !isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Yetkisiz erişim</Text>
        <Text style={styles.text}>Bu ekran yalnızca yöneticiler için kullanılabilir.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>Bu ekran ilk aşamada yer tutucu olarak eklendi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    marginBottom: 8,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
});
