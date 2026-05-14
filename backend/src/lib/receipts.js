const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

function money(value, currency = 'UGX') {
  return `${currency} ${Number(value || 0).toLocaleString('en-UG')}`;
}

function niceType(value) {
  return String(value || '-').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyPaymentLabel(paymentType, suppliedLabel) {
  if (suppliedLabel) return suppliedLabel;

  switch (paymentType) {
    case 'donation':
      return 'Donation';
    case 'sacco_savings_quarterly':
      return 'Quarterly SACCO Savings';
    case 'sacco_yearly_subscription':
      return 'Yearly SACCO Subscription';
    case 'sacco_savings_monthly':
      return 'Monthly SACCO Savings';
    case 'sacco_membership_fee':
      return 'SACCO Membership Fee';
    case 'merchandise_order':
      return 'Merchandise Order';
    case 'event_fee':
      return 'Event Fee';
    default:
      return niceType(paymentType);
  }
}

function receiptPaymentLabel(receipt) {
  const raw = receipt?.label || receipt?.paymentType || '-'

  const known = {
    donation: 'Donation',
    sacco_savings_quarterly: 'Quarterly SACCO Savings',
    sacco_yearly_subscription: 'Yearly SACCO Subscription',
    sacco_savings_monthly: 'Monthly SACCO Savings',
    sacco_membership_fee: 'SACCO Membership Fee',
    merchandise_order: 'Merchandise Order',
    event_fee: 'Event Fee'
  }

  return known[raw] || niceType(raw)
}

function receiptScope(paymentType) {
  if (String(paymentType || '').startsWith('sacco_')) return 'SACCO';
  if (paymentType === 'donation') return 'DONATION';
  if (paymentType === 'merchandise_order') return 'STORE';
  if (paymentType === 'event_fee') return 'EVENT';
  return 'PAYMENT';
}

function receiptNumberFor(payment) {
  const year = new Date().getFullYear();
  const scope = receiptScope(payment.paymentType);
  return `SHOSA-${scope}-${year}-${String(payment.id).padStart(6, '0')}`;
}

function verificationCodeFor(payment) {
  return `RCPT-${payment.id}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!host || !from) {
    return { enabled: false };
  }

  return {
    enabled: true,
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from
  };
}

function receiptInclude() {
  return {
    payment: true,
    alumni: {
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        campus: true,
        gradYear: true
      }
    },
    issuedByAdmin: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    }
  };
}

function frontendReceiptUrl(receiptNumber) {
  return frontendBaseUrl() + '/receipt/' + encodeURIComponent(receiptNumber);
}


function frontendBaseUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function frontendAssetUrl(assetPath) {
  if (/^https?:\/\//i.test(assetPath || '')) return assetPath;
  const cleanPath = String(assetPath || '').startsWith('/') ? assetPath : `/${assetPath}`;
  return `${frontendBaseUrl()}${cleanPath}`;
}

function emailAsset(name, envUrl, defaultFile) {
  const localPath = path.resolve(__dirname, '../../../frontend/public/assets/reference', defaultFile);
  const hasLocalFile = fs.existsSync(localPath);
  if (hasLocalFile && !envUrl) {
    return { src: `cid:${name}`, attachment: { filename: defaultFile, path: localPath, cid: name } };
  }

  return {
    src: envUrl || frontendAssetUrl(`/assets/brand/${defaultFile}`),
    attachment: hasLocalFile ? { filename: defaultFile, path: localPath, cid: name } : null
  };
}

function buildReceiptEmail(receipt) {
  const title = `Official Receipt ${receipt.receiptNumber}`;
  const receiptUrl = frontendReceiptUrl(receipt.receiptNumber);
  const shosaLogoAsset = emailAsset('shosa-logo', process.env.SHOSA_LOGO_URL || process.env.SEETA_LOGO_URL, 'shosa-primary-logo-web.png');
  const saccoLogoAsset = emailAsset('sacco-logo', process.env.SACCO_LOGO_URL, 'shosa-sacco-logo-web.png');

  const text = `
${title}

Member: ${receipt.alumni?.displayName || '-'}
Email: ${receipt.alumni?.email || '-'}
Payment: ${receiptPaymentLabel(receipt)}
Amount: ${money(receipt.amount, receipt.currency)}
Network: ${receipt.payment?.network || '-'}
Transaction Ref: ${receipt.payment?.transactionRef || '-'}
Verification Code: ${receipt.verificationCode}
Issue Date: ${new Date(receipt.issuedAt).toLocaleString()}

View receipt: ${receiptUrl}
`.trim();

  const html = `
  <div style="font-family:Arial,sans-serif;background:#f8f2df;padding:24px;color:#071a45;">
    <div style="max-width:760px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:24px 24px 16px;background:#0b1f4d;color:white;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:12px;min-width:180px;">
          <img src="${shosaLogoAsset.src}" alt="SHOSA Logo" width="64" height="64" style="border-radius:18px;background:white;object-fit:cover;border:2px solid #facc15;" />
          <div>
            <p style="margin:0;color:#facc15;font-size:12px;font-weight:700;letter-spacing:1px;">SHOSA</p>
            <h1 style="margin:8px 0 0;font-size:24px;line-height:1.05;">Official Receipt</h1>
          </div>
        </div>
        <div style="text-align:center;flex:1;min-width:220px;">
          <p style="margin:0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#f8fafc;">Receipt Number</p>
          <p style="margin:8px 0 0;font-size:18px;font-weight:800;color:#facc15;">${receipt.receiptNumber}</p>
        </div>
        <div style="min-width:120px;text-align:right;">
          <img src="${saccoLogoAsset.src}" alt="SACCO Logo" width="64" height="64" style="border-radius:18px;background:white;object-fit:contain;border:2px solid #facc15;" />
        </div>
      </div>

      <div style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#0f172a;">
          <tbody>
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;width:50%;">
                <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#475569;font-weight:700;">Recipient</p>
                <p style="margin:0;font-size:16px;font-weight:700;">${receipt.alumni?.displayName || '-'}</p>
                <p style="margin:6px 0 0;color:#64748b;">${receipt.alumni?.email || '-'}<br/>${receipt.alumni?.phone || '-'}</p>
              </td>
              <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;width:50%;">
                <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#475569;font-weight:700;">Issued At</p>
                <p style="margin:0;font-size:16px;font-weight:700;">${new Date(receipt.issuedAt).toLocaleString()}</p>
                <p style="margin:6px 0 0;color:#64748b;">Issued by ${receipt.issuedByAdmin?.fullName || 'SHOSA Admin'}</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:24px;padding:24px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Payment Details</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#0f172a;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;width:45%;font-weight:700;">Payment description</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${receiptPaymentLabel(receipt)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;">Amount</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0b1f4d;font-weight:800;">${money(receipt.amount, receipt.currency)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;">Network</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${receipt.payment?.network || '-'}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;">Transaction Reference</td>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${receipt.payment?.transactionRef || '-'}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:700;">Verification Code</td>
              <td style="padding:10px 0;">${receipt.verificationCode}</td>
            </tr>
          </table>
        </div>

        <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.7;">
          This official receipt was generated after admin approval of the payment record. Please keep it for your personal and SACCO records.
        </p>

        <p style="margin:16px 0 0;">
          <a href="${receiptUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#facc15;color:#0b1f4d;text-decoration:none;font-weight:700;">View / Print Receipt</a>
        </p>
      </div>
    </div>
  </div>`;

  const attachments = [];
  if (shosaLogoAsset.attachment) attachments.push(shosaLogoAsset.attachment);
  if (saccoLogoAsset.attachment) attachments.push(saccoLogoAsset.attachment);

  return { subject: title, text, html, attachments };
}

async function logNotification(prisma, receipt, status, errorMessage = null) {
  try {
    const email = receipt.recipientEmail || receipt.alumni?.email || null;
    await prisma.notificationLog.create({
      data: {
        recipientEmail: email,
        channel: 'email',
        subject: `Official Receipt ${receipt.receiptNumber}`,
        message: `Receipt ${receipt.receiptNumber} for ${money(receipt.amount, receipt.currency)}`,
        status,
        metadata: {
          receiptId: receipt.id,
          receiptNumber: receipt.receiptNumber,
          paymentId: receipt.paymentId,
          error: errorMessage
        },
        sentAt: status === 'sent' ? new Date() : null
      }
    });
  } catch {
    // Notification logging must never break payment approval.
  }
}

async function sendReceiptEmail(prisma, receiptId) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: receiptInclude()
  });

  if (!receipt) throw new Error('Receipt not found');

  const email = receipt.recipientEmail || receipt.alumni?.email;
  const config = smtpConfig();

  if (!email) {
    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: { emailStatus: 'no_recipient', emailError: 'No recipient email found' },
      include: receiptInclude()
    });
    await logNotification(prisma, updated, 'no_recipient', 'No recipient email found');
    return updated;
  }

  if (!config.enabled) {
    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: { emailStatus: 'not_configured', emailError: 'SMTP is not configured' },
      include: receiptInclude()
    });
    await logNotification(prisma, updated, 'not_configured', 'SMTP is not configured');
    return updated;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined
    });

    const emailContent = buildReceiptEmail(receipt);

    await transporter.sendMail({
      from: config.from,
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
      attachments: emailContent.attachments || []
    });

    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        emailStatus: 'sent',
        emailedAt: new Date(),
        emailError: null
      },
      include: receiptInclude()
    });

    await logNotification(prisma, updated, 'sent');
    return updated;
  } catch (error) {
    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        emailStatus: 'failed',
        emailError: error.message || 'Email failed'
      },
      include: receiptInclude()
    });

    await logNotification(prisma, updated, 'failed', error.message || 'Email failed');
    return updated;
  }
}

async function issueReceiptForPayment(prisma, { paymentId, adminId }) {
  const existing = await prisma.receipt.findUnique({
    where: { paymentId },
    include: receiptInclude()
  });

  if (existing) return existing;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { alumni: true }
  });

  if (!payment) throw new Error('Payment not found');
  if (payment.status !== 'approved') throw new Error('Receipt can only be issued for approved payments');

  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber: receiptNumberFor(payment),
      paymentId: payment.id,
      alumniId: payment.alumniId,
      issuedByAdminId: adminId || payment.reviewedBy || payment.confirmedBy || null,
      paymentType: payment.paymentType,
      label: receiptPaymentLabel({ label: payment.label, paymentType: payment.paymentType }),
      amount: payment.amount,
      currency: payment.currency || 'UGX',
      status: 'issued',
      recipientEmail: payment.alumni?.email || null,
      verificationCode: verificationCodeFor(payment)
    },
    include: receiptInclude()
  });

  return sendReceiptEmail(prisma, receipt.id);
}

module.exports = {
  issueReceiptForPayment,
  sendReceiptEmail,
  receiptInclude,
  money,
  niceType
};


