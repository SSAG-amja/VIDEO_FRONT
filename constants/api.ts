// 로컬 개발시 ip 주소를 자동으로 감지하여 API_BASE_URL을 설정하는 유틸리티 함수
// 실제 서버 연동시에는 .env 파일의 EXPO_PUBLIC_API_URL 값을 사용하도록 되어 있음
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (__DEV__) {
    // 로컬 개발 환경 (Expo Go)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:8000`; // 백엔드 포트번호 8000
    }
  }
  // 실제 배포 환경 (AWS)
  return process.env.EXPO_PUBLIC_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();