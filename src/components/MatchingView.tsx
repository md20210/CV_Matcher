import { useState, useRef, useMemo } from 'react';
import { Play, Loader, Download } from 'lucide-react';
import { llmService } from '../services/llm';
import { Chat } from './Chat';
import { pdfService } from '../services/pdf';
import type { ChatMessage, InMemoryDocument } from '../services/chat';
import { useLanguage } from '../contexts/LanguageContext';

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  side: 'employer' | 'applicant';
}

interface MatchingViewProps {
  employerDocs: Document[];
  applicantDocs: Document[];
  llmType: 'local' | 'grok';
  onMatchComplete: (result: any) => void;
  matchResult: any;
}

export default function MatchingView({ employerDocs, applicantDocs, llmType, onMatchComplete, matchResult }: MatchingViewProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const chatMessagesRef = useRef<ChatMessage[]>([]);

  // Convert documents to InMemoryDocument format for RAG
  const inMemoryDocuments = useMemo((): InMemoryDocument[] => {
    const docs: InMemoryDocument[] = [];

    // Add employer documents
    employerDocs.forEach(doc => {
      docs.push({
        filename: doc.name,
        content: doc.content,
        type: 'employer'
      });
    });

    // Add applicant documents
    applicantDocs.forEach(doc => {
      docs.push({
        filename: doc.name,
        content: doc.content,
        type: 'applicant'
      });
    });

    return docs;
  }, [employerDocs, applicantDocs]);

  const handleDownloadPDF = async () => {
    if (!matchResult) return;

    setPdfLoading(true);
    try {
      await pdfService.downloadReport(
        matchResult,
        chatMessagesRef.current.length > 0 ? chatMessagesRef.current : undefined,
        `cv_match_report_${matchResult.overallScore}pct.pdf`
      );
    } catch (error: any) {
      setError(t('error_pdf_failed', { error: error.message }));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (employerDocs.length === 0 || applicantDocs.length === 0) {
      setError(t('error_need_documents'));
      return;
    }

    setLoading(true);
    setProgress(0);
    setProgressMessage(t('progress_loading_docs'));
    setError(null);

    // Simulierter Fortschritt
    const progressSteps = [
      { percent: 10, message: t('progress_loading_docs') },
      { percent: 25, message: t('progress_analyzing_employer') },
      { percent: 40, message: t('progress_analyzing_applicant') },
      { percent: 60, message: t('progress_llm_running') },
      { percent: 80, message: t('progress_generating_results') },
      { percent: 95, message: t('progress_finalizing') }
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setProgress(progressSteps[currentStep].percent);
        setProgressMessage(progressSteps[currentStep].message);
        currentStep++;
      }
    }, 800);

    try {
      // Kombiniere alle Dokumente zu einem Text
      const employerText = employerDocs.map(d => d.content).join('\n\n');
      const applicantText = applicantDocs.map(d => d.content).join('\n\n');

      const result = await llmService.analyzeMatch(applicantText, employerText, llmType);

      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage(t('progress_completed'));
      onMatchComplete(result);
    } catch (err) {
      clearInterval(progressInterval);
      setError(t('error_analysis_failed') + ': ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Match Button */}
      <div className="mb-6">
        <button
          onClick={handleStartMatch}
          disabled={loading || employerDocs.length === 0 || applicantDocs.length === 0}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={24} />
              {t('analyzing')}
            </>
          ) : (
            <>
              <Play size={24} />
              {t('match_button')}
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{progressMessage}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Results */}
      {matchResult && !loading && (
        <div className="space-y-6">
          {/* Score Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - matchResult.overallScore / 100)}`}
                  className="text-blue-600 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">{matchResult.overallScore}</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {matchResult.overallScore >= 70
                ? t('match_high')
                : matchResult.overallScore >= 40
                ? t('match_medium')
                : t('match_low')}
            </h3>

            {/* PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto shadow-lg"
            >
              {pdfLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  {t('pdf_generating')}
                </>
              ) : (
                <>
                  <Download size={20} />
                  {t('pdf_download_button')}
                  {chatMessagesRef.current.length > 0 && (
                    <span className="text-xs bg-purple-800 px-2 py-1 rounded-full">
                      {t('pdf_with_chat', { count: chatMessagesRef.current.length })}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>

          {/* 2-Column Grid: Strengths | Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Strengths */}
            {matchResult.strengths && matchResult.strengths.length > 0 && (
              <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3">{t('strengths_title')}</h3>
                <ul className="space-y-2">
                  {matchResult.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {matchResult.gaps && matchResult.gaps.length > 0 && (
              <div className="bg-red-50 rounded-lg p-5 border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-3">{t('gaps_title')}</h3>
                <ul className="space-y-2">
                  {matchResult.gaps.map((gap: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span className="text-gray-700">{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations - Expandable */}
          {matchResult.recommendations && matchResult.recommendations.length > 0 && (
            <details className="bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <summary className="p-5 cursor-pointer font-semibold text-blue-800 text-lg hover:bg-blue-100 transition-colors">
                {t('recommendations_title')} ({matchResult.recommendations.length})
              </summary>
              <ul className="px-5 pb-5 space-y-2">
                {matchResult.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">→</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Comparison Table */}
          {matchResult.comparison && matchResult.comparison.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('comparison_title')}</h3>
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-700">{t('comparison_requirement')}</th>
                    <th className="p-3 text-left font-semibold text-gray-700">{t('comparison_applicant_match')}</th>
                    <th className="p-3 text-left font-semibold text-gray-700">{t('comparison_details')}</th>
                    <th className="p-3 text-center font-semibold text-gray-700">{t('comparison_level')}</th>
                    <th className="p-3 text-center font-semibold text-gray-700">{t('comparison_confidence')}</th>
                  </tr>
                </thead>
                <tbody>
                  {matchResult.comparison.map((comp: any, index: number) => (
                    <tr key={index} className={`border-t ${
                      comp.match_level === 'full' ? 'bg-green-50' :
                      comp.match_level === 'partial' ? 'bg-yellow-50' :
                      'bg-red-50'
                    }`}>
                      <td className="p-3 text-gray-800">{comp.requirement}</td>
                      <td className="p-3 text-gray-700">{comp.applicant_match}</td>
                      <td className="p-3 text-gray-600 text-sm">{comp.details || '-'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          comp.match_level === 'full' ? 'bg-green-200 text-green-800' :
                          comp.match_level === 'partial' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {comp.match_level === 'full' ? t('match_level_full') :
                           comp.match_level === 'partial' ? t('match_level_partial') :
                           t('match_level_missing')}
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold text-gray-700">{comp.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed Analysis */}
          {matchResult.detailedAnalysis && (
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('detailed_analysis_title')}</h3>
              <p className="text-gray-700 whitespace-pre-line">{matchResult.detailedAnalysis}</p>
            </div>
          )}

          {/* Interactive Chat with RAG */}
          <Chat
            llmType={llmType}
            systemContext={`Match Analysis Summary:
- Overall Score: ${matchResult.overallScore}%
- Strengths: ${matchResult.strengths?.join(', ') || 'N/A'}
- Gaps: ${matchResult.gaps?.join(', ') || 'N/A'}
- Recommendations: ${matchResult.recommendations?.join(', ') || 'N/A'}

Detailed Analysis:
${matchResult.detailedAnalysis || 'N/A'}`}
            documents={inMemoryDocuments}  // NEW: Pass documents for in-memory RAG
            onMessagesChange={(messages) => {
              chatMessagesRef.current = messages;
            }}
          />
        </div>
      )}
    </div>
  );
}
