import React, { useState, useEffect } from "react";
import styles from "./Header.module.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken, removeToken } from "../../utils/serviceToken";
import { apiRequest } from "../../utils/apiRequest";

interface HeaderProps {
  scrollToBenefits: () => void;
}

const Header: React.FC<HeaderProps> = ({ scrollToBenefits }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Проверка валидности токена на сервере
  const checkTokenValidity = async () => {
    const token = getToken();
    
    if (!token) {
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return;
    }
    
    try {
      // Делаем запрос к защищенному эндпоинту для проверки валидности токена
      // Выберите эндпоинт, который требует авторизации (например, получение данных профиля)
      const response = await apiRequest("users/me", "GET", undefined, true);
      
      // Если нет ошибки, считаем пользователя авторизованным
      if (!response.error) {
        setIsAuthenticated(true);
      } else {
        // Если получили ошибку (401 или 403), удаляем недействительный токен
        console.log("Токен недействителен:", response);
        removeToken();
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Ошибка при проверке токена:", error);
      removeToken();
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };
  
  // Проверяем токен при монтировании компонента и при изменении маршрута
  useEffect(() => {
    checkTokenValidity();
  }, [location.pathname]);
  
  const handleAboutClick = () => {
    if (location.pathname === "/") {
      scrollToBenefits();
    } else {
      navigate("/");
    }
  };
  
  const menuItems = [
    { label: "КАЛЕНДАРЬ", onClick: () => navigate("/schedule") },
    { label: "КЛАССИФИКАЦИЯ", onClick: () => navigate("/rating") },
    { label: "НОВОСТИ", onClick: () => navigate("/news") },
    { label: "ТАРИФЫ", onClick: () => navigate("/subscription") },
    { label: "О НАС", onClick: handleAboutClick },
    { label: "ТРЕНЕРЫ", onClick: () => {navigate('trainers')}}
  ];
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.social_links}>
          <a href="https://t.me/Ace_tournament_bot"
          target="_blank"
          rel="noopener noreferrer">
          <img alt="Телеграм канал" src="/tgicon.png" />
        </a>
      </div>
      
      <div className={styles.controls}>
        {!isCheckingAuth && (
          isAuthenticated ? (
            <button onClick={() => navigate("/profile")}>Профиль</button>
          ) : (
            <button onClick={() => navigate("/registration")}>Регистрация</button>
          )
        )}
      </div>
    </div>
  
  <nav className={styles.navigation}>
    {menuItems.map((item) => (
      <button key={item.label} className={styles.nav_link} onClick={item.onClick}>
        {item.label}
      </button>
    ))}
  </nav>
</div>
);
};

export default Header;
