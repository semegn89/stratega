export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Политика конфиденциальности</h1>

      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Общие положения</h2>
          <p>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
            персональных данных пользователей сайта STRATEGA-LAM S.R.L.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Сбор персональных данных</h2>
          <p>
            Мы собираем следующие персональные данные:
          </p>
          <ul>
            <li>Имя и контактная информация (email, телефон)</li>
            <li>Информация о компании</li>
            <li>Данные, предоставленные в формах заявок</li>
            <li>Технические данные (IP-адрес, cookies)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Использование данных</h2>
          <p>
            Персональные данные используются для:
          </p>
          <ul>
            <li>Обработки заявок и запросов</li>
            <li>Связи с клиентами</li>
            <li>Улучшения качества обслуживания</li>
            <li>Аналитики и статистики</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Защита данных</h2>
          <p>
            Мы применяем современные методы защиты персональных данных от несанкционированного 
            доступа, изменения, раскрытия или уничтожения.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Контакты</h2>
          <p>
            По вопросам обработки персональных данных обращайтесь:
          </p>
          <p>
            STRATEGA-LAM S.R.L.<br />
            Jud. Vaslui, Municipiul Vaslui<br />
            Strada Radu Negru, Bl. 274, Scara C, Ap. B14
          </p>
        </section>
      </div>
    </div>
  )
}

