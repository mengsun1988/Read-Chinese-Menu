import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import posts from '../data/posts.json';

const BlogDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const allPosts = Array.isArray(posts) ? posts.flat(Infinity) : [];
  const post = allPosts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center bg-white font-body">
        <p className="text-slate-400 mb-4">Post not found.</p>
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-emerald-600 border-b border-emerald-600">BACK</button>
      </div>
    );
  }

  const handleImageSearch = () => {
    // 严格只搜索中文菜名，确保搜索结果的纯粹度
    const query = encodeURIComponent(post.dish);
    window.open(`https://www.bing.com/images/search?q=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-body antialiased text-slate-800 leading-relaxed">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-slate-50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-2xl font-light">←</button>
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">Read Chinese Menu</span>
        <div className="w-10"></div>
      </nav>

      <main className="max-w-screen-sm mx-auto px-6 pt-10">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            <span>Traveler Guide</span>
            <span className="text-slate-200">/</span>
            <span className="text-slate-400">
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl leading-tight mb-8 font-title font-bold text-slate-900 tracking-tight">
            {post.title}
          </h1>

          {/* 外部搜索入口：明确标注为 Search Results */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
              To see what this dish looks like, you can view the live search results on Bing Images.
            </p>
            <button 
              onClick={handleImageSearch}
              className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              SEARCH IMAGES FOR "{post.dish}" →
            </button>
          </div>
        </header>

        <section className="prose prose-slate max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({node, ...props}) => <p className="mb-8 text-[17px] leading-[1.85] text-slate-600 font-normal" {...props} />,
              h2: ({node, ...props}) => (
                <h2 className="text-xl mt-12 mb-6 text-slate-900 font-title font-bold border-l-4 border-emerald-500 pl-4 uppercase tracking-wide" {...props} />
              ),
              strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
              ul: ({node, ...props}) => <ul className="list-none p-0 mb-10 space-y-4" {...props} />,
              li: ({node, ...props}) => (
                <li className="flex gap-3 text-[17px] text-slate-600 leading-relaxed">
                  <span className="text-emerald-500 opacity-60">•</span>
                  <span>{props.children}</span>
                </li>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </section>

        <footer className="mt-24 pt-12 border-t border-slate-100 text-center">
          <p className="text-slate-300 text-[10px] tracking-[0.4em] uppercase font-medium mb-4">
            Read Chinese Menu · Culinary Database
          </p>
          <div className="text-[10px] text-slate-400">
            Encouraging authentic culinary exploration across China.
          </div>
        </footer>
      </main>
    </div>
  );
};

export default BlogDetail;