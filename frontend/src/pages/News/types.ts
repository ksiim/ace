export interface CommentType {
  id: number;
  author: string;
  text: string;
  date: string;
}

export interface PostType {
  id: number;
  author: string;
  date: string;
  title: string;
  content: string;
  imageUrl?: string;
  comments: CommentType[];
}