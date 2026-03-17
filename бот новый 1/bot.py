import os
print("BOOT: python started", flush=True)
import json, time, math, asyncio, logging, signal, random
from collections import deque
from dataclasses import dataclass
from functools import partial
from pathlib import Path
from typing import Any, Optional, Tuple
import requests
import websockets
from dotenv import load_dotenv

from py_clob_client.client import ClobClient
from py_clob_client.constants import POLYGON
from py_clob_client.clob_types import OrderArgs, OrderType, BalanceAllowanceParams, AssetType

# IOC-like: fill what you can, cancel rest (FAK if IOC missing)
ORDER_TYPE_MARKET = getattr(OrderType, "IOC", None) or getattr(OrderType, "FAK", None) or OrderType.FOK
ORDER_TYPE_GTC = getattr(OrderType, "GTC", None) or "GTC"
try:
    from py_clob_client.clob_types import Side
    BUY_SIDE, SELL_SIDE = Side.BUY, Side.SELL
except (ImportError, AttributeError):
    BUY_SIDE, SELL_SIDE = "BUY", "SELL"

load_dotenv()
print("BOOT: imports done", flush=True)


def _safe_float(val: Any, default: float = 0.0) -> float:
    """Parse env value to float; tolerate Railway formatting (tabs, leading =)."""
    if val is None or val == "":
        return default
    s = str(val).strip().lstrip("=\t ")
    try:
        return float(s)
    except ValueError:
        import re
        m = re.search(r"-?[0-9]+\.?[0-9]*", s)
        return float(m.group()) if m else default


def _safe_int(val: Any, default: int = 0) -> int:
    """Parse env value to int; tolerate Railway formatting."""
    return int(_safe_float(val, float(default)))


# ===== runtime config: load once at boot, validate, use in run_bot =====
@dataclass
class BotConfig:
    """Runtime trading/config used in run_bot session. Loaded once at session start."""
    min_liq_usd: float
    max_book_age_ms: int
    min_warmup_sec: float
    sigma_min: float
    debounce_s: float
    min_time_to_expiry: float
    min_entry_tte_sec: float
    min_entry_price: float
    max_entry_price: float
    fee_buffer: float
    l1_poll_sec: float
    mom_lb_sec: float
    mom_entry_pct: float
    expiry_squeeze_tte: float
    squeeze_skew: float
    entry_cutoff_sec: float
    exit_min_liq: float
    exit_min_size: float
    exit_dust_threshold: float
    position_dust_eps: float
    exit_dust_recheck_sec: float
    exit_dust_log_interval_sec: float
    exit_min_notional_usd: float
    exit_max_book_share: float
    exit_max_slices: int
    exit_max_reconcile_retries: int
    reconcile_max_multiplier: float
    exec_edge_lag: float
    exec_edge_large: float
    exec_edge_squeeze: float
    fee_bps: float
    edge_sanity_bps: float
    spread_min_bps: float
    mom_threshold_pct: float
    entry_max_spread_bps: float
    entry_min_tte_sec: float
    exit_slice_delay_sec: float
    post_buy_exit_delay_sec: float
    limit_exit_timeout_sec: float
    limit_exit_enabled: bool


def _config_snapshot(cfg: BotConfig) -> str:
    """One-line summary for logs (no secrets)."""
    return (
        f"min_liq={cfg.min_liq_usd} debounce_s={cfg.debounce_s} mom_threshold_pct={cfg.mom_threshold_pct}"
        f" entry_max_spread_bps={cfg.entry_max_spread_bps} exit_max_slices={cfg.exit_max_slices}"
    )


def load_config() -> BotConfig:
    """Read all run_bot config from env once. Call at session start."""
    def fl(key: str, default: float) -> float:
        return _safe_float(os.getenv(key), default)
    def i(key: str, default: int) -> int:
        return _safe_int(os.getenv(key), default)
    _exit_liq_raw = os.getenv("EXIT_MIN_LIQ_USD") or os.getenv("MIN_LIQ_USD")
    exit_min_liq_val = _safe_float(_exit_liq_raw, 0.1)
    return BotConfig(
        min_liq_usd=fl("MIN_LIQ_USD", 0.1),
        max_book_age_ms=i("MAX_BOOK_AGE_MS", 1000),
        min_warmup_sec=fl("MIN_WARMUP_SEC", 0.0),
        sigma_min=fl("SIGMA_MIN", 0.0),
        debounce_s=fl("DEBOUNCE_SEC", 0.5),
        min_time_to_expiry=fl("MIN_TIME_TO_EXPIRY_SEC", 5.0),
        min_entry_tte_sec=fl("MIN_ENTRY_TTE_SEC", 60.0),
        min_entry_price=fl("MIN_ENTRY_PRICE", 0.05),
        max_entry_price=fl("MAX_ENTRY_PRICE", 0.95),
        fee_buffer=fl("FEE_BUFFER", 0.001),
        l1_poll_sec=fl("L1_POLL_SEC", 0.3),
        mom_lb_sec=fl("MOM_LB_SEC", 3.0),
        mom_entry_pct=fl("MOM_ENTRY_PCT", 0.0001),
        expiry_squeeze_tte=fl("EXPIRY_SQUEEZE_TTE_SEC", 60.0),
        squeeze_skew=fl("SQUEEZE_SKEW", 0.03),
        entry_cutoff_sec=fl("ENTRY_CUTOFF_SEC", 10.0),
        exit_min_liq=exit_min_liq_val,
        exit_min_size=fl("EXIT_MIN_SIZE", 5.0),
        exit_dust_threshold=fl("EXIT_DUST_THRESHOLD", 1.0),
        position_dust_eps=fl("POSITION_DUST_EPS", 0.0001),
        exit_dust_recheck_sec=fl("EXIT_DUST_RECHECK_SEC", 10.0),
        exit_dust_log_interval_sec=fl("EXIT_DUST_LOG_INTERVAL_SEC", 30.0),
        exit_min_notional_usd=fl("EXIT_MIN_NOTIONAL_USD", 1.0),
        exit_max_book_share=fl("EXIT_MAX_BOOK_SHARE", 0.35),
        exit_max_slices=_safe_int(os.getenv("MAX_EXIT_RETRIES") or os.getenv("EXIT_MAX_SLICES"), 2),
        exit_max_reconcile_retries=i("EXIT_MAX_RECONCILE_RETRIES", 3),
        reconcile_max_multiplier=fl("RECONCILE_MAX_MULTIPLIER", 3.0),
        exec_edge_lag=fl("EXEC_EDGE_LAG", 0.002),
        exec_edge_large=fl("EXEC_EDGE_LARGE", 0.004),
        exec_edge_squeeze=fl("EXEC_EDGE_SQUEEZE", 0.001),
        fee_bps=fl("FEE_BPS", 0.0),
        edge_sanity_bps=fl("EDGE_SANITY_BPS", 1000.0),
        spread_min_bps=fl("SPREAD_MIN_BPS", 0.0),
        mom_threshold_pct=fl("MOM_THRESHOLD_PCT", 0.0003),
        entry_max_spread_bps=fl("ENTRY_MAX_SPREAD_BPS", 150.0),
        entry_min_tte_sec=fl("ENTRY_MIN_TTE_SEC", 90.0),
        exit_slice_delay_sec=fl("EXIT_SLICE_DELAY_SEC", 1.0),
        post_buy_exit_delay_sec=fl("POST_BUY_EXIT_DELAY_SEC", 2.5),
        limit_exit_timeout_sec=fl("LIMIT_EXIT_TIMEOUT_SEC", 8.0),
        limit_exit_enabled=os.getenv("LIMIT_EXIT_ENABLED", "1") == "1",
    )


def validate_config(cfg: BotConfig) -> None:
    """Validate config; raise RuntimeError if mandatory fields invalid. Call at boot."""
    if cfg.min_liq_usd < 0 or cfg.max_book_age_ms <= 0:
        raise RuntimeError(f"Invalid config: min_liq_usd={cfg.min_liq_usd} max_book_age_ms={cfg.max_book_age_ms}")
    if cfg.min_entry_price < 0 or cfg.max_entry_price > 1 or cfg.min_entry_price >= cfg.max_entry_price:
        raise RuntimeError(f"Invalid config: min/max_entry_price={cfg.min_entry_price}/{cfg.max_entry_price}")
    if cfg.debounce_s < 0 or cfg.l1_poll_sec <= 0:
        raise RuntimeError(f"Invalid config: debounce_s={cfg.debounce_s} l1_poll_sec={cfg.l1_poll_sec}")
    if cfg.mom_threshold_pct <= 0 or cfg.entry_max_spread_bps < 0:
        raise RuntimeError(f"Invalid config: mom_threshold_pct={cfg.mom_threshold_pct} entry_max_spread_bps={cfg.entry_max_spread_bps}")
    if cfg.exit_max_slices < 1 or cfg.exit_min_notional_usd < 0:
        raise RuntimeError(f"Invalid config: exit_max_slices={cfg.exit_max_slices} exit_min_notional_usd={cfg.exit_min_notional_usd}")


# ===== optional Prometheus metrics (safe import) =====
PROM_ENABLED = os.getenv("PROM_ENABLED", "0") == "1"
PROM_PORT = _safe_int(os.getenv("PROM_PORT"), 9108)
_prom = None
if PROM_ENABLED:
    try:
        from prometheus_client import start_http_server, Counter, Gauge
        start_http_server(PROM_PORT)
        _prom = {
            "entry_attempts": Counter("bot_entry_attempts_total", "Entry attempts"),
            "entry_ok": Counter("bot_entry_ok_total", "Successful entries"),
            "rejects": Counter("bot_entry_rejects_total", "Entry rejects", ["reason"]),
            "pnl_total": Gauge("bot_pnl_total_usd", "Total net PnL (USD)"),
            "open_trades": Gauge("bot_open_trades", "Open trades"),
        }
        logging.info(f"[PROM] exporter up on :{PROM_PORT}")
    except Exception as e:
        _prom = None
        logging.warning(f"[PROM] disabled (import/start failed): {e}")

def prom_inc_reject(reason: str):
    if _prom:
        _prom["rejects"].labels(reason=reason).inc()

def prom_set_state(metrics, risk):
    if _prom:
        _prom["pnl_total"].set(float(getattr(metrics, "total_net", 0.0) or 0.0))
        _prom["open_trades"].set(float(getattr(risk, "open_trades", 0) or 0))

# ===== PROD: retry/backoff + order helpers =====
async def _call_with_retry(fn, *args, tries: int = 4, base_sleep: float = 0.35, max_sleep: float = 3.0, tag: str = ""):
    """Async retry around blocking SDK (via to_thread).

    ВАЖНО: использовать ТОЛЬКО для идемпотентных операций (get_order, cancel, create_order и т.п.).
    Для post_order используется отдельная логика в Executor, без слепых ретраев.
    """
    last = None
    for i in range(tries):
        try:
            return await asyncio.to_thread(fn, *args)
        except Exception as e:
            last = e
            sleep = min(max_sleep, base_sleep * (2 ** i)) * (0.85 + random.random() * 0.3)
            logging.warning(f"[RETRY]{'['+tag+']' if tag else ''} attempt={i+1}/{tries} err={e} sleep={sleep:.2f}s")
            await asyncio.sleep(sleep)
    raise last

def _extract_order_id(resp: Any) -> Optional[str]:
    if not resp:
        return None
    if isinstance(resp, dict):
        for k in ["order_id", "orderId", "id"]:
            if k in resp and resp[k]:
                return str(resp[k])
        od = resp.get("order") or resp.get("data")
        if isinstance(od, dict):
            for k in ["order_id", "orderId", "id"]:
                if k in od and od[k]:
                    return str(od[k])
    return None

def _extract_status(resp: Any) -> Optional[str]:
    if not resp:
        return None
    if isinstance(resp, dict):
        for k in ["status", "state"]:
            if k in resp and resp[k]:
                return str(resp[k]).lower()
        od = resp.get("order") or resp.get("data")
        if isinstance(od, dict):
            for k in ["status", "state"]:
                if k in od and od[k]:
                    return str(od[k]).lower()
    return None

def _floor_to_decimals(x: float, decimals: int) -> float:
    """Truncate to N decimal places (floor). Never round up — avoids 'not enough balance'."""
    try:
        d = int(decimals)
        if d < 0:
            d = 0
        if d == 0:
            return math.floor(float(x))
        mult = 10 ** d
        return math.floor(float(x) * mult) / mult
    except Exception:
        return float(x)


def _quantize_price(px: float) -> float:
    """Floor price to 2 decimals (exchange constraint)."""
    return _floor_to_decimals(float(px), 2)


def _quantize_usd(usd: float) -> float:
    """Floor USD to 2 decimals."""
    return _floor_to_decimals(float(usd), 2)


def _quantize_size(size: float, decimals: int = 0) -> float:
    """Floor size to N decimals (0 = integer size)."""
    return _floor_to_decimals(float(size), decimals)


def _parse_outcome_balance(result) -> float:
    """Parse outcome token balance from get_balance_allowance(CONDITIONAL). Returns size in human units."""
    raw = 0.0
    if isinstance(result, dict):
        for k in ["balance", "Balance", "size", "amount"]:
            if k in result and result[k] is not None:
                try:
                    raw = float(result[k])
                    break
                except (TypeError, ValueError):
                    pass
    elif isinstance(result, (tuple, list)) and len(result) >= 1 and result[0] is not None:
        raw = float(result[0])
    elif isinstance(result, (int, float)):
        raw = float(result)
    if raw >= 1e10:
        return raw / 1e6
    if raw >= 1e6:
        return raw / 1e6
    return raw


def _min_order_size() -> float:
    """Exchange minimum order size (tokens). Used for ORDER_GUARD on BUY/SELL."""
    return _safe_float(os.getenv("EXIT_MIN_SIZE"), 5.0)


def _is_size_tradeable(size: float) -> bool:
    """True if size is at least exchange minimum (avoids 'Size lower than the minimum' errors)."""
    return float(size) >= _min_order_size()


GAMMA = "https://gamma-api.polymarket.com"
POLY_MARKET_WS = "wss://ws-subscriptions-clob.polymarket.com/ws/market"
BINANCE_WS = "wss://stream.binance.com:9443/ws/btcusdt@trade"

# ---------- Logging ----------
def setup_logging(slug: str):
    import sys
    os.makedirs("logs", exist_ok=True)
    logfile = f"logs/{slug.replace('/', '_')}.log"
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    # FILE handler
    fh = logging.FileHandler(logfile)
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    # STDOUT handler (Railway logs)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(formatter)
    logger.addHandler(sh)
    # Suppress verbose HTTP request logs from httpx/httpcore
    for name in ("httpx", "httpcore", "urllib3"):
        logging.getLogger(name).setLevel(logging.WARNING)
    logging.info(f"Logging initialized -> {logfile}")

def now_s() -> float:
    return time.time()

# ===== STRAT: microstructure features =====
@dataclass
class Micro:
    mid: float
    spread: float
    spread_bps: float
    liq_usd_best: float
    vol_bps: float
    mom_bps: float
    book_age_ms: float

class FeatureStore:
    """Online metrics: mid history -> vol/mom."""
    def __init__(self, maxlen: int = 600):
        self.mid_hist: deque = deque(maxlen=maxlen)
        self.last_mid: Optional[float] = None

    def update_mid(self, ts: float, mid: float):
        if mid and mid > 0:
            self.mid_hist.append((ts, mid))
            self.last_mid = mid

    def vol_bps(self, lookback_sec: float = 30.0) -> float:
        if len(self.mid_hist) < 5:
            return 0.0
        ts_now = self.mid_hist[-1][0]
        vals = [m for (t, m) in self.mid_hist if (ts_now - t) <= lookback_sec]
        if len(vals) < 5:
            return 0.0
        rets = []
        for i in range(1, len(vals)):
            a, b = vals[i - 1], vals[i]
            if a > 0 and b > 0:
                rets.append(math.log(b / a))
        if len(rets) < 4:
            return 0.0
        mu = sum(rets) / len(rets)
        var = sum((r - mu) ** 2 for r in rets) / max(1, len(rets) - 1)
        st = math.sqrt(var)
        return abs(st) * 10000.0

    def mom_bps(self, lookback_sec: float = 8.0) -> float:
        if len(self.mid_hist) < 3:
            return 0.0
        ts_now = self.mid_hist[-1][0]
        old = None
        for (t, m) in reversed(self.mid_hist):
            if (ts_now - t) >= lookback_sec:
                old = m
                break
        if not old or old <= 0:
            return 0.0
        cur = self.mid_hist[-1][1]
        return ((cur - old) / old) * 10000.0

def build_micro(
    yes_bid: Optional[float], yes_ask: Optional[float],
    liq_yes_ask_usd: float, book_age_ms: float, feats: FeatureStore,
) -> Optional[Micro]:
    if not yes_bid or not yes_ask:
        return None
    mid = (yes_bid + yes_ask) / 2.0
    spread = max(0.0, yes_ask - yes_bid)
    spread_bps = (spread / mid) * 10000.0 if mid > 0 else 0.0
    vol_bps = feats.vol_bps(float(os.getenv("VOL_LB_SEC", "30")))
    mom_bps = feats.mom_bps(float(os.getenv("MOM_LB_SEC", "8")))
    return Micro(
        mid=mid,
        spread=spread,
        spread_bps=spread_bps,
        liq_usd_best=float(liq_yes_ask_usd or 0.0),
        vol_bps=float(vol_bps),
        mom_bps=float(mom_bps),
        book_age_ms=float(book_age_ms or 0.0),
    )

