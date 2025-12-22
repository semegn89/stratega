import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Briefcase, FileText, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Торговый агент — ваш надежный партнер
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Витрина товаров и услуг. Быстрый запрос цен и коммерческих предложений от проверенных поставщиков.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" variant="secondary">
                <Link href="/catalog">Каталог товаров</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/services">Услуги</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Почему мы</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Package className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Широкий ассортимент</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Тысячи товаров от проверенных поставщиков с гарантией качества
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Briefcase className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Профессиональные услуги</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Консультации, логистика, таможенное оформление и многое другое
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Быстрый ответ</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Обработка заявок в течение 24 часов. Прозрачные условия работы
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Надежность</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Работаем по всей Европе. Соблюдаем сроки и гарантируем качество
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Готовы начать сотрудничество?</h2>
            <p className="text-xl mb-6 text-blue-100">
              Отправьте запрос цены или закажите консультацию прямо сейчас
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/catalog">Посмотреть каталог</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

