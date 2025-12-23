# CV Matcher - Quick Start After Crash

> **Purpose:** Fast onboarding for Claude Code after system crash. Read this FIRST before touching any code!

**Related:** See `../GeneralBackend/SYSTEM_OVERVIEW.md` for full system architecture.

---

## 🚀 30-Second Overview

**What is this?**
AI-powered CV-to-Job matching app with multi-language support and RAG chat.

**Tech Stack:**
- React + TypeScript + Vite
- FastAPI backend (separate repo)
- Deployed: Strato SFTP (no auto-deploy)

**Live URL:** `https://www.dabrock.info/cv-matcher/`

---

## 📁 Project Structure

```
CV_Matcher/
├── src/
│   ├── components/
│   │   ├── Chat.tsx              # RAG chat (accepts InMemoryDocument[])
│   │   ├── MatchingView.tsx      # Match results + chat integration
│   │   ├── DocumentSection.tsx   # Upload UI
│   │   └── LanguageToggle.tsx    # DE/EN/ES switcher (flags)
│   ├── contexts/
│   │   └── LanguageContext.tsx   # Global language state
│   ├── services/
│   │   ├── api.ts                # Axios + auth interceptor
│   │   ├── chat.ts               # Chat API (IN-MEMORY RAG!)
│   │   ├── llm.ts                # Match analysis API
│   │   └── auth.ts               # Auto-login (test@dabrock.info)
│   └── App.tsx                   # Main component
├── dist/                         # Build output (upload this!)
├── package.json
└── vite.config.ts

docs/
├── I18N_DOCUMENTATION.md         # Frontend i18n guide
└── (this file) QUICK_START.md
```

---

## ⚡ Common Tasks

### 1. Local Development

```bash
cd /mnt/e/CodelocalLLM/CV_Matcher
npm run dev  # Opens http://localhost:5173
```

**Auto-login:** Frontend auto-logs in as `test@dabrock.info` (see `src/App.tsx:28`)

### 2. Build for Production

```bash
npm run build  # Creates dist/
```

**Output:** `dist/index.html`, `dist/assets/index-HASH.js`, `dist/assets/index-HASH.css`

**⚠️ Important:** Hash changes with each build! Must upload ALL files.

### 3. Deploy to Strato (Manual)

```bash
cd dist
# ⚠️ Ask user for current SFTP credentials (they change!)
SFTP_USER="su403214"
SFTP_PASS="[ASK USER]"
SFTP_HOST="5018735097.ssh.w2.strato.hosting"

# Upload all files
curl -T "index.html" "sftp://$SFTP_HOST/dabrock-info/cv-matcher/index.html" \
  --user "$SFTP_USER:$SFTP_PASS" --ftp-create-dirs -k

# Upload JS (filename has hash!)
curl -T "assets/index-*.js" "sftp://$SFTP_HOST/dabrock-info/cv-matcher/assets/" \
  --user "$SFTP_USER:$SFTP_PASS" --ftp-create-dirs -k

# Upload CSS
curl -T "assets/index-*.css" "sftp://$SFTP_HOST/dabrock-info/cv-matcher/assets/" \
  --user "$SFTP_USER:$SFTP_PASS" --ftp-create-dirs -k
```

**Verify:** Visit `https://www.dabrock.info/cv-matcher/` and check browser console

---

## 🔍 Key Features & How They Work

### 1. Multi-Language (DE/EN/ES)

**How it works:**
1. `LanguageContext` fetches translations from backend on mount
2. `LanguageToggle` component switches language
3. All UI text uses `t('translation_key')` function

**Example:**
```typescript
const { t } = useLanguage();
<button>{t('match_button')}</button>  // "Match Starten" in German
```

**Backend:** `GET /translations/{language}` returns ~70 translation keys

### 2. In-Memory RAG Chat

**🚨 CRITICAL:** This is NOT database RAG! Documents sent with each request.

**Flow:**
1. User uploads documents (employer + applicant)
2. `MatchingView` converts to `InMemoryDocument[]` format:
   ```typescript
   const inMemoryDocuments = useMemo(() => [
     { filename: "CV.pdf", content: "...", type: "applicant" },
     { filename: "Job.docx", content: "...", type: "employer" }
   ], [employerDocs, applicantDocs]);
   ```
3. `Chat` component receives `documents` prop
4. When user asks question, `chatService.sendMessage()` includes documents in request body
5. Backend generates embeddings on-the-fly and searches for relevant chunks
6. LLM generates answer using retrieved context

**Why in-memory?**
- ✅ GDPR-compliant (no persistence)
- ✅ No database setup needed
- ✅ Works immediately after upload

**Tradeoff:**
- ⚠️ Larger payload (~200KB per request)
- ⚠️ Embeddings regenerated each time

### 3. Document Upload

**Supported formats:** PDF, TXT, DOCX, URL

**Upload modes:**
- **File:** Drag-and-drop or click to select
- **URL:** Paste URL (backend fetches content)
- **Text:** Direct text input

**Processing:**
1. Frontend sends file/URL/text to backend `/documents` endpoint
2. Backend extracts text content
3. Returns `Document` object with ID and content
4. Frontend stores in `employerDocs` or `applicantDocs` state

### 4. Match Analysis

**Flow:**
1. User clicks "Match Starten"
2. Frontend combines all employer + applicant docs
3. Sends to `POST /llm/analyze`:
   ```typescript
   {
     applicant_text: "...",  // Combined applicant docs
     employer_text: "...",   // Combined employer docs
     llm_type: "grok",       // or "local"
     language: "de"          // Current UI language
   }
   ```
