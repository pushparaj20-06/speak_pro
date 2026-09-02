import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function PublicRoute({ children }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <Navigate to="/lobby" /> : children;
}

function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsAuthenticated(!!user);
        if (user) {
          localStorage.setItem('isAuthenticated', 'true');
        } else {
          localStorage.removeItem('isAuthenticated');
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Mock auth check
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-primary-500/30">
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <Home />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/lobby" element={
          <PrivateRoute>
            <Lobby />
          </PrivateRoute>
        } />
        <Route path="/room/:roomId" element={
          <PrivateRoute>
            <Room />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
