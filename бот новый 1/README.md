# Polymarket BTC Bot

Торговый бот для Polymarket (бинарные рынки BTC up/down 5m). Поддерживает несколько стратегий: **маркет-мейкинг (spread maker)**, **YES+NO-арбитраж**, lag-арбитраж, expiry squeeze и momentum fallback.

## ⚠️ Про Vercel

**Vercel не подходит** для этого бота: он рассчитан на serverless-функции с ограничением по времени выполнения. Бот — длительно работающий процесс с постоянными WebSocket-подключениями к Binance и Polymarket.

Используй **Railway** или **Render** — они поддерживают worker-процессы и постоянные соединения.

---

## Локальный запуск

```bash
cd "bot polymarket"
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Заполни .env
python bot.py
```

---

## Деплой: Railway (рекомендуется)

1. Создай репо на GitHub и запушь проект:

```bash
cd "bot polymarket"
git init
git add .
git commit -m "Polymarket bot"
git remote add origin https://github.com/YOUR_USERNAME/polymarket-bot.git
git branch -M main
git push -u origin main
```

2. Открой [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.

3. Выбери репо `polymarket-bot`.

4. **Variables** (Settings → Variables):
   - `MARKET_SLUG` — slug рынка. Для BTC 5min: `btc-updown-5m` (модель применима). Для событийных рынков — полный slug.
   - `POLY_PRIVATE_KEY` — приватный ключ кошелька (0x...)
   - `DRY_RUN=1` — для тестов без реальных ордеров, `0` для реальной торговли

5. Deploy — Railway запустит `python bot.py` как worker.

---

## Деплой: Render

1. [render.com](https://render.com) → New → Background Worker.

2. Connect GitHub repo.

3. Настройки:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python bot.py`

4. Environment Variables:
   - `MARKET_SLUG`, `POLY_PRIVATE_KEY`, `DRY_RUN` и т.п.

5. Create Background Worker.

---

## Стратегии

| Тип | Описание |
|-----|----------|
| **mm** (spread maker) | Спред (ask − bid) ≥ SPREAD_MIN_BPS (20 bps) или SPREAD_MAKER_MIN_PCT: buy bid+0.001, sell ask−0.001. Выход по TP/SL ±5% или HOLD_MAX_SEC. |
| **arb** | YES+NO арбитраж: если ask_yes + ask_no < ARB_THRESHOLD (0.997), покупка обеих сторон на одинаковую сумму. Позиция до экспирации рынка. |
| **lag** | Lag-арбитраж по edge и импульсу (MOM_ENTRY_PCT, EXEC_EDGE_LAG). |
| **squeeze** | Вход в последние минуты до экспирации при сжатии спреда. |
| **simple_mom** | Fallback по краткосрочному импульсу BTC. |

Для всех входов действуют: фильтр цены (MIN_ENTRY_PRICE ≤ price ≤ MAX_ENTRY_PRICE), проверка времени до экспирации (не входить при tte < MIN_TIME_TO_EXPIRY_SEC) и лимиты risk-менеджера.

В логах `[METRICS]` и `[HEALTH]` выводятся счётчики по типам входов (`entry_by=arb=3 mm=5 lag=2`) и PnL по стратегиям (`pnl_by=arb=$0.50 mm=$1.20`).

---

## Тестирование (DRY_RUN)

Перед реальной торговлей обязательно протестируй в симуляции:

1. В `.env` или Variables выставь **`DRY_RUN=1`**.
2. Запусти бота; ордера не отправляются на биржу, но логика mm/arb/lag выполняется и в логах пишутся `[DRY] BUY` / `[DRY] SELL`.
3. Проверь в логах: срабатывает ли spread maker (спред > 2%), арбитраж (ask_yes+ask_no < 0.997), нет ли входов по крайним ценам (< 0.08 или > 0.92).
4. В `[METRICS]` и `[HEALTH]` смотри `entry_by` и `pnl_by` — какая стратегия даёт входы и виртуальный PnL.
5. После успешного прогона переключи **`DRY_RUN=0`** для реальной торговли.

---

## Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `MARKET_SLUG` | — | Slug рынка; `auto` — авто-выбор по MARKET_WINDOW |
| `MARKET_WINDOW` | 5m | Окно рынка: `5m`, `10m`, `1h` (btc-updown-5m/10m/1h) |
| `POLY_PRIVATE_KEY` | — | Приватный ключ кошелька (0x...) |
| `DRY_RUN` | 1 | `1` — симуляция (без реальных ордеров), `0` — реальная торговля |
| `MAX_USD_PER_TRADE` | 5 | Размер одной сделки ($) |
| `MAX_OPEN_TRADES` | 2 | Макс. открытых позиций |
| `SESSION_LOSS_LIMIT_USD` | 15 | Лимит убытка за сессию ($) |
| `MIN_ENTRY_PRICE` / `MAX_ENTRY_PRICE` | 0.08 / 0.92 | Не входить, если цена вне диапазона |
| `MIN_TIME_TO_EXPIRY_SEC` | 120 | Не входить, если до экспирации < N сек |
| `MIN_LIQ_USD` / `EXIT_MIN_LIQ_USD` | 0.5 | Мин. ликвидность для входа/выхода |
| `ARB_ENABLED` | 1 | Включить YES+NO арбитраж |
| `ARB_THRESHOLD` | 0.997 | Порог: входить при ask_yes+ask_no < значения |
| `SPREAD_MAKER_ENABLED` | 1 | Включить маркет-мейкинг (spread maker) |
| `SPREAD_MAKER_MIN_PCT` / `SPREAD_MIN_BPS` | 0.01 / 20 | Мин. спред (% или bps) для mm |
| `HOLD_MAX_SEC` | 30 | Макс. время удержания позиции (с) |
| `TAKE_PROFIT_PCT` / `STOP_LOSS_PCT` | 0.05 | Тейк-профит и стоп-лосс (±5%) |

Полный список — в `.env.example`.

---

## Git + GitHub

Если проект уже лежит в общей домашней папке:

```bash
mkdir -p ~/projects
cp -r "bot polymarket" ~/projects/polymarket-bot
cd ~/projects/polymarket-bot
git init
git add .
git commit -m "Initial commit"
gh repo create polymarket-bot --private --source=. --push
```

Или без `gh`: создай пустой репо на GitHub и сделай `git remote add origin ...; git push -u origin main`.
