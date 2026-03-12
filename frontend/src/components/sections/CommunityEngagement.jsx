import { useState } from 'react';

export default function CommunityEngagement() {
  const [postType, setPostType] = useState('Farm Story');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // This is where we will eventually send data to Django
    console.log("Post Submitted:", { postType, isPublic });
  };

  return (
    <div className="form-container">
      <h1 style={{ color: '#a3e635', textAlign: 'center' }}>Community Engagement</h1>
      
      <form className="producer-form" onSubmit={handleSubmit}>
        
        {/* 1. The Checkbox at the Top */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '20px',
          padding: '10px',
          background: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <input 
            type="checkbox" 
            id="feature-checkbox" 
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }} 
          />
          <label htmlFor="feature-checkbox" style={{ color: '#333', marginBottom: 0, cursor: 'pointer' }}>
            Feature this on the Marketplace Home Page?
          </label>
        </div>

        {/* 2. Dropdown Menu */}
        <label style={{ color: '#333' }}>What are you sharing today?</label>
        <select 
          value={postType} 
          onChange={(e) => setPostType(e.target.value)}
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="Farm Story">Farm Story</option>
          <option value="Recipe">Recipe</option>
        </select>

        {/* 3. Title */}
        <label style={{ color: '#333' }}>Title</label>
        <input 
          type="text" 
          placeholder="e.g., The Secret to Our Award-Winning Carrots" 
          required 
          style={{ background: '#fff', color: '#333' }}
        />

        {/* 4. Description */}
        <label style={{ color: '#333' }}>Description</label>
        <textarea 
          placeholder="Share your story or the full recipe here..." 
          rows="8" 
          required 
          style={{ 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #ccc',
            background: '#fff',
            color: '#333'
          }}
        />

        {/* 5. Submit Button */}
        <button type="submit" className="navitem" style={{ 
          backgroundColor: '#a3e635', 
          color: 'black', 
          fontWeight: 'bold',
          marginTop: '20px',
          padding: '15px',
          justifyContent: 'center',
          fontSize: '1rem'
        }}>
          Publish to Community
        </button>
      </form>
    </div>
  );
}