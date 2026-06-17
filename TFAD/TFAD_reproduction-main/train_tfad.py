"""
TFAD 训练脚本 —— 适配小数据集的定制版本
使用自采集的 Prometheus 监控数据（Grafana CSV 导出）
"""
import os, sys, csv
from pathlib import Path
from datetime import datetime
import numpy as np
import torch
from torch import nn
import pytorch_lightning as pl
from pytorch_lightning import Trainer
from pytorch_lightning.loggers import TensorBoardLogger
from tfad.ts import TimeSeries, TimeSeriesDataset
from tfad.ts import transforms as tr
from tfad.model import TFAD, TFADDataModule
from tfad.model.distances import LpDistance

# ===== 配置 =====
PROJECT_ROOT = Path(r"D:\桌面文件夹\软件SRE\major_assignment\TFAD_reproduction")
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "output"

CHAOS_WINDOWS = {
    "cpu-stress": [
        (datetime(2026, 6, 8, 18, 49, 0), datetime(2026, 6, 8, 18, 53, 0)),
    ],
    "network-delay": [
        (datetime(2026, 6, 8, 18, 34, 0), datetime(2026, 6, 8, 18, 39, 0)),
    ],
    "pod-kill": [
        (datetime(2026, 6, 8, 18, 24, 0), datetime(2026, 6, 8, 18, 27, 0)),
    ],
}

WINDOW_LENGTH = 12
SUSPECT_LENGTH = 3
EPOCHS = 5
TCN_KERNEL = 3
TCN_LAYERS = 2
TCN_CHANNELS = 4
EMBED_DIM = 16
BATCH_SIZE = 4
CROPS_PER = 4

def load_csv_as_timeseries(csv_path, chaos_windows):
    """读取 Grafana CSV -> TimeSeriesDataset, 每列一条单变量 TimeSeries"""
    with open(csv_path, encoding="utf-8-sig") as f:
        rows = [row for row in csv.reader(f) if any(row)]
    if not rows:
        return TimeSeriesDataset()
    header = rows[0]
    data_rows = rows[1:]
    timestamps = []
    for row in data_rows:
        try:
            ts = datetime.strptime(row[0].strip(), "%Y-%m-%d %H:%M:%S")
            timestamps.append(ts)
        except ValueError:
            timestamps.append(None)
    dataset = TimeSeriesDataset()
    for col_idx in range(1, len(header)):
        metric_name = header[col_idx].strip()
        values_list = []
        ts_list = []
        for i, row in enumerate(data_rows):
            if timestamps[i] is None:
                continue
            val_str = row[col_idx].strip() if col_idx < len(row) else ""
            if not val_str:
                continue
            try:
                val = float(val_str)
                values_list.append(val)
                ts_list.append(timestamps[i])
            except ValueError:
                continue
        if len(values_list) < 8:
            continue
        arr = np.array(values_list, dtype=np.float32)
        if arr.std() < 1e-6:
            continue
        labels = np.zeros(len(values_list), dtype=np.float32)
        for w_start, w_end in chaos_windows:
            for j, t in enumerate(ts_list):
                if w_start <= t <= w_end:
                    labels[j] = 1.0
        dataset.append(TimeSeries(
            values=arr.reshape(-1, 1),
            labels=labels,
            item_id=f"{csv_path.parent.name}_{metric_name}",
        ))
    return dataset

def load_all_data():
    all_data = TimeSeriesDataset()
    for exp_name, windows in CHAOS_WINDOWS.items():
        exp_dir = DATA_DIR / exp_name
        if not exp_dir.exists():
            continue
        csv_files = list(exp_dir.glob("*.csv"))
        print(f"\n[{exp_name}] {len(csv_files)} CSV files")
        for csv_file in csv_files:
            ds = load_csv_as_timeseries(csv_file, windows)
            if len(ds) > 0:
                for ts in ds:
                    all_data.append(ts)
                print(f"  {csv_file.name}: +{len(ds)} series")
    print(f"\nTotal: {len(all_data)} TimeSeries")
    return all_data

def main():
    print("=" * 50)
    print("Step 1: Load data")
    full_dataset = load_all_data()
    if len(full_dataset) == 0:
        print("ERROR: No data loaded!")
        return
    lengths = [len(ts) for ts in full_dataset]
    n_anom = sum(int(ts.labels.sum()) for ts in full_dataset)
    print(f"  Series: {len(full_dataset)}, len=[{min(lengths)},{max(lengths)}]")
    print(f"  Anomaly points: {n_anom}")

    print("\nStep 2: Standardize")
    scaler = tr.TimeSeriesScaler(type="robust")
    full_dataset = TimeSeriesDataset(list(scaler(full_dataset)))

    print("\nStep 3: Split train/val/test (sequential)")
    from tfad.ts import split_train_val_test
    train_set, val_set, test_set = split_train_val_test(
        data=full_dataset, val_portion=0.25, test_portion=0.25,
        split_method="sequential",
    )
    print(f"  train={len(train_set)} val={len(val_set)} test={len(test_set)}")

    print("\nStep 4: DataModule")
    data_module = TFADDataModule(
        train_ts_dataset=train_set,
        validation_ts_dataset=val_set if len(val_set) > 0 else None,
        test_ts_dataset=test_set if len(test_set) > 0 else None,
        window_length=WINDOW_LENGTH,
        suspect_window_length=SUSPECT_LENGTH,
        num_series_in_train_batch=min(BATCH_SIZE, len(train_set)),
        num_crops_per_series=CROPS_PER,
        label_reduction_method="any",
        stride_val_test=1,
        num_workers=0,
    )

    print("\nStep 5: Model")
    model = TFAD(
        ts_channels=1, window_length=WINDOW_LENGTH,
        suspect_window_length=SUSPECT_LENGTH,
        tcn_kernel_size=TCN_KERNEL, tcn_layers=TCN_LAYERS,
        tcn_out_channels=TCN_CHANNELS,
        tcn_maxpool_out_channels=TCN_CHANNELS,
        embedding_rep_dim=EMBED_DIM,
        normalize_embedding=True,
        distance=LpDistance(p=2),
        classification_loss=nn.BCELoss(),
        classifier_threshold=0.5,
        threshold_grid_length_val=0.10,
        threshold_grid_length_test=0.05,
        hp_lamb=6400, weight_fft_branch=0.001,
        coe_rate=0.0, mixup_rate=0.0,
        slow_slop=0.0, fft_sea_rate=0.0, fft_noise_rate=0.0,
        stride_rolling_val_test=1,
        val_labels_adj=False, test_labels_adj=False,
        max_windows_unfold_batch=2000,
        learning_rate=0.001,
    )

    print("\nStep 6: Train ({} epochs, CPU)".format(EPOCHS))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger = TensorBoardLogger(save_dir=str(OUTPUT_DIR / "logs"), name="tfad_small")
    trainer = Trainer(
        accelerator="cpu", devices=1,
        max_epochs=EPOCHS,
        default_root_dir=str(OUTPUT_DIR),
        logger=logger,
        check_val_every_n_epoch=1,
        num_sanity_val_steps=0,
        enable_model_summary=False,
    )
    trainer.fit(model=model, datamodule=data_module)

    print("\nStep 7: Test")
    if len(test_set) > 0:
        results = trainer.test(model=model, datamodule=data_module)
        if results:
            r = results[0]
            print("\n" + "=" * 50)
            print("Final results:")
            for k, v in sorted(r.items()):
                if isinstance(v, float):
                    print(f"  {k}: {v:.4f}")
            print("=" * 50)

if __name__ == "__main__":
    main()
