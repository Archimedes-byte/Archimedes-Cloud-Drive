import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-page" style={{
      backgroundImage: 'url("/background.jpg")'
    }}>
      <header className="home-header">
        <h1>Archimedes' Cloud Drive</h1>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/register">Register</Link>
        </nav>
      </header>

      <main className="home-content">
        <div className="text-center">
          <h2 className="text-4xl mb-8" style={{ fontFamily: 'KaiTi, serif' }}>
            记录每1份热爱 让美好永远陪伴
          </h2>
          <Link
            href="/auth/login"
            className="btn-primary"
          >
            Go to Login
          </Link>
          <div className="mt-4 text-gray-600">
            Don't have an account? {' '}
            <Link href="/auth/register" className="text-[#5a9bd3] hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>© 2025 Archimedes' Cloud Drive. All rights reserved.</p>
      </footer>
    </div>
  );
} 