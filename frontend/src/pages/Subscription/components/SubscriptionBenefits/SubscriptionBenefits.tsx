import React from 'react';
import styles from './SubscriptionBenefits.module.scss';
import type {BenefitItem} from '../../types.ts';


const SubscriptionBenefits: React.FC = () => {
  const benefits: BenefitItem[] = [
    {
      title: 'Эксклюзивные предложения',
      description: 'Участвуйте в ежемесячных розыгрышах ценных подарков теннисной тематики в нашем Telegram-канале!'
    },
    {
      title: 'Постоянная поддержка и обновления',
      description: 'Будьте в курсе последних новостей и обновлений, пользуйтесь нашей постоянной поддержкой.'
    },
    {
      title: 'Календарь',
      description: 'Участвуй в турнирах. Просматривай информацию, подавай заявки и оплачивай взнос онлайн.'
    },
    {
      title: 'Классификация',
      description: 'Зарабатывай рейтинговые очки. Покажи всем на что ты способен!'
    }
  ];
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Преимущества подписки на нашу платформу</h1>
      <p className={styles.subtitle}>Получите максимум преимуществ с подпиской на нашу услугу!</p>
      
      <div className={styles.benefitsGrid}>
        {benefits.map((benefit, index) => (
          <div key={index} className={styles.benefitItem}>
            <div className={styles.iconWrapper}>
              <svg className={styles.icon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="#ff7a59" />
                <path d="M9 12.5l2 2 4-4.5" stroke="white" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div className={styles.benefitContent}>
              <h3 className={styles.benefitTitle}>{benefit.title}</h3>
              <p className={styles.benefitDescription}>{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionBenefits;
