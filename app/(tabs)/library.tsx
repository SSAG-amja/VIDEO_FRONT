import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Modal, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { usePlaylistStore } from '../../store/usePlaylistStore'; // 👈 경로에 맞게 수정해주세요

// 임시 보관함 영화 데이터 (추후 Pinned DB 데이터로 대체)
const PINNED_MOVIES = [
  { id: '1', title: '인터스텔라', time: '2일 전 Pin', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: '2', title: '라라랜드', time: '3일 전 Pin', image: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' },
];

export default function LibraryScreen() {
  // 👈 전역 상태 스토어 연결
  const { playlists, addPlaylist } = usePlaylistStore();
  const [activeTab, setActiveTab] = useState('Pinned');

  const [isModalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleAddPlaylist = () => {
    const trimmedName = newPlaylistName.trim();
    if (trimmedName.length === 0) return;
    
    addPlaylist(trimmedName); // 👈 전역 스토어에 추가
    setActiveTab(trimmedName);
    
    setNewPlaylistName('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>보관함</Text>
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={20} color="#FF5A36" />
        </Pressable>
      </View>

      {/* 탭 전환 버튼 영역 */}
      <View style={styles.tabWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {playlists.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 영화 리스트 영역 */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {activeTab === 'Pinned' ? (
          PINNED_MOVIES.map((movie) => (
            <View key={movie.id} style={styles.movieCard}>
              <Image source={{ uri: movie.image }} style={styles.movieImage} />
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.movieTime}>{movie.time}</Text>
              </View>
              <Pressable style={styles.folderIcon}>
                <Ionicons name="folder-open-outline" size={22} color="#FF5A36" />
              </Pressable>
            </View>
          ))
        ) : activeTab === 'Watched' ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>시청한 영화 목록이 아직 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{activeTab} 목록이 비어있습니다.</Text>
          </View>
        )}
      </ScrollView>

      {/* 새 재생목록 추가 모달 */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 재생목록 추가</Text>
            <TextInput
              style={styles.textInput}
              placeholder="재생목록 이름을 입력하세요"
              placeholderTextColor="#666"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus={true}
            />
            <View style={styles.modalButtonContainer}>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); setNewPlaylistName(''); }}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.confirmButton]} onPress={handleAddPlaylist}>
                <Text style={styles.confirmButtonText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ... 스타일은 기존에 주신 코드와 동일하게 유지하시면 됩니다. (분량 상 생략)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  tabWrapper: { marginBottom: 20 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 30, padding: 5 },
  tabButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, alignItems: 'center' },
  activeTabButton: { backgroundColor: '#FF5A36' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#111', fontWeight: 'bold' },
  listContainer: { paddingBottom: 100, gap: 15 },
  movieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#222' },
  movieImage: { width: 60, height: 85, borderRadius: 10, backgroundColor: '#333' },
  movieInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  movieTime: { color: '#888', fontSize: 13 },
  folderIcon: { padding: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  textInput: { backgroundColor: '#0a0a0a', color: '#fff', borderRadius: 8, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  modalButtonContainer: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#333' },
  confirmButton: { backgroundColor: '#FF5A36' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  confirmButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' }
});