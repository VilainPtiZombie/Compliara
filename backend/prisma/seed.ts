import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin1234!', 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'compliara-demo' },
    update: {},
    create: {
      name: 'Compliara Demo',
      slug: 'compliara-demo',
      plan: 'PRO',
      users: {
        create: {
          email: 'admin@compliara.fr',
          password,
          firstName: 'Admin',
          lastName: 'Compliara',
          role: 'ADMIN',
          profile: 'AUDITOR',
        },
      },
    },
  });

  console.log(`✅ Tenant créé : ${tenant.name}`);
  console.log(`📧 Email    : admin@compliara.fr`);
  console.log(`🔑 Password : Admin1234!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
