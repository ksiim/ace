import React, { useState, useEffect } from "react";
import styles from "./Header.module.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken, removeToken } from "../../utils/serviceToken";
import { apiRequest } from "../../utils/apiRequest";
import {
  Calendar,
  //HeartHandshake,
  Info,
  Newspaper,
  Trophy,
  Wallet
} from 'lucide-react';
import type {HeaderProps} from './types.ts';


const Header: React.FC<HeaderProps> = ({ scrollToBenefits }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
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
      const response = await apiRequest("users/me", "GET", undefined, true);
      
      // Если нет ошибки, считаем пользователя авторизованным
      if (!response.error) {
        setIsAuthenticated(true);
      } else {
        // Если получили ошибку (401 или 403), удаляем недействительный токен
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
  
  // Отслеживание изменения размера экрана
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleAboutClick = () => {
    if (location.pathname === "/") {
      scrollToBenefits();
    } else {
      navigate("/");
    }
  };
  
  // Определяем активный путь
  const getActivePath = (path: string) => {
    if (typeof path === 'function') {
      // Для функций типа handleAboutClick
      if (path === handleAboutClick && location.pathname === '/') {
        return true;
      }
      return false;
    }
    return location.pathname === path;
  };
  
  const menuItems = [
    { label: "КАЛЕНДАРЬ", path: "/schedule", onClick: () => navigate("/schedule"), icon: <Calendar color={'#f95e1b'} size={16} strokeWidth={1.5}/> },
    { label: "КЛАССИФИКАЦИЯ", path: "/rating", onClick: () => navigate("/rating"), icon: <Trophy size={16} color={'#f95e1b'} strokeWidth={1.5} /> },
    { label: "НОВОСТИ", path: "/news", onClick: () => navigate("/news"), icon: <Newspaper size={16} color={'#f95e1b'} strokeWidth={1.5} /> },
    { label: "ТАРИФЫ", path: "/subscription", onClick: () => navigate("/subscription"), icon: <Wallet size={16} color={'#f95e1b'} strokeWidth={1.5} /> },
    { label: "О НАС", path: "/", onClick: handleAboutClick, icon: <Info size={16} color={'#f95e1b'} strokeWidth={1.5} /> },
    //{ label: "ТРЕНЕРЫ", path: "/trainers", onClick: () => navigate('/trainers'), icon: <HeartHandshake size={16} color={'#f95e1b'} strokeWidth={1.5} /> }
  ];
  
  // Стандартный десктопный хедер
  const renderDesktopHeader = () => (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.social_links}>
          <a href="https://t.me/ace_supergroup" target="_blank" rel="noopener noreferrer">
            <img alt="Телеграм канал" src="/tgicon.png" />
          </a>
        </div>
        
        <div className={styles.controls}>
          {!isCheckingAuth && (
            isAuthenticated ? (
              <button onClick={() => navigate("/profile")}>Профиль</button>
            ) : (
              <button onClick={() => navigate("/login")}>Вход</button>
            )
          )}
        </div>
      </div>
      
      <nav className={styles.navigation}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`${styles.nav_link} ${getActivePath(item.path) ? styles.active : ''}`}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
  
  // Упрощенный мобильный верхний хедер
  const renderMobileTopHeader = () => (
    <div className={styles.mobileTopHeader}>
      <div className={styles.content}>
        <div className={styles.social_links}>
          <a href="https://t.me/ace_supergroup" target="_blank" rel="noopener noreferrer">
            <img alt="Телеграм канал" src="/tgicon.png" />
          </a>
        </div>
        
        <div className={styles.controls}>
          {!isCheckingAuth && (
            isAuthenticated ? (
              <button onClick={() => navigate("/profile")}>Профиль</button>
            ) : (
              <button onClick={() => navigate("/login")}>Вход</button>
            )
          )}
        </div>
      </div>
    </div>
  );
  
  // Мобильная нижняя навигация
  const renderMobileBottomNav = () => (
    <div className={styles.mobileNav}>
      {menuItems.map((item, index) => (
        <div
          key={index}
          className={`${styles.navItem} ${getActivePath(item.path) ? styles.active : ''}`}
          onClick={item.onClick}
        >
          <div className={styles.navIcon}>{item.icon}</div>
          <div className={styles.navText}>{item.label}</div>
        </div>
      ))}
    </div>
  );
  
  return (
    <>
      {isMobile ? (
        <>
          {renderMobileTopHeader()}
          {renderMobileBottomNav()}
        </>
      ) : (
        renderDesktopHeader()
      )}
    </>
  );
};

export default Header;
