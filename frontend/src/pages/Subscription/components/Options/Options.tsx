import React from 'react';
import { PlanCard } from './PlanCard/PlanCard';
import styles from './Options.module.scss';
import type {SubscriptionPlan} from '../../types.ts';


const plans: SubscriptionPlan[] = [
  {
    type: 'halfyear',
    period: '6 месяцев',
    features: [
      { text: 'Доступ к календарю' },
      { text: 'Участие в турнирах' },
      { text: 'Начисление рейтинга' },
      { text: 'Участие в розыгрышах ценных призов' }
    ],
    price: 1
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
