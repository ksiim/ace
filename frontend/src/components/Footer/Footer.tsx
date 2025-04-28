import React from 'react';
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  
  return (
    <footer className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.legal_info}>
          <p>ИП Донченко Р.В.</p>
          <p>ИНН 616116698853</p>
          <p>ОГРН 324619600133530 от 14 июня 2024г.</p>
          <p>Адрес: Ростовская область, Аксайский р-он,</p>
          <p>ст-ца Старочеркасская, пер. Пляжный, 13.</p>
          <p>Электронная почта: <a href="mailto:ace.tour@mail.ru">ace.tour@mail.ru</a></p>
        </div>
        
        <div className={styles.content}>
          <div className={styles.logo}>
            ACE — платформа для развития<br/>
            детского тенниса.
          </div>

        <div className={styles.documents}>
          <a href="https://ace-deti.ru/uploads/c0e4f7f2-0c74-4f70-83dc-1fc3ae87a8ac.pdf" target="_blank" rel="noopener noreferrer">
            Политика конфиденциальности
          </a>
          <a href="https://ace-deti.ru/uploads/ed19f5ac-6b6c-4fea-b3d8-ed5ad5deacb5.pdf" target="_blank" rel="noopener noreferrer">
            Пользовательское соглашение
          </a>
          <a href="https://ace-deti.ru/uploads/122e6599-0fab-4d13-bf09-9e53c43f887a.pdf" target="_blank" rel="noopener noreferrer">
            Положение о платформе Эйс
          </a>
        </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;