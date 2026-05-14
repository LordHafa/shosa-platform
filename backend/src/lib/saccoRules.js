const SACCO_REGISTRATION_FEE = 50000;
const SACCO_YEARLY_SUBSCRIPTION = 100000;

const SACCO_MEMBERSHIP_TIERS = {
  starter: {
    label: 'Youth / Starter Saver',
    annualSubscription: 50000,
    monthlyContributions: [30000],
    quarterlyContributions: [120000]
  },
  ordinary: {
    label: 'Standard Saver',
    annualSubscription: 100000,
    monthlyContributions: [50000],
    quarterlyContributions: [200000]
  },
  growth: {
    label: 'Growth / Support Saver',
    annualSubscription: 100000,
    monthlyContributions: [100000, 200000, 500000],
    quarterlyContributions: [400000, 800000, 1500000]
  }
};

const MONTHLY_SAVINGS_PRESETS = Array.from(
  new Set(Object.values(SACCO_MEMBERSHIP_TIERS).flatMap((tier) => tier.monthlyContributions))
);

const QUARTERLY_SAVINGS_PRESETS = Array.from(
  new Set(Object.values(SACCO_MEMBERSHIP_TIERS).flatMap((tier) => tier.quarterlyContributions))
);

const SACCO_PAYMENT_LABELS = {
  sacco_membership_fee: 'SACCO Registration Fee',
  sacco_yearly_subscription: 'Yearly SACCO Subscription',
  sacco_savings_monthly: 'Monthly SACCO Savings',
  sacco_savings_quarterly: 'Quarterly SACCO Savings'
};

const SACCO_PAYMENT_TYPES = new Set(Object.keys(SACCO_PAYMENT_LABELS));

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function paymentDate(payment) {
  return payment?.confirmedAt || payment?.reviewedAt || payment?.createdAt || null;
}

function membershipAnchorDate(membership) {
  return membership?.joinedAt || membership?.approvedAt || membership?.startDate || membership?.createdAt || null;
}

