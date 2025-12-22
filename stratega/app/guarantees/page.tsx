import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GuaranteesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Гарантии и возврат</h1>

      <div className="prose max-w-none mb-8">
        <p className="text-lg mb-4">
          Мы гарантируем качество товаров и услуг, предоставляемых нашими партнерами-поставщиками.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Гарантии качества</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Работаем только с проверенными поставщиками</li>
              <li>• Все товары соответствуют заявленным характеристикам</li>
              <li>• Предоставляем необходимую документацию</li>
              <li>• Соблюдаем сроки поставки</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Возврат</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Условия возврата согласовываются индивидуально</li>
              <li>• Возможен возврат при несоответствии товара описанию</li>
              <li>• Все вопросы решаются в рабочем порядке</li>
              <li>• Подробности в договоре поставки</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

