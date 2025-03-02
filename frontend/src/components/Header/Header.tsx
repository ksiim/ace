import React, { useState, useEffect } from "react";
import styles from "./Header.module.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken } from "../../utils/serviceToken";

interface HeaderProps {
  scrollToBenefits: () => void;
}

const Header: React.FC<HeaderProps> = ({ scrollToBenefits }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Теперь состояние можно обновлять
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  
  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(!!getToken());
    
    // Проверка при монтировании
    checkAuth();
    
    // Подписка на изменения в localStorage
    window.addEventListener("storage", checkAuth);
    
    return () => window.removeEventListener("storage", checkAuth);
  }, []);
  
  console.log("Авторизован:", isAuthenticated);
  
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
  ];
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.social_links}>
          <a
            href="https://t.me/Ace_tournament_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img alt="Телеграм канал" src="/tgicon.png" />
          </a>
        </div>
        
        <div className={styles.controls}>
          {isAuthenticated ? (
            <button onClick={() => navigate("/profile")}>Профиль</button>
          ) : (
            <button onClick={() => navigate("/registration")}>Регистрация</button>
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
