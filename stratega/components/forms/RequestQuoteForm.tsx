'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const requestSchema = z.object({
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(5, 'Invalid phone number'),
  company: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  comment: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  requirements: z.string().optional(),
  deliveryDate: z.string().optional(),
  incoterms: z.string().optional(),
})

type RequestFormData = z.infer<typeof requestSchema>

interface RequestQuoteFormProps {
  productId?: string
  serviceId?: string
}

export function RequestQuoteForm({ productId, serviceId }: RequestQuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema)
  })

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          quantity: data.quantity ? parseFloat(data.quantity) : null,
          deliveryDate: data.deliveryDate || null,
          productId: productId || null,
          serviceId: serviceId || null,
          type: productId ? 'PRODUCT_RFQ' : 'SERVICE_CONSULTATION'
        })
      })

      if (response.ok) {
        setSubmitSuccess(true)
      } else {
        alert('Error submitting request. Please try again later.')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Error submitting request. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="p-6 bg-[rgba(22,163,74,0.08)] border border-[rgba(22,163,74,0.2)] rounded-[18px] text-center">
        <p className="text-[#16A34A] font-semibold mb-2">Request submitted successfully!</p>
        <p className="text-sm text-[#16A34A]/80">We will contact you shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Your name"
        />
        {errors.name && (
          <p className="text-sm text-[#DC2626] mt-2">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="text-sm text-[#DC2626] mt-2">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+40 123 456 789"
        />
        {errors.phone && (
          <p className="text-sm text-[#DC2626] mt-2">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          {...register('company')}
          placeholder="Company name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="City"
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="Country"
          />
        </div>
      </div>

      {productId && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity')}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                {...register('unit')}
                placeholder="pcs, kg, m², etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryDate">Desired Delivery Date</Label>
            <Input
              id="deliveryDate"
              type="date"
              {...register('deliveryDate')}
            />
          </div>

          <div>
            <Label htmlFor="incoterms">Incoterms</Label>
            <Select onValueChange={(value) => setValue('incoterms', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select delivery terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                <SelectItem value="CPT">CPT - Carriage Paid To</SelectItem>
                <SelectItem value="CIP">CIP - Carriage and Insurance Paid</SelectItem>
                <SelectItem value="DAP">DAP - Delivered At Place</SelectItem>
                <SelectItem value="DPU">DPU - Delivered at Place Unloaded</SelectItem>
                <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="requirements">Requirements / Technical Specification</Label>
        <Textarea
          id="requirements"
          {...register('requirements')}
          placeholder="Describe your requirements..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="comment">Comment</Label>
        <Textarea
          id="comment"
          {...register('comment')}
          placeholder="Additional information..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </form>
  )
}

