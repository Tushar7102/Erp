import React, { useEffect, useRef, useState } from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = '',
  overlayClassName = '',
  contentLabel = 'Modal'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  
  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Store the element that had focus before opening modal
      previousFocusRef.current = document.activeElement;
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Match this with CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Handle focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the modal container
      modalRef.current.focus();
    }
    
    // Return focus when modal closes
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);
  
  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Trap focus within modal
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Don't render anything if modal is not open and not animating
  if (!isOpen && !isAnimating) {
    return null;
  }
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${overlayClassName}`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={contentLabel}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 md:mx-auto transform ${
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
        } transition-all duration-300 ${className}`}
      >
        {title && (
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;