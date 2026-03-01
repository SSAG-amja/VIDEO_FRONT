import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function MatchModal() {
  return (
    <View style={styles.overlay}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>Its a Match!</Text>
        <Text style={styles.subtitle}>커플 무비나잇 폴더에서{"\n"}취향이 일치했어요</Text>
        
        <View style={styles.cardPlaceholder}>
          <Text style={{ color: '#666' }}>매칭된 영화 카드</Text>
        </View>

        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>닫기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', alignItems: 'center' },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#FF5A36', fontSize: 16, textAlign: 'center', marginBottom: 40 },
  cardPlaceholder: { width: 200, height: 300, backgroundColor: '#222', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  closeButton: { padding: 15, backgroundColor: '#333', borderRadius: 25, width: '100%', alignItems: 'center' },
  closeButtonText: { color: '#fff' }
});