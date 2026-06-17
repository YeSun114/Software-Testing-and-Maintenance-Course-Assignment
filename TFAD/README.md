# 软件维护与测试大作业

## 项目简介

本项目基于 SockShop 微服务系统，完成了以下工作：

- 部署 SockShop 微服务及监控系统
- 复现 TFAD 论文并进行故障注入实验（CPU 压力、网络延迟、Pod 杀死三类故障）

## 核心工作流程

```

部署 SockShop 微服务 + 监控系统 → 注入三类故障
 → TFAD 异常检测→ 输出诊断结果
```

## 项目结构

```
大作业/
├── README.md
├── Jmeter/                    # JMeter 并发测试
│   ├── 10users_10s_10times.jmx
│   ├── 50users_20s_20times.jmx
│   ├── 100users_30s_30times.jmx
│   ├── results_sockshop_10users/
│   ├── results_sockshop_50users/
│   └── results_sockshop_100users/
├── Selenuim/                  # Selenium 模拟用户浏览
│   └── browse/
├── TFAD_reproduction-main/    # 论文相关
│   ├── CIKM22-TFAD/
│   ├── chaos/                 # 三类故障配置
│   │   ├── cpu-stress.yaml
│   │   ├── network-delay.yaml
│   │   └── pod-kill.yaml
│   ├── data/                  # 测试数据
│   ├── paper/
│   └── train_tfad.py
└── microservices-demo/        # SockShop 微服务项目
```

## 环境要求

- Conda 环境
- Python 3.8
- Minikube
- Docker

## SockShop 部署

进入目录：

```bash
cd microservices-demo
```

启动微服务：

```bash
minikube start
```

执行命令创建命名空间并且注入资源：

```bash
kubectl create -f deploy/kubernetes/manifests/00-sock-shop-ns.yaml -f deploy/kubernetes/manifests
```

注入监控资源：

```bash
kubectl create -f ./deploy/kubernetes/manifests-monitoring
```

## Selenium 模拟用户浏览

在 Selenuim 目录下

## JMeter 测试并发访问

在 Jmeter 目录下

## 论文相关

在 TFAD\_reproduction-main 目录下，三类故障在 chaos 目录下

## 论文参考

Chaoli Zhang, Tian Zhou, Qingsong Wen, Liang Sun, "TFAD: A Decomposition Time Series Anomaly Detection Architecture with Time-Freq Analysis,” in Proc. 31st ACM International Conference on Information and Knowledge Management (CIKM 2022), Atlanta, GA, Oct. 2022.
