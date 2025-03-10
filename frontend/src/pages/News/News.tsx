import React from 'react';
import Header from '../../components/Header/Header.tsx';
import NewsTab from './components/NewsTab/NewsTab.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import styles from './News.module.scss';

const News:React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits = {() => {}}/>
      <div className={styles.pageContent}>
        <NewsTab/>
      </div>
      <Footer/>
    </div>
  );
};

export default News;
