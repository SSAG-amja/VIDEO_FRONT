import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { usePinStore } from '../../store/usePinStore';

const MAIN_TABS = ['Pinned', 'Watched', 'Saved'];

export default function LibraryScreen() {
  const { customPlaylists, createPlaylist } = usePlaylistStore();
  const pinnedMovies = usePinStore(state => state.pinnedMovies);
  const togglePin = usePinStore(state => state.togglePin);
  
  const [activeTab, setActiveTab] = useState('Pinned');
  const [isModalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim()); 
    setActiveTab('Saved');
    setNewPlaylistName('');
    setModalVisible(false);
  };

  const renderPinnedTab = () => {
    if (pinnedMovies.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Pin한 영화가 없습니다.</Text>
        </View>
      );
    }
    
    return pinnedMovies.map((movie) => (
      <Pressable 
        key={movie.id} 
        style={styles.movieCard}
        onPress={() => 
          router.push({ 
            pathname: '/detail/[id]', 
            params: { id: movie.id, movieData: JSON.stringify(movie) } 
          } as any)
        }
      >
        <Image source={{ uri: movie.image }} style={styles.movieImage} />
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <Text style={styles.movieTime}>최근 Pin됨</Text>
        </View>
        <Pressable style={styles.actionIcon} onPress={() => togglePin(movie)}>
          <Ionicons name="heart" size={22} color="#FF5A36" />
        </Pressable>
      </Pressable>
    ));
  };

  const renderSavedTab = () => {
    return (
      <View style={{ width: '100%' }}>
        <Pressable style={styles.addPlaylistCard} onPress={() => setModalVisible(true)}>
          <View style={styles.addPlaylistIconContainer}>
            <Feather name="plus" size={24} color="#FF5A36" />
          </View>
          <Text style={styles.addPlaylistText}>새 재생목록 추가</Text>
        </Pressable>

        {customPlaylists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>저장된 재생목록이 없습니다.</Text>
          </View>
        ) : (
          customPlaylists.map((playlist) => (
            <Pressable 
              key={playlist.id} 
              style={styles.playlistFolderCard} 
              onPress={() =>
                router.push({
                  pathname: '/playlist/[id]',
                  params: { id: playlist.id.toString() }
                } as any)
              }
            >
              <View style={styles.folderIconContainer}>
                <Ionicons name="folder" size={32} color="#FF5A36" />
              </View>
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>{playlist.name}</Text>
                <Text style={styles.movieTime}>영화 {playlist.movies.length}편</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" style={{ padding: 10 }} />
            </Pressable>
          ))
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>보관함</Text>
      </View>

      <View style={styles.tabWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {MAIN_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, isActive && styles.activeTabButton]}>
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {/* 🔥 수정된 부분: 조건부 렌더링(&&)을 없애고 display 속성으로 토글하여 메모리에 뷰를 유지합니다. */}
        <View style={{ display: activeTab === 'Pinned' ? 'flex' : 'none', width: '100%' }}>
          {renderPinnedTab()}
        </View>
        
        <View style={{ display: activeTab === 'Watched' ? 'flex' : 'none', width: '100%' }}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>시청한 영화가 없습니다.</Text>
          </View>
        </View>
        
        <View style={{ display: activeTab === 'Saved' ? 'flex' : 'none', width: '100%' }}>
          {renderSavedTab()}
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 재생목록 추가</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="목록 이름" 
              placeholderTextColor="#666" 
              value={newPlaylistName} 
              onChangeText={setNewPlaylistName} 
              autoFocus 
            />
            <View style={styles.modalButtonContainer}>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={{color:'#fff', fontWeight: 'bold'}}>취소</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.confirmButton]} onPress={handleCreatePlaylist}>
                <Text style={{color:'#111', fontWeight: 'bold'}}>추가</Text>
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
  header: { marginBottom: 25 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  tabWrapper: { marginBottom: 20, alignItems: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 30, padding: 5 },
  tabButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, alignItems: 'center' },
  activeTabButton: { backgroundColor: '#FF5A36' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#111', fontWeight: 'bold' },
  listContainer: { paddingBottom: 100, gap: 15 },
  movieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#222' },
  movieImage: { width: 60, height: 85, borderRadius: 10 },
  movieInfo: { flex: 1, marginLeft: 15 },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  movieTime: { color: '#888', fontSize: 13 },
  actionIcon: { padding: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 16 },
  playlistFolderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#222', marginBottom: 15 },
  folderIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255, 90, 54, 0.1)', justifyContent: 'center', alignItems: 'center' },
  addPlaylistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', marginBottom: 15 },
  addPlaylistIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255, 90, 54, 0.1)', justifyContent: 'center', alignItems: 'center' },
  addPlaylistText: { color: '#FF5A36', fontSize: 16, fontWeight: 'bold', marginLeft: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  textInput: { backgroundColor: '#0a0a0a', color: '#fff', borderRadius: 8, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  modalButtonContainer: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#333' },
  confirmButton: { backgroundColor: '#FF5A36' }
});