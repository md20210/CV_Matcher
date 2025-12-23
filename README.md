# CV Matcher - AI-Powered Resume Analysis

> **Intelligent CV-Job Matching with Multi-Language Support & Interactive Chat**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://www.dabrock.info/cv-matcher/)
[![Backend](https://img.shields.io/badge/backend-Railway-purple)](https://general-backend-production-a734.up.railway.app/docs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

CV Matcher is an AI-powered application that analyzes the fit between job requirements and candidate profiles. It provides detailed matching scores, strengths/gaps analysis, and interactive chat with RAG (Retrieval-Augmented Generation).

**Live Demo**: [https://www.dabrock.info/cv-matcher/](https://www.dabrock.info/cv-matcher/)

---

## Features

### Core Matching Engine
- **AI-Powered Analysis**: Uses local LLM (Llama) or Grok for intelligent CV-job matching
- **Detailed Scoring**: Overall match percentage with visual progress indicators
- **Structured Insights**: Categorized strengths, gaps, and recommendations
- **Comparison Table**: Line-by-line requirement vs. candidate matching
- **PDF Export**: Generate professional reports with optional chat history

### Interactive Experience
- **RAG-Powered Chat**: Ask follow-up questions about the match analysis
- **Source Attribution**: Chat responses include relevant document references
- **Real-time Progress**: Live progress updates during analysis
- **Document Preview**: Side-by-side view of employer/applicant documents

### Multi-Language Support
- **3 Languages**: German (🇩🇪), English (🇬🇧), Spanish (🇪🇸)
- **Backend Translation Service**: Centralized API with ~70 UI translations
- **LLM Localization**: Analysis prompts adapted to selected language
- **Auto-Detection**: Browser language detection on first visit
- **Persistent Preferences**: Language choice saved in localStorage

### Privacy & Deployment
- **GDPR Compliance**: Local LLM option for data privacy
- **No Data Storage**: All processing happens in-memory
- **Cloud Alternative**: Grok integration for faster results (non-GDPR)
- **Railway Deployment**: Auto-scaling backend infrastructure

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tooling
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **jsPDF** + **jsPDF-AutoTable** - PDF generation
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **ChromaDB** - Vector database for RAG
- **sentence-transformers** - Embedding generation
- **OpenAI SDK** - LLM integration (Llama, Grok)

### Infrastructure
- **Railway** - Backend hosting with auto-deployment
- **Strato** - Frontend SFTP hosting
- **GitHub** - Version control & CI/CD

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CV Matcher Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │LanguageToggle│  │Document Upload│  │  Match View  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────┐      │
│  │         LanguageContext (i18n state)              │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Railway)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Translation  │  │  LLM Gateway │  │  RAG/Chat    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────┐      │
│  │         ChromaDB (Vector Store)                   │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External LLM Providers                    │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ Local Llama  │              │     Grok     │            │
│  │   (GDPR)     │              │  (non-GDPR)  │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
CV_Matcher/
├── src/
│   ├── components/
│   │   ├── Chat.tsx                 # RAG-powered chat interface
│   │   ├── DocumentSection.tsx      # Document upload/preview
│   │   ├── LanguageToggle.tsx       # Language switcher
│   │   └── MatchingView.tsx         # Match results & analysis
│   ├── contexts/
│   │   └── LanguageContext.tsx      # Global language state
│   ├── services/
│   │   ├── api.ts                   # Axios instance & config
│   │   ├── chat.ts                  # Chat API integration
│   │   ├── llm.ts                   # LLM analysis service
│   │   └── pdf.ts                   # PDF export service
│   ├── App.tsx                      # Main app component
│   └── main.tsx                     # Entry point
├── public/
│   └── favicon.svg
├── dist/                            # Build output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js

GeneralBackend/
├── backend/
│   ├── api/
│   │   ├── translations.py          # Translation endpoints
│   │   ├── llm.py                   # LLM analysis endpoints
│   │   └── chat.py                  # RAG chat endpoints
│   ├── services/
│   │   ├── translation_service.py   # i18n service (~70 keys)
│   │   ├── llm_gateway.py           # LLM provider abstraction
│   │   └── rag_service.py           # ChromaDB integration
│   ├── models/
│   │   └── chat.py                  # Pydantic models
│   └── main.py                      # FastAPI app
├── docs/
│   ├── TRANSLATION_SERVICE.md       # i18n API docs
│   └── I18N_DOCUMENTATION.md        # Frontend i18n guide
├── requirements.txt
└── Procfile                         # Railway deployment
```

---

## Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **Git**

### Frontend Setup

```bash
cd CV_Matcher
npm install
npm run dev
```

The app runs on `http://localhost:5173`

### Backend Setup

```bash
cd GeneralBackend
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API runs on `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Environment Variables

Create `.env` in `GeneralBackend/`:

```bash
# LLM Configuration
OPENAI_API_KEY=your_local_llm_key
OPENAI_BASE_URL=http://localhost:1234/v1
XAI_API_KEY=your_grok_key

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:5173,https://www.dabrock.info

# ChromaDB (optional)
CHROMA_PERSIST_DIR=./chroma_db
```

---

## Usage

### 1. Select Language
Click the flag buttons in the header to switch between German, English, or Spanish.

### 2. Choose LLM Provider
- **🏠 Local (GDPR)**: Uses local Llama model (privacy-focused)
- **⚡ GROK (non-GDPR)**: Uses X.AI's Grok (faster, cloud-based)

### 3. Upload Documents
- **Employer Side**: Job description, requirements (PDF/TXT/DOCX)
- **Applicant Side**: CV, cover letter, certificates (PDF/TXT/DOCX)

### 4. Start Match
Click "Start Match" to begin analysis. Progress updates show:
- Loading documents
- Analyzing employer requirements
- Analyzing applicant profile
- Running LLM analysis
- Generating results

### 5. Review Results
- **Overall Score**: Visual progress circle (0-100%)
- **Strengths**: Green-highlighted matching qualifications
- **Gaps**: Red-highlighted missing requirements
- **Recommendations**: Suggested improvements
- **Comparison Table**: Detailed requirement-by-requirement breakdown
- **Detailed Analysis**: Full AI-generated assessment

### 6. Interactive Chat
Ask follow-up questions:
- "Why is this gap important?"
- "Can experience compensate for missing certifications?"
- "What training would help close the gaps?"

### 7. Export PDF
Download professional report with:
- Match summary
- Strengths/Gaps/Recommendations
- Comparison table
- Optional: Chat history

---

## API Integration

### Translation API

**Fetch all translations for a language:**
```typescript
GET /translations/{language}

Response:
{
  "language": "en",
  "translations": {
    "app_title": "CV Matcher",
    "match_button": "Start Match",
    "analyzing": "Analyzing...",
    ...
  }
}
```

**Get single translation:**
```typescript
GET /translations/key/{key}?language=en

Response:
{
  "key": "match_button",
  "value": "Start Match",
  "language": "en"
}
```

**Get supported languages:**
```typescript
GET /translations/languages

Response:
{
  "languages": [
    {"code": "de", "name": "Deutsch", "flag": "🇩🇪"},
    {"code": "en", "name": "English", "flag": "🇬🇧"},
    {"code": "es", "name": "Español", "flag": "🇪🇸"}
  ]
}
```

### LLM Analysis API

**Analyze CV-job match:**
```typescript
POST /llm/analyze

Request:
{
  "applicant_text": "...",
  "employer_text": "...",
  "llm_type": "local",
  "language": "en"
}

Response:
{
  "overallScore": 75,
  "strengths": ["5+ years Python", "AWS experience"],
  "gaps": ["No Kubernetes experience"],
  "recommendations": ["Take CKA certification"],
  "comparison": [...],
  "detailedAnalysis": "..."
}
```

### Chat API

**Send chat message with RAG:**
```typescript
POST /chat/message

Request:
{
  "message": "Why is Kubernetes important?",
  "llm_type": "grok",
  "system_context": "...",
  "project_id": "match_12345"
}

Response:
{
  "message": "Kubernetes is critical because...",
  "sources": [
    {
      "type": "employer",
      "filename": "job_description.pdf",
      "relevance_score": 0.89,
      "chunk_text": "..."
    }
  ]
}
```

---

## Deployment

### Frontend (Strato SFTP)

```bash
npm run build
cd dist

# Upload via SFTP
SFTP_USER="your_user"
SFTP_PASS="your_pass"
SFTP_HOST="your_host"

curl -T "index.html" "sftp://$SFTP_HOST/dabrock-info/cv-matcher/index.html" \
  --user "$SFTP_USER:$SFTP_PASS" --ftp-create-dirs -k
```

### Backend (Railway)

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on `git push`

**Railway Configuration:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Python Version**: 3.10+

---

## Development

### Running Tests
```bash
# Frontend
npm run test

# Backend
pytest
```

### Linting
```bash
# Frontend
npm run lint

# Backend
flake8 backend/
mypy backend/
```

### Adding Translations

1. Edit `backend/services/translation_service.py`
2. Add new key to `UI_TRANSLATIONS`:
```python
"new_key": {
    "de": "Deutscher Text",
    "en": "English text",
    "es": "Texto español"
}
```
3. Use in frontend: `{t('new_key')}`
4. Commit and push (auto-deploys to Railway)

---

## Troubleshooting

### Frontend Issues

**Problem**: Translations not loading
- Check browser console for API errors
- Verify backend is running: `https://general-backend-production-a734.up.railway.app/docs`
- Clear localStorage: `localStorage.clear()`

**Problem**: Build fails
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node version: `node --version` (should be 18+)

### Backend Issues

**Problem**: LLM analysis fails
- Verify `OPENAI_API_KEY` or `XAI_API_KEY` is set
- Check LLM provider is running (for local)
- Review logs in Railway dashboard

**Problem**: CORS errors
- Add frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart backend

**Problem**: ChromaDB errors
- Delete `chroma_db` directory
- Restart backend (will recreate DB)

---

## Performance

- **Translation API**: <10ms response time, ~15KB payload
- **LLM Analysis**: 10-30 seconds (depends on provider)
- **Chat Response**: 5-15 seconds (includes RAG retrieval)
- **PDF Generation**: 1-3 seconds (depends on chat history length)

---

## Security

- **No Data Persistence**: Documents processed in-memory only
- **CORS Protection**: Whitelist-based origin validation
- **API Key Security**: Environment variables, never committed
- **GDPR Compliance**: Local LLM option for EU users
- **Input Validation**: Pydantic models validate all API requests

---

## Future Enhancements

- [ ] **More Languages**: French, Italian, Portuguese
- [ ] **Advanced Filters**: Filter by skill category, experience level
- [ ] **Batch Processing**: Analyze multiple CVs against one job
- [ ] **Email Reports**: Send PDF reports via email
- [ ] **Candidate Portal**: Self-service CV upload and tracking
- [ ] **ATS Integration**: Connect to Applicant Tracking Systems
- [ ] **Analytics Dashboard**: Track matching trends over time
- [ ] **Custom Prompts**: Let users customize LLM analysis criteria

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Support

- **Documentation**:
  - [Translation Service](../GeneralBackend/docs/TRANSLATION_SERVICE.md)
  - [RAG Chat Service](../GeneralBackend/docs/RAG_CHAT_SERVICE.md)
  - [Frontend I18N](docs/I18N_DOCUMENTATION.md)
- **API Reference**: [https://general-backend-production-a734.up.railway.app/docs](https://general-backend-production-a734.up.railway.app/docs)
- **Issues**: GitHub Issues

---

**Built with ❤️ using FastAPI, React, and AI**
