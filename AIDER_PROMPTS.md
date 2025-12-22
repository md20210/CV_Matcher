# Aider Prompts für CV Matcher Development

Diese Datei enthält alle Prompts, die du Schritt-für-Schritt an Aider geben kannst.

## 🚀 Setup & Installation

Vor dem ersten Prompt:
```bash
cd /mnt/e/CodelocalLLM/CV_Matcher
npm install
aider --model claude-3-5-sonnet-20241022
```

---

## 📋 Phase 1: Authentication & Routing

### Prompt 1: Authentication Service

```
Create a complete authentication service in src/services/auth.ts that integrates with the General Backend API at https://general-backend-production-a734.up.railway.app

Requirements:
- Implement login(email, password) function that calls POST /auth/login
- Implement register(email, password) function that calls POST /auth/register
- Implement logout() function that calls POST /auth/logout
- Implement getCurrentUser() function that calls GET /users/me
- Store JWT token in localStorage
- Return proper TypeScript types from src/types/index.ts
- Handle errors with proper error messages
```

### Prompt 2: Auth Context & Hook

```
Create an AuthContext and useAuth hook in src/hooks/useAuth.tsx

Requirements:
- Create AuthContext with user state, loading state, and auth functions
- Implement useAuth hook that returns { user, loading, login, register, logout, isAuthenticated }
- Automatically load current user on app mount if token exists
- Wrap App.tsx with AuthProvider
- Handle loading and error states properly
```

### Prompt 3: Login & Register Pages

```
Create Login and Register page components in src/components/auth/

Requirements:
- Login.tsx: Email/password form with validation, error display, link to register
- Register.tsx: Email/password/confirm-password form with validation, error display, link to login
- Use TailwindCSS for styling - modern, clean design
- Show loading states during API calls
- Display API error messages to user
- Redirect to /dashboard after successful login/register
- Forms should be responsive and accessible
```

### Prompt 4: Protected Routes & Router Setup

```
Update App.tsx to implement React Router with protected routes

Requirements:
- Setup BrowserRouter with routes:
  - / → Landing page (public)
  - /login → Login page (public)
  - /register → Register page (public)
  - /dashboard → Dashboard (protected)
  - /matcher → CV Matcher page (protected)
- Create ProtectedRoute component that redirects to /login if not authenticated
- Create simple landing page with "Welcome to CV Matcher" and link to login
- Add navigation header with logout button when authenticated
```

---

## 📋 Phase 2: Dashboard & Projects

### Prompt 5: Projects Service

```
Create a projects service in src/services/projects.ts that integrates with General Backend

Requirements:
- Implement createProject(name, type, description) → calls POST /projects
- Implement listProjects() → calls GET /projects
- Implement getProject(id) → calls GET /projects/{id}
- Implement updateProject(id, data) → calls PATCH /projects/{id}
- Implement deleteProject(id) → calls DELETE /projects/{id}
- Use Project type from src/types/index.ts
- All functions should use the api client from src/services/api.ts
```

### Prompt 6: Dashboard Component

```
Create Dashboard component in src/components/dashboard/Dashboard.tsx

Requirements:
- Display list of user's projects from General Backend
- Show "Create New Project" button that opens a modal/form
- Each project card shows: name, description, created date
- Each project card has "Open" button → navigates to /matcher?project={id}
- Each project card has "Delete" button with confirmation
- Use TailwindCSS for modern card-based layout
- Show loading skeleton while fetching projects
- Show empty state if no projects exist
- Handle errors gracefully
```

### Prompt 7: Create Project Modal

```
Create ProjectCreateModal component in src/components/dashboard/ProjectCreateModal.tsx

Requirements:
- Modal dialog with form: Project Name, Description
- Automatically set type to "cv_matcher"
- On submit, call createProject from projects service
- Close modal and refresh project list on success
- Show validation errors
- Use TailwindCSS for modal styling (backdrop, centered modal, animations)
- Make modal accessible (ESC to close, click outside to close)
```

