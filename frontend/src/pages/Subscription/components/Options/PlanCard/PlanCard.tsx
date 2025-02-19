export interface PlanFeature {
  text: string;
}

export interface SubscriptionPlan {
  type: string;
  period: string;
  features: PlanFeature[];
  price: number | null;
  isPopular?: boolean;
}

import React from 'react';
import { Star } from 'lucide-react';
import styles from './PlanCard.module.scss';

interface PlanCardProps {
  type: string;
  period: string;
  features: PlanFeature[];
  price: number | null;
}

export const PlanCard: React.FC<PlanCardProps> = ({
                                                    period,
                                                    features,
                                                    price
                                                  }) => {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>
        <Star size={50} className={styles.star} strokeWidth={1}/>
      </div>
      <h3 className={styles.period}>{period}</h3>
      <ul className={styles.features}>
        {features.map((feature, index) => (
          <li key={index} className={styles.feature}>
            {feature.text}
          </li>
        ))}
      </ul>
      {price !== null && (
        <>
          <div className={styles.price}>{price} ₽</div>
          <button className={styles.button}>Оформить</button>
        </>
      )}
    </div>
  );
};
