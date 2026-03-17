import axios from 'axios';

// 💡 .env에서 가져온 값에 무조건 http://를 붙여버리는 쿨한 방식
const baseURL = `http://${process.env.EXPO_PUBLIC_API_URL}`;

const client = axios.create({
  baseURL: baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;