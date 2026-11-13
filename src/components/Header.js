import React from 'react';

const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dealify</h1>
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="text-gray-600 hover:text-blue-600">Home</a>
          <a href="#" className="text-gray-600 hover:text-blue-600">Compare</a>
          <a href="#" className="text-gray-600 hover:text-blue-600">Deals</a>
        </nav>
        <button className="bg-gray-200 dark:bg-gray-700 rounded-full p-2">
          🌙
        </button>
      </div>
    </header>
  );
};

export default Header;