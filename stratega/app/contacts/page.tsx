import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Контакты</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Контактная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Адрес</h3>
                  <p className="text-muted-foreground">
                    Jud. Vaslui, Municipiul Vaslui<br />
                    Strada Radu Negru, Bl. 274, Scara C, Ap. B14
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Реквизиты</h3>
                  <p className="text-muted-foreground">
                    CUI: 52815066<br />
                    EUID: ROONRC.J2025083844000
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Форма обратной связи</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Как с нами связаться</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Для получения коммерческого предложения или консультации заполните форму 
                обратной связи, и наш менеджер свяжется с вами в течение 24 часов.
              </p>
              <p className="mb-4">
                Вы также можете отправить запрос цены прямо из карточки товара или услуги.
              </p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Время работы:</strong> Пн-Пт, 9:00 - 18:00 (EET)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

