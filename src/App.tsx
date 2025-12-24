import { useState, useEffect } from 'react';
import { authService } from './services/auth';
import { api } from './services/api';
import DocumentSection from './components/DocumentSection';
import MatchingView from './components/MatchingView';
import { LanguageToggle } from './components/LanguageToggle';
import { useLanguage } from './contexts/LanguageContext';

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  side: 'employer' | 'applicant';
}

function App() {
  const { t, loading } = useLanguage();
  const [llmType, setLlmType] = useState<'local' | 'grok'>('local');
  const [employerDocs, setEmployerDocs] = useState<Document[]>([]);
  const [applicantDocs, setApplicantDocs] = useState<Document[]>([]);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Auto-login mit Test-User für Showcase
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Auto-Login
      if (!authService.isAuthenticated()) {
        try {
          await authService.login('test@dabrock.info', 'Test123Secure');
          console.log('✅ Auto-login successful');
        } catch (err) {
          console.error('❌ Auto-login failed:', err);
          return;
        }
      }

      // 2. Cleanup documents - ONLY on first load (not on every reload)
      // Check if this is truly a fresh session (no documents loaded yet)
      const hasCleanedThisSession = sessionStorage.getItem('cv_matcher_cleaned');
      if (!hasCleanedThisSession) {
        try {
          const response = await api.delete('/documents/cleanup');
          console.log(`🧹 Cleaned up ${response.data.deleted_count} document(s) from previous session`);
          sessionStorage.setItem('cv_matcher_cleaned', 'true');
        } catch (err) {
          console.error('⚠️ Document cleanup failed (non-critical):', err);
          // Continue - cleanup failure shouldn't block app
        }
      }
    };

    initializeApp();
  }, []);

  const handleDocumentAdded = (doc: Document) => {
    if (doc.side === 'employer') {
      setEmployerDocs(prev => [...prev, doc]);
    } else {
      setApplicantDocs(prev => [...prev, doc]);
    }
  };

  const handleDocumentDeleted = (docId: string, side: 'employer' | 'applicant') => {
    if (side === 'employer') {
      setEmployerDocs(prev => prev.filter(d => d.id !== docId));
    } else {
      setApplicantDocs(prev => prev.filter(d => d.id !== docId));
    }
  };

  const handleMatchComplete = (result: any) => {
    setMatchResult(result);
  };

  // Show loading screen until translations are loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-600">{t('cv_matcher_app_title')}</h1>

          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <LanguageToggle />

            {/* LLM Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setLlmType('local')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  llmType === 'local'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('cv_matcher_llm_toggle_local')}
              </button>
              <button
                onClick={() => setLlmType('grok')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  llmType === 'grok'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('cv_matcher_llm_toggle_grok')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Two-Column Document Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DocumentSection
            side="employer"
            docs={employerDocs}
            onDocumentAdded={handleDocumentAdded}
            onDocumentDeleted={handleDocumentDeleted}
          />
          <DocumentSection
            side="applicant"
            docs={applicantDocs}
            onDocumentAdded={handleDocumentAdded}
            onDocumentDeleted={handleDocumentDeleted}
          />
        </div>

        {/* Matching View */}
        <MatchingView
          employerDocs={employerDocs}
          applicantDocs={applicantDocs}
          llmType={llmType}
          onMatchComplete={handleMatchComplete}
          matchResult={matchResult}
        />
      </main>
    </div>
  );
}

export default App;
