import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router'; // ✅ Expo Router 전용 네비게이션

// ✅ 스크린샷 경로에 맞춘 정확한 import
import { signoutApi } from '../api/auth'; 

// --- Types ---
interface MenuButtonProps {
  title: string;
  iconName: string; 
  onPress: () => void;
  isDestructive?: boolean;
}

// --- Components ---
export default function Profile() {
  
  // 1. [실제 연동] 로그아웃 로직
  const handleLogout = () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃 하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "로그아웃", 
          style: "destructive",
          onPress: async () => {
            try {
              // auth.ts에 정의한 로그아웃 API 호출
              await signoutApi();

              // TODO: 토큰 삭제 로직 (필요 시)
              
              // ✅ Expo Router 방식: 로그인 화면으로 완전 이동 (뒤로 가기 불가)
              // (auth) 폴더 안의 signin 페이지로 간다고 가정
              router.replace('/(auth)/signin'); 
            } catch (error) {
              console.error('Logout Error:', error);
              Alert.alert("에러", "로그아웃 처리에 실패했습니다. 네트워크를 확인해주세요.");
            }
          }
        }
      ]
    );
  };

  // 2. [프로토타입] 화면 이동 라우팅
  const handleNavigation = (path: any) => {
    // ✅ Expo Router 방식의 페이지 이동
    router.push(path);
  };

  // 공통 메뉴 버튼 컴포넌트
  const MenuButton: React.FC<MenuButtonProps> = ({ title, iconName, onPress, isDestructive = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuContent}>
        {/* 나중에 아이콘 추가 시 사용 */}
        {/* <Icon name={iconName} size={20} color={isDestructive ? '#FF453A' : '#E5E5EA'} style={styles.menuIcon} /> */}
        <Text style={[styles.menuText, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 (프로필 요약) */}
      <View style={styles.headerContainer}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <Text style={styles.userName}>김호영 님</Text>
        <Text style={styles.userEmail}>kimhoddi@kangwon.ac.kr</Text>
      </View>

      {/* 설정 메뉴 리스트 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>계정 설정</Text>
        <View style={styles.card}>
          {/* 하위 페이지 생성 후 라우팅 경로를 알맞게 수정하세요 */}
          <MenuButton 
            title="개인정보 수정" 
            iconName="user" 
            onPress={() => handleNavigation('/edit-profile')} 
          />
          <MenuButton 
            title="비밀번호 변경" 
            iconName="lock" 
            onPress={() => handleNavigation('/change-password')} 
          />
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>서비스 설정</Text>
        <View style={styles.card}>
          <MenuButton 
            title="온보딩 정보 (취향) 수정" 
            iconName="sliders" 
            onPress={() => handleNavigation('/onboarding')} 
          />
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.card}>
          <MenuButton 
            title="로그아웃" 
            iconName="log-out" 
            onPress={handleLogout} 
            isDestructive={true} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#1C1C1E', 
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#E5E5EA',
  },
  destructiveText: {
    color: '#FF453A', 
    fontWeight: '500',
  },
});