from pydantic import BaseModel


class RankingItem(BaseModel):
    rank: int
    user_id: int
    user_nickname: str
    meaningful_songs_count: int
    reward_credits: float = 0.0
    reward_type: str | None = None  # top3 / top10 / None

    model_config = {"from_attributes": True}


class DistributeRewardsRequest(BaseModel):
    year_month: str  # 格式: YYYY-MM
