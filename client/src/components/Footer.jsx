
import { Globe, Github, Mail } from 'lucide-react';
import { useState } from 'react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Thank you for subscribing! Check your email for confirmation.');
        setMessageType('success');
        setEmail('');
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white py-8 rounded-2xl">
      <div className="container mx-auto px-4">
        <div className="space-y-6">
          {/* Social Media Links */}
          <div className="flex justify-center gap-4">
            <a
              href="https://2002ahamed.github.io/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors duration-300 group"
            >
              <Globe className="w-5 h-5 text-blue-200 group-hover:text-white" />
            </a>
            <a
              href="https://github.com/2002ahamed"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors duration-300 group"
            >
              <Github className="w-5 h-5 text-blue-200 group-hover:text-white" />
            </a>
            <a
              href="mailto:nafish.ruet21@gmail.com"
              className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors duration-300 group"
            >
              <Mail className="w-5 h-5 text-blue-200 group-hover:text-white" />
            </a>
          </div>

          {/* Newsletter Signup */}
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-2 text-white">
              Stay Updated
            </h4>
            <p className="text-blue-200 text-sm mb-4">
              Get the latest stories and updates delivered to your inbox
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm disabled:opacity-50"
                />
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
            </div>
            
            {/* Message Display */}
            {message && (
              <div className={`mt-3 text-sm ${
                messageType === 'success' 
                  ? 'text-green-200' 
                  : 'text-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Copyright */}
          <div className="text-center pt-4 border-t border-white/20">
            <p className="text-sm font-semibold text-white">
              © 2025 Nafish|BlogSpace
            </p>
            <p className="text-sm mt-1 text-blue-200">
              Empowering voices, one story at a time
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;