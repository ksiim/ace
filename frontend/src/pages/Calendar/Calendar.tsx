import React from 'react';
import styles from './Calendar.module.scss'
import Header from '../../components/Header/Header.tsx';
import Schedule from './components/Schedule/Schedule.tsx';
import Footer from '../../components/Footer/Footer.tsx';

const Calendar:React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits={() => {}}/>
      <div className={styles.pageContent}>
        <Schedule/>
      </div>
      <Footer/>
    </div>
  );
};

export default Calendar;
