import { useParams } from 'react-router-dom';
import posts from '../data/posts.json';

const BlogDetail = () => {
  const { postId } = useParams();
  const post = posts.find(p => p.id === postId);

  if (!post) return <div>404 - 菜品还未上桌</div>;

  return (
    <article style={{ padding: '20px' }}>
      <h1>{post.title}</h1>
      <small>{post.date}</small>
      <img src={post.image} alt={post.title} style={{ width: '100%' }} />
      {/* 建议使用 react-markdown 处理 AI 生成的内容 */}
      <div className="content">{post.content}</div>
    </article>
  );
};

export default BlogDetail;