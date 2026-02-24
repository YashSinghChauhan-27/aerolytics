import torch
from pytorch_forecasting import TemporalFusionTransformer
from pathlib import Path

MODEL_PATH = Path("app/models/tft_model.ckpt")

print("Loading TFT model from checkpoint...")

tft_model = TemporalFusionTransformer.load_from_checkpoint(
    MODEL_PATH,
    map_location=torch.device("cpu")
)

tft_model.eval()

print("TFT model loaded successfully")
