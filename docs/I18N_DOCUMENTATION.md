# Multi-Language Support (i18n) Documentation

## Overview

CV Matcher now supports **3 languages**: German (DE), English (EN), and Spanish (ES).

The system uses a **centralized translation architecture** with:
- **Backend Translation Service**: Python service with all translations
- **Backend API Endpoints**: REST API to fetch translations
- **Frontend Context**: React Context for language state management
- **Translation Hook**: `useLanguage()` hook for easy access in components

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  LanguageProvider (Context)                │    │
│  │  - Stores current language (de/en/es)      │    │
│  │  - Fetches translations from backend       │    │
│  │  - Provides t() translation function       │    │
│  └────────────────────────────────────────────┘    │
│            │                                         │
│            ├─> App.tsx (uses useLanguage())        │
│            ├─> MatchingView.tsx                    │
│            ├─> Chat.tsx                            │
│            └─> Other Components                     │
└─────────────────────────────────────────────────────┘
                     │
                     │ HTTP GET /translations/{lang}
                     ▼
┌─────────────────────────────────────────────────────┐
│                    Backend                           │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  TranslationService                        │    │
│  │  - UI_TRANSLATIONS dict                    │    │
│  │  - LLM_PROMPTS dict                        │    │
│  │  - translate() method                      │    │
│  └────────────────────────────────────────────┘    │
│            │                                         │
│  ┌────────────────────────────────────────────┐    │
│  │  Translations API Router                   │    │
│  │  GET /translations/{lang}                  │    │
│  │  GET /translations/key/{key}               │    │
│  │  GET /translations/languages               │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### 1. Translation Service

**Location**: `backend/services/translation_service.py`

**Key Features**:
- Centralized dictionary with all translations
- Support for variable interpolation (e.g., `{count}`, `{error}`)
- Fallback to English if translation missing
- Separate LLM prompt templates for each language

**Example Usage**:
```python
from backend.services.translation_service import translation_service

# Get single translation
title = translation_service.translate("app_title", "de")  # "CV Matcher"

# Translation with parameters
msg = translation_service.translate(
    "pdf_with_chat",
    "en",
    count=5
)  # "with 5 chat messages"

# Get all translations for a language
translations = translation_service.get_all_translations("es")

# Get LLM prompt
prompt = translation_service.get_llm_prompt(
    "match_analysis",
    "en",
    cv_text="...",
    job_description="..."
)
```

### 2. Translation API Endpoints

**Location**: `backend/api/translations.py`

**Endpoints**:

1. **GET /translations/{language}**
   - Returns all UI translations for specified language
   - Response:
     ```json
     {
       "language": "en",
       "translations": {
         "app_title": "CV Matcher",
         "match_button": "Start Match",
         ...
       }
     }
     ```

2. **GET /translations/key/{key}?language=en**
   - Get a single translation by key
   - Response:
     ```json
     {
       "key": "app_title",
       "value": "CV Matcher",
       "language": "en"
     }
     ```

3. **GET /translations/languages**
   - Get list of supported languages
   - Response:
     ```json
     {
       "languages": [
         {"code": "de", "name": "Deutsch", "flag": "🇩🇪"},
         {"code": "en", "name": "English", "flag": "🇬🇧"},
         {"code": "es", "name": "Español", "flag": "🇪🇸"}
       ]
     }
     ```

---

## Frontend Implementation

### 1. Language Context

**Location**: `src/contexts/LanguageContext.tsx`

**Key Features**:
- Manages current language state
- Fetches translations from backend on language change
- Persists language preference in localStorage
- Auto-detects browser language on first visit

**Provider Setup** (in `src/main.tsx`):
```tsx
import { LanguageProvider } from './contexts/LanguageContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
)
```

### 2. useLanguage Hook

**Usage in Components**:
```tsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div>
      <h1>{t('app_title')}</h1>
      <button onClick={() => setLanguage('en')}>
        Switch to English
      </button>
      <p>{t('pdf_with_chat', { count: 5 })}</p>
    </div>
  );
}
```

### 3. Language Toggle Component

**Location**: `src/components/LanguageToggle.tsx`

**Usage**:
```tsx
import { LanguageToggle } from './components/LanguageToggle';

<LanguageToggle />  {/* Renders 🇩🇪 🇬🇧 🇪🇸 buttons */}
```

---

## Adding New Translations

### Step 1: Add to Backend Translation Service

Edit `backend/services/translation_service.py`:

```python
UI_TRANSLATIONS: Dict[str, Dict[Language, str]] = {
    # Add new key here
    "new_feature_title": {
        "de": "Neue Funktion",
        "en": "New Feature",
        "es": "Nueva Función"
    },
    # ... existing translations
}
```

### Step 2: Use in Frontend

```tsx
function MyComponent() {
  const { t } = useLanguage();
  return <h2>{t('new_feature_title')}</h2>;
}
```

### Step 3: Deploy Backend

```bash
# Backend changes auto-deploy via Railway on push
cd GeneralBackend
git add backend/services/translation_service.py
git commit -m "Add new translation key"
git push
```

---

## Multi-Language LLM Prompts

### Current Implementation

