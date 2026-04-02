'use client';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [stats, setStats] = useState({ farmers: 0, diagnoses: 0, markets: 0 });

  useEffect(() => {
    const targets = { farmers: 12500, diagnoses: 45000, markets: 320 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setStats({
        farmers: Math.floor(targets.farmers * eased),
        diagnoses: Math.floor(targets.diagnoses * eased),
        markets: Math.floor(targets.markets * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid-pattern"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-badge animate-fadeInUp">
            <span className="badge badge-success">🎯 SDG 8: Decent Work & Economic Growth</span>
          </div>
          <h1 className="hero-title animate-fadeInUp stagger-1">
            AI-Powered <span className="hero-gradient">Smart Farming</span> Platform
          </h1>
          <p className="hero-subtitle animate-fadeInUp stagger-2">
            Transform your agriculture with machine learning crop disease detection, 
            real-time market intelligence, and a collaborative farming community.
          </p>
          <div className="hero-actions animate-fadeInUp stagger-3">
            <a href="/ai-decision" className="btn btn-primary btn-lg">
              🚀 Get Started
            </a>
            <a href="/disease-detect" className="btn btn-secondary btn-lg">
              🔬 Try Disease Detection
            </a>
          </div>
          <div className="hero-tech-tags animate-fadeInUp stagger-4">
            {['Machine Learning', 'CNN', 'Random Forest', 'Linear Regression', 'IoT', 'Predictive Analytics'].map(tag => (
              <span key={tag} className="tech-tag">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" id="stats-section">
        <div className="container">
          <div className="grid-4">
            <div className="glass-card stat-card animate-fadeInUp stagger-1">
              <div className="stat-icon">👨‍🌾</div>
              <div className="stat-value">{stats.farmers.toLocaleString()}+</div>
              <div className="stat-label">Farmers Empowered</div>
            </div>
            <div className="glass-card stat-card animate-fadeInUp stagger-2">
              <div className="stat-icon">🔬</div>
              <div className="stat-value">{stats.diagnoses.toLocaleString()}+</div>
              <div className="stat-label">Disease Diagnoses</div>
            </div>
            <div className="glass-card stat-card animate-fadeInUp stagger-3">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{stats.markets.toLocaleString()}+</div>
              <div className="stat-label">Markets Connected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features for Modern Farming</h2>
            <p className="section-subtitle">
              Leveraging AI, ML, and IoT to solve real agricultural challenges
            </p>
          </div>
          <div className="grid-3">
            {features.map((feature, i) => (
              <a href={feature.href} key={feature.title} className={`glass-card feature-card animate-fadeInUp stagger-${i % 6 + 1}`}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
                <div className="feature-tech">
                  {feature.tech.map(t => (
                    <span key={t} className="tech-pill">{t}</span>
                  ))}
                </div>
                <span className="feature-arrow">→</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How AgriConnect Works</h2>
            <p className="section-subtitle">Simple steps to transform your farming practices</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={step.title} className={`step-card animate-fadeInUp stagger-${i + 1}`}>
                <div className="step-number">{String(i + 1).padStart(2, '0')}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta-section">
        <div className="container">
          <div className="cta-card glass-card">
            <h2>Ready to Transform Your Farming?</h2>
            <p>Join thousands of farmers using AI-powered tools to increase yields, reduce losses, and access better markets.</p>
            <div className="cta-actions">
              <a href="/ai-decision" className="btn btn-primary btn-lg">Get Started Free</a>
              <a href="/community" className="btn btn-secondary btn-lg">Join Community</a>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-page {
          overflow: hidden;
        }

        /* Hero */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: var(--nav-height);
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }
        .hero-orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.3), transparent 70%);
          top: -10%;
          right: -10%;
          animation: float 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.2), transparent 70%);
          bottom: 10%;
          left: -5%;
          animation: float 6s ease-in-out infinite reverse;
        }
        .hero-orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.15), transparent 70%);
          top: 40%;
          left: 30%;
          animation: float 10s ease-in-out infinite;
        }
        .hero-grid-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 60px 0;
        }
        .hero-badge {
          margin-bottom: 24px;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }
        .hero-gradient {
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-secondary);
          max-width: 650px;
          margin: 0 auto 40px;
          line-height: 1.7;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          margin-bottom: 48px;
        }
        .hero-tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }
        .tech-tag {
          padding: 6px 16px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          color: var(--primary-300);
          font-weight: 500;
        }

        /* Stats */
        .stats-section {
          padding: 80px 0;
          position: relative;
        }

        /* Features */
        .features-section {
          padding: 80px 0;
        }
        .section-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 2.4rem;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .section-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          max-width: 500px;
          margin: 0 auto;
        }
        .feature-card {
          display: flex;
          flex-direction: column;
          padding: 32px;
          cursor: pointer;
          text-decoration: none;
          position: relative;
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(34, 197, 94, 0.1);
          border-radius: var(--radius-md);
        }
        .feature-title {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .feature-desc {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 16px;
          flex: 1;
        }
        .feature-tech {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tech-pill {
          padding: 3px 10px;
          background: rgba(14, 165, 233, 0.1);
          border: 1px solid rgba(14, 165, 233, 0.2);
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          color: var(--sky-400);
          font-weight: 500;
        }
        .feature-arrow {
          position: absolute;
          top: 28px;
          right: 28px;
          font-size: 1.2rem;
          color: var(--primary-400);
          opacity: 0;
          transform: translateX(-8px);
          transition: all var(--transition-base);
        }
        .feature-card:hover .feature-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Steps */
        .how-section {
          padding: 80px 0;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .step-card {
          text-align: center;
          padding: 32px 20px;
          position: relative;
        }
        .step-number {
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 900;
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0.3;
          position: absolute;
          top: 8px;
          left: 20px;
        }
        .step-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
        }
        .step-card h3 {
          font-family: var(--font-display);
          font-weight: 700;
          margin-bottom: 8px;
          font-size: 1.05rem;
        }
        .step-card p {
          color: var(--text-secondary);
          font-size: 0.88rem;
          line-height: 1.6;
        }

        /* CTA */
        .cta-section {
          padding: 40px 0;
        }
        .cta-card {
          text-align: center;
          padding: 64px 40px;
          background: linear-gradient(135deg, rgba(22, 101, 52, 0.2) 0%, rgba(20, 83, 45, 0.1) 100%);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .cta-card h2 {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 16px;
        }
        .cta-card p {
          color: var(--text-secondary);
          font-size: 1.05rem;
          max-width: 500px;
          margin: 0 auto 32px;
        }
        .cta-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .hero-title {
            font-size: 2.2rem;
          }
        }
      `}</style>
    </div>
  );
}

const features = [
  {
    icon: '🧠',
    title: 'AI Decision Support',
    desc: 'Get comprehensive farming decisions powered by AI — weather, soil, disease detection, price prediction, and crop recommendations in one place.',
    tech: ['Gemini AI', 'CNN', 'Random Forest', 'Voice I/O'],
    href: '/ai-decision',
  },
  {
    icon: '🔬',
    title: 'Crop Disease Detection',
    desc: 'Upload crop images for instant AI-powered disease diagnosis using Convolutional Neural Networks with treatment recommendations.',
    tech: ['CNN', 'Image Classification', 'TensorFlow'],
    href: '/disease-detect',
  },
  {
    icon: '📈',
    title: 'Market Intelligence',
    desc: 'Real-time crop prices, demand forecasting with Random Forest, and price predictions using Linear Regression models.',
    tech: ['Linear Regression', 'Random Forest', 'Analytics'],
    href: '/market',
  },
  {
    icon: '🌤️',
    title: 'Weather Forecast',
    desc: 'Tailored agricultural weather forecasts with crop-specific advisories and real-time atmospheric monitoring.',
    tech: ['Open-Meteo API', 'Forecasting', 'Alerts'],
    href: '/weather',
  },
  {
    icon: '💬',
    title: 'Community Forum',
    desc: 'Exchange knowledge, share best practices, and collaborate with farmers globally in our vibrant community.',
    tech: ['Knowledge Sharing', 'Collaboration'],
    href: '/community',
  },
];

const steps = [
  { icon: '📸', title: 'Capture & Upload', desc: 'Take a photo of your crop or enter farming data for instant analysis' },
  { icon: '🤖', title: 'AI Analysis', desc: 'Our ML models process your data using CNN, Random Forest & Linear Regression' },
  { icon: '📋', title: 'Get Insights', desc: 'Receive detailed diagnostics, predictions, and actionable recommendations' },
  { icon: '🚀', title: 'Take Action', desc: 'Apply insights to optimize yields, access markets, and grow your farm' },
];