def regime_of(m: Micro) -> str:
    trend_mom = float(os.getenv("REGIME_TREND_MOM_BPS", "2.0"))
    chop_spread = float(os.getenv("REGIME_CHOP_SPREAD_BPS", "6"))
    if abs(m.mom_bps) >= trend_mom and m.vol_bps >= 1.0:
        return "trend"
    if m.spread_bps >= chop_spread:
        return "chop"
    return "normal"

def norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

# ---------- BTC feed + EWMA vol (v6: variance rate per second) ----------
class BTCFeed:
    def __init__(self):
        self.last = None
        self.ts_last = None
        self.start_ts = None  # first tick time (for warmup gate)
        self.prices = deque()  # (ts, price)

        self.drift_lookback = int(os.getenv("DRIFT_LOOKBACK_SEC", "120"))
        self.ewma_var_rate = None  # variance rate per second in log units
        self.ewma_alpha = float(os.getenv("EWMA_ALPHA", "0.06"))
        self.prev_price = None
        self.prev_ts = None

    def _trim(self, ts: float):
        min_ts = ts - self.drift_lookback - 5
        while self.prices and self.prices[0][0] < min_ts:
            self.prices.popleft()

    def update(self, ts: float, price: float):
        if self.start_ts is None:
            self.start_ts = ts
        self.last = price
        self.ts_last = ts
        self.prices.append((ts, price))
        self._trim(ts)

        if self.prev_price is not None and price > 0 and self.prev_price > 0:
            r = math.log(price / self.prev_price)
            dt = max(1e-3, ts - self.prev_ts)  # floor dt to avoid micro-bursts dominating
            r2_rate = (r * r) / dt  # variance rate per second

            if self.ewma_var_rate is None:
                self.ewma_var_rate = r2_rate
            else:
                a = self.ewma_alpha
                self.ewma_var_rate = (1 - a) * self.ewma_var_rate + a * r2_rate

        self.prev_price = price
        self.prev_ts = ts

    def sigma_per_sqrt_sec(self) -> float:
        if self.ewma_var_rate is None:
            return 0.0
        return math.sqrt(max(0.0, self.ewma_var_rate))

    def drift_per_sec(self) -> float:
        if self.ts_last is None or self.last is None:
            return 0.0
        target_ts = self.ts_last - self.drift_lookback
        p_then, t_then = None, None
        for t, p in reversed(self.prices):
            if t <= target_ts:
                p_then, t_then = p, t
                break
        if p_then is None or p_then <= 0:
            return 0.0
        dt = max(1e-3, self.ts_last - t_then)
        return math.log(self.last / p_then) / dt

    def move_pct(self, lookback_s: float) -> float:
        """BTC momentum: (last - price_then) / price_then over lookback_s."""
        if self.ts_last is None or self.last is None:
            return 0.0
        target = self.ts_last - lookback_s
        p_then = None
        for t, p in reversed(self.prices):
            if t <= target:
                p_then = p
                break
        if not p_then or p_then <= 0:
            return 0.0
        return (self.last - p_then) / p_then

# ---------- Gamma ----------
def _gamma_get_market_by_slug(slug: str) -> dict | None:
    r = requests.get(f"{GAMMA}/markets/slug/{slug}", timeout=(2, 5))
    if r.status_code == 200:
        return r.json()
    return None

def _round_down_5m(ts: int) -> int:
    return ts - (ts % 300)

def _round_down_window(ts: int, window_sec: int) -> int:
    return ts - (ts % window_sec) if window_sec > 0 else ts

def _resolve_btc_market_via_time(clob_client, window: str = "5m", lookback_min: int = 30, lookahead_min: int = 10) -> tuple[str, dict]:
    """
    Поиск текущего BTC up/down рынка по CLOB server time.
    window: 5m, 10m, 1h. Slug: btc-updown-5m-<ts>, btc-updown-10m-<ts>, btc-updown-1h-<ts>.
    """
    w = (window or "5m").strip().lower()
    window_sec = 300 if w == "5m" else (600 if w == "10m" else (3600 if w in ("1h", "60m") else 300))
    step_min = 5 if w == "5m" else (10 if w == "10m" else 60)
    prefix = f"btc-updown-{w}" if w != "60m" else "btc-updown-1h"

    print("BOOT: get_server_time...", flush=True)
    server_ts = int(clob_client.get_server_time())
    print(f"BOOT: server_time OK, trying Gamma slugs (window={w})...", flush=True)
    if server_ts > 1e12:
        server_ts = server_ts // 1000
    base = _round_down_window(server_ts, window_sec)

    offsets = []
    for m in range(0, max(lookback_min, lookahead_min) + 1, step_min):
        if m == 0:
            offsets.append(0)
        else:
            if m <= lookahead_min:
                offsets.append(+m)
            if m <= lookback_min:
                offsets.append(-m)

    tried = []
    for off_min in offsets:
        ts = base + off_min * 60
        slug = f"{prefix}-{ts}"
        tried.append(slug)
        if len(tried) == 1 or len(tried) % 5 == 0:
            print(f"BOOT: Gamma try #{len(tried)} {slug}", flush=True)
        mkt = _gamma_get_market_by_slug(slug)
        if len(tried) <= 3:
            print(f"BOOT: Gamma #{len(tried)} done found={mkt is not None}", flush=True)
        if mkt:
            logging.info(f"[RESOLVE] found btc {w} slug={slug} (server={server_ts}, base={base})")
            return slug, mkt

    raise RuntimeError(
        f"BTC {w} resolve failed. Tried {len(tried)} slugs. "
        "Set MARKET_SLUG or BTC_5M_SLUG manually from Polymarket URL."
    )

def fetch_market_by_slug(slug: str, clob_client=None) -> dict:
    resolved = slug.strip()
    if resolved in ("", "auto", "btc-5m", "btc-updown-5m", "btc-updown"):
        explicit = os.getenv("BTC_5M_SLUG", "").strip()
        if explicit:
            resolved = explicit
            r = requests.get(f"{GAMMA}/markets/slug/{resolved}", timeout=(3, 7))
            r.raise_for_status()
            return r.json()
        if not clob_client:
            raise RuntimeError("Need clob_client to resolve auto slug via server time.")
        w = os.getenv("MARKET_WINDOW", "5m").strip().lower()
        _, market = _resolve_btc_market_via_time(clob_client, window=w)
        return market

    r = requests.get(f"{GAMMA}/markets/slug/{resolved}", timeout=(3, 7))
    r.raise_for_status()
    return r.json()

def parse_expiry_ts(market: dict):
    candidates = [
        market.get("endDate"), market.get("end_date"),
        market.get("closeTime"), market.get("close_time"),
        market.get("expirationTime"), market.get("expiration_time"),
    ]
    for v in candidates:
        if not v:
            continue
        if isinstance(v, (int, float)):
            return float(v) / (1000.0 if v > 1e12 else 1.0)
        if isinstance(v, str):
            try:
                import datetime as dt
                s = v.replace("Z", "+00:00")
                return dt.datetime.fromisoformat(s).timestamp()
            except Exception:
                pass
    return None

def build_token_map(market: dict):
    raw_outcomes = market.get("outcomes")
    if not raw_outcomes:
        raise RuntimeError("Gamma payload has no 'outcomes' -> can't map tokens safely.")
    outcomes = json.loads(raw_outcomes) if isinstance(raw_outcomes, str) else raw_outcomes

    raw_ids = market.get("clobTokenIds") or market.get("clob_token_ids")
    if not raw_ids:
        raise RuntimeError("Gamma payload missing 'clobTokenIds'.")
    token_ids = json.loads(raw_ids) if isinstance(raw_ids, str) else raw_ids

    if len(token_ids) < len(outcomes):
        raise RuntimeError("Gamma payload: clobTokenIds shorter than outcomes.")
    token_map = {}
    for i, out in enumerate(outcomes):
        token_map[str(out).strip().lower()] = str(token_ids[i])
    return token_map

# ---------- Polymarket WS parsing (v6: best bid/ask, dropped count) ----------
def best_of(levels, side: str):
    """
    levels can be list[dict] or list[list].
    returns (price, size) best by side.
    """
    best = None
    for x in levels or []:
        try:
            if isinstance(x, dict):
                p = float(x.get("price"))
                s = float(x.get("size", 0))
            else:
                p = float(x[0])
                s = float(x[1])
            if s <= 0:
                continue
            if best is None:
                best = (p, s)
            else:
                if side == "bid" and p > best[0]:
                    best = (p, s)
                if side == "ask" and p < best[0]:
                    best = (p, s)
        except Exception:
            continue
    return best


def parse_book_msg(msg):
    if not isinstance(msg, dict):
        return None
    data = msg.get("data", msg)
    asset_id = data.get("asset_id") or data.get("token_id") or data.get("assetId")
    if not asset_id:
        return None

    bids = data.get("bids")
    asks = data.get("asks")
    top_bid = best_of(bids or [], "bid")
    top_ask = best_of(asks or [], "ask")

    # best_bid_ask event has best_bid/best_ask, no bids/asks arrays
    if top_bid is None and top_ask is None:
        bb = data.get("best_bid")
        ba = data.get("best_ask")
        if bb is not None or ba is not None:
            try:
                top_bid = (float(bb), 0.0) if bb else None
                top_ask = (float(ba), 0.0) if ba else None
            except (TypeError, ValueError):
                return None
        else:
            return None

    return str(asset_id), top_bid, top_ask

def parse_price_changes(msg: dict) -> list[tuple[str, tuple | None, tuple | None]]:
    """
    Parse price_changes event: {market, price_changes, timestamp, event_type}.
    Returns list of (asset_id, top_bid, top_ask).
    """
    if not isinstance(msg, dict):
        return []
    pc = msg.get("price_changes")
    if not pc:
        return []
    market = msg.get("market") or msg.get("data")
    if isinstance(market, str):
        market = {"asset_id": market}
    results = []
    for ch in (pc if isinstance(pc, list) else [pc]):
        if not isinstance(ch, dict):
            continue
        aid = ch.get("asset_id") or ch.get("token_id") or ch.get("assetId")
        if not aid:
            aid = (market or {}).get("asset_id") if isinstance(market, dict) else None
        if not aid:
            continue
        bid_p = ch.get("best_bid") or ch.get("bid") or ch.get("price")
        ask_p = ch.get("best_ask") or ch.get("ask")
        try:
            top_bid = (float(bid_p), 0.0) if bid_p is not None else None
            top_ask = (float(ask_p), 0.0) if ask_p is not None else None
        except (TypeError, ValueError):
            continue
        if top_bid or top_ask:
            results.append((str(aid), top_bid, top_ask))
    return results

def ask_liquidity_usd(top_ask):
    return float(top_ask[0] * top_ask[1]) if top_ask else 0.0

def bid_liquidity_usd(top_bid):
    return float(top_bid[0] * top_bid[1]) if top_bid else 0.0

# ---------- CLOB client ----------
def _normalize_private_key(raw: str) -> str:
    """Strip whitespace/quotes and keep only ASCII hex (avoids UnicodeEncodeError from Railway/env)."""
    if not raw:
        return raw
    s = raw.strip().strip('"\'\u201c\u201d\u2018\u2019')
    hex_only = "".join(c for c in s if c in "0123456789abcdefABCDEFx")
    if hex_only.lower().startswith("0x"):
        return hex_only
    if len(hex_only) == 64:
        return "0x" + hex_only
    return hex_only


def make_clob_client():
    print("BOOT: make_clob_client start", flush=True)
    host = os.getenv("POLY_CLOB_HOST", "https://clob.polymarket.com")
    pk_raw = os.getenv("POLY_PRIVATE_KEY")
    if not pk_raw:
        raise RuntimeError("POLY_PRIVATE_KEY missing")
    pk = _normalize_private_key(pk_raw)
    if not pk or len(pk) < 64:
        raise RuntimeError("POLY_PRIVATE_KEY invalid (need 64 hex chars, with or without 0x)")
    kwargs = {"host": host, "key": pk, "chain_id": POLYGON}
    funder = os.getenv("POLY_FUNDER")
    if funder:
        kwargs["funder"] = funder.strip()
    sig_type = os.getenv("POLY_SIGNATURE_TYPE")
    if sig_type is not None:
        kwargs["signature_type"] = int(sig_type)
    client = ClobClient(**kwargs)
    print("BOOT: create_or_derive_api_creds...", flush=True)
    creds = client.create_or_derive_api_creds()
    client.set_api_creds(creds)
    return client

# ---------- Strategy (v6: GBM-style mu - 0.5*sigma^2, honest edge with exec cost) ----------
class Strategy:
    def __init__(self, btc: BTCFeed):
        self.btc = btc
        self.k_drift = float(os.getenv("K_DRIFT", "0.6"))

    def prob_up(self, T: float, time_to_expiry_s: float | None) -> float:
        T = max(1.0, min(float(T), 300.0))
        sigma_raw = self.btc.sigma_per_sqrt_sec()
        sigma_min = float(os.getenv("SIGMA_MIN", "0.002"))
        sigma = max(sigma_raw, sigma_min)
        mu = self.btc.drift_per_sec() * self.k_drift

        if time_to_expiry_s is not None and time_to_expiry_s < 300:
            mu *= max(0.0, min(1.0, time_to_expiry_s / 300.0))

        denom = sigma * math.sqrt(T)
        if denom < 1e-9:
            return 0.5

        # GBM log-return: (mu - 0.5*sigma^2)T + sigma*sqrt(T)*Z
        drift_eff = (mu - 0.5 * sigma * sigma) * T
        z = (0.0 - drift_eff) / denom
        p_up = 1.0 - norm_cdf(z)
        return max(0.001, min(0.999, p_up))

    def edges(self, up_buy: float, dn_buy: float, up_mid: float, dn_mid: float,
              spread_up: float, spread_dn: float, T: float, tte: float | None,
              fee_buffer: float):
        """
        Honest edge: model prob minus market prob (mid) minus execution cost.
        execution_cost ~ spread/2 + fee_buffer.
        """
        p_up = self.prob_up(T, tte)
        p_dn = 1.0 - p_up

        exec_cost_up = max(0.0, spread_up / 2.0) + fee_buffer
        exec_cost_dn = max(0.0, spread_dn / 2.0) + fee_buffer

        edge_up = (p_up - up_mid) - exec_cost_up
        edge_dn = (p_dn - dn_mid) - exec_cost_dn

        return {
            "p_up_model": p_up,
            "p_dn_model": p_dn,
            "edge_up": edge_up,
            "edge_dn": edge_dn,
            "exec_cost_up": exec_cost_up,
            "exec_cost_dn": exec_cost_dn,
        }

# ---------- Trade ledger (v6: entry/exit notional + fees, net PnL; partial exit) ----------
class TradeLedger:
    def __init__(self):
        self.entry_px = None
        self.entry_fee = 0.0
        self.exit_px = None
        self.exit_fee = 0.0
        self.size = 0.0
        self.realized_pnl = 0.0  # cumulative from partial exits

    def open(self, entry_px: float, size: float, entry_fee: float = 0.0):
        self.entry_px = float(entry_px)
        self.size = float(size)
        self.entry_fee = float(entry_fee or 0.0)
        self.exit_px = None
        self.exit_fee = 0.0
        self.realized_pnl = 0.0

    def partial_close(self, filled_size: float, exit_px: float, exit_fee: float = 0.0):
        """On partial SELL: reduce size and accumulate realized PnL. Keeps posm/ledger in sync."""
        if self.entry_px is None or filled_size <= 0:
            return
        filled_size = min(filled_size, self.size)
        self.realized_pnl += (exit_px - self.entry_px) * filled_size - float(exit_fee or 0.0)
        self.size = max(0.0, self.size - filled_size)
        self.exit_fee += float(exit_fee or 0.0)

    def close(self, exit_px: float, exit_fee: float = 0.0):
        """Final close (remaining size). exit_fee is for this slice only."""
        self.exit_px = float(exit_px)
        self.exit_fee += float(exit_fee or 0.0)

    def gross_pnl(self):
        if self.entry_px is None:
            return self.realized_pnl
        if self.exit_px is None:
            return self.realized_pnl
        return self.realized_pnl + (self.exit_px - self.entry_px) * self.size

    def net_pnl(self):
        return self.gross_pnl() - self.entry_fee - self.exit_fee

    def entry_notional(self):
        return (self.entry_px or 0.0) * self.size

    def exit_notional(self):
        return (self.exit_px or 0.0) * self.size

    @property
    def notional(self) -> float:
        """Approximate notional for reward scaling (entry + exit)/2 or entry."""
        en = (self.entry_px or 0.0) * self.size
        ex = (self.exit_px or 0.0) * self.size
        return (en + ex) / 2.0 if (en and ex) else en