4. Backend uses LLM to analyze match
5. Returns structured result:
   ```typescript
   {
     overallScore: 75,
     strengths: ["5+ years Python", "AWS experience"],
     gaps: ["No Kubernetes"],
     recommendations: ["Take CKA cert"],
     comparison: [{requirement, applicant_match, match_level, confidence}, ...],
     detailedAnalysis: "..."
   }
   ```
6. Frontend displays results in `MatchingView`

---

## 🐛 Debugging

### Problem: Translations not loading

**Symptoms:**
- UI shows translation keys instead of text (e.g., "match_button" instead of "Match Starten")
- Browser console error: `GET /translations/de 500`

**Causes:**
1. Backend crashed (check Railway)
2. CORS error (check `ALLOWED_ORIGINS`)
3. Network error (check internet connection)

**Fix:**
1. Open browser DevTools → Network tab
2. Look for failed `/translations/de` request
3. Check response body for error message
4. Fix backend and redeploy

### Problem: Chat not answering correctly

**Symptoms:**
- Chat says "No relevant documents found"
- Chat gives generic answers (not using CV content)

**Causes:**
1. `documents` prop not passed to Chat component
2. Documents array is empty
3. Backend embedding model not loaded

**Fix:**
1. Check React DevTools → Chat component props → `documents` should be array with items
2. Check `MatchingView` → `inMemoryDocuments` useMemo is working
3. Check backend logs for "In-Memory RAG mode: X documents provided"

### Problem: Build fails

**Common errors:**

**TypeScript error: `Property 'documents' does not exist`**
```typescript
// FIX: Make sure InMemoryDocument is imported
import { InMemoryDocument } from '../services/chat';
```

**Vite error: `Failed to resolve import`**
```bash
# FIX: Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Memory error during build**
```bash
# FIX: Increase Node memory limit
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Problem: Deployed frontend shows old version

**Causes:**
1. Browser cache
2. Only uploaded index.html, not JS/CSS files
3. Wrong SFTP path

**Fix:**
1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Upload ALL files from `dist/` folder
3. Verify SFTP path: `/dabrock-info/cv-matcher/`

---

## 🔥 Emergency Fixes

### Frontend completely broken

```bash
# 1. Rollback to last working build (if saved)
cd /mnt/e/CodelocalLLM/CV_Matcher/dist
# Upload previous dist/ folder

# 2. Or rebuild from last commit
git log --oneline  # Find last working commit
git checkout COMMIT_HASH
npm install
npm run build
# Upload dist/
```

### Backend API down

**Can't fix from frontend!** Escalate to backend fix:
1. Check `../GeneralBackend/SYSTEM_OVERVIEW.md`
2. Fix backend issue
3. Push to GitHub (auto-deploys to Railway)
4. Wait ~10 minutes for deployment

**Temporary workaround:** Display error message to users

### SFTP credentials invalid

**Symptom:** `curl: (67) Login denied`

**Fix:**
1. Ask user for current credentials
2. Update command with new credentials
3. Try upload again

**Alternative:** Use FileZilla or another SFTP client

---

## 📊 Current State Checklist

When you (Claude) start working, check these:

- [ ] **Backend Status:** Is `https://general-backend-production-a734.up.railway.app/docs` accessible?
- [ ] **Frontend Status:** Does `https://www.dabrock.info/cv-matcher/` load without errors?
- [ ] **Last Deployment:** Check `dist/index.html` timestamp
- [ ] **Git Status:** `git status` - any uncommitted changes?
- [ ] **Dependencies:** `npm install` needed?

---

## 📝 Important Files to Know

### Critical (Don't break these!)

1. **`src/components/MatchingView.tsx`**
   - Main app logic
   - RAG chat integration
   - Document format conversion

2. **`src/services/chat.ts`**
   - InMemoryDocument interface
   - Chat API integration
   - **MUST include `documents` parameter!**

3. **`src/contexts/LanguageContext.tsx`**
   - Global language state
   - Translation fetching
   - Don't break this or entire UI becomes English keys

### Configuration (Rarely change)

- `vite.config.ts` - Build config
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript settings

### Generated (Never edit!)

- `dist/` - Build output (overwritten on each build)
- `node_modules/` - Dependencies

---

## 🎯 Quick Wins for New Features

### Add a new UI translation

1. Add key to backend `translation_service.py`
2. Push backend (auto-deploys)
3. Use in frontend: `{t('new_key')}`
4. Build and deploy frontend

### Add a new language

1. Update backend `Language` type to include new code
2. Add translations for all ~70 keys
3. Add flag to `LanguageToggle.tsx`
4. Deploy both backend and frontend

### Fix a chat issue

1. Check `documents` prop is passed correctly
2. Check browser console for errors
3. Check backend logs for RAG mode detection
4. Verify embeddings are generated (backend logs: "📄 In-Memory RAG mode")

---

## 📚 Full Documentation

For deep dives, see:

- **System Architecture:** `../GeneralBackend/SYSTEM_OVERVIEW.md`
- **RAG Implementation:** `../GeneralBackend/docs/RAG_CHAT_SERVICE.md`
- **Translation API:** `../GeneralBackend/docs/TRANSLATION_SERVICE.md`
- **Frontend i18n:** `docs/I18N_DOCUMENTATION.md`
- **Project Overview:** `README.md`

---

**Remember:** Frontend has NO Git remote! All changes are local only. Backend auto-deploys from GitHub.

**Last Updated:** 2025-12-23 by Claude Code
