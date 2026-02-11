import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import posts from '../data/posts.json';

const BlogDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white font-body">
        <h1 className="text-xl text-slate-400 font-light">Content unavailable</h1>
        <button onClick={() => navigate(-1)} className="mt-6 text-[10px] tracking-[0.2em] font-bold border-b border-slate-900 pb-1">BACK TO LIST</button>
      </div>
    );
  }

  // 这里的搜索逻辑依然保留中文（为了精准度），但 UI 上完全看不到中文
  const handleImageSearch = () => {
    const searchKeyword = post.dish || post.title;
    const query = encodeURIComponent(`${searchKeyword} authentic dish photography`);
    window.open(`https://www.bing.com/images/search?q=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-body antialiased text-slate-900">
      {/* 极简导航 - 针对移动端优化高度 */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-xl font-light scale-x-125">←</button>
        <span className="text-[10px] uppercase tracking-[0.4em] font-medium text-slate-400">Archives</span>
        <div className="w-6"></div>
      </nav>

      <main className="max-w-screen-sm mx-auto px-6 pt-8">
        {/* 文章头部 - 全英文布局 */}
        <header className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600">Culinary History</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-[10px] text-slate-400 tabular-nums">
              {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <h1 className="text-4xl leading-[1.1] mb-10 font-title font-bold tracking-tight text-slate-900">
            {post.title}
          </h1>

          {/* 视觉搜索按钮 - 极致简约设计 */}
          <div className="bg-slate-50 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center">
            <p className="text-[12px] leading-relaxed text-slate-500 mb-6 max-w-[280px]">
              Explore the authentic presentation of this legacy dish through curated field photography.
            </p>
            <button 
              onClick={handleImageSearch}
              className="w-full py-4 bg-slate-900 text-white text-[11px] font-bold tracking-[0.2em] rounded-full active:scale-95 transition-all shadow-sm"
            >
              VIEW GALLERY →
            </button>
          </div>
        </header>

        {/* 正文内容 - 针对移动端优化字体大小与间距 */}
        <section className="prose prose-slate prose-img:rounded-3xl max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // 段落：使用 17px 兼顾阅读与美感，行高 1.8 
              p: ({node, ...props}) => <p className="mb-10 text-[17px] leading-[1.8] text-slate-600 text-left font-light" {...props} />,
              
              // 标题：移除多余修饰，保持整洁
              h2: ({node, ...props}) => (
                <h2 className="text-xl mt-16 mb-6 text-slate-900 font-title font-bold tracking-tight uppercase" {...props} />
              ),
              
              // 引用文字：去掉背景，改用简洁线条
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-2 border-slate-200 pl-6 italic text-slate-500 my-10 mx-0 font-light" {...props} />
              ),
              
              // 列表
              ul: ({node, ...props}) => <ul className="list-none p-0 mb-10 space-y-4" {...props} />,
              li: ({node, ...props}) => (
                <li className="flex gap-3 text-[16px] text-slate-600 leading-relaxed font-light">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{props.children}</span>
                </li>
              ),

              // 粗体：不再高亮背景，只加重颜色
              strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </section>

        {/* 极简页脚 */}
        <footer className="mt-32 pb-20 text-center border-t border-slate-50 pt-16">
          <div className="w-1 h-8 bg-slate-100 mx-auto mb-8"></div>
          <p className="text-slate-300 text-[9px] tracking-[0.6em] uppercase">Historical Archive</p>
        </footer>
      </main>
    </div>
  );
};

export default BlogDetail;