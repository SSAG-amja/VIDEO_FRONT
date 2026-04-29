import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Switch } from 'react-native';
import { router } from 'expo-router'; 
import { signoutApi } from '../api/auth'; 

// --- Types ---
interface MenuButtonProps {
  title: string;
  iconName?: string; 
  onPress: () => void;
  isDestructive?: boolean;
}

interface MenuSwitchProps {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

// --- Components ---
export default function Profile() {
  // 추천 설정 토글 상태 (true: 구독중인 것만, false: 모든 영화)
  const [isSubscribedOnly, setIsSubscribedOnly] = useState(true);

  // 1. 로그아웃 로직
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
              await signoutApi();
              // TODO: 토큰 삭제 로직
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

  // 2. 회원탈퇴 로직 (틀)
  const handleDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "탈퇴하기", 
          style: "destructive",
          onPress: () => {
            // TODO: 회원탈퇴 API 호출 로직 추가
            console.log("회원탈퇴 진행");
          }
        }
      ]
    );
  };

  // 화면 이동 라우팅
  const handleNavigation = (path: any) => {
    router.push(path);
  };

  // 공통 메뉴 버튼 컴포넌트
  const MenuButton: React.FC<MenuButtonProps> = ({ title, onPress, isDestructive = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuContent}>
        <Text style={[styles.menuText, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 토글 전용 메뉴 컴포넌트
  const MenuSwitch: React.FC<MenuSwitchProps> = ({ title, value, onValueChange }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuContent}>
        <Text style={styles.menuText}>{title}</Text>
      </View>
      <Switch
        trackColor={{ false: '#3A3A3C', true: '#6366F1' }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor="#3A3A3C"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
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

      {/* 1. 계정 설정 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>계정 설정</Text>
        <View style={styles.card}>
          <MenuButton 
            title="개인정보 수정" 
            onPress={() => handleNavigation('/editprofile')} 
          />
        </View>
      </View>

      {/* 2. 서비스 설정 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>서비스 설정</Text>
        <View style={styles.card}>
          <MenuSwitch
            title="구독 중인 OTT만 추천받기"
            value={isSubscribedOnly}
            onValueChange={setIsSubscribedOnly}
          />
          <MenuButton 
            title="구독 중인 OTT 목록 수정" 
            onPress={() => handleNavigation('/editott')} 
          />
          <MenuButton 
            title="취향 분석 다시하기" 
            onPress={() => handleNavigation('/onboarding')} 
          />
          {/* 💡 새롭게 추가된 숨긴 영화 보기 버튼 */}
          <MenuButton 
            title="숨긴 영화 보기" 
            onPress={() => handleNavigation('/passedmovies')} 
          />
        </View>
      </View>

      {/* 3. 위험 구간 (로그아웃 / 탈퇴) */}
      <View style={styles.sectionContainer}>
        <View style={styles.card}>
          <MenuButton 
            title="로그아웃" 
            onPress={handleLogout} 
          />
          <MenuButton 
            title="회원 탈퇴" 
            onPress={handleDeleteAccount} 
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