---

## 📋 Phase 3: CV Upload & Parsing

### Prompt 8: PDF Parser Utility

```
Create PDF parsing utility in src/utils/pdfParser.ts using pdf.js

Requirements:
- Implement extractTextFromPDF(file: File) → Promise<string>
- Use pdfjs-dist library to parse PDF files
- Extract all text content from all pages
- Handle errors (corrupted PDFs, unsupported formats)
- Return concatenated text from all pages
- Add proper TypeScript types
```

### Prompt 9: CV Upload Component

```
Create CVUpload component in src/components/upload/CVUpload.tsx

Requirements:
- File upload dropzone for PDF files (drag & drop or click to select)
- Accept only .pdf files
- Show file name and size after selection
- "Parse CV" button that calls extractTextFromPDF
- Display loading state while parsing
- After parsing, show extracted text in a scrollable textarea
- "Confirm & Continue" button that saves CV text to state and proceeds to next step
- Use TailwindCSS for modern dropzone styling
- Show progress indicator during parsing
```

### Prompt 10: Job Description Input

```
Create JobDescriptionInput component in src/components/upload/JobDescriptionInput.tsx

Requirements:
- Large textarea for pasting job description
- Optional fields: Job Title, Company Name
- Character count display
- "Analyze Match" button (disabled if textarea empty)
- Validation: minimum 100 characters for job description
- Use TailwindCSS for clean form styling
- Save data to state when clicking "Analyze Match"
```

---

## 📋 Phase 4: Matching Logic & LLM Integration

### Prompt 11: LLM Service

```
Create LLM service in src/services/llm.ts that calls General Backend LLM endpoint

Requirements:
- Implement analyzeMatch(cvText: string, jobDescription: string) → Promise<MatchResult>
- Call POST /llm/generate with proper prompt structure
- Prompt should ask LLM to analyze CV vs Job Description and return:
  - overallScore (0-100)
  - strengths (array of strings)
  - gaps (array of strings)
  - recommendations (array of strings)
  - detailedAnalysis (string)
- Parse LLM JSON response using parseJsonResponse utility
- Use MatchResult type from src/types/index.ts
- Handle LLM errors gracefully
```

### Prompt 12: Match Results Component

```
Create MatchResults component in src/components/matching/MatchResults.tsx

Requirements:
- Display match analysis results from LLM
- Show overall match score as large progress circle/bar (0-100%)
- Display strengths in green cards with checkmark icons
- Display gaps in yellow/orange cards with warning icons
- Display recommendations in blue cards with lightbulb icons
- Show detailed analysis in expandable section
- "New Analysis" button to start over
- "Save to Project" button to save results as document to General Backend
- Use TailwindCSS for professional results display
- Make it visually appealing and easy to scan
```

### Prompt 13: Documents Service

```
Create documents service in src/services/documents.ts

Requirements:
- Implement createTextDocument(projectId, title, content, metadata) → calls POST /documents/text
- Implement listDocuments(projectId?) → calls GET /documents
- Implement deleteDocument(id) → calls DELETE /documents/{id}
- Use Document type from src/types/index.ts
- All functions use api client from src/services/api.ts
```

---

## 📋 Phase 5: Main Matcher Page Integration

### Prompt 14: CV Matcher Page

```
Create CVMatcherPage component in src/components/matching/CVMatcherPage.tsx

Requirements:
- Multi-step wizard with 3 steps:
  1. Upload CV (CVUpload component)
  2. Enter Job Description (JobDescriptionInput component)
  3. View Results (MatchResults component)
- Step indicator/progress bar at top
- "Back" and "Next" buttons for navigation
- On step 3, call LLM service to analyze match
- Show loading state while LLM processes
- Allow saving results to current project
- If no project selected (query param), prompt to create one first
- Use TailwindCSS for wizard layout
- Make navigation smooth with transitions
```

