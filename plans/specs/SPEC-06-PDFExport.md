# SPEC-06: PDF Export
## Quentadoz — Feature Specification

---

## Overview

Users can export any month's budget data as a PDF from the History page. PDF generation is done entirely client-side using `@react-pdf/renderer`, so no server is involved.

---

## Trigger

- "Export to PDF" button on each month row in the History page
- Clicking it generates the PDF in the browser and triggers an automatic download
- File name format: `Quentadoz-Budget-[Month]-[Year].pdf` (e.g. `Quentadoz-Budget-April-2025.pdf`)

---

## PDF Content Structure

### Page Header

- App name: "Quentadoz" in accent color
- Month and year: e.g. "April 2025 Budget Summary"
- Generated date: e.g. "Generated on April 11, 2025"
- Horizontal rule below the header

### Per-Cutoff Section

For each cutoff:

- Section heading: e.g. "1st Cutoff — PHP 15,000.00 — April 5, 2025"
- A table with columns: Item Name, Amount, Due Date, Status
- A summary row at the bottom: Total Expenses and Remaining Balance

### Monthly Summary Section

- Heading: "Monthly Summary"
- Total Salary (all cutoffs)
- Total Expenses (all cutoffs)
- Total Savings

### Page Footer

- Page numbers: "Page X of Y"
- "Exported from Quentadoz" text

---

## PDF Styling

- Clean, minimal style — white background, dark text
- Accent color (`#2A6E4E`) used for headings and section labels
- Table header rows use a light gray background (`#F1EFE9`)
- Alternating row shading for readability
- Font: Helvetica (built into `@react-pdf/renderer`, no external fonts needed)
- Page size: A4
- Margins: 40pt on all sides

---

## Implementation Notes

- Create a React component (`MonthPDFDocument`) using `@react-pdf/renderer` primitives (`Document`, `Page`, `View`, `Text`, `StyleSheet`)
- Use `pdf(MonthPDFDocument).toBlob()` to generate the blob, then create an object URL and trigger download
- Show a loading spinner on the Export button while generating
- Wrap generation in try/catch and show an error toast if it fails

> **Note:** `@react-pdf/renderer` renders in a Web Worker. Keep the PDF component stateless and receive all data as props.
