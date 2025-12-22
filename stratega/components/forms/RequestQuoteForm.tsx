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
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(5, 'Некорректный телефон'),
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
        alert('Ошибка при отправке заявки. Попробуйте позже.')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Ошибка при отправке заявки. Попробуйте позже.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <p className="text-green-800 font-semibold mb-2">Заявка успешно отправлена!</p>
        <p className="text-sm text-green-700">Мы свяжемся с вами в ближайшее время.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Имя *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ваше имя"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
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
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Телефон *</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+373 123 456 789"
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="company">Компания</Label>
        <Input
          id="company"
          {...register('company')}
          placeholder="Название компании"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Город</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="Город"
          />
        </div>
        <div>
          <Label htmlFor="country">Страна</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="Страна"
          />
        </div>
      </div>

      {productId && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Количество</Label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity')}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="unit">Единица измерения</Label>
              <Input
                id="unit"
                {...register('unit')}
                placeholder="шт, кг, м² и т.д."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryDate">Желаемый срок поставки</Label>
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
                <SelectValue placeholder="Выберите условия поставки" />
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
        <Label htmlFor="requirements">Требования / Техническое задание</Label>
        <Textarea
          id="requirements"
          {...register('requirements')}
          placeholder="Опишите ваши требования..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          {...register('comment')}
          placeholder="Дополнительная информация..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
      </Button>
    </form>
  )
}

