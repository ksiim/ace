import React from 'react';
import styles from './Calendar.module.scss'
import Header from '../../components/Header/Header.tsx';
import Schedule from './components/Schedule/Schedule.tsx';

const Calendar:React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits={() => {}}/>
      <Schedule/>
    </div>
  );
};

export default Calendar;