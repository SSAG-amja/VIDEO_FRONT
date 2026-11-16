// 로컬 개발시 ip 주소를 자동으로 감지하여 API_BASE_URL을 설정하는 유틸리티 함수
// 실제 서버 연동시에는 .env 파일의 EXPO_PUBLIC_API_URL 값을 사용하도록 되어 있음
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      Constants.expoGoConfig?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:8010`;
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8010';
    }
  }

  return 'http://localhost:8010';
};

export const API_BASE_URL = getApiBaseUrl();