function formatIso(date) {
  return date ? new Date(date).toISOString() : null;
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function forbidden(message) {
  const error = new Error(message);
  error.status = 403;
  return error;
}

function normalizePaymentType(paymentType) {
  return String(paymentType || '').trim();
}

function normalizeMembershipType(value) {
  const key = String(value || '').trim().toLowerCase();

  if (['starter', 'youth', 'youth_saver', 'starter_saver'].includes(key)) return 'starter';
  if (['growth', 'support', 'growth_saver', 'support_saver'].includes(key)) return 'growth';

  return 'ordinary';
}

function getMembershipTierConfig(value) {
  const type = normalizeMembershipType(value);
  return SACCO_MEMBERSHIP_TIERS[type] || SACCO_MEMBERSHIP_TIERS.ordinary;
}

function getYearlySubscriptionAmount(membershipType) {
  return getMembershipTierConfig(membershipType).annualSubscription;
}

function validateMembershipContributionOption(membershipType, amount) {
  const tier = getMembershipTierConfig(membershipType);

  if (!amount) {
    throw badRequest('Please select a planned contribution option.');
  }

  if (!tier.monthlyContributions.includes(amount)) {
    throw badRequest(
      `${tier.label} contribution must be selected from its approved options.`
    );
  }

  return true;
}

function validateStandardAmount(paymentType, amount, membershipType = 'ordinary') {
  const type = normalizePaymentType(paymentType);
  const tier = getMembershipTierConfig(membershipType);

  if (type === 'sacco_membership_fee' && amount !== SACCO_REGISTRATION_FEE) {
    throw badRequest('SACCO registration fee must be exactly UGX 50,000.');
  }

  if (type === 'sacco_yearly_subscription') {
    const expected = tier.annualSubscription;

    if (amount !== expected) {
      throw badRequest(
        `Yearly SACCO subscription for ${tier.label} must be exactly UGX ${expected.toLocaleString('en-UG')}.`
      );
    }
  }

  if (type === 'sacco_savings_monthly' && !tier.monthlyContributions.includes(amount)) {
    throw badRequest(
      `Monthly savings for ${tier.label} must be selected from its approved options.`
    );
  }

  if (type === 'sacco_savings_quarterly' && !tier.quarterlyContributions.includes(amount)) {
    throw badRequest(
      `Quarterly savings for ${tier.label} must be selected from its approved options.`
    );
  }
}

function calculateSubscriptionStatus({ membership, approvedYearlyPayments = [], pendingYearlyPayment = null }) {
  const yearlySubscriptionAmount = getYearlySubscriptionAmount(membership?.membershipType);

  if (!membership) {
    return {
      hasMembership: false,
      isActive: false,
      isSubscriptionDue: false,
      hasPendingYearlySubscription: false,
      yearlySubscriptionAmount,
      firstSubscriptionDueAt: null,
      nextSubscriptionDueAt: null,
      message: 'Start SACCO registration first.'
    };
  }

  if (membership.status !== 'active') {
    return {
      hasMembership: true,
      isActive: false,
      isSubscriptionDue: false,
      hasPendingYearlySubscription: false,
      yearlySubscriptionAmount,
      firstSubscriptionDueAt: null,
      nextSubscriptionDueAt: null,
      message: 'SACCO membership must be activated by admin approval before subscription or savings payments.'
    };
  }

  const anchor = membershipAnchorDate(membership);
  const firstSubscriptionDueAt = anchor ? addMonths(anchor, 6) : null;
  const latestApprovedYearly = approvedYearlyPayments[0] || null;
  const latestYearlyDate = paymentDate(latestApprovedYearly);

  let nextSubscriptionDueAt = firstSubscriptionDueAt;

  if (latestYearlyDate) {
    nextSubscriptionDueAt = addMonths(latestYearlyDate, 12);
  }

  const now = new Date();
  const isSubscriptionDue = nextSubscriptionDueAt ? now >= nextSubscriptionDueAt : false;

  return {
    hasMembership: true,
    isActive: true,
    isSubscriptionDue,
    hasPendingYearlySubscription: Boolean(pendingYearlyPayment),
    yearlySubscriptionAmount,
    firstSubscriptionDueAt: formatIso(firstSubscriptionDueAt),
    nextSubscriptionDueAt: formatIso(nextSubscriptionDueAt),
    latestYearlySubscriptionAt: formatIso(latestYearlyDate),
    message: isSubscriptionDue
      ? `Yearly SACCO subscription is due. Pay UGX ${yearlySubscriptionAmount.toLocaleString('en-UG')} before making other SACCO payments.`
      : 'SACCO subscription is currently in good standing.'
  };
}

async function getSaccoPaymentContext(prisma, alumniId) {
  const [membership, approvedYearlyPayments, pendingYearlyPayment] = await Promise.all([
    prisma.saccoMembership.findUnique({ where: { alumniId } }),
    prisma.payment.findMany({
      where: {
        alumniId,
        paymentType: 'sacco_yearly_subscription',
        status: 'approved'
      },
      orderBy: [
        { confirmedAt: 'desc' },
        { reviewedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 1
    }),
    prisma.payment.findFirst({
      where: {
        alumniId,
        paymentType: 'sacco_yearly_subscription',
        status: { in: ['pending', 'pending_gateway_confirmation'] }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const subscription = calculateSubscriptionStatus({
    membership,
    approvedYearlyPayments,
    pendingYearlyPayment
  });

  return { membership, subscription, pendingYearlyPayment };
}

function validateSaccoPaymentRequest({ paymentType, amount, context }) {
  const type = normalizePaymentType(paymentType);

  if (!SACCO_PAYMENT_TYPES.has(type)) {
    throw badRequest('Invalid SACCO payment type.');
  }

  validateStandardAmount(type, amount, context.membership?.membershipType);

  if (type === 'sacco_membership_fee') {
    return;
  }

  if (!context.membership) {
    throw forbidden('You must start SACCO registration before making SACCO payments.');
  }

  if (context.membership.status !== 'active') {
    throw forbidden('Your SACCO membership is not active yet. Wait for admin approval of the registration fee.');
  }

  if (type === 'sacco_yearly_subscription' && context.subscription.hasPendingYearlySubscription) {
    throw badRequest('You already have a yearly subscription payment pending admin review.');
  }

  if (type !== 'sacco_yearly_subscription' && context.subscription.hasPendingYearlySubscription) {
    throw forbidden('Your yearly subscription is already pending review. Wait for admin approval before making other SACCO payments.');
  }

  if (type !== 'sacco_yearly_subscription' && context.subscription.isSubscriptionDue) {
    throw forbidden(
      `Your yearly SACCO subscription is due. Pay UGX ${context.subscription.yearlySubscriptionAmount.toLocaleString('en-UG')} before making other SACCO payments.`
    );
  }
}

module.exports = {
  SACCO_REGISTRATION_FEE,
  SACCO_YEARLY_SUBSCRIPTION,
  SACCO_MEMBERSHIP_TIERS,
  MONTHLY_SAVINGS_PRESETS,
  QUARTERLY_SAVINGS_PRESETS,
  SACCO_PAYMENT_LABELS,
  SACCO_PAYMENT_TYPES,
  normalizeMembershipType,
  getMembershipTierConfig,
  getYearlySubscriptionAmount,
  validateMembershipContributionOption,
  getSaccoPaymentContext,
  validateSaccoPaymentRequest
};

