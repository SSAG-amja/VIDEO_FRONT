import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  fetchSearchData,
  fetchRecommendData,
  SEARCH_PAGE_SIZE,
  SearchType,
} from '../../api/explore';
import KeyboardAccessory, {
  KEYBOARD_ACCESSORY_ID,
} from '../../components/KeyboardAccessory';

const MOOD_TAGS = [
  '#대한민국 인기작',
  '#전세계 인기작',
  '#평점 높은 명작',
  '#도파민 폭발 액션',
  '#가볍게 웃기 좋은',
  '#설렘 가득 로맨스',
  '#손에 땀을 쥐는 스릴러',
  '#등골 오싹한 공포',
  '#상상력 자극 SF·판타지',
  '#감성 충전 드라마',
  '#동심 자극 애니메이션',
  '#여운이 남는 음악·예술',
];

const SEARCH_FILTER_OPTIONS: {
  key: SearchType;
  label: string;
  placeholder: string;
}[] = [
  { key: 'all', label: '통합검색', placeholder: '영화 제목, 배우, 감독 검색...' },
  { key: 'title', label: '영화', placeholder: '영화 제목 검색...' },
  { key: 'director', label: '감독', placeholder: '감독 이름 검색...' },
  { key: 'actor', label: '배우', placeholder: '배우 이름 검색...' },
];

const splitIntoColumns = <T,>(items: T[], columnCount: number): T[][] => {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });
  return columns;
};

