# SOP Builder Roadmap
## Self-Contained SOP Platform for External Users

**Goal:** Create a self-contained SOP process that can be used by anyone who needs to manage workflows for their objects.

**Two Usage Modes:**
1. **Hosted UI** — Use our UI to manage objects through a SOP
2. **API-Only** — Call our API to get SOP state/actions, use their own UI

---

## Current State (Feb 2026)

### ✅ Backend (70% Complete)
- SOP CRUD with JSON graph storage
- Object creation and state tracking
- Action execution with validation (roles, fields, documents)
- Decision node auto-routing with rule evaluation
- Audit trail with full history
- Asset management (file uploads)
- API key authentication
- Event system (hooks for integrations)

### ✅ Frontend (60% Complete)
- Visual SOP Designer (React Flow)
- Node/edge configuration panels
- SOP list and management
- Object tester (push through workflows)
- Multi-object tracking
- Audit trail viewer
- Notification previews
- Import/export SOPs as JSON

### ❌ Missing for External Use
- Multi-tenancy (organizations/workspaces)
- Granular permissions (SOP-level, object-level)
- Webhook delivery (actual notifications)
- Embeddable components
- API documentation (OpenAPI/Swagger)
- SDK/client libraries
- Billing/usage tracking
- Self-hosted deployment guide

---

## Phase 1: Multi-Tenancy Foundation (2-3 weeks)

### 1.1 Organizations/Workspaces
```
Organizations table:
- Id, Name, Slug, Plan, Settings, CreatedAt

OrganizationMembers table:
- OrgId, UserId, Role (Owner/Admin/Member/Viewer), InvitedAt, JoinedAt
```

**Impact:** Multiple teams can use the platform independently.

### 1.2 Scoped Resources
- All SOPs belong to an Organization
- All Objects belong to a SOP (and thus an Org)
- API keys scoped to Organization

**Schema changes:**
```sql
ALTER TABLE Sops ADD OrganizationId INT REFERENCES Organizations(Id);
ALTER TABLE ApiKeys ADD OrganizationId INT REFERENCES Organizations(Id);
```

### 1.3 Organization Settings
- Custom branding (logo, colors)
- Notification preferences
- Default SOP templates
- Member management

---

## Phase 2: Enhanced API & Documentation (1-2 weeks)

### 2.1 OpenAPI/Swagger Documentation
- Auto-generate from .NET controllers
- Interactive API explorer at `/api/docs`
- Code examples for common operations

### 2.2 API Improvements
```
GET  /api/v1/sops                     # List SOPs
GET  /api/v1/sops/{id}                # Get SOP with definition
GET  /api/v1/sops/{id}/schema         # Get just node/action schema

POST /api/v1/sops/{id}/objects        # Create object
GET  /api/v1/sops/{id}/objects/{oid}  # Get object state
GET  /api/v1/sops/{id}/objects/{oid}/available-actions  # What can be done now?
POST /api/v1/sops/{id}/objects/{oid}/actions/{edgeId}   # Execute action

GET  /api/v1/sops/{id}/objects/{oid}/audit  # Audit trail
```

### 2.3 Pagination & Filtering
- Consistent pagination (page, pageSize, total)
- Filter by status, date range, properties
- Sort options

### 2.4 Batch Operations
```
POST /api/v1/sops/{id}/objects/batch          # Create multiple
POST /api/v1/sops/{id}/objects/batch-action   # Action on multiple
```

---

## Phase 3: Webhook & Event System (1-2 weeks)

### 3.1 Webhook Subscriptions
```
Webhooks table:
- Id, OrganizationId, Url, Secret, Events[], IsActive, CreatedAt

Events to support:
- object.created
- object.status_changed
- object.completed
- action.executed
- sop.published
```

### 3.2 Webhook Delivery
- Queue-based delivery (with retries)
- Signature verification (HMAC)
- Delivery logs with response status
- Manual retry from UI

### 3.3 Notification Delivery
- Actually send emails/SMS when configured
- Integration with FXNotification
- Template variables (object name, status, actor, etc.)

---

## Phase 4: Embeddable Components (2-3 weeks)

### 4.1 Embed SDK (JavaScript)
```javascript
// Embed object tracker in any website
const sop = new SOPBuilder({
  apiKey: 'sk_...',
  containerId: 'sop-widget',
});

// Show object status and available actions
sop.renderObjectTracker({
  sopId: 1,
  objectId: 123,
  theme: 'light',
  onAction: (action, result) => { ... }
});

// Show SOP visual diagram (read-only)
sop.renderSOPDiagram({
  sopId: 1,
  highlightNodeId: 'node_xyz', // current position
});
```

### 4.2 Embeddable Widgets
1. **Object Status Card** — Current status, next actions, timeline
2. **Action Form** — Execute available action with required fields
3. **SOP Diagram** — Visual flowchart with current position highlighted
4. **Audit Timeline** — Scrollable history of actions

