import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AmortizationYearItem {
  yearNum: number;
  openingBalance: number;
  annualEmi: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface LoanPdfData {
  loanAmount: number;
  interestRate: number;
  tenureYears: number;
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
  yearlySchedule: AmortizationYearItem[];
}

export const formatPdfCurrency = (val: number): string => {
  return 'Rs. ' + Math.round(val).toLocaleString('en-IN');
};

export const generateLoanAmortizationPDF = async (data: LoanPdfData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner Background
  doc.setFillColor(180, 83, 9); // Amber-700
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent thin line
  doc.setFillColor(245, 158, 11); // Amber-500
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MANA GRUHAM AP', margin, 12);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(254, 243, 199); // Amber-100
  doc.text('Real Estate & Home Loan Advisory Services - Andhra Pradesh', margin, 18);

  // Right-aligned report type
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('HOME LOAN EMI & AMORTIZATION REPORT', pageWidth - margin, 12, { align: 'right' });

  // Date & Reference ID
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = today.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const refId = `MG-HL-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(254, 243, 199);
  doc.text(`Ref: ${refId} | Generated: ${dateStr}, ${timeStr}`, pageWidth - margin, 18, { align: 'right' });

  let cursorY = 36;

  // Section: Loan Summary Header
  doc.setTextColor(28, 25, 23); // Stone-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. LOAN & EMI SUMMARY', margin, cursorY);

  cursorY += 4;

  // 6 Metric Cards Layout (2 rows x 3 columns)
  const cardWidth = (pageWidth - margin * 2 - 8) / 3;
  const cardHeight = 16;
  const cardsData = [
    { label: 'Loan Amount (Principal)', value: formatPdfCurrency(data.loanAmount), highlight: false },
    { label: 'Interest Rate', value: `${data.interestRate.toFixed(2)}% p.a.`, highlight: false },
    { label: 'Tenure Period', value: `${data.tenureYears} Years (${data.tenureYears * 12} Mos)`, highlight: false },
    { label: 'Monthly EMI', value: formatPdfCurrency(data.monthlyEmi), highlight: true },
    { label: 'Total Interest Payable', value: formatPdfCurrency(data.totalInterest), highlight: false },
    { label: 'Total Amount Payable', value: formatPdfCurrency(data.totalPayment), highlight: false },
  ];

  cardsData.forEach((card, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + col * (cardWidth + 4);
    const y = cursorY + row * (cardHeight + 3);

    // Card background
    if (card.highlight) {
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.setDrawColor(245, 158, 11); // Amber-500
    } else {
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
    }
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(card.label.toUpperCase(), x + 3, y + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    if (card.highlight) {
      doc.setTextColor(180, 83, 9); // Amber-700
    } else {
      doc.setTextColor(15, 23, 42); // Slate-900
    }
    doc.text(card.value, x + 3, y + 12);
  });

  cursorY += 2 * (cardHeight + 3) + 3;

  // Breakdown ratio note
  const principalShare = ((data.loanAmount / data.totalPayment) * 100).toFixed(1);
  const interestShare = ((data.totalInterest / data.totalPayment) * 100).toFixed(1);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 7, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Payment Composition: Principal is ${principalShare}% (${formatPdfCurrency(data.loanAmount)}) | Total Interest is ${interestShare}% (${formatPdfCurrency(data.totalInterest)})`,
    margin + 3,
    cursorY + 4.5
  );

  cursorY += 12;

  // Section: Amortization Schedule Header
  doc.setTextColor(28, 25, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. YEARLY AMORTIZATION REPAYMENT SCHEDULE', margin, cursorY);

  cursorY += 2;

  // Prepare table rows
  const tableRows = data.yearlySchedule.map((row) => [
    `Year ${row.yearNum}`,
    formatPdfCurrency(row.openingBalance),
    formatPdfCurrency(row.annualEmi),
    formatPdfCurrency(row.principalPaid),
    formatPdfCurrency(row.interestPaid),
    formatPdfCurrency(row.closingBalance),
  ]);

  // Total summary footer row
  const tableFooter = [
    [
      'Total',
      '-',
      formatPdfCurrency(data.totalPayment),
      formatPdfCurrency(data.loanAmount),
      formatPdfCurrency(data.totalInterest),
      'Rs. 0',
    ],
  ];

  // Draw AutoTable
  autoTable(doc, {
    startY: cursorY + 2,
    margin: { left: margin, right: margin, bottom: 20 },
    head: [
      [
        'Year',
        'Opening Balance',
        'Annual EMI',
        'Principal Paid',
        'Interest Paid',
        'Closing Balance',
      ],
    ],
    body: tableRows,
    foot: tableFooter,
    theme: 'grid',
    headStyles: {
      fillColor: [180, 83, 9], // Amber-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
      cellPadding: 2.5,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', textColor: [180, 83, 9] },
      4: { halign: 'right', textColor: [100, 116, 139] },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (hookData) => {
      // Header for pages 2+
      if (hookData.pageNumber > 1) {
        doc.setFillColor(180, 83, 9);
        doc.rect(0, 0, pageWidth, 12, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text('MANA GRUHAM AP - HOME LOAN AMORTIZATION SCHEDULE (Contd.)', margin, 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(254, 243, 199);
        doc.text(`Ref: ${refId}`, pageWidth - margin, 8, { align: 'right' });
      }

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Mana Gruham AP | Real Estate & Loans. Indicative calculation based on reducing monthly balance. Subject to bank approval.',
        margin,
        pageHeight - 8
      );

      doc.text(
        `Page ${hookData.pageNumber}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  // Calculate safe file name
  const safeAmountStr = Math.round(data.loanAmount / 100000);
  const fileName = `Mana_Gruham_Home_Loan_Amortization_${safeAmountStr}Lakhs_${data.tenureYears}Years.pdf`;

  // Trigger file download
  doc.save(fileName);
};
