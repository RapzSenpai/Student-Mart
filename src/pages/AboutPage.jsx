import React from 'react'
import '../css/StaticPages.css'

export function AboutPage() {
  return (
    <div className="static-page">
      <div className="static-inner">
        <h1 className="static-title">About StudentMart</h1>
        <p className="static-lead">
          StudentMart is the campus marketplace for school essentials — ordered online, collected
          at your school's pickup point.
        </p>

        <section className="static-section">
          <h2>Our purpose</h2>
          <p>
            StudentMart connects students with the school store through a simple online catalog.
            Browse what is in stock, place an order, and pick it up on campus. There is no shipping
            and no waiting on deliveries.
          </p>
        </section>

        <section className="static-section">
          <h2>How pickup works</h2>
          <p>
            When your order is ready, you collect it from the school pickup point during opening
            hours. Order status moves from Confirmed to Ready for Pickup to Completed, so you always
            know where your order stands.
          </p>
        </section>

        <section className="static-section">
          <h2>Who it's for</h2>
          <ul>
            <li>Students — browse the catalog and place pickup orders.</li>
            <li>Admins — manage the catalog, process incoming orders, and support the school store.</li>
          </ul>
        </section>

        <section className="static-section">
          <h2>Run by the school community</h2>
          <p>
            StudentMart is built to keep essential supplies available and easy to get on campus. It
            is run by and for the school community.
          </p>
        </section>

        <p className="static-note">
          StudentMart is a campus pickup service. It is not a shipping or delivery store.
        </p>
      </div>
    </div>
  )
}
