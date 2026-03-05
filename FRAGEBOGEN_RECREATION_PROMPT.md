# Fragebogen System – Recreation Prompt

> **SCOPE**: This prompt covers ONLY frontend UI/UX implementation. No backend work is needed – assume all API endpoints already exist and return the data shapes described below. Focus exclusively on building the UI components, state management, user flows, and interactions.

> **UI REQUIREMENTS**: [INSERT YOUR UI FRAMEWORK, DESIGN SYSTEM, COMPONENT LIBRARY, AND STYLING APPROACH HERE]

> **LOCATION IN CODEBASE**: [INSERT WHERE THESE COMPONENTS SHOULD LIVE IN YOUR PROJECT STRUCTURE HERE]

---

## System Overview

The Fragebogen (questionnaire) system has three conceptual layers, internally called the "bouquet" metaphor:

1. **Questions (Plants)** – atomic question units of 10 different types
2. **Modules (Bouquets)** – named groups of ordered questions with conditional logic rules
3. **Fragebogen (Packaging)** – the final survey: a named, dated package of modules assigned to specific markets

There are two distinct user-facing sides:
- **Admin side**: Create, edit, preview, and manage Fragebogens, Modules, and Questions
- **GL (Gebietsleiter) side**: Fill out questionnaires during market visits

---

## Part 1: Question Types (10 Types)

### 1.1 Single Choice
- **Behavior**: User selects exactly ONE option from a list
- **Config**: `options: string[]` (admin defines the option labels)
- **Answer shape**: `string` (the selected option text)
- **Validation**: If required, answer must not be empty
- **UX**: Radio-button style – clicking one deselects all others

### 1.2 Yes/No (Ja/Nein)
- **Behavior**: Dichotomous question with exactly two choices
- **Config**: No options needed – always "Ja" and "Nein"
- **Answer shape**: `string` (`'Ja'` or `'Nein'`)
- **Validation**: If required, one must be selected
- **UX**: Two large buttons side by side. "Ja" styled in green tones, "Nein" in red/neutral tones

### 1.3 Multiple Choice
- **Behavior**: User selects ONE OR MORE options from a list
- **Config**: `options: string[]`
- **Answer shape**: `string[]` (array of selected option texts)
- **Validation**: If required, array must not be empty
- **UX**: Checkbox-style – each option toggles independently. Clicking an already-selected option deselects it

### 1.4 Likert Scale
- **Behavior**: User selects a numeric value on a defined scale
- **Config**: `likertScale: { min: number, max: number, minLabel: string, maxLabel: string }`
- **Answer shape**: `number` (the selected scale value)
- **Validation**: If required, a value must be selected
- **UX**: Row of numbered buttons from min to max. Labels shown at the ends (e.g., "Sehr schlecht" ↔ "Sehr gut"). Selected value is highlighted

### 1.5 Open Text
- **Behavior**: Free-text answer
- **Config**: None
- **Answer shape**: `string`
- **Validation**: If required, string must not be empty
- **UX**: Multi-line textarea, placeholder "Ihre Antwort..."

### 1.6 Open Numeric
- **Behavior**: Numeric-only free input
- **Config**: `numericConstraints: { min?: number, max?: number, decimals?: boolean }`
- **Answer shape**: `number` or empty string
- **Validation**: If required, value must be present. Respects min/max if set
- **UX**: Number input field. Step is `0.01` if `decimals` is true, otherwise `1`. Placeholder "Zahl eingeben..."

### 1.7 Slider
- **Behavior**: User drags a slider to select a numeric value
- **Config**: `sliderConfig: { min: number, max: number, step: number, unit?: string }`
- **Answer shape**: `number`
- **Validation**: If required, must have a value (defaults to min)
- **UX**: Range input with current value displayed prominently. Min/max labels at the ends with optional unit suffix (e.g., "0%" – "100%")

### 1.8 Photo Upload
- **Behavior**: User takes/uploads a photo
- **Config**: `instruction?: string` (admin-provided instruction text, e.g., "Fotografieren Sie das Display von vorne")
- **Answer shape**: `string` (file URL or identifier after upload)
- **Validation**: If required, a photo must be captured/uploaded
- **UX**: Camera icon, instruction text displayed, capture button. After capture, show confirmation indicator. The actual upload mechanism connects to your file storage

### 1.9 Matrix
- **Behavior**: Table where each row must have one column selected (like a grid of single-choice questions)
- **Config**: `matrixRows: string[], matrixColumns: string[]`
- **Answer shape**: `Record<string, string>` (maps row label → selected column label)
- **Validation**: If required, every row must have a selection
- **UX**: HTML table. First column = row labels. Each cell is a selectable button. One selection per row (radio behavior within each row)

