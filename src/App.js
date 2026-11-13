import React, { useState } from 'react';
import axios from 'axios';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ProductGrid from './components/ProductGrid';
import ComparisonView from './components/ComparisonView';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query, type = 'search') => {
    setLoading(true);
    try {
      let response;
      if (type === 'url') {
        response = await axios.post('/api/compare/url', { url: query });
      } else {
        response = await axios.get(`/api/search?q=${query}`);
      }
      console.log("API response:", response.data);
      setResults(response.data);
    } catch (error) {
      console.error("API error:", error);
      setResults({ error: "Failed to fetch data" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <SearchBar onSearch={handleSearch} loading={loading} />
        {results && <ComparisonView data={results} />}
        {!results && !loading && <ProductGrid />}
      </main>
    </div>
  );
}

export default App;