# ---------- Metrics (prod: circuit + health) ----------
class Metrics:
    def __init__(self):
        self.trades = 0
        self.wins = 0
        self.losses = 0
        self.total_net = 0.0
        self.consec_losses = 0
        self.last_print_ts = 0.0
        self.entry_attempts = 0
        self.entry_ok = 0
        self.entry_reasons = {}  # reason -> count
        self.entry_by_type: dict = {}  # arb, mm, lag, squeeze, simple_mom
        self.pnl_by_type: dict = {}  # PnL per strategy (updated on close)
        # per-market entry cap (reset when market/window changes)
        self.current_condition_id: Optional[str] = None
        self.entries_this_market: int = 0
        # why we skipped entry path (before try_entry_lag_arb) for HEALTH when entry_attempts=0
        self.last_skip_reason: str = ""
        self.last_skip_ts: float = 0.0

    def set_skip_reason(self, reason: str):
        self.last_skip_reason = reason
        self.last_skip_ts = now_s()

    def reset_market_entries(self, condition_id: Optional[str]):
        if not condition_id:
            return
        if condition_id != self.current_condition_id:
            self.current_condition_id = condition_id
            self.entries_this_market = 0

    def can_enter_market(self, max_entries: int) -> bool:
        return self.entries_this_market < max_entries

    def record_market_entry(self):
        self.entries_this_market += 1

    def record_entry_type(self, t: str):
        self.entry_by_type[t] = self.entry_by_type.get(t, 0) + 1

    def add_reason(self, reason: str):
        self.entry_reasons[reason] = self.entry_reasons.get(reason, 0) + 1
        prom_inc_reject(reason)

    def add_closed_trade(self, ledger: TradeLedger, entry_type: Optional[str] = None):
        self.trades += 1
        net = ledger.net_pnl()
        self.total_net += net
        if entry_type is not None:
            self.pnl_by_type[entry_type] = self.pnl_by_type.get(entry_type, 0.0) + net
        if net > 0:
            self.wins += 1
            self.consec_losses = 0
        else:
            self.losses += 1
            self.consec_losses += 1
        win_rate = self.wins / self.trades if self.trades else 0.0
        by_type = " ".join([f"{k}={v}" for k, v in sorted(self.entry_by_type.items())]) if self.entry_by_type else ""
        pnl_by = " ".join([f"{k}=${v:.2f}" for k, v in sorted(self.pnl_by_type.items())]) if self.pnl_by_type else ""
        logging.info(
            f"[METRICS] trades={self.trades} win%={win_rate:.1%} "
            f"net=${net:.2f} total=${self.total_net:.2f} consec_losses={self.consec_losses}"
            + (f" entry_by={by_type}" if by_type else "")
            + (f" pnl_by={pnl_by}" if pnl_by else "")
        )

    def maybe_print_health(self, every_sec: float = 60.0, risk=None, posm=None, ledger=None):
        if (now_s() - self.last_print_ts) < every_sec:
            return
        self.last_print_ts = now_s()
        top = sorted(self.entry_reasons.items(), key=lambda x: x[1], reverse=True)[:6]
        top_s = ", ".join([f"{k}={v}" for k, v in top]) if top else "-"
        by_type = " ".join([f"{k}={v}" for k, v in sorted(self.entry_by_type.items())]) if self.entry_by_type else ""
        pnl_by = " ".join([f"{k}=${v:.2f}" for k, v in sorted(self.pnl_by_type.items())]) if self.pnl_by_type else ""
        skip_info = ""
        if self.entry_attempts == 0 and self.last_skip_reason:
            skip_info = f" (no attempts, last_skip={self.last_skip_reason})"
        state_extra = ""
        if risk is not None and posm is not None:
            pending = getattr(risk, "_entry_in_flight", False)
            state_extra = f" entry_pending={pending} pos_open={posm.has_pos()}"
            if ledger is not None:
                ledger_sz = getattr(ledger, "size", 0) or 0
                local_sz = getattr(posm, "size", 0) or 0
                state_desync = abs(local_sz - ledger_sz) > 1e-6 if (local_sz > 0 or ledger_sz > 0) else False
                state_extra += f" ledger_size={ledger_sz:.4f} local_pos_size={local_sz:.4f} state_desync={state_desync}"
        paused_balance = False
        avail_s = need_s = resume_s = ""
        if risk is not None:
            blocked_until = getattr(risk, "balance_blocked_until", 0.0) or 0.0
            if blocked_until > 0 and now_s() < blocked_until:
                paused_balance = True
                avail_s = f" avail={getattr(risk, '_cached_usdc', 0):.2f}"
                need_s = f" need={getattr(risk, 'max_usd_per_trade', 0):.2f}"
                resume_s = f" resume_in={max(0, blocked_until - now_s()):.0f}s"
        bal_extra = f" paused_balance={paused_balance}{avail_s}{need_s}{resume_s}" if risk is not None else ""
        exit_extra = ""
        if risk is not None:
            ex_in = getattr(risk, "exit_in_progress", False)
            ex_pend = getattr(risk, "exit_pending_reconcile", False)
            ex_block = getattr(risk, "exit_settlement_block_until", 0.0) or 0.0
            now = now_s()
            settlement_s = f" settlement_resume_in={max(0, ex_block - now):.0f}s" if ex_pend and now < ex_block else ""
            post_loss_ts = getattr(risk, "last_close_ts", 0) or 0
            post_loss_sec = getattr(risk, "post_loss_reentry_cooldown_sec", 20) or 20
            post_loss_in = max(0, post_loss_ts + post_loss_sec - now) if post_loss_ts and risk.last_close_pnl is not None and risk.last_close_pnl < 0 else 0
            post_loss_s = f" post_loss_cooldown_in={post_loss_in:.0f}s" if post_loss_in > 0 else ""
            rec_actual = getattr(risk, "last_reconcile_actual", None)
            rec_status = getattr(risk, "last_reconcile_status", None) or "-"
            rec_s = f" last_reconcile_actual={rec_actual}" if rec_actual is not None else ""
            rec_st_s = f" last_reconcile_status={rec_status}" if rec_status else ""
            exit_extra = f" exit_pending={ex_pend} exit_in_progress={ex_in}{settlement_s}{post_loss_s}{rec_s}{rec_st_s}"
            am_slug = getattr(risk, "active_market_slug", None)
            am_side = getattr(risk, "active_market_side", None)
            am_entries = getattr(risk, "active_market_entry_count", 0)
            am_notional = getattr(risk, "active_market_notional", 0.0)
            reentry_block = getattr(risk, "market_reentry_block_until", 0.0) or 0.0
            reentry_resume = max(0, reentry_block - now) if reentry_block > 0 else None
            reentry_s = f" market_reentry_resume_in={reentry_resume:.0f}s" if reentry_resume is not None and reentry_resume > 0 else ""
            last_block = getattr(risk, "_last_can_trade_block_reason", None)
            blocked_same = last_block in ("same_market_position_open", "same_market_reentry_block", "market_entry_cap")
            exit_bd = getattr(risk, "exit_blocked_dust", False)
            exit_br = getattr(risk, "exit_blocked_reason", "") or "-"
            exit_bsz = getattr(risk, "exit_blocked_size", 0) or 0
            last_exit_slug = getattr(risk, "last_exit_market_slug", None) or "-"
            market_extra = (f" active_market_slug={am_slug}" if am_slug else "") + (f" active_market_side={am_side}" if am_side else "") + f" active_market_entries={am_entries} active_market_notional={am_notional:.2f}{reentry_s} blocked_same_market={blocked_same}"
            market_extra += f" exit_blocked_dust={exit_bd} exit_blocked_reason={exit_br} exit_blocked_size={exit_bsz:.4f} last_exit_market_slug={last_exit_slug}"
            exit_extra = exit_extra + " " + market_extra
        logging.info(
            f"[HEALTH] entry_attempts={self.entry_attempts} entry_ok={self.entry_ok}"
            f"{bal_extra}{exit_extra} reasons_top={top_s}{skip_info}{state_extra}" + (f" entry_by={by_type}" if by_type else "") + (f" pnl_by={pnl_by}" if pnl_by else "")
        )

# ---------- Risk: balance + allowance + circuit breaker ----------
class Risk:
    def __init__(self, client: ClobClient, metrics: Metrics):
        self.client = client
        self.metrics = metrics
        self.max_usd_per_trade = _safe_float(os.getenv("MAX_USD_PER_TRADE"), 10.0)
        self.max_open_trades = _safe_int(os.getenv("MAX_OPEN_TRADES"), 1)
        self.open_trades = 0
        self._entry_in_flight = False  # guard: block new entry until current attempt completes

        self.session_loss_limit = _safe_float(os.getenv("SESSION_LOSS_LIMIT_USD"), 25.0)
        self.max_consec_losses = _safe_int(os.getenv("MAX_CONSEC_LOSSES"), 4)
        self.cooldown_sec = _safe_int(os.getenv("COOLDOWN_SEC"), 300)
        self._cooldown_until = 0.0

        self._cache_ttl = _safe_float(os.getenv("BAL_CACHE_TTL"), 30.0)
        self._cached_usdc = 0.0
        self._cached_allow = 0.0
        self._last_check = 0.0
        self._lock = asyncio.Lock()
        self._allow_warned = False
        self._balance_at_ambiguous: Optional[float] = None  # for orphan detection after ambiguous submit
        self._ambiguous_balance_check_ts = 0.0  # last time we polled balance during ambiguous cooldown (early clear)
        self.balance_blocked_until = 0.0
        self.last_balance_warn_ts = 0.0
        self.balance_low_cooldown_sec = _safe_float(os.getenv("BALANCE_LOW_COOLDOWN_SEC"), 20.0)
        self.balance_low_warn_interval_sec = _safe_float(os.getenv("BALANCE_LOW_WARN_INTERVAL_SEC"), 30.0)
        self.exit_settlement_grace_sec = _safe_float(os.getenv("EXIT_SETTLEMENT_GRACE_SEC"), 2.0)
        self.post_loss_reentry_cooldown_sec = _safe_float(os.getenv("POST_LOSS_REENTRY_COOLDOWN_SEC"), 20.0)
        self.exit_in_progress = False
        self.exit_pending_reconcile = False
        self.exit_started_ts = 0.0
        self.exit_settlement_block_until = 0.0
        self.last_reconcile_actual: Optional[float] = None
        self.last_reconcile_status: Optional[str] = None
        self.last_close_token: Optional[str] = None
        self.last_close_ts = 0.0
        self.last_close_pnl: Optional[float] = None
        # one position per market slug: block re-entry until slug changes or cooldown
        self.active_market_slug: Optional[str] = None
        self.active_market_side: Optional[str] = None
        self.active_market_entry_count = 0
        self.active_market_notional = 0.0
        self.market_reentry_block_until = 0.0
        self.last_entry_market_slug: Optional[str] = None
        self.last_entry_ts = 0.0
        self.last_exit_market_slug: Optional[str] = None
        self.last_exit_ts = 0.0
        self._same_market_guard_log_ts = 0.0
        self._last_can_trade_block_reason: Optional[str] = None
        self.exit_blocked_dust = False
        self.exit_blocked_reason = ""
        self.exit_blocked_ts = 0.0
        self.exit_blocked_size = 0.0
        # ссылка на PositionManager выставляется из run_bot
        self.posm: Optional[PositionManager] = None

    def invalidate_balance_cache(self) -> None:
        """Force next can_trade/refresh_balance to fetch fresh balance (call after any order submit/fill)."""
        self._last_check = 0.0

    async def capture_balance_at_ambiguous(self) -> None:
        """Call after marking ambiguous; used to detect orphan position when cooldown clears."""
        await self.refresh_balance()
        self._balance_at_ambiguous = self._cached_usdc

    def on_open(self):
        self.open_trades += 1

    def on_close(self):
        self.open_trades = max(0, self.open_trades - 1)

    def on_market_entry(self, slug: str, side: str, notional_usd: float) -> None:
        """Call after a confirmed entry fill. Sets active market state (one position per slug)."""
        self.active_market_slug = slug
        self.active_market_side = side
        self.active_market_entry_count = 1
        self.active_market_notional = notional_usd
        self.last_entry_market_slug = slug
        self.last_entry_ts = now_s()
        logging.info(
            "[MARKET_STATE] open slug=%s side=%s entries=1 notional=%.2f",
            slug[:24] + "..." if len(slug) > 24 else slug, side, notional_usd,
        )

    def on_market_exit(self, slug: str, pnl: Optional[float] = None, forced: bool = False, reason: str = "") -> None:
        """Call after position closed (or force-clear). Sets last_exit_*, reentry block, clears active_*."""
        self.exit_in_progress = False
        self.exit_pending_reconcile = False
        self.exit_blocked_dust = False
        self.exit_blocked_reason = ""
        self.last_exit_market_slug = slug
        self.last_exit_ts = now_s()
        reentry_mode = (os.getenv("SAME_MARKET_REENTRY_MODE", "until_new_slug") or "until_new_slug").strip().lower()
        if reentry_mode == "cooldown":
            self.market_reentry_block_until = now_s() + _safe_float(os.getenv("SAME_MARKET_REENTRY_COOLDOWN_SEC"), 999999.0)
        else:
            self.market_reentry_block_until = 0.0
        if forced:
            logging.info(
                "[MARKET_STATE] force-closed slug=%s reason=%s",
                slug[:24] + "..." if len(slug) > 24 else slug, reason or "forced",
            )
        else:
            logging.info(
                "[MARKET_STATE] closed slug=%s pnl=%s reentry_block_until=%s",
                slug[:24] + "..." if len(slug) > 24 else slug,
                f"{pnl:.2f}" if pnl is not None else "-",
                "cooldown" if reentry_mode == "cooldown" else "until_new_slug",
            )
        self.active_market_slug = None
        self.active_market_side = None
        self.active_market_entry_count = 0
        self.active_market_notional = 0.0

    def on_trade_closed(self, net_pnl: float):
        if self.metrics.total_net <= -abs(self.session_loss_limit):
            self._cooldown_until = now_s() + self.cooldown_sec
            logging.error(f"[CIRCUIT] session_loss_limit hit: total=${self.metrics.total_net:.2f} cooldown={self.cooldown_sec}s")
        if self.metrics.consec_losses >= self.max_consec_losses:
            self._cooldown_until = now_s() + self.cooldown_sec
            logging.error(f"[CIRCUIT] consec_losses hit: n={self.metrics.consec_losses} cooldown={self.cooldown_sec}s")

    def _parse_usdc(self, result) -> float:
        raw = 0.0
        if isinstance(result, (tuple, list)) and len(result) >= 1:
            raw = float(result[0]) if result[0] is not None else 0.0
        elif isinstance(result, dict):
            for k in ["USDC", "usdc", "balance"]:
                if k in result and result[k] is not None:
                    raw = float(result[k])
                    break
        elif isinstance(result, (int, float)):
            raw = float(result)
        return raw / 1e6 if raw else 0.0

    def _parse_allowance(self, result) -> float:
        raw = 0.0

        # Tuple/list format: (balance, allowance, ...)
        if isinstance(result, (tuple, list)) and len(result) >= 2:
            raw = float(result[1]) if result[1] is not None else 0.0

        # Dict formats from py_clob_client / API
        elif isinstance(result, dict):
            # Simple / legacy formats
            for k in ["allowance", "ALLOWANCE", "approved"]:
                if k in result and result[k] is not None:
                    raw = float(result[k])
                    break

            # New format: "allowances": {spender: amount}
            if not raw and "allowances" in result and isinstance(result["allowances"], dict):
                allowances = result["allowances"]

                # Known Polymarket CTF Exchange / relay spender (lowercased for comparison)
                target_spender = "0x4bfb41d5b3570defd03c39a9a4d8de6bd8b8982e"
                for spender, value in allowances.items():
                    try:
                        if spender and isinstance(spender, str) and spender.lower() == target_spender:
                            if value is not None:
                                raw = float(value)
                                break
                    except Exception:
                        continue

                # Fallback: take maximum allowance across all spenders
                if not raw and allowances:
                    try:
                        raw = max(float(v) for v in allowances.values() if v is not None)
                    except Exception:
                        raw = 0.0

        # Raw numeric
        elif isinstance(result, (int, float)):
            raw = float(result)

        # Allowance is in 6‑decimals USDC units
        return raw / 1e6 if raw else 0.0

    async def refresh_balance(self) -> Tuple[float, float]:
        async with self._lock:
            if (now_s() - self._last_check) < self._cache_ttl:
                return self._cached_usdc, self._cached_allow
            params = BalanceAllowanceParams(asset_type=AssetType.COLLATERAL)
            try:
                result = await _call_with_retry(
                    self.client.get_balance_allowance, params, tag="get_balance_allowance"
                )
                if os.getenv("DEBUG_BAL_RAW", "0") == "1":
                    logging.info(f"[BAL_RAW] {result!r} type={type(result).__name__}")
                self._cached_usdc = self._parse_usdc(result)
                self._cached_allow = self._parse_allowance(result)
                self._last_check = now_s()
                logging.info(f"[BAL] USDC={self._cached_usdc:.2f} ALLOW={self._cached_allow:.2f}")
                return self._cached_usdc, self._cached_allow
            except Exception as e:
                logging.warning(f"[BAL] fetch failed: {e}")
                return self._cached_usdc, self._cached_allow

    async def background_updater(self, stop_evt: asyncio.Event):
        while not stop_evt.is_set():
            await self.refresh_balance()
            try:
                await asyncio.wait_for(stop_evt.wait(), timeout=self._cache_ttl)
            except asyncio.TimeoutError:
                pass

    async def can_trade(self, current_market_slug: Optional[str] = None) -> Tuple[bool, str]:
        if self._entry_in_flight:
            return False, "entry_pending"
        now = now_s()
        if self.exit_in_progress:
            return False, "exit_pending"
        if self.exit_pending_reconcile and now < self.exit_settlement_block_until:
            return False, "exit_pending"
        # same-market guard: at most one active position per market slug; no re-entry until new slug or cooldown
        if current_market_slug:
            max_entries_per_market = _safe_int(os.getenv("MAX_ENTRIES_PER_MARKET"), 1)
            max_notional_per_market = _safe_float(os.getenv("MAX_NOTIONAL_PER_MARKET_USD"), self.max_usd_per_trade)
            reentry_mode = (os.getenv("SAME_MARKET_REENTRY_MODE", "until_new_slug") or "until_new_slug").strip().lower()
            log_interval = _safe_float(os.getenv("SAME_MARKET_GUARD_LOG_INTERVAL_SEC"), 30.0)
            should_log = (now - self._same_market_guard_log_ts) >= log_interval
            if self.active_market_slug and current_market_slug == self.active_market_slug:
                if self.active_market_entry_count >= max_entries_per_market or self.active_market_notional >= max_notional_per_market:
                    if should_log:
                        self._same_market_guard_log_ts = now
                        logging.info(
                            "[ENTRY_GUARD] blocked: market entry cap reached slug=%s entries=%s notional=%.2f",
                            current_market_slug[:24] + "..." if len(current_market_slug) > 24 else current_market_slug,
                            self.active_market_entry_count, self.active_market_notional,
                        )
                    self._last_can_trade_block_reason = "market_entry_cap"
                    return False, "market_entry_cap"
                if should_log:
                    self._same_market_guard_log_ts = now
                    logging.info("[ENTRY_GUARD] blocked: same market position already open slug=%s", current_market_slug[:24] + "..." if len(current_market_slug) > 24 else current_market_slug)
                self._last_can_trade_block_reason = "same_market_position_open"
                return False, "same_market_position_open"
            if self.last_exit_market_slug and current_market_slug == self.last_exit_market_slug:
                blocked = False
                if reentry_mode == "until_new_slug":
                    blocked = True
                elif reentry_mode == "cooldown" and now < self.market_reentry_block_until:
                    blocked = True
                if blocked:
                    resume_in = max(0, self.market_reentry_block_until - now) if reentry_mode == "cooldown" else None
                    if should_log:
                        self._same_market_guard_log_ts = now
                        logging.info(
                            "[ENTRY_GUARD] blocked: same market re-entry disabled slug=%s resume_in=%ss",
                            current_market_slug[:24] + "..." if len(current_market_slug) > 24 else current_market_slug,
                            f"{resume_in:.0f}" if resume_in is not None else "until_new_slug",
                        )
                    self._last_can_trade_block_reason = "same_market_reentry_block"
                    return False, "same_market_reentry_block"
        # если submission state неоднозначен, блокируем новые входы на короткий период
        if self.posm is not None and self.posm.entry_state_uncertain:
            ambiguous_cooldown = _safe_float(os.getenv("AMBIGUOUS_COOLDOWN_SEC"), 60.0)
            ambiguous_poll_interval = _safe_float(os.getenv("AMBIGUOUS_BALANCE_POLL_INTERVAL_SEC"), 15.0)
            now_amb = now_s()
            within_cooldown = (now_amb - self.posm.entry_state_ts) < ambiguous_cooldown
            if within_cooldown:
                # During cooldown: periodically poll balance to clear ambiguous early if order actually filled
                if (now_amb - self._ambiguous_balance_check_ts) >= ambiguous_poll_interval:
                    self._ambiguous_balance_check_ts = now_amb
                    bal, _ = await self.refresh_balance()
                    drop_threshold = 0.70 * self.max_usd_per_trade
                    if self._balance_at_ambiguous is not None and bal < self._balance_at_ambiguous - drop_threshold:
                        logging.info(
                            "[GUARD] ambiguous state reconciled by balance drop (early poll) -> likely filled (%.2f -> %.2f)",
                            self._balance_at_ambiguous, bal,
                        )
                        self._balance_at_ambiguous = None
                        self.posm.clear_ambiguous()
                        # fall through — allow trade
                    else:
                        return False, "ambiguous_state"
                else:
                    return False, "ambiguous_state"
                # if we fell through (early clear), continue to rest of can_trade
            else:
                # cooldown прошёл — проверяем: если баланс упал на 70%+ от размера сделки, считаем ордер исполненным
                bal, _ = await self.refresh_balance()
                drop_threshold = 0.70 * self.max_usd_per_trade
                if self._balance_at_ambiguous is not None and bal < self._balance_at_ambiguous - drop_threshold:
                    logging.info(
                        "[GUARD] ambiguous state reconciled by balance drop -> likely filled (%.2f -> %.2f)",
                        self._balance_at_ambiguous, bal,
                    )
                    self._balance_at_ambiguous = None
                    self.posm.clear_ambiguous()
                else:
                    if self._balance_at_ambiguous is not None:
                        logging.info(
                            "[GUARD] cooldown expired, balance unchanged (%.2f) -> order likely failed, entries unblocked",
                            bal,
                        )
                    self._balance_at_ambiguous = None
                    self.posm.clear_ambiguous()

        if now_s() < self._cooldown_until:
            return False, "cooldown"
        # After cooldown expired: reset consec_losses so bot can trade again
        if self.metrics.consec_losses >= self.max_consec_losses:
            self.metrics.consec_losses = 0
            logging.info("[CIRCUIT] cooldown done, reset consec_losses -> allow trading")
        if self.open_trades >= self.max_open_trades:
            return False, "max_open_trades"
        if self.metrics.total_net <= -abs(self.session_loss_limit):
            return False, "session_loss_limit"

        now = now_s()
        required_usd = self.max_usd_per_trade
        if self.balance_blocked_until > 0:
            if now < self.balance_blocked_until:
                if (now - self.last_balance_warn_ts) >= self.balance_low_warn_interval_sec:
                    self.last_balance_warn_ts = now
                    logging.info(
                        "[BAL_GUARD] still blocked avail=%.2f need=%.2f resume_in=%.0fs",
                        self._cached_usdc, required_usd, self.balance_blocked_until - now,
                    )
                return False, "balance_low"
            cooldown_expired = True
        else:
            cooldown_expired = False

        bal, allow = await self.refresh_balance()
        if (now_s() - self._last_check) > self._cache_ttl * 2:
            return False, "balance_unknown"
        logging.debug(f"[BAL_PRECHECK] total={bal:.2f} trade_size={required_usd:.2f} open_trades={self.open_trades}")

        if bal < required_usd:
            if cooldown_expired:
                self.balance_blocked_until = now_s() + self.balance_low_cooldown_sec
                if (now_s() - self.last_balance_warn_ts) >= self.balance_low_warn_interval_sec:
                    self.last_balance_warn_ts = now_s()
                    logging.info(
                        "[BAL_GUARD] still blocked avail=%.2f need=%.2f cooldown=%.0fs",
                        bal, required_usd, self.balance_low_cooldown_sec,
                    )
            else:
                self.balance_blocked_until = now_s() + self.balance_low_cooldown_sec
                self.last_balance_warn_ts = now_s()
                logging.info(
                    "[BAL_GUARD] enter low balance pause avail=%.2f need=%.2f cooldown=%.0fs",
                    bal, required_usd, self.balance_low_cooldown_sec,
                )
            return False, "balance_low"

        if self.balance_blocked_until > 0:
            self.balance_blocked_until = 0.0
            logging.info("[BAL_GUARD] recovered avail=%.2f need=%.2f resuming entries", bal, required_usd)
        dry = os.getenv("DRY_RUN", "1") == "1"
        require_allowance = os.getenv("REQUIRE_ALLOWANCE", "0") == "1"
        # In DRY_RUN allowance must not block paper trades; Polymarket wallet uses signed orders
        if (not dry) and require_allowance:
            if allow < self.max_usd_per_trade:
                logging.warning(f"[ALLOW] insufficient {allow:.2f} < trade_size {self.max_usd_per_trade:.2f}")
                return False, "allowance_low"
        if allow < self.max_usd_per_trade:
            logging.info(f"[ALLOW] soft-check only: {allow:.2f} < trade_size {self.max_usd_per_trade:.2f}")
            # Still warn loudly once for LIVE runs: many wallets require an ERC20 approve once.
            if (not dry) and (not self._allow_warned) and os.getenv("ALLOW_WARN_ONCE", "1") == "1":
                self._allow_warned = True
                logging.error(
                    "[ALLOW] allowance < trade_size in LIVE. If entries never happen, you likely need to approve USDC spending "
                    "(set allowance) for Polymarket CLOB. This bot uses py_clob_client which may not expose an approve method; "
                    "do the approve once in your wallet / official UI, or set REQUIRE_ALLOWANCE=1 to hard-block trading until it's fixed."
                )
        self._last_can_trade_block_reason = None
        return True, "ok"

