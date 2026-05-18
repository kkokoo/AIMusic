from app.adapters.base import BaseAdapter


class MockMusicAdapter(BaseAdapter):

    def build_request(self, task_params: dict) -> dict:
        return task_params

    def parse_response(self, response_data: dict) -> dict:
        audio_url = response_data.get("audio_url", "/uploads/sample.mp3")
        duration = response_data.get("actual_duration_sec", response_data.get("duration_sec", 30))
        error = response_data.get("error")
        return {
            "audio_url": audio_url,
            "duration": duration,
            "error": error,
        }