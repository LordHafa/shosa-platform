require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { CAMPUSES, PERMISSION_DEFINITIONS, ROLE_DEFINITIONS, ROLE_PERMISSIONS } = require('../src/lib/permissions');
const { validatePassword, getBcryptRounds, validateEmail } = require('../src/lib/validators');

const prisma = new PrismaClient();

async function seedGovernance(superAdmin) {
  for (const campus of CAMPUSES) {
    await prisma.campus.upsert({
      where: { code: campus.code },
      update: { name: campus.name, sortOrder: campus.sortOrder, isActive: true },
      create: campus
    });
  }

  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name, category: permission.category, description: permission.description || null },
      create: { ...permission, description: permission.description || null }
    });
  }

  for (const role of ROLE_DEFINITIONS) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description, scopeLevel: role.scopeLevel, isSystem: true },
      create: { code: role.code, name: role.name, description: role.description, scopeLevel: role.scopeLevel, isSystem: true }
    });
  }

  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUnique({ where: { code: permissionCode } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id }
      });
    }
  }

  const superRole = await prisma.role.findUnique({ where: { code: 'super_admin' } });
  if (superAdmin && superRole) {
    const existing = await prisma.adminRole.findFirst({
      where: { adminId: superAdmin.id, roleId: superRole.id, scopeType: null, scopeValue: null }
    });

    if (!existing) {
      await prisma.adminRole.create({ data: { adminId: superAdmin.id, roleId: superRole.id } });
    }
  }

  const settings = [
    { key: 'sacco.registration_fee', value: process.env.SACCO_REG_FEE || '50000', group: 'sacco', description: 'SACCO registration fee in UGX.' },
    { key: 'sacco.yearly_subscription', value: '100000', group: 'sacco', description: 'Suggested yearly SACCO subscription in UGX.' },
    { key: 'system.currency', value: 'UGX', group: 'system', description: 'Default system currency.' },
    { key: 'contact.general_email', value: 'alumni@shosa.ug', group: 'contact', description: 'General alumni contact email placeholder.' },
    { key: 'contact.sacco_email', value: 'sacco@shosa.ug', group: 'contact', description: 'SACCO contact email placeholder.' }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
  }
}

function seedAdminCredentials() {
  const email = validateEmail(process.env.SEED_ADMIN_EMAIL || 'admin@shosa.ug');
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    console.error('FATAL: Set SEED_ADMIN_PASSWORD before running npm run seed.');
    process.exit(1);
  }

  validatePassword(password, 'SEED_ADMIN_PASSWORD');

  return { email, password };
}

async function main() {
  console.log('Seeding SHOSA database...');

  const { email, password } = seedAdminCredentials();
  const passwordHash = await bcrypt.hash(password, getBcryptRounds());

  const superAdmin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, fullName: 'Super Admin', role: 'super_admin' },
    create: {
      email,
      passwordHash,
      fullName: 'Super Admin',
      role: 'super_admin'
    }
  });

  await seedGovernance(superAdmin);

  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    await prisma.event.createMany({
      data: [
        {
          title: 'Annual Alumni Reunion 2026',
          description: 'Join us for the biggest SHOSA gathering of the year.',
          startDate: new Date('2026-06-15T09:00:00+03:00'),
          location: 'Seeta High Main Campus',
          category: 'reunion',
          isActive: true
        },
        {
          title: 'SACCO Annual General Meeting',
          description: 'Review savings, payments, leadership reports, and SACCO plans.',
          startDate: new Date('2026-07-20T10:00:00+03:00'),
          location: 'A Level Campus',
          category: 'sacco_meeting',
          isActive: true
        }
      ]
    });
  }

  const productCount = await prisma.storeProduct.count();
  if (productCount === 0) {
    await prisma.storeProduct.createMany({
      data: [
        { name: 'SHOSA T-Shirt', description: 'Premium cotton alumni t-shirt.', price: 25000, category: 'tshirt', stockStatus: 'in_stock' },
        { name: 'SHOSA Hoodie', description: 'Warm hoodie with alumni branding.', price: 75000, category: 'hoodie', stockStatus: 'in_stock' },
        { name: 'SHOSA Cap', description: 'Classic branded alumni cap.', price: 20000, category: 'cap', stockStatus: 'in_stock' }
      ]
    });
  }

  console.log('Database seeded successfully.');
  console.log(`Seeded super admin email: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });