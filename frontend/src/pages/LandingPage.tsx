import './LandingPage.css';
import { FaCogs, FaCalendarAlt, FaPhoneAlt, FaRobot, FaChartBar, FaShieldAlt } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <main className="landing-page page-container">
      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <h1>Alora - All-In-One Organization Management</h1>
          <p>Manage teams, events, communication & more with ease.</p>
          <div className="landing-hero-buttons">
            <a href="#features" className="btn-primary">Get Started Free</a>
            <a href="#learn" className="btn-secondary">Learn More ↓</a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="landing-section">
        <h2>Everything Your Organization Needs</h2>
        <div className="features-grid">
          <div className="feature-card">
            <FaCogs className="icon" />
            <h3>Unified Management</h3>
            <p>Manage teams, roles, and departments in one place.</p>
          </div>
          <div className="feature-card">
            <FaCalendarAlt className="icon" />
            <h3>Event Scheduling</h3>
            <p>Plan events, sync calendars, and automate RSVPs.</p>
          </div>
          <div className="feature-card">
            <FaPhoneAlt className="icon" />
            <h3>Integrated Communication</h3>
            <p>Built-in phone, fax, SMS, and email tools included.</p>
          </div>
        </div>
      </section>

      {/* Extra Capabilities */}
      <section id="learn" className="landing-section alt-bg">
        <h2>Smart Tools to Do More</h2>
        <ul className="capabilities-list">
          <li><FaRobot /> Custom Workflows & Automations</li>
          <li><FaChartBar /> Real-time Analytics & Reports</li>
          <li><FaShieldAlt /> Secure & Compliant (GDPR, HIPAA, SOC 2)</li>
        </ul>
      </section>

      {/* Testimonials */}
      <section className="landing-section testimonials">
        <h2>What Our Users Say</h2>
        <blockquote>
          “Alora has revolutionized how we operate. Our teams are more aligned than ever.”
          <cite>- Maria G., Director at CivicHealth</cite>
        </blockquote>
      </section>

      {/* Pricing */}
      <section className="landing-section">
        <h2>Simple, Scalable Pricing</h2>
        <div className="pricing-grid">
          <div className="plan-card">
            <h3>Free</h3>
            <p>Up to 10 users, basic features</p>
          </div>
          <div className="plan-card">
            <h3>Growth</h3>
            <p>$15/user/mo - Full access, support, integrations</p>
          </div>
          <div className="plan-card">
            <h3>Enterprise</h3>
            <p>Custom plan with white-label and SLA</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2025 Alora. All rights reserved.</p>
        <nav>
          <a href="#">About</a> | 
          <a href="#">Blog</a> | 
          <a href="#">Contact</a> | 
          <a href="#">Privacy</a>
        </nav>
      </footer>
    </main>
  );
};