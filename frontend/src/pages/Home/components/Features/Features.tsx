import React from 'react';
import styles from './Features.module.scss';
import {Calendar, FileEdit, ShieldCheck} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Calendar className={styles.icon} />,
      title: 'Календарь турниров',
      description: 'На платформе ACE.Дети вы найдёте информацию о предстоящих детских теннисных турнирах.'
    },
    {
      icon: <FileEdit className={styles.icon} />,
      title: 'Подача заявки',
      description: 'Легко подавайте заявку на участие в турнире через нашу платформу.'
    },
    {
      icon: <ShieldCheck className={styles.icon} />,
      title: 'Безопасные платежи',
      description: 'Удобная система онлайн-платежей для оплаты турнирных взносов.'
    }
  ];
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>Открываем новые возможности</h2>
          <p className={styles.description}>
            Воспользуйтесь преимуществами нашей удобной платформы, которая включает в себя календарь
            турниров, рейтинговую систему, упрощенную регистрацию и безопасные способы оплаты. Легко
            найдите турниры, зарегистрируйтесь и подайте заявку всего за несколько кликов.
          </p>
        </div>
        
        <div className={styles.features_grid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.feature_item}>
              <div className={styles.icon_wrapper}>
                {feature.icon}
              </div>
              <div className={styles.content_wrapper}>
                <h3 className={styles.feature_title}>{feature.title}</h3>
                <p className={styles.feature_description}>{feature.description}</p>
              </div>
            
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