# ---------- Position & Execution ----------
class PositionManager:
    def __init__(self):
        self.pos_token = None
        self.size = 0.0
        self.entry_price = 0.0
        self.open_ts = None
        self.closing = False
        self._force_exit_reason = None
        # когда есть сомнения в состоянии (ambiguous submit / orphan pos), блокируем новые входы до reconcile
        self.entry_state_uncertain = False
        self.entry_state_reason = ""
        self.entry_state_ts = 0.0

        self.hold_max_s = _safe_int(os.getenv("HOLD_MAX_SEC"), 35)
        self.take_profit_pct = _safe_float(os.getenv("TAKE_PROFIT_PCT"), 0.12)
        self.stop_loss_pct = _safe_float(os.getenv("STOP_LOSS_PCT"), 0.12)

    def yes_usd_exposure(self, yes_token_id: str, mid: float) -> float:
        if not self.has_pos() or not mid or mid <= 0:
            return 0.0
        if self.pos_token == yes_token_id:
            return self.size * mid
        return 0.0

    def side_vs_yes(self, yes_token_id: str) -> str:
        if not self.has_pos():
            return ""
        return "LONG_YES" if self.pos_token == yes_token_id else "LONG_NO"

    def has_pos(self):
        return self.pos_token is not None and self.size > 0

    def open(self, token_id: str, size: float, entry_price: float, entry_type: Optional[str] = None):
        self.pos_token = token_id
        self.size = float(size)
        self.entry_price = float(entry_price)
        self.open_ts = now_s()
        self.closing = False
        self.entry_type = entry_type  # arb, mm, lag, squeeze, simple_mom (for PnL by strategy)

    def clear(self):
        self.pos_token, self.size, self.entry_price, self.open_ts, self.closing = None, 0.0, 0.0, None, False
        self.entry_type = None
        self._force_exit_reason = None

    def mark_ambiguous(self, reason: str):
        self.entry_state_uncertain = True
        self.entry_state_reason = reason
        self.entry_state_ts = now_s()
        logging.warning(f"[GUARD] entries blocked: submission state uncertain reason={reason}")

    def clear_ambiguous(self):
        if self.entry_state_uncertain:
            logging.info("[GUARD] submission state reconciled, entries unblocked")
        self.entry_state_uncertain = False
        self.entry_state_reason = ""
        self.entry_state_ts = 0.0

    def should_exit_time(self):
        return self.has_pos() and self.open_ts is not None and (now_s() - self.open_ts) >= self.hold_max_s

    def should_exit_price(self, current_bid: float):
        if not self.has_pos() or self.entry_price <= 0:
            return False
        pnl_pct = (float(current_bid) - self.entry_price) / self.entry_price
        if pnl_pct >= self.take_profit_pct:
            return True
        if pnl_pct <= -self.stop_loss_pct:
            return True
        return False

def _extract_fill(resp: dict, side=None):
    """Extract filled size (outcome tokens), avg price, fee. For post_order: pass side=SELL_SIDE for sells."""
    if not resp or not isinstance(resp, dict):
        return 0.0, None, None

    # fee extraction best-effort
    fee = None
    for fk in ["fee", "fees", "taker_fee", "maker_fee"]:
        if fk in resp:
            try:
                fee = float(resp[fk])
                break
            except Exception:
                pass

    for k in ["filled_size", "filledSize", "filledQuantity", "filled_qty"]:
        if k in resp:
            try:
                px = float(resp.get("avg_price") or resp.get("avgPrice") or resp.get("price") or 0) or None
                return float(resp[k]), px, fee
            except Exception:
                pass

    order = resp.get("order") or resp.get("data") or {}
    if isinstance(order, dict):
        for k in ["filled_size", "filledSize", "filledQuantity", "filled_qty"]:
            if k in order:
                try:
                    px = float(order.get("avg_price") or order.get("avgPrice") or order.get("price") or 0) or None
                    if fee is None:
                        for fk in ["fee", "fees"]:
                            if fk in order:
                                try:
                                    fee = float(order[fk])
                                except Exception:
                                    pass
                    return float(order[k]), px, fee
                except Exception:
                    pass

    fills = resp.get("fills") or (order.get("fills") if isinstance(order, dict) else None)
    if isinstance(fills, list) and fills:
        try:
            sz = 0.0
            px_sum = 0.0
            for f in fills:
                if not isinstance(f, dict):
                    continue
                fs = float(f.get("size") or f.get("filled_size") or f.get("quantity") or 0.0)
                fp = float(f.get("price") or 0.0)
                sz += fs
                px_sum += fs * fp
                if fee is None and "fee" in f:
                    try:
                        fee = float(f["fee"])
                    except Exception:
                        pass
            if sz > 0:
                return sz, (px_sum / sz if px_sum > 0 else None), fee
        except Exception:
            pass

    # Polymarket post_order immediate fill: for BUY takingAmount=tokens received, makingAmount=USDC; for SELL reversed
    taking = resp.get("takingAmount")
    making = resp.get("makingAmount")
    if taking is not None and making is not None:
        try:
            take_f = float(taking)
            make_f = float(making)
            if side == SELL_SIDE:
                sz = make_f   # outcome tokens we sold
                usd = take_f  # USDC we received
            else:
                sz = take_f   # outcome tokens we received (BUY)
                usd = make_f  # USDC we gave
            if sz > 0 and usd >= 0:
                avg_px = (usd / sz) if sz > 0 else None
                return sz, avg_px, fee
        except (TypeError, ValueError):
            pass

    return 0.0, None, fee

