from abc import ABC, abstractmethod


class BaseAdapter(ABC):

    @abstractmethod
    def build_request(self, task_params: dict) -> dict:
        raise NotImplementedError

    @abstractmethod
    def parse_response(self, response_data: dict) -> dict:
        raise NotImplementedError