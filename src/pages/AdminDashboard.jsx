import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as fm } from 'framer-motion';
import { Users, Video, Activity, Server, Shield, LogOut, Lock } from 'lucide-react';
import Background3D from '../components/Background3D';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const stats = { users: 124, rooms: 5, server: 'Healthy', uptime: '99.9%' };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple mock admin password for demo
      setIsAuthenticated(true);
    } else {
      alert('Incorrect admin password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-dark-900">
        <Background3D />
        <fm.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-10 max-w-sm w-full relative z-10 m-4 shadow-2xl border-white/20 text-center">
          <Shield className="w-16 h-16 text-primary-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-6">Admin Access</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" 
              placeholder="Admin Password (admin123)"
              className="bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-center"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="bg-primary-500 hover:bg-primary-400 text-dark-900 font-bold px-6 py-3 rounded-xl transition-all">
              Unlock Dashboard
            </button>
            <button type="button" onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-sm mt-2">Return to Home</button>
          </form>
        </fm.div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex bg-dark-900 text-white overflow-hidden">
      <div className="absolute inset-0 z-0"><Background3D /></div>
      
      {/* Sidebar */}
      <div className="w-20 md:w-64 border-r border-white/10 bg-black/60 backdrop-blur-xl flex flex-col z-10 transition-all">
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-center md:justify-start gap-3">
          <Shield className="w-8 h-8 text-primary-500" />
          <h1 className="text-xl font-bold hidden md:block">Admin Portal</h1>
        </div>
        <nav className="flex-1 p-2 md:p-4 flex flex-col gap-2">
          <button className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-lg bg-primary-500/20 text-primary-400 font-medium">
            <Activity className="w-6 h-6" /> <span className="hidden md:block">Dashboard</span>
          </button>
          <button className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300">
            <Users className="w-6 h-6" /> <span className="hidden md:block">Manage Users</span>
          </button>
          <button className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-300">
            <Video className="w-6 h-6" /> <span className="hidden md:block">Active Rooms</span>
          </button>
        </nav>
        <div className="p-2 md:p-4 border-t border-white/10">
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors text-gray-400">
            <LogOut className="w-6 h-6" /> <span className="hidden md:block">Lock Console</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto z-10">
        <fm.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Platform Overview</h2>
              <p className="text-gray-400">Welcome back, Super Admin.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium self-start md:self-auto">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard icon={<Users />} title="Total Users" value={stats.users} trend="+12% this week" color="blue" />
            <StatCard icon={<Video />} title="Active Rooms" value={stats.rooms} trend="3 currently live" color="primary" />
            <StatCard icon={<Server />} title="Server Status" value={stats.server} trend="LiveKit Connected" color="green" />
            <StatCard icon={<Activity />} title="Uptime" value={stats.uptime} trend="No issues reported" color="purple" />
          </div>

          {/* Recent Activity */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-6">Recent User Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center font-bold text-dark-900 shadow-lg">U{i}</div>
                    <div>
                      <p className="font-medium">admin{i}@example.com</p>
                      <p className="text-sm text-gray-400">Joined Virtual Space Room</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 px-3 py-1 bg-white/5 rounded-full">{i * 10} mins ago</span>
                </div>
              ))}
            </div>
          </div>
        </fm.div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, trend, color }) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col hover:-translate-y-1 transition-transform">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-gray-400 font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold mb-2">{value}</h3>
      <p className={`text-sm ${colorMap[color].split(' ')[0]}`}>{trend}</p>
    </div>
  );
}
