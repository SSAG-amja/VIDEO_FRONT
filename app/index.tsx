import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function SplashScreen() {
  useEffect(() => {
    // 2초(2000ms) 뒤에 홈 화면으로 자동 이동
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);

    // 컴포넌트가 사라질 때 타이머를 정리해 줍니다.
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
    backgroundColor: '#0a0a0a', // 다크 테마 배경
    justifyContent: 'space-between', // 상단 콘텐츠와 하단 푸터를 양 끝으로 배치
    alignItems: 'center',
    paddingVertical: 60, // 상하 여백 추가
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // 남은 공간을 모두 차지하여 중앙 정렬
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#221a1a', // 아이콘 배경색 (살짝 붉은기 도는 어두운 색)
    borderRadius: 20, // 둥근 모서리
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#332a2a', // 테두리 포인트
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: 1, // 글자 간격 조절
  },
  logoHighlight: {
    color: '#FF5A36', // 주황색 포인트 컬러
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