export default function ExploreScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const numColumns = windowWidth >= 900 ? 4 : windowWidth >= 600 ? 3 : 2;
  const [activeTag, setActiveTag] = useState(MOOD_TAGS[0]);

  // 🔍 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('title');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [isLoadingMoreSearch, setIsLoadingMoreSearch] = useState(false);
  const searchRequestIdRef = useRef(0);

  // 🔽 정렬 상태
  const [sortOrder, setSortOrder] = useState<'latest' | 'likes' | 'rating'>(
    'latest'
  );

  // 🏷️ 태그 기반 추천 관련 상태
  const [defaultMovies, setDefaultMovies] = useState<any[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // 🔍 입력이 멈춘 뒤 300ms 후 실제 검색어 갱신
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const mergeSearchResults = (prev: any[], next: any[]) => {
    const existingIds = new Set(prev.map((movie) => movie.id));
    return [...prev, ...next.filter((movie) => !existingIds.has(movie.id))];
  };

  // 🏷️ 무드 태그 추천 검색
  useEffect(() => {
    const loadRecommendMovies = async () => {
      setIsLoadingTags(true);

      try {
        const results = await fetchRecommendData(activeTag);
        setDefaultMovies(results);
      } finally {
        setIsLoadingTags(false);
      }
    };

    if (debouncedSearchQuery === '') {
      loadRecommendMovies();
    }
  }, [activeTag, debouncedSearchQuery]);

  const loadSearchResults = async (
    targetPage: number,
    append: boolean = false
  ) => {
    const requestId = append
      ? searchRequestIdRef.current
      : searchRequestIdRef.current + 1;

    if (!append) {
      searchRequestIdRef.current = requestId;
    }

    if (append) {
      if (
        isLoadingMoreSearch ||
        isSearching ||
        !searchHasMore ||
        debouncedSearchQuery === ''
      ) {
        return;
      }

      setIsLoadingMoreSearch(true);
    } else {
      setIsSearching(true);
    }

    try {
      const results = await fetchSearchData(
        debouncedSearchQuery,
        sortOrder,
        targetPage,
        SEARCH_PAGE_SIZE,
        { searchType }
      );

      if (requestId !== searchRequestIdRef.current) return;

      setSearchHasMore(results.length === SEARCH_PAGE_SIZE);
      setSearchPage(targetPage);
      setSearchResults((prev) =>
        append ? mergeSearchResults(prev, results) : results
      );
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsSearching(false);
      }

      setIsLoadingMoreSearch(false);
    }
  };

  const handleSearchScroll = ({ nativeEvent }: any) => {
    const paddingToBottom = 120;
    const isBottom =
      nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
      nativeEvent.contentSize.height - paddingToBottom;

    if (isBottom) {
      loadSearchResults(searchPage + 1, true);
    }
  };

  // 🔍 디바운스된 검색어가 바뀔 때만 API 호출
  useEffect(() => {
    if (debouncedSearchQuery === '') {
      searchRequestIdRef.current += 1;
      setSearchResults([]);
      setSearchPage(1);
      setSearchHasMore(false);
      setIsSearching(false);
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    const loadDebouncedSearchResults = async () => {
      setIsSearching(true);

      try {
        const results = await fetchSearchData(
          debouncedSearchQuery,
          sortOrder,
          1,
          SEARCH_PAGE_SIZE,
          { searchType }
        );

        if (requestId !== searchRequestIdRef.current) return;

        setSearchHasMore(results.length === SEARCH_PAGE_SIZE);
        setSearchPage(1);
        setSearchResults(results);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    };

    loadDebouncedSearchResults();
  }, [debouncedSearchQuery, sortOrder, searchType]);

  const defaultColumns = splitIntoColumns(defaultMovies, numColumns);
  const searchColumns = splitIntoColumns(searchResults, numColumns);

  const MovieCard = ({ item }: { item: any }) => (
    <Pressable
      style={styles.cardContainer}
      onPress={() => {
        const safeMovieData = {
          id: item.id,
          title: item.title,
          posterPath:
            item.image?.replace('https://image.tmdb.org/t/p/w500', '') || '',
          rating: item.rating,
          overview: '상세 정보를 불러오는 중입니다...',
          info: '탐색을 통해 진입했습니다.',
          tags: [],
          cast: [],
        };

        router.push({
          pathname: '/detail/[id]',
          params: {
            id: item.id,
            movieData: JSON.stringify(safeMovieData),
          },
        });
      }}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.cardImage}
        resizeMode="cover"
      >
        {item.badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        >
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardRating}>★ {item.rating}</Text>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );

  const activeFilterOption =
    SEARCH_FILTER_OPTIONS.find((opt) => opt.key === searchType) ??
    SEARCH_FILTER_OPTIONS[0];

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>탐색</Text>

      <View style={styles.searchSectionWrapper}>
        <View style={styles.searchContainer}>
          <Pressable
            style={styles.filterTrigger}
            onPress={() => setIsFilterDrawerOpen((prev) => !prev)}
          >
            <Text style={styles.filterTriggerText}>{activeFilterOption.label}</Text>
            <Ionicons
              name={isFilterDrawerOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#FF5A36"
            />
          </Pressable>

          <View style={styles.searchDivider} />

          <Ionicons
            name="search"
            size={18}
            color="#666"
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder={activeFilterOption.placeholder}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (isFilterDrawerOpen) setIsFilterDrawerOpen(false);
            }}
            onFocus={() => setIsFilterDrawerOpen(false)}
            returnKeyType="done"
            onSubmitEditing={() => {
              setIsFilterDrawerOpen(false);
              Keyboard.dismiss();
            }}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />

          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setIsFilterDrawerOpen(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </Pressable>
          )}
        </View>

        {isFilterDrawerOpen && (
          <View style={styles.filterDrawer}>
            {SEARCH_FILTER_OPTIONS.map((option) => {
              const isSelected = option.key === searchType;
              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.filterDrawerItem,
                    isSelected && styles.filterDrawerItemActive,
                  ]}
                  onPress={() => {
                    setSearchType(option.key);
                    setIsFilterDrawerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterDrawerText,
                      isSelected && styles.filterDrawerTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FF5A36" />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <KeyboardAccessory />

      {debouncedSearchQuery !== '' || searchQuery.trim() !== '' ? (
        <View style={{ flex: 1 }}>
          {/* 🔽 정렬 토글 버튼 UI */}
          <View style={styles.sortToggleContainer}>
            <Pressable
              style={[
                styles.sortButton,
                sortOrder === 'latest' && styles.sortButtonActive,
              ]}
              onPress={() => setSortOrder('latest')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOrder === 'latest' && styles.sortButtonTextActive,
                ]}
              >
                최신순
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.sortButton,
                sortOrder === 'likes' && styles.sortButtonActive,
              ]}
              onPress={() => setSortOrder('likes')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOrder === 'likes' && styles.sortButtonTextActive,
                ]}
              >
                좋아요순
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.sortButton,
                sortOrder === 'rating' && styles.sortButtonActive,
              ]}
              onPress={() => setSortOrder('rating')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOrder === 'rating' && styles.sortButtonTextActive,
                ]}
              >
                평점순
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridScroll}
            onScroll={handleSearchScroll}
            scrollEventThrottle={400}
            keyboardShouldPersistTaps="handled"
          >
            {isSearching ? (
              <ActivityIndicator
                size="large"
                color="#FF5A36"
                style={{ marginTop: 50 }}
              />
            ) : searchResults.length > 0 ? (
              <>
                <View style={styles.masonryContainer}>
                  {searchColumns.map((columnItems, colIndex) => (
                    <View key={`search-col-${colIndex}`} style={styles.column}>
                      {columnItems.map((m) => (
                        <MovieCard key={m.id} item={m} />
                      ))}
                    </View>
                  ))}
                </View>

                {isLoadingMoreSearch && (
                  <ActivityIndicator
                    size="small"
                    color="#FF5A36"
                    style={{ marginVertical: 20 }}
                  />
                )}
              </>
            ) : (
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <Text style={[styles.noResultText, { marginTop: 0 }]}>검색 결과가 없습니다.</Text>
                {searchType === 'title' && (
                  <Text style={{ color: '#777', fontSize: 13, marginTop: 8 }}>
                    감독·배우 검색은 왼쪽 필터에서 선택할 수 있습니다.
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        <>
          <View style={styles.tagWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              decelerationRate="fast"
              contentContainerStyle={styles.tagScroll}
            >
              {MOOD_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setActiveTag(tag)}
                  style={[styles.tag, activeTag === tag && styles.activeTag]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      activeTag === tag && styles.activeTagText,
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridScroll}
            keyboardShouldPersistTaps="handled"
          >
            {isLoadingTags ? (
              <ActivityIndicator
                size="large"
                color="#FF5A36"
                style={{ marginTop: 50 }}
              />
            ) : (
              <View style={styles.masonryContainer}>
                {defaultColumns.map((columnItems, colIndex) => (
                  <View key={`default-col-${colIndex}`} style={styles.column}>
                    {columnItems.map((m) => (
                      <MovieCard key={m.id} item={m} />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  searchSectionWrapper: {
    position: 'relative',
    zIndex: 20,
    marginBottom: 20,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
  },

  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },

  filterTriggerText: {
    color: '#FF5A36',
    fontSize: 13,
    fontWeight: 'bold',
  },

  searchDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#333',
    marginRight: 10,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },

  filterDrawer: {
    position: 'absolute',
    top: 56,
    left: 20,
    width: 140,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 6,
    zIndex: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  filterDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  filterDrawerItemActive: {
    backgroundColor: 'rgba(255, 90, 54, 0.1)',
  },

  filterDrawerText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },

  filterDrawerTextActive: {
    color: '#FF5A36',
    fontWeight: 'bold',
  },

  // 정렬 버튼 스타일
  sortToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },

  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },

  sortButtonActive: {
    borderColor: '#FF5A36',
    backgroundColor: 'rgba(255, 90, 54, 0.1)',
  },

  sortButtonText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },

  sortButtonTextActive: {
    color: '#FF5A36',
    fontWeight: 'bold',
  },

  tagWrapper: {
    height: 40,
    marginBottom: 20,
  },

  tagScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },

  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
  },

  activeTag: {
    backgroundColor: '#FF5A36',
    borderColor: '#FF5A36',
  },

  tagText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },

  activeTagText: {
    color: '#111',
    fontWeight: 'bold',
  },

  gridScroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  masonryContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  column: {
    flex: 1,
    gap: 12,
  },

  cardContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
  },

  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },

  cardGradient: {
    padding: 12,
    paddingTop: 30,
  },

  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  cardRating: {
    color: '#aaa',
    fontSize: 12,
  },

  noResultText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },

  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 90, 54, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});