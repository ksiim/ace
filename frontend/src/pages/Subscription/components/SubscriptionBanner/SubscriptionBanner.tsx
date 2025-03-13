import React from "react";
import styles from "./SubscriptionBanner.module.scss";

interface SubscriptionBannerProps {
  scrollToOptions: () => void;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ scrollToOptions }) => {
  return (
    <div className={styles.banner}>
      <h2 className={styles.title}>Присоединяйтесь к нам!</h2>
      <p className={styles.description}>
        Выберите подходящий вариант подписки и получите доступ ко всем функциям.
      </p>
      <button className={styles.subscribeButton} onClick={scrollToOptions}>
        Оформить подписку
      </button>
    </div>
  );
};

export default SubscriptionBanner;
