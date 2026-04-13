import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { inr } from './currency.js';

// ── Brand colors (RGB)
const COLOR = {
  primary:  [30, 80, 200],
  accent:   [0, 186, 160],
  dark:     [15, 20, 35],
  text:     [40, 50, 70],
  muted:    [100, 115, 140],
  light:    [240, 244, 252],
  success:  [34, 197, 94],
  danger:   [239, 68, 68],
  warning:  [245, 158, 11],
  white:    [255, 255, 255],
  border:   [220, 228, 245],
};

function addHeader(doc, title, subtitle, user) {
  const W = doc.internal.pageSize.getWidth();

  // Background bar
  doc.setFillColor(...COLOR.dark);
  doc.rect(0, 0, W, 28, 'F');

  // Brand name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.white);
  doc.text('NexaBank', 14, 14);

  // Tagline
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.accent);
  doc.text('Professional Banking Platform', 14, 20);

  // Report title (right-aligned)
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.white);
  doc.text(title, W - 14, 12, { align: 'right' });

  // Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 195, 230);
  doc.text(subtitle, W - 14, 18, { align: 'right' });

  // Accent bar
  doc.setFillColor(...COLOR.accent);
  doc.rect(0, 28, W, 1.5, 'F');

  // User info row
  doc.setFillColor(...COLOR.light);
  doc.rect(0, 29.5, W, 12, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.text);
  doc.text(`Account Holder: ${user?.name || 'N/A'}`, 14, 37.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.muted);
  doc.text(`Email: ${user?.email || ''}`, 90, 37.5);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W - 14, 37.5, { align: 'right' });

  return 46; // y position after header
}

function addFooter(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...COLOR.dark);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 175, 210);
    doc.text('NexaBank — Confidential Document. Not for public distribution.', 14, H - 4.5);
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 4.5, { align: 'right' });
  }
}

function kpiRow(doc, startY, items) {
  const W   = doc.internal.pageSize.getWidth();
  const boxW = (W - 28 - (items.length - 1) * 5) / items.length;

  items.forEach((item, i) => {
    const x = 14 + i * (boxW + 5);
    // Box
    doc.setFillColor(...COLOR.light);
    doc.setDrawColor(...COLOR.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, boxW, 20, 2, 2, 'FD');

    // Color bar top
    doc.setFillColor(...(item.color || COLOR.primary));
    doc.roundedRect(x, startY, boxW, 2.5, 1, 1, 'F');

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.muted);
    doc.text(item.label, x + boxW / 2, startY + 8, { align: 'center' });

    // Value
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.text);
    doc.text(item.value, x + boxW / 2, startY + 15, { align: 'center' });
  });

  return startY + 26;
}

// ── Main export ─────────────────────────────────────────────────────────────

export function generateTransactionPDF({ user, transactions, accounts, stats }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();

  const now   = new Date();
  const month = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  let y = addHeader(doc, 'Transaction Statement', month, user);

  // ── KPI boxes
  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit  = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const net         = totalCredit - totalDebit;

  y = kpiRow(doc, y, [
    { label: 'Total Transactions', value: String(transactions.length),    color: COLOR.primary },
    { label: 'Total Credits',      value: inr(totalCredit),               color: COLOR.success },
    { label: 'Total Debits',       value: inr(totalDebit),                color: COLOR.danger  },
    { label: 'Net Balance Change', value: `${net >= 0 ? '+' : ''}${inr(net)}`, color: net >= 0 ? COLOR.success : COLOR.danger },
    { label: 'Accounts',           value: String(accounts.length),        color: COLOR.accent  },
  ]);

  y += 3;

  // ── Section title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.primary);
  doc.text('TRANSACTION HISTORY', 14, y);
  doc.setFillColor(...COLOR.accent);
  doc.rect(14, y + 1, 35, 0.8, 'F');
  y += 6;

  // ── Table
  const getAccName = (acc) => {
    if (!acc) return '—';
    if (typeof acc === 'object') return acc.type || '—';
    return accounts.find(a => a._id === acc)?.type || '—';
  };

  const rows = transactions.map(t => [
    new Date(t.createdAt).toLocaleDateString('en-IN'),
    new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    t.desc.length > 38 ? t.desc.slice(0, 35) + '…' : t.desc,
    getAccName(t.account),
    t.category || 'Other',
    t.type.toUpperCase(),
    t.type === 'credit' ? `+ ${inr(t.amount)}` : `- ${inr(t.amount)}`,
    t.status,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Time', 'Description', 'Account', 'Category', 'Type', 'Amount (₹)', 'Status']],
    body: rows,
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      font: 'helvetica',
      textColor: COLOR.text,
      lineColor: COLOR.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLOR.dark,
      textColor: COLOR.white,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 16 },
      2: { cellWidth: 60 },
      3: { cellWidth: 22 },
      4: { cellWidth: 24 },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 18, halign: 'center' },
    },
    didParseCell(data) {
      if (data.column.index === 5) {
        data.cell.styles.textColor =
          data.cell.raw === 'CREDIT' ? COLOR.success : COLOR.danger;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index === 6 && data.section === 'body') {
        const isCredit = data.row.raw[5] === 'CREDIT';
        data.cell.styles.textColor = isCredit ? COLOR.success : COLOR.danger;
      }
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  const t = now.toTimeString().slice(0,8).replace(/:/g, '');
  doc.save(`NexaBank_Transactions_${now.toISOString().slice(0, 10)}_${t}.pdf`);
}

export function generateReportPDF({ user, transactions, accounts, loans, stats }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();
  const now = new Date();

  let y = addHeader(doc, 'Financial Report', now.toLocaleString('en-IN', { month: 'long', year: 'numeric' }), user);

  // ── Portfolio KPIs
  const totalBalance    = accounts.reduce((s, a) => s + a.balance, 0);
  const creditMonth     = stats?.currentMonth?.credit || 0;
  const debitMonth      = stats?.currentMonth?.debit  || 0;
  const net             = creditMonth - debitMonth;
  const totalLoan       = loans.filter(l => l.status === 'Active').reduce((s, l) => s + l.outstanding, 0);

  y = kpiRow(doc, y, [
    { label: 'Portfolio Balance', value: inr(totalBalance), color: COLOR.primary },
    { label: 'Income (Month)',    value: inr(creditMonth),  color: COLOR.success },
    { label: 'Expenses (Month)',  value: inr(debitMonth),   color: COLOR.danger  },
    { label: 'Net Savings',       value: `${net >= 0 ? '+' : ''}${inr(net)}`, color: net >= 0 ? COLOR.success : COLOR.danger },
  ]);
  y += 3;

  // ── Accounts section
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.primary);
  doc.text('ACCOUNT SUMMARY', 14, y);
  doc.setFillColor(...COLOR.accent);
  doc.rect(14, y + 1, 32, 0.8, 'F');
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Account Type', 'Account Number', 'Balance (₹)', 'Interest Rate', 'Currency', 'Status', 'Opened On']],
    body: accounts.map(a => [
      a.type, a.number, inr(a.balance),
      `${a.interestRate}% p.a.`, a.currency, a.status,
      new Date(a.createdAt).toLocaleDateString('en-IN'),
    ]),
    styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', textColor: COLOR.text },
    headStyles: { fillColor: COLOR.dark, textColor: COLOR.white, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'center' },
      5: { halign: 'center' },
    },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Recent Transactions
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.primary);
  doc.text('RECENT TRANSACTIONS (Last 20)', 14, y);
  doc.setFillColor(...COLOR.accent);
  doc.rect(14, y + 1, 52, 0.8, 'F');
  y += 6;

  const getAccName = (acc) => {
    if (!acc) return '—';
    if (typeof acc === 'object') return acc.type || '—';
    return accounts.find(a => a._id === acc)?.type || '—';
  };

  const recent = transactions.slice(0, 20);

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Description', 'Account', 'Type', 'Amount (₹)', 'Status']],
    body: recent.map(t => [
      new Date(t.createdAt).toLocaleDateString('en-IN'),
      t.desc.length > 40 ? t.desc.slice(0, 37) + '…' : t.desc,
      getAccName(t.account),
      t.type.toUpperCase(),
      `${t.type === 'credit' ? '+' : '-'} ${inr(t.amount)}`,
      t.status,
    ]),
    styles: { fontSize: 7.5, cellPadding: 2.5, font: 'helvetica', textColor: COLOR.text },
    headStyles: { fillColor: COLOR.dark, textColor: COLOR.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.column.index === 3 && data.section === 'body') {
        data.cell.styles.textColor = data.cell.raw === 'CREDIT' ? COLOR.success : COLOR.danger;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index === 4 && data.section === 'body') {
        const isCredit = String(data.row.raw[3]) === 'CREDIT';
        data.cell.styles.textColor = isCredit ? COLOR.success : COLOR.danger;
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Loans section (if any)
  if (loans.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.primary);
    doc.text('LOAN PORTFOLIO', 14, y);
    doc.setFillColor(...COLOR.accent);
    doc.rect(14, y + 1, 28, 0.8, 'F');
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Loan Type', 'Principal', 'Outstanding', 'Monthly EMI', 'Rate', 'Tenure', 'Status']],
      body: loans.map(l => [
        l.type,
        inr(l.amount),
        l.outstanding > 0 ? inr(l.outstanding) : 'Cleared',
        l.emi > 0 ? inr(l.emi) : '—',
        `${l.rate}% p.a.`,
        `${l.term} months`,
        l.status,
      ]),
      styles: { fontSize: 8, cellPadding: 3, textColor: COLOR.text },
      headStyles: { fillColor: COLOR.dark, textColor: COLOR.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' },
        3: { halign: 'right' }, 4: { halign: 'center' },
        5: { halign: 'center' }, 6: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);
  const tStr = now.toTimeString().slice(0,8).replace(/:/g, '');
  doc.save(`NexaBank_FinancialReport_${now.toISOString().slice(0, 10)}_${tStr}.pdf`);
}
