import React from 'react';
import { PlanCard } from './PlanCard/PlanCard';
import styles from './Options.module.scss';
import type {SubscriptionPlan} from '../../types.ts';


const plans: SubscriptionPlan[] = [
  {
    type: '1',
    period: '1 месяц',
    features: [
    ],
    price: 590,
    discount: 0,
    monthlyPrice: 590,
    isFirst: true,
    rawPrice: 590
  },
  {
    type: '3',
    period: '3 месяца',
    features: [
    ],
    price: 1490,
    discount: 15,
    monthlyPrice: 500,
    isFirst: false,
    rawPrice: 1770,
    isRecommended: true
  },
  {
    type: '6',
    period: '6 месяцев',
    features: [
    ],
    price: 2650,
    discount: 25,
    monthlyPrice: 440,
    isFirst: false,
    rawPrice: 5310
  },
  {
    type: '12',
    period: '12 месяцев',
    features: [
    ],
    price: 4250,
    discount: 40,
    monthlyPrice: 355,
    isFirst: false,
    rawPrice: 7080
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
            discount={plan.discount}
            monthlyPrice={plan.monthlyPrice}
            isFirst={plan.isFirst}
            rawPrice={plan.rawPrice}
            isRecommended={plan.isRecommended}
          />
        ))}
      </div>
    </div>
  );
};
