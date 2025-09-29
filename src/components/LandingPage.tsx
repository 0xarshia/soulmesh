import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, TestTube, MessageCircle, Brain, Sparkles, Play, Users, Heart, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleTestExtension = () => {
    navigate('/test');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-pink-500 rounded-full opacity-35 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full opacity-35 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full opacity-35 blur-3xl animate-pulse delay-10000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
              SoulMesh AI
            </span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-300 hover:text-pink-400 transition-colors">Features</a>
            <a href="#video" className="text-gray-300 hover:text-blue-400 transition-colors">Demo</a>
            <a href="#about" className="text-gray-300 hover:text-purple-400 transition-colors">About</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              Master the Art of
              <br />
              <span className="text-white">Digital Romance</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
              Transform your conversations with AI-powered reply suggestions that captivate, charm, and connect you with your perfect match.
            </p>
          </div>

          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button 
            onClick={() => window.open('https://github.com/0xarshia/SoulMeshAi-Extension', '_blank')}
            className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl text-white font-semibold text-lg shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3">
                <Download className="w-6 h-6" />
                <span>Install Extension</span>
              </div>
            </button>
            
            <button 
              onClick={handleTestExtension}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3">
                <TestTube className="w-6 h-6" />
                <span>Test Extension (Without Install)</span>
              </div>
            </button>
          </div>

          {/* Hero Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="group p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-pink-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Replies</h3>
              <p className="text-gray-400">Get perfect conversation starters and witty responses instantly</p>
            </div>
            
            <div className="group p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Chatbot</h3>
              <p className="text-gray-400">Personal relationship coach available 24/7 for guidance</p>
            </div>
            
            <div className="group p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant Magic</h3>
              <p className="text-gray-400">One-click copy & paste for seamless conversation flow</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
              Features That Transform Conversations
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              SoulMesh AI combines advanced artificial intelligence with deep understanding of human connection to elevate your dating game.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="group">
              <div className="p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-pink-500/30 transition-all duration-500 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Instant Reply Suggestions</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Simply select any message and click our "Replay" button to get a curated list of charming, witty, and engaging responses tailored to the conversation context.
                </p>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>Context-aware suggestions</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>Multiple style options</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>One-click copy to clipboard</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="group">
              <div className="p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-3xl border border-white/10 hover:border-blue-500/30 transition-all duration-500 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Personal Relationship Coach</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Access our advanced SoulMesh chatbot AI that provides personalized relationship advice, conversation strategies, and confidence-building tips.
                </p>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>24/7 relationship guidance</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Personalized conversation strategies</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Confidence building techniques</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            See SoulMesh AI in Action
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Watch how our extension transforms ordinary conversations into captivating connections
          </p>
          
          <div className="relative group">
            <div className="aspect-video bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl border border-white/20 flex items-center justify-center overflow-hidden">
              {/* Placeholder for video - you'll replace this with your YouTube embed */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
                <p className="text-gray-300 text-lg">Click to watch demo video</p>
                <p className="text-gray-500 text-sm mt-2">YouTube video will be embedded here</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
              SoulMesh AI
            </span>
          </div>
          <p className="text-gray-400 mb-8">
            Empowering meaningful connections through intelligent conversation
          </p>
          <div className="flex justify-center space-x-8 text-gray-500 text-sm">
            <a href="#" className="hover:text-pink-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;