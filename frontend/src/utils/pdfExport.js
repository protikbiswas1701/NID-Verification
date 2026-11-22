import { jsPDF } from 'jspdf';

/**
 * Generates and triggers a PDF download for an NID Verification Report
 */
export const exportVerificationPdf = (verification) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const v = verification;
  const analysis = v?.aiResult || v?.analysis || {};
  const extracted = analysis.extractedData || {};
  const checks = analysis.checks || [];
  const fraudFlags = analysis.fraudIndicators || [];
  const dbMatch = analysis.databaseMatch || {};

  // Colors
  const primaryNavy = [15, 23, 42]; // #0f172a
  const accentBlue = [37, 99, 235]; // #2563eb
  const successGreen = [16, 185, 129];
  const dangerRed = [239, 68, 68];
  const neutralGray = [100, 116, 139];

  // Header Background Bar
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, 210, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NATIONAL ID VERIFICATION & FRAUD AUDIT REPORT', 14, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Independent Document Integrity Analysis System', 14, 21);

  const reportDate = new Date().toLocaleString();
  doc.text(`Generated: ${reportDate}`, 150, 21);

  // Reference Info
  let y = 38;
  doc.setTextColor(...primaryNavy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Submission Information', 14, y);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, 196, y + 2);

  y += 9;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...neutralGray);
  doc.text(`Request Reference ID:`, 14, y);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.text(String(v.requestId || 'N/A'), 55, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...neutralGray);
  doc.text(`Document Type:`, 120, y);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.text(String(v.documentType || 'NID'), 155, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...neutralGray);
  doc.text(`Submission Date:`, 14, y);
  doc.setTextColor(...primaryNavy);
  doc.text(v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A', 55, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...neutralGray);
  doc.text(`Workflow Status:`, 120, y);
  doc.setTextColor(...primaryNavy);
  doc.text(String(v.status || 'N/A'), 155, y);

  // Verdict Banner
  y += 14;
  const isGenuine = analysis.isGenuine;
  const isUnregistered = analysis.verdict === 'UNVERIFIED_UNREGISTERED';
  const bannerColor = isGenuine ? [236, 253, 245] : isUnregistered ? [254, 243, 199] : [254, 242, 242];
  const borderColor = isGenuine ? successGreen : isUnregistered ? [245, 158, 11] : dangerRed;
  const textColor = isGenuine ? [6, 95, 70] : isUnregistered ? [146, 64, 14] : [153, 27, 27];

  doc.setFillColor(...bannerColor);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const verdictTitle = (analysis.verdict || 'PENDING_ANALYSIS').replace(/_/g, ' ');
  doc.text(`VERDICT: ${verdictTitle}`, 20, y + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Confidence Score: ${analysis.confidenceScore || 0}%`, 20, y + 16);

  // Extracted Credentials
  y += 32;
  doc.setTextColor(...primaryNavy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Extracted Document Credentials', 14, y);
  doc.line(14, y + 2, 196, y + 2);

  y += 10;
  const creds = [
    ['Extracted NID Number:', extracted.nidNumber || 'Not detected'],
    ['Date of Birth (DOB):', extracted.dob || 'Not detected'],
    ['Citizen Name:', extracted.name || 'Not detected'],
    ['Blood Group:', (extracted.bloodGroup && extracted.bloodGroup !== 'Not specified' ? extracted.bloodGroup : dbMatch?.registryDetails?.bloodGroup) || 'Not specified'],
    ['Format / Structure:', extracted.nidType || 'N/A'],
    ['Registry Status:', dbMatch.isRegistered ? 'Match found in Citizen Registry' : 'Unregistered in Database'],
  ];

  doc.setFontSize(9);
  creds.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...neutralGray);
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryNavy);
    doc.text(String(val), 65, y);
    y += 6.5;
  });

  // Fraud / Tampering Flags
  if (fraudFlags.length > 0) {
    y += 5;
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Detected Fraud & Anomaly Flags (${fraudFlags.length})`, 14, y);
    doc.line(14, y + 2, 196, y + 2);

    y += 8;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    fraudFlags.forEach((flag) => {
      doc.text(`• ${flag}`, 18, y);
      y += 5.5;
    });
  }

  // Security Checklist
  y += 6;
  doc.setTextColor(...primaryNavy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Security Authenticity Checklist', 14, y);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;
  doc.setFontSize(8.5);
  checks.forEach((chk) => {
    const isPassed = chk.status === 'PASSED';
    const isFailed = chk.status === 'FAILED';
    const mark = isPassed ? '[PASS]' : isFailed ? '[FAIL]' : '[WARN]';
    const col = isPassed ? successGreen : isFailed ? dangerRed : [245, 158, 11];

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...col);
    doc.text(mark, 14, y);

    doc.setTextColor(...primaryNavy);
    doc.text(chk.title, 30, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...neutralGray);
    const detailLines = doc.splitTextToSize(chk.details || '', 120);
    doc.text(detailLines, 75, y);

    y += Math.max(6, detailLines.length * 4.5);
  });

  // Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(...neutralGray);
  doc.text(
    'Disclaimer: This verification report is generated by an independent image recognition and citizen registry matching system.',
    14,
    285
  );
  doc.text(
    'It is not an official government certificate. Valid for audit and screening workflows.',
    14,
    289
  );

  // Download Trigger
  const safeId = (v.requestId || 'verification').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`NID_Report_${safeId}.pdf`);
};
