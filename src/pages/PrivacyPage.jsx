import React from 'react'
import '../css/StaticPages.css'

export function PrivacyPage() {
  return (
    <div className="static-page">
      <div className="static-inner">
        <h1 className="static-title">Privacy</h1>
        <p className="static-lead">A plain summary of what StudentMart collects and why.</p>

        <section className="static-section">
          <h2>Account information</h2>
          <p>
            When you register, we store your email, display name, and role (student or
            admin). If your school uses student IDs, that is stored too.
          </p>
        </section>

        <section className="static-section">
          <h2>Order information</h2>
          <p>
            Order details — items, quantities, total, pickup location, and status — are stored so
            you and the school store can track each order through pickup.
          </p>
        </section>

        <section className="static-section">
          <h2>How it's used</h2>
          <p>
            Your information is used only to operate StudentMart: processing orders, managing the
            catalog, and coordinating pickup. We do not sell your data.
          </p>
        </section>

        <section className="static-section">
          <h2>Where it's stored</h2>
          <p>
            Data is stored in Firebase, the platform powering this app. Standard account and security
            controls apply to everything saved here.
          </p>
        </section>

        <section className="static-section">
          <h2>Your choices</h2>
          <p>
            You can review your profile and order history from within the app. For other requests,
            contact the school store.
          </p>
        </section>

        <p className="static-note">
          This page is a plain summary for the school community, not legal advice.
        </p>
      </div>
    </div>
  )
}
