export interface CommentType {
  id: number;
  creator_id?: number;
  author: string;
  text: string;
  date: string;
  news_id: number;
}

export interface PostType {
  id: number;
  author: string;
  date: string;
  title: string;
  content: string;
  photo_paths: string[];
  comments: CommentType[];
}
