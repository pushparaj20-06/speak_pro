import { motion as fm } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Video, MessageSquare, Compass, Lock } from 'lucide-react';
import Background3D from '../components/Background3D';

export default function Home() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <Background3D />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        <fm.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl flex flex-col items-center"
        >
          {/* Badge */}
          <fm.div variants={itemVariants} className="mb-6">
            <span className="glass-panel px-4 py-1.5 text-sm font-medium text-primary-300 inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
              Welcome to the Next Era of Interaction
            </span>
          </fm.div>
          
          {/* Headline */}
          <fm.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Welcome to <br className="hidden md:block" />
            <span className="text-gradient">SPEAK PRO</span>
          </fm.h1>
          
          {/* Description */}
          <fm.p variants={itemVariants} className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10">
            Experience real-time communication, spatial audio, and interactive 3D environments all in your browser. Powered by LiveKit & Three.js.
          </fm.p>
          
          {/* Call to Actions */}
          <fm.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary-500 hover:bg-primary-400 text-dark-900 font-semibold px-8 py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 shadow-lg shadow-primary-500/20 group"
            >
              Get Started 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="glass-panel hover:bg-white/10 text-white font-medium px-8 py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105">
              Explore Spaces
            </button>
          </fm.div>
        </fm.div>

        {/* Feature Highlights */}
        <fm.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {[
            { icon: <Video className="w-6 h-6 text-primary-400" />, title: "Real-time Video", desc: "Ultra-low latency streaming with LiveKit." },
            { icon: <Compass className="w-6 h-6 text-primary-400" />, title: "3D Environments", desc: "Immersive spatial experiences in your browser." },
            { icon: <MessageSquare className="w-6 h-6 text-primary-400" />, title: "Instant Chat", desc: "Synced real-time communication using Firebase." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-6 flex flex-col items-start text-left hover:-translate-y-1 transition-transform duration-300 cursor-default">
              <div className="bg-white/5 p-3 rounded-xl mb-4 border border-white/5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </fm.div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 w-full text-center z-10">
        <button 
          onClick={() => navigate('/admin')}
          className="text-xs text-gray-500 hover:text-primary-400 transition-colors flex items-center justify-center gap-1 mx-auto"
        >
          <Lock className="w-3 h-3" /> Admin Portal
        </button>
      </footer>
    </div>
  );
}
