import { getToken } from './serviceToken';

export const apiRequest = async (
  endpoint: string,
  method = "POST",
  body?: object,
  authRequired = false // Новый параметр для авторизации
) => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (authRequired) {
      const token = getToken();
      if (!token) throw new Error("Требуется авторизация");
      headers.Authorization = `Bearer ${token}`;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      options.body = JSON.stringify(body);
    }
    
    console.log(import.meta.env.VITE_API_URL);
    
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
