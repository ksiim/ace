import React, { useEffect, useState } from "react";
import { apiRequest } from "../../utils/apiRequest";
import styles from "./Profile.module.scss";
import Header from '../../components/Header/Header.tsx';
import { useNavigate } from 'react-router-dom';
import { removeToken } from "../../utils/serviceToken.ts";

interface User {
  name: string;
  surname: string;
  patronymic: string;
  admin: boolean;
  organizer: boolean;
  end_of_subscription: string;
  updated_at: string;
  created_at: string;
  phone_number: string;
  email: string;
  id: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    apiRequest("users/me", "GET", undefined, true)
      .then((data) => {
        if (data?.error) {
          if (data.status === 403) {
            navigate("/login");
          } else {
            setError("Ошибка загрузки данных");
          }
        } else {
          setUser(data);
        }
      })
      .catch(() => setError("Ошибка загрузки данных"))
      .finally(() => setLoading(false));
  }, [navigate]);
  
  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };
  
  if (loading) return <p className={styles.loading}>Загрузка...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!user) return <p className={styles.error}>Данные не найдены</p>;
  
  return (
    <>
      <Header scrollToBenefits={() => {}}/>
      <div className={styles.profileContainer}>
        <h1 className={styles.title}>Личный профиль</h1>
        <div className={styles.infoBlock}>
          <p className={styles.name}>
            {user.name} {user.surname} {user.patronymic} <span>#{user.id}</span>
          </p>
          <p>Email: {user.email}</p>
          <p>Телефон: {user.phone_number}</p>
          <p>Дата регистрации: {new Date(user.created_at).toLocaleDateString()}</p>
          <p>Подписка до: {new Date(user.end_of_subscription).toLocaleDateString()}</p>
          <p>Обновлено: {new Date(user.updated_at).toLocaleString()}</p>
          <p>Роль: {user.admin ? "Администратор" : user.organizer ? "Организатор" : "Пользователь"}</p>
        </div>
        
        <div className={styles.bottomButtons}>
          {(user.admin || user.organizer) && (
            <button className={styles.adminButton} onClick={() => navigate("/admin")}>
              Перейти в админ-панель
            </button>
          )}
          
          <button className={styles.logoutButton} onClick={handleLogout}>
            Выйти из профиля
          </button>
        </div>
       
      </div>
    </>
  );
};

export default Profile;
