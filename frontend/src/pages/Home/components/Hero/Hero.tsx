import React from "react";
import { motion } from "framer-motion";
import styles from "./Hero.module.scss";

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.3, duration: 0.5, ease: "easeOut" },
  }),
};

const Hero: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.text_content}>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Переходи на новый уровень <br />
            вместе с ACE.Дети
          </motion.h1>
          <motion.p
            className={styles.description}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Наша платформа создана для развития и поддержки детского тенниса.
            Она помогает организовывать турниры, подавать заявки на участие и
            оплачивать взносы. Также мы стремимся обеспечить перспективных
            молодых спортсменов необходимым инвентарем, чтобы вдохновить их на
            достижение новых высот и сформировать в них стремление к победе.
          </motion.p>
        </div>
        
        <div className={styles.images_grid}>
          {["/homehero1.jpg", "/homehero2.jpeg", "/homehero3.jpg", "/homehero4.jpg"].map((src, index) => (
            <motion.img
              key={index}
              src={src}
              alt={`Изображение ${index + 1}`}
              className={styles[`image_${index + 1}`]}
              variants={imageVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
