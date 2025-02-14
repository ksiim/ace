import React from 'react';
import styles from './Hero.module.scss';

const Hero: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.text_content}>
          <h1 className={styles.title}>
            Переходи на новый уровень <br/>
            вместе с ACE.Дети
          </h1>
          <p className={styles.description}>
            Наша платформа создана для развития и поддержки детского тенниса.
            Она помогает организовывать турниры, подавать заявки на участие и
            оплачивать взносы. Также мы стремимся обеспечить перспективных
            молодых спортсменов необходимым инвентарем, чтобы вдохновить их
            на достижение новых высот и сформировать в них стремление к победе.
          </p>
        </div>
        
        <div className={styles.images_grid}>
          <img
            src="/homehero1.jpg"
            alt="Юный теннисист"
            className={styles.image_1}
          />
          <img
            src="/homehero2.jpeg"
            alt="Теннисная сетка"
            className={styles.image_2}
          />
          <img
            src="/homehero3.jpg"
            alt="Юные теннисисты"
            className={styles.image_3}
          />
          <img
            src="/homehero4.jpg"
            alt="Теннисист"
            className={styles.image_4}
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;