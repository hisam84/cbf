// ==============================================================================
// Database Seeding Script
// Populates Neon PostgreSQL with sample/initial Bangladeshi blood donors and activities
// Run with: npm run db:seed
// ==============================================================================

const { neon } = require('@neondatabase/serverless');
const { initDatabase } = require('./init-db');
require('dotenv').config();

const sampleDonors = [
  {
    name: 'মো: আব্দুল করিম',
    mobile: '01757831838',
    blood_group: 'A+',
    address: 'চাঁপাইনবাবগঞ্জ সদর',
    last_donation: '2026-06-15',
  },
  {
    name: 'মোছা: ফাতেমা খাতুন',
    mobile: '01785466153',
    blood_group: 'O+',
    address: 'শিবগঞ্জ, চাঁপাইনবাবগঞ্জ',
    last_donation: '2026-07-02',
  },
  {
    name: 'রাকিবুল হাসান',
    mobile: '01812345678',
    blood_group: 'B+',
    address: 'গোমস্তাপুর, চাঁপাইনবাবগঞ্জ',
    last_donation: '2026-05-20',
  },
  {
    name: 'তানভীর আহমেদ',
    mobile: '01987654321',
    blood_group: 'AB+',
    address: 'নাচোল, চাঁপাইনবাবগঞ্জ',
    last_donation: '2026-08-01',
  },
  {
    name: 'সোহেল রানা',
    mobile: '01611223344',
    blood_group: 'O-',
    address: 'ভোলাহাট, চাঁপাইনবাবগঞ্জ',
    last_donation: '2026-04-10',
  },
];

const sampleDonations = [
  {
    donor_name: 'মো: আব্দুল করিম',
    donor_phone: '01757831838',
    donor_address: 'চাঁপাইনবাবগঞ্জ সদর',
    number: 'CBF-2026-001',
    blood_group: 'A+',
    date: '2026-06-15',
    notes: 'Emergency donation at Sadar Hospital',
  },
  {
    donor_name: 'মোছা: ফাতেমা খাতুন',
    donor_phone: '01785466153',
    donor_address: 'শিবগঞ্জ, চাঁপাইনবাবগঞ্জ',
    number: 'CBF-2026-002',
    blood_group: 'O+',
    date: '2026-07-02',
    notes: 'Voluntary blood drive donation',
  },
];

async function seedDatabase() {
  console.log('Seeding Neon database with sample records...');

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!dbUrl || !dbUrl.startsWith('postgres')) {
    console.error('[ERROR] DATABASE_URL is not set in .env');
    process.exit(1);
  }

  await initDatabase();
  const sql = neon(dbUrl);

  try {
    // Seed donors if table is empty
    const [donorCount] = await sql`SELECT count(*)::int as count FROM donors;`;
    if (donorCount.count === 0) {
      console.log('Inserting initial donors...');
      for (const d of sampleDonors) {
        await sql`
          INSERT INTO donors (name, mobile, blood_group, address, last_donation)
          VALUES (${d.name}, ${d.mobile}, ${d.blood_group}, ${d.address}, ${d.last_donation});
        `;
      }
      console.log(`- Added ${sampleDonors.length} sample donors`);
    } else {
      console.log(`Donors table already contains ${donorCount.count} records. Skipping donor seed.`);
    }

    // Seed donations if table is empty
    const [donationCount] = await sql`SELECT count(*)::int as count FROM donations;`;
    if (donationCount.count === 0) {
      console.log('Inserting initial donations...');
      for (const d of sampleDonations) {
        await sql`
          INSERT INTO donations (donor_name, donor_phone, donor_address, number, blood_group, date, notes)
          VALUES (${d.donor_name}, ${d.donor_phone}, ${d.donor_address}, ${d.number}, ${d.blood_group}, ${d.date}, ${d.notes});
        `;
      }
      console.log(`- Added ${sampleDonations.length} sample donations`);
    } else {
      console.log(`Donations table already contains ${donationCount.count} records. Skipping donation seed.`);
    }

    console.log('\nDatabase seeding completed successfully!\n');
  } catch (err) {
    console.error('[ERROR] Seeding failed:', err.message);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
