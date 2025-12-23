import { useState, useRef, useMemo, useEffect } from 'react';
import { Play, Loader, Download, FileText, RefreshCw } from 'lucide-react';
import { llmService } from '../services/llm';
import { Chat } from './Chat';
import { pdfService } from '../services/pdf';
import type { ChatMessage, InMemoryDocument } from '../services/chat';
import { useLanguage } from '../contexts/LanguageContext';
import { documentService, BackendDocument } from '../services/document';

interface GapClaim {
  gap: string;
  hasClaim: boolean;
  justification: string;
}

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
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [cvGenerating, setCvGenerating] = useState(false);
  const [gapClaims, setGapClaims] = useState<GapClaim[]>([]);
  const [backendDocs, setBackendDocs] = useState<BackendDocument[]>([]);
  const chatMessagesRef = useRef<ChatMessage[]>([]);

  // Load backend documents on component mount
  useEffect(() => {
    const loadBackendDocuments = async () => {
      try {
        const summary = await documentService.getDocumentsSummary();
        const docsFromBackend: BackendDocument[] = summary.documents.map(d => ({
          id: d.id,
          user_id: '',
          type: d.type as any,
          filename: d.filename,
          url: d.type === 'url' ? d.filename : undefined,
          content: d.content,
          doc_metadata: {},
          created_at: d.created_at || '',
          updated_at: d.created_at || ''
        }));
        setBackendDocs(docsFromBackend);
        console.log(`✅ Loaded ${docsFromBackend.length} documents from backend for RAG chat`);
      } catch (error) {
        console.error('Failed to load backend documents for chat:', error);
      }
    };
    loadBackendDocuments();
  }, []);

  // Convert documents to InMemoryDocument format for RAG
  const inMemoryDocuments = useMemo((): InMemoryDocument[] => {
    const docs: InMemoryDocument[] = [];

    // Add employer documents (local)
    employerDocs.forEach(doc => {
      docs.push({
        filename: doc.name,
        content: doc.content,
        type: 'employer'
      });
    });

    // Add applicant documents (local)
    applicantDocs.forEach(doc => {
      docs.push({
        filename: doc.name,
        content: doc.content,
        type: 'applicant'
      });
    });

    // Add backend documents (from vector database - e.g., URLs like www.dabrock.eu)
    backendDocs.forEach(doc => {
      docs.push({
        filename: doc.filename || doc.url || 'Unknown',
        content: doc.content,
        type: doc.type
      });
    });

    console.log(`📄 Total documents for RAG: ${docs.length} (local: ${employerDocs.length + applicantDocs.length}, backend: ${backendDocs.length})`);
    return docs;
  }, [employerDocs, applicantDocs, backendDocs]);

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

      // Pass language to LLM service for multilingual analysis
      const result = await llmService.analyzeMatch(applicantText, employerText, llmType, language);

      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage(t('progress_completed'));
      onMatchComplete(result);

      // Initialize gap claims from gaps
      if (result.gaps && result.gaps.length > 0) {
        const initialClaims: GapClaim[] = result.gaps.map((gap: string) => ({
          gap,
          hasClaim: false,
          justification: ''
        }));
        setGapClaims(initialClaims);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(t('error_analysis_failed') + ': ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGapClaimChange = (index: number, hasClaim: boolean) => {
    const updatedClaims = [...gapClaims];
    updatedClaims[index].hasClaim = hasClaim;
    setGapClaims(updatedClaims);
  };

  const handleJustificationChange = (index: number, justification: string) => {
    const updatedClaims = [...gapClaims];
    updatedClaims[index].justification = justification;
    setGapClaims(updatedClaims);
  };

  const handleGenerateNewCV = async () => {
    if (!matchResult) return;

    setCvGenerating(true);
    setError(null);

    try {
      // Collect claimed gaps with justifications
      const claimedGaps = gapClaims.filter(claim => claim.hasClaim && claim.justification.trim());

      if (claimedGaps.length === 0) {
        setError(t('error_no_claims'));
        setCvGenerating(false);
        return;
      }

      // 1. Collect ALL CV content (applicant documents)
      const cvContent = applicantDocs.map(d =>
        `=== ${d.name} (${d.type}) ===\n${d.content}`
      ).join('\n\n');

      // 2. Collect ALL additional information from employer documents (job description, URLs, etc.)
      const additionalInfo = employerDocs.map(d =>
        `=== ${d.name} (${d.type}) ===\n${d.content}`
      ).join('\n\n');

      // 3. Collect chat history for context
      const chatHistory = chatMessagesRef.current.length > 0
        ? chatMessagesRef.current.map(msg =>
            `${msg.role === 'user' ? 'Question' : 'Answer'}: ${msg.content}`
          ).join('\n\n')
        : 'No chat history available';

      // 4. Collect match analysis results
      const analysisContext = `
Match Score: ${matchResult.overallScore}%

Strengths:
${matchResult.strengths?.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') || 'None'}

Identified Gaps:
${matchResult.gaps?.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n') || 'None'}

Recommendations:
${matchResult.recommendations?.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n') || 'None'}

${matchResult.detailedAnalysis ? `Detailed Analysis:\n${matchResult.detailedAnalysis}` : ''}
`;

      // 5. Prepare comprehensive prompt for LLM
      const prompt = `${t('cv_regenerate_prompt')}

==============================================
ORIGINAL CV CONTENT:
==============================================
${cvContent}

==============================================
JOB REQUIREMENTS & ADDITIONAL CONTEXT:
==============================================
${additionalInfo}

==============================================
MATCH ANALYSIS RESULTS:
==============================================
${analysisContext}

==============================================
CHAT HISTORY (Questions & Answers):
==============================================
${chatHistory}

==============================================
CLAIMED MISSING QUALIFICATIONS WITH JUSTIFICATIONS:
==============================================
${claimedGaps.map((claim, i) => `
${i + 1}. Missing Qualification: ${claim.gap}

   Candidate Claims: "I DO have this qualification"

   Justification/Evidence:
   ${claim.justification}

   → Use this justification to update the CV with concrete details!
`).join('\n---\n')}

==============================================
${t('cv_regenerate_instructions')}

IMPORTANT:
- Integrate ALL claimed qualifications naturally into the CV
- Use the justifications as concrete examples and evidence
- Reference information from job requirements, chat history, and analysis
- Maintain professional CV formatting
- Add new sections if needed (e.g., "Additional Skills", "Projects")
- Be specific with dates, tools, technologies mentioned in justifications
- Make it coherent and believable based on ALL available information
==============================================`;

      // Call LLM service with longer max_tokens for comprehensive CV
      const response = await llmService.generateText(prompt, llmType, {
        max_tokens: 3000,  // Allow for longer CV generation
        temperature: 0.7
      });

      // Download as new CV file
      const blob = new Blob([response], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `updated_cv_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(t('cv_regenerate_success'));
    } catch (err: any) {
      setError(t('error_cv_regenerate_failed') + ': ' + err.message);
      console.error(err);
    } finally {
      setCvGenerating(false);
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
          {/* Score Circle with Dynamic Color */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                {/* Progress circle with gradient - Blue (good) to Red (bad) */}
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    <stop offset="30%" style={{ stopColor: '#14b8a6', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#eab308', stopOpacity: 1 }} />
                    <stop offset="70%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - matchResult.overallScore / 100)}`}
                  className="transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-bold text-gray-800">{matchResult.overallScore}</span>
                <span className="text-xs text-gray-500 font-medium">%</span>
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

          {/* Gap Claims Section */}
          {gapClaims.length > 0 && (
            <div className="mt-6 bg-yellow-50 rounded-lg border border-yellow-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="text-yellow-600" size={24} />
                {t('gap_claims_title')}
              </h3>
              <p className="text-gray-600 mb-4">{t('gap_claims_description')}</p>

              <div className="space-y-4">
                {gapClaims.map((claim, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start gap-4">
                      {/* Radio Button */}
                      <div className="flex items-center gap-2 min-w-fit pt-1">
                        <input
                          type="checkbox"
                          id={`claim-${index}`}
                          checked={claim.hasClaim}
                          onChange={(e) => handleGapClaimChange(index, e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`claim-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                          {t('gap_claims_i_have_this')}
                        </label>
                      </div>

                      {/* Gap Text & Justification */}
                      <div className="flex-1 space-y-2">
                        <p className="text-gray-800 font-medium">{claim.gap}</p>

                        {claim.hasClaim && (
                          <div>
                            <label htmlFor={`justification-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              {t('gap_claims_justification')}
                            </label>
                            <textarea
                              id={`justification-${index}`}
                              value={claim.justification}
                              onChange={(e) => handleJustificationChange(index, e.target.value)}
                              placeholder={t('gap_claims_justification_placeholder')}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CV Regeneration Section */}
          {gapClaims.some(claim => claim.hasClaim && claim.justification.trim()) && (
            <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <RefreshCw className="text-blue-600" size={24} />
                {t('cv_regenerate_title')}
              </h3>
              <p className="text-gray-600 mb-4">{t('cv_regenerate_description')}</p>

              <button
                type="button"
                onClick={handleGenerateNewCV}
                disabled={cvGenerating}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold text-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
              >
                {cvGenerating ? (
                  <>
                    <Loader className="animate-spin" size={24} />
                    {t('cv_regenerate_generating')}
                  </>
                ) : (
                  <>
                    <RefreshCw size={24} />
                    {t('cv_regenerate_button')}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                {t('cv_regenerate_note')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
