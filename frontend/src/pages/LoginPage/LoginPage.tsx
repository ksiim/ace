import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveToken, setAuthHeader } from '../../utils/serviceToken.ts';
import { apiRequest } from '../../utils/apiRequest.ts'; // Импортируем apiRequest
import styles from './LoginPage.module.scss';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({
    email: false,
    password: false,
    login: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Сбрасываем ошибку входа при изменении данных формы
    if (errors.login) {
      setErrors(prev => ({ ...prev, login: '' }));
    }
    
    // Валидация email
    if (name === 'email') {
      setErrors(prev => ({
        ...prev,
        email: value !== '' && !validateEmail(value)
      }));
    }
    
    // Валидация пароля (минимум 8 символов)
    if (name === 'password') {
      setErrors(prev => ({
        ...prev,
        password: value !== '' && value.length < 8
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.email === '' || formData.password === '' || errors.email || errors.password) {
      setErrors(prev => ({
        ...prev,
        email: formData.email === '' || !validateEmail(formData.email),
        password: formData.password === '' || formData.password.length < 8,
      }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest('login/access-token', 'POST', {
        username: formData.email,
        password: formData.password
      }, true); // Передаем `authRequired: true`, если требуется авторизация
      
      if (response && response.access_token) {
        const token = response.access_token;
        saveToken(token);
        setAuthHeader(token);
        navigate('/');
      } else {
        setErrors(prev => ({ ...prev, login: 'Не удалось получить токен авторизации' }));
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrors(prev => ({ ...prev, login: error.message || 'Ошибка подключения к серверу' }));
      } else {
        setErrors(prev => ({ ...prev, login: 'Ошибка подключения к серверу' }));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
        <h1 className={styles.title}>Вход в аккаунт</h1>
        
        {errors.login && (
          <div className={styles.errorAlert}>
            {errors.login}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="example@mail.ru"
                disabled={isLoading}
              />
            </label>
            {errors.email && <div className={styles.errorMessage}>Введите корректный email</div>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Пароль
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="Введите пароль"
                disabled={isLoading}
              />
            </label>
            {errors.password && <div className={styles.errorMessage}>Пароль должен содержать минимум 8 символов</div>}
          </div>
          
          <div className={styles.forgotPassword}>
            <Link to="/forgot-password">Забыли пароль?</Link>
          </div>
          
          <button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading || errors.email || errors.password}
          >
            {isLoading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        
        <div className={styles.registerLink}>
          <p>Еще нет аккаунта? <Link className={styles.toregister} to="/registration">Зарегистрироваться</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
