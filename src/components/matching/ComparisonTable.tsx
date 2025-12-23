import React from 'react'
import { ComparisonItem } from '../../types'

interface ComparisonTableProps {
  comparison: ComparisonItem[]
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ comparison }) => {
  const getMatchLevelColor = (level: string) => {
    switch (level) {
      case 'full':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'missing':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getMatchLevelIcon = (level: string) => {
    switch (level) {
      case 'full':
        return '✓'
      case 'partial':
        return '~'
      case 'missing':
        return '✗'
      default:
        return '?'
    }
  }

  const getMatchLevelText = (level: string) => {
    switch (level) {
      case 'full':
        return 'Vollständig'
      case 'partial':
        return 'Teilweise'
      case 'missing':
        return 'Fehlend'
      default:
        return level
    }
  }

  if (!comparison || comparison.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 Detaillierter Vergleich</h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="text-left p-3 font-semibold text-gray-700">Anforderung</th>
              <th className="text-left p-3 font-semibold text-gray-700">Bewerber Match</th>
              <th className="text-left p-3 font-semibold text-gray-700">Details</th>
              <th className="text-center p-3 font-semibold text-gray-700">Status</th>
              <th className="text-center p-3 font-semibold text-gray-700">Konfidenz</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">
                  <div className="font-medium text-gray-900">{item.requirement}</div>
                </td>
                <td className="p-3">
                  <div className="text-gray-700">{item.applicant_match}</div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-600">{item.details || '-'}</div>
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getMatchLevelColor(item.match_level)}`}>
                    <span className="mr-1">{getMatchLevelIcon(item.match_level)}</span>
                    {getMatchLevelText(item.match_level)}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-lg font-bold text-gray-900">{item.confidence}%</div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end space-x-4 text-sm text-gray-600">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span>Vollständig ({comparison.filter(c => c.match_level === 'full').length})</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
          <span>Teilweise ({comparison.filter(c => c.match_level === 'partial').length})</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
          <span>Fehlend ({comparison.filter(c => c.match_level === 'missing').length})</span>
        </div>
      </div>
    </div>
  )
}

export default ComparisonTable