### 1.10 Barcode Scanner
- **Behavior**: User scans a barcode/QR code
- **Config**: None
- **Answer shape**: `string` (the scanned barcode value)
- **Validation**: If required, a scan must be completed
- **UX**: Barcode icon, scan button, scanned result displayed after scan. The actual scanning mechanism connects to your device camera/scanner API

---

## Part 2: Question Data Model

```typescript
interface Question {
  id: string;
  moduleId: string;
  type: 'single_choice' | 'yesno' | 'likert' | 'multiple_choice' | 'photo_upload' 
      | 'matrix' | 'open_text' | 'open_numeric' | 'slider' | 'barcode_scanner';
  questionText: string;
  instruction?: string;          // Used by photo_upload
  required: boolean;
  order: number;
  options?: string[];            // For single_choice, multiple_choice
  likertScale?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
  };
  matrixRows?: string[];         // For matrix
  matrixColumns?: string[];      // For matrix
  numericConstraints?: {
    min?: number;
    max?: number;
    decimals?: boolean;
  };
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit?: string;
  };
  conditions?: QuestionCondition[];  // Conditional logic rules (see Part 5)
}
```

### Which config properties each type uses:

| Type             | options | instruction | likertScale | matrixRows/Columns | numericConstraints | sliderConfig |
|------------------|---------|-------------|-------------|--------------------|--------------------|--------------|
| single_choice    | ✅      |             |             |                    |                    |              |
| multiple_choice  | ✅      |             |             |                    |                    |              |
| yesno            |         |             |             |                    |                    |              |
| likert           |         |             | ✅          |                    |                    |              |
| open_text        |         |             |             |                    |                    |              |
| open_numeric     |         |             |             |                    | ✅                 |              |
| photo_upload     |         | ✅          |             |                    |                    |              |
| matrix           |         |             |             | ✅                 |                    |              |
| slider           |         |             |             |                    |                    | ✅           |
| barcode_scanner  |         |             |             |                    |                    |              |

---


---

## Part 4: Admin-Side Fragebogen Builder

### 4.1 Fragebogen List Page

- Shows all Fragebogens as cards with: name, description, status badge, date range, module count, market count, response count
- Status: `active` (green), `scheduled` (blue), `inactive` (gray)
- Actions: edit, archive/unarchive, delete, preview
- Search bar filters by name/description
- "Fragebogen erstellen" button opens the creation wizard

### 4.2 Create/Edit Fragebogen Wizard (4 steps)

**Step 1 – Name**: Fragebogen name (required) and description (optional)

**Step 2 – Modules**: 
- Browse existing modules from the library
- Search by name, description, or question text within modules
- Add modules to the fragebogen by clicking
- Drag-and-drop to reorder selected modules
- Each module shows its question count and a preview of question texts
- Button to create a new module inline

**Step 3 – Settings**:
- **Time**: Toggle between "Immer aktiv" (always active) and "Zeitlich begrenzt" (date-bounded with start/end date pickers)
- **Markets**: Multi-select market assignment with filters:
  - Chain (Handelskette)
  - PLZ (postal code)
  - Address
  - GL (Gebietsleiter)
  - Subgroup
  - Active/inactive status
- Select all / deselect all functionality

**Step 4 – Conflicts** (conditional):
- Only shown if selected markets are already assigned to other active Fragebogens
- Lists conflicts with market name, conflicting fragebogen name
- User can proceed (markets will have multiple fragebogen) or go back to adjust

### 4.3 Module Builder (CreateModuleModal)

**Module properties**: Name (required), description (optional)

**Question management**:
- **Add**: Click one of 10 question type buttons in a toolbar. New question appears at the bottom with an inline editor expanded
- **Import**: Import existing questions from the database. Search, filter by type, select, add
- **Reorder**: Drag-and-drop with drag handles
- **Edit**: Click a question card to expand its inline editor:
  - Question text (Fragetext) – required
  - Required toggle (Pflichtfrage) – default true
  - Type-specific config:
    - **Single/Multiple Choice**: Add/remove/edit option strings. "Option hinzufügen" button
    - **Likert**: Min value, max value, min label, max label
    - **Matrix**: Add/remove/edit row labels and column labels
    - **Numeric**: Min, max, decimals toggle
    - **Slider**: Min, max, step, unit
    - **Photo**: Instruction text
  - Conditional logic editor (see Part 5)
- **Delete**: Trash icon removes the question and renumbers remaining ones

**Copy-on-write**: When editing a question used by multiple modules, the system creates a copy for this module so other modules are unaffected.

### 4.4 Fragebogen Detail View

