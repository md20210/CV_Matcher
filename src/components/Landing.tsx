import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 animate-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Willkommen bei{' '}
            <span className="text-primary-600 bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
              CV Matcher
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-6 max-w-3xl mx-auto font-medium leading-relaxed">
            KI-gestützte Lebenslauf-Analyse für perfekte Job-Matches
          </p>
          <p className="text-base md:text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Analysieren Sie Lebensläufe und Stellenbeschreibungen mit modernster
            KI-Technologie. Finden Sie die besten Kandidaten oder optimieren Sie
            Ihre Bewerbung für Ihren Traumjob.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  Zum Dashboard
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/matcher"
                  className="group inline-flex items-center px-8 py-4 border-2 border-primary-600 text-base font-semibold rounded-lg text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  CV Matcher starten
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group inline-flex items-center px-8 py-4 border border-transparent text-base font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  Anmelden
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/register"
                  className="group inline-flex items-center px-8 py-4 border-2 border-primary-600 text-base font-semibold rounded-lg text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-4 focus:ring-primary-300 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  Konto erstellen
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="group bg-white rounded-xl shadow-md hover:shadow-2xl p-8 transition-all duration-300 hover:scale-105 transform border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors duration-300">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              CV-Analyse
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Laden Sie Lebensläufe hoch und lassen Sie sie automatisch von KI
              analysieren und strukturieren.
            </p>
          </div>

          <div className="group bg-white rounded-xl shadow-md hover:shadow-2xl p-8 transition-all duration-300 hover:scale-105 transform border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors duration-300">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Job-Matching
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Vergleichen Sie Lebensläufe mit Stellenbeschreibungen und erhalten
              Sie detaillierte Match-Scores.
            </p>
          </div>

          <div className="group bg-white rounded-xl shadow-md hover:shadow-2xl p-8 transition-all duration-300 hover:scale-105 transform border border-gray-100 hover:border-primary-200">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors duration-300">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              KI-Empfehlungen
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Erhalten Sie intelligente Empfehlungen zur Verbesserung von
              Bewerbungen und Stellenanzeigen.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
