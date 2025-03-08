import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveToken, setAuthHeader } from '../../utils/serviceToken.ts';
import axios from 'axios';
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
        password: value !== '' && value.length < 1
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
    
    const data = new URLSearchParams();
    data.append('grant_type', 'password');
    data.append('username', formData.email);
    data.append('password', formData.password);
    data.append('scope', '');
    data.append('client_id', '');  // Если не требуется, можно удалить
    data.append('client_secret', '');  // Если не требуется, можно удалить
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/login/access-token`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });
      
      const token = response.data.access_token;
      if (token) {
        saveToken(token);
        setAuthHeader(token);
        navigate('/');
      } else {
        setErrors(prev => ({ ...prev, login: 'Не удалось получить токен авторизации' }));
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.log(error.response.data); // Логирование ответа сервера
        if (error.response.status === 400) {
          setErrors(prev => ({ ...prev, login: 'Неверные учетные данные' }));
        } else {
          setErrors(prev => ({ ...prev, login: `Ошибка` }));
        }
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
        <div className={styles.registerLink}>
          <p>Еще нет аккаунта? <Link className={styles.toregister}
                                     to="/registration">Зарегистрироваться</Link>
          </p>
        </div>
        
        {errors.login && (
          <div className={styles.errorAlert}>
            {errors.login}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <div className={styles.labelWrapper}>
              <label className={styles.label}>
                Email
              </label>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="example@mail.ru"
              disabled={isLoading}
            />
            {errors.email &&
							<div className={styles.errorMessage}>Введите корректный
								email</div>}
          </div>
          
          <div className={styles.formGroup}>
            <div className={styles.labelWrapper}>
              <label className={styles.label}>
                Пароль
              </label>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="Введите пароль"
              disabled={isLoading}
            />
            {errors.password &&
							<div className={styles.errorMessage}>Пароль должен содержать
								минимум 8 символов</div>}
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
      </div>
    </div>
  );
};

export default LoginPage;
