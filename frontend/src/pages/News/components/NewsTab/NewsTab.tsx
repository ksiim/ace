import React, { useState, useEffect } from 'react';
import Post from '../Post/Post';
import styles from './NewsTab.module.scss';
import { PostType, CommentType } from '../../types.ts';
import { apiRequest } from '../../../../utils/apiRequest';




const NewsTab: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  
  // Получение новостей при загрузке компонента
  useEffect(() => {
    fetchNews();
  }, []);
  
  // Функция получения всех новостей
  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('news');
      
      if (!response) {
        throw new Error('Не удалось получить данные');
      }
      
      // Преобразуем данные из API в формат PostType
      const formattedPosts: PostType[] = await Promise.all(
        response.data.map(async (newsItem: any) => {
          // Получаем комментарии для каждой новости
          const comments = await fetchCommentsForNews(newsItem.id);
          
          return {
            id: newsItem.id,
            author: "ACE", // Предполагаем, что автор всегда ACE
            date: newsItem.created_at.split('T')[0], // Форматируем дату
            title: newsItem.title,
            content: newsItem.text,
            imageUrl: newsItem.photo,
            comments: comments
          };
        })
      );
      
      setPosts(formattedPosts);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке новостей:', err);
      setError('Не удалось загрузить новости. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Функция получения комментариев для конкретной новости
  const fetchCommentsForNews = async (newsId: number): Promise<CommentType[]> => {
    try {
      const response = await apiRequest(`news/comments/${newsId}`);
      
      if (!response) {
        return [];
      }
      
      // Получаем данные о пользователях
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
            const userResponse = await apiRequest(`users/${comment.creator_id}`);
            const authorName = userResponse
              ? `${userResponse.surname} ${userResponse.name}`
              : "Неизвестный пользователь";
            
            return {
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
  
  
  
  // Функция получения данных о текущем пользователе
  
  
  // Функция добавления комментария
  const handleAddComment = async (postId: number) => {
    if (commentText.trim() === '') return;
    
    try {
      const userResponse = await apiRequest("users/me", "GET");
      
      if (!userResponse || !userResponse.id) {
        throw new Error("Не удалось получить данные пользователя");
      }
      
      const payload = {
        text: commentText,
        created_at: new Date().toISOString(),
        creator_id: userResponse.id,
        news_id: postId
      };
      
      const response = await apiRequest(`news/comments/${postId}`, "POST", payload);
      
      if (!response) {
        throw new Error('Не удалось добавить комментарий');
      }
      
      const updatedComments = await fetchCommentsForNews(postId);
      
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, comments: updatedComments }
          : post
      ));
      
      setCommentText('');
    } catch (err) {
      console.error('Ошибка при добавлении комментария:', err);
      alert('Не удалось добавить комментарий. Проверьте данные и попробуйте снова.');
    }
  };
  
  
  
  if (isLoading) {
    return <div className={styles.loading}>Загрузка новостей...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  return (
    <div className={styles.newsTab}>
      <h1 className={styles.title}>Лента новостей</h1>
      {posts.length === 0 ? (
        <p className={styles.emptyMessage}>Новости отсутствуют</p>
      ) : (
        <div className={styles.posts}>
          {posts.map(post => (
            <Post
              key={post.id}
              post={post}
              commentText={commentText}
              onCommentTextChange={setCommentText}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsTab;