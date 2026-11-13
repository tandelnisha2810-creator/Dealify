import React from 'react';

const ComparisonView = ({ data }) => {
  if (!data || data.error) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-red-600">{data?.error || "No data available"}</p>
      </div>
    );
  }

  if (!data.product) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-gray-600">{data.message || "No products found"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-xl mb-8">
        {/* Show message for similar matches */}
        {data.type === 'similar' && data.message && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-6">
            <p className="text-amber-800 font-semibold">🔍 {data.message}</p>
          </div>
        )}

        <div className="flex items-center gap-6 mb-6">
          <img src={data.product.image} alt={data.product.title} className="w-32 h-32 object-cover rounded-lg" />
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{data.product.title}</h3>
            {data.product.brand && <p className="text-gray-600">{data.product.brand}</p>}
            {data.type && (
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                data.type === 'exact' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {data.type === 'exact' ? 'Exact Match' : 'Similar Products'}
              </span>
            )}
          </div>
        </div>

        {data.bestDeal && (
          <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-800 font-semibold">Best Deal: {data.bestDeal.platform} - ₹{data.bestDeal.price}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.comparison && data.comparison.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-800">{item.platform}</h4>
              <p className="text-2xl font-bold text-blue-600">₹{item.price}</p>
              {item.rating > 0 && <p className="text-yellow-500">⭐ {item.rating}</p>}
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View Product
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;