class Executor:
    def __init__(self, client: ClobClient):
        self.client = client
        self.dry = os.getenv("DRY_RUN", "1") == "1"
        self.aggressive = os.getenv("AGGRESSIVE_ENTRY", "0") == "1"
        self.agg_factor = _safe_float(os.getenv("AGGRESSION_FACTOR"), 1.001)
        self.wait_fill_ms = _safe_int(os.getenv("WAIT_FILL_MS"), 1200)
        self.poll_fill_ms = _safe_int(os.getenv("POLL_FILL_MS"), 200)
        self._order_lock = asyncio.Lock()
        self._risk: Optional["Risk"] = None

    def set_risk(self, risk: "Risk"):
        self._risk = risk

    def _is_ambiguous_post_error(self, e: Exception) -> tuple[bool, bool, bool, bool]:
        """Возвращает (ambiguous, duplicated, not_enough_balance, invalid_amount_precision)."""
        msg = str(e)
        status = getattr(e, "status_code", None)
        duplicated = (status == 400 or str(status) == "400") and "Duplicated" in msg
        not_enough = (status == 400 or str(status) == "400") and ("not enough balance" in msg or "allowance" in msg)
        invalid_amt = (status == 400 or str(status) == "400") and ("max accuracy" in msg or "invalid amounts" in msg)
        # network / request exceptions, 5xx, timeouts и пр. считаем неоднозначными
        ambiguous = (
            status is None
            or (isinstance(status, int) and status >= 500)
            or "Request exception" in msg
            or "timed out" in msg
            or "timeout" in msg.lower()
        )
        # duplicated после ambiguous submit тоже считаем неоднозначным (ордер, скорее всего, уже принят)
        if duplicated:
            ambiguous = True
        return ambiguous, duplicated, not_enough, invalid_amt

    async def _mark_ambiguous(self, reason: str, err: Exception):
        logging.warning(f"[ORDER] ambiguous submit detected reason={reason} err={err}")
        if self._risk is not None and hasattr(self._risk, "posm") and self._risk.posm is not None:
            self._risk.posm.mark_ambiguous(reason)
            await self._risk.capture_balance_at_ambiguous()

    async def _wait_fill(self, order_id: str, side=None):
        """Poll order until filled or timeout. Pass side=SELL_SIDE for sells so fill size is interpreted correctly."""
        deadline = now_s() + (self.wait_fill_ms / 1000.0)
        get_order = getattr(self.client, "get_order", None)
        if not get_order:
            return None
        last = None
        while now_s() < deadline:
            try:
                last = await _call_with_retry(get_order, order_id, tag="get_order")
                d = last if isinstance(last, dict) else {"order": last}
                filled, avg_px, fee = _extract_fill(d, side=side)
                st = _extract_status(last)
                if filled and filled > 0:
                    return {"filled_size": filled, "avg_price": avg_px, "fee": fee, "status": st, "raw": last}
                if st in ("canceled", "cancelled", "rejected", "expired"):
                    return {"filled_size": 0.0, "avg_price": None, "fee": None, "status": st, "raw": last}
            except Exception as e:
                logging.warning(f"[FILL_WAIT] get_order err={e}")
            await asyncio.sleep(self.poll_fill_ms / 1000.0)
        return {"filled_size": 0.0, "avg_price": None, "fee": None, "status": "timeout", "raw": last}

    async def _cancel(self, order_id: str):
        cancel = getattr(self.client, "cancel", None) or getattr(self.client, "cancel_order", None)
        if not cancel:
            return
        try:
            await _call_with_retry(partial(cancel, order_id=order_id), tag="cancel")
        except Exception as e:
            logging.warning(f"[CANCEL] failed order_id={order_id} err={e}")

    async def cancel_order(self, order_id: str):
        await self._cancel(order_id)

    async def ioc_buy(self, token_id: str, ask_price: float, usd_amount: float):
        px = float(ask_price)
        if self.aggressive:
            px = min(px * self.agg_factor, 0.99)
        # API: maker amount (size*price) max 2 decimals, taker amount (size) max 4 decimals
        usd_amount = _quantize_usd(float(usd_amount))
        px = _quantize_price(px)
        size = float(usd_amount / max(px, 1e-9))
        size = _quantize_size(size, 0)
        if size <= 0:
            return {"success": False, "error": "size<=0 after quantize"}

        if self.dry:
            logging.info(f"[DRY] BUY token={token_id} px={px:.4f} size={size:.4f}")
            return {"success": True, "filled_size": size, "avg_price": px, "fee": 0.0}

        if self._risk:
            self._risk._entry_in_flight = True
        try:
            return await self._ioc_buy_impl(token_id, px, size)
        finally:
            if self._risk:
                self._risk._entry_in_flight = False

    async def _ioc_buy_impl(self, token_id: str, px: float, size: float):
        async with self._order_lock:
            order = OrderArgs(token_id=token_id, price=px, size=size, side=BUY_SIDE)
            signed = await _call_with_retry(self.client.create_order, order, tag="create_order")
            resp = None
            last_err = None
            for attempt in range(2):
                try:
                    resp = await asyncio.to_thread(self.client.post_order, signed, ORDER_TYPE_MARKET)
                    break
                except Exception as e:
                    last_err = e
                    msg = str(e)
                    if ("FAK" in msg or "IOC" in msg) and "no orders found to match" in msg:
                        if self._risk:
                            self._risk.invalidate_balance_cache()
                        logging.info(f"[ORDER] LIVE BUY: no liquidity (FAK no match)")
                        return {"success": False, "reason": "no_liquidity", "error": msg}
                    amb, dup, not_enough, invalid_amt = self._is_ambiguous_post_error(e)
                    if invalid_amt:
                        if self._risk:
                            self._risk.invalidate_balance_cache()
                        logging.warning(f"[ORDER] LIVE BUY rejected: invalid amount precision (quantize needed) err={e}")
                        return {"success": False, "error": str(e), "reason": "invalid_amount_precision"}
                    if not_enough:
                        if self._risk:
                            self._risk.invalidate_balance_cache()
                        logging.warning(f"[ORDER] LIVE BUY failed: not enough balance/allowance err={e}")
                        return {"success": False, "error": str(e)}
                    # Never retry on ambiguous: we cannot know if the first request reached the exchange (idempotency)
                    if amb:
                        await self._mark_ambiguous("post_order_market", e)
                        if self._risk:
                            self._risk.invalidate_balance_cache()
                        return {"success": False, "ambiguous": True, "error": str(e)}
                    if self._risk:
                        self._risk.invalidate_balance_cache()
                    raise
            if resp is None:
                if last_err is not None:
                    await self._mark_ambiguous("post_order_market", last_err)
                    if self._risk:
                        self._risk.invalidate_balance_cache()
                    return {"success": False, "ambiguous": True, "error": str(last_err)}
                if self._risk:
                    self._risk.invalidate_balance_cache()
                return {"success": False, "error": "no response"}

            if self._risk:
                self._risk.invalidate_balance_cache()
        logging.info(f"[LIVE] BUY post resp={resp}")
        filled, avg_px, fee = _extract_fill(resp if isinstance(resp, dict) else {})
        if filled and filled > 0:
            return {"success": True, "filled_size": filled, "avg_price": avg_px or px, "fee": fee, "resp": resp}

        oid = _extract_order_id(resp)
        if not oid:
            return {"success": False, "resp": resp}
        w = await self._wait_fill(oid, side=BUY_SIDE)
        if self._risk:
            self._risk.invalidate_balance_cache()
        if w and w.get("filled_size", 0) > 0:
            return {"success": True, "filled_size": w["filled_size"], "avg_price": w.get("avg_price") or px, "fee": w.get("fee"), "order_id": oid, "resp": resp}
        await self._cancel(oid)
        return {"success": False, "order_id": oid, "resp": resp, "wait": w}

    async def ioc_sell(self, token_id: str, bid_price: float, size: float):
        px = _quantize_price(float(bid_price))
        size = _quantize_size(float(size), 0)
        if size <= 0:
            return {"success": False}
        if not _is_size_tradeable(size):
            logging.info(f"[ORDER_GUARD] skip sell: size below exchange minimum (size={size:.4f} min={_min_order_size()})")
            return {"success": False, "reason": "size_below_min"}

        if self.dry:
            logging.info(f"[DRY] SELL token={token_id} px={px:.4f} size={size:.4f}")
            return {"success": True, "filled_size": size, "avg_price": px, "fee": 0.0}

        async with self._order_lock:
            order = OrderArgs(token_id=token_id, price=px, size=size, side=SELL_SIDE)
            signed = await _call_with_retry(self.client.create_order, order, tag="create_order")
            try:
                resp = await asyncio.to_thread(self.client.post_order, signed, ORDER_TYPE_MARKET)
            except Exception as e:
                msg = str(e)
                if ("FAK" in msg or "IOC" in msg) and "no orders found to match" in msg:
                    if self._risk:
                        self._risk.invalidate_balance_cache()
                    logging.info(f"[ORDER] LIVE SELL: no liquidity (FAK no match)")
                    return {"success": False, "reason": "no_liquidity", "error": msg}
                amb, dup, not_enough, invalid_amt = self._is_ambiguous_post_error(e)
                if self._risk:
                    self._risk.invalidate_balance_cache()
                if amb:
                    await self._mark_ambiguous("post_order_market_sell", e)
                    return {"success": False, "ambiguous": True, "needs_reconcile": True, "error": str(e)}
                if invalid_amt:
                    logging.warning(f"[ORDER] LIVE SELL rejected: invalid amount precision err={e}")
                    return {"success": False, "error": str(e), "reason": "invalid_amount_precision"}
                if not_enough:
                    if self._risk:
                        self._risk.invalidate_balance_cache()
                    logging.warning(f"[ORDER] LIVE SELL failed: not enough balance/allowance err={e}")
                    return {"success": False, "error": str(e), "needs_reconcile": True, "reason": "not_enough_balance"}
                if self._risk:
                    self._risk.invalidate_balance_cache()
                raise

            if self._risk:
                self._risk.invalidate_balance_cache()
        logging.info(f"[LIVE] SELL post resp={resp}")
        filled, avg_px, fee = _extract_fill(resp if isinstance(resp, dict) else {}, side=SELL_SIDE)
        if filled and filled > 0:
            return {"success": True, "filled_size": filled, "avg_price": avg_px or px, "fee": fee, "resp": resp}

        oid = _extract_order_id(resp)
        if not oid:
            return {"success": False, "resp": resp}
        w = await self._wait_fill(oid, side=SELL_SIDE)
        if self._risk:
            self._risk.invalidate_balance_cache()
        if w and w.get("filled_size", 0) > 0:
            return {"success": True, "filled_size": w["filled_size"], "avg_price": w.get("avg_price") or px, "fee": w.get("fee"), "order_id": oid, "resp": resp}
        await self._cancel(oid)
        return {"success": False, "order_id": oid, "resp": resp, "wait": w}

    async def smart_buy(self, token_id: str, bid: float, ask: float, usd_amount: float):
        """Maker-then-taker: try limit inside spread, fallback to taker."""
        maker_ms = int(os.getenv("MAKER_WAIT_MS", "700"))
        maker_bump = float(os.getenv("MAKER_BUMP_BPS", "1.0")) / 10000.0
        px_maker = min(ask * 0.9999, bid * (1.0 + maker_bump)) if bid and bid > 0 else ask * 0.999
        # API: maker amount (size*price) max 2 decimals → size integer
        usd_amount = _quantize_usd(float(usd_amount))
        px_maker = _quantize_price(px_maker)
        size = float(usd_amount / max(px_maker, 1e-9))
        size = _quantize_size(size, 0)

        if self.dry:
            return {"success": True, "filled_size": size, "avg_price": px_maker, "fee": 0.0, "mode": "dry_maker"}

        if self._risk:
            self._risk._entry_in_flight = True
        try:
            return await self._smart_buy_impl(token_id, bid, ask, usd_amount, px_maker, size)
        finally:
            if self._risk:
                self._risk._entry_in_flight = False

    async def _smart_buy_impl(self, token_id: str, bid: float, ask: float, usd_amount: float, px_maker: float, size: float):
        maker_ms = int(os.getenv("MAKER_WAIT_MS", "700"))
        async with self._order_lock:
            order = OrderArgs(token_id=token_id, price=px_maker, size=size, side=BUY_SIDE)
            signed = await _call_with_retry(self.client.create_order, order, tag="create_order")
            try:
                resp = await asyncio.to_thread(self.client.post_order, signed, ORDER_TYPE_GTC)
            except Exception as e:
                amb, dup, not_enough, invalid_amt = self._is_ambiguous_post_error(e)
                if self._risk:
                    self._risk.invalidate_balance_cache()
                if amb:
                    await self._mark_ambiguous("post_order_maker", e)
                    return {"success": False, "ambiguous": True, "error": str(e)}
                if invalid_amt:
                    logging.warning(f"[ORDER] maker BUY rejected: invalid amount precision err={e}")
                    return {"success": False, "error": str(e), "reason": "invalid_amount_precision"}
                if not_enough:
                    logging.warning(f"[SMART_BUY] maker failed: not enough balance/allowance err={e}")
                    return {"success": False, "error": str(e)}
                logging.warning(f"[SMART_BUY] maker failed non-ambiguous err={e} -> taker fallback")
                self.wait_fill_ms = int(os.getenv("WAIT_FILL_MS", "1200"))
                return await self.ioc_buy(token_id, ask, usd_amount)
            if self._risk:
                self._risk.invalidate_balance_cache()
        oid = _extract_order_id(resp)
        orig_wait = self.wait_fill_ms
        try:
            if oid:
                self.wait_fill_ms = maker_ms
                w = await self._wait_fill(oid, side=BUY_SIDE)
                if self._risk:
                    self._risk.invalidate_balance_cache()
                filled = float(w.get("filled_size") or 0.0) if w else 0.0
                if filled > 0:
                    rem = max(0.0, size - filled)
                    await self._cancel(oid)
                    if rem > 0:
                        self.wait_fill_ms = int(os.getenv("WAIT_FILL_MS", "1200"))
                        tak = await self.ioc_buy(token_id, ask, rem * ask)
                        tak["mode"] = "maker_partial_then_taker"
                        return tak
                    return {"success": True, "filled_size": filled, "avg_price": w.get("avg_price") or px_maker, "fee": w.get("fee"), "mode": "maker"}
                await self._cancel(oid)
        finally:
            self.wait_fill_ms = orig_wait
        self.wait_fill_ms = int(os.getenv("WAIT_FILL_MS", "1200"))
        tak = await self.ioc_buy(token_id, ask, usd_amount)
        tak["mode"] = "taker_fallback"
        return tak

    async def place_limit_order(self, token_id: str, price: float, size: float, side: str) -> Optional[str]:
        """Place GTC limit order. Returns order_id or None."""
        if self.dry:
            return "dry_limit"
        set_inflight = self._risk and side == BUY_SIDE
        if set_inflight:
            self._risk._entry_in_flight = True
        try:
            return await self._place_limit_order_impl(token_id, price, size, side)
        finally:
            if set_inflight and self._risk:
                self._risk._entry_in_flight = False

    async def _place_limit_order_impl(self, token_id: str, price: float, size: float, side: str) -> Optional[str]:
        if not _is_size_tradeable(size):
            logging.info(f"[ORDER_GUARD] skip limit order: size below exchange minimum (size={size:.4f} min={_min_order_size()})")
            return None
        async with self._order_lock:
            order = OrderArgs(token_id=token_id, price=price, size=size, side=side)
            # maker amount (size*price) max 2 decimals → size integer
            order.price = _quantize_price(float(order.price))
            order.size = _quantize_size(float(order.size), 0)
            signed = await _call_with_retry(self.client.create_order, order, tag="create_order")
            try:
                resp = await asyncio.to_thread(self.client.post_order, signed, ORDER_TYPE_GTC)
            except Exception as e:
                if self._risk:
                    self._risk.invalidate_balance_cache()
                amb, dup, not_enough, invalid_amt = self._is_ambiguous_post_error(e)
                if amb:
                    await self._mark_ambiguous("post_order_limit", e)
                    return None
                if invalid_amt:
                    logging.warning(f"[ORDER] limit rejected: invalid amount precision err={e}")
                    return None
                if not_enough:
                    logging.warning(f"[ORDER] limit failed: not enough balance/allowance err={e}")
                    return None
                raise
            if self._risk:
                self._risk.invalidate_balance_cache()
        return _extract_order_id(resp if isinstance(resp, dict) else {})

    async def get_order_info(self, order_id: str, side=None) -> Optional[dict]:
        """Fetch order status. Returns dict with status, filled_size, avg_price or None. Pass side=SELL_SIDE for sells."""
        if not order_id or order_id == "dry_limit":
            return None
        get_order = getattr(self.client, "get_order", None)
        if not get_order:
            return None
        try:
            raw = await _call_with_retry(get_order, order_id, tag="get_order")
            d = raw if isinstance(raw, dict) else {"order": raw}
            filled, avg_px, fee = _extract_fill(d, side=side)
            st = _extract_status(raw)
            return {"status": st or "unknown", "filled_size": filled or 0.0, "avg_price": avg_px, "fee": fee, "raw": raw}
        except Exception as e:
            logging.warning(f"[ORDER] get_order err={e}")
            return None

# ---------- WS with reconnect ----------
async def btc_ws_loop(btc: BTCFeed, stop_evt: asyncio.Event):
    first_tick_logged = False
    while not stop_evt.is_set():
        try:
            async with websockets.connect(BINANCE_WS, ping_interval=20) as ws:
                logging.info("[BTC_WS] connected")
                while not stop_evt.is_set():
                    raw = await ws.recv()
                    j = json.loads(raw)
                    btc.update(float(j["T"]) / 1000.0, float(j["p"]))
                    if not first_tick_logged:
                        first_tick_logged = True
                        logging.info(f"[BTC_WS] first tick price={float(j['p']):.2f}")
        except Exception as e:
            logging.warning(f"[BTC_WS] disconnected: {e} -> reconnect in 3s")
            await asyncio.sleep(3)

async def poly_ws_producer(
    asset_ids: list,
    stop_evt: asyncio.Event,
    poly_q: asyncio.Queue,
    poly_stats: dict,
):
    """Ingest only: recv -> parse -> put in queue (maxsize=1, last-value cache)."""
    while not stop_evt.is_set():
        try:
            async with websockets.connect(
                POLY_MARKET_WS, ping_interval=20, ping_timeout=20, close_timeout=5
            ) as ws:
                logging.info("[POLY_WS] connected, subscribing to assets")
                await ws.send(json.dumps({
                    "type": "market",
                    "assets_ids": list(asset_ids),
                    "custom_feature_enabled": True,
                }))
                while not stop_evt.is_set():
                    raw = await ws.recv()
                    try:
                        msg = json.loads(raw)
                    except Exception:
                        continue
                    poly_stats["in"] = poly_stats.get("in", 0) + 1
                    try:
                        poly_q.put_nowait(msg)
                    except asyncio.QueueFull:
                        poly_stats["drop"] = poly_stats.get("drop", 0) + 1
                        _ = poly_q.get_nowait()
                        poly_q.put_nowait(msg)
        except Exception as e:
            logging.warning(f"[POLY_WS] disconnected: {e} -> reconnect in 5s")
            await asyncio.sleep(5)

def _is_orderbook_404(e: Exception) -> bool:
    """True if exception indicates orderbook no longer exists (market expired)."""
    code = getattr(e, "status_code", None)
    if code == 404:
        return True
    msg = str(e).lower()
    # Be conservative: treat only explicit "no orderbook" signals as 404.
    # Some errors include phrases like "orderbook exists" which should NOT be classified as expired.
    return "404" in msg or "no orderbook" in msg or "no orderbook exists" in msg


