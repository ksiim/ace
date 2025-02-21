// NewsTab.tsx
import React, { useState } from 'react';
import Post from '../Post/Post';
import styles from './NewsTab.module.scss';
import { PostType, CommentType } from '../../types.ts';

const NewsTab: React.FC = () => {
  // Sample data for posts
  const [posts, setPosts] = useState<PostType[]>([
    {
      id: 1,
      author: "Админ ACE",
      date: "2025-02-20",
      title: "Добро пожаловать на нашу платформу!",
      content: "Мы рады приветствовать вас на нашей платформе! Здесь вы сможете ",
      imageUrl: "./subhero.png",
      comments: [
        { id: 1, author: "Гость", text: "Жду новый контент!", date: "2025-02-20" }
      ]
    },
    {
      id: 2,
      author: "Админ ACE",
      date: "2025-02-21",
      title: "Наше будущее",
      content: "Совсем скоро мы сможем поделиться с вами нашим новым функциональным прототипом платформы 2.0, которую точно оценят все любители тенниса!",
      imageUrl: "./homehero1.jpg",
      comments: []
    }
  ]);
  
  const [commentText, setCommentText] = useState<string>('');
  
  const handleAddComment = (postId: number) => {
    if (commentText.trim() === '') return;
    
    const newComment: CommentType = {
      id: Math.floor(Math.random() * 1000),
      author: "Гость",
      text: commentText,
      date: new Date().toISOString().split('T')[0]
    };
    
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, comments: [...post.comments, newComment] }
        : post
    ));
    
    setCommentText('');
  };
  
  return (
    <div className={styles.newsTab}>
      <h1 className={styles.title}>Лента новостей</h1>
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
    </div>
  );
};

export default NewsTab;