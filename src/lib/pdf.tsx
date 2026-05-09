import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet, pdf as reactPdf } from '@react-pdf/renderer'
import type { BudgetItem, Cutoff, BudgetMonth } from '@/types'

// ─── Local helpers (inline to avoid SSR import issues) ───────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function fmtCurrency(amount: number): string {
  const n = Number(amount) || 0
  return 'PHP ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
}

function ordinalLabel(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]) + ' Cutoff'
}

// ─── Color tokens ─────────────────────────────────────────────────────────────

const ACCENT     = '#13AE83'
const LIGHT_GRAY = '#F1F5F4'
const ALT_ROW    = '#F8FFFE'
const WHITE      = '#FFFFFF'
const DARK       = '#0E2036'
const BODY       = '#2B3E52'
const MUTED      = '#6B7E8F'
const DANGER     = '#D24747'
const SAFE       = '#13AE83'
const BORDER     = '#D4E8E1'

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: DARK,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: WHITE,
  },

  // Header
  headerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logo:        { width: 140 },
  monthTitle:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 3 },
  generatedOn: { fontSize: 9, color: MUTED, marginBottom: 14 },
  divider:     { borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 16 },

  // Cutoff section
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    marginBottom: 6,
    marginTop: 14,
  },

  // Table
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: LIGHT_GRAY,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: ALT_ROW,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
  },

  // Columns — header
  colItemHead:   { flex: 2.5, paddingHorizontal: 8, fontSize: 9, fontFamily: 'Helvetica-Bold', color: MUTED },
  colAmountHead: { flex: 1.2, paddingHorizontal: 8, fontSize: 9, fontFamily: 'Helvetica-Bold', color: MUTED, textAlign: 'right' },
  colDueHead:    { flex: 1.5, paddingHorizontal: 8, fontSize: 9, fontFamily: 'Helvetica-Bold', color: MUTED },
  colStatusHead: { flex: 0.8, paddingHorizontal: 8, fontSize: 9, fontFamily: 'Helvetica-Bold', color: MUTED },

  // Columns — body
  colItem:   { flex: 2.5, paddingHorizontal: 8, fontSize: 9, color: BODY },
  colAmount: { flex: 1.2, paddingHorizontal: 8, fontSize: 9, color: BODY, textAlign: 'right' },
  colDue:    { flex: 1.5, paddingHorizontal: 8, fontSize: 9, color: BODY },
  colStatus: { flex: 0.8, paddingHorizontal: 8, fontSize: 9 },

  // Cutoff summary row
  cutoffSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: LIGHT_GRAY,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 10,
  },
  summaryText: { fontSize: 9, color: MUTED },
  summaryBold: { fontFamily: 'Helvetica-Bold', color: BODY },

  // Monthly summary
  monthlySummaryTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    marginTop: 20,
    marginBottom: 8,
  },
  monthlySummaryBox: {
    backgroundColor: LIGHT_GRAY,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  monthlyLabel:        { fontSize: 10, color: BODY },
  monthlyValue:        { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BODY },
  monthlyValueDanger:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DANGER },
  monthlyValueSafe:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: SAFE },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 26,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: MUTED },
})

// ─── Data interface ───────────────────────────────────────────────────────────

export interface MonthPDFData {
  budgetMonth: BudgetMonth
  cutoffs: Cutoff[]
  items: BudgetItem[]
  logoUrl: string
}

// ─── Document component ───────────────────────────────────────────────────────

