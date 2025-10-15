import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInfoProfile } from '../../context/InfoProfileContext';
import InfoFeedbackForm from './components/InfoFeedbackForm';
import InfoStatusBadge from './components/InfoStatusBadge';
import InfoPriorityBadge from './components/InfoPriorityBadge';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, CheckCircle, MessageSquare, Star, ThumbsUp, AlertTriangle, FileText, X } from 'lucide-react';

const FeedbackAndClosure = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { 
    getInfoProfileById, 
    updateInfoProfileStatus,
    addInfoProfileResponse
  } = useInfoProfile();
  
  const [infoProfile, setInfoProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closureNote, setClosureNote] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  
  useEffect(() => {
    const profile = getInfoProfileById(id);
    if (profile) {
      setInfoProfile(profile);
    }
    setLoading(false);
  }, [id, getInfoProfileById]);
  
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      // In a real app, this would be an API call
      console.log('Feedback submitted:', feedbackData);
      setFeedbackSubmitted(true);
      return Promise.resolve();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return Promise.reject(error);
    }
  };
  
  const handleClosureSubmit = (e) => {
    e.preventDefault();
    
    // Add closure note as a response
    if (closureNote.trim()) {
      addInfoProfileResponse(id, {
        message: closureNote,
        userId: 'CURRENT_USER', // In a real app, this would be the current user's ID
        sentVia: 'Internal'
      });
    }
    
    // Update status to Closed
    updateInfoProfileStatus(id, 'Closed');
    
    // Navigate back to info profile detail
    navigate(`/info/${id}`);
  };
  
  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!infoProfile) {
    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg rounded-xl p-6 border`}>
        <div className="text-center">
          <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4 ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
            <AlertTriangle className={`h-8 w-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Info Profile Not Found
          </h2>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No info profile found with ID {id}
          </p>
          <button
            onClick={() => navigate('/info')}
            className={`mt-4 px-4 py-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg shadow-md transition-colors`}
          >
            Back to Info Profile List
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/info/${id}`)}
          className={`flex items-center ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} transition-colors`}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Info Profile
        </button>
      </div>
      
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg rounded-xl overflow-hidden border`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <FileText className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Feedback and Closure
                </h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  {infoProfile.info_id || infoProfile.id} - {infoProfile.description || infoProfile.title}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <InfoStatusBadge status={infoProfile.status} />
              <InfoPriorityBadge priority={infoProfile.priority} />
            </div>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} p-6 rounded-xl`}>
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <ThumbsUp className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Customer Feedback
              </h2>
            </div>
            
            <div className="mb-6">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Satisfaction Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setSatisfactionRating(rating)}
                    className={`p-2 rounded-lg transition-colors ${
                      satisfactionRating >= rating 
                        ? isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-600' 
                        : isDark ? 'bg-gray-600 text-gray-400 hover:bg-gray-500' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    <Star className="h-6 w-6" fill={satisfactionRating >= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            
            <InfoFeedbackForm 
              infoId={infoProfile.id} 
              onSubmit={handleFeedbackSubmit} 
            />
            
            {feedbackSubmitted && (
              <div className={`mt-4 p-4 rounded-lg flex items-center ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'}`}>
                <CheckCircle className="h-5 w-5 mr-2" />
                Feedback submitted successfully!
              </div>
            )}
          </div>
          
          <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} p-6 rounded-xl`}>
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <MessageSquare className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Closure Note
              </h2>
            </div>
            
            <form onSubmit={handleClosureSubmit}>
              <div className="mb-4">
                <label htmlFor="closureNote" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Add a note for closing this request
                </label>
                <textarea
                  id="closureNote"
                  rows="6"
                  value={closureNote}
                  onChange={(e) => setClosureNote(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-700 border-gray-300'
                  } border`}
                  placeholder="Write a note for closing this info request..."
                ></textarea>
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => navigate(`/info/${id}`)}
                  className={`px-4 py-2 rounded-lg border ${
                    isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  } transition-colors flex items-center`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-lg shadow-md transition-colors flex items-center ${
                    isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Close Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackAndClosure;