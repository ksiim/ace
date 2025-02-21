// CommentSection/CommentSection.tsx
import React from 'react';
import styles from './CommentSection.module.scss';
import { CommentType } from '../../types';

interface CommentSectionProps {
  postId: number;
  comments: CommentType[];
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onAddComment: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
                                                         comments,
                                                         commentText,
                                                         onCommentTextChange,
                                                         onAddComment
                                                       }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddComment();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onAddComment();
    }
  };
  
  return (
    <div className={styles.commentSection}>
      <h3 className={styles.heading}>
        Комментарии ({comments.length})
      </h3>
      
      {comments.length > 0 ? (
        <ul className={styles.commentList}>
          {comments.map(comment => (
            <li key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>{comment.author}</span>
                <time className={styles.commentDate}>{comment.date}</time>
              </div>
              <p className={styles.commentText}>{comment.text}</p>
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