export function MonthPDFDocument({ data }: { data: MonthPDFData }) {
  const { budgetMonth, cutoffs, items, logoUrl } = data
  const monthLabel = MONTH_NAMES[budgetMonth.month - 1]
  const totalSalary   = cutoffs.reduce((sum, c) => sum + Number(c.salary), 0)
  const totalExpenses = items.reduce((sum, i) => sum + Number(i.amount), 0)
  const totalSavings  = totalSalary - totalExpenses

  const now = new Date()
  const generatedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Image src={logoUrl} style={styles.logo} />
        </View>
        <Text style={styles.monthTitle}>{monthLabel} {budgetMonth.year} Budget Summary</Text>
        <Text style={styles.generatedOn}>Generated on {generatedDate}</Text>
        <View style={styles.divider} />

        {/* ── Per-cutoff sections ──────────────────────────────────────────── */}
        {cutoffs.map((cutoff) => {
          const cutoffItems    = items.filter((i) => i.cutoff_id === cutoff.id)
          const cutoffExpenses = cutoffItems.reduce((sum, i) => sum + Number(i.amount), 0)
          const remaining      = Number(cutoff.salary) - cutoffExpenses

          return (
            <View key={cutoff.id}>
              <Text style={styles.sectionTitle}>
                {ordinalLabel(cutoff.cutoff_number)}
                {cutoff.salary ? ` — ${fmtCurrency(Number(cutoff.salary))}` : ''}
                {cutoff.date   ? ` — ${fmtDate(cutoff.date)}` : ''}
              </Text>

              {/* Table header */}
              <View style={styles.tableHeaderRow}>
                <Text style={styles.colItemHead}>Item Name</Text>
                <Text style={styles.colAmountHead}>Amount</Text>
                <Text style={styles.colDueHead}>Due Date</Text>
                <Text style={styles.colStatusHead}>Status</Text>
              </View>

              {/* Item rows */}
              {cutoffItems.length === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.colItem, { fontFamily: 'Helvetica-Oblique', color: MUTED }]}>
                    No items
                  </Text>
                </View>
              ) : cutoffItems.map((item, rowIdx) => (
                <View key={item.id} style={rowIdx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.colItem}>{item.name}</Text>
                  <Text style={styles.colAmount}>{fmtCurrency(Number(item.amount))}</Text>
                  <Text style={styles.colDue}>{fmtDate(item.due_date)}</Text>
                  <Text style={[styles.colStatus, { color: item.status === 'paid' ? SAFE : MUTED }]}>
                    {item.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              ))}

              {/* Cutoff summary */}
              <View style={styles.cutoffSummaryRow}>
                <Text style={styles.summaryText}>
                  {'Total Expenses: '}
                  <Text style={styles.summaryBold}>{fmtCurrency(cutoffExpenses)}</Text>
                </Text>
                <Text style={styles.summaryText}>
                  {'Remaining Balance: '}
                  <Text style={[styles.summaryBold, { color: remaining < 0 ? DANGER : SAFE }]}>
                    {fmtCurrency(remaining)}
                  </Text>
                </Text>
              </View>
            </View>
          )
        })}

        {/* ── Monthly summary ──────────────────────────────────────────────── */}
        <Text style={styles.monthlySummaryTitle}>Monthly Summary</Text>
        <View style={styles.monthlySummaryBox}>
          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Total Salary</Text>
            <Text style={styles.monthlyValue}>{fmtCurrency(totalSalary)}</Text>
          </View>
          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Total Expenses</Text>
            <Text style={styles.monthlyValue}>{fmtCurrency(totalExpenses)}</Text>
          </View>
          <View style={[styles.monthlyRow, { marginBottom: 0 }]}>
            <Text style={styles.monthlyLabel}>Total Savings</Text>
            <Text style={totalSavings < 0 ? styles.monthlyValueDanger : styles.monthlyValueSafe}>
              {fmtCurrency(totalSavings)}
            </Text>
          </View>
        </View>

        {/* ── Footer (fixed on every page) ─────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Exported from Quentadoz</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}

// ─── Export function (browser-only, called via dynamic import) ────────────────

export async function exportMonthPDF(data: Omit<MonthPDFData, 'logoUrl'>): Promise<void> {
  const monthLabel = MONTH_NAMES[data.budgetMonth.month - 1]
  const logoUrl = window.location.origin + '/Quentadoz%20Main%20Logo%20Light.png'
  const blob = await reactPdf(<MonthPDFDocument data={{ ...data, logoUrl }} />).toBlob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Quentadoz-Budget-${monthLabel}-${data.budgetMonth.year}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
