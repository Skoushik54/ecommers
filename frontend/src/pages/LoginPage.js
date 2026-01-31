import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/App';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';

const LoginPage = () => {
  const [step, setStep] = useState('EMAIL'); // EMAIL or OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { API, setUser } = useContext(AppContext);
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/login/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: credentialResponse.credential // Send the real token to backend
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.session_token);
        setUser(data.user);
        toast.success(`Welcome ${data.user.name}`);
        navigate('/');
      } else {
        toast.error('Google Sign-In Failed');
      }
    } catch (error) {
      toast.error('Login Error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = async () => {
    setLoading(true);
    toast.success('Connecting to Google (Mock)...');
    try {
      // Simulating OAuth delay
      await new Promise(r => setTimeout(r, 1500));

      const response = await fetch(`${API}/auth/login/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'google_user@example.com' }), // In real app, this comes from Google
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.session_token);
        setUser(data.user);
        toast.success(`Welcome ${data.user.name}`);
        navigate('/');
      } else {
        toast.error('Google Sign-In Failed');
      }
    } catch (error) {
      toast.error('Login Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStep('OTP');
        if (data.dev_code) {
          setOtp(data.dev_code);
          toast.success(`Code sent! (Dev Auto-fill: ${data.dev_code})`);
        } else {
          toast.info('Verification code sent to your email');
        }
      } else {
        toast.error('Failed to send code');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.session_token);
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.name}`);
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        toast.error('Invalid code');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex items-center justify-center bg-[#050505] px-6">
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8 relative z-10"
      >
        <div>
          <h1 className="text-5xl font-bold text-white mb-4 uppercase">
            {step === 'EMAIL' ? 'LOGIN / REGISTER' : 'VERIFY IDENTITY'}
          </h1>
          <p className="text-white/60 font-mono text-sm max-w-xs mx-auto">
            {step === 'EMAIL'
              ? 'ACCESS YOUR ACCOUNT OR CREATE A NEW ONE INSTANTLY.'
              : `CODE SENT TO ${email.toUpperCase()}`
            }
          </p>
        </div>

        {step === 'EMAIL' ? (
          <div className="space-y-6">
            {/* Real Google Login Button */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={() => toast.error('Google Login Failed')}
                theme="filled_black"
                shape="rectangular"
                width="100%"
                logo_alignment="center"
                text="continue_with"
              />
            </div>

            {/* Always show Mock Login for troubleshooting */}
            <button
              type="button"
              onClick={handleGoogleMockLogin}
              className="mt-2 text-xs text-white/40 underline hover:text-white"
            >
              Detailed Mock Login (Dev Only)
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#050505] px-2 text-white/40 font-mono">
                  Or use email
                </span>
              </div>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 text-white px-6 py-4 font-mono focus:outline-none focus:border-white/40 transition-colors"
                data-testid="email-input"
                autoFocus
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'SENDING...' : 'CONTINUE WITH EMAIL'}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full bg-[#1A1A1A] border border-white/10 text-white px-6 py-4 font-mono text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-white/40 transition-colors"
              data-testid="otp-input"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'VERIFYING...' : 'VERIFY & ENTER'}
            </button>

            <button
              type="button"
              onClick={() => setStep('EMAIL')}
              className="text-white/40 text-xs font-mono hover:text-white"
            >
              TRY DIFFERENT EMAIL
            </button>
          </form>
        )}

        <p className="text-white/40 text-xs font-mono">
          By continuing, you agree to RARE's Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
