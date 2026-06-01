# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Project Overview

Harvest Ping is a mobile-first application for harvest monitoring, reminders, notifications, and harvest completion approval workflows.

---

## General Rules
- Mobile-first UX.
- Keep flows simple and intuitive.
- Do not expose database IDs to users.
- Display user-friendly labels (title, name, NRP).
- Prioritize minimal clicks and clear actions.
- All critical actions must be auditable.

---

## Inbox Module

### Data Source
t_ping_reminder

### Rules
- Display notification title, message, priority, and timestamp.
- Entire notification card must be clickable.
- Confirmation should be performed from the detail page.
- Use priority-based color indicators:
  - High → Red
  - Normal → Orange
  - Low → Blue/Green

### Status Mapping
- is_acknowledged = false → Unread
- is_acknowledged = true → Acknowledged

---

## Scheduler Module

### Data Source
t_ping_scheduler

### Rules
- Always display scheduler title.
- Never display scheduler ID.
- Save selected scheduler as scheduler_id.

---

## Finish Harvest Request

### Data Source
trx_finish_harvest

### Create Request Flow
1. Select Scheduler.
2. Input Harvest Date.
3. Input Note.
4. Submit Request.

### Submission Rules
- Create record immediately.
- Set status to submitted.
- Automatically generate approval_lines.
- No draft process.

### Validation
Required:
- scheduler_id
- harvest_date
- note

---

## Approval Flow

### Status
- submitted
- approved
- rejected

### Rules
- Approval lines are generated automatically on submission.
- Approval follows configured approval sequence.
- Rejection requires remarks.

### Approval Line Structure
- approver_id
- approver_name
- status
- action_date
- remarks

---

## Approval Configuration

### Purpose
Manage users who can approve Finish Harvest requests.

### Rules
- Admin only.
- Support add, remove, and reorder approvers.
- Approval lines are generated from active configuration.
- Temporary hardcoded approvers are allowed during initial development.

---

## Auto Stop Scheduler

### Rule
When Finish Harvest status becomes approved:

- Stop related scheduler.
- Disable future reminder generation.

---

## User Profile

### Display
- Initial Avatar
- Full Name
- NRP

### Source
master_user

### Do Not Display
- Profile Picture
- Job Title
- Company

---

## Security PIN

### Change PIN
Required fields:
- Current PIN
- New PIN
- Confirm PIN

### Rules
- Support Show/Hide PIN.
- Match Login page behavior.

---

## Settings

### Rules
- Provide Logout button.
- Show confirmation dialog before logout.
- Clear session/token after logout.
- Redirect user to Login page.

---

## Database Guidelines

### Relations
Use foreign keys whenever possible.

Examples:
- scheduler_id
- receiver_id
- sender_id
- created_by
- updated_by

Avoid storing relational data in JSON unless flexibility is required.

---

## Audit Requirements

All transactional tables should support:

- created_by
- created_at
- updated_by
- updated_at

Approval-related actions should store:

- approver
- action
- action_date
- remarks

---

## UI Guidelines

### Status Colors
- Submitted → Orange
- Approved → Green
- Rejected → Red

### Design Principles
- Clean layout.
- Consistent spacing.
- Minimal shadows.
- Clear hierarchy.
- Large touch targets for mobile users.

---

## AI Development Rules

When generating features, designs, APIs, or database structures:

1. Prioritize mobile usability.
2. Never expose internal IDs.
3. Use human-readable labels.
4. Ensure business actions are traceable.
5. Prefer relational database design.
6. Keep workflows simple.
7. Follow existing approval patterns.
8. Maintain consistency across all modules.