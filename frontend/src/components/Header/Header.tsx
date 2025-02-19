import React from 'react';
import styles from './Header.module.scss';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  scrollToBenefits: () => void;
}

const Header: React.FC<HeaderProps> = ({ scrollToBenefits }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Получаем текущий путь
  
  const handleAboutClick = () => {
    if (location.pathname === '/') {
      scrollToBenefits(); // Если на главной, просто скроллим
    } else {
      navigate('/'); // Иначе переходим на главную
    }
  };
  
  const menuItems = [
    { label: 'КАЛЕНДАРЬ', onClick: () => navigate('/schedule') },
    { label: 'КЛАССИФИКАЦИЯ', onClick: () => navigate('/rating') },
    { label: 'НОВОСТИ', onClick: () => navigate('/news') },
    { label: 'ТАРИФЫ', onClick: () => navigate('/subscription') },
    { label: 'О НАС', onClick: handleAboutClick },
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
          <button onClick={() => navigate('/registration')}>Регистрация</button>
        </div>
      </div>
      
      <nav className={styles.navigation}>
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={styles.nav_link}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Header;
