import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, CheckCircle, Send, Inbox, Shield } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate email domain
    if (!formData.email.endsWith('@kunalpatil.me')) {
      setError('Only @kunalpatil.me email addresses are allowed');
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      // Better error message handling
      if (result.error && result.error.toLowerCase().includes('invalid')) {
        setError('Wrong credentials. Please check your email and password.');
      } else if (result.error && result.error.toLowerCase().includes('not found')) {
        setError('Wrong credentials or email not ending with @kunalpatil.me');
      } else {
        setError(result.error || 'Wrong credentials. Please try again.');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        {/* KPMail Promotional Section */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center">
            <div className="bg-black text-white p-3 sm:p-4 rounded-2xl shadow-lg">
              <Mail className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">KPMail</h1>
            <p className="text-base sm:text-lg text-gray-700 font-medium">Professional Email Service</p>
          </div>
          
          {/* Features */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-xs sm:text-base px-2">
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-700">
              <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                <Send className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <span className="font-medium whitespace-nowrap">Send Emails</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-700">
              <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                <Inbox className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <span className="font-medium whitespace-nowrap">Receive Emails</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-700">
              <div className="bg-purple-100 p-1.5 sm:p-2 rounded-lg">
                <Shield className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <span className="font-medium whitespace-nowrap">Secure & Fast</span>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto px-4">
            Create, manage, and send emails with our reliable mailing service at <span className="font-semibold text-black">@kunalpatil.me</span>. 
            Experience seamless communication with KPMail.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border-2 border-black rounded-lg shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Welcome Back</h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Sign in to your email account</p>
          </div>

        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border-2 border-red-500 text-red-800 rounded-md flex items-start text-sm sm:text-base">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 sm:p-4 bg-green-50 border-2 border-green-500 text-green-800 rounded-md flex items-start text-sm sm:text-base">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="font-medium">Login successful! Redirecting to dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-base min-h-[44px]"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-base min-h-[44px]"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 text-base font-medium min-h-[44px]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-black hover:underline font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;