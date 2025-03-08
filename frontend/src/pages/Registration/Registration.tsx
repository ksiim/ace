import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Registration.module.scss';
import OTPInput, { OTPInputRef } from '../../components/OTPInput/OTPInput.tsx';
import { apiRequest } from '../../utils/apiRequest.ts';
import { saveToken, setAuthHeader } from '../../utils/serviceToken.ts';
import axios from 'axios';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const otpRef = useRef<OTPInputRef>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    telegramId: '',
    birthDate: '',
    password: '',
    verificationCode: ''
  });
  
  const [step, setStep] = useState(1);
  const [requestId, setRequestId] = useState('');
  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    verificationCode: false,
    telegramId: false // Добавлена ошибка для telegramId
  });
  
  useEffect(() => {
    validateField('email', formData.email);
  }, [formData.email]);
  
  useEffect(() => {
    validateField('phone', formData.phone);
  }, [formData.phone]);
  
  useEffect(() => {
    validateField('password', formData.password);
  }, [formData.password]);
  
  useEffect(() => {
    validateField('telegramId', formData.telegramId); // Добавлена проверка для telegramId
  }, [formData.telegramId]);
  
  const validateField = (fieldName: string, value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,}$/;
    const passwordRegex = /^.{8,}$/; // At least 8 characters
    const telegramIdValid = value.length === 9; // Проверка на длину Telegram ID
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldName === 'email'
        ? value !== '' && !emailRegex.test(value)
        : fieldName === 'phone'
          ? value !== '' && !phoneRegex.test(value.replace(/\D/g, ''))
          : fieldName === 'password'
            ? value !== '' && !passwordRegex.test(value)
            : fieldName === 'telegramId'
              ? value !== '' && !telegramIdValid // Для telegramId проверяется длина
              : false
    }));
  };
  
  const validateFullName = () => {
    const words = formData.fullName.trim().split(/\s+/);
    const hasError = words.length !== 3;
    setErrors(prev => ({ ...prev, fullName: hasError }));
    return !hasError;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Убираем все символы, кроме цифр, и добавляем +7, если его нет в начале
      let cleanedValue = value.replace(/\D/g, ''); // Убираем все нецифровые символы
      
      if (cleanedValue.length > 0 && !cleanedValue.startsWith('7')) {
        cleanedValue = '7' + cleanedValue; // Добавляем 7 в начале, если его нет
      }
      
      setFormData(prev => ({ ...prev, [name]: `+7 ${cleanedValue.slice(1)}` }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const validateForm = () => {
    const emailValid = !errors.email && formData.email !== '';
    const phoneValid = !errors.phone && formData.phone !== '';
    const passwordValid = !errors.password && formData.password !== '';
    const telegramIdValid = !errors.telegramId && formData.telegramId !== ''; // Проверка на telegramId
    return validateFullName() && emailValid && phoneValid && passwordValid && telegramIdValid; // Добавлена проверка для telegramId
  };
  
  const sendVerificationCode = async () => {
    const phone = formData.phone.replace(/\D/g, '');
    const query = new URLSearchParams({ phone_number: phone }).toString();
    const data = await apiRequest(`users/send_phone_verification_code/?${query}`, 'GET', undefined);
    
    if (data?.response?.ok && data.response.result?.request_id) {
      setRequestId(data.response.result.request_id);
      setStep(2);
    } else {
      console.error("Ошибка: request_id не получен!");
    }
  };
  
  const verifyCode = async () => {
    if (!requestId) return;
    
    const query = new URLSearchParams({ request_id: requestId, code: formData.verificationCode }).toString();
    const success = await apiRequest(`users/verify_code/?${query}`, 'GET', undefined);
    console.log('Ответ верификации:', success);
    
    if (success) {
      await registerUser();
    } else {
      setErrors(prev => ({ ...prev, verificationCode: true }));
    }
  };
  
  const registerUser = async () => {
    const [surname, name, patronymic] = formData.fullName.split(' ');
    const userData = {
      email: formData.email,
      password: formData.password,
      name,
      surname,
      patronymic,
      phone_number: formData.phone.replace(/\D/g, ''),
    };
    
    const response = await apiRequest('users/signup/', 'POST', userData);
    if (response) {
      await login(userData.email, userData.password);
    }
  };
  
  const login = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/login/access-token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log('Ответ от сервера:', response.data);
      
      const token = response.data.access_token;
      if (token) {
        saveToken(token);
        setAuthHeader(token);
        navigate('/');
      } else {
        console.error('Токен не получен');
      }
    } catch (error) {
      console.error('Ошибка авторизации:');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && validateForm()) {
      await sendVerificationCode();
    } else if (step === 2 && formData.verificationCode.length === 4) {
      await verifyCode();
    }
  };
  
  const navigateToLogin = () => {
    navigate('/login');
  };
  
  return (
    <div className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <h1>Регистрация</h1>
          <button
            type="button"
            className={styles.loginButton}
            onClick={navigateToLogin}
          >
            Уже есть аккаунт? <span className={styles.tologin}>Войти</span>
          </button>
        </div>
        
        <div className={styles.formGroup}>
          <div className={styles.labelWrapper}>
            <label className={styles.label}>
              Введите Ф.И.О. игрока</label>
          </div>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`${styles.input} ${errors.fullName ? styles.error : ''}`}
            placeholder="Иванов Иван Иванович"
            required
          />
          {errors.fullName && <div className={styles.errorMessage}>Ф.И.О. должно содержать три слова</div>}
        </div>
        
        {[
          { label: 'Введите Email', name: 'email', type: 'email', placeholder: 'example@mail.ru', error: errors.email, errorMessage: 'Укажите корректный email' },
          { label: 'Телефон', name: 'phone', type: 'tel', placeholder: '+7 (999)-000-00-00', error: errors.phone, errorMessage: 'Укажите корректный номер телефона' },
          { label: 'Пароль', name: 'password', type: 'password', placeholder: 'Введите пароль', error: errors.password, errorMessage: 'Пароль должен содержать минимум 8 символов' },
          { label: 'Телеграм ID', name: 'telegramId', type: 'text', placeholder: '111111111', error: errors.telegramId, errorMessage: 'Телеграм ID должен содержать 9 символов' },
          { label: 'Дата рождения игрока', name: 'birthDate', type: 'date' }
        ].map(({ label, name, type, placeholder, error, errorMessage }) => (
          <div key={name} className={styles.formGroup}>
            <div className={styles.labelWrapper}>
              <label className={styles.label}>{label}</label>
            </div>
            <input
              type={type}
              name={name}
              value={formData[name as keyof typeof formData]}
              onChange={handleChange}
              className={`${styles.input} ${error ? styles.error : ''}`}
              placeholder={placeholder}
              required
            />
            {error && errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          </div>
        ))}
        
        
        {step === 2 && (
          <div className={styles.otp}>
            <h2>Введите код из Telegram</h2>
            <OTPInput ref={otpRef} onComplete={(otp) => setFormData({
              ...formData,
              verificationCode: otp
            })}/>
            <div className={styles.otp__buttons}>
              <button onClick={() => otpRef.current?.clear()}>Очистить</button>
            </div>
          </div>
        )}
        
        <button type="submit" className={styles.submitButton}
                disabled={errors.email || errors.phone || errors.password || errors.telegramId}>
          {step === 1 ? 'Получить код' : 'Завершить регистрацию'}
        </button>
        
        <p className={styles.consentText}>
          Нажимая на кнопку, вы даете согласие на обработку персональных данных и соглашаетесь с политикой конфиденциальности.
        </p>
      </form>
    </div>
  );
};

export default Registration;