### Prompt 15: Navigation & Layout

```
Update App.tsx and create Layout component in src/components/Layout.tsx

Requirements:
- Create Layout component with:
  - Header with logo, navigation menu, user email, logout button
  - Main content area
  - Responsive design (mobile hamburger menu)
- Navigation items: Dashboard, New Analysis
- Show user email in header when logged in
- Logout button calls useAuth().logout()
- Apply Layout to all protected routes
- Use TailwindCSS for modern navbar (sticky header, shadow, hover effects)
```

---

## 📋 Phase 6: Polish & Enhancement

### Prompt 16: Error Boundary & Error Handling

```
Create ErrorBoundary component and improve error handling across the app

Requirements:
- Create ErrorBoundary.tsx that catches React errors
- Create ErrorMessage component for consistent error display
- Add error handling to all API calls with user-friendly messages
- Create NotFound.tsx component for 404 errors
- Add error boundaries around main app sections
- Display toast notifications for success/error states
```

### Prompt 17: Loading States & Skeletons

```
Add loading states and skeleton screens throughout the app

Requirements:
- Create LoadingSpinner component
- Create SkeletonCard component for project list
- Add skeleton loaders for:
  - Dashboard while loading projects
  - Match results while LLM is processing
  - Auth pages while checking authentication
- Use TailwindCSS for smooth loading animations
- Ensure all async operations show loading state
```

### Prompt 18: Responsive Design & Mobile Optimization

```
Make the entire app fully responsive for mobile, tablet, and desktop

Requirements:
- Test and fix layout on mobile (< 640px)
- Test and fix layout on tablet (640px - 1024px)
- Ensure all components work well on touch devices
- Make forms and buttons touch-friendly (larger tap targets)
- Optimize file upload for mobile
- Test navigation menu on mobile
- Use Tailwind responsive utilities (sm:, md:, lg:, xl:)
```

### Prompt 19: Final UI Polish

```
Add final UI polish and improve user experience

Requirements:
- Add smooth transitions and animations (fade-in, slide-in)
- Improve spacing and typography for better readability
- Add helpful tooltips where needed
- Add placeholder text and hints in forms
- Ensure consistent button styles and colors throughout
- Add focus states for accessibility
- Improve color scheme for better contrast
- Add subtle hover effects on interactive elements
- Polish the landing page with better copy and design
```

---

## 🎯 Optional Enhancements

### Prompt 20: Semantic Search Integration

```
Add semantic search feature to find similar CVs in project history

Requirements:
- Create SearchDocuments component
- Call GET /documents/search with query parameter
- Display search results with match scores
- Allow filtering by project
- Show document previews
- Use semantic search to find similar candidates
```

### Prompt 21: Export Results

```
Add export functionality for match results

Requirements:
- Export to PDF button on MatchResults
- Export to JSON button
- Generate professional PDF report with:
  - Match score visualization
  - Strengths, gaps, recommendations
  - Timestamp and project info
- Use pdf-lib or jsPDF for PDF generation
```

---

## 📝 Notes for Using Aider

1. **Run prompts sequentially** - Each prompt builds on the previous one
2. **Review changes** - After each prompt, review what Aider generated
3. **Test incrementally** - Run `npm run dev` and test after each major feature
4. **Commit frequently** - Aider auto-commits, but you can also commit manually
5. **Be specific** - If Aider's output isn't what you want, give more detailed instructions

## 🔧 Debugging Commands

If something doesn't work:

```bash
# Check for TypeScript errors
npm run build

# Check for lint errors
npm run lint

# Start dev server
npm run dev
```

If Aider makes a mistake:
- You can use `/undo` in Aider to revert last change
- Or use `git reset --hard HEAD` to reset to last commit
- Then give Aider a more specific prompt

---

Ready to start! 🚀

Just copy-paste each prompt into Aider one by one, starting with Prompt 1.
