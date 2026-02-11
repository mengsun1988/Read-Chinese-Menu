import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import posts from '../data/posts.json';

const BlogDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  // 兼顾数据结构健壮性
  const allPosts = Array.isArray(posts) ? posts.flat(Infinity) : [];
  const post = allPosts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center bg-white font-body">
        <p className="text-slate-400 mb-4">Post not found in the culinary archive.</p>
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-emerald-600 border-b border-emerald-600">RETURN TO MENU</button>
      </div>
    );
  }

  const handleImageSearch = () => {
    const searchKeyword = post.dish || post.title;
    const query = encodeURIComponent(`${searchKeyword} authentic Chinese dish`);
    window.open(`https://www.bing.com/images/search?q=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-body antialiased text-slate-800">
      {/* 极简导航 */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-slate-50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-2xl font-light">←</button>
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">Read Chinese Menu</span>
        <div className="w-10"></div>
      </nav>

      <main className="max-w-screen-sm mx-auto px-6 pt-10">
        <header className="mb-12">
          {/* SEO 元数据展示 */}
          <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            <span>Authentic Guide</span>
            <span className="text-slate-200">/</span>
            <span className="text-slate-400 uppercase">
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl leading-tight mb-8 font-title font-bold text-slate-900 tracking-tight">
            {post.title}
          </h1>

          {/* 转化组件：引导用户看图 */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Curious about how this dish looks in a real Chinese kitchen? View our curated image gallery.
            </p>
            <button 
              onClick={handleImageSearch}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-widest py-4 rounded-xl transition-colors shadow-md shadow-emerald-100"
            >
              BROWSE DISH PHOTOS
            </button>
          </div>
        </header>

        {/* 文章主体：SEO 友好的长白排版 */}
        <section className="prose prose-slate max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // 段落：17px 字号，1.8 倍行高，最适合手机阅读
              p: ({node, ...props}) => <p className="mb-8 text-[17px] leading-[1.8] text-slate-600 font-normal" {...props} />,
              
              // 标题：清晰的层级
              h2: ({node, ...props}) => (
                <h2 className="text-xl mt-12 mb-6 text-slate-900 font-title font-bold border-l-4 border-emerald-500 pl-4" {...props} />
              ),

              // 强调：加粗但不花哨
              strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,

              // 链接：如果有的话
              a: ({node, ...props}) => <a className="text-emerald-600 underline underline-offset-4" {...props} />,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </section>

        {/* 底部引导 */}
        <footer className="mt-24 pt-12 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-xs mb-8">
            © 2026 Read Chinese Menu. All rights reserved.
          </p>
          <div className="inline-block px-6 py-2 bg-slate-900 text-white text-[10px] tracking-widest rounded-full uppercase">
            Taste China In Person
          </div>
        </footer>
      </main>
    </div>
  );
};

export default BlogDetail;