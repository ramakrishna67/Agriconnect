'use client';
import { useState } from 'react';

const samplePosts = [
  { id: 1, author: 'Rajesh Kumar', avatar: '👨‍🌾', title: 'Best practices for organic tomato farming?', content: 'I am planning to start organic tomato farming this season. What are the best practices for soil preparation and pest management without chemicals?', category: 'Organic Farming', time: '2 hours ago', likes: 24, replies: [
    { id: 1, author: 'Dr. Priya Sharma', avatar: '👩‍🔬', content: 'For organic tomato farming, start with composting 3 months before planting. Use neem oil spray for pest control and companion planting with basil.', time: '1 hour ago', likes: 12 },
    { id: 2, author: 'Mohan Singh', avatar: '👨‍🌾', content: 'I have been doing organic tomatoes for 5 years. Mulching is key - use straw mulch to retain moisture and suppress weeds.', time: '45 min ago', likes: 8 },
  ]},
  { id: 2, author: 'Sunil Patil', avatar: '👨‍🌾', title: 'Dealing with water scarcity - drip irrigation tips', content: 'Our region is facing water shortage. Looking for practical drip irrigation setup advice for a 2-acre farm.', category: 'Irrigation', time: '5 hours ago', likes: 31, replies: [
    { id: 1, author: 'Amit Deshmukh', avatar: '🧑‍🔧', content: 'I installed a drip system from Jain Irrigation last year. Cost around ₹15,000 per acre but saved 60% water compared to flood irrigation.', time: '3 hours ago', likes: 15 },
  ]},
  { id: 3, author: 'Lakshmi Devi', avatar: '👩‍🌾', title: 'Success with intercropping maize and beans', content: 'Sharing my experience: intercropping maize with beans increased my yield by 30% and improved soil nitrogen. Happy to answer questions!', category: 'Crop Management', time: '1 day ago', likes: 56, replies: [] },
  { id: 4, author: 'Vikram Singh', avatar: '👨‍🌾', title: 'Government subsidies for solar pumps - how to apply?', content: 'Has anyone successfully applied for the PM-KUSUM solar pump subsidy? What documents are needed?', category: 'Government Schemes', time: '2 days ago', likes: 43, replies: [] },
];

const categories = ['All', 'Organic Farming', 'Irrigation', 'Crop Management', 'Government Schemes', 'Market Discussion'];

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedPost, setExpandedPost] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newReply, setNewReply] = useState('');

  const filtered = activeCategory === 'All' ? samplePosts : samplePosts.filter(p => p.category === activeCategory);

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>💬 Community Forum</h1>
          <p>Exchange knowledge, share best practices, and collaborate with farmers worldwide</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
            {categories.map(c => (
              <button key={c} className={`tab ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>{c}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowNewPost(!showNewPost)}>+ New Post</button>
        </div>

        {showNewPost && (
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>📝 Create New Post</h3>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" placeholder="What's your question or topic?" /></div>
            <div className="form-group"><label className="form-label">Category</label><select className="form-select">{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Content</label><textarea className="form-input" rows={4} placeholder="Share your knowledge or ask a question..."></textarea></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary">Post</button>
              <button className="btn btn-secondary" onClick={() => setShowNewPost(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(post => (
            <div key={post.id} className="glass-card">
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ fontSize: '2rem', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-full)', flexShrink: 0 }}>{post.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer' }} onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>{post.title}</h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{post.author} • {post.time}</div>
                    </div>
                    <span className="badge badge-info">{post.category}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 12 }}>{post.content}</p>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.82rem' }}>👍 {post.likes}</button>
                    <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>💬 {post.replies.length} replies</button>
                  </div>

                  {expandedPost === post.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
                      {post.replies.map(reply => (
                        <div key={reply.id} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', marginBottom: 8, borderLeft: '3px solid var(--primary-700)' }}>
                          <span style={{ fontSize: '1.4rem' }}>{reply.avatar}</span>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{reply.author} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>• {reply.time}</span></div>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reply.content}</p>
                            <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.78rem', marginTop: 6, padding: '4px 10px' }}>👍 {reply.likes}</button>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <input className="form-input" placeholder="Write a reply..." value={newReply} onChange={e => setNewReply(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn btn-primary btn-sm">Reply</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
