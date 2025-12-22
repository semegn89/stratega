import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">STRATEGA-LAM S.R.L.</h3>
            <p className="text-sm text-muted-foreground">
              Торговый агент. Витрина товаров и услуг.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalog" className="text-muted-foreground hover:text-primary">
                  Каталог товаров
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-primary">
                  Услуги
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary">
                  О компании
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-muted-foreground hover:text-primary">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/delivery" className="text-muted-foreground hover:text-primary">
                  Доставка
                </Link>
              </li>
              <li>
                <Link href="/guarantees" className="text-muted-foreground hover:text-primary">
                  Гарантии
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Jud. Vaslui, Municipiul Vaslui</p>
              <p>Strada Radu Negru, Bl. 274, Scara C, Ap. B14</p>
              <p>CUI: 52815066</p>
              <p>EUID: ROONRC.J2025083844000</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} STRATEGA-LAM S.R.L. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}

