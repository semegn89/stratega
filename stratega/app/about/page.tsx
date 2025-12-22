import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">О компании</h1>

      <div className="prose max-w-none mb-8">
        <p className="text-lg mb-4">
          STRATEGA-LAM S.R.L. — профессиональный торговый агент, специализирующийся на 
          предоставлении качественных товаров и услуг для бизнеса.
        </p>
        <p className="mb-4">
          Мы работаем как агрегатор предложений, помогая нашим клиентам находить 
          оптимальные решения и получать выгодные коммерческие предложения от проверенных поставщиков.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Наши преимущества</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>✓ Широкий ассортимент товаров и услуг</li>
              <li>✓ Быстрая обработка заявок (SLA 24 часа)</li>
              <li>✓ Работа по всей Европе</li>
              <li>✓ Прозрачные условия сотрудничества</li>
              <li>✓ Профессиональная поддержка</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Реквизиты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Название:</strong> STRATEGA-LAM S.R.L.</p>
              <p><strong>CUI:</strong> 52815066</p>
              <p><strong>EUID:</strong> ROONRC.J2025083844000</p>
              <p><strong>ОКВЭД:</strong> 4690 (Comerț cu ridicata nespecializat)</p>
              <p><strong>Адрес:</strong> Jud. Vaslui, Municipiul Vaslui, Strada Radu Negru, Bl. 274, Scara C, Ap. B14</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

