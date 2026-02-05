# SOP Builder

Visual editor for creating and managing Standard Operating Procedures (SOPs).

## Features

- **Visual Step Editor** — Add, reorder, and configure workflow steps with 12 step types:
  - Action, Review, Approval, Decision, Notification, Parallel, Wait/Timer, Compliance Check, Data Input, Automated, Escalation, Handoff
- **Transition Rules** — Define how steps connect with conditions (Always, Approved, Rejected, Custom, Timeout, Error)
- **Auto-generate Transitions** — One-click linear flow generation with smart decision branching
- **Outcomes** — Define possible end states (Completed, Approved, Rejected, Escalated, etc.)
- **JSON Editor** — Toggle between visual and raw JSON editing modes
- **Import/Export** — Save and load SOPs as JSON files
- **SOP Metadata** — Name, description, category, version, owner, department, tags, dates

## Architecture

The editor is built as reusable components that can be dropped into any React app:

```
src/components/sop/
├── sopConstants.js         # Constants, defaults, parse/serialize helpers
├── SOPStepEditor.jsx       # List-based step/transition/outcome editor
└── SOPWorkflowEditor.jsx   # Wrapper with visual/JSON toggle
```

### Standalone Usage

```jsx
import SOPWorkflowEditor from './components/sop/SOPWorkflowEditor'

<SOPWorkflowEditor
  value={jsonString}
  onChange={setJsonString}
  mode="both"  // 'visual' | 'json' | 'both'
/>
```

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- React + Vite
- Tailwind CSS v4
- Lucide React icons

## Origin

The visual editing pattern was adapted from the tournament phase editor in [pickleball.community](https://pickleball.community). The same concept of phases → steps, advancement rules → transitions, exit positions → outcomes maps naturally from tournament formats to business workflows.
