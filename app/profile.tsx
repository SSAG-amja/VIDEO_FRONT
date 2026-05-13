import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Switch, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { signoutApi, verifyPasswordApi } from '../api/auth';
import { getUserProfileApi } from '../api/user';
import * as SecureStore from 'expo-secure-store';

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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState({
    nickname: '',
    email: '',
  });
  const [verifyTarget, setVerifyTarget] = useState<'profile' | 'password' | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const avatarText = (profile.nickname || profile.email || 'U').charAt(0).toUpperCase();
  const userNameText = `${profile.nickname || '사용자'} 님`;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
        try {
          setIsLoadingProfile(true);
          const data = await getUserProfileApi();
          if (isActive) {
            setProfile({
              nickname: data.nickname || '',
              email: data.email || '',
            });
          }
        } catch (error) {
          console.error('Profile Load Error:', error);
          if (isActive) {
            Alert.alert('에러', '사용자 정보를 불러오지 못했습니다.');
          }
        } finally {
          if (isActive) {
            setIsLoadingProfile(false);
          }
        }
      };

      fetchProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

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
              await SecureStore.deleteItemAsync('userToken');
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

  // 2026.05.13 박현식
  // 개인정보/비밀번호 수정 대상에 맞춰 현재 비밀번호 확인 모달을 연다.
  const openPasswordVerify = (target: 'profile' | 'password') => {
    setCurrentPassword('');
    setVerifyTarget(target);
  };

  // 2026.05.13 박현식
  // 민감한 계정 수정 화면 진입 전에 현재 비밀번호를 검증하고 대상 화면으로 이동한다.
  const handleVerifyPassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('알림', '현재 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsVerifyingPassword(true);
      await verifyPasswordApi(currentPassword);
      const target = verifyTarget;
      setVerifyTarget(null);
      setCurrentPassword('');

      if (target === 'profile') {
        router.push('/editprofile' as any);
      }
      if (target === 'password') {
        router.push('/editpassword' as any);
      }
    } catch (error) {
      console.error('Verify Password Error:', error);
      Alert.alert('인증 실패', '현재 비밀번호가 일치하지 않습니다.');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // 공통 메뉴 버튼 컴포넌트
  const MenuButton: React.FC<MenuButtonProps> = ({ title, onPress, isDestructive = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuContent}>
        <Text style={[styles.menuText, isDestructive ? styles.destructiveText : null]}>{title}</Text>
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
        {isLoadingProfile ? (
          <ActivityIndicator size="large" color="#FF5A36" />
        ) : (
          <>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>{avatarText}</Text>
            </View>
            <Text style={styles.userName}>{userNameText}</Text>
            <Text style={styles.userEmail}>{profile.email}</Text>
          </>
        )}
      </View>

      {/* 1. 계정 설정 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>계정 설정</Text>
        <View style={styles.card}>
          <MenuButton
            title="개인정보 수정"
            onPress={() => openPasswordVerify('profile')}
          />
          <MenuButton
            title="비밀번호 수정"
            onPress={() => openPasswordVerify('password')}
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

      <Modal
        visible={verifyTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setVerifyTarget(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.verifyOverlay}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setVerifyTarget(null)} />
          <View style={styles.verifyBox}>
            <Text style={styles.verifyTitle}>현재 비밀번호 확인</Text>
            <Text style={styles.verifyDescription}>계정 정보를 수정하려면 현재 비밀번호를 입력해주세요.</Text>
            <TextInput
              style={styles.verifyInput}
              placeholder="현재 비밀번호"
              placeholderTextColor="#666"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoFocus
            />
            <View style={styles.verifyActions}>
              <TouchableOpacity
                style={[styles.verifyButton, styles.verifyCancelButton]}
                onPress={() => setVerifyTarget(null)}
                disabled={isVerifyingPassword}
              >
                <Text style={styles.verifyCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verifyButton, styles.verifyConfirmButton]}
                onPress={handleVerifyPassword}
                disabled={isVerifyingPassword}
              >
                {isVerifyingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyConfirmText}>확인</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  verifyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  verifyBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  verifyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  verifyDescription: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  verifyInput: {
    backgroundColor: '#121212',
    color: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  verifyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  verifyButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyCancelButton: {
    backgroundColor: '#2C2C2E',
  },
  verifyConfirmButton: {
    backgroundColor: '#FF5A36',
  },
  verifyCancelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  verifyConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
