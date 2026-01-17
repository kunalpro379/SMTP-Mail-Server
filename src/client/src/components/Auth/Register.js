import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, CheckCircle, Send, Inbox, Shield } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.endsWith('@kunalpatil.me')) {
      setError('Only @kunalpatil.me email addresses are allowed');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border-2 border-green-500 rounded-lg w-full max-w-md p-6 sm:p-8 text-center shadow-lg">
          <div className="bg-green-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-green-800 mb-3">Registered Successfully!</h1>
          <p className="text-gray-700 mb-4 text-sm sm:text-base font-medium">Your account has been created successfully.</p>
          <p className="text-base sm:text-lg text-green-700 font-semibold mb-2">Please login now</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm sm:text-base">
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Send className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <span className="font-medium">Send Emails</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="bg-green-100 p-2 rounded-lg">
                <Inbox className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <span className="font-medium">Receive Emails</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <span className="font-medium">Secure & Fast</span>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto">
            Create, manage, and send emails with our reliable mailing service. 
            Experience seamless communication with KPMail.
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white border-2 border-black rounded-lg shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Create Account</h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Join our email platform today</p>
          </div>

        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border-2 border-red-500 text-red-800 rounded-md flex items-start text-sm sm:text-base">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-base min-h-[44px]"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-md focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-base min-h-[44px]"
                placeholder="Confirm your password"
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
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-black hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;