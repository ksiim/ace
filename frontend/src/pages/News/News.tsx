import React from 'react';
import Header from '../../components/Header/Header.tsx';
import NewsTab from './components/NewsTab/NewsTab.tsx';
import Footer from '../../components/Footer/Footer.tsx';

const News:React.FC = () => {
  return (
    <div>
      <Header scrollToBenefits = {() => {}}/>
      <NewsTab/>
      <Footer/>
    </div>
  );
};

export default News;