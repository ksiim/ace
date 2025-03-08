import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/apiRequest';
import styles from './CreateNews.module.scss';
import { useNavigate, useParams } from 'react-router-dom';

interface NewsData {
  title: string;
  text: string;
  photo: string;
}

const CreateNews: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { newsId } = useParams();  // Получаем ID новости, если редактируем
  const navigate = useNavigate();
  
  // Функция для проверки, является ли пользователь администратором
  useEffect(() => {
    console.log(newsId);
    const checkAdmin = async () => {
      try {
        const userResponse = await apiRequest('users/me', 'GET', undefined, true);
        if (!userResponse || !userResponse.admin) {
          navigate('/');
        }
      } catch (err) {
        console.error('Ошибка при проверке пользователя:', err);
        navigate('/');
      }
    };
    checkAdmin();
    
    // Если редактируем новость, загружаем её данные
    if (newsId) {
      const loadNews = async () => {
        try {
          console.log('Загружаем новость с ID:', newsId); // Добавляем логирование
          const newsResponse = await apiRequest(`news/${newsId}`, 'GET', undefined, true);
          if (newsResponse) {
            console.log('Данные новости:', newsResponse); // Логируем полученные данные
            setTitle(newsResponse.title);
            setText(newsResponse.text);
            setPhoto(newsResponse.photo);
          }
        } catch (err) {
          console.error('Ошибка при загрузке новости:', err);
        }
      };
      loadNews();
    }
  }, [navigate, newsId]);
  
  // Функция для создания или обновления новости
  const handleSubmit = async () => {
    if (!title || !text || !photo) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userResponse = await apiRequest('users/me', 'GET', undefined, true);
      if (!userResponse || !userResponse.id) {
        throw new Error('Не удалось получить данные пользователя');
      }
      
      const payload: NewsData = {
        title,
        text,
        photo,
      };
      
      let response;
      if (newsId) {
        // Обновляем новость
        response = await apiRequest(`news/${newsId}`, 'PUT', payload, true);
      } else {
        // Создаём новость
        response = await apiRequest('news', 'POST', payload, true);
      }
      
      if (!response) {
        throw new Error('Не удалось создать или обновить новость');
      }
      
      navigate('/news');
    } catch (err) {
      console.error('Ошибка при создании или обновлении новости:', err);
      setError('Не удалось создать или обновить новость. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={styles.content}>
      <div className={styles.createNews}>
        <h1 className={styles.title}>{newsId ? 'Редактировать новость' : 'Создать новость'}</h1>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.form}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок"
            className={styles.input}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Текст новости"
            className={styles.textarea}
          />
          <input
            type="text"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="Ссылка на фото"
            className={styles.input}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Создание/Обновление новости...' : newsId ? 'Обновить новость' : 'Создать новость'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNews;
