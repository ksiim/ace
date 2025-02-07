import React, { useState } from "react";
import styles from "./RegistrationForm.module.scss";

const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "Иванов Иван Иванович",
    email: "example@mail.ru",
    phone: "+7 (999)-000-00-00",
    birthDate: "2025-01-01",
    city: "Москва",
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted data:", formData);
  };
  
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Введите Ф.И.О. игрока
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
        />
      </label>
      
      <label>
        Введите Email
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
      </label>
      
      <label>
        Телефон
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
      </label>
      
      <label>
        Дата рождения игрока
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
        />
      </label>
      
      <label>
        Ваш город
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
        />
      </label>
      
      <button type="submit" className={styles.submitButton}>
        Зарегистрироваться
      </button>
      
      <p className={styles.consentText}>
        Нажимая на кнопку, вы даете согласие на обработку персональных данных и
        соглашаетесь с политикой конфиденциальности.
      </p>
    </form>
  );
};

export default RegistrationForm;
