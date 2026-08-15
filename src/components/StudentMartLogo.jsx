import React from 'react'
import studentmartLogo from '../assets/studentmart.png'

export function StudentMartLogo({
  className = '',
  markSize = 36,
  textClassName = '',
  useImage = false,
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {useImage ? (
        <img
          src={studentmartLogo}
          alt="StudentMart"
          className="sm-logo-img"
          style={{ height: markSize, width: 'auto' }}
        />
      ) : (
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="smGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#smGrad)" />
          <rect x="10" y="15" width="20" height="16" rx="3" fill="none" stroke="white" strokeWidth="2.2" />
          <path
            d="M15 15v-1a5 5 0 0 1 10 0v1"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className={`font-display font-extrabold tracking-tight sm-wordmark ${textClassName}`}>
        Student<span>Mart</span>
      </span>
    </span>
  )
}
