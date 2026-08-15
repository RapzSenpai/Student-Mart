import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Search, CreditCard, MapPin, History, PackageCheck } from 'lucide-react'
import { StudentMartLogo } from '../components/StudentMartLogo'
import bgImage from '../assets/bg.jpg'
import logoCctc from '../assets/logocctc.png'
import '../css/LandingPage.css'

const BENEFITS = [
  {
    icon: ShoppingBag,
    title: 'Convenient ordering',
    desc: 'Place orders for essentials from your phone, any time.',
  },
  {
    icon: Search,
    title: 'Easy browsing',
    desc: 'Filter by category and find what you need fast.',
  },
  {
    icon: CreditCard,
    title: 'Simple checkout',
    desc: 'A short, student-friendly checkout with no surprises.',
  },
  {
    icon: MapPin,
    title: 'Pickup-based',
    desc: 'No shipping — collect your order at the school pickup point.',
  },
  {
    icon: History,
    title: 'Order history',
    desc: 'Track every order and its current pickup status.',
  },
  {
    icon: PackageCheck,
    title: 'Stock visibility',
    desc: 'See what is in stock before you commit to an order.',
  },
]

export function LandingPage() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero" style={{ '--hero-bg': `url(${bgImage})` }}>
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">School pickup marketplace</span>
            <h1 className="landing-title">
              School supplies, ordered online.
              <br />
              Picked up on campus.
            </h1>
            <p className="landing-subtext">
              Browse, order, and collect school essentials at your campus pickup point.
            </p>
            <div className="landing-cta">
              <Link to="/store" className="btn btn-primary landing-btn-lg">
                Browse the Store
              </Link>
              <a href="#why" className="btn btn-ghost landing-btn-lg">
                How it works
              </a>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-logo-circle">
              <img src={logoCctc} alt="Consolatrix College of Toledo City" />
            </div>
          </div>
        </div>
      </section>

      {/* Why StudentMart */}
      <section id="why" className="landing-why">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Why StudentMart?</h2>
          <p className="landing-section-sub">
            Built for a school store with physical pickup — not shipped e-commerce.
          </p>

          <div className="landing-benefits">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="landing-benefit">
                <div className="landing-benefit-icon">
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <h3 className="landing-benefit-title">{title}</h3>
                <p className="landing-benefit-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thank you / closing */}
      <section className="landing-thanks">
        <div className="landing-section-inner landing-thanks-inner">
          <h2 className="landing-section-title">Thanks for supporting your school store.</h2>
          <p className="landing-section-sub">
            Every order helps keep essential supplies available on campus.
          </p>
          <Link to="/store" className="btn btn-primary landing-btn-lg">
            Start browsing
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <StudentMartLogo useImage markSize={28} textClassName="text-lg" />
          <nav className="landing-footer-links">
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
          <p className="landing-footer-copy">© 2026 StudentMart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
