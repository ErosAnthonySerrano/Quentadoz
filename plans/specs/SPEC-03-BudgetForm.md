# SPEC-03: Budget Form
## Quentadoz — Feature Specification

---

## Overview

The Budget Form allows users to create or edit a monthly budget. It is a multi-step form that first asks how many cutoffs the user has this month, then presents a separate section of fields for each cutoff.

---

## Routes

| Route | Purpose |
|---|---|
| /budget/new | Create a new monthly budget |
| /budget/[id]/edit | Edit an existing budget month |

---

## Step 1: Cutoff Selection

- Display a question: *"How many salary cutoffs do you have this month?"*
- Show selector buttons for 1, 2, 3, 4 cutoffs
- Include an "Add more" option that shows a number input for 5+
- User clicks Next to proceed to Step 2
- The selected cutoff count determines how many sections appear in Step 2

---

## Step 2: Per-Cutoff Entry

Render one section per cutoff. Each section is visually distinct with a labeled header (e.g. "1st Cutoff", "2nd Cutoff").

### Section Header Fields

- Salary amount for this cutoff (numeric input, required)
- Date of salary credit (date picker, required)

### Budget Item Fields (per row)

| Field | Type | Required? |
|---|---|---|
| Name | Text input | Yes |
| Amount | Numeric input | Yes |
| Due Date | Date picker | Yes |
| Divide to cutoffs | Button (see below) | No |
| Custom columns | Dynamic (see below) | No |

### Add / Remove Rows

- Each section has an "+ Add Item" button that appends a new empty row
- Each row has a remove (trash) button to delete it
- Minimum 1 row per cutoff section

### Divide Item to Multiple Cutoffs

- Each row has a "Divide" icon button
- Clicking it opens a small popover/modal showing all available cutoffs as checkboxes
- User selects which cutoffs this item should appear in
- When confirmed, the item is automatically duplicated into the selected cutoff sections with the amount divided equally
- The divided amount is shown in each target cutoff row and is editable
- The original row in the source cutoff is updated or removed depending on the user's selection

### Custom Columns

- Each cutoff section has an "+ Add Column" button
- Clicking it prompts the user for a column name
- The new column appears in all rows within that cutoff section as a text input
- Custom column data is stored in the `custom_fields` jsonb column in `budget_items`
- Custom columns are per cutoff section, not global across all cutoffs

---

## Step 3: Review and Submit

- Show a summary of all cutoffs with total items and total amounts before saving
- User clicks "Save Budget" to submit
- All data is saved to `budget_months`, `cutoffs`, and `budget_items` tables in one transaction
- On success, redirect to `/dashboard`
- On error, show an error message and keep the form data intact

---

## Reuse Previous Month Budget

- On the Step 1 screen, show a "Reuse last month's budget" option if a previous month's budget exists
- Clicking it pre-fills all cutoff sections with the same items and amounts from the previous month
- Dates are left blank for the user to fill in
- Salary amounts are pre-filled but editable
- Status is reset to `'unpaid'` for all items
- User can still edit, add, or remove items before saving

---

## Form Validation

- All required fields must be filled before allowing submission
- Amount fields must be positive numbers
- Due date must be a valid date
- Salary amount must be a positive number
- Show inline validation errors below each field using React Hook Form + Zod
- Disable the Submit button while validation is failing or form is submitting

---

## Edit Mode

- When accessing `/budget/[id]/edit`, pre-fill all form fields with existing data
- Show a "Last edited" timestamp at the top
- Allow full editing of all fields including adding or removing cutoff sections
- Saving in edit mode updates the existing records rather than creating new ones

> **Note:** Changing the cutoff count in edit mode should warn the user that items in removed cutoffs will be deleted.
