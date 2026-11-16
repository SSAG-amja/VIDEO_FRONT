import { useEffect } from 'react';
import { View } from 'react-native';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppAlertModal from '../components/AppAlertModal';

const APP_DARK_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0a0a',
    card: '#0a0a0a',
  },
};

function RootLayoutNav() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync('#0a0a0a');
  }, []);

  return (
    <ThemeProvider value={APP_DARK_THEME}>
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', paddingBottom: insets.bottom }}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'fade',
            animationDuration: 100,
            // 🔥 핵심: 화면 전환 도중 바닥에 깔린 뷰가 노출될 때 번쩍이는 흰색/회색을 검은색으로 고정
            contentStyle: { backgroundColor: '#0a0a0a' } 
          }}
        >
      <Stack.Screen name="index" />
      
      {/* 1. 인증 관련 화면 (회원가입/로그인) */}
      <Stack.Screen name="(auth)/signin" />
      <Stack.Screen name="(auth)/signup" />

      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      
      {/* 💡 핵심: transparentModal로 변경해야 드래그 시 뒷배경(메인 피드)이 보입니다! */}
      <Stack.Screen 
        name="detail/[id]" 
        options={{ 
          presentation: 'transparentModal', 
          animation: 'slide_from_bottom', 
          gestureEnabled: false, // 커스텀 제스처를 사용하기 위해 기본 제스처는 끕니다
          // 전역 contentStyle 덮어쓰기 (모달의 투명한 뒷배경 보장)
          contentStyle: { backgroundColor: 'transparent' } 
        }} 
      />
      
      <Stack.Screen 
        name="match" 
        options={{ 
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'transparent' }
        }} 
      />
        </Stack>
        <AppAlertModal />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootLayoutNav />
    </SafeAreaProvider>
  );
}