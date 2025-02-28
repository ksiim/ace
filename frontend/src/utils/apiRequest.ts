import { getToken, setAuthHeader } from './serviceToken';

export const apiRequest = async (endpoint: string, method = "GET", body?: object) => {
  try {
    const token = getToken();
    if (token) setAuthHeader(token); // Только если токен есть
    
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    
    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/${endpoint}`,
      options
    );
    
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error(`Ошибка запроса (${endpoint}):`, error);
    return null;
  }
};
