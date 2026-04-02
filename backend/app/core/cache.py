import json
import threading
import time
from typing import Any

from app.core.config import config

try:
    import redis
except Exception:  # pragma: no cover
    redis = None


class Cache:
    """Redis when configured; otherwise in-process TTL cache."""

    def __init__(self) -> None:
        self._memory: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()
        self.client = None
        if redis and config.REDIS_URL:
            try:
                self.client = redis.from_url(config.REDIS_URL, decode_responses=True)
                self.client.ping()
            except Exception:
                self.client = None

    def get_json(self, key: str) -> Any | None:
        """Retrieve JSON value from cache."""
        if self.client:
            value = self.client.get(key)
            return json.loads(value) if value else None
        with self._lock:
            entry = self._memory.get(key)
            if not entry:
                return None
            exp, val = entry
            if time.time() >= exp:
                del self._memory[key]
                return None
            return val

    def set_json(self, key: str, value: Any, ttl: int = 60) -> None:
        """Store JSON value in cache with TTL."""
        if self.client:
            self.client.setex(key, ttl, json.dumps(value))
            return
        with self._lock:
            self._memory[key] = (time.time() + ttl, json.loads(json.dumps(value)))

    def delete(self, key: str) -> None:
        """Delete a single cache key."""
        if self.client:
            self.client.delete(key)
            return
        with self._lock:
            self._memory.pop(key, None)

    def delete_prefix(self, prefix: str) -> None:
        """Delete all keys matching a prefix."""
        if self.client:
            cursor = 0
            while True:
                cursor, keys = self.client.scan(cursor=cursor, match=f"{prefix}*", count=100)
                if keys:
                    self.client.delete(*keys)
                if cursor == 0:
                    break
            return
        with self._lock:
            for k in list(self._memory):
                if k.startswith(prefix):
                    del self._memory[k]


cache = Cache()
