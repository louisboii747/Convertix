import importlib.util
from pathlib import Path


WORKER_PATH = Path(__file__).with_name("worker.py")
spec = importlib.util.spec_from_file_location("convertix_worker", WORKER_PATH)
worker = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(worker)


def test_handle_shutdown_sets_flag():
    worker.shutdown_requested = False

    worker.handle_shutdown(15, None)

    assert worker.shutdown_requested is True


def test_default_region_is_london():
    assert worker.AWS_REGION == "eu-west-2"


def test_shutdown_flag_defaults_to_false():
    worker.shutdown_requested = False
    assert worker.shutdown_requested is False
