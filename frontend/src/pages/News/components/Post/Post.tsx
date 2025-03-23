import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../../utils/apiRequest.ts';
import styles from './Post.module.scss';
import CommentSection from '../CommentSection/CommentSection';
import { PostType } from '../../types';

interface PostProps {
  post: PostType;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onAddComment: (postId: number) => void;
}

const Post: React.FC<PostProps> = ({ post, commentText, onCommentTextChange, onAddComment }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };
  
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await apiRequest(`news/${post.id}/photos`, 'GET', undefined, false);
        if (!response.error) {
          setPhotos(response.data.map((photo: { photo_path: string }) => photo.photo_path));
        }
      } catch (error) {
        console.error('Ошибка загрузки фото:', error);
      }
    };
    
    fetchPhotos();
  }, [post.id]);
  
  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };
  
  const goToPreviousSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? photos.length - 1 : prevIndex - 1
    );
  };
  
  return (
    <article className={styles.post}>
      <header className={styles.header}>
        <h2 className={styles.title}>{post.title}</h2>
        <div className={styles.meta}>
          <time className={styles.date}>{formatDate(post.date)}</time>
        </div>
      </header>
      
      <div className={styles.content}>
        <p>{post.content}</p>
        {photos.length > 0 && (
          <div className={styles.slider}>
            <button
              className={styles.sliderButton}
              onClick={goToPreviousSlide}
              aria-label="Предыдущее фото"
            >
              &lt;
            </button>
            <div className={styles.imageContainer}>
              <img
                src={photos[currentIndex]}
                alt={`Фото ${currentIndex + 1}`}
                className={styles.image}
              />
            </div>
            <button
              className={styles.sliderButton}
              onClick={goToNextSlide}
              aria-label="Следующее фото"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
      
      <CommentSection
        postId={post.id}
        father_comments={post.comments}
        commentText={commentText}
        onCommentTextChange={onCommentTextChange}
        onAddComment={() => onAddComment(post.id)}
      />
    </article>
  );
};

export default Post;
