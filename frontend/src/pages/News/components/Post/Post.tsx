// Post/Post.tsx
import React from 'react';
import styles from './Post.module.scss';
import CommentSection from '../CommentSection/CommentSection';
import { PostType } from '../../types';

interface PostProps {
  post: PostType;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onAddComment: (postId: number) => void;
}

const Post: React.FC<PostProps> = ({
                                     post,
                                     commentText,
                                     onCommentTextChange,
                                     onAddComment
                                   }) => {
  return (
    <article className={styles.post}>
      <header className={styles.header}>
        <h2 className={styles.title}>{post.title}</h2>
        <div className={styles.meta}>
          <span className={styles.author}>Отправлено {post.author}</span>
          <time className={styles.date}>{post.date}</time>
        </div>
      </header>
      
      <div className={styles.content}>
        <p>{post.content}</p>
        {post.imageUrl && (
          <div className={styles.imageContainer}>
            <img
              src={post.imageUrl}
              alt={`Image for ${post.title}`}
              className={styles.image}
            />
          </div>
        )}
      </div>
      
      <CommentSection
        postId={post.id}
        comments={post.comments}
        commentText={commentText}
        onCommentTextChange={onCommentTextChange}
        onAddComment={() => onAddComment(post.id)}
      />
    </article>
  );
};

export default Post;