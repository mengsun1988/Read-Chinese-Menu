import { Link } from 'react-router-dom';
import posts from '../data/posts.json';

export const BlogList = () => {
  // 核心容错：使用 flat(Infinity) 拍平所有潜在的嵌套，并过滤掉空值
  const displayPosts = Array.isArray(posts) 
    ? posts.flat(Infinity) 
        .filter(post => post && post.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20)
    : [];

  return (
    <div className="min-h-screen bg-[#F8FAFB] px-6 py-12 font-body antialiased text-slate-900">
      {/* 极简头部 */}
      <header className="max-w-screen-xl mx-auto mb-16 md:mb-24">
        <h1 className="text-6xl md:text-8xl mb-4 font-title font-bold tracking-tighter italic">
          ARCHIVE
        </h1>
        <div className="w-16 h-1 bg-emerald-600 mb-8"></div>
        <p className="text-slate-500 max-w-md text-base md:text-lg leading-relaxed font-light">
          A curated collection of culinary heritage, mapping the evolution of authentic Chinese flavors.
        </p>
      </header>

      {/* 响应式网格 */}
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {displayPosts.map((post) => (
          <Link 
            key={post.id} 
            to={`/blog/${post.id}`}
            className="group flex flex-col bg-white border border-slate-100 transition-all duration-500 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-2 active:scale-[0.98]"
            style={{ borderRadius: '32px', padding: '2.5rem' }}
          >
            {/* 顶部元数据 */}
            <div className="flex justify-between items-center mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {post.dish || "CULINARY"}
              </span>
              <span className="text-[10px] text-slate-300 font-medium tabular-nums">
                {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* 标题 - 全英文极致排版 */}
            <h3 className="text-2xl md:text-3xl mb-4 font-title font-bold leading-[1.15] text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-3">
              {post.title}
            </h3>

            {/* 摘要 */}
            <p className="text-slate-400 leading-[1.6] text-sm mb-10 line-clamp-3 font-light">
              {post.excerpt}
            </p>

            {/* 底部交互 */}
            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 group-hover:text-slate-900 transition-colors">
                READ STORY
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                <span className="text-xl">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <footer className="max-w-screen-xl mx-auto mt-40 pb-12 text-center">
        <div className="w-1 h-12 bg-slate-100 mx-auto mb-8"></div>
        <p className="text-slate-200 text-[10px] tracking-[0.5em] uppercase font-medium font-title">
          Historical Culinary Record
        </p>
      </footer>
    </div>
  );
};