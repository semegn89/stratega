import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Электроника',
      slug: 'electronics',
      description: 'Электронные товары и компоненты',
      order: 1,
    },
  })

  const category2 = await prisma.category.create({
    data: {
      name: 'Оборудование',
      slug: 'equipment',
      description: 'Промышленное оборудование',
      order: 2,
    },
  })

  const subcategory1 = await prisma.category.create({
    data: {
      name: 'Компьютеры',
      slug: 'computers',
      description: 'Компьютеры и комплектующие',
      parentId: category1.id,
      order: 1,
    },
  })

  // Create products
  await prisma.product.create({
    data: {
      name: 'Ноутбук бизнес-класса',
      slug: 'business-laptop',
      description: 'Надежный ноутбук для бизнеса',
      fullDescription: '<p>Профессиональный ноутбук с высокими характеристиками для бизнеса.</p>',
      categoryId: subcategory1.id,
      brand: 'Example Brand',
      country: 'Китай',
      price: 899.99,
      currency: 'EUR',
      images: ['/placeholder-laptop.jpg'],
      attributes: {
        create: [
          { name: 'Процессор', value: 'Intel Core i7', type: 'TEXT' },
          { name: 'Память', value: '16 GB', type: 'TEXT' },
          { name: 'Диск', value: '512 GB SSD', type: 'TEXT' },
        ],
      },
    },
  })

  await prisma.product.create({
    data: {
      name: 'Промышленный станок',
      slug: 'industrial-machine',
      description: 'Современный промышленный станок',
      fullDescription: '<p>Высокопроизводительный станок для промышленного производства.</p>',
      categoryId: category2.id,
      brand: 'Industrial Co',
      country: 'Германия',
      // Цена по запросу
      images: ['/placeholder-machine.jpg'],
      attributes: {
        create: [
          { name: 'Мощность', value: '5.5 кВт', type: 'TEXT' },
          { name: 'Вес', value: '1200 кг', type: 'TEXT' },
        ],
      },
    },
  })

  // Create services
  await prisma.service.create({
    data: {
      name: 'Логистические услуги',
      slug: 'logistics',
      description: 'Полный комплекс логистических услуг',
      fullDescription: '<p>Организация доставки грузов по всей Европе. Таможенное оформление, складирование, распределение.</p>',
      category: 'Логистика',
      duration: 'По договоренности',
      geography: 'Европа',
      conditions: '<p>Работаем с различными типами грузов. Гибкие условия оплаты.</p>',
    },
  })

  await prisma.service.create({
    data: {
      name: 'Консультационные услуги',
      slug: 'consulting',
      description: 'Профессиональные консультации по подбору товаров',
      fullDescription: '<p>Помогаем выбрать оптимальное решение для вашего бизнеса. Анализ потребностей, подбор поставщиков, сравнение предложений.</p>',
      category: 'Консалтинг',
      duration: '1-5 рабочих дней',
      geography: 'Удаленно / Офис',
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

