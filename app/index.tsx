import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function SplashScreen() {
  useEffect(() => {
    // 💡 2초 뒤에 '온보딩'이 아니라 '로그인 화면'으로 이동하도록 수정
    const timer = setTimeout(() => {
      // (auth) 그룹 폴더 안에 있으므로 /login으로 보내면 됩니다.
      router.replace('/signin'); 
  }, 2000);

  return () => clearTimeout(timer);
}, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 로고 아이콘 (별 모양) */}
        <View style={styles.iconContainer}>
          <FontAwesome name="star" size={40} color="#FF5A36" />
        </View>
        
        {/* Pinlm 로고 텍스트 */}
        <Text style={styles.logoText}>
          Pin<Text style={styles.logoHighlight}>lm</Text>
        </Text>
        
        {/* 슬로건 */}
        <Text style={styles.slogan}>취향을 Pin, 무드를 Film.</Text>
        
        {/* 추가 텍스트 */}
        <Text style={styles.subText}>오늘 뭐 볼지를 끝내는 앱</Text>
      </View>

      {/* 하단 버전 정보 */}
      <Text style={styles.footerText}>React Native (Expo) | v1.0.0 MVP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#221a1a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#332a2a',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: 1,
  },
  logoHighlight: {
    color: '#FF5A36',
  },
  slogan: {
    fontSize: 18,
    color: '#888888',
    marginBottom: 40,
  },
  subText: {
    fontSize: 14,
    color: '#555555',
  },
  footerText: {
    fontSize: 12,
    color: '#444444',
  }
});