import { forwardRef } from 'react';
import styles from './Benefits.module.scss';
import { CheckCircle } from 'lucide-react';

const Benefits= forwardRef<HTMLDivElement, {}>((_, ref) => {
  const benefits = [
    {
      title: 'Участие в турнирах',
      description: 'Ваш ребёнок сможет продемонстрировать свои навыки, соревноваться с другими молодыми теннисистами и зарабатывать рейтинговые очки.'
    },
    {
      title: 'Ценные призы',
      description: 'В конце календарного года будут проводиться турниры для сильнейших игроков в разных категориях. Победители турниров получат ценные призы, которые станут стимулом для дальнейшего развития.'
    },
    {
      title: 'Спонсорская помощь',
      description: 'Перспективные молодые спортсмены при необходимости будут обеспечены хорошим профессиональным инвентарём, оплатой времени на теннисных кортах и услуг тренерского состава.'
    },
    {
      title: 'Развитие таланта',
      description: 'Платформа ACE.Дети помогает раскрыть потенциал вашего ребёнка и вдохновляет его на достижение новых высот.'
    }
  ];
  
  return (
    <div ref={ref} className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>Повышайте свой уровень игры</h2>
          <p className={styles.description}>
            Молодые спортсмены участвуют в захватывающих турнирах, набираются опытом за счёт большого
            количества игр, получают ценные призы и подарки. Мы помогаем им достигать новых высот и
            раскрывать свой потенциал.
          </p>
        </div>
        
        <div className={styles.benefits_grid}>
          {benefits.map((benefit, index) => (
            <div key={index} className={styles.benefit_item}>
              <CheckCircle className={styles.check_icon} />
              <div className={styles.benefit_content}>
                <h3 className={styles.benefit_title}>{benefit.title}</h3>
                <p className={styles.benefit_description}>{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Benefits;
