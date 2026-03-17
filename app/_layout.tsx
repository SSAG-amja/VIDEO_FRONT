import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* 1. 인증 관련 화면 (회원가입/로그인) */}
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/signin" />

      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      
      {/* 💡 핵심: transparentModal로 변경해야 드래그 시 뒷배경(메인 피드)이 보입니다! */}
      <Stack.Screen 
        name="detail/[id]" 
        options={{ 
          presentation: 'transparentModal', 
          animation: 'slide_from_bottom', 
          gestureEnabled: false, // 커스텀 제스처를 사용하기 위해 기본 제스처는 끕니다
        }} 
      />
      
      <Stack.Screen name="match" options={{ presentation: 'transparentModal' }} />
    </Stack>
  );
}