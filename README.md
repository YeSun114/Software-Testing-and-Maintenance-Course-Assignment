# Nezha算法的复现与智能运维Agent的构建

本项目围绕 **Online Boutique** 微服务系统，实现了从部署、监控、故障注入到智能根因分析的全流程，成功复现了论文中的nezha算法，并将其与 LLM Agent 结合，构建了一个可自主推理的智能运维智能体。

## 项目结构

```
├── agent/                             # Agent 核心代码
│   ├── aiops_agent.py                 # LLM Agent（Function Calling）
│   ├── aiops_agent_daemon.py          # 守护进程（每10s巡检）
│   ├── config.yaml                    # 统一配置
│   └── requirements.txt               # Python 依赖
├── algorithm/Nezha-main/              # Nezha 算法源码
│   ├── main.py                        # RCA pipeline 入口
│   ├── data_integrate.py              # 多模态数据集成
│   ├── pattern_miner.py               # gSpan 频繁子图挖掘
│   ├── pattern_ranker.py              # 双排序器根因定位
│   ├── alarm.py                       # k-σ 异常检测
│   └── log_parsing.py                 # Drain 日志解析
├── Augmented-OnlineBoutique-master/   # 增强版 Online Boutique
│   └── src/                           # 微服务源码（含5个自研服务）
└── chaos/                             # 故障注入 YAML
```

## 环境要求

- **Docker Desktop** 正常运行
- **Minikube** + **kubectl**（profile 名称固定为 `nezha`）
- **Conda** 环境 `nezha`（Python 3.9）

## 快速开始

### 1. 启动 Docker Desktop 和 Minikube

```powershell
minikube start -p nezha
```

### 2. 部署微服务集群

完整部署步骤详见 `docs/操作指南.md`，简要流程如下：

```powershell
# 安装 Istio + 标注 namespace
istioctl install --set profile=default -y
kubectl create namespace hipster
kubectl label namespace hipster istio-injection=enabled

# 部署服务
kubectl apply -f Augmented-OnlineBoutique-master/kubernetes-manifests/

# 检查 Pod 状态（全部 Running 即可）
kubectl get pods -n hipster
```

### 3. 端口转发 & 访问前端

```powershell
kubectl port-forward svc/frontend-external -n hipster 18081:80
```

浏览器打开 `http://localhost:18081`。

### 4. 安装依赖并启动 Agent

```powershell
conda activate nezha
pip install -r requirements.txt

# 设置 API Key 并启动守护进程
$env:OPENAI_API_KEY="sk-your-key"
python aiops_agent_daemon.py --base-url "https://api.deepseek.com" --model "deepseek-v4-pro"
```

### 5. 注入故障验证

```powershell
kubectl apply -f agent/chaos/cpu-stress.yaml
```

Agent 会自动检测异常，调用 Prometheus/Jaeger/Nezha 工具链完成根因分析并给出诊断结论。

## 核心工作流

```
ChaosMesh 故障注入 → Agent 巡检检测异常 → Function Calling 自主推理
    ├── query_prometheus  (PromQL 查询)
    ├── query_traces       (Jaeger 查询)
    ├── query_logs         (kubectl logs)
    └── run_nezha_analysis (gSpan RCA)
→ 输出诊断结论 + 修复建议
```

## 论文参考

- **Nezha** (FSE 2023): *Interpretable Fine-Grained Root Causes Analysis for Microservices on Multi-modal Observability Data*
