import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, Platform } from 'react-native';

export default function TabLayout() {
  const pathname = usePathname();
  
  // 현재 경로가 홈 화면('/', '/index')인지 확인
  const isHome = pathname === '/' || pathname === '/index';

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false, // 상단 기본 헤더 숨기기
          tabBarStyle: {
            backgroundColor: '#0a0a0a', // 다크 테마 배경
            borderTopWidth: 1,
            borderTopColor: '#1a1a1a', // 탭바 위쪽의 아주 얇은 구분선
            height: 60, // 탭바 높이 넉넉하게
            paddingBottom: 8, // 아이콘과 하단 여백
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FF5A36', // 선택된 탭의 주황색 포인트
          tabBarInactiveTintColor: '#666666', // 선택되지 않은 탭의 회색
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        {/* 1. 홈 피드 탭 */}
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        
        {/* 2. 탐색 탭 */}
        <Tabs.Screen
          name="explore"
          options={{
            title: '탐색',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
            ),
          }}
        />
        
        {/* 3. 보관함 탭 */}
        <Tabs.Screen
          name="library"
          options={{
            title: '보관함',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'folder' : 'folder-outline'} size={24} color={color} />
            ),
          }}
        />

        {/* 4. 커뮤니티 탭 (기존 프로필에서 변경) */}
        <Tabs.Screen
          name="community"
          options={{
            title: '커뮤니티',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* 홈 화면이 아닐 때만 렌더링되는 우측 상단 프로필 아이콘 */}
      {!isHome && (
        <Pressable 
          style={({ pressed }) => [
            styles.profileIcon,
            pressed && { opacity: 0.7 }
          ]} 
          onPress={() => router.push('/profile')} // 프로필 화면으로 이동
        >
          <Ionicons name="person-circle" size={36} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  profileIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50, // 상단 노치 및 상태바 높이에 맞게 조절
    right: 20,
    zIndex: 100, // 다른 UI 요소들보다 위에 나타나도록 설정
  }
});