import React from 'react';
import styles from './Header.module.scss';
import {useNavigate} from 'react-router-dom';

interface HeaderProps {
  scrollToBenefits: () => void;
}

const Header: React.FC<HeaderProps> = ({ scrollToBenefits }) => {
  const menuItems = [
    { label: 'КАЛЕНДАРЬ', href: '/calendar' },
    { label: 'КЛАССИФИКАЦИЯ', href: '/classification' },
    { label: 'НОВОСТИ', href: '/news' },
    { label: 'ТАРИФЫ', href: '/tariffs' },
    { label: 'О НАС', onClick: scrollToBenefits }, // Изменено
  ];
  
  const navigate = useNavigate();
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.social_links}>
          <img alt={'Телеграм канал'} src={'/tgicon.png'} onClick={() => {
          }}/>
        </div>
        
        <div className={styles.controls}>
          <button onClick={() => navigate('/registration')}>Регистрация
          </button>
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
