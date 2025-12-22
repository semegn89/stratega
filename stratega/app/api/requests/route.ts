import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const requestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  company: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  comment: z.string().optional(),
  quantity: z.number().nullable().optional(),
  unit: z.string().optional(),
  requirements: z.string().optional(),
  deliveryDate: z.string().nullable().optional(),
  incoterms: z.string().optional(),
  productId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  type: z.enum(['PRODUCT_RFQ', 'SERVICE_CONSULTATION']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    // TODO: Add rate limiting and reCAPTCHA verification here

    const requestRecord = await prisma.request.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        company: validatedData.company,
        city: validatedData.city,
        country: validatedData.country,
        comment: validatedData.comment,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        requirements: validatedData.requirements,
        deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : null,
        incoterms: validatedData.incoterms,
        productId: validatedData.productId,
        serviceId: validatedData.serviceId,
        type: validatedData.type,
        status: 'NEW',
      },
    })

    // TODO: Send email notification here
    // await sendEmailNotification(requestRecord)

    return NextResponse.json({ success: true, id: requestRecord.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