- Shows fragebogen metadata (name, description, dates, status)
- Lists all modules with their questions
- Shows assigned markets with visit/response counts
- Actions: edit, preview, archive, delete
- "Vorschau" (preview) button opens the preview modal

### 4.5 Module Detail View

- Shows module metadata and full question list
- Each question shows type badge, text, required indicator
- Shows which Fragebogens use this module
- "Vorschau" button to preview the module's questions

---

## Part 5: Conditional Logic (Bedingte Logik)

### 5.1 Concept

Questions can be dynamically shown or hidden based on answers to previous questions. Rules are defined at the module level and stored per question.

### 5.2 Data Model

```typescript
interface QuestionCondition {
  id: string;
  triggerQuestionId: string;      // Which question's answer drives this rule
  triggerAnswer: string | number; // The value to compare against
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  triggerAnswerMax?: number;      // Second value for 'between' operator
  action: 'hide' | 'show';       // What to do with target questions
  targetQuestionIds: string[];    // Which questions are affected
}
```

### 5.3 Operators

| Operator | Comparison | Available for types |
|----------|-----------|---------------------|
| `equals` | `String(answer) === String(triggerAnswer)` | All trigger-capable types |
| `not_equals` | `String(answer) !== String(triggerAnswer)` | All trigger-capable types |
| `greater_than` | `Number(answer) > Number(triggerAnswer)` | open_numeric, slider |
| `less_than` | `Number(answer) < Number(triggerAnswer)` | open_numeric, slider |
| `between` | `answer >= triggerAnswer && answer <= triggerAnswerMax` | open_numeric, slider |
| `contains` | `String(answer).includes(String(triggerAnswer))` | Supported at runtime but not exposed in admin UI |

### 5.4 Trigger-Capable Question Types

Only these types can be used as triggers (they have evaluable, discrete answer sets):
- single_choice, multiple_choice, yesno, likert, matrix, open_numeric, slider

NOT usable as triggers: open_text, photo_upload, barcode_scanner

### 5.5 Trigger Answer Sources (for the admin UI)

| Trigger type | Available answers to choose from |
|-------------|----------------------------------|
| yesno | `['Ja', 'Nein']` |
| single_choice / multiple_choice | The question's `options` array |
| likert | Numbers from `min` to `max` |
| matrix | `"RowLabel: ColumnLabel"` combinations |
| open_numeric / slider | Free numeric input field |

### 5.6 Target Rules

- A rule can only target questions that come AFTER the trigger question (by order)
- Multiple target questions per rule (checkboxes)
- A question can be targeted by multiple rules from different triggers

### 5.7 Evaluation Logic

```
isQuestionHidden(questionId, currentAnswers):
  For each question in allQuestions:
    For each condition on that question:
      If this condition targets questionId:
        Evaluate the trigger answer against the condition
        If condition met AND action is 'hide' → return TRUE (hidden)
        If condition NOT met AND action is 'show' → return TRUE (hidden)
  return FALSE (visible)
```

Key behaviors:
- **Hide rules**: Question is hidden if ANY hide rule's condition is met (OR logic)
- **Show rules**: Question is visible only if ALL show rules' conditions are met (AND logic)
- **Mixed**: Hide takes precedence – if any hide condition is met, question is hidden regardless of show rules

### 5.8 Navigation with Conditions

When navigating Next/Previous, hidden questions are skipped:
```
findNextVisibleIndex(fromIndex, answers):
  Loop from fromIndex+1 to end: return first index where !isQuestionHidden(...)

findPrevVisibleIndex(fromIndex, answers):
  Loop from fromIndex-1 to 0: return first index where !isQuestionHidden(...)
```

### 5.9 Progress with Conditions

Currently, progress bar counts ALL questions (including hidden ones) in totalSteps. This means progress can appear to "jump" when hidden questions are skipped. Consider whether you want to adjust this to only count visible questions.

### 5.10 Validation with Conditions

Hidden questions are never shown to the user, so their `required` status is never validated. They are effectively optional for that answer path.

### 5.11 Admin UI for Conditional Logic

Located inside the question editor (expandable section labeled "Bedingte Logik"):
- Collapsible section with a branch icon and rule count badge
- "Regel hinzufügen" button to add a new rule
- Each rule shows:
  - Trigger question dropdown (only previous questions of trigger-capable types)
  - Operator dropdown (filtered by trigger question type)
  - Answer/value input (dropdown for choice types, number input for numeric)
  - Second value input for `between` operator
  - Action selector: "Verstecke Fragen" (hide) / "Zeige Fragen" (show)
  - Target question checkboxes (only later questions)
  - Remove button

---

## Part 6: Preview System

### 6.1 Admin Preview Modal

