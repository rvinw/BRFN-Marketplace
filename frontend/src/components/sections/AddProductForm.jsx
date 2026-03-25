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
    
    if (name === 'stockQuantity') {
      const num = parseInt(value);
      if (num < 0 || num > 1000) return;
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('unit_amount', formData.unitAmount);
    formDataToSend.append('availability', formData.availability);
    formDataToSend.append('stock_quantity', formData.stockQuantity);
    formDataToSend.append('allergy_info', formData.allergyInfo);
    formDataToSend.append('harvest_date', formData.harvestDate);
    
    const imageInput = document.querySelector('input[type="file"]');
    if (imageInput.files[0]) {
      formDataToSend.append('product_image', imageInput.files[0]);
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/products/', {
        method: 'POST',
        body: formDataToSend,
      });
      
      if (response.ok) {
        alert('Product added!');
        window.location.reload();
      } else {
        alert('Error - check console');
        console.error(await response.json());
      }
    } catch (error) {
      alert('Error - check console');
      console.error(error);
    }
  };

  return (
    <div className="form-container">
      
      <form className="producer-form" onSubmit={handleSubmit}>
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
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{ 
        position: 'absolute', 
        left: '12px', 
        color: '#333', 
        fontWeight: 'bold',
        pointerEvents: 'none'
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
          paddingLeft: '28px',
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