async def poll_l1_books(
    client,
    token_ids: list,
    book: dict,
    stop_evt: asyncio.Event,
    interval_s: float = 0.5,
    market_expired_evt: asyncio.Event | None = None,
):
    """REST L1 poller: best bid/ask. Trading decisions use this, not WS.
    If market_expired_evt is provided, sets it when 404 (no orderbook) detected for all tokens.
    """
    def _to_px_sz(x):
        if isinstance(x, dict):
            return float(x.get("price", 0)), float(x.get("size", 0))
        p = getattr(x, "price", None) or (x[0] if hasattr(x, "__getitem__") else 0)
        s = getattr(x, "size", None) or (x[1] if hasattr(x, "__getitem__") else 0)
        return float(p), float(s)

    def _best_bid(levels):
        best = None
        for x in levels or []:
            try:
                p, s = _to_px_sz(x)
                if s <= 0:
                    continue
                if best is None or p > best[0]:
                    best = (p, s)
            except Exception:
                continue
        return best

    def _best_ask(levels):
        best = None
        for x in levels or []:
            try:
                p, s = _to_px_sz(x)
                if s <= 0:
                    continue
                if best is None or p < best[0]:
                    best = (p, s)
            except Exception:
                continue
        return best

    consecutive_404_cycles = 0
    required_404_cycles = _safe_int(os.getenv("L1_404_REQUIRED_CYCLES"), 5)
    grace_sec = _safe_float(os.getenv("L1_404_GRACE_SEC"), 20.0)
    start_ts = now_s()
    saw_any_book = False

    # Backoff for Cloudflare 429 / 1015 (rate limiting)
    backoff_sec = _safe_float(os.getenv("L1_RATE_LIMIT_BACKOFF_SEC"), 30.0)
    max_backoff_sec = _safe_float(os.getenv("L1_RATE_LIMIT_BACKOFF_MAX_SEC"), 120.0)

    while not stop_evt.is_set():
        cycle_404_count = 0
        get_book = getattr(client, "get_order_book", None) or getattr(client, "get_orderbook", None)
        if not get_book:
            raise RuntimeError("CLOB client has no get_order_book/get_orderbook")
        for tid in token_ids:
            try:
                ob = await asyncio.to_thread(get_book, tid)
                bids = getattr(ob, "bids", None) or (ob.get("bids") if isinstance(ob, dict) else []) or []
                asks = getattr(ob, "asks", None) or (ob.get("asks") if isinstance(ob, dict) else []) or []
                book[tid]["bid"] = _best_bid(bids)
                book[tid]["ask"] = _best_ask(asks)
                book[tid]["ts"] = now_s()
                consecutive_404_cycles = 0
                saw_any_book = True
            except Exception as e:
                msg = str(e)
                if _is_orderbook_404(e):
                    cycle_404_count += 1
                # Short log line to avoid dumping full HTML bodies
                logging.warning(f"[L1] poll failed token={tid[:20]}...: {type(e).__name__} {getattr(e, 'status_code', '')} {msg[:180]}")

                # Cloudflare 1015 / HTTP 429 → exponential backoff
                status_code = getattr(e, "status_code", None)
                if status_code == 429 or "1015" in msg:
                    logging.warning(f"[L1] rate limited (status={status_code}), backing off for {backoff_sec:.1f}s")
                    await asyncio.sleep(backoff_sec)
                    backoff_sec = min(backoff_sec * 2.0, max_backoff_sec)
                else:
                    # Reset backoff on non‑rate‑limit errors
                    backoff_sec = _safe_float(os.getenv("L1_RATE_LIMIT_BACKOFF_SEC"), 30.0)
        if cycle_404_count >= len(token_ids) and market_expired_evt:
            consecutive_404_cycles += 1
            # Avoid false "expired" during market switch / initial warmup:
            # - before we've ever seen a valid book
            # - or within grace window right after session start
            if (not saw_any_book) and (now_s() - start_ts) < grace_sec:
                consecutive_404_cycles = 0
            elif consecutive_404_cycles >= required_404_cycles:
                logging.info(
                    f"[L1] 404 for all tokens (market expired) cycles={consecutive_404_cycles} "
                    f"grace={grace_sec:.0f}s saw_book={int(saw_any_book)} -> signal refresh"
                )
                market_expired_evt.set()
                return
        try:
            await asyncio.wait_for(stop_evt.wait(), timeout=interval_s)
        except asyncio.TimeoutError:
            pass

# ---------- Main ----------
def _resolve_market_for_session(slug: str, client) -> tuple[str, dict]:
    """Resolve market. For auto slug uses server time to find current/next BTC 5m."""
    if slug.strip() in ("", "auto", "btc-5m", "btc-updown-5m", "btc-updown"):
        explicit = os.getenv("BTC_5M_SLUG", "").strip()
        if explicit:
            m = fetch_market_by_slug(explicit, clob_client=client)
            return explicit, m
        w = os.getenv("MARKET_WINDOW", "5m").strip().lower()
        return _resolve_btc_market_via_time(client, window=w)
    m = fetch_market_by_slug(slug, clob_client=client)
    return slug, m