The `translation_service` includes language-specific LLM prompts in `LLM_PROMPTS` dict:

```python
LLM_PROMPTS = {
    "match_analysis": {
        "de": "Du bist ein erfahrener HR-Analyst...",
        "en": "You are an experienced HR analyst...",
        "es": "Eres un analista de RRHH experimentado..."
    },
    "chat_rag_prompt": {
        "de": "System-Kontext:\n{system_context}...",
        "en": "System Context:\n{system_context}...",
        "es": "Contexto del Sistema:\n{system_context}..."
    }
}
```

### Using Language-Specific Prompts

**Example in `backend/api/llm.py`**:
```python
from backend.services.translation_service import translation_service

@router.post("/generate")
async def generate(request: LLMGenerateRequest):
    # Get language from request (default: 'de')
    language = request.language or "de"

    # Get localized prompt
    prompt = translation_service.get_llm_prompt(
        "match_analysis",
        language,
        cv_text=cv_text,
        job_description=job_desc
    )

    # Generate with LLM
    response = llm_gateway.generate(prompt, ...)
    return response
```

---

## Frontend: Passing Language to LLM

### Modify LLM Service

**Edit `src/services/llm.ts`**:

```typescript
import { api } from './api'
import { MatchResult } from '../types/index'

interface LLMGenerateRequest {
  prompt: string
  provider?: string
  model?: string
  temperature?: number
  max_tokens?: number
  language?: 'de' | 'en' | 'es'  // ADD THIS
}

class LLMService {
  async analyzeMatch(
    cvText: string,
    jobDescription: string,
    llmType: 'local' | 'grok' = 'local',
    language: 'de' | 'en' | 'es' = 'de'  // ADD THIS
  ): Promise<MatchResult> {
    // Instead of building prompt in frontend,
    // send raw data + language to backend
    const response = await api.post<LLMGenerateResponse>('/llm/analyze-match', {
      cv_text: cvText,
      job_description: jobDescription,
      provider: llmType === 'grok' ? 'grok' : 'ollama',
      model: llmType === 'grok' ? 'grok-3' : 'qwen2.5:3b',
      language: language,  // Pass language to backend
      temperature: 0.3,
      max_tokens: 3000,
    });

    return this.parseMatchResult(response.data.response);
  }
}
```

### Create Backend Endpoint for Match Analysis

**Add to `backend/api/llm.py`**:

```python
from backend.services.translation_service import translation_service

class AnalyzeMatchRequest(BaseModel):
    cv_text: str
    job_description: str
    provider: str = "ollama"
    model: Optional[str] = None
    language: str = "de"  # de/en/es
    temperature: float = 0.3
    max_tokens: int = 3000

@router.post("/analyze-match")
async def analyze_match(
    request: AnalyzeMatchRequest,
    user: User = Depends(current_active_user)
):
    """
    Analyze CV match with language-specific prompt.
    """
    # Get localized prompt
    prompt = translation_service.get_llm_prompt(
        "match_analysis",
        request.language,
        cv_text=request.cv_text[:2000],
        job_description=request.job_description[:2000]
    )

    # Generate with LLM
    result = llm_gateway.generate(
        prompt=prompt,
        provider=request.provider,
        model=request.model,
        temperature=request.temperature,
        max_tokens=request.max_tokens
    )

    return {
        "response": result["response"],
        "model": result["model"],
        "tokens_used": result.get("tokens_used")
    }
```

### Use in Components

**Edit `src/components/MatchingView.tsx`**:

```tsx
import { useLanguage } from '../contexts/LanguageContext';

export default function MatchingView({ ... }: MatchingViewProps) {
  const { language } = useLanguage();  // Get current language

  const handleStartMatch = async () => {
    // ...
    const result = await llmService.analyzeMatch(
      applicantText,
      employerText,
      llmType,
      language  // Pass current language
    );
    // ...
  };
}
```

---

## Testing

### 1. Test Backend Translations API

```bash
# Get German translations
curl https://general-backend-production-a734.up.railway.app/translations/de

# Get English translations
curl https://general-backend-production-a734.up.railway.app/translations/en

# Get single key
curl https://general-backend-production-a734.up.railway.app/translations/key/app_title?language=es
```

### 2. Test Language Toggle

1. Open `https://www.dabrock.info/cv-matcher/`
2. Click on 🇩🇪 🇬🇧 🇪🇸 flags in header
3. Verify UI texts change language
4. Check localStorage for `cv_matcher_language`

### 3. Test LLM Language

1. Upload CV and job description
2. Select language (DE/EN/ES)
3. Click "Start Match"
4. Verify analysis is generated in selected language

---

## Current Translation Coverage

### ✅ Fully Implemented

- **Backend**: Translation service with DE/EN/ES translations
- **Backend**: API endpoints for translations
- **Frontend**: Language Context and useLanguage hook
- **Frontend**: Language Toggle component in header
- **Frontend**: App.tsx header (title + LLM toggle labels)

### ⚠️ Partially Implemented

