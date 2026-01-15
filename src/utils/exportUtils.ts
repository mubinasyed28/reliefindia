import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// CSV Export utility
export const exportToCSV = (data: Record<string, unknown>[], filename: string, headers?: string[]) => {
  if (data.length === 0) {
    return;
  }

  const keys = headers || Object.keys(data[0]);
  const csvContent = [
    keys.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return `"${value.join('; ')}"`;
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// PDF Export for Disasters
export const exportDisastersToPDF = (disasters: {
  name: string;
  status: string;
  affected_states: string[];
  total_tokens_allocated: number;
  tokens_distributed: number;
  start_date: string;
}[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Disaster Relief Report', 14, 22);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
  
  // Table
  autoTable(doc, {
    startY: 40,
    head: [['Name', 'Status', 'Affected States', 'Allocated (₹)', 'Distributed (₹)', 'Start Date']],
    body: disasters.map(d => [
      d.name,
      d.status?.toUpperCase() || 'N/A',
      d.affected_states?.join(', ') || 'N/A',
      Number(d.total_tokens_allocated || 0).toLocaleString('en-IN'),
      Number(d.tokens_distributed || 0).toLocaleString('en-IN'),
      d.start_date ? new Date(d.start_date).toLocaleDateString('en-IN') : 'N/A'
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  // Summary
  const totalAllocated = disasters.reduce((sum, d) => sum + (d.total_tokens_allocated || 0), 0);
  const totalDistributed = disasters.reduce((sum, d) => sum + (d.tokens_distributed || 0), 0);
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Disasters: ${disasters.length}`, 14, finalY);
  doc.text(`Total Allocated: ₹${Number(totalAllocated).toLocaleString('en-IN')}`, 14, finalY + 6);
  doc.text(`Total Distributed: ₹${Number(totalDistributed).toLocaleString('en-IN')}`, 14, finalY + 12);
  
  doc.save('disasters-report.pdf');
};

// PDF Export for Beneficiaries
export const exportBeneficiariesToPDF = (
  beneficiaries: {
    id: string;
    tokens_allocated: number;
    tokens_spent: number;
    is_active: boolean;
    created_at: string;
    profiles?: { full_name: string; mobile: string };
  }[],
  disasterName: string
) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Beneficiaries Report', 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Disaster: ${disasterName}`, 14, 30);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 14, 38);
  
  autoTable(doc, {
    startY: 48,
    head: [['Name', 'Mobile', 'Allocated (₹)', 'Spent (₹)', 'Remaining (₹)', 'Status', 'Enrolled']],
    body: beneficiaries.map(b => [
      b.profiles?.full_name || 'N/A',
      b.profiles?.mobile || 'N/A',
      Number(b.tokens_allocated || 0).toLocaleString('en-IN'),
      Number(b.tokens_spent || 0).toLocaleString('en-IN'),
      Number((b.tokens_allocated || 0) - (b.tokens_spent || 0)).toLocaleString('en-IN'),
      b.is_active ? 'Active' : 'Inactive',
      b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : 'N/A'
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [34, 197, 94], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  const totalAllocated = beneficiaries.reduce((sum, b) => sum + (b.tokens_allocated || 0), 0);
  const totalSpent = beneficiaries.reduce((sum, b) => sum + (b.tokens_spent || 0), 0);
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Beneficiaries: ${beneficiaries.length}`, 14, finalY);
  doc.text(`Total Allocated: ₹${Number(totalAllocated).toLocaleString('en-IN')}`, 14, finalY + 6);
  doc.text(`Total Spent: ₹${Number(totalSpent).toLocaleString('en-IN')}`, 14, finalY + 12);
  
  doc.save(`beneficiaries-${disasterName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

// PDF Export for Transactions
export const exportTransactionsToPDF = (
  transactions: {
    id: string;
    amount: number;
    from_wallet: string;
    to_wallet: string;
    status: string;
    created_at: string;
    purpose: string;
    transaction_hash: string;
  }[],
  disasterName: string
) => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(20);
  doc.text('Transaction Report', 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Disaster: ${disasterName}`, 14, 30);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 14, 38);
  
  autoTable(doc, {
    startY: 48,
    head: [['ID', 'Amount (₹)', 'From', 'To', 'Purpose', 'Status', 'Hash', 'Date']],
    body: transactions.map(t => [
      t.id.slice(0, 8) + '...',
      Number(t.amount || 0).toLocaleString('en-IN'),
      t.from_wallet?.slice(0, 12) + '...' || 'N/A',
      t.to_wallet?.slice(0, 12) + '...' || 'N/A',
      t.purpose || 'N/A',
      t.status?.toUpperCase() || 'N/A',
      t.transaction_hash?.slice(0, 10) + '...' || 'N/A',
      t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : 'N/A'
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Transactions: ${transactions.length}`, 14, finalY);
  doc.text(`Total Amount: ₹${Number(totalAmount).toLocaleString('en-IN')}`, 14, finalY + 6);
  
  doc.save(`transactions-${disasterName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
