import React, { useState } from 'react';

export default function AddProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Veg',
    description: '',
    price: '',
    unitAmount: '',
    availability: true,
    stockQuantity: 0,
    allergyInfo: '',
    harvestDate: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Simple validation for the stock quantity
    if (name === 'stockQuantity') {
      const num = parseInt(value);
      if (num < 0 || num > 1000) return; // Ignores the change if out of range
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="form-container">
      
      <form className="producer-form">
        <label>Name</label>
        <input name="name" type="text" onChange={handleChange} />
        <label>Category</label>
        <select name="category" onChange={handleChange}>
          <option value="Dairy">Dairy</option>
          <option value="Fruit">Fruit</option>
          <option value="Veg">Veg</option>
        </select>

        <label>Description</label>
        <textarea name="description" onChange={handleChange} />

        <div style={{ display: 'flex', gap: '20px' }}>
  <div style={{ flex: 1 }}>
    <label>Price</label>
    {/* Wrap the input in a div to hold the £ sign */}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{ 
        position: 'absolute', 
        left: '12px', 
        color: '#333', 
        fontWeight: 'bold',
        pointerEvents: 'none' // Ensures the user clicks 'through' the £ to the input
      }}>
        £
      </span>
      <input 
        name="price" 
        type="number"
        step="0.01"
        placeholder='0.00' 
        onChange={handleChange}
        required 
        style={{ 
          paddingLeft: '28px', // Pushes the text to the right of the £ sign
          width: '100%',
          backgroundColor: '#ffffff',
          color: '#333'
        }}
      />
    </div>
  </div>
          <div style={{ flex: 1 }}>
            <label>Unit Amount</label>
            <input name="unitAmount" type="text" onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label>Stock (0-1000)</label>
            <input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleChange} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Allergy Info</label>
            <input name="allergyInfo" type="text" onChange={handleChange} />
          </div>
        </div>

        <label>Harvest Date & Time</label>
        <input name="harvestDate" type="datetime-local" onChange={handleChange} />

        <label>Product Image</label>
        <input type="file" accept="image/*" />

        <button type="submit" className="navitem" style={{ width: '100%', marginTop: '20px' }}>
          Submit Product
        </button>
      </form>
    </div>
  );
}