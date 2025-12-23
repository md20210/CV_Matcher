import { useState, useRef, useMemo, useEffect } from 'react';
import { Upload, Link, FileText, Trash2, Eye, X, FileStack } from 'lucide-react';
import { documentService, type BackendDocument } from '../services/document';
import { useLanguage } from '../contexts/LanguageContext';

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  side: 'employer' | 'applicant';
}

interface DocumentSectionProps {
  side: 'employer' | 'applicant';
  docs: Document[];
  onDocumentAdded: (doc: Document) => void;
  onDocumentDeleted: (docId: string, side: 'employer' | 'applicant') => void;
}

export default function DocumentSection({ side, docs, onDocumentAdded, onDocumentDeleted }: DocumentSectionProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'text'>('upload');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [backendDocs, setBackendDocs] = useState<BackendDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from backend when summary is opened
  useEffect(() => {
    if (showSummary && backendDocs.length === 0) {
      loadBackendDocuments();
    }
  }, [showSummary]);

  const loadBackendDocuments = async () => {
    try {
      const summary = await documentService.getDocumentsSummary();
      // Convert summary to BackendDocument format for compatibility
      const docsFromSummary: BackendDocument[] = summary.documents.map(d => ({
        id: d.id,
        user_id: '', // Not needed for display
        type: d.type as any,
        filename: d.filename,
        url: d.type === 'url' ? d.filename : undefined,
        content: d.content,
        doc_metadata: {},
        created_at: d.created_at || '',
        updated_at: d.created_at || ''
      }));
      setBackendDocs(docsFromSummary);
    } catch (error) {
      console.error('Failed to load backend documents:', error);
    }
  };

  const title = side === 'employer' ? t('employer_section_title') : t('applicant_section_title');
  const bgColor = side === 'employer' ? 'bg-blue-50' : 'bg-green-50';
  const borderColor = side === 'employer' ? 'border-blue-200' : 'border-green-200';

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setLoading(true);
    try {
      // Upload to backend (extracts text, generates embeddings)
      const backendDoc = await documentService.uploadFile(file);

      // Convert to frontend format
      const newDoc: Document = {
        id: backendDoc.id,
        name: backendDoc.filename || file.name,
        type: 'file',
        content: backendDoc.content,
        side
      };

      onDocumentAdded(newDoc);
      console.log(`✅ Uploaded ${file.name} to backend (ID: ${backendDoc.id})`);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('❌ Error uploading file:', error);
      alert(`Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      // Upload URL to backend (scrapes content, generates embeddings)
      const backendDoc = await documentService.uploadUrl(url);

      // Convert to frontend format
      const newDoc: Document = {
        id: backendDoc.id,
        name: backendDoc.url || url,
        type: 'url',
        content: backendDoc.content,
        side
      };

      onDocumentAdded(newDoc);
      console.log(`✅ Uploaded URL to backend (ID: ${backendDoc.id})`);
      setUrl('');
    } catch (error: any) {
      console.error('❌ Error adding URL:', error);
      alert(`URL upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      // Upload text to backend (generates embeddings)
      const title = side === 'employer' ? 'Job Description' : 'CV Text';
      const backendDoc = await documentService.uploadText(text, title);

      // Convert to frontend format
      const newDoc: Document = {
        id: backendDoc.id,
        name: title,
        type: 'text',
        content: backendDoc.content,
        side
      };

      onDocumentAdded(newDoc);
      console.log(`✅ Uploaded text to backend (ID: ${backendDoc.id})`);
      setText('');
    } catch (error: any) {
      console.error('❌ Error adding text:', error);
      alert(`Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Auto-update summary when docs OR backendDocs change
  const summary = useMemo(() => {
    // Combine local docs and backend docs
    const allDocs = [
      ...docs.map(d => ({ name: d.name, content: d.content, type: d.type, source: 'local' })),
      ...backendDocs.map(d => ({ name: d.filename || 'Unnamed', content: d.content, type: d.type, source: 'database' }))
    ];

    if (allDocs.length === 0) return null;

    const totalContent = allDocs.map(d => d.content).join('\n\n');
    const totalWords = totalContent.split(/\s+/).length;
    const totalChars = totalContent.length;

    return {
      totalDocs: allDocs.length,
      totalWords,
      totalChars,
      fullContent: totalContent,
      documents: allDocs.map(d => ({
        name: d.name,
        type: d.type,
        source: d.source,
        wordCount: d.content.split(/\s+/).length,
        charCount: d.content.length,
        content: d.content
      }))
    };
  }, [docs, backendDocs]); // Re-calculate whenever docs OR backendDocs change

  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-6`}>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Upload size={18} />
          {t('doc_tab_upload')}
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'url'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Link size={18} />
          {t('doc_tab_url')}
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'text'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FileText size={18} />
          {t('doc_tab_text')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg p-4 mb-4">
        {activeTab === 'upload' && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-2">{t('doc_drop_file')}</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              className="hidden"
              accept=".pdf,.txt,.doc,.docx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('doc_loading') : t('doc_select_file')}
            </button>
          </div>
        )}

        {activeTab === 'url' && (
          <form onSubmit={handleUrlSubmit}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('doc_url_placeholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('doc_loading') : t('doc_add_url')}
            </button>
          </form>
        )}

        {activeTab === 'text' && (
          <form onSubmit={handleTextSubmit}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('doc_text_placeholder')}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? t('doc_loading') : t('doc_add_text')}
            </button>
          </form>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {docs.length === 0 && (
          <p className="text-gray-500 text-center py-4">{t('doc_no_documents')}</p>
        )}
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
            onDoubleClick={() => setPreviewDoc(doc)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="text-gray-400 flex-shrink-0" size={20} />
              <span className="text-sm text-gray-700 truncate">{doc.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewDoc(doc);
                }}
                className="text-blue-500 hover:text-blue-700 p-1 flex-shrink-0"
                title={t('doc_preview')}
              >
                <Eye size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDocumentDeleted(doc.id, side);
                }}
                className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                title={t('doc_delete')}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Button */}
      {docs.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowSummary(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
          >
            <FileStack size={20} />
            {t('doc_summary_button')}
          </button>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{previewDoc.name}</h3>
                  <p className="text-sm text-gray-500">
                    {previewDoc.type === 'file' ? t('doc_type_file') :
                     previewDoc.type === 'url' ? t('doc_type_url') :
                     t('doc_type_text')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {previewDoc.content}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {t('doc_content_length')}: {previewDoc.content.length.toLocaleString()} {t('doc_characters')}
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('doc_close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSummary(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <FileStack className="text-white" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('doc_summary_title')}</h3>
                  <p className="text-sm text-purple-100">
                    {side === 'employer' ? t('employer_section_title') : t('applicant_section_title')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="text-white hover:text-purple-100 p-2 rounded-lg hover:bg-white/10"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {summary && (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-center mb-2">
                        <FileStack className="text-purple-600" size={24} />
                      </div>
                      <div className="text-2xl font-bold text-purple-600 text-center">{summary.totalDocs}</div>
                      <div className="text-sm text-gray-600 text-center">{t('doc_summary_total_docs')}</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-center justify-center mb-2">
                        <FileText className="text-indigo-600" size={24} />
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 text-center">{summary.totalWords.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 text-center">{t('doc_summary_words')}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-center mb-2">
                        <FileText className="text-blue-600" size={24} />
                      </div>
                      <div className="text-2xl font-bold text-blue-600 text-center">{summary.totalChars.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 text-center">{t('doc_characters')}</div>
                    </div>
                  </div>

                  {/* Document Details */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="text-gray-600" size={20} />
                      {t('doc_summary_details')}:
                    </h4>
                    <div className="space-y-2">
                      {summary.documents.map((doc, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <FileText className="text-gray-400 flex-shrink-0" size={16} />
                              <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span>{doc.wordCount} {t('doc_summary_words')}</span>
                              <span>{doc.charCount} {t('doc_characters')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full Content */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileStack className="text-gray-600" size={20} />
                      {t('doc_summary_total_content')}:
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono max-h-96 overflow-y-auto">
                        {summary.fullContent}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowSummary(false)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
              >
                {t('doc_close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
