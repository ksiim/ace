import React, {useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Registration.module.scss';
import OTPInput, {OTPInputRef} from '../../components/OTPInput/OTPInput.tsx';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const otpRef = useRef<OTPInputRef>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    telegramId: '',
    birthDate: '',
    verificationCode: ''
  });
  
  const [step, setStep] = useState(1);
  const [requestId, setRequestId] = useState('');
  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    phone: false,
    verificationCode: false
  });
  
  useEffect(() => {
    validateField('email', formData.email);
  }, [formData.email]);
  
  useEffect(() => {
    validateField('phone', formData.phone);
  }, [formData.phone]);
  
  const validateField = (fieldName: string, value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,}$/;
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldName === 'email'
        ? value !== '' && !emailRegex.test(value)
        : fieldName === 'phone'
          ? value !== '' && !phoneRegex.test(value.replace(/\D/g, ''))
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    const emailValid = !errors.email && formData.email !== '';
    const phoneValid = !errors.phone && formData.phone !== '';
    return validateFullName() && emailValid && phoneValid;
  };
  
  const apiRequest = async (endpoint: string, method = 'POST', body?: object) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      return response.json();
    } catch (error) {
      console.error(`Ошибка запроса (${endpoint}):`, error);
      return null;
    }
  };
  
  const sendVerificationCode = async () => {
    const phone = formData.phone.replace(/\D/g, '');
    const query = new URLSearchParams({ phone_number: phone }).toString();
    const data = await apiRequest(`send_phone_verification_code/?${query}`, 'GET');
    
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
    const success = await apiRequest(`verify_code/?${query}`, 'GET');
    console.log('Ответ верификации:', success);
    
    
    if (success) {
      await registerUser();
    } else {
      setErrors(prev => ({ ...prev, verificationCode: true }));
    }
  };
  
  const registerUser = async () => {
    const [name, surname, patronymic] = formData.fullName.split(' ');
    const userData = {
      email: formData.email,
      password: 'temporaryPassword',
      name,
      surname,
      patronymic,
      phone_number: formData.phone.replace(/\D/g, ''),
    };
    
    const success = await apiRequest('signup/', 'POST', userData);
    if (success) {
      navigate('/');
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
  
  return (
    <div className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Введите Ф.И.О. игрока
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`${styles.input} ${errors.fullName ? styles.error : ''}`}
              placeholder="Иванов Иван Иванович"
              required
            />
          </label>
          {errors.fullName && <div className={styles.errorMessage}>Ф.И.О. должно содержать три слова</div>}
        </div>
        
        {[
          { label: 'Введите Email', name: 'email', type: 'email', placeholder: 'example@mail.ru', error: errors.email, errorMessage: 'Укажите корректный email' },
          { label: 'Телефон', name: 'phone', type: 'tel', placeholder: '+7 (999)-000-00-00', error: errors.phone, errorMessage: 'Укажите корректный номер телефона' },
          { label: 'Телеграм ID', name: 'telegramId', type: 'text', placeholder: '111111111' },
          { label: 'Дата рождения игрока', name: 'birthDate', type: 'date' }
        ].map(({ label, name, type, placeholder, error, errorMessage }) => (
          <div key={name} className={styles.formGroup}>
            <label className={styles.label}>
              {label}
              <input
                type={type}
                name={name}
                value={formData[name as keyof typeof formData]}
                onChange={handleChange}
                className={`${styles.input} ${error ? styles.error : ''}`}
                placeholder={placeholder}
                required
              />
            </label>
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
              <button onClick={() => otpRef.current?.focus()}>Фокус</button>
              <button onClick={() => otpRef.current?.clear()}>Очистить</button>
            </div>
          
          </div>
        )}
        
        <button type="submit" className={styles.submitButton}
                disabled={errors.email || errors.phone}>
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
