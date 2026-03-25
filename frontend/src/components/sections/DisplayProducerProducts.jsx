import React, { useState, useEffect } from 'react';

export default function DisplayProducerProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/products/')
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="product-list">
      <h1>Product List</h1>
      {products.map(product => (
        <div key={product.id} className="product-card">
          {product.product_image && (
            <img src={`http://localhost:8000${product.product_image}`} alt={product.name} />
          )}
          <h3>{product.name}</h3>
          <p>Category: {product.category}</p>
          <p>Price: £{product.price}</p>
          <p>Stock: {product.stock_quantity}</p>
          <p>{product.description}</p>
        </div>
      ))}
    </div>
  );
}