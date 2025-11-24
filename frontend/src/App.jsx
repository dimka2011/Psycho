import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer'; 
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ArticleForm from './pages/ArticleForm';
import PsychDashboard from './pages/PsychDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChatView from './components/ChatView';
// Компонент для защиты маршрутов
const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, isPsychologist } = useAuth();

    if (!user) {
        // Если не авторизован -> на страницу входа
        return <Navigate to="/login" replace />; 
    }

    if (requiredRole === 'psychologist' && !isPsychologist) {
        // Если требуется психолог, а это не он -> на главную
        return <Navigate to="/" replace />; 
    }

    return children;
};

function AppRoutes() {
    const { user, isPsychologist } = useAuth();
    
    // Определяем, куда направить непсихолога при заходе на корень сайта
    const RootComponent = isPsychologist ? <Navigate to="/dashboard" replace /> : <Home />;

    return (
        <div className="content-wrap">
            <Routes>
                {/* 1. УСЛОВНЫЙ КОРНЕВОЙ МАРШРУТ */}
                <Route path="/" element={RootComponent} /> 
                <Route path='/dashboard' element={<ChatView />} />
                <Route path='/chat' element={<ChatView />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:articleId" element={<ArticleDetail />} /> 
                <Route path="/login" element={<Login />} />
                
                {/* 3. ЗАЩИЩЕННЫЕ МАРШРУТЫ ДЛЯ ПСИХОЛОГА */}
                <Route path="/dashboard" element={
                    <ProtectedRoute requiredRole="psychologist">
                        <PsychDashboard /> 
                    </ProtectedRoute>
                } />
                <Route path="/articles/:id" element={<ArticleDetail />} /> 

                {/* 1. Создание статьи (используем ArticleForm) */}
                <Route path="/articles/new" element={
                    <ProtectedRoute requiredRole="psychologist">
                        <ArticleForm /> 
                    </ProtectedRoute>
                } />
                
                {/* 2. Редактирование статьи (защищено и использует ArticleForm) */}
                <Route path="/articles/:id/edit" element={
                    <ProtectedRoute requiredRole="psychologist">
                        <ArticleForm /> 
                    </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} /> 
            </Routes>
        </div>
    );
}


function App() {
    return (
        <BrowserRouter>
            {/* Обертка для доступа к контексту */}
            <AuthProvider> 
                <div className="app-layout">
                    <Navbar />
                    <AppRoutes />
                    <Footer />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;