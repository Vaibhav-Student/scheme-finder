import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch,
  FiShield,
  FiEye,
  FiUserPlus,
  FiCheckCircle,
  FiExternalLink,
  FiArrowRight,
  FiMapPin,
  FiUsers,
  FiLayers,
  FiGrid,
  FiGithub,
  FiTwitter,
  FiLinkedin,
  FiMail,
} from 'react-icons/fi';
import LogoIcon from '../components/LogoIcon';
import './LandingPage.css';

function useScrollAnimation() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    const elements = ref.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useScrollAnimation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-page" ref={containerRef}>
      {/* Navigation */}
      <nav
        className={`landing-nav ${scrolled ? 'scrolled' : ''}`}
        role="navigation"
        aria-label="Landing page navigation"
      >
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <div className="landing-brand-icon" aria-hidden="true">
              <LogoIcon size={24} />
            </div>
            <span className="landing-brand-text">Scheme Finder</span>
          </Link>

          <ul className="landing-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#stats">Statistics</a></li>
          </ul>

          <div className="landing-nav-actions">
            <Link to="/login" className="landing-btn-signin">Sign In</Link>
            <Link to="/signup" className="landing-btn-getstarted">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" id="hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-hero-badge">
              <span className="landing-hero-badge-dot" />
              Trusted by 50,000+ Users
            </div>

            <h1>
              Discover Government
              <br />
              Schemes{' '}
              <span className="gradient-text">You're Eligible For</span>
            </h1>

            <p className="landing-hero-subtitle">
              Your one-stop platform to find, compare, and apply for government
              welfare schemes, scholarships, and benefits across India. Smart
              matching powered by your profile.
            </p>

            <div className="landing-hero-ctas">
              <Link to="/signup" className="landing-btn-primary">
                Find Your Schemes
                <FiArrowRight size={18} />
              </Link>
              <a href="#features" className="landing-btn-outline-white">
                Learn More
              </a>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-hero-illustration">
              <div className="landing-hero-card-float">
                <div className="hero-card-header">
                  <div className="hero-card-icon">
                    <FiCheckCircle size={22} />
                  </div>
                  <div>
                    <div className="hero-card-title">Eligible Schemes</div>
                    <div className="hero-card-subtitle">Based on your profile</div>
                  </div>
                </div>
                <div className="hero-card-schemes">
                  <div className="hero-scheme-item">
                    <span className="hero-scheme-dot green" />
                    <span className="hero-scheme-name">National Scholarship Portal</span>
                    <span className="hero-scheme-badge">Eligible</span>
                  </div>
                  <div className="hero-scheme-item">
                    <span className="hero-scheme-dot blue" />
                    <span className="hero-scheme-name">PM Kisan Yojana</span>
                    <span className="hero-scheme-badge">Eligible</span>
                  </div>
                  <div className="hero-scheme-item">
                    <span className="hero-scheme-dot purple" />
                    <span className="hero-scheme-name">Assistive Device Scheme</span>
                    <span className="hero-scheme-badge">Eligible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-stats" id="stats">
        <div className="landing-stats-inner">
          {[
            { icon: <FiLayers size={24} />, number: '500+', label: 'Schemes Available', color: 'indigo' },
            { icon: <FiGrid size={24} />, number: '10+', label: 'Categories', color: 'purple' },
            { icon: <FiMapPin size={24} />, number: '28', label: 'States Covered', color: 'cyan' },
            { icon: <FiUsers size={24} />, number: '50K+', label: 'Active Users', color: 'green' },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="landing-stat-card animate-on-scroll"
              style={{ transitionDelay: `${idx * 0.1}s` }}
            >
              <div className={`landing-stat-icon ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="landing-stat-number">{stat.number}</div>
              <div className="landing-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features" id="features">
        <div className="landing-section-header animate-on-scroll">
          <div className="landing-section-tag">
            <span className="landing-section-tag-line" />
            Features
            <span className="landing-section-tag-line" />
          </div>
          <h2 className="landing-section-title">Why Choose Scheme Finder?</h2>
          <p className="landing-section-desc">
            We make it effortless to discover and access government welfare
            schemes tailored specifically to your needs.
          </p>
        </div>

        <div className="landing-features-grid">
          {[
            {
              icon: <FiSearch size={26} />,
              title: 'Smart Eligibility Matching',
              desc: 'AI-powered matching engine analyzes your profile to instantly find all government schemes you qualify for — no more manual searching.',
            },
            {
              icon: <FiShield size={26} />,
              title: 'Comprehensive Database',
              desc: 'Access 500+ schemes from central and state governments including scholarships, pensions, financial assistance, and employment programs.',
            },
            {
              icon: <FiEye size={26} />,
              title: 'Accessibility First',
              desc: 'Built with inclusive design — featuring text-to-speech, high contrast mode, adjustable font sizes, and full screen reader support.',
            },
          ].map((feature, idx) => (
            <div
              key={feature.title}
              className="landing-feature-card animate-on-scroll"
              style={{ transitionDelay: `${idx * 0.15}s` }}
            >
              <div className="landing-feature-icon">{feature.icon}</div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-how-it-works" id="how-it-works">
        <div className="landing-section-header animate-on-scroll">
          <div className="landing-section-tag">
            <span className="landing-section-tag-line" />
            Process
            <span className="landing-section-tag-line" />
          </div>
          <h2 className="landing-section-title">How It Works</h2>
          <p className="landing-section-desc">
            Three simple steps to discover your eligible government schemes.
          </p>
        </div>

        <div className="landing-steps">
          {[
            {
              num: '1',
              title: 'Create Your Profile',
              desc: 'Fill in your basic details — state, disability type, income, age, and education to get personalized results.',
            },
            {
              num: '2',
              title: 'Get Matched',
              desc: 'Our smart system instantly analyzes your profile against 500+ government schemes to find your matches.',
            },
            {
              num: '3',
              title: 'Apply Easily',
              desc: 'View scheme details, benefits, and eligibility criteria. Access direct application links to apply instantly.',
            },
          ].map((step, idx) => (
            <div
              key={step.num}
              className="landing-step animate-on-scroll"
              style={{ transitionDelay: `${idx * 0.15}s` }}
            >
              <div className="landing-step-number">{step.num}</div>
              <h3 className="landing-step-title">{step.title}</h3>
              <p className="landing-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-cta-inner animate-on-scroll">
          <h2>Ready to Find Your Eligible Schemes?</h2>
          <p>
            Join thousands of users who have already discovered government
            benefits they never knew they qualified for.
          </p>
          <Link to="/signup" className="landing-btn-white">
            Get Started Free
            <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <Link to="/" className="landing-brand">
                <div className="landing-brand-icon" aria-hidden="true">S</div>
                <span className="landing-brand-text">Scheme Finder</span>
              </Link>
              <p>
                Your trusted platform for discovering government welfare
                schemes, scholarships, and benefits across India.
              </p>
            </div>

            <div className="landing-footer-column">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#stats">Statistics</a></li>
              </ul>
            </div>

            <div className="landing-footer-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Guidelines</a></li>
                <li><a href="#">API Docs</a></li>
              </ul>
            </div>

            <div className="landing-footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <span className="landing-footer-copy">
              © {new Date().getFullYear()} Scheme Finder. All rights reserved.
            </span>
            <div className="landing-footer-socials">
              <button className="landing-footer-social" aria-label="GitHub">
                <FiGithub size={18} />
              </button>
              <button className="landing-footer-social" aria-label="Twitter">
                <FiTwitter size={18} />
              </button>
              <button className="landing-footer-social" aria-label="LinkedIn">
                <FiLinkedin size={18} />
              </button>
              <button className="landing-footer-social" aria-label="Email">
                <FiMail size={18} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
