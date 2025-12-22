import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to convert arrays to JSON strings for SQLite
function jsonStringify(value: string[] | null | undefined): string | null {
  if (!value || value.length === 0) return null
  return JSON.stringify(value)
}

async function main() {
  console.log('Seeding database...')

  // Create categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic products and components',
      order: 1,
    },
  })

  const category2 = await prisma.category.create({
    data: {
      name: 'Equipment',
      slug: 'equipment',
      description: 'Industrial equipment',
      order: 2,
    },
  })

  const subcategory1 = await prisma.category.create({
    data: {
      name: 'Computers',
      slug: 'computers',
      description: 'Computers and components',
      parentId: category1.id,
      order: 1,
    },
  })

  // Create products
  await prisma.product.create({
    data: {
      name: 'Business Laptop',
      slug: 'business-laptop',
      description: 'Reliable laptop for business',
      fullDescription: '<p>Professional laptop with high specifications for business.</p>',
      categoryId: subcategory1.id,
      brand: 'Example Brand',
      country: 'China',
      price: 899.99,
      currency: 'EUR',
      images: jsonStringify(['/placeholder-laptop.jpg']),
      attributes: {
        create: [
          { name: 'Processor', value: 'Intel Core i7', type: 'TEXT' },
          { name: 'Memory', value: '16 GB', type: 'TEXT' },
          { name: 'Storage', value: '512 GB SSD', type: 'TEXT' },
        ],
      },
    },
  })

  await prisma.product.create({
    data: {
      name: 'Industrial Machine',
      slug: 'industrial-machine',
      description: 'Modern industrial machine',
      fullDescription: '<p>High-performance machine for industrial production.</p>',
      categoryId: category2.id,
      brand: 'Industrial Co',
      country: 'Germany',
      // Price on request
      images: jsonStringify(['/placeholder-machine.jpg']),
      attributes: {
        create: [
          { name: 'Power', value: '5.5 kW', type: 'TEXT' },
          { name: 'Weight', value: '1200 kg', type: 'TEXT' },
        ],
      },
    },
  })

  // Create services
  await prisma.service.create({
    data: {
      name: 'Logistics Services',
      slug: 'logistics',
      description: 'Full range of logistics services',
      fullDescription: '<p>Organization of cargo delivery across Europe. Customs clearance, warehousing, distribution.</p>',
      category: 'Logistics',
      duration: 'As agreed',
      geography: 'Europe',
      conditions: '<p>Working with various types of cargo. Flexible payment terms.</p>',
    },
  })

  await prisma.service.create({
    data: {
      name: 'Consulting Services',
      slug: 'consulting',
      description: 'Professional product selection consultations',
      fullDescription: '<p>We help you choose the optimal solution for your business. Needs analysis, supplier selection, proposal comparison.</p>',
      category: 'Consulting',
      duration: '1-5 business days',
      geography: 'Remote / Office',
    },
  })

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

