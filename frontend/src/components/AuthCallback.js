import { useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '@/App';

const AuthCallback = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const { API } = useContext(AppContext);
  
  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processSession = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/');
        return;
      }
      
      const sessionId = sessionIdMatch[1];
      
      try {
        const response = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Session creation failed');
        }
        
        const data = await response.json();
        setUser(data.user);
        
        navigate('/profile', { replace: true });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/', { replace: true });
      }
    };
    
    processSession();
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-white font-mono text-lg">
        AUTHENTICATING...
      </div>
    </div>
  );
};

export default AuthCallback;