- Opened from Fragebogen detail or Module detail views
- Simulates the full GL questionnaire experience in a modal
- Full conditional logic is active (questions show/hide based on answers)
- All question types are interactive
- Photo and barcode use simulated placeholders (no real capture)
- Progress bar, step counter, module indicator all work
- Navigation respects conditional visibility (skips hidden questions)
- On completion, modal closes – no data is persisted (preview only)

---

## Part 7: API Service Layer (Frontend Calls)

All API calls go through a `fragebogenService` object. Base URL: `{API_BASE}/api/fragebogen`

### Questions API
- `GET /questions` – List all (filters: type, is_template, archived, search)
- `GET /questions/:id` – Get single question
- `POST /questions` – Create new question
- `PUT /questions/:id` – Update question
- `DELETE /questions/:id` – Archive (soft delete)
- `GET /questions/:id/module-count` – How many modules use this question (for copy-on-write)

### Modules API
- `GET /modules` – List all (filters: archived, search)
- `GET /modules/:id` – Get single with questions and conditional rules
- `POST /modules` – Create (with questions array and rules array)
- `PUT /modules/:id` – Update
- `POST /modules/:id/duplicate` – Duplicate module
- `PUT /modules/:id/archive` – Archive/unarchive
- `DELETE /modules/:id` – Soft delete
- `GET /modules/:id/usage` – Which fragebogen use this module

### Fragebogen API
- `GET /fragebogen` – List all (filters: status, archived, search)
- `GET /fragebogen/:id` – Get single with modules, questions, rules, markets
- `POST /fragebogen` – Create (name, description, dates, module_ids, market_ids)
- `PUT /fragebogen/:id` – Update
- `PUT /fragebogen/:id/archive` – Archive/unarchive
- `DELETE /fragebogen/:id` – Soft delete

### Responses API
- `GET /responses/fragebogen/:id` – List responses for a fragebogen
- `GET /responses/:id` – Get single response with answers
- `POST /responses` – Start a response (fragebogen_id, gebietsleiter_id, market_id)
- `PUT /responses/:id` – Update answers
- `PUT /responses/:id/complete` – Mark as completed

---

## Part 8: Key UX Details and Edge Cases

### 8.1 Question Editor Specifics
- Options (single/multiple choice): Empty options are allowed during editing but should be filtered on save
- Likert: Min/max can be any integers; typically 1–5 or 1–7
- Matrix: Minimum 1 row and 2 columns
- Numeric: All constraints are optional (min, max, decimals)
- Slider: All config values are required (min, max, step)

### 8.2 Module Reuse
- The same module can be used in multiple Fragebogens
- Questions within a module are shared by reference
- Copy-on-write: editing a shared question creates a copy for the current module

### 8.3 Market Assignment
- Markets are assigned at the Fragebogen level
- A market can have multiple active Fragebogens (shown as conflicts in the wizard)
- GLs see Fragebogens for markets assigned to them (via market's `gebietsleiter_id`)

### 8.4 Status Logic
- `active`: Currently running (within date range or always active)
- `scheduled`: Start date is in the future
- `inactive`: Archived or ended

### 8.5 Offline (GL side)
- Active visit data saved to localStorage
- Includes: answers, zeiterfassung times, market info, module data
- Restored on app reload if visit was interrupted
- Pending API calls tracked with sync flags and retried when online

### 8.6 Answer Normalization
- Yes/No answers are stored as strings `'Ja'`/`'Nein'` (not booleans)
- Numeric answers from open_numeric may be stored as `number` or empty `string`
- Matrix answers are `Record<string, string>` (row → column)
- Multiple choice answers are `string[]`

---

## Implementation Checklist

- [ ] Question renderer component (switch on 10 types)
- [ ] Answer state management (`Record<string, any>`)
- [ ] Validation logic (`canProceed` per question type)
- [ ] Step navigation (prev/next with index tracking)
- [ ] Progress bar and step counter
- [ ] Module indicator (shows which module current question belongs to)
- [ ] Conditional logic evaluator (`isQuestionHidden`)
- [ ] Navigation that skips hidden questions
- [ ] Completion screen
- [ ] Admin: Fragebogen list page with search and status filters
- [ ] Admin: Create/edit wizard (4 steps: name → modules → settings → conflicts)
- [ ] Admin: Module builder with drag-and-drop question ordering
- [ ] Admin: Question inline editor with type-specific config
- [ ] Admin: Conditional logic editor (trigger, operator, answer, action, targets)
- [ ] Admin: Preview modal with full interactivity
- [ ] Admin: Fragebogen and Module detail views
- [ ] Offline persistence for GL-side visits
- [ ] Service layer connecting to all API endpoints above
