# План запуска демо и сбор данных

## 1. Залить на GitHub

Если репо ещё не создан:

```bash
cd "/Users/grigorijs/bot polymarket"
# Создай на github.com новый репо (например polymarket-bot), без README
git remote add origin https://github.com/TVOJ_USERNAME/polymarket-bot.git
git push -u origin main
```

Если remote уже есть:

```bash
cd "/Users/grigorijs/bot polymarket"
git push origin main
```

---

## 2. Локально: подготовка

```bash
cd "/Users/grigorijs/bot polymarket"
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## 3. Настроить .env для демо (без реальных сделок)

Создай файл `.env` (скопируй из примера):

```bash
cp .env.example .env
```

Отредактируй `.env`:

| Переменная | Значение для демо | Пояснение |
|------------|-------------------|-----------|
| `MARKET_SLUG` | slug рынка с Polymarket | Например `will-bitcoin-hit-100000-before-march-15` — возьми из URL страницы рынка |
| `POLY_PRIVATE_KEY` | `0x...` твоего кошелька | Нужен для API; при DRY_RUN=1 ордера не отправляются, но баланс/книга работают |
| `DRY_RUN` | `1` | **Обязательно 1 для демо** — никаких реальных ордеров |
| `MIN_EDGE` | `0.04` или выше | Чтобы реже были "входы" в логах (при демо всё равно симуляция) |
| Остальное | можно по умолчанию | |

Узнать slug рынка: открой рынок на polymarket.com, в URL будет что-то вроде  
`https://polymarket.com/event/...` — slug часто в пути или в описании страницы. Либо через Gamma API:  
`https://gamma-api.polymarket.com/markets` — ищи нужный рынок по вопросу.

---

## 4. Запуск бота (демо)

```bash
cd "/Users/grigorijs/bot polymarket"
source .venv/bin/activate
python bot.py
```

Бот будет:
- подключаться к Binance (BTC) и к Polymarket WS (стакан);
- писать логи в консоль и в файл.

Остановка: `Ctrl+C`. Бот постарается корректно завершиться (graceful shutdown).

---

## 5. Где всё видеть

### В терминале (в реальном времени)

- `[BAL] USDC=...` — баланс.
- `[MODEL] T=... p_up=... edge_up=... exec_up=...` — модель и edge по UP/DN.
- `[SIGNAL]` не будет при DRY_RUN, но при желании можно временно поставить DRY_RUN=0 на тестовые суммы и смотреть `[DRY] IOC BUY/SELL` или `[LIVE]`.
- `[WS] dropped_msgs=...` — раз в 1000 пропущенных сообщений.
- `[METRICS]` — после каждой закрытой сделки (в демо без реальных ордеров сделок не будет, метрики появятся только при реальной торговле или если добавишь симуляцию).

### В файле лога

В той же папке появится файл:

```
bot_<MARKET_SLUG>_<unix_timestamp>.log
```

Пример: `bot_will-bitcoin-hit-100000_1749123456.log`

Там те же сообщения, что и в консоли. Смотреть можно так:

```bash
tail -f bot_*.log
```

или открыть файл в редакторе после остановки бота.

### Сводка по данным

- **Стакан и модель** — в логах каждые ~debounce секунд: `[MODEL]` с edge и exec cost.
- **Баланс** — периодически `[BAL] USDC=...`.
- **Метрики (сделки)** — строки `[METRICS] trades=... win%=% net=$... total=$...` после каждой закрытой позиции (в чистом демо с DRY_RUN=1 реальных сделок нет, значит и записей METRICS не будет).

---

## 6. Краткий чеклист демо

1. Создать репо на GitHub (если ещё нет) и сделать `git remote add origin ...` и `git push`.
2. `python3 -m venv .venv`, `source .venv/bin/activate`, `pip install -r requirements.txt`.
3. `cp .env.example .env`, задать `MARKET_SLUG`, `POLY_PRIVATE_KEY`, **DRY_RUN=1**.
4. Запустить: `python bot.py`.
5. Смотреть вывод в терминале и/или `tail -f bot_*.log`.

Чтобы потом собирать реальные метрики (trades, win%, net PnL), переключи на реальную торговлю: `DRY_RUN=0`, выстави маленький `MAX_USD_PER_TRADE` и наблюдай те же логи + `[METRICS]` после каждой закрытой сделки.