async def run_bot(slug: str):
    print("BOOT: run_bot entered", flush=True)
    setup_logging(slug)
    logging.info("[BOOT] run_bot entered")
    logging.info(f"[CONFIG] MARKET_SLUG={os.getenv('MARKET_SLUG', '')!r} ARB_ENABLED={os.getenv('ARB_ENABLED', '0')} ARB_THRESHOLD={os.getenv('ARB_THRESHOLD', '0.997')}")

    print("BOOT: init clob client...", flush=True)
    client = await asyncio.wait_for(asyncio.to_thread(make_clob_client), timeout=20)
    print("BOOT: clob client OK", flush=True)

    stop_evt = asyncio.Event()

    # graceful shutdown
    loop = asyncio.get_running_loop()
    for s in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(s, stop_evt.set)
        except NotImplementedError:
            pass

    btc = BTCFeed()
    strat = Strategy(btc)
    metrics = Metrics()
    execu = Executor(client)
    risk = Risk(client, metrics)
    posm = PositionManager()
    # связываем Risk/Executor с менеджером позиций для guard-логики
    risk.posm = posm
    execu.set_risk(risk)
    feats = FeatureStore()
    dry = os.getenv("DRY_RUN", "1") == "1"
    mode_s = "DRY_RUN (no real orders)" if dry else "LIVE"
    print(f"BOOT: mode={mode_s}", flush=True)
    logging.info(f"[MODE] effective trading mode={mode_s}")

    cfg = load_config()
    validate_config(cfg)
    logging.info("[CONFIG] validated snapshot: %s", _config_snapshot(cfg))

    min_liq = cfg.min_liq_usd
    max_book_age_ms = cfg.max_book_age_ms
    min_warmup_sec = cfg.min_warmup_sec
    sigma_min = cfg.sigma_min
    debounce_s = cfg.debounce_s
    min_time_to_expiry = cfg.min_time_to_expiry
    min_entry_tte_sec = cfg.min_entry_tte_sec
    min_entry_price = cfg.min_entry_price
    max_entry_price = cfg.max_entry_price
    fee_buffer = cfg.fee_buffer
    l1_poll_sec = cfg.l1_poll_sec
    mom_lb_sec = cfg.mom_lb_sec
    mom_entry_pct = cfg.mom_entry_pct
    expiry_squeeze_tte = cfg.expiry_squeeze_tte
    squeeze_skew = cfg.squeeze_skew
    entry_cutoff_sec = cfg.entry_cutoff_sec
    exit_min_liq = cfg.exit_min_liq
    exit_min_size = cfg.exit_min_size
    exit_dust_threshold = cfg.exit_dust_threshold
    position_dust_eps = cfg.position_dust_eps
    exit_dust_recheck_sec = cfg.exit_dust_recheck_sec
    exit_dust_log_interval_sec = cfg.exit_dust_log_interval_sec
    exit_min_notional_usd = cfg.exit_min_notional_usd
    exit_max_book_share = cfg.exit_max_book_share
    exit_max_slices = cfg.exit_max_slices
    exit_max_reconcile_retries = cfg.exit_max_reconcile_retries
    reconcile_max_multiplier = cfg.reconcile_max_multiplier
    exec_edge_lag = cfg.exec_edge_lag
    exec_edge_large = cfg.exec_edge_large
    exec_edge_squeeze = cfg.exec_edge_squeeze
    fee_bps = cfg.fee_bps
    edge_sanity_bps = cfg.edge_sanity_bps
    spread_min_bps = cfg.spread_min_bps

    ledger = TradeLedger()
    market_generation_id = [0]

    # Outer loop: refresh market on 404 (expired) or when slug=auto
    while not stop_evt.is_set():
        print("BOOT: resolving market...", flush=True)
        try:
            resolved_slug, market = await asyncio.wait_for(
                asyncio.to_thread(_resolve_market_for_session, slug, client),
                timeout=30,
            )
            logging.info(f"[BOOT] market resolved slug={resolved_slug!r}")
        except Exception as e:
            logging.error(f"[RESOLVE] failed: {e} -> retry in 10s")
            await asyncio.sleep(10)
            continue

        condition_id = market.get("conditionId") or market.get("condition_id")
        if not condition_id:
            logging.error("[RESOLVE] No conditionId -> retry in 10s")
            await asyncio.sleep(10)
            continue

        expiry_ts = parse_expiry_ts(market)
        token_map = build_token_map(market)
        yes_token = token_map.get("yes") or token_map.get("up")
        no_token = token_map.get("no") or token_map.get("down")
        if not yes_token or not no_token:
            logging.error(f"[RESOLVE] No YES/NO tokens -> retry in 10s")
            await asyncio.sleep(10)
            continue

        logging.info(f"[MARKET] {market.get('question') or market.get('title')}")
        logging.info(f"[CLOB] condition_id={condition_id} slug={resolved_slug}")
        logging.info(f"[TOKENS] YES={yes_token} NO={no_token}")

        risk._entry_in_flight = False
        metrics.last_skip_reason = ""
        metrics.last_skip_ts = 0.0

        market_expired_evt = asyncio.Event()
        market_generation_id[0] += 1
        session_stop = asyncio.Event()

        async def propagate_stop():
            await stop_evt.wait()
            session_stop.set()

        prop_task = asyncio.create_task(propagate_stop())

        # book with timestamps
        book = {
            yes_token: {"bid": None, "ask": None, "ts": 0.0},
            no_token: {"bid": None, "ask": None, "ts": 0.0},
        }
        # Stale position from previous market (e.g. 404 before we could close) - can't trade it; full exit finalization
        if posm.has_pos() and posm.pos_token not in book:
            logging.warning(f"[POS] stale pos token not in new market book -> clearing (will resolve on Polymarket)")
            old_slug = risk.active_market_slug or resolved_slug
            posm.clear()
            ledger.size = 0.0
            risk.on_market_exit(old_slug, None, forced=True, reason="stale_token_clear")
            risk.on_close()

        book_updated_once = False
        poly_q: asyncio.Queue = asyncio.Queue(maxsize=1)
        poly_stats: dict = {"in": 0, "drop": 0}

        def book_fresh(tid: str) -> bool:
            return (now_s() - book[tid]["ts"]) * 1000.0 < max_book_age_ms

        def have_l1() -> bool:
            return (
                book[yes_token]["bid"] and book[yes_token]["ask"]
                and book[no_token]["bid"] and book[no_token]["ask"]
                and book_fresh(yes_token) and book_fresh(no_token)
            )

        def mid(tid: str) -> float:
            b, a = book[tid]["bid"], book[tid]["ask"]
            if not b or not a:
                return 0.5
            return (float(b[0]) + float(a[0])) / 2.0

        def spread(tid: str) -> float:
            b, a = book[tid]["bid"], book[tid]["ask"]
            if not b or not a:
                return 0.0
            return float(a[0]) - float(b[0])

        def ask_liq_usd(tid: str) -> float:
            a = book[tid]["ask"]
            return float(a[0] * a[1]) if a else 0.0

        def bid_liq_usd(tid: str) -> float:
            b = book[tid]["bid"]
            return float(b[0] * b[1]) if b else 0.0

        def best_bid(token_id: str):
            b = book[token_id]["bid"]
            return float(b[0]) if b else None

        def best_ask(token_id: str):
            a = book[token_id]["ask"]
            return float(a[0]) if a else None

        def tte():
            if not expiry_ts:
                return None
            return max(0.0, expiry_ts - now_s())

        def horizon():
            if expiry_ts:
                return max(1.0, min(300.0, expiry_ts - now_s()))
            return 300.0

        def fee_est(notional: float):
            return notional * fee_bps / 10000.0 if fee_bps else 0.0

        def can_exit_position(size: float, bid_px: float, bid_sz: float, min_size: float, max_share: float, exit_min_notional: float) -> Tuple[bool, str]:
            if size < min_size:
                return False, "size_too_small"
            max_exit = bid_sz * max_share
            if max_exit < size:
                return False, "not_enough_depth"
            if bid_px * bid_sz < exit_min_notional:
                return False, "low_liquidity"
            return True, "ok"

        last_decision_ts = 0.0
        debounce_task = None
        consecutive_decision_errors = 0
        DECISION_FAIL_FAST_LIMIT = 5
        last_warmup_log_ts = 0.0
        last_strat_debug_ts = 0.0

        exit_state = {"consecutive_failures": 0, "consecutive_ambiguous": 0, "reconcile_retries": 0, "last_unclear": False}

        async def fetch_outcome_balance(token_id: str) -> Optional[float]:
            """Fetch current outcome token balance from exchange. Returns None on error."""
            try:
                cond_type = getattr(AssetType, "CONDITIONAL", None)
                if cond_type is None:
                    return None
                try:
                    params = BalanceAllowanceParams(asset_type=cond_type, token_id=token_id)
                except TypeError:
                    params = BalanceAllowanceParams(asset_type=cond_type, token_ID=token_id)
                result = await _call_with_retry(
                    client.get_balance_allowance, params, tag="get_balance_allowance_conditional"
                )
                return _parse_outcome_balance(result)
            except Exception as e:
                logging.debug(f"[BALANCE_POLL] outcome balance fetch failed token={token_id[:20]}... err={e}")
                return None

        async def reconcile_position_from_exchange(token_id: str) -> Tuple[Optional[float], str]:
            """Fetch actual outcome token balance, optionally subtract open sell size. Returns (actual_available, action). action in clear|shrink|keep."""
            local_sz = getattr(posm, "size", 0.0) or 0.0
            actual_available = None
            open_orders_size = 0.0
            try:
                cond_type = getattr(AssetType, "CONDITIONAL", None)
                if cond_type is not None:
                    try:
                        params = BalanceAllowanceParams(asset_type=cond_type, token_id=token_id)
                    except TypeError:
                        params = BalanceAllowanceParams(asset_type=cond_type, token_ID=token_id)
                    result = await _call_with_retry(
                        client.get_balance_allowance, params, tag="get_balance_allowance_conditional"
                    )
                    actual_available = _parse_outcome_balance(result)
                else:
                    actual_available = None
            except Exception as e:
                logging.warning(f"[RECONCILE] fetch balance failed token={token_id[:20]}... err={e}")
                logging.info(f"[RECONCILE] token={token_id[:24]}... actual=unknown local={local_sz:.4f} open_orders=unknown action=keep")
                return None, "keep"
            try:
                get_open = getattr(client, "get_open_orders", None)
                if get_open:
                    orders = await asyncio.to_thread(get_open)
                    for o in (orders if isinstance(orders, list) else []):
                        o_token = (o.get("asset_id") or o.get("tokenID") or o.get("token_id") or "") if isinstance(o, dict) else ""
                        o_side = (o.get("side") or "").upper() if isinstance(o, dict) else ""
                        o_sz = float(o.get("size") or o.get("original_size") or 0) if isinstance(o, dict) else 0
                        if str(o_token) == str(token_id) and "SELL" in o_side and o_sz > 0:
                            open_orders_size += o_sz
            except Exception as e:
                logging.debug(f"[RECONCILE] get_open_orders failed: {e}")
            if actual_available is not None:
                actual_available = max(0.0, actual_available - open_orders_size)
            else:
                risk.last_reconcile_actual = None
                risk.last_reconcile_status = "unknown"
                logging.info(f"[RECONCILE] token={token_id[:24]}... actual=unknown local={local_sz:.4f} open_orders={open_orders_size:.4f} action=keep")
                return None, "keep"
            if actual_available < 0:
                logging.warning(f"[RECONCILE] negative actual balance ignored actual={actual_available:.4f}")
                risk.last_reconcile_actual = actual_available
                risk.last_reconcile_status = "negative_ignored"
                return None, "keep"
            if local_sz > 0 and actual_available > local_sz * reconcile_max_multiplier:
                logging.info(f"[RECONCILE_GUARD] absurd actual balance ignored actual={actual_available:.4f} local={local_sz:.4f}")
                risk.last_reconcile_actual = actual_available
                risk.last_reconcile_status = "absurd_ignored"
                return None, "keep"
            ledger_sz = getattr(ledger, "size", 0) or 0
            if local_sz > 0 and ledger_sz <= position_dust_eps and actual_available <= position_dust_eps and open_orders_size <= position_dust_eps:
                risk.last_reconcile_status = "clear_local"
                risk.last_reconcile_actual = actual_available
                logging.info(f"[RECONCILE] token={token_id[:24]}... actual={actual_available:.4f} local={local_sz:.4f} open_orders={open_orders_size:.4f} action=clear_local")
                posm.clear()
                ledger.size = 0.0
                if getattr(posm, "closing", False):
                    posm.closing = False
                risk.exit_in_progress = False
                risk.exit_pending_reconcile = False
                risk.exit_blocked_dust = False
                risk.on_market_exit(resolved_slug, None, forced=True, reason="clear_local")
                risk.on_close()
                logging.info("[DESYNC_HEAL] local position cleared from ledger/exchange truth token=%s... local=%.4f ledger=%.4f open_orders=%.4f", token_id[:24], local_sz, ledger_sz, open_orders_size)
                return actual_available, "clear_local"
            eps = 1e-4
            risk.last_reconcile_actual = actual_available
            if actual_available <= exit_dust_threshold:
                risk.last_reconcile_status = "clear"
                logging.info(f"[RECONCILE] token={token_id[:24]}... actual={actual_available:.4f} local={local_sz:.4f} open_orders={open_orders_size:.4f} action=clear")
                posm.clear()
                ledger.size = 0.0
                if getattr(posm, "closing", False):
                    posm.closing = False
                risk.exit_in_progress = False
                risk.exit_pending_reconcile = False
                risk.exit_blocked_dust = False
                risk.on_market_exit(resolved_slug, None, forced=True, reason="desync_heal")
                risk.on_close()
                logging.info("[EXIT_CLEAR] position cleared after reconcile")
                return actual_available, "clear"
            if actual_available < local_sz - eps:
                risk.last_reconcile_status = "shrink"
                logging.info(f"[RECONCILE] token={token_id[:24]}... actual={actual_available:.4f} local={local_sz:.4f} open_orders={open_orders_size:.4f} action=shrink")
                posm.size = actual_available
                ledger.size = actual_available
                if getattr(posm, "closing", False):
                    posm.closing = False
                return actual_available, "shrink"
            risk.last_reconcile_status = "keep"
            logging.info(f"[RECONCILE] token={token_id[:24]}... actual={actual_available:.4f} local={local_sz:.4f} open_orders={open_orders_size:.4f} action=keep")
            return actual_available, "keep"

        async def exit_in_slices(token: str, target_size: float) -> tuple[bool, float, float]:
            remaining = target_size
            total_notional = 0.0
            total_filled = 0.0
            total_fee = 0.0
            slices_done = 0

            # Dust: do not send micro-orders; clear locally
            if remaining < exit_dust_threshold:
                logging.info(f"[EXIT] remaining below dust threshold -> stop slicing and clear tail (remaining={remaining:.4f} threshold={exit_dust_threshold})")
                posm.clear()
                ledger.size = 0.0
                logging.info(f"[EXIT_DUST] remaining={remaining:.4f} threshold={exit_dust_threshold} -> cleared locally")
                return True, 0.0, 0.0

            while remaining > 1e-9:
                if slices_done >= exit_max_slices:
                    logging.info(f"[EXIT_STOP] reason=max_slices remaining={remaining:.4f}")
                    if remaining < exit_dust_threshold:
                        logging.info(f"[EXIT_DUST] remaining={remaining:.4f} threshold={exit_dust_threshold} -> cleared locally")
                        posm.clear()
                        ledger.size = 0.0
                        return True, 0.0, 0.0
                    if total_filled > 0:
                        avg_partial = total_notional / total_filled
                        ledger.partial_close(total_filled, avg_partial, total_fee)
                        posm.size = remaining
                    return False, 0.0, 0.0

                if remaining < exit_dust_threshold:
                    logging.info(f"[EXIT] remaining below dust threshold -> stop slicing and clear tail")
                    posm.clear()
                    ledger.size = 0.0
                    logging.info(f"[EXIT_DUST] remaining={remaining:.4f} threshold={exit_dust_threshold} -> cleared locally")
                    return True, 0.0, 0.0

                if not have_l1():
                    return False, 0.0, 0.0
                bid_pair = book[token]["bid"]
                if not bid_pair:
                    return False, 0.0, 0.0
                bid_px, bid_sz = float(bid_pair[0]), float(bid_pair[1])
                bid_liq = bid_liq_usd(token)
                if bid_liq < exit_min_notional_usd:
                    logging.info(f"[EXIT] bid liquidity too low for safe exit (bid_liq_usd={bid_liq:.2f} min={exit_min_notional_usd})")
                    logging.info(f"[EXIT_STOP] reason=low_bid_liquidity remaining={remaining:.4f}")
                    if total_filled > 0:
                        avg_partial = total_notional / total_filled
                        ledger.partial_close(total_filled, avg_partial, total_fee)
                        posm.size = remaining
                    risk.exit_blocked_dust = True
                    risk.exit_blocked_reason = "low_bid_liquidity"
                    risk.exit_blocked_ts = now_s()
                    risk.exit_blocked_size = remaining
                    logging.info("[EXIT_DUST_GUARD] residual not executable remaining=%.4f min_size=%.4f max_slice_by_book=%.4f bid_liq_usd=%.2f", remaining, exit_min_size, bid_sz * exit_max_book_share, bid_liq)
                    return False, 0.0, 0.0
                max_slice_by_book = bid_sz * exit_max_book_share
                slice_sz = min(remaining, max_slice_by_book)
                if max_slice_by_book < exit_min_size:
                    logging.info(f"[EXIT] bid depth too small for safe exit slice (max_slice_by_book={max_slice_by_book:.4f} min={exit_min_size})")
                    logging.info(f"[EXIT_STOP] reason=low_bid_depth remaining={remaining:.4f}")
                    if total_filled > 0:
                        avg_partial = total_notional / total_filled
                        ledger.partial_close(total_filled, avg_partial, total_fee)
                        posm.size = remaining
                    risk.exit_blocked_dust = True
                    risk.exit_blocked_reason = "low_bid_depth"
                    risk.exit_blocked_ts = now_s()
                    risk.exit_blocked_size = remaining
                    logging.info("[EXIT_DUST_GUARD] residual not executable remaining=%.4f min_size=%.4f max_slice_by_book=%.4f bid_liq_usd=%.2f", remaining, exit_min_size, max_slice_by_book, bid_liq)
                    return False, 0.0, 0.0
                if slice_sz < exit_min_size:
                    # treat as dust: stop slicing
                    if remaining < exit_dust_threshold:
                        logging.info(f"[EXIT_DUST] remaining={remaining:.4f} threshold={exit_dust_threshold} -> cleared locally")
                        posm.clear()
                        ledger.size = 0.0
                        return True, 0.0, 0.0
                    logging.info(f"[EXIT_STOP] reason=slice_below_min_size remaining={remaining:.4f}")
                    if total_filled > 0:
                        avg_partial = total_notional / total_filled
                        ledger.partial_close(total_filled, avg_partial, total_fee)
                        posm.size = remaining
                    risk.exit_blocked_dust = True
                    risk.exit_blocked_reason = "slice_below_min_size"
                    risk.exit_blocked_ts = now_s()
                    risk.exit_blocked_size = remaining
                    logging.info("[EXIT_DUST_GUARD] residual not executable remaining=%.4f min_size=%.4f max_slice_by_book=%.4f bid_liq_usd=%.2f", remaining, exit_min_size, max_slice_by_book, bid_liq)
                    return False, 0.0, 0.0
                if not _is_size_tradeable(slice_sz):
                    logging.info(f"[ORDER_GUARD] skip sell: size below exchange minimum (slice_sz={slice_sz:.4f} min={exit_min_size})")
                    if remaining < exit_dust_threshold:
                        posm.clear()
                        ledger.size = 0.0
                        return True, 0.0, 0.0
                    if total_filled > 0:
                        avg_partial = total_notional / total_filled
                        ledger.partial_close(total_filled, avg_partial, total_fee)
                        posm.size = remaining
                    risk.exit_blocked_dust = True
                    risk.exit_blocked_reason = "below_exchange_min_size"
                    risk.exit_blocked_ts = now_s()
                    risk.exit_blocked_size = remaining
                    logging.info("[EXIT_DUST_GUARD] residual not executable remaining=%.4f min_size=%.4f max_slice_by_book=%.4f bid_liq_usd=%.2f", remaining, exit_min_size, max_slice_by_book, bid_liq)
                    return False, 0.0, 0.0

                logging.info(f"[EXIT_SLICE] remaining={remaining:.4f} bid_px={bid_px:.4f} bid_sz={bid_sz:.4f} slice_sz={slice_sz:.4f} bid_liq_usd={bid_liq:.2f}")
                res = await execu.ioc_sell(token, bid_price=bid_px, size=slice_sz)
                if not res.get("success"):
                    exit_state["consecutive_failures"] += 1
                    if res.get("ambiguous"):
                        exit_state["consecutive_ambiguous"] += 1
                    needs_reconcile = res.get("needs_reconcile") or res.get("ambiguous") or res.get("reason") == "not_enough_balance"
                    if needs_reconcile:
                        exit_state["last_unclear"] = True
                        exit_state["reconcile_retries"] += 1
                        if res.get("reason") == "not_enough_balance" and posm.open_ts and (now_s() - posm.open_ts) < 120:
                            logging.info("[EXIT_GUARD] probable settlement lag after buy")
                            risk.exit_pending_reconcile = True
                            risk.exit_settlement_block_until = now_s() + risk.exit_settlement_grace_sec
                        logging.info(f"[EXIT_RESULT] ambiguous/fail needs_reconcile (reconcile_retries={exit_state['reconcile_retries']})")
                        if exit_state["reconcile_retries"] > exit_max_reconcile_retries:
                            logging.info("[EXIT_HARD_STOP] reason=reconcile_retry_limit")
                            posm.closing = False
                            if total_filled > 0:
                                avg_partial = total_notional / total_filled
                                ledger.partial_close(total_filled, avg_partial, total_fee)
                            posm.size = remaining
                            return False, 0.0, 0.0
                        actual, action = await reconcile_position_from_exchange(token)
                        if action in ("clear", "clear_local"):
                            logging.info(f"[EXIT_STATE] remaining_local={remaining:.4f} remaining_actual=0 retry=cleared action={action}")
                            avg_px = total_notional / total_filled if total_filled > 0 else 0.0
                            return True, avg_px, total_fee
                        if action == "shrink" and actual is not None:
                            remaining = actual
                            logging.info(f"[EXIT_STATE] remaining_local={posm.size:.4f} remaining_actual={remaining:.4f} retry=reconciled")
                            continue
                    posm.size = remaining
                    if total_filled > 0 and remaining > 1e-9:
                        if remaining < exit_dust_threshold:
                            logging.info(f"[EXIT_DUST] remaining={remaining:.4f} threshold={exit_dust_threshold} -> cleared locally")
                            posm.clear()
                            ledger.size = 0.0
                            return True, 0.0, 0.0
                        logging.info(f"[EXIT] partial exit: sold {total_filled:.4f}, remaining={remaining:.4f} -> retry later")
                    return False, 0.0, 0.0
                filled = float(res.get("filled_size") or 0.0)
                px = float(res.get("avg_price") or bid_px)
                fee_slice = float(res.get("fee") or 0.0)
                total_notional += filled * px
                total_filled += filled
                total_fee += fee_slice
                remaining -= filled
                slices_done += 1
                logging.info(f"[EXIT_SLICE_FILL] filled={filled:.4f} px={px:.4f} fee={fee_slice:.4f} remaining={remaining:.4f}")
                if filled > 0:
                    ledger.partial_close(filled, px, fee_slice)
                    posm.size = remaining
                if remaining < exit_dust_threshold:
                    logging.info(f"[EXIT_DUST] remaining={remaining:.4f} threshold={exit_dust_threshold} -> cleared locally")
                    posm.clear()
                    ledger.size = 0.0
                    logging.info(f"[EXIT_STATE] filled={total_filled:.4f} remaining={remaining:.4f} dust=cleared cleared=True")
                    avg_px = total_notional / total_filled if total_filled > 0 else 0.0
                    return True, avg_px, total_fee
                if filled > 0 and remaining > 1e-9:
                    delay = cfg.exit_slice_delay_sec
                    await asyncio.sleep(max(0.05, delay))
            logging.info(f"[EXIT_STATE] filled={total_filled:.4f} remaining={remaining:.4f} dust=no cleared=True")
            avg_px = total_notional / total_filled if total_filled > 0 else 0.0
            return True, avg_px, total_fee

        def _check_pos_ledger_sync():
            if not posm.has_pos():
                return
            eps = 1e-6
            if posm.size < 0 or ledger.size < 0 or abs(posm.size - ledger.size) > eps:
                logging.warning(
                    "[STATE_DESYNC] posm.size=%.6f ledger.size=%.6f",
                    posm.size, ledger.size,
                )

        async def attempt_close(reason: str):
            if not posm.has_pos() or posm.closing:
                return
            token = posm.pos_token
            _check_pos_ledger_sync()
            ledger_sz = getattr(ledger, "size", 0) or 0
            if ledger_sz <= position_dust_eps and posm.size > position_dust_eps:
                await reconcile_position_from_exchange(token)
                if not posm.has_pos():
                    return
            if risk.exit_blocked_dust:
                if ledger_sz <= position_dust_eps and posm.size > 0:
                    await reconcile_position_from_exchange(token)
                    if not posm.has_pos():
                        return
                now = now_s()
                if (now - risk.exit_blocked_ts) < exit_dust_recheck_sec:
                    if (now - getattr(risk, "_exit_dust_guard_log_ts", 0)) >= exit_dust_log_interval_sec:
                        risk._exit_dust_guard_log_ts = now
                        logging.info("[EXIT_GUARD] blocked: residual tail still unexecutable remaining=%.4f reason=%s", risk.exit_blocked_size, risk.exit_blocked_reason)
                    return
                risk.exit_blocked_dust = False
                risk.exit_blocked_reason = ""
            if not book_fresh(token):
                return

            if book[token]["bid"] is None:
                return

            if bid_liq_usd(token) < exit_min_liq:
                logging.warning(f"[LIQ] exit bid liq low token={token[:20]}... ${bid_liq_usd(token):.2f}")
                return

            if exit_state["last_unclear"]:
                await reconcile_position_from_exchange(token)
                exit_state["last_unclear"] = False
                if not posm.has_pos():
                    risk.exit_in_progress = False
                    risk.exit_pending_reconcile = False
                    logging.info("[EXIT_CLEAR] position cleared by pre-attempt reconcile")
                    return

            risk.exit_in_progress = True
            risk.exit_started_ts = now_s()
            posm.closing = True
            logging.info(f"[EXIT_ATTEMPT] side=SELL token={token[:24]}... local_size={posm.size:.4f} reason={reason}")
            # If we just opened, wait for exchange to credit outcome tokens (avoids first SELL "not enough balance")
            post_buy_delay = cfg.post_buy_exit_delay_sec
            post_buy_wait_balance_sec = _safe_float(os.getenv("POST_BUY_WAIT_FOR_BALANCE_SEC"), 8.0)
            if posm.open_ts and post_buy_delay > 0:
                elapsed = now_s() - posm.open_ts
                if elapsed < post_buy_delay:
                    wait_s = post_buy_delay - elapsed
                    logging.info(f"[EXIT] waiting post-buy settlement delay {wait_s:.1f}s ...")
                    await asyncio.sleep(wait_s)
            # Optional: poll outcome balance until position is available (reduces "not enough balance" then reconcile)
            if posm.open_ts and post_buy_wait_balance_sec > 0 and (now_s() - posm.open_ts) < 60:
                deadline_bal = now_s() + post_buy_wait_balance_sec
                expected = float(posm.size) * 0.99
                while now_s() < deadline_bal:
                    bal = await fetch_outcome_balance(token)
                    if bal is not None and bal >= expected:
                        logging.info(f"[EXIT] outcome balance ready actual={bal:.4f} expected~{posm.size:.4f}")
                        break
                    await asyncio.sleep(0.5)
            bid = book[token]["bid"][0]
            logging.info(f"[POS] EXIT({reason}) token={token} bid={bid:.3f} size={posm.size:.4f}")
            # Take-profit: try to exit via a GTC limit at mid to avoid crossing spread.
            limit_exit_enabled = cfg.limit_exit_enabled
            limit_exit_timeout = cfg.limit_exit_timeout_sec
            fees_in_ledger = False
            ok, avg_exit_px, exit_fee = False, 0.0, 0.0
            if limit_exit_enabled and reason == "take_profit":
                px_mid = mid(token)
                if px_mid and px_mid > 0 and _is_size_tradeable(posm.size):
                    oid = await execu.place_limit_order(token, float(px_mid), float(posm.size), SELL_SIDE)
                    if oid:
                        deadline = now_s() + float(limit_exit_timeout)
                        filled_sz = 0.0
                        avg_px_1 = 0.0
                        fee_1 = 0.0
                        last_info = None
                        while now_s() < deadline:
                            last_info = await execu.get_order_info(oid, side=SELL_SIDE)
                            if last_info:
                                filled_sz = float(last_info.get("filled_size") or 0.0)
                                st = str(last_info.get("status") or "").lower()
                                avg_px_1 = float(last_info.get("avg_price") or 0.0)
                                fee_1 = float(last_info.get("fee") or 0.0)
                                if ("fill" in st) or (filled_sz >= float(posm.size) * 0.999):
                                    break
                            await asyncio.sleep(0.2)
                        await execu.cancel_order(oid)
                        total_sz = float(posm.size)
                        filled_sz = float(filled_sz or 0.0)
                        if filled_sz >= total_sz * 0.999 and avg_px_1 > 0:
                            ok, avg_exit_px, exit_fee = True, avg_px_1, float(fee_1 or 0.0)
                        elif filled_sz > 0 and avg_px_1 > 0:
                            rem = max(0.0, total_sz - filled_sz)
                            ledger.partial_close(filled_sz, avg_px_1, float(fee_1 or 0.0))
                            posm.size = rem
                            ok2, avg2, fee2 = await exit_in_slices(token, rem)
                            fees_in_ledger = True
                            if ok2 and avg2 > 0:
                                avg_exit_px = (filled_sz * avg_px_1 + rem * avg2) / max(total_sz, 1e-9)
                                exit_fee = float(fee_1 or 0.0) + float(fee2 or 0.0)
                                ok = True
                            else:
                                ok, avg_exit_px, exit_fee = False, 0.0, 0.0
                        else:
                            ok, avg_exit_px, exit_fee = await exit_in_slices(token, posm.size)
                            fees_in_ledger = True
                    else:
                        ok, avg_exit_px, exit_fee = await exit_in_slices(token, posm.size)
                        fees_in_ledger = True
                else:
                    ok, avg_exit_px, exit_fee = await exit_in_slices(token, posm.size)
                    fees_in_ledger = True
            else:
                ok, avg_exit_px, exit_fee = await exit_in_slices(token, posm.size)
                fees_in_ledger = True
            if ok:
                ledger.close(avg_exit_px, exit_fee if not fees_in_ledger else 0.0)
                entry_type = getattr(posm, "entry_type", None)
                metrics.add_closed_trade(ledger, entry_type=entry_type)
                net = float(ledger.net_pnl())
                risk.on_trade_closed(net)
                risk.exit_in_progress = False
                risk.exit_pending_reconcile = False
                risk.last_close_token = token
                risk.last_close_ts = now_s()
                risk.last_close_pnl = net
                risk.on_market_exit(resolved_slug, net)
                posm.clear()
                risk.on_close()
                exit_state["consecutive_failures"] = 0
                exit_state["consecutive_ambiguous"] = 0
                exit_state["reconcile_retries"] = 0
                exit_state["last_unclear"] = False
                logging.info("[EXIT_RESULT] success")
                logging.info("[POS] closed OK")
            else:
                posm.closing = False
                logging.info("[EXIT_RESULT] fail")
                if risk.exit_blocked_dust:
                    logging.info("[EXIT_BLOCKED] residual_size=%.4f reason=%s", risk.exit_blocked_size, risk.exit_blocked_reason)
                logging.warning("[POS] close failed -> retry later")

        async def decide_and_trade(expected_gen=None):
            nonlocal last_decision_ts, last_warmup_log_ts, last_strat_debug_ts
            last_decision_ts = now_s()
            metrics.maybe_print_health(60.0, risk=risk, posm=posm, ledger=ledger)
            try:
                await _decide_and_trade_body(expected_gen)
            finally:
                risk._entry_in_flight = False

        async def _decide_and_trade_body(expected_gen=None):
            nonlocal last_warmup_log_ts, last_strat_debug_ts
            if expected_gen is not None and market_generation_id[0] != expected_gen:
                logging.info("[MARKET_GUARD] stale market generation ignored")
                return
            # shutdown: attempt close then stop
            if stop_evt.is_set():
                await attempt_close("shutdown")
                return

            if btc.last is None:
                metrics.set_skip_reason("no_btc")
                return

            # warmup gate: no trade until model ready
            warmup_elapsed = (now_s() - btc.start_ts) if btc.start_ts else 0
            sigma = btc.sigma_per_sqrt_sec()
            simple_mom_enabled = os.getenv("SIMPLE_MOM_STRAT", "1") == "1"
            simple_bypass_sigma = os.getenv("SIMPLE_MOM_BYPASS_SIGMA", "1") == "1"
            if warmup_elapsed < min_warmup_sec or (sigma < sigma_min and not (simple_mom_enabled and simple_bypass_sigma)):
                metrics.set_skip_reason("warmup")
                if now_s() - last_warmup_log_ts > 10.0:
                    last_warmup_log_ts = now_s()
                    logging.info(f"[WARMUP] elapsed={warmup_elapsed:.0f}s sigma={sigma:.2e} (need {min_warmup_sec}s, sigma>={sigma_min})")
                return

            if not have_l1():
                metrics.set_skip_reason("no_l1")
                return

            tte_s = tte()
            yes_bid = best_bid(yes_token)
            yes_ask = best_ask(yes_token)
            book_age_ms = (now_s() - book[yes_token]["ts"]) * 1000.0 if book[yes_token]["ts"] else 0.0
            feats.update_mid(now_s(), mid(yes_token))
            m = build_micro(yes_bid, yes_ask, ask_liq_usd(yes_token), book_age_ms, feats)

            # manage exits
            if posm.has_pos():
                token = posm.pos_token
                if not book_fresh(token):
                    return
                bid = best_bid(token)
                if bid is None:
                    return
                fast_exit_sec = float(os.getenv("FAST_EXIT_SEC", "35"))
                fast_exit_mom_bps = float(os.getenv("FAST_EXIT_MOM_BPS", "4.0"))
                min_hold_sec = float(os.getenv("MIN_HOLD_SEC", "15"))
                 # aggressive profit-taking: allow faster exits when pnl is high
                fast_tp_sec = float(os.getenv("FAST_TP_SEC", "10"))
                fast_tp_pct = float(os.getenv("FAST_TP_PCT", "0.3"))
                held_s = now_s() - (posm.open_ts or 0)
                # hard exit near expiry: always close within last X seconds of window
                force_exit_near_expiry_sec = float(os.getenv("FORCE_EXIT_NEAR_EXPIRY_SEC", "30"))
                if tte_s is not None and tte_s <= force_exit_near_expiry_sec:
                    await attempt_close("near_expiry")
                    return
                if m and held_s >= min_hold_sec and held_s <= fast_exit_sec:
                    side_val = posm.side_vs_yes(yes_token)
                    if side_val == "LONG_YES" and m.mom_bps <= -fast_exit_mom_bps:
                        logging.info("[EXIT] fast adverse (mom)")
                        posm._force_exit_reason = "fast_adverse"
                    elif side_val == "LONG_NO" and m.mom_bps >= fast_exit_mom_bps:
                        logging.info("[EXIT] fast adverse (mom)")
                        posm._force_exit_reason = "fast_adverse"
                # Side-aware: adverse = exit price dropped vs entry (both YES and NO: we sell at bid, loss when bid < entry)
                early_adverse_sec = float(os.getenv("EARLY_EXIT_ADVERSE_SEC", "15"))
                early_adverse_dol = float(os.getenv("EARLY_EXIT_ADVERSE_DOL", "0.06"))
                if (now_s() - (posm.open_ts or 0)) <= early_adverse_sec and not posm._force_exit_reason:
                    if (posm.entry_price - bid) >= early_adverse_dol:
                        logging.info(f"[EXIT] early adverse (bid {bid:.3f} vs entry {posm.entry_price:.3f})")
                        posm._force_exit_reason = "early_adverse"
                if posm._force_exit_reason:
                    await attempt_close(posm._force_exit_reason)
                    posm._force_exit_reason = None
                elif posm.should_exit_time():
                    await attempt_close("timeout")
                else:
                    # take-profit / stop-loss exits (limit exit only for take-profit)
                    pnl_pct = ((bid - posm.entry_price) / max(posm.entry_price, 1e-9)) if posm.entry_price > 0 else 0.0
                    logging.debug(f"[POS] hold={held_s:.0f}s pnl={pnl_pct:.2%} entry={posm.entry_price:.3f} bid={bid:.3f}")
                    # fast TP: если быстро получили высокий % профита — фиксируем
                    if held_s >= fast_tp_sec and pnl_pct >= fast_tp_pct:
                        await attempt_close("fast_take_profit")
                        return
                    if pnl_pct >= posm.take_profit_pct:
                        await attempt_close("take_profit")
                    elif pnl_pct <= -posm.stop_loss_pct:
                        await attempt_close("stop_loss")
                return

            # entries: single momentum strategy only
            max_entries_per_market = _safe_int(os.getenv("MAX_ENTRIES_PER_WINDOW"), 1)
            metrics.reset_market_entries(condition_id)
            if not metrics.can_enter_market(max_entries_per_market):
                metrics.set_skip_reason("entry_cap")
                metrics.add_reason("entry_cap")
                return
            ok, why = await risk.can_trade(resolved_slug)
            if not ok:
                metrics.set_skip_reason(why)
                if why not in ("balance_low", "exit_pending", "post_loss_cooldown", "same_market_position_open", "same_market_reentry_block", "market_entry_cap"):
                    metrics.add_reason(why)
                if why == "exit_pending":
                    logging.info("[ENTRY_GUARD] blocked: previous position not fully finalized")
                if why == "post_loss_cooldown":
                    logging.info("[ENTRY_GUARD] post-loss cooldown active")
                return

            if tte_s is not None and tte_s < cfg.entry_min_tte_sec:
                metrics.set_skip_reason("tte_low")
                return
            if tte_s is not None and tte_s < min_time_to_expiry:
                metrics.set_skip_reason("tte_low")
                return

            mom_threshold_pct = cfg.mom_threshold_pct
            entry_max_spread_bps = cfg.entry_max_spread_bps

            debug_strat = os.getenv("DEBUG_STRATEGY", "0") == "1"
            if debug_strat and (now_s() - last_strat_debug_ts) > 30.0:
                last_strat_debug_ts = now_s()
                mom_d = btc.move_pct(mom_lb_sec)
                tte_d = (tte_s if tte_s is not None else 0)
                print(f"STRAT tte={tte_d:.0f} mom={mom_d:.4%}", flush=True)

            async def try_entry_momentum() -> bool:
                metrics.entry_attempts += 1
                if _prom:
                    _prom["entry_attempts"].inc()
                mom = btc.move_pct(mom_lb_sec)
                if abs(mom) < mom_threshold_pct:
                    metrics.add_reason("no_mom")
                    return False
                want_yes = mom > 0
                token = yes_token if want_yes else no_token
                side = "YES" if want_yes else "NO"
                ask_p = book[token]["ask"]
                if not ask_p:
                    metrics.add_reason("no_book")
                    return False
                ask_px = float(ask_p[0])
                if ask_liq_usd(token) < min_liq:
                    metrics.add_reason("liq")
                    return False
                if ask_px < min_entry_price or ask_px > max_entry_price:
                    metrics.add_reason("price_extreme")
                    return False
                sp_bps = spread(token) * 10000.0 if spread(token) else 0.0
                if sp_bps > entry_max_spread_bps:
                    logging.info("[ENTRY_BLOCKED] reason=spread_too_wide spread_bps=%.1f max=%.1f", sp_bps, entry_max_spread_bps)
                    return False
                bid_p = book[token]["bid"]
                if not bid_p:
                    logging.info("[ENTRY_BLOCKED] reason=no_bid")
                    return False
                bid_px = float(bid_p[0])
                bid_sz = float(bid_p[1]) if len(bid_p) >= 2 else 0.0
                size_estimate = risk.max_usd_per_trade / max(ask_px, 1e-9)
                exit_ok, exit_reason = can_exit_position(size_estimate, bid_px, bid_sz, exit_min_size, exit_max_book_share, exit_min_notional_usd)
                if not exit_ok:
                    logging.info("[ENTRY_BLOCKED] reason=exit_not_viable detail=%s", exit_reason)
                    return False
                # Optional: require extra depth buffer so exit is more likely to fill (thin markets)
                entry_strict_exit = os.getenv("ENTRY_STRICT_EXIT_VIABILITY", "0") == "1"
                if entry_strict_exit and bid_sz < size_estimate * 1.2:
                    logging.info("[ENTRY_BLOCKED] reason=exit_not_viable detail=strict_depth (bid_sz=%.2f < 1.2*size_est=%.2f)", bid_sz, size_estimate * 1.2)
                    return False
                logging.info("[ENTRY_CHECK] signal=momentum exit_viable=True reason=ok side=%s mom=%.4f%%", side, mom * 100.0)
                res = await execu.ioc_buy(token, ask_px, risk.max_usd_per_trade)
                if res.get("success") and res.get("filled_size", 0) > 0:
                    entry_px = float(res.get("avg_price") or ask_px)
                    sz = res["filled_size"]
                    ledger.open(entry_px, sz, float(res.get("fee") or 0.0))
                    posm.open(token, sz, entry_px, entry_type="momentum")
                    metrics.record_market_entry()
                    risk.on_open()
                    risk.on_market_entry(resolved_slug, side, sz * entry_px)
                    metrics.entry_ok += 1
                    metrics.record_entry_type("momentum")
                    logging.info("[ENTRY] type=momentum side=%s px=%.4f size=%.4f tte=%.0fs", side, entry_px, sz, (tte_s if tte_s is not None else 0))
                    if _prom:
                        _prom["entry_ok"].inc()
                    return True
                return False

            await try_entry_momentum()
            metrics.maybe_print_health(60.0, risk=risk, posm=posm, ledger=ledger)
            prom_set_state(metrics, risk)

        async def debounce_scheduler():
            nonlocal consecutive_decision_errors
            expected_gen = market_generation_id[0]
            await asyncio.sleep(debounce_s)
            try:
                await decide_and_trade(expected_gen)
                consecutive_decision_errors = 0
            except Exception:
                consecutive_decision_errors += 1
                logging.exception("[DECIDE] task exception in debounce_scheduler (consecutive=%s)", consecutive_decision_errors)
                if consecutive_decision_errors >= DECISION_FAIL_FAST_LIMIT:
                    logging.critical("[DECIDE] FAIL-FAST: %s consecutive decision exceptions -> stopping bot", consecutive_decision_errors)
                    session_stop.set()
                    stop_evt.set()

        def schedule_decision():
            nonlocal debounce_task
            if debounce_task is not None and not debounce_task.done():
                return
            debounce_task = asyncio.create_task(debounce_scheduler())

        def _merge_px_sz(new_pair, old_pair):
            """WS updates price only; preserve size from REST/book."""
            if not new_pair:
                return old_pair
            px = float(new_pair[0])
            sz = float(new_pair[1]) if len(new_pair) >= 2 and new_pair[1] else 0.0
            if sz <= 0 and old_pair and len(old_pair) >= 2:
                sz = float(old_pair[1])
            return (px, sz)

        def on_poly_msg(msg) -> bool:
            """Process one WS msg, update book. Returns True if book updated."""
            nonlocal book_updated_once
            updated = False
            msgs = msg if isinstance(msg, list) else [msg]
            debug_ws = os.getenv("DEBUG_WS", "0") == "1"
            for m in msgs:
                if isinstance(m, dict):
                    et = m.get("event_type")
                    if et is not None and et not in ("price_changes", "book", "best_prices"):
                        continue
                parsed = parse_book_msg(m)
                if parsed:
                    asset_id, top_bid, top_ask = parsed
                    if asset_id in book:
                        if top_bid:
                            book[asset_id]["bid"] = _merge_px_sz(top_bid, book[asset_id]["bid"])
                        if top_ask:
                            book[asset_id]["ask"] = _merge_px_sz(top_ask, book[asset_id]["ask"])
                        if top_bid or top_ask:
                            book[asset_id]["ts"] = now_s()
                            updated = True
                            if not book_updated_once:
                                book_updated_once = True
                                logging.info(f"[WS] first book update asset={asset_id[:20]}... bid={book[asset_id]['bid']} ask={book[asset_id]['ask']}")
                    continue
                if isinstance(m, dict) and "price_changes" in m:
                    if debug_ws and (poly_stats.get("in", 0) % 200 == 1):
                        logging.debug(f"[WS] price_changes sample: {json.dumps(m)[:300]}")
                    for aid, tb, ta in parse_price_changes(m):
                        if aid in book:
                            if tb:
                                book[aid]["bid"] = _merge_px_sz(tb, book[aid]["bid"])
                            if ta:
                                book[aid]["ask"] = _merge_px_sz(ta, book[aid]["ask"])
                            if tb or ta:
                                book[aid]["ts"] = now_s()
                                updated = True
            return updated

        async def poly_consumer():
            while not session_stop.is_set():
                try:
                    msg = await asyncio.wait_for(poly_q.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                if on_poly_msg(msg) and (now_s() - last_decision_ts) >= debounce_s:
                    schedule_decision()

        async def wsq_logger():
            last = 0.0
            while not session_stop.is_set():
                await asyncio.sleep(5)
                if session_stop.is_set():
                    break
                if now_s() - last >= 4.9:
                    last = now_s()
                    logging.info(f"[WSQ] in={poly_stats.get('in',0)} drop={poly_stats.get('drop',0)} qsize={poly_q.qsize()}")

    # background tasks
        asset_ids = [yes_token, no_token]
        tasks = [
            asyncio.create_task(btc_ws_loop(btc, session_stop)),
            asyncio.create_task(risk.background_updater(session_stop)),
            asyncio.create_task(poll_l1_books(
                client, [yes_token, no_token], book, session_stop, l1_poll_sec,
                market_expired_evt=market_expired_evt,
            )),
            asyncio.create_task(poly_ws_producer(asset_ids, session_stop, poly_q, poly_stats)),
            asyncio.create_task(poly_consumer()),
            asyncio.create_task(wsq_logger()),
        ]

        async def wait_for_session_end():
            stop_task = asyncio.create_task(session_stop.wait())
            exp_task = asyncio.create_task(market_expired_evt.wait())
            done, _ = await asyncio.wait(
                [stop_task, exp_task],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for t in (stop_task, exp_task):
                t.cancel()

        await wait_for_session_end()

        if stop_evt.is_set():
            session_stop.set()
            await decide_and_trade()
        if market_expired_evt.is_set():
            session_stop.set()
            if posm.has_pos():
                await attempt_close("market_expired")
            logging.info("[MARKET] expired (404) -> refreshing to next window")

        # session cleanup
        session_stop.set()
        prop_task.cancel()
        try:
            await prop_task
        except asyncio.CancelledError:
            pass
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

        await attempt_close("finalize")

        if stop_evt.is_set():
            break
        # Only auto-refresh to next market when slug=auto; explicit slug -> exit on 404
        if slug.strip() not in ("", "auto", "btc-5m", "btc-updown-5m", "btc-updown"):
            logging.info("[BOT] explicit slug + market expired -> exit (no auto-refresh)")
            break
        await asyncio.sleep(2)

    logging.info("[BOT] stopped")

if __name__ == "__main__":
    print("BOOT: __main__", flush=True)
    slug = os.getenv("MARKET_SLUG")
    if not slug:
        raise SystemExit("Set MARKET_SLUG env var.")
    print("BOOT: starting asyncio.run(run_bot)", flush=True)
    asyncio.run(run_bot(slug))
