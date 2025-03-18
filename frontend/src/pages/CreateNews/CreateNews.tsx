import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/apiRequest';
import styles from './CreateNews.module.scss';
import { useNavigate, useParams } from 'react-router-dom';


const CreateNews: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const { newsId } = useParams();  // Получаем ID новости, если редактируем
  const navigate = useNavigate();
  
  // Функция для проверки, является ли пользователь администратором
  useEffect(() => {
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
          const newsResponse = await apiRequest(`news/${newsId}`, 'GET', undefined, true);
          if (newsResponse) {
            setTitle(newsResponse.title);
            setText(newsResponse.text);
            
            // Обработка существующих фотографий
            if (newsResponse.photo_paths && Array.isArray(newsResponse.photo_paths)) {
              setPhotoPaths(newsResponse.photo_paths);
            } else if (newsResponse.photo_path) {
              // Для обратной совместимости, если есть только одно фото
              setPhotoPaths([newsResponse.photo_path]);
            } else if (newsResponse.photo) {
              // Для еще более старой версии
              setPhotoPaths([newsResponse.photo]);
            }
          }
        } catch (err) {
          console.error('Ошибка при загрузке новости:', err);
        }
      };
      loadNews();
    }
  }, [navigate, newsId]);
  
  // Функция для обработки загрузки файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadProgress(true);
    
    // Создаем массив промисов для одновременной загрузки всех файлов
    const uploadPromises = Array.from(files).map(file => {
      // Проверка на изображение
      if (!file.type.startsWith("image/")) {
        setError("Загружать можно только изображения");
        return Promise.reject("Неверный тип файла");
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      return apiRequest("photos/", "POST", formData, true)
        .then((data) => {
          if (data && data.file_path) {
            // Изменяем путь
            return `${(data.file_path).slice(4)}`;
          } else {
            throw new Error("Ошибка загрузки фото");
          }
        });
    });
    
    // Ждем завершения всех загрузок
    Promise.all(uploadPromises)
      .then((newPaths) => {
        // Фильтруем только успешные загрузки и добавляем к существующим
        const validPaths = newPaths.filter(path => path);
        setPhotoPaths(prev => [...prev, ...validPaths]);
        setError(null);
      })
      .catch((err) => {
        console.error("Ошибка при загрузке файлов:", err);
        setError("Произошла ошибка при загрузке некоторых файлов");
      })
      .finally(() => {
        setUploadProgress(false);
        // Сбрасываем input для возможности повторной загрузки тех же файлов
        e.target.value = '';
      });
  };
  
  // Функция для удаления фото
  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotoPaths(prevPaths => prevPaths.filter((_, index) => index !== indexToRemove));
  };
  
  // Функция для создания или обновления новости
  const handleSubmit = async () => {
    if (!title || !text || (!newsId && photoPaths.length === 0)) {
      setError('Пожалуйста, заполните все поля и загрузите хотя бы одно фото.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userResponse = await apiRequest('users/me', 'GET', undefined, true);
      if (!userResponse || !userResponse.id) {
        throw new Error('Не удалось получить данные пользователя');
      }
      
      let payload;
      if (newsId) {
        // Формат для редактирования новости
        payload = {
          title,
          text,
          created_at: new Date().toISOString(),
          photo_paths: photoPaths,
        };
      } else {
        // Формат для создания новости
        payload = {
          title,
          text,
          created_at: new Date().toISOString(),
          photo_paths: photoPaths,
          creator_id: userResponse.id,
        };
      }
      
      let response;
      if (newsId) {
        response = await apiRequest(`news/${newsId}`, 'PUT', payload, true);
      } else {
        response = await apiRequest('news/', 'POST', payload, true);
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
          
          <div className={styles.formGroup}>
            <label htmlFor="photos">Фотографии новости</label>
            
            {/* Кастомная кнопка выбора файлов */}
            <label htmlFor="photos" className={styles.fileInputLabel}>
              Выберите файлы
            </label>
            
            <input
              type="file"
              id="photos"
              name="photos"
              onChange={handleFileChange}
              className={styles.fileInput}
              multiple
              accept="image/*"
            />
            
            {uploadProgress &&
							<div className={styles.uploadProgress}>Загрузка файлов...</div>}
            
            {photoPaths.length > 0 && (
              <div className={styles.photoGallery}>
                {photoPaths.map((path, index) => (
                  <div key={index} className={styles.photoItem}>
                    <div className={styles.thumbnailContainer}>
                      <img
                        src={path}
                        alt={`Фото ${index + 1}`}
                        className={styles.thumbnail}
                        style={{
                          width: '80px',
                          height: '60px',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemovePhoto(index)}
                        title="Удалить фото"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || uploadProgress}
            className={styles.submitButton}
          >
            {isLoading ? 'Обработка...' : newsId ? 'Обновить новость' : 'Создать новость'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNews;
