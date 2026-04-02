import './globals.css';
import VoiceAssistant from './components/VoiceAssistant';


export const metadata = {
  title: 'AgriConnect - AI-Powered Smart Farming Platform',
  description: 'Transform agriculture with AI-driven crop disease detection, market intelligence, and community collaboration. Empowering farmers with cutting-edge technology.',
  keywords: 'Agriculture, AI, Machine Learning, Crop Disease Detection, Market Intelligence, Farming, AgriConnect',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar" id="main-navbar">
          <div className="container nav-container">
            <a href="/" className="nav-logo">
              <span className="logo-icon">🌾</span>
              <span className="logo-text">Agri<span className="logo-accent">Connect</span></span>
            </a>
            <div className="nav-links">
              <a href="/ai-decision" className="nav-link">AI Decision</a>
              <a href="/dashboard" className="nav-link">Dashboard</a>
              <a href="/disease-detect" className="nav-link">Disease Detection</a>
              <a href="/market" className="nav-link">Market</a>
              <a href="/irrigation" className="nav-link">Irrigation</a>
              <a href="/weather" className="nav-link">Weather</a>
              <a href="/community" className="nav-link">Community</a>

            </div>
            <div className="nav-actions">
              <a href="/ai-decision" className="btn btn-primary btn-sm" id="get-started-btn">Get Started</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <VoiceAssistant />
        <footer className="footer" id="main-footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <div className="footer-logo">
                  <span>🌾</span>
                  <span className="footer-logo-text">AgriConnect</span>
                </div>
                <p className="footer-desc">
                  Empowering farmers with AI-driven insights, market intelligence, and community collaboration for sustainable agriculture.
                </p>
                <p className="footer-sdg">🎯 Aligned with SDG 8: Decent Work and Economic Growth</p>
              </div>
              <div className="footer-col">
                <h4>Platform</h4>
                <a href="/disease-detect">Disease Detection</a>
                <a href="/market">Market Intelligence</a>
                <a href="/weather">Weather Forecast</a>
              </div>
              <div className="footer-col">
                <h4>Community</h4>
                <a href="/community">Forum</a>
                <a href="/dashboard">Dashboard</a>
              </div>
              <div className="footer-col">
                <h4>Technology</h4>
                <span>Machine Learning</span>
                <span>CNN Image Analysis</span>
                <span>Predictive Analytics</span>
                <span>IoT Integration</span>
              </div>
            </div>
            <div className="footer-bottom">
              <p>© 2026 AgriConnect. Built with ❤️ for farmers worldwide.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
