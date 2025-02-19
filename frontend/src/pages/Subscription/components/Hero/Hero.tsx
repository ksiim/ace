import React from 'react';
import styles from './Hero.module.css';
import bannerImage from '/subhero.png';

const Hero: React.FC = () => {
  return (
    <div className={styles.bannerContainer}>
      <div className={styles.contentSection}>
        <h1 className={styles.title}>
          Подписка на сервис с уникальными возможностями!
        </h1>
        <p className={styles.description}>
          Оформите подписку и получите бесплатный доступ ко всем функциям на 2 месяца. Участвуйте в
          ежемесячных розыгрышах ценных теннисных подарков.
        </p>
      </div>
      
      <div className={styles.imageSection}>
        <img
          src={bannerImage}
          alt="Теннисные мячи и подарки на голубом фоне"
          className={styles.bannerImage}
        />
      </div>
    </div>
  );
};

export default Hero;