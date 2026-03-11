import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Modal, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

// 임시 보관함 영화 데이터
const PINNED_MOVIES = [
  { id: '1', title: '인터스텔라', time: '2일 전 Pin', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: '2', title: '라라랜드', time: '3일 전 Pin', image: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' },
  { id: '3', title: '하울의 움직이는 성', time: '5일 전 Pin', image: 'https://image.tmdb.org/t/p/w500/xK2EBng0D0S8F5I3zYyq1mPqLza.jpg' },
  { id: '4', title: '올드보이', time: '1주 전 Pin', image: 'https://image.tmdb.org/t/p/w500/pT1xYy2y2mO5yHmbR11iZ890KzE.jpg' },
];

export default function LibraryScreen() {
  // 탭 목록을 상태(State)로 관리하여 동적 추가가 가능하게 설정
  const [tabs, setTabs] = useState<string[]>(['Pinned', 'Watched']);
  const [activeTab, setActiveTab] = useState('Pinned');

  // 모달 상태 관리
  const [isModalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // 재생목록 추가 처리 함수
  const handleAddPlaylist = () => {
    const trimmedName = newPlaylistName.trim();
    if (trimmedName.length === 0) return; // 빈 이름 방지
    
    if (!tabs.includes(trimmedName)) {
      setTabs([...tabs, trimmedName]); // 새 탭 추가
      setActiveTab(trimmedName); // 추가 후 해당 탭으로 바로 이동
    }
    
    // 초기화 및 모달 닫기
    setNewPlaylistName('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* 1. 상단 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>보관함</Text>
        {/* 새 폴더 추가 버튼 -> 누르면 모달 띄우기 */}
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={20} color="#FF5A36" />
        </Pressable>
      </View>

      {/* 2. 탭 전환 버튼 영역 (가로 스크롤 지원) */}
      <View style={styles.tabWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. 영화 리스트 영역 */}
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
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{activeTab} 목록이 아직 없습니다.</Text>
          </View>
        )}
      </ScrollView>

      {/* 4. 새 재생목록 추가 모달 */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 재생목록 추가</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="재생목록 이름을 입력하세요"
              placeholderTextColor="#666"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus={true} // 모달 열릴 때 자동으로 키보드 띄우기
            />
            
            <View style={styles.modalButtonContainer}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setModalVisible(false);
                  setNewPlaylistName('');
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleAddPlaylist}
              >
                <Text style={styles.confirmButtonText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60, paddingHorizontal: 20 },
  
  // 헤더 스타일
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addButton: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center' 
  },

  // 탭 버튼 스타일
  tabWrapper: { marginBottom: 20 },
  tabContainer: { 
    flexDirection: 'row', backgroundColor: '#1a1a1a', justifyContent: 'center',
    borderRadius: 30, padding: 5 
  },
  tabButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, alignItems: 'center' },
  activeTabButton: { backgroundColor: '#FF5A36' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#111', fontWeight: 'bold' },

  // 리스트 영역 스타일
  listContainer: { paddingBottom: 100, gap: 15 },
  
  movieCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', padding: 10,
    borderRadius: 16, borderWidth: 1, borderColor: '#222'
  },
  movieImage: { width: 60, height: 85, borderRadius: 10, backgroundColor: '#333' },
  movieInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  movieTime: { color: '#888', fontSize: 13 },
  folderIcon: { padding: 10 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 16 },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // 반투명 배경
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#0a0a0a',
    color: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  confirmButton: {
    backgroundColor: '#FF5A36',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
  },
});