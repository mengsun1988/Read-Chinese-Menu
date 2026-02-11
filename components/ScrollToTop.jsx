import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 强制跳转到页面顶部
    window.scrollTo(0, 0);
  }, [pathname]); // 只要路径变化，就执行置顶

  return null;
};

export default ScrollToTop;