### 4.3 Customization Options
- Theme (light/dark/custom)
- Language/i18n
- Callback hooks
- Field rendering overrides

---

## Phase 5: Client SDKs (1-2 weeks)

### 5.1 JavaScript/TypeScript SDK
```typescript
import { SOPBuilderClient } from '@sopbuilder/sdk';

const client = new SOPBuilderClient({ apiKey: 'sk_...' });

// Create an object
const order = await client.objects.create('purchase-order-sop', {
  name: 'PO-2026-001',
  properties: { vendor: 'Acme Corp', amount: 5000 }
});

// Get available actions
const actions = await client.objects.getAvailableActions(order.id);

// Execute action
await client.objects.executeAction(order.id, 'approve', {
  properties: { approverNotes: 'Looks good' },
  documents: [{ name: 'Quote', assetId: 456 }]
});
```

### 5.2 Python SDK
```python
from sopbuilder import Client

client = Client(api_key='sk_...')

# Same operations as JS
order = client.objects.create('purchase-order-sop', name='PO-2026-001')
client.objects.execute_action(order.id, 'approve', properties={...})
```

### 5.3 C# SDK (for .NET integrations)
```csharp
var client = new SopBuilderClient("sk_...");
var order = await client.Objects.CreateAsync(sopId, new CreateObjectRequest { ... });
```

---

## Phase 6: Advanced Features (Ongoing)

### 6.1 SOP Versioning
- Publish creates immutable version
- Objects track which version they're on
- Migrate objects to new version

### 6.2 SLA & Escalations
- Time-based triggers (object stuck > 24h)
- Auto-escalation to supervisor
- SLA breach notifications

### 6.3 Reporting & Analytics
- Objects by status (pipeline view)
- Average time in each status
- Bottleneck identification
- Export to CSV/Excel

### 6.4 Templates Marketplace
- Pre-built SOPs for common workflows
- Clone and customize
- Community contributions

### 6.5 Self-Hosted Option
- Docker compose deployment
- Helm chart for Kubernetes
- Configuration guide

---

## API-Only Use Case Example

**Scenario:** E-commerce order fulfillment

1. **Setup (once)**
   - Create "Order Fulfillment" SOP in UI
   - Configure statuses: New → Processing → Shipped → Delivered
   - Set required fields per transition
   - Get API key

2. **Integration (their code)**
   ```javascript
   // When order placed
   const order = await sopClient.objects.create(sopId, {
     externalId: 'order-12345',
     name: 'Order #12345',
     properties: { customer: 'John', items: [...] }
   });

   // When warehouse picks order
   await sopClient.objects.executeAction(order.id, 'start-processing');

   // When shipped
   await sopClient.objects.executeAction(order.id, 'mark-shipped', {
     properties: { trackingNumber: 'UPS123' }
   });

   // Their UI queries current state
   const status = await sopClient.objects.get(order.id);
   // status.currentStatus = 'Shipped'
   ```

3. **Webhooks (optional)**
   - Receive `object.status_changed` events
   - Update their own database
   - Send customer notifications

---

## Hosted UI Use Case Example

**Scenario:** HR onboarding workflow

1. **Setup**
   - Create "Employee Onboarding" SOP
   - Statuses: New Hire → Documents Pending → IT Setup → Training → Complete
   - Required docs: I-9, W-4, ID scan
   - Roles: HR, IT, Manager

2. **Usage**
   - HR creates new employee object in SOP Builder UI
   - Uploads required documents
   - IT gets notified when their step is ready
   - Manager approves completion
   - Full audit trail in system

3. **Embed Option**
   - Embed status widget in HR portal
   - Employee can see their onboarding progress
   - Actions still require authentication

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 High | Multi-tenancy (Organizations) | 2 weeks | Enables multiple customers |
| 🔴 High | Webhook delivery | 1 week | Real integrations |
| 🔴 High | OpenAPI docs | 3 days | Developer adoption |
| 🟡 Medium | JavaScript SDK | 1 week | Easier API consumption |
| 🟡 Medium | Embeddable widgets | 2 weeks | Hosted UI option |
| 🟡 Medium | Notification delivery | 1 week | Email/SMS actions |
| 🟢 Low | Python/C# SDKs | 1 week each | More language support |
| 🟢 Low | Templates marketplace | 2 weeks | Growth feature |
| 🟢 Low | Self-hosted guide | 3 days | Enterprise option |

---

## Next Steps

1. ✅ Review and approve roadmap
2. ⏳ Start Phase 1: Multi-tenancy
3. ⏳ Set up webhook infrastructure
4. ⏳ Generate OpenAPI documentation

---

*This roadmap focuses on making SOP Builder a standalone product that external users can integrate with their systems. The key differentiator is flexibility: use our full UI, embed components, or go pure API.*
