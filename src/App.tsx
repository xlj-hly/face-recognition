import React from 'react';
// import '@/App.css';

// 引入 react-router-dom 中的路由相关 API
import { BrowserRouter, useRoutes } from 'react-router-dom';

// 获取所有的页面路由
// ~react-pages 是一个约定俗成的路径，通常表示自动生成的路由配置文件
import routes from '~react-pages';

// 定义 Routers 组件，用于处理路由逻辑
const Routers = () => {
  // 使用 useNavigate 钩子获取导航函数，并将其赋值给 React.navigate
  // 这样可以在应用的任何地方通过 React.navigate 进行页面跳转
  const navigate = useNavigate();
  React.navigate = navigate;

  // 1. 获取当前路径
  // const { pathname } = useLocation();
  // 返回自动生成的路由列表
  return (
    // 使用 React.Suspense 包裹路由组件，实现懒加载
    <React.Suspense
    // fallback 属性指定在路由组件加载过程中显示的加载状态、动画
    // fallback={}
    >
      {/* 使用 useRoutes 钩子根据 routes 配置生成路由列表 */}
      {useRoutes(routes)}
    </React.Suspense>
  );
};
const App: React.FC = () => {
  return (
    <>
      {/* /使用 BrowserRouter 包裹整个应用，启用路由功能 */}
      <BrowserRouter>
        {/* 渲染 Routers 组件，显示路由内容 */}
        <Routers />
      </BrowserRouter>
    </>
  );
};

export default App;
