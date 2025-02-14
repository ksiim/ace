import React from 'react';
import styles from './Footer.module.scss';
import { ChevronUp } from 'lucide-react';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <footer className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.logo}>
          ACE — платформа для развития<br/>
          детского тенниса.
        </div>
        
        <button
          onClick={scrollToTop}
          className={styles.scroll_top}
        >
          Вернуться наверх <ChevronUp className={styles.icon} />
        </button>
      </div>
    </footer>
  );
};

export default Footer;