import React, { useState, useEffect } from 'react';
import { Trash, Edit } from 'lucide-react';
import styles from './CommentSection.module.scss';
import { CommentType } from '../../types';
import { apiRequest } from '../../../../utils/apiRequest.ts'; // Импортируем функцию для запросов

interface CommentSectionProps {
  postId: number;
  father_comments: CommentType[];
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onAddComment: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
                                                         father_comments,
                                                         commentText,
                                                         onCommentTextChange,
                                                         onAddComment,
                                                       }) => {
  const [currentUser, setCurrentUser] = useState<any>(null); // Данные текущего пользователя
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedCommentText, setEditedCommentText] = useState<string>('');
  const [comments, setComments] = useState<CommentType[]>(father_comments || []);
  
  
  // Получаем данные текущего пользователя
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await apiRequest('users/me', 'GET', undefined, true);
      setCurrentUser(user);
    };
    
    fetchCurrentUser();
  }, []);
  
  useEffect(() => {
    setComments(father_comments);
  }, [father_comments]);
  
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddComment();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onAddComment();
    }
  };
  
  const handleDeleteComment = async (commentId: number) => {
    try {
      await apiRequest(`news/comments/${commentId}`, 'DELETE', undefined, true);
      const updatedComments = comments.filter(comment => comment.id !== commentId);
      onCommentTextChange(''); // Очистка поля ввода (если нужно)
      setComments(updatedComments); // Обновление списка комментариев
    } catch (error) {
      console.error('Ошибка при удалении комментария', error);
    }
  };
  
  
  const handleEditComment = (commentId: number, text: string) => {
    setEditingCommentId(commentId);
    setEditedCommentText(text);
  };
  
  const handleSaveEditedComment = async (commentId: number) => {
    try {
      const updatedComment = await apiRequest(`news/comments/${commentId}`, 'PUT', {
        text: editedCommentText,
        created_at: new Date().toISOString(),
      }, true);
      
      const updatedComments = comments.map(comment =>
        comment.id === commentId ? { ...comment, text: updatedComment.text } : comment
      );
      
      setEditingCommentId(null);
      setComments(updatedComments); // Обновление списка комментариев
    } catch (error) {
      console.error('Ошибка при редактировании комментария', error);
    }
  };
  
  
  return (
    <div className={styles.commentSection}>
      <h3 className={styles.heading}>
        Комментарии ({comments.length})
      </h3>
      
      {comments.length > 0 ? (
        <ul className={styles.commentList}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>{comment.author}</span>
                <time className={styles.commentDate}>{comment.date}</time>
              </div>
              
              {editingCommentId === comment.id ? (
                <div className={styles.editingComment}>
                  <textarea
                    value={editedCommentText}
                    onChange={(e) => setEditedCommentText(e.target.value)}
                    rows={3}
                    className={styles.commentInput}
                  />
                  <button
                    onClick={() => handleSaveEditedComment(comment.id)}
                    className={styles.commentButton}
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingCommentId(null)}
                    className={styles.commentButton}
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <p className={styles.commentText}>{comment.text}</p>
              )}
              
              <div className={styles.commentActions}>
                {/* Проверка прав доступа: пользователь может редактировать только свои комментарии */}
                {(comment.creator_id === currentUser?.id || currentUser?.admin) && (
                  <>
                    <Edit
                      onClick={() => handleEditComment(comment.id, comment.text)}
                      className={styles.icon}
                    />
                    <Trash
                      onClick={() => handleDeleteComment(comment.id)}
                      className={styles.icon}
                    />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noComments}>Пока что без комментариев. Станьте первым!</p>
      )}
      
      <form className={styles.commentForm} onSubmit={handleSubmit}>
        <textarea
          className={styles.commentInput}
          placeholder="Напишите комментарий..."
          value={commentText}
          onChange={(e) => onCommentTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          type="submit"
          className={styles.commentButton}
          disabled={!commentText.trim()}
        >
          Отправить
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
