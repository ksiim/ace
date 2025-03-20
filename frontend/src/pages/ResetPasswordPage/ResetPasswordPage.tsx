import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../../utils/apiRequest';
import styles from './ResetPasswordPage.module.scss';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Новое состояние для подтверждения пароля
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  
  // Получаем токен из query-параметров и декодируем его
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token') ? decodeURIComponent(queryParams.get('token')!) : null;
  
  useEffect(() => {
    console.log('Токен:', token); // Проверяем значение токена
    const checkToken = async () => {
      if (!token) {
        setIsValidToken(false);
        return;
      }
      
      const response = await apiRequest(
        `login/check-reset-password-token/${token}`,
        "POST", undefined, false
      );
      
      console.log('Ответ от проверки токена:', response); // Логируем ответ
      if (!response || response.error || response === "false") {
        setIsValidToken(false);
      } else {
        setIsValidToken(true);
      }
    };
    
    checkToken();
  }, [token]);
  
  const handleResetPassword = async () => {
    console.log("Функция handleResetPassword вызвана"); // Проверка вызова функции
    
    // Проверка на совпадение паролей
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      console.log("Ошибка: пароли не совпадают");
      return;
    }
    
    if (!newPassword || newPassword.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      console.log("Ошибка: слишком короткий пароль");
      return;
    }
    
    if (!token) {
      setError('Ошибка: отсутствует токен сброса пароля');
      console.log("Ошибка: отсутствует токен!");
      return;
    }
    
    const payload = {
      token: token,
      new_password: newPassword,
    };
    
    console.log("Отправляемый payload:", payload); // Проверка перед отправкой запроса
    
    const response = await apiRequest("login/reset-password", "POST", payload, false);
    
    if (response.error) {
      setError('Ошибка при сбросе пароля');
      console.log("Ошибка при сбросе пароля:", response);
    } else {
      alert('Пароль успешно изменён');
      navigate('/login');
    }
  };
  
  if (isValidToken === null) {
    return <div className={styles.loading}>Проверка токена...</div>;
  }
  
  if (!isValidToken) {
    return <div className={styles.error}>Неверный или просроченный токен</div>;
  }
  
  return (
    <div className={styles.resetContainer}>
      <h2 className={styles.title}>Сброс пароля</h2>
      <input
        type="password"
        placeholder="Введите новый пароль"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className={styles.input}
      />
      <input
        type="password"
        placeholder="Повторите новый пароль"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className={styles.input}
      />
      {error && <div className={styles.error}>{error}</div>}
      <button onClick={handleResetPassword} className={styles.resetButton}>
        Сохранить новый пароль
      </button>
    </div>
  );
};

export default ResetPasswordPage;
