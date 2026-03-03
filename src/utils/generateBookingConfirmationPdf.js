const PDFDocument = require('pdfkit');

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};

const generateBookingConfirmationPdf = async ({ booking, vehicle, user }) => {
  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const colors = {
      dark: '#0b1220',
      primary: '#0f172a',
      accent: '#38bdf8',
      slate: '#64748b',
      soft: '#f8fafc',
      border: '#e2e8f0',
      success: '#22c55e'
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.rect(0, 0, pageWidth, 120).fill(colors.dark);
    doc
      .fillColor('white')
      .fontSize(26)
      .text('SAVES', 40, 36, { continued: true })
      .fontSize(18)
      .text(' Booking Confirmation');

    doc
      .fillColor(colors.accent)
      .fontSize(12)
      .text(`Booking ID: ${booking._id}`, 40, 80);

    doc
      .fillColor(colors.primary)
      .fontSize(14)
      .text('Confirmed', pageWidth - 140, 52, { align: 'right' })
      .fillColor(colors.success)
      .circle(pageWidth - 160, 58, 4)
      .fill();

    const cardLeft = 40;
    const cardTop = 140;
    const cardWidth = pageWidth - 80;
    const cardHeight = 170;

    doc
      .roundedRect(cardLeft, cardTop, cardWidth, cardHeight, 10)
      .fill(colors.soft)
      .strokeColor(colors.border)
      .stroke();

    doc.fillColor(colors.primary).fontSize(15).text('Customer & Booking', cardLeft + 20, cardTop + 18);
    doc.fillColor(colors.slate).fontSize(10).text('Primary details', cardLeft + 20, cardTop + 38);

    const detailStartY = cardTop + 64;
    const rowGap = 20;
    const colGap = 240;

    doc.fillColor(colors.primary).fontSize(11);
    doc.text('Customer', cardLeft + 20, detailStartY);
    doc.text(user?.name || '-', cardLeft + 110, detailStartY);

    doc.text('Email', cardLeft + 20, detailStartY + rowGap);
    doc.text(user?.email || '-', cardLeft + 110, detailStartY + rowGap);

    doc.text('Agency', cardLeft + 20, detailStartY + rowGap * 2);
    doc.text(booking.agencyName || '-', cardLeft + 110, detailStartY + rowGap * 2);

    doc.text('Car', cardLeft + colGap + 20, detailStartY);
    doc.text(vehicle?.model || '-', cardLeft + colGap + 90, detailStartY);

    doc.text('Start', cardLeft + colGap + 20, detailStartY + rowGap);
    doc.text(formatDate(booking.startDate) || '-', cardLeft + colGap + 90, detailStartY + rowGap);

    doc.text('End', cardLeft + colGap + 20, detailStartY + rowGap * 2);
    doc.text(formatDate(booking.endDate) || '-', cardLeft + colGap + 90, detailStartY + rowGap * 2);

    const summaryTop = cardTop + cardHeight + 30;

    doc
      .fillColor(colors.primary)
      .fontSize(16)
      .text('Summary', cardLeft, summaryTop);

    doc
      .roundedRect(cardLeft, summaryTop + 20, cardWidth, 110, 10)
      .fill('white')
      .strokeColor(colors.border)
      .stroke();

    const summaryLeft = cardLeft + 20;
    const summaryRight = cardLeft + cardWidth - 20;
    const summaryRow = summaryTop + 45;

    doc.fillColor(colors.slate).fontSize(11);
    doc.text('Total days', summaryLeft, summaryRow);
    doc.text(String(booking.totalDays || 0), summaryRight - 80, summaryRow, { align: 'right' });

    doc.text('Price per day', summaryLeft, summaryRow + 22);
    doc.text(`${vehicle?.pricePerDay || 0} TND`, summaryRight - 80, summaryRow + 22, { align: 'right' });

    doc.text('Total price', summaryLeft, summaryRow + 48);
    doc
      .fillColor(colors.primary)
      .fontSize(18)
      .text(`${booking.totalPrice} TND`, summaryRight - 80, summaryRow + 42, { align: 'right' });

    doc
      .fillColor(colors.slate)
      .fontSize(10)
      .text('This document is generated automatically by SAVES.', 40, pageHeight - 80);

    doc
      .fillColor(colors.slate)
      .fontSize(10)
      .text('For support, contact support@saves.com', 40, pageHeight - 64);

    doc.end();
  });
};

module.exports = generateBookingConfirmationPdf;
