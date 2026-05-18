from app.adapters.base import BaseAdapter
from app.adapters.mock import MockMusicAdapter

adapter_registry: dict[str, type[BaseAdapter]] = {
    "mock": MockMusicAdapter,
}

__all__ = ["BaseAdapter", "MockMusicAdapter", "adapter_registry"]