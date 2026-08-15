import React from 'react'
import { MapPin, Clock, Mail } from 'lucide-react'
import '../css/StaticPages.css'

export function ContactPage() {
  return (
    <div className="static-page">
      <div className="static-inner">
        <h1 className="static-title">Contact</h1>
        <p className="static-lead">
          Questions about an order or the school store? Reach out using the details below.
        </p>

        <div className="static-card">
          <h3>
            <MapPin size={16} strokeWidth={1.8} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            School store pickup point
          </h3>
          <p>Main Campus Store. Collect orders during school store opening hours.</p>
        </div>

        <div className="static-card">
          <h3>
            <Clock size={16} strokeWidth={1.8} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Pickup hours
          </h3>
          <p>Pickup is available during the school store's published opening hours.</p>
        </div>

        <div className="static-card">
          <h3>
            <Mail size={16} strokeWidth={1.8} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Email the school store
          </h3>
          <p>
            <a href="mailto:studentmart@school.edu">studentmart@school.edu</a>
            <br />
            We usually reply within a school day.
          </p>
        </div>

        <p className="static-note">
          For order-specific questions, include your order reference so the school store can help
          quickly.
        </p>
      </div>
    </div>
  )
}
