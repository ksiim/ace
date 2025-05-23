import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Registration.module.scss';
import OTPInput from '../../components/OTPInput/OTPInput.tsx';
import type { OTPInputRef } from '../../components/OTPInput/types.ts';
import { apiRequest } from '../../utils/apiRequest.ts';
import { saveToken, setAuthHeader } from '../../utils/serviceToken.ts';
import axios from 'axios';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ru } from 'date-fns/locale';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const otpRef = useRef<OTPInputRef>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    telegram_id: null as number | null,
    birth_date: '',
    password: '',
    verificationCode: '',
    sex: '' as string,
    region_id: null as number | null,
    confirmPassword: '',
  });

  const [sexOptions, setSexOptions] = useState<{ id: number; name: string }[]>([]);
  const [regionOptions, setRegionOptions] = useState<{ id: number; name: string }[]>([]);
  const [showTelegramHint, setShowTelegramHint] = useState(false);
  const [step, setStep] = useState(1);
  const [requestId, setRequestId] = useState('');
  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    verificationCode: false,
    telegram_id: false,
    sex: false,
    region_id: false,
    confirmPassword: false,
  });
  const [apiError, setApiError] = useState<string | null>(null); // Новое состояние для ошибок API

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const toggleShowPassword = (field: 'password' | 'confirmPassword') => () => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const resetFormAndErrors = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      telegram_id: null,
      birth_date: '',
      password: '',
      verificationCode: '',
      sex: '',
      region_id: null,
      confirmPassword: '',
    });
    setErrors({
      fullName: false,
      email: false,
      phone: false,
      password: false,
      verificationCode: false,
      telegram_id: false,
      sex: false,
      region_id: false,
      confirmPassword: false,
    });
    setApiError(null); // Сбрасываем ошибку API
    setStep(1);
  };

  useEffect(() => {
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      resetFormAndErrors();
    };
  }, []);

  useEffect(() => {
    resetFormAndErrors();
  }, []);

  const handleBackClick = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.style.zoom = '1';
    resetFormAndErrors();
    navigate('/');
  };

  useEffect(() => {
    const fetchSexOptions = async () => {
      try {
        const response = await apiRequest('sex/', 'GET', undefined, false);
        if (response && response.data) {
          const filteredSexOptions = response.data.filter(
            (sex: { shortname: string }) => sex.shortname !== 'mixed'
          );
          setSexOptions(filteredSexOptions);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных о полах:', error);
      }
    };

    const fetchRegions = async () => {
      try {
        const response = await apiRequest('regions/', 'GET', undefined, false);
        if (response && response.data) {
          setRegionOptions(response.data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных о регионах:', error);
      }
    };

    fetchSexOptions();
    fetchRegions();
  }, []);

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
    validateField('confirmPassword', formData.confirmPassword);
  }, [formData.confirmPassword, formData.password]);

  useEffect(() => {
    validateField('telegram_id', formData.telegram_id);
  }, [formData.telegram_id]);

  const validateField = (fieldName: string, value: string | number | null) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,}$/;
    const passwordRegex = /^.{8,}$/;
    const telegramIdValid = value === null || (typeof value === 'number' && (value.toString().length === 9 || value.toString().length === 10));

    setErrors((prev) => ({
      ...prev,
      [fieldName]: fieldName === 'email'
        ? value !== '' && !emailRegex.test(value as string)
        : fieldName === 'phone'
          ? value !== '' && !phoneRegex.test((value as string).replace(/\D/g, ''))
          : fieldName === 'password'
            ? value !== '' && !passwordRegex.test(value as string)
            : fieldName === 'confirmPassword'
              ? value !== '' && value !== formData.password
              : fieldName === 'telegram_id'
                ? value !== null && !telegramIdValid
                : false,
    }));
  };

  const validateFullName = () => {
    const words = formData.fullName.trim().split(/\s+/);
    const hasError = words.length !== 3;
    setErrors((prev) => ({ ...prev, fullName: hasError }));
    return !hasError;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      let cleanedValue = value.replace(/\D/g, '');
      if (cleanedValue.length > 0 && !cleanedValue.startsWith('7')) {
        cleanedValue = '7' + cleanedValue;
      }
      setFormData((prev) => ({ ...prev, [name]: `+7 ${cleanedValue.slice(1)}` }));
    } else if (name === 'telegram_id') {
      const trimmedValue = value.replace(/^0+/, '') || '0';
      const parsedValue = trimmedValue === '' ? null : parseInt(trimmedValue, 10);
      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    } else if (name === 'region_id') {
      const parsedValue = value === '' ? null : parseInt(value, 10);
      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const emailValid = !errors.email && formData.email !== '';
    const phoneValid = !errors.phone && formData.phone !== '';
    const passwordValid = !errors.password && formData.password !== '';
    const confirmPasswordValid = !errors.confirmPassword && formData.confirmPassword !== '' && formData.confirmPassword === formData.password;
    const telegramIdValid = !errors.telegram_id && formData.telegram_id !== null;
    const sexValid = formData.sex !== '';
    const regionValid = formData.region_id !== null;
    return validateFullName() && emailValid && phoneValid && passwordValid && confirmPasswordValid && telegramIdValid && sexValid && regionValid;
  };

  const sendVerificationCode = async () => {
    const phone = formData.phone.replace(/\D/g, '');
    const query = new URLSearchParams({ phone_number: phone }).toString();
    const data = await apiRequest(`users/send_phone_verification_code/?${query}`, 'GET', undefined);

    if (data?.response?.ok && data.response.result?.request_id) {
      setRequestId(data.response.result.request_id);
      setStep(2);
    } else {
      console.error('Ошибка: request_id не получен!');
    }
  };

  const verifyCode = async () => {
    if (!requestId) return;

    const query = new URLSearchParams({ request_id: requestId, code: formData.verificationCode }).toString();
    const success = await apiRequest(`users/verify_code/?${query}`, 'GET', undefined, false);

    if (success) {
      await registerUser();
    } else {
      setErrors((prev) => ({ ...prev, verificationCode: true }));
    }
  };

  const registerUser = async () => {
    const [surname, name, patronymic] = formData.fullName.split(' ');
    const selectedSex = sexOptions.find((sex) => sex.name === formData.sex);
    const sex_id = selectedSex ? selectedSex.id : null;

    const userData = {
      email: formData.email,
      password: formData.password,
      name,
      surname,
      patronymic,
      phone_number: formData.phone.replace(/\D/g, ''),
      telegram_id: formData.telegram_id,
      birth_date: formData.birth_date,
      sex_id,
      region_id: formData.region_id,
    };

    try {
      const response = await apiRequest('users/signup', 'POST', userData, false);
      if (response) {
        await login(userData.email, userData.password);
      }
    } catch (error) {
      // Обработка ошибки с выводом detail
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        setApiError(error.response.data.detail); // Устанавливаем сообщение об ошибке из detail
      } else {
        setApiError('Произошла ошибка при регистрации. Попробуйте снова.');
      }
      console.error('Ошибка при регистрации:', error);
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

      const token = response.data.access_token;
      if (token) {
        saveToken(token);
        setAuthHeader(token);
        navigate('/');
      } else {
        console.error('Токен не получен');
      }
    } catch (error) {
      // Обработка ошибки логина с выводом detail
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        setApiError(error.response.data.detail);
      } else {
        setApiError('Ошибка авторизации. Проверьте данные и попробуйте снова.');
      }
      console.error('Ошибка авторизации:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null); // Сбрасываем ошибку перед новой попыткой
    if (step === 1 && validateForm()) {
      await sendVerificationCode();
    } else if (step === 2 && formData.verificationCode.length === 4) {
      await verifyCode();
    }
  };

  const handleTelegramHintClick = () => {
    setShowTelegramHint(!showTelegramHint);
  };

  const handleTelegramBotClick = () => {
    window.open('https://t.me/Ace_tournament_bot', '_blank');
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
    <div className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <div className={styles.formHeader__header}>
            <button onClick={handleBackClick} className={styles.homeButton}>
              <ArrowLeft color="#ffffff" size={18} />
            </button>
            <h1>Регистрация</h1>
          </div>
          <button type="button" className={styles.loginButton} onClick={navigateToLogin}>
            Уже есть аккаунт? <span className={styles.tologin}>Войти</span>
          </button>
        </div>

        {/* Отображение ошибки API */}
        {apiError && (
          <div className={styles.apiErrorMessage}>
            {apiError}
          </div>
        )}

        <div className={styles.formGroup}>
          <div className={styles.labelWrapper}>
            <label className={styles.label}>Введите Ф.И.О. игрока</label>
          </div>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`${styles.input} ${errors.fullName ? styles.error : ''}`}
            placeholder="Иванов Иван Иванович"
          />
          {errors.fullName && <div className={styles.errorMessage}>Ф.И.О. должно содержать три слова</div>}
        </div>

        {[
          {
            label: 'Введите Email',
            name: 'email',
            type: 'email',
            placeholder: 'example@mail.ru',
            error: errors.email,
            errorMessage: 'Укажите корректный email',
          },
          {
            label: 'Телефон',
            name: 'phone',
            type: 'tel',
            placeholder: '+7 (999)-000-00-00',
            error: errors.phone,
            errorMessage: 'Укажите корректный номер телефона',
          },
          {
            label: 'Пароль',
            name: 'password',
            type: showPassword.password ? 'text' : 'password',
            placeholder: 'Придумайте пароль',
            error: errors.password,
            errorMessage: 'Пароль должен содержать минимум 8 символов',
            isPassword: true,
            showPassword: showPassword.password,
            toggleShow: () => toggleShowPassword('password'),
          },
          {
            label: 'Повторите пароль',
            name: 'confirmPassword',
            type: showPassword.confirmPassword ? 'text' : 'password',
            placeholder: 'Повторите пароль',
            error: errors.confirmPassword,
            errorMessage: 'Пароли не совпадают',
            isPassword: true,
            showPassword: showPassword.confirmPassword,
            toggleShow: () => toggleShowPassword('confirmPassword'),
          },
          {
            label: 'Телеграм ID',
            name: 'telegram_id',
            type: 'number',
            placeholder: '111111111',
            error: errors.telegram_id,
            errorMessage: 'Телеграм ID должен содержать 9-10 цифр',
          },
          {
            label: 'Дата рождения игрока',
            name: 'birth_date',
            type: 'date',
            placeholder: 'дд.мм.гггг',
            max: new Date().toISOString().split('T')[0],
          },
        ].map(({ label, name, type, placeholder, error, errorMessage }) => (
          <div key={name} className={styles.formGroup}>
            <div className={styles.labelWrapper}>
              <div className={styles.labelWrapper__title}>
                <label className={styles.label}>{label}</label>
                {name === 'telegram_id' && (
                  <div className={styles.hint} onClick={handleTelegramHintClick}>
                    Как получить id?
                  </div>
                )}
              </div>
              {(name === 'telegram_id' && showTelegramHint) && (
                <div className={styles.telegramHint}>
                  <p>
                    Отправьте боту команду <strong>/id</strong> чтобы получить
                    ваш Telegram ID.
                  </p>
                  <button
                    type="button"
                    className={styles.telegramBotButton}
                    onClick={handleTelegramBotClick}
                  >
                    Перейти к боту
                  </button>
                </div>
              )}
            </div>

            {type === 'date' ? (
              <div className={styles.dateInputWrapper}>
                <DatePicker
                  selected={formData.birth_date ? new Date(formData.birth_date) : null}
                  onChange={(date: Date | null) => {
                    const formattedDate = date ? date.toISOString().split('T')[0] : '';
                    setFormData(prev => ({
                      ...prev,
                      birth_date: formattedDate,
                    }));
                    const updateFormField = (name: string, value: string) => {
                      const input = document.createElement('input');
                      input.name = name;
                      input.value = value;
                      const event = Object.create(new Event('change', { bubbles: true }));
                      Object.defineProperty(event, 'target', { value: input });
                      handleChange(event as any);
                    };
                    updateFormField('birth_date', formattedDate);
                  }}
                  maxDate={new Date()}
                  placeholderText={placeholder || 'дд.мм.гггг'}
                  className={`${styles.input} ${error ? styles.error : ''}`}
                  locale={ru}
                  dateFormat="dd.MM.yyyy"
                  showPopperArrow={false}
                  popperPlacement="bottom-start"
                  customInput={
                    <input
                      className={`${styles.input} ${error ? styles.error : ''}`}
                    />
                  }
                />
              </div>
            ) : (
              <div className={styles.passwordWrapper}>
                <input
                  type={type}
                  name={name}
                  value={formData[name as keyof typeof formData] === null ? '' : formData[name as keyof typeof formData]?.toString()}
                  onChange={handleChange}
                  className={`${styles.input} ${error ? styles.error : ''}`}
                  placeholder={placeholder}
                />
                {(name === 'password' || name === 'confirmPassword') && (
                  <button
                    type="button"
                    className={styles.showPasswordButton}
                    onClick={toggleShowPassword(name === 'password' ? 'password' : 'confirmPassword')}
                  >
                    {showPassword[name === 'password' ? 'password' : 'confirmPassword'] ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                )}
              </div>
            )}

            {error && errorMessage && (
              <div className={styles.errorMessage}>{errorMessage}</div>
            )}
          </div>
        ))}

        <div className={styles.formGroup}>
          <div className={styles.labelWrapper}>
            <label className={styles.label}>Пол</label>
          </div>
          <select
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            className={`${styles.input} ${errors.sex ? styles.error : ''}`}
          >
            <option value="">Выберите пол</option>
            {sexOptions.map((sex) => (
              <option key={sex.id} value={sex.name}>
                {sex.name}
              </option>
            ))}
          </select>
          {errors.sex && <div className={styles.errorMessage}>Пожалуйста, выберите пол</div>}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.labelWrapper}>
            <label className={styles.label}>Регион</label>
          </div>
          <select
            name="region_id"
            value={formData.region_id || ''}
            onChange={handleChange}
            className={`${styles.input} ${errors.region_id ? styles.error : ''}`}
          >
            <option value="">Выберите регион</option>
            {regionOptions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {errors.region_id && <div className={styles.errorMessage}>Пожалуйста, выберите регион</div>}
        </div>

        {step === 2 && (
          <div className={styles.otp}>
            <h2>Введите код из Telegram</h2>
            <OTPInput
              ref={otpRef}
              onComplete={(otp) => setFormData({ ...formData, verificationCode: otp })}
            />
            <div className={styles.otp__buttons}>
              <button onClick={() => otpRef.current?.clear()}>Очистить</button>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={
            errors.email ||
            errors.phone ||
            errors.password ||
            errors.telegram_id ||
            errors.sex ||
            errors.region_id
          }
        >
          {step === 1 ? 'Получить код' : 'Завершить регистрацию'}
        </button>

        <p className={styles.consentText}>
          Нажимая на кнопку, вы даете согласие на обработку персональных данных и соглашаетесь с
          политикой конфиденциальности.
        </p>
      </form>
    </div>
  );
};

export default Registration;