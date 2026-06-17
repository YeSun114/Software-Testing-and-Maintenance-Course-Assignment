"""
Compatibility wrapper for this course project.

The maintained converter lives in the project root as data_prepare.py because
it needs to read ../collected-data and then generate both root-level and
Nezha-main-level data. Run this file from Nezha-main if you prefer the original
Nezha workflow:

    python data_prepare.py
"""

import os
import runpy
import shutil


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ROOT_CONSTRUCT = os.path.join(PROJECT_ROOT, "construct_data")
ROOT_RCA = os.path.join(PROJECT_ROOT, "rca_data")


def copy_tree(src, dst):
    os.makedirs(dst, exist_ok=True)
    for name in os.listdir(src):
        src_path = os.path.join(src, name)
        dst_path = os.path.join(dst, name)
        if os.path.isdir(src_path):
            copy_tree(src_path, dst_path)
        else:
            shutil.copy2(src_path, dst_path)


if __name__ == "__main__":
    root_converter = os.path.join(PROJECT_ROOT, "data_prepare.py")
    runpy.run_path(root_converter, run_name="__main__")
    copy_tree(ROOT_CONSTRUCT, os.path.join(SCRIPT_DIR, "construct_data"))
    copy_tree(ROOT_RCA, os.path.join(SCRIPT_DIR, "rca_data"))
    print("Synced generated construct_data/ and rca_data/ into Nezha-main.")
