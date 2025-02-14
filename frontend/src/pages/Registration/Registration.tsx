import React, { useState } from "react";
import styles from "./Registration.module.scss";
import { getToken, setAuthHeader } from "../../utils/serviceToken.ts";

const API_URL = "http://localhost:8000/api/v1/users";

const Registration: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    telegramId: "",
    birthDate: "",
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const token = getToken(); // Используем getToken() из serviceToken
    
    if (!token) {
      setError("Ошибка: отсутствует токен авторизации.");
      setLoading(false);
      return;
    }
    
    setAuthHeader(token); // Устанавливаем заголовок авторизации
    
    try {
      const response = await fetch(`${API_URL}/${formData.telegramId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telegram_id: Number(formData.telegramId),
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formData.phone,
          birth_date: formData.birthDate,
        }),
      });
      
      if (response.ok) {
        console.log("Пользователь обновлен:", await response.json());
        alert("Регистрация успешна!");
      } else {
        const errorData = await response.json();
        console.error("Ошибка регистрации:", errorData);
        
        if (response.status === 404) {
          alert("Телеграм ID не найден. Вернитесь в бота.");
          window.location.href = "https://t.me/your_bot";
        } else {
          setError(errorData.message || "Ошибка регистрации.");
        }
      }
    } catch (err) {
      console.error("Ошибка сети:", err);
      setError("Ошибка сети. Проверьте соединение.");
    }
    
    setLoading(false);
  };
  
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Ф.И.О.
        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder={'Иванов Иван Иванович'} required />
      </label>
      
      <label>
        Email
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={'example@mail.ru'} required />
      </label>
      
      <label>
        Телефон
        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder={'+7 (999)-000-00-00'} required />
      </label>
      
      <label>
        Телеграм ID
        <input type="number" name="telegramId" value={formData.telegramId} onChange={handleChange} placeholder={'111111111'} required />
      </label>
      
      <label>
        Дата рождения
        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} placeholder={'01.01.2025'} required />
      </label>
      
      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? "Отправка..." : "Зарегистрироваться"}
      </button>
      
      {error && <p className={styles.errorText}>{error}</p>}
      
      <p className={styles.consentText}>
        Нажимая на кнопку, вы даете согласие на обработку персональных данных и соглашаетесь с политикой конфиденциальности.
      </p>
    </form>
  );
};

export default Registration;
