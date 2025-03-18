import React, { useState, useEffect } from 'react';
import Post from '../Post/Post';
import styles from './NewsTab.module.scss';
import { PostType, CommentType } from '../../types.ts';
import { apiRequest } from '../../../../utils/apiRequest';
import { useNavigate } from 'react-router-dom';

const NewsTab: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [skip, setSkip] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const navigate = useNavigate();
  
  // Функция получения новостей с пагинацией и сортировкой по убыванию
  const fetchNews = async (skipValue: number) => {
    try {
      setIsLoading(true);
      
      // Убедимся, что skip не отрицательный
      const safeSkip = Math.max(0, skipValue);
      const response = await apiRequest(`news/?skip=${safeSkip}&limit=5&order=desc`, 'GET', undefined, true);
      if (!response || !response.data) throw new Error('Не удалось получить данные');
      
      // Сохраняем общее количество новостей
      
      
      const formattedPosts: PostType[] = await Promise.all(
        response.data.map(async (newsItem: any) => {
          const comments = await fetchCommentsForNews(newsItem.id);
          return {
            id: newsItem.id,
            author: "ACE",
            date: newsItem.created_at,
            title: newsItem.title,
            content: newsItem.text,
            imageUrl: newsItem.photo,
            comments: comments,
            photo_paths: newsItem.photo_paths || [],
          };
        })
      );
      
      // Проверяем, есть ли еще новости для загрузки
      if (formattedPosts.length < 5) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      // Добавляем новые новости к уже загруженным
      setPosts((prevPosts) => {
        const newPosts = safeSkip === 0 ? formattedPosts : [...prevPosts, ...formattedPosts];
        return newPosts;
      });
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке новостей:', err);
      setError('Не удалось загрузить новости. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadMoreNews = () => {
    const newSkip = skip + 5; // Увеличиваем skip на 5
    setSkip(newSkip);
    fetchNews(newSkip); // Загружаем следующие 5 новостей
  };
  
  // Инициализация при первой загрузке
  useEffect(() => {
    fetchNews(0); // Начинаем с skip = 0
    checkIfAdmin();
  }, []); // Зависимость от sortOrder
  
  // Функция получения комментариев для конкретной новости
  const fetchCommentsForNews = async (newsId: number): Promise<CommentType[]> => {
    try {
      const response = await apiRequest(`news/comments/${newsId}`, 'GET', undefined, true);
      if (!response) return [];
      const commentsWithAuthors = await Promise.all(
        response.data.map(async (comment: any) => {
          if (!comment.creator_id) {
            console.warn(`Комментарий ${comment.id} не имеет creator_id`);
            return {
              id: comment.id,
              author: "Неизвестный пользователь",
              text: comment.text,
              date: comment.created_at.split('T')[0],
            };
          }
          try {
            const userResponse = await apiRequest(`users/${comment.creator_id}/fio`, 'GET', undefined);
            const authorName = userResponse
              ? `${userResponse.surname} ${userResponse.name}`
              : "Неизвестный пользователь";
            return {
              creator_id: comment.creator_id,
              id: comment.id,
              author: authorName,
              text: comment.text,
              date: comment.created_at.split('T')[0],
            };
          } catch (userErr) {
            console.error(`Ошибка получения данных пользователя ${comment.creator_id}:`, userErr);
            return {
              id: comment.id,
              author: "Ошибка загрузки автора",
              text: comment.text,
              date: comment.created_at.split('T')[0],
            };
          }
        })
      );
      return commentsWithAuthors;
    } catch (err) {
      console.error(`Ошибка при загрузке комментариев для новости ID ${newsId}:`, err);
      return [];
    }
  };
  
  // Функция получения данных о текущем пользователе и проверка, является ли он администратором
  const checkIfAdmin = async () => {
    try {
      const userResponse = await apiRequest('users/me', 'GET', undefined, true);
      if (userResponse && userResponse.admin) {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Ошибка при получении данных пользователя:', err);
    }
  };
  
  // Функция добавления комментария
  const [commentTexts, setCommentTexts] = useState<{ [key: number]: string }>({});
  
  const handleCommentTextChange = (postId: number, text: string) => {
    setCommentTexts(prev => ({ ...prev, [postId]: text }));
  };
  
  const handleAddComment = async (postId: number) => {
    if (!commentTexts[postId]?.trim()) return;
    
    try {
      const userResponse = await apiRequest("users/me", "GET", undefined, true);
      if (!userResponse || !userResponse.id) throw new Error("Не удалось получить данные пользователя");
      
      const payload = {
        text: commentTexts[postId],
        created_at: new Date().toISOString(),
        creator_id: userResponse.id,
        news_id: postId
      };
      
      const response = await apiRequest(`news/comments/${postId}/`, "POST", payload, true);
      if (!response) throw new Error('Не удалось добавить комментарий');
      
      const updatedComments = await fetchCommentsForNews(postId);
      
      setPosts(posts.map(post =>
        post.id === postId ? { ...post, comments: updatedComments } : post
      ));
      
      // Очищаем текст комментария только для данного поста
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      
    } catch (err) {
      console.error('Ошибка при добавлении комментария:', err);
      alert('Не удалось добавить комментарий. Попробуйте снова.');
    }
  };
  
  // Функция редактирования новости
  const handleEditNews = (newsId: number) => {
    navigate(`/create-news/${newsId}`);
  };
  
  // Функция удаления новости
  const handleDeleteNews = async (newsId: number) => {
    try {
      const response = await apiRequest(`news/${newsId}/`, 'DELETE', undefined, true);
      if (!response) {
        throw new Error('Не удалось удалить новость');
      }
      // Сохраняем удаленные новости в localStorage
      const deletedNews = JSON.parse(localStorage.getItem('deletedNews') || '[]');
      deletedNews.push(newsId);
      localStorage.setItem('deletedNews', JSON.stringify(deletedNews));
      
      // Обновляем список новостей после удаления
      setPosts(posts.filter(post => post.id !== newsId));
      
    } catch (err) {
      console.error('Ошибка при удалении новости:', err);
      alert('Не удалось удалить новость. Попробуйте снова.');
    }
  };
  
  useEffect(() => {
    checkIfAdmin();
    
    // Проверяем, есть ли удаленные новости, чтобы исключить их из загрузки
    const deletedNews = JSON.parse(localStorage.getItem('deletedNews') || '[]');
    setPosts(prevPosts => prevPosts.filter(post => !deletedNews.includes(post.id)));
  }, []);
  
  if (isLoading && skip === 0) {
    return <div className={styles.loading}>Загрузка новостей...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  return (
    <div className={styles.newsTab}>
      <h1 className={styles.title}>Лента новостей</h1>
      
      {isAdmin && (
        <button
          className={styles.createNewsButton}
          onClick={() => navigate('/create-news')}
        >
          Создать новость <strong>+</strong>
        </button>
      )}
      
      {posts.length === 0 ? (
        <p className={styles.emptyMessage}>Новости отсутствуют</p>
      ) : (
        <div className={styles.posts}>
          {posts.map(post => (
            <div key={post.id} className={styles.postItem}>
              <Post
                post={post}
                commentText={commentTexts[post.id] || ""}
                onCommentTextChange={(text) => handleCommentTextChange(post.id, text)}
                onAddComment={() => handleAddComment(post.id)}
              />
              {isAdmin && (
                <div className={styles.adminButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEditNews(post.id)}
                  >
                    Редактировать
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteNews(post.id)}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {hasMore && (
        <button className={styles.loadMoreButton} onClick={loadMoreNews}>
          Показать ещё
        </button>
      )}
    </div>
  );
};

export default NewsTab;
