import { useState, useEffect } from 'react';
import '../styles/ThemeToggle.css';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  
  useEffect(() => {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.body.classList.toggle('light-mode', savedTheme === 'light');
    }
  }, []);
  
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.body.classList.toggle('light-mode', !newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };
  
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? '◑️' : '◐'}
    </button>
  );
} 