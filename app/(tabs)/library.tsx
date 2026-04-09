import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Modal, TextInput, Alert, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { usePinStore } from '../../store/usePinStore';

const MAIN_TABS = ['Pinned', 'Watched', 'Saved'];
const INDEX_LETTERS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','A','F','K','P','U','Z'];

const getChosung = (str: string) => {
  const cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const code = str.charCodeAt(0) - 44032;
  if (code > -1 && code < 11172) return cho[Math.floor(code / 588)];
  return str.charAt(0).toUpperCase(); 
};

export default function LibraryScreen() {
  const { customPlaylists, createPlaylist, deletePlaylist, togglePlaylistVisibility } = usePlaylistStore();
  const { pinnedMovies, togglePin } = usePinStore(); 
  
  const [activeTab, setActiveTab] = useState('Pinned');
  const [isModalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isNewPlaylistPublic, setIsNewPlaylistPublic] = useState(false);

  // 🔽 정렬 관련 상태 ('created' 추가)
  const [sortType, setSortType] = useState<'time' | 'name' | 'created'>('time'); 
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); 

  const flatListRef = useRef<FlatList>(null);

  // 💡 지연 삭제를 위한 로컬 상태 (화면에 보여질 리스트) 추가
  const [displayPinned, setDisplayPinned] = useState(pinnedMovies);

  // ✅ 다른 메인 탭(홈, 탐색 등)에 다녀왔을 때(화면 포커스 복귀 시) 임시 취소된 항목 완전 제거
  useFocusEffect(
    useCallback(() => {
      // 탭에 포커스가 돌아올 때 최신 글로벌 상태로 깔끔하게 동기화합니다.
      setDisplayPinned(usePinStore.getState().pinnedMovies);
    }, [])
  );

  // 💡 Pinned 탭에 머무는 동안은 삭제해도 화면에 유지, 탭을 벗어나면 동기화
  useEffect(() => {
    if (activeTab === 'Pinned') {
      setDisplayPinned(prev => {
        // 전역 상태에 새로 추가된 Pin만 로컬 배열에 합치고, 지워진 것은 유지합니다.
        const newItems = pinnedMovies.filter((pm: any) => !prev.some((p: any) => p.id === pm.id));
        return [...prev, ...newItems];
      });
    } else {
      setDisplayPinned(pinnedMovies);
    }
  }, [activeTab, pinnedMovies]);

  // 🔄 탭 전환 시 정렬 상태 초기화 (Saved 외의 탭에서 '생성' 정렬이 유지되지 않도록)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'Saved' && sortType === 'created') {
      setSortType('time');
    }
  };

  const sortedData = useMemo(() => {
    // 💡 Pinned 탭일 때는 전역 데이터가 아닌 로컬 데이터(displayPinned)를 보여줍니다.
    let rawData = activeTab === 'Pinned' ? [...displayPinned] : activeTab === 'Saved' ? [...customPlaylists] : [];
    
    return rawData.sort((a: any, b: any) => {
      const titleA = a.title || a.name || "";
      const titleB = b.title || b.name || "";

      if (sortType === 'name') {
        return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      } 
      else if (sortType === 'created') {
        // 플레이리스트 생성순 (id 값이 Date.now() 기반)
        const createdA = Number(a.id) || 0;
        const createdB = Number(b.id) || 0;
        return sortOrder === 'asc' ? createdA - createdB : createdB - createdA;
      } 
      else {
        // 추가순 (time)
        let timeA = 0;
        let timeB = 0;

        if (activeTab === 'Saved') {
          // 플레이리스트 안의 마지막 영화가 추가된 시간 기준 (영화가 없으면 생성 시간)
          const lastMovieA = a.movies && a.movies.length > 0 ? a.movies[a.movies.length - 1] : null;
          const lastMovieB = b.movies && b.movies.length > 0 ? b.movies[b.movies.length - 1] : null;
          
          timeA = lastMovieA && lastMovieA.addedAt ? new Date(lastMovieA.addedAt).getTime() : Number(a.id) || 0;
          timeB = lastMovieB && lastMovieB.addedAt ? new Date(lastMovieB.addedAt).getTime() : Number(b.id) || 0;
        } else {
          timeA = Number(a.id) || 0; 
          timeB = Number(b.id) || 0;
        }

        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
    });
  }, [activeTab, displayPinned, pinnedMovies, customPlaylists, sortType, sortOrder]);

  const handleScrollToLetter = (letter: string) => {
    const index = sortedData.findIndex((item: any) => {
      const title = item.title || item.name || "";
      const chosung = getChosung(title);
      if (/[A-Z]/.test(letter)) {
        return chosung >= letter; 
      }
      return chosung === letter;
    });

    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim(), isNewPlaylistPublic); 
    setActiveTab('Saved');
    setNewPlaylistName('');
    setIsNewPlaylistPublic(false);
    setModalVisible(false);
  };

  const handleDeletePlaylist = (id: string, name: string) => {
    Alert.alert("재생목록 삭제", `'${name}' 재생목록을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", onPress: () => deletePlaylist(id), style: "destructive" }
    ]);
  };

  // 💡 Pinned 아이템 렌더링 시 현재 Pin 상태를 확인하여 UI 변경
  const renderPinnedItem = ({ item }: { item: any }) => {
    const isCurrentlyPinned = pinnedMovies.some((m: any) => m.id === item.id);

    return (
      <Pressable 
        style={styles.movieCard}
        onPress={() => router.push({ pathname: '/detail/[id]', params: { id: item.id, movieData: JSON.stringify(item) } } as any)}
      >
        <Image source={{ uri: item.image }} style={[styles.movieImage, !isCurrentlyPinned && { opacity: 0.4 }]} />
        <View style={styles.movieInfo}>
          <Text style={[styles.movieTitle, !isCurrentlyPinned && { color: '#666' }]}>
            {item.title}
          </Text>
        </View>
        <Pressable style={styles.actionIcon} onPress={() => togglePin(item)}>
          <Ionicons name={isCurrentlyPinned ? "heart" : "heart-outline"} size={22} color={isCurrentlyPinned ? "#FF5A36" : "#aaa"} />
        </Pressable>
      </Pressable>
    );
  };

  const renderSavedItem = ({ item }: { item: any }) => (
    <Pressable 
      style={styles.playlistFolderCard} 
      onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: item.id.toString() } } as any)}
    >
      <View style={styles.folderIconContainer}>
        <Ionicons name="folder" size={32} color="#FF5A36" />
      </View>
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{item.name}</Text>
        <Text style={styles.movieTime}>영화 {item.movies.length}편</Text>
      </View>
      <View style={styles.playlistActions}>
        <Pressable style={styles.iconButton} onPress={() => togglePlaylistVisibility(item.id)}>
          <Ionicons name={item.isPublic ? "lock-open" : "lock-closed"} size={22} color={item.isPublic ? "#FF5A36" : "#aaa"} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => handleDeletePlaylist(item.id, item.name)}>
          <Ionicons name="trash-outline" size={22} color="#ff4444" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>보관함</Text>
      </View>

      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          {MAIN_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable key={tab} onPress={() => handleTabChange(tab)} style={[styles.tabButton, isActive && styles.activeTabButton]}>
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.filterContainer}>
        
        {activeTab === 'Saved' && (
          <Pressable 
            style={[styles.sortChip, sortType === 'created' && styles.sortChipActive]}
            onPress={() => {
              if (sortType === 'created') setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
              else { setSortType('created'); setSortOrder('desc'); } 
            }}
          >
            <Text style={[styles.sortChipText, sortType === 'created' && styles.sortChipTextActive]}>
              생성
            </Text>
            {sortType === 'created' && (
              <Ionicons name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} size={14} color="#FF5A36" style={{marginLeft: 4}} />
            )}
          </Pressable>
        )}

        <Pressable 
          style={[styles.sortChip, sortType === 'time' && styles.sortChipActive]}
          onPress={() => {
            if (sortType === 'time') setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
            else { setSortType('time'); setSortOrder('desc'); } 
          }}
        >
          <Text style={[styles.sortChipText, sortType === 'time' && styles.sortChipTextActive]}>
            {activeTab === 'Saved' ? '추가' : '최근'}
          </Text>
          {sortType === 'time' && (
            <Ionicons name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} size={14} color="#FF5A36" style={{marginLeft: 4}} />
          )}
        </Pressable>

        <Pressable 
          style={[styles.sortChip, sortType === 'name' && styles.sortChipActive]}
          onPress={() => {
            if (sortType === 'name') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            else { setSortType('name'); setSortOrder('asc'); } 
          }}
        >
          <Text style={[styles.sortChipText, sortType === 'name' && styles.sortChipTextActive]}>
            ㄱ-Z
          </Text>
          {sortType === 'name' && (
            <Ionicons name={sortOrder === 'asc' ? 'arrow-down' : 'arrow-up'} size={14} color="#FF5A36" style={{marginLeft: 4}} />
          )}
        </Pressable>
      </View>

      <View style={styles.listWrapper}>
        <FlatList
          ref={flatListRef}
          data={sortedData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={activeTab === 'Pinned' ? renderPinnedItem : renderSavedItem}
          contentContainerStyle={[styles.listContent, sortType === 'name' && { paddingRight: 40 }]} 
          showsVerticalScrollIndicator={sortType !== 'name'} 
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 100));
            wait.then(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }));
          }}
          ListHeaderComponent={
            activeTab === 'Saved' ? (
              <Pressable style={styles.addPlaylistCard} onPress={() => setModalVisible(true)}>
                <View style={styles.addPlaylistIconContainer}>
                  <Feather name="plus" size={24} color="#FF5A36" />
                </View>
                <Text style={styles.addPlaylistText}>새 재생목록 추가</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>데이터가 없습니다.</Text>
            </View>
          }
        />

        {sortType === 'name' && sortedData.length > 0 && (
          <View style={styles.indexBarContainer}>
            {INDEX_LETTERS.map((letter) => (
              <Pressable key={letter} onPress={() => handleScrollToLetter(letter)} style={styles.indexLetterBtn}>
                <Text style={styles.indexLetterText}>{letter}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 재생목록 추가</Text>
            <TextInput style={styles.textInput} placeholder="목록 이름" placeholderTextColor="#666" value={newPlaylistName} onChangeText={setNewPlaylistName} autoFocus />
            <View style={styles.privacySelector}>
              <Pressable style={[styles.privacyOption, !isNewPlaylistPublic && styles.privacyOptionActive]} onPress={() => setIsNewPlaylistPublic(false)}>
                <Ionicons name="lock-closed" size={20} color={!isNewPlaylistPublic ? "#FF5A36" : "#666"} />
                <Text style={[styles.privacyText, !isNewPlaylistPublic && styles.privacyTextActive]}>비공개</Text>
              </Pressable>
              <Pressable style={[styles.privacyOption, isNewPlaylistPublic && styles.privacyOptionActive]} onPress={() => setIsNewPlaylistPublic(true)}>
                <Ionicons name="lock-open" size={20} color={isNewPlaylistPublic ? "#FF5A36" : "#666"} />
                <Text style={[styles.privacyText, isNewPlaylistPublic && styles.privacyTextActive]}>공개</Text>
              </Pressable>
            </View>
            <View style={styles.modalButtonContainer}>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}><Text style={{color:'#fff', fontWeight: 'bold'}}>취소</Text></Pressable>
              <Pressable style={[styles.modalButton, styles.confirmButton]} onPress={handleCreatePlaylist}><Text style={{color:'#111', fontWeight: 'bold'}}>추가</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 }, 
  header: { marginBottom: 20, paddingHorizontal: 20 }, 
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  tabWrapper: { paddingHorizontal: 20, marginBottom: 15 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  activeTabButton: { backgroundColor: '#FF5A36' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#111', fontWeight: 'bold' },
  
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
  sortChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  sortChipActive: { backgroundColor: 'rgba(255, 90, 54, 0.1)', borderColor: '#FF5A36' },
  sortChipText: { color: '#aaa', fontSize: 13, fontWeight: 'bold' },
  sortChipTextActive: { color: '#FF5A36' },

  listWrapper: { flex: 1, flexDirection: 'row' },
  listContent: { paddingBottom: 100, paddingHorizontal: 20 },
  
  indexBarContainer: { position: 'absolute', right: 5, top: 10, bottom: 10, justifyContent: 'center', width: 24, zIndex: 10 },
  indexLetterBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  indexLetterText: { color: '#FF5A36', fontSize: 11, fontWeight: 'bold' },

  movieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#222', marginBottom: 15 },
  playlistFolderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#222', marginBottom: 15 },
  activeCard: { backgroundColor: '#222', borderColor: '#FF5A36', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 }, 
  movieImage: { width: 60, height: 85, borderRadius: 10 },
  movieInfo: { flex: 1, marginLeft: 15 },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  movieTime: { color: '#888', fontSize: 13 },
  actionIcon: { padding: 10 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 16 },
  
  folderIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255, 90, 54, 0.1)', justifyContent: 'center', alignItems: 'center' },
  playlistActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iconButton: { padding: 8 },

  addPlaylistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', marginBottom: 15 },
  addPlaylistIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255, 90, 54, 0.1)', justifyContent: 'center', alignItems: 'center' },
  addPlaylistText: { color: '#FF5A36', fontSize: 16, fontWeight: 'bold', marginLeft: 15 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  textInput: { backgroundColor: '#0a0a0a', color: '#fff', borderRadius: 8, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  
  privacySelector: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  privacyOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', backgroundColor: '#111', gap: 8 },
  privacyOptionActive: { borderColor: '#FF5A36', backgroundColor: 'rgba(255, 90, 54, 0.1)' },
  privacyText: { color: '#666', fontSize: 15, fontWeight: 'bold' },
  privacyTextActive: { color: '#FF5A36' },

  modalButtonContainer: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#333' },
  confirmButton: { backgroundColor: '#FF5A36' }
});