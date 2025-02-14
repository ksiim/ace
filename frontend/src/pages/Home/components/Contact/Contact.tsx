import React, { useState } from 'react';
import styles from './Contact.module.scss';
import { Send } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    comments: ''
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>Свяжитесь с нами</h2>
          <p className={styles.description}>
            Свяжитесь с нами по электронной почте или через наши социальные сети.
            Мы всегда готовы ответить на ваши вопросы и предоставить поддержку.
            Давайте вместе строить светлое будущее для молодых теннисистов.
          </p>
        </div>
        
        <div className={styles.contact_container}>
          <div className={styles.contact_info}>
            <a href="mailto:ace.tour@mail.ru" className={styles.email_link}>
              ace.tour@mail.ru
            </a>
            <p className={styles.social_text}>Присоединяйтесь к нам в социальных сетях</p>
            <div className={styles.social_links}>
              <a href="#" className={styles.social_link}>
                <Send className={styles.icon} />
              </a>
            </div>
          </div>
          
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Ваш электронный адрес"
              className={styles.input}
              value={formData.email}
              onChange={handleChange}
            />
            <input
              type="text"
              name="name"
              placeholder="Ваше полное имя"
              className={styles.input}
              value={formData.name}
              onChange={handleChange}
            />
            <textarea
              name="comments"
              placeholder="Ваши комментарии"
              className={styles.textarea}
              value={formData.comments}
              onChange={handleChange}
            />
            <button type="submit" className={styles.submit_button}>
              Отправить
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;