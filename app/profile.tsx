import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>프로필 (Profile)</Text>
      <Text style={styles.description}>사용자 설정 및 정보 영역</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  description: { color: '#666', fontSize: 14 }
});