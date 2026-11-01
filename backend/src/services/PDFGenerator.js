import PDFDocument from 'pdfkit';

/**
 * Generates a clean, Apple-inspired branded PDF for a Mutual Agreement
 * @param {object} agreement - Populated MutualAgreement document
 * @param {stream.Writable} outputStream - Response stream or write stream
 */
export function generateAgreementPDF(agreement, outputStream) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `RoomSync Agreement - ${agreement.agreementNumber}`,
      Author: 'RoomSync Platform',
      Subject: 'Mutual Residential Rental Agreement',
    },
  });

  doc.pipe(outputStream);

  const brandTeal = '#0F766E';
  const inkPrimary = '#1D1D1F';
  const inkSecondary = '#6E6E73';
  const lightBg = '#F8FAFC';
  const borderCol = '#E2E8F0';

  // --- Header ---
  doc
    .fillColor(brandTeal)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('RoomSync', 50, 45);

  doc
    .fillColor(inkSecondary)
    .fontSize(10)
    .font('Helvetica')
    .text('Verified Residential Co-Living Platform', 50, 72);

  doc
    .fillColor(inkPrimary)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(`Agreement Ref: ${agreement.agreementNumber}`, 320, 48, { align: 'right' });

  doc
    .fillColor(inkSecondary)
    .fontSize(9)
    .font('Helvetica')
    .text(
      `Generated: ${new Date(agreement.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`,
      320,
      64,
      { align: 'right' }
    );

  doc
    .strokeColor(brandTeal)
    .lineWidth(2)
    .moveTo(50, 92)
    .lineTo(545, 92)
    .stroke();

  // --- Document Title Banner ---
  doc.rect(50, 105, 495, 30).fill(lightBg);
  doc
    .fillColor(inkPrimary)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('MUTUAL RESIDENTIAL RENTAL AGREEMENT', 60, 114);

  // --- Section 1: Contracting Parties ---
  let y = 150;
  doc.fillColor(brandTeal).fontSize(12).font('Helvetica-Bold').text('1. Contracting Parties', 50, y);
  y += 20;

  // Owner Box
  doc.rect(50, y, 240, 75).strokeColor(borderCol).lineWidth(1).stroke();
  doc.fillColor(inkPrimary).fontSize(10).font('Helvetica-Bold').text('Property Owner / Lister:', 60, y + 10);
  doc.fillColor(inkPrimary).fontSize(9).font('Helvetica').text(`Name: ${agreement.owner?.fullName || 'N/A'}`, 60, y + 25);
  doc.text(`Email: ${agreement.owner?.email || 'N/A'}`, 60, y + 38);
  doc.text(`Phone: ${agreement.owner?.phone ? `+91 ${agreement.owner.phone}` : 'N/A'}`, 60, y + 51);
  doc.text(`Identity Status: ${agreement.owner?.ownerVerificationStatus || 'Verified'}`, 60, y + 64);

  // Seeker Box
  doc.rect(305, y, 240, 75).strokeColor(borderCol).lineWidth(1).stroke();
  doc.fillColor(inkPrimary).fontSize(10).font('Helvetica-Bold').text('Room Seeker / Resident:', 315, y + 10);
  doc.fillColor(inkPrimary).fontSize(9).font('Helvetica').text(`Name: ${agreement.seeker?.fullName || 'N/A'}`, 315, y + 25);
  doc.text(`Email: ${agreement.seeker?.email || 'N/A'}`, 315, y + 38);
  doc.text(`Phone: ${agreement.seeker?.phone ? `+91 ${agreement.seeker.phone}` : 'N/A'}`, 315, y + 51);
  doc.text(`Occupants: ${agreement.occupantsCount || 1} Person`, 315, y + 64);

  y += 90;

  // --- Section 2: Property & Financial Terms ---
  doc.fillColor(brandTeal).fontSize(12).font('Helvetica-Bold').text('2. Rental & Tenancy Terms', 50, y);
  y += 18;

  const room = agreement.room || {};
  const termsList = [
    ['Property Listing:', room.title || 'Residential Room'],
    ['Location / Address:', `${room.locality || ''}, ${room.city || 'Mumbai'} - ${room.pinCode || ''}`],
    ['Room Type & Furnishing:', `${room.roomType || 'Private Room'} (${room.furnishing || 'Furnished'})`],
    ['Agreed Monthly Rent:', `₹${Number(agreement.monthlyRent || room.rent || 0).toLocaleString('en-IN')}/month`],
    ['Security Deposit:', `₹${Number(agreement.securityDeposit || room.deposit || 0).toLocaleString('en-IN')}`],
    ['Target Move-in Date:', agreement.moveInDate ? new Date(agreement.moveInDate).toLocaleDateString('en-IN') : 'Immediate'],
    ['Agreed Stay Duration:', `${agreement.stayDuration || 6} Months (Minimum stay)`],
  ];

  termsList.forEach(([label, value]) => {
    doc.fillColor(inkSecondary).fontSize(9).font('Helvetica-Bold').text(label, 60, y, { width: 160 });
    doc.fillColor(inkPrimary).fontSize(9).font('Helvetica').text(value, 230, y, { width: 310 });
    y += 16;
  });

  y += 10;

  // --- Section 3: Standard Mutual House Rules & Living Conditions ---
  doc.fillColor(brandTeal).fontSize(12).font('Helvetica-Bold').text('3. Agreed Living Rules & Tenancy Conduct', 50, y);
  y += 18;

  const rules = agreement.terms?.houseRules || [
    'Respect designated quiet hours and roommate personal space boundaries.',
    'Keep common shared areas (kitchen, living hall, bathrooms) clean and hygienic.',
    'No unauthorized subletting or secondary guest tenancies without written owner consent.',
    'Adhere to society bylaws, waste segregation protocols, and security guidelines.',
    'Prompt settlement of monthly utility splits (electricity, WiFi, water, gas).',
  ];

  rules.forEach((rule, idx) => {
    doc.fillColor(brandTeal).fontSize(9).font('Helvetica-Bold').text(`${idx + 1}.`, 60, y);
    doc.fillColor(inkPrimary).fontSize(9).font('Helvetica').text(rule, 75, y, { width: 460 });
    y += 15;
  });

  y += 15;

  // --- Section 4: Digital Signatures & Audit Log ---
  doc.fillColor(brandTeal).fontSize(12).font('Helvetica-Bold').text('4. Digital Signatures & Mutual Consent', 50, y);
  y += 18;

  doc.rect(50, y, 495, 65).strokeColor(borderCol).lineWidth(1).stroke();

  // Owner acceptance
  doc.fillColor(inkPrimary).fontSize(9).font('Helvetica-Bold').text('Property Owner Digital Signature:', 60, y + 10);
  if (agreement.ownerAccepted) {
    doc.fillColor(brandTeal).fontSize(8.5).font('Helvetica')
      .text(`ACCEPTED & CONFIRMED on ${new Date(agreement.ownerAcceptedAt).toLocaleString('en-IN')} (IP: ${agreement.ownerIp || 'Logged'})`, 60, y + 24);
  } else {
    doc.fillColor('#D97706').fontSize(8.5).font('Helvetica').text('PENDING OWNER SIGNATURE', 60, y + 24);
  }

  // Seeker acceptance
  doc.fillColor(inkPrimary).fontSize(9).font('Helvetica-Bold').text('Room Seeker Digital Signature:', 60, y + 38);
  if (agreement.seekerAccepted) {
    doc.fillColor(brandTeal).fontSize(8.5).font('Helvetica')
      .text(`ACCEPTED & CONFIRMED on ${new Date(agreement.seekerAcceptedAt).toLocaleString('en-IN')} (IP: ${agreement.seekerIp || 'Logged'})`, 60, y + 51);
  } else {
    doc.fillColor('#D97706').fontSize(8.5).font('Helvetica').text('PENDING SEEKER SIGNATURE', 60, y + 51);
  }

  y += 78;

  // --- Section 5: Mandatory Legal Disclaimer ---
  doc.rect(50, y, 495, 45).fill('#FEF3C7').strokeColor('#F59E0B').lineWidth(1).stroke();
  doc.fillColor('#92400E').fontSize(7.5).font('Helvetica-Bold').text('STATUTORY LEGAL NOTICE & PLATFORM DISCLAIMER:', 58, y + 6);
  doc.font('Helvetica').fontSize(7).text(
    agreement.legalDisclaimer ||
      'RoomSync is a matchmaking platform. This mutual agreement records mutual consent between the room owner and seeker and does not constitute a registered lease agreement under the Transfer of Property Act or state rent control laws. The parties are advised to execute a formal registered rental agreement where required by local law.',
    58,
    y + 17,
    { width: 478, lineGap: 1.5 }
  );

  // Footer
  doc
    .fillColor(inkSecondary)
    .fontSize(8)
    .font('Helvetica')
    .text(
      'Document digitally generated by RoomSync Verification Engine • Non-transferable legal audit trail',
      50,
      765,
      { align: 'center', width: 495 }
    );

  doc.end();
}

export default {
  generateAgreementPDF,
};

