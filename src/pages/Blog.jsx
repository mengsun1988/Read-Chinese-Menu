import posts from '../data/posts.json';
import { Link } from 'react-router-dom';

export const BlogList = () => (
  <div className="blog-list">
    {posts.map(post => (
      <Link key={post.id} to={`/blog/${post.id}`}>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
      </Link>
    ))}
  </div>
);