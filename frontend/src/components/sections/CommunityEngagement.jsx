import { useState } from 'react';

export default function CommunityEngagement() {
  const [postType, setPostType] = useState('Farm Story');
  const [isPublic, setIsPublic] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const postData = {
      post_type: postType,
      is_public: isPublic,
      title: title,
      description: description
    };

    try {
      const response = await fetch('http://localhost:8000/api/community-posts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        alert('Post published!');
        setTitle('');
        setDescription('');
        setPostType('Farm Story');
        setIsPublic(false);
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
      <h1 style={{ color: '#a3e635', textAlign: 'center' }}>Community Engagement</h1>
      
      <form className="producer-form" onSubmit={handleSubmit}>
        
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

        <label style={{ color: '#333' }}>What are you sharing today?</label>
        <select 
          value={postType} 
          onChange={(e) => setPostType(e.target.value)}
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="Farm Story">Farm Story</option>
          <option value="Recipe">Recipe</option>
        </select>

        <label style={{ color: '#333' }}>Title</label>
        <input 
          type="text" 
          placeholder="e.g., The Secret to Our Award-Winning Carrots" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required 
          style={{ background: '#fff', color: '#333' }}
        />

        <label style={{ color: '#333' }}>Description</label>
        <textarea 
          placeholder="Share your story or the full recipe here..." 
          rows="8" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required 
          style={{ 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #ccc',
            background: '#fff',
            color: '#333'
          }}
        />

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