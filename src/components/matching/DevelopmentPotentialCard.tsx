import React, { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { DevelopmentPotential } from '../../types'

interface DevelopmentPotentialCardProps {
  developmentPotential: DevelopmentPotential
}

const DevelopmentPotentialCard: React.FC<DevelopmentPotentialCardProps> = ({
  developmentPotential,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 60) return 'bg-blue-600'
    if (score >= 40) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Sehr Hoch'
    if (score >= 60) return 'Hoch'
    if (score >= 40) return 'Mittel'
    return 'Niedrig'
  }

  if (!developmentPotential) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <TrendingUp className="text-blue-600" size={24} />
          <h3 className="text-2xl font-bold text-gray-800">📈 Entwicklungspotenzial</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-gray-600" size={24} />
        ) : (
          <ChevronDown className="text-gray-600" size={24} />
        )}
      </div>

      <div className="mt-6">
        {/* Score Display */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Gesamtpotenzial</span>
            <span className="text-sm font-semibold text-gray-900">
              {developmentPotential.score}/100 - {getScoreLabel(developmentPotential.score)}
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor(developmentPotential.score)} transition-all duration-500 rounded-full`}
              style={{ width: `${developmentPotential.score}%` }}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-6">
            {/* Timeline */}
            {developmentPotential.timeline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 font-semibold">⏱️ Zeitrahmen:</span>
                  <span className="text-gray-800">{developmentPotential.timeline}</span>
                </div>
              </div>
            )}

            {/* Development Areas */}
            {developmentPotential.areas && developmentPotential.areas.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">🎯 Entwicklungsbereiche</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {developmentPotential.areas.map((area, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">▸</span>
                        <span className="text-gray-800 font-medium">{area}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {developmentPotential.recommendations && developmentPotential.recommendations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">💡 Entwicklungsempfehlungen</h4>
                <ul className="space-y-2">
                  {developmentPotential.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200"
                    >
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong className="text-indigo-900">Hinweis:</strong> Das Entwicklungspotenzial
                basiert auf der Analyse der aktuellen Fähigkeiten und Erfahrungen im Verhältnis zu
                den Anforderungen. Regelmäßige Evaluierungen und Feedbackgespräche können helfen,
                das Potenzial zu realisieren.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DevelopmentPotentialCard
