import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as fm } from 'framer-motion';
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, mockAuthService } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Background3D from '../components/Background3D';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New Profile Fields
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let userProfile = { email };

      if (auth && db) {
        // Real Firebase Auth & Firestore
        if (isLogin) {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const docRef = doc(db, "users", userCredential.user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            userProfile = docSnap.data();
          }
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          userProfile = { email, nickname, age, gender };
          await setDoc(doc(db, "users", userCredential.user.uid), userProfile);
        }
      } else {
        // Mock Auth
        if (isLogin) {
          await mockAuthService.login(email, password);
          const stored = localStorage.getItem('mockProfile');
          if (stored) userProfile = JSON.parse(stored);
        } else {
          await mockAuthService.signup(email, password);
          userProfile = { email, nickname, age, gender };
          localStorage.setItem('mockProfile', JSON.stringify(userProfile));
        }
      }
      
      // Save globally for avatars
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      navigate('/lobby');
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-dark-900">
      <Background3D />
      
      <fm.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-10 max-w-md w-full relative z-10 m-4 shadow-2xl border-white/20"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-gray-400 text-sm">
            {auth ? 'Secure login powered by Firebase' : 'Running in Demo Mode (No backend required)'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="you@example.com"
              className="bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-600 shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-600 shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <fm.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="flex flex-col gap-5 border-t border-white/10 pt-5 mt-2"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Nickname</label>
                <input 
                  type="text" 
                  required
                  placeholder="CoolGamer99"
                  className="bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">Age</label>
                  <input 
                    type="number" 
                    required
                    placeholder="18"
                    min="5" max="100"
                    className="bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-medium text-gray-300 ml-1">Gender</label>
                  <select 
                    className="bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </fm.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-dark-900 font-bold px-6 py-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] mt-2 flex justify-center items-center h-[56px]"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </fm.div>
    </div>
  );
}
