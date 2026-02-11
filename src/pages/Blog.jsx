import { Link } from 'react-router-dom';
import posts from '../data/posts.json';

export const BlogList = () => {
  // 1. 鲁棒性处理：确保 posts 是数组且过滤掉损坏的条目
  const displayPosts = Array.isArray(posts) 
    ? [...posts]
        .filter(post => post && post.id) // 确保 post 对象存在且有 ID
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20)
    : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-12 font-body">
      {/* 极简头部 */}
      <header className="max-w-screen-xl mx-auto mb-16 md:mb-24">
        <h1 className="text-6xl md:text-8xl mb-6 text-slate-900 tracking-tighter font-title font-bold">
          BLOG
        </h1>
        <div className="w-20 h-1.5 bg-emerald-600 mb-8"></div>
        <p className="text-slate-500 font-medium max-w-lg leading-relaxed text-lg">
          Stories, history, and authentic techniques behind the world's most iconic Chinese dishes.
        </p>
      </header>

      {/* 博客网格 - 自动适配移动端 */}
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {displayPosts.map((post, index) => (
          <Link 
            // 修复 Key 报错：优先使用 ID，备选使用 index
            key={post.id || `post-${index}`} 
            to={`/blog/${post.id}`}
            className="group flex flex-col bg-white border border-slate-100 transition-all duration-500 hover:-translate-y-2 active:scale-[0.98]"
            style={{ 
              borderRadius: '24px', 
              boxShadow: '0 10px 30px -12px rgba(0,0,0,0.05)',
              padding: '2.5rem' 
            }}
          >
            {/* 顶部分类与日期 */}
            <div className="flex justify-between items-center mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">
                Culinary History
              </span>
              <span className="text-[10px] text-slate-300 font-medium tracking-widest">
                {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* 标题 - 限制在 3 行以内 */}
            <h3 className="text-2xl md:text-3xl mb-4 text-slate-900 group-hover:text-emerald-600 transition-colors duration-300 font-title font-bold leading-[1.2] line-clamp-3">
              {post.title}
            </h3>

            {/* 摘要 - 限制字数以保持对齐 */}
            <p className="text-slate-500 leading-relaxed text-sm mb-10 line-clamp-3 font-light">
              {post.excerpt}
            </p>

            {/* 底部按钮交互 */}
            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold tracking-[0.2em] text-slate-400 group-hover:text-slate-900 transition-colors">
              <span>EXPLORE STORY</span>
              <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                <span className="text-lg leading-none mt-[-2px]">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <footer className="max-w-screen-xl mx-auto mt-32 pb-12 text-center border-t border-slate-100 pt-16">
        <p className="text-slate-300 text-[10px] tracking-[0.4em] uppercase font-medium">
          Culinary Archive · 2026 Edition
        </p>
      </footer>
    </div>
  );
};