import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Доставка и оплата</h1>

      <div className="prose max-w-none mb-8">
        <p className="text-lg mb-4">
          Условия доставки и оплаты согласовываются индивидуально с каждым клиентом 
          после получения заявки и уточнения деталей.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Доставка</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Доставка по всей Европе</li>
              <li>• Сроки и стоимость согласовываются индивидуально</li>
              <li>• Возможны различные варианты Incoterms</li>
              <li>• Отслеживание груза при необходимости</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Оплата</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Условия оплаты указываются в коммерческом предложении</li>
              <li>• Возможны различные формы оплаты</li>
              <li>• Работаем с юридическими и физическими лицами</li>
              <li>• Все условия фиксируются в договоре</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

