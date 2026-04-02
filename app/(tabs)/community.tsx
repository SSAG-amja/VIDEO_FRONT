import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CommunityScreen() {
  return (
    <View style={styles.container}>
      {/* 상단 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      {/* 메인 콘텐츠 영역 (현재는 빈 화면 안내 텍스트) */}
      <View style={styles.content}>
        <Text style={styles.emptyText}>커뮤니티 화면입니다.</Text>
        <Text style={styles.subText}>다른 사용자와 의견을 나누는 공간이 될 예정입니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0a', // 앱 전체 공통 다크 배경색
    paddingTop: 60, 
    paddingHorizontal: 20 
  },
  header: { 
    marginBottom: 25 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  subText: { 
    color: '#888', 
    fontSize: 14 
  }
});