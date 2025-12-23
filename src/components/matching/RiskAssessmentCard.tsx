import React, { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { RiskAssessment } from '../../types'

interface RiskAssessmentCardProps {
  riskAssessment: RiskAssessment
}

const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ riskAssessment }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-800 border-green-300',
          icon: '🟢'
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: '🟡'
        }
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800 border-red-300',
          icon: '🔴'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: '⚪'
        }
    }
  }

  const getRiskLevelText = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'Niedriges Risiko'
      case 'medium':
        return 'Mittleres Risiko'
      case 'high':
        return 'Hohes Risiko'
      default:
        return risk
    }
  }

  if (!riskAssessment) {
    return null
  }

  const colors = getRiskLevelColor(riskAssessment.overall_risk)

  return (
    <div className={`rounded-xl shadow-lg border-2 ${colors.bg} ${colors.border} mb-6`}>
      <div
        className="flex items-center justify-between p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <AlertTriangle className={colors.text} size={24} />
          <h3 className="text-2xl font-bold text-gray-800">⚠️ Risikobewertung</h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${colors.badge}`}>
            {colors.icon} {getRiskLevelText(riskAssessment.overall_risk)}
          </span>
          {isExpanded ? (
            <ChevronUp className="text-gray-600" size={24} />
          ) : (
            <ChevronDown className="text-gray-600" size={24} />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Risk Factors */}
          {riskAssessment.factors && riskAssessment.factors.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">🔍 Risikofaktoren</h4>
              <ul className="space-y-2">
                {riskAssessment.factors.map((factor, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <span className="text-red-500 mt-0.5">▸</span>
                    <span className="text-gray-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mitigation Strategies */}
          {riskAssessment.mitigation_strategies && riskAssessment.mitigation_strategies.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">💡 Risikominderungsstrategien</h4>
              <ul className="space-y-2">
                {riskAssessment.mitigation_strategies.map((strategy, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-700">{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary Info Box */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Hinweis:</strong> Die Risikobewertung basiert auf der KI-Analyse des Lebenslaufs
              im Verhältnis zur Stellenbeschreibung. Führen Sie zusätzliche Interviews und Referenzprüfungen
              durch, um eine fundierte Entscheidung zu treffen.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RiskAssessmentCard
