import { Platform } from 'react-native';
//260122 임재준
// 1. .env 파일에서 주소를 가져옵니다.
// (팀원들은 자기 컴퓨터의 .env 파일만 수정하면 됩니다)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// 2. BASE_URL 결정 로직
// - .env에 주소가 있으면(1순위) 그걸 씁니다. (실물 기기 테스트용)
// - 없으면(2순위) 에뮬레이터나 웹용 기본 주소를 씁니다.
export const BASE_URL = ENV_API_URL || Platform.select({
  android: 'http://10.0.2.2:8000', // 안드로이드 에뮬레이터
  ios: 'http://127.0.0.1:8000',    // iOS 시뮬레이터
  default: 'http://localhost:8000', // 웹(Web)
});

console.log("🔧 [설정된 서버 주소]:", BASE_URL);