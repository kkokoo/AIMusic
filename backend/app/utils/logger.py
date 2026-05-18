import logging
import sys


LOG_FORMAT = "[%(asctime)s] %(levelname)-7s %(name)s | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

_logging_initialized = False


def setup_logging(
    level: int = logging.INFO,
    module_levels: dict[str, int] | None = None,
) -> None:
    global _logging_initialized
    if _logging_initialized:
        return

    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        datefmt=LOG_DATE_FORMAT,
        stream=sys.stdout,
    )

    default_levels: dict[str, int] = {
        "aimusic.generation": logging.DEBUG,
        "sqlalchemy.engine": logging.WARNING,
        "uvicorn.access": logging.WARNING,
    }
    if module_levels:
        default_levels.update(module_levels)

    for name, lvl in default_levels.items():
        logging.getLogger(name).setLevel(lvl)

    _logging_initialized = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"aimusic.{name}")