- **LLM Prompts**: Templates exist in backend but not yet connected to frontend
- **MatchingView**: Uses hardcoded German texts (needs `useLanguage()` integration)
- **Chat**: Uses hardcoded German texts (needs `useLanguage()` integration)
- **DocumentSection**: Uses hardcoded German texts

### ❌ Not Yet Implemented

- **Error Messages**: Still hardcoded in components
- **Progress Messages**: Still hardcoded in MatchingView
- **Chat Examples**: Still hardcoded in Chat component

---

## Roadmap for Full Implementation

### Phase 1: Core UI (COMPLETED ✅)
- [x] Backend translation service
- [x] Backend API endpoints
- [x] Frontend Language Context
- [x] Language Toggle in header
- [x] App.tsx translations

### Phase 2: LLM Integration (TODO)
- [ ] Modify `llmService.analyzeMatch()` to accept language parameter
- [ ] Create `/llm/analyze-match` backend endpoint
- [ ] Connect language parameter from MatchingView
- [ ] Test with all 3 languages

### Phase 3: Full UI Coverage (TODO)
- [ ] Translate MatchingView (buttons, progress messages, results)
- [ ] Translate Chat component (examples, labels)
- [ ] Translate DocumentSection (upload, delete buttons)
- [ ] Translate all error messages

### Phase 4: Polish (TODO)
- [ ] Add loading states during translation fetch
- [ ] Add fallback translations for missing keys
- [ ] Optimize translation caching
- [ ] Add translation validation tests

---

## Translation Keys Reference

### Header
- `app_title`: "CV Matcher"
- `llm_toggle_local`: "🏠 Local (GDPR)" / "🏠 Lokal (DSGVO)" / "🏠 Local (RGPD)"
- `llm_toggle_grok`: "⚡ GROK (non-GDPR)" / "⚡ GROK (nicht DSGVO)" / "⚡ GROK (no RGPD)"

### Document Section
- `employer_section_title`: "Employer Documents" / "Arbeitgeber Dokumente" / "Documentos del Empleador"
- `applicant_section_title`: "Applicant Documents" / "Bewerber Dokumente" / "Documentos del Candidato"
- `upload_button`: "Upload Document" / "Dokument hochladen" / "Subir Documento"
- `delete_button`: "Delete" / "Löschen" / "Eliminar"

### Matching View
- `match_button`: "Start Match" / "Match Starten" / "Iniciar Match"
- `analyzing`: "Analyzing..." / "Analysiere..." / "Analizando..."
- `match_high`: "Excellent Match" / "Sehr gute Übereinstimmung" / "Excelente Coincidencia"
- `match_medium`: "Moderate Match" / "Mittlere Übereinstimmung" / "Coincidencia Moderada"
- `match_low`: "Low Match" / "Geringe Übereinstimmung" / "Baja Coincidencia"
- `strengths_title`: "Strengths" / "Stärken" / "Fortalezas"
- `gaps_title`: "Gaps" / "Lücken" / "Brechas"
- `recommendations_title`: "Recommendations" / "Empfehlungen" / "Recomendaciones"

### Chat
- `chat_title`: "💬 Interactive Chat" / "💬 Interaktiver Chat" / "💬 Chat Interactivo"
- `chat_input_placeholder`: "Enter question..." / "Frage eingeben..." / "Ingrese pregunta..."
- `chat_send_button`: "Send" / "Senden" / "Enviar"

### Error Messages
- `error_upload_failed`: "Upload failed: {error}"
- `error_analysis_failed`: "Analysis error. Please try again."
- `error_need_documents`: "Please add documents for both sides"

**See `backend/services/translation_service.py` for the complete list of ~70 translation keys.**

---

## FAQ

**Q: How do I add a new language (e.g., French)?**

A:
1. Add `"fr"` to `Language` type in `translation_service.py`
2. Add French translations to all keys in `UI_TRANSLATIONS` and `LLM_PROMPTS`
3. Add `{code: "fr", name: "Français", flag: "🇫🇷"}` to `LANGUAGES` in `LanguageToggle.tsx`
4. Deploy backend, rebuild frontend

**Q: Why are some texts still in German after switching language?**

A: Those components haven't been migrated to use `useLanguage()` yet. See "Current Translation Coverage" section above. To fix, import `useLanguage` and replace hardcoded texts with `t('key')`.

**Q: How do I test translations locally?**

A:
1. Start backend: `cd GeneralBackend && uvicorn backend.main:app --reload`
2. Start frontend: `cd CV_Matcher && npm run dev`
3. Open http://localhost:5173
4. Toggle languages and check console for API requests to `/translations/{lang}`

**Q: Can translations be cached?**

A: Yes! `LanguageContext` stores fetched translations in state. They're only re-fetched when language changes. For production, consider adding service worker caching for `/translations/{lang}` responses.

---

## Summary

The i18n system is **partially implemented** with a solid foundation:
- ✅ Backend service with all translations ready
- ✅ API endpoints working
- ✅ Frontend context and hook ready
- ✅ Language toggle functional
- ⚠️ Some components still need migration

**Next steps**: Connect LLM prompts to language system and migrate remaining components to use `useLanguage()` hook.

---

**Last Updated**: 2025-12-23
**Version**: 1.0
**Author**: Generated by Claude Code
