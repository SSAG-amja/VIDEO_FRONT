import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
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

      {/* 4. 프로필 탭 */}
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}