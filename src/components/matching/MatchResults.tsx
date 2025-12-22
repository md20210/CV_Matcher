import React, { useState } from 'react'
import { MatchResult } from '../../types/index'
import { projectsService } from '../../services/projects'
import { Document } from '../../types/index'

interface MatchResultsProps {
  matchResult: MatchResult
  onNewAnalysis: () => void
  onSaveToProject: (document: Document) => void
}

const MatchResults: React.FC<MatchResultsProps> = ({ 
  matchResult, 
  onNewAnalysis,
  onSaveToProject 
}) => {
  const [expanded, setExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Erstelle ein Dokument mit den Analyseergebnissen
      const documentData: Document = {
        id: '',
        user_id: '',
        type: 'text',
        content: JSON.stringify(matchResult, null, 2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        filename: `match-analysis-${Date.now()}.json`
      }
      
      onSaveToProject(documentData)
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Berechne den Fortschritt für den Kreis
  const progress = matchResult.overallScore

  // Kreis-Animation mit SVG
  const CircularProgress = ({ progress }: { progress: number }) => {
    const radius = 40
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Hintergrundkreis */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Fortschrittskreis */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={progress >= 70 ? "#10b981" : progress >= 40 ? "#f59e0b" : "#ef4444"}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          {/* Zentrale Zahl */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dy="0.3em"
            fontSize="20"
            fontWeight="bold"
            fill={progress >= 70 ? "#10b981" : progress >= 40 ? "#f59e0b" : "#ef4444"}
          >
            {progress}
          </text>
        </svg>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Übereinstimmungsanalyse</h2>
        <div className="flex space-x-3">
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200"
          >
            Neue Analyse
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Speichern...
              </>
            ) : (
              'In Projekt speichern'
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center mb-10">
        <div className="mb-6 md:mb-0 md:mr-8">
          <CircularProgress progress={progress} />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Gesamtbewertung</h3>
          <p className="text-gray-600">
            {progress >= 70 
              ? "Sehr gute Übereinstimmung mit der Stellenbeschreibung" 
              : progress >= 40 
                ? "Mäßige Übereinstimmung, es gibt Verbesserungspotenzial" 
                : "Niedrige Übereinstimmung, erhebliche Lücken vorhanden"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Stärken */}
        <div className="bg-green-50 rounded-lg p-5 border border-green-200">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h3 className="text-lg font-semibold text-green-800">Stärken</h3>
          </div>
          <ul className="space-y-2">
            {matchResult.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Lücken */}
        <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h3 className="text-lg font-semibold text-yellow-800">Lücken</h3>
          </div>
          <ul className="space-y-2">
            {matchResult.gaps.map((gap, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span className="text-gray-700">{gap}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Empfehlungen */}
        <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m0 8v8m0 4v1M9.663 5H14.3c4.548 0 8.057 1.099 8.057 5.938 0 4.839-3.509 5.938-8.057 5.938H9.663M9.663 5.938A5.938 5.938 0 0112 12c0 1.657.663 3.17 1.732 4.27M9.663 5.938V5.938z"></path>
            </svg>
            <h3 className="text-lg font-semibold text-blue-800">Empfehlungen</h3>
          </div>
          <ul className="space-y-2">
            {matchResult.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m0 8v8m0 4v1M9.663 5H14.3c4.548 0 8.057 1.099 8.057 5.938 0 4.839-3.509 5.938-8.057 5.938H9.663M9.663 5.938A5.938 5.938 0 0112 12c0 1.657.663 3.17 1.732 4.27M9.663 5.938V5.938z"></path>
                </svg>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left py-2 text-gray-700 hover:text-gray-900"
        >
          <h3 className="text-lg font-semibold">Detaillierte Analyse</h3>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {expanded && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 whitespace-pre-line">{matchResult.detailedAnalysis}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchResults
