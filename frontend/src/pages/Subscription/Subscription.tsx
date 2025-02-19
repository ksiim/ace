import React from 'react';
import styles from './Subscription.module.scss'
import Footer from '../../components/Footer/Footer.tsx';
import Header from '../../components/Header/Header.tsx';
import {Options} from './components/Options/Options.tsx';
import SubscriptionBenefits
  from './components/SubscriptionBenefits/SubscriptionBenefits.tsx';
import Hero from './components/Hero/Hero.tsx';
import SubscriptionBanner
  from './components/SubscriptionBanner/SubscriptionBanner.tsx';

const Subscription:React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits={() => {}}/>
      <Hero/>
      <SubscriptionBenefits/>
      <SubscriptionBanner/>
      <Options/>
      <Footer/>
    </div>
  );
};

export default Subscription;