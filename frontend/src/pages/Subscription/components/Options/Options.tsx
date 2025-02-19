import React from 'react';
import { PlanCard } from './PlanCard/PlanCard';
import styles from './Options.module.scss';
import { SubscriptionPlan } from './PlanCard/PlanCard.tsx';

const plans: SubscriptionPlan[] = [
  {
    type: 'free',
    period: 'Бесплатно',
    features: [
      { text: 'Доступ к календарю' }
    ],
    price: null
  },
  {
    type: 'monthly',
    period: '1 месяц',
    features: [
      { text: 'Доступ к календарю' },
      { text: 'Участие в турнирах' },
      { text: 'Начисление рейтинга' },
      { text: 'Участие в розыгрышах ценных призов' }
    ],
    price: 199
  },
  {
    type: 'halfyear',
    period: '6 месяцев',
    features: [
      { text: 'Доступ к календарю' },
      { text: 'Участие в турнирах' },
      { text: 'Начисление рейтинга' },
      { text: 'Участие в розыгрышах ценных призов' }
    ],
    price: 1100
  },
  {
    type: 'annual',
    period: '12 месяцев',
    features: [
      { text: 'Доступ к календарю' },
      { text: 'Участие в турнирах' },
      { text: 'Начисление рейтинга' },
      { text: 'Участие в розыгрышах ценных призов' }
    ],
    price: 2100
  }
];

export const Options: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Варианты подписки</h2>
      <div className={styles.plans}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.type}
            type={plan.type}
            period={plan.period}
            features={plan.features}
            price={plan.price}
          />
        ))}
      </div>
    </div>
  );
};