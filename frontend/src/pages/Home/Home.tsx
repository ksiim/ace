import React, { useRef } from 'react';
import Header from '../../components/Header/Header.tsx';
import styles from './Home.module.scss';
import Hero from './components/Hero/Hero.tsx';
import Features from './components/Features/Features.tsx';
import Benefits from './components/Benefits/Benefits.tsx';
import Contact from './components/Contact/Contact.tsx';
import Footer from '../../components/Footer/Footer.tsx';

const Home: React.FC = () => {
  const benefitsRef = useRef<HTMLDivElement | null>(null);
  
  const scrollToBenefits = () => {
    benefitsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits={scrollToBenefits} />
      <Hero />
      <Features />
      <Benefits ref={benefitsRef} />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;
