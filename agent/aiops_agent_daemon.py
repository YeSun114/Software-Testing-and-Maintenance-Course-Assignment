"""监控 Prometheus 告警，异常时触发智能体诊断"""

import os, sys, time, json
from datetime import datetime
from typing import Optional, Dict, List, Tuple

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from aiops_agent import (
    AIOpsAgent,
    _http_get,
    PROMETHEUS_URL,
    NAMESPACE,
    SERVICES,
    PROMQL_TEMPLATES,
)

# 配置
POLL_INTERVAL = 10
DIAGNOSIS_COOLDOWN = 60
DIAGNOSIS_STALE_TIMEOUT = 600

THRESHOLDS = {
    "cpu": 0.18,
    "memory_mb": 200,
    "error_rate": 0.10,
    "latency_p90_ms": 500,
}

# 各服务内存阈值 (MiB)，没列出来的用全局默认值
SERVICE_MEMORY_MB = {
    "currencyservice": 120,  # 限制 128Mi
    "adservice": 700,  # 限制 512Mi，JVM + OTEL 开销大
    "mysql": 1024,  # 基础设施 DB，无限制
    "redis-cart": 256,  # 基础设施缓存，限制 256Mi
    # 128Mi-limit 的服务，在默认 200Mi 触发之前就告警
    "cartservice": 115,
    "checkoutservice": 115,
    "frontend": 110,
    "paymentservice": 115,
    "productcatalogservice": 115,
    "shippingservice": 115,
}

SERVICE_NAME_MAP = {
    "frontend": "frontend",
    "cartservice": "cartservice",
    "productcatalogservice": "productcatalogservice",
    "currencyservice": "currencyservice",
    "paymentservice": "paymentservice",
    "shippingservice": "shippingservice",
    "emailservice": "emailservice",
    "checkoutservice": "checkoutservice",
    "recommendationservice": "recommendationservice",
    "adservice": "adservice",
    "vip-discount-service": "vip-discount-service",
    "comment-service": "comment-service",
    "image-show-service": "image-show-service",
    "coupon-service": "coupon-service",
    "order-history-service": "order-history-service",
    "mysql": "mysql",
    "redis-cart": "redis-cart",
}


def _match_service(pod_name: str) -> str:
    for svc in SERVICE_NAME_MAP:
        if pod_name.startswith(svc):
            return SERVICE_NAME_MAP[svc]
    return pod_name


# 健康检查
def _query_metric(query: str) -> List[Tuple[str, float]]:
    """执行 Prometheus 即时查询"""
    try:
        data = _http_get(f"{PROMETHEUS_URL}/api/v1/query", {"query": query})
        results = []
        for r in data.get("data", {}).get("result", []):
            metric = r.get("metric", {})
            label = (
                metric.get("pod") or metric.get("destination_service_name") or "unknown"
            )
            value = float(r.get("value", [None, 0])[1] or 0)
            results.append((label, value))
        return results
    except Exception as e:
        print(f"[WARN] Query failed: {e}")
        return []


def check_cpu() -> List[Tuple[str, float]]:
    alerts = []
    for label, val in _query_metric(PROMQL_TEMPLATES["cpu_per_service"]):
        if val > THRESHOLDS["cpu"]:
            alerts.append((_match_service(label), val))
    return alerts


def check_memory() -> List[Tuple[str, float]]:
    alerts = []
    for label, val in _query_metric(PROMQL_TEMPLATES["memory_per_service"]):
        service = _match_service(label)
        threshold = SERVICE_MEMORY_MB.get(service, THRESHOLDS["memory_mb"])
        if val > threshold:
            alerts.append((service, val))
    return alerts


def check_error_rate() -> List[Tuple[str, float]]:
    alerts = []
    for label, val in _query_metric(PROMQL_TEMPLATES["error_rate"]):
        if val > THRESHOLDS["error_rate"]:
            alerts.append((label, val))
    return alerts


def check_latency() -> List[Tuple[str, float]]:
    alerts = []
    for label, val in _query_metric(PROMQL_TEMPLATES["latency_p90"]):
        if val > THRESHOLDS["latency_p90_ms"]:
            alerts.append((label, val))
    return alerts


def check_pod_health() -> List[Tuple[str, str]]:
    """通过 kubectl 检查非 Running 状态的 Pod"""
    import subprocess, json

    alerts = []
    try:
        result = subprocess.run(
            ["kubectl", "get", "pods", "-n", NAMESPACE, "-o", "json"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return alerts
        pods = json.loads(result.stdout).get("items", [])
        for pod in pods:
            name = pod["metadata"]["name"]
            svc = _match_service(name)
            phase = pod.get("status", {}).get("phase", "Unknown")
            if phase not in ("Running", "Succeeded"):
                not_ready = []
                for cs in pod.get("status", {}).get("containerStatuses", []):
                    if not cs.get("ready", False):
                        reason = (
                            cs.get("state", {})
                            .get("waiting", {})
                            .get("reason", "unknown")
                        )
                        not_ready.append(f"{cs['name']}({reason})")
                detail = "; ".join(not_ready) if not_ready else f"phase={phase}"
                alerts.append((svc, detail))
    except Exception as e:
        print(f"[WARN] Pod health check failed: {e}")
    return alerts


def comprehensive_check() -> Dict[str, List]:
    return {
        "cpu": check_cpu(),
        "memory": check_memory(),
        "error_rate": check_error_rate(),
        "latency": check_latency(),
        "pod_health": check_pod_health(),
    }


def format_alert(alerts: Dict[str, List]) -> Optional[str]:
    parts = []
    if alerts.get("cpu"):
        svcs = ", ".join(f"{s}({v:.2f})" for s, v in alerts["cpu"])
        parts.append(f"CPU anomaly: {svcs}")
    if alerts.get("memory"):
        svcs = ", ".join(f"{s}({v:.0f}MiB)" for s, v in alerts["memory"])
        parts.append(f"Memory anomaly: {svcs}")
    if alerts.get("error_rate"):
        svcs = ", ".join(f"{s}({v:.2%})" for s, v in alerts["error_rate"])
        parts.append(f"5xx error rate anomaly: {svcs}")
    if alerts.get("latency"):
        svcs = ", ".join(f"{s}({v:.0f}ms)" for s, v in alerts["latency"])
        parts.append(f"P90 latency anomaly: {svcs}")
    if alerts.get("pod_health"):
        svcs = ", ".join(f"{s}({v})" for s, v in alerts["pod_health"])
        parts.append(f"Pod health anomaly: {svcs}")
    return "; ".join(parts) if parts else None


def format_alert_key(alerts: Dict[str, List]) -> Optional[str]:
    """去重的稳定 key，不含浮点值"""
    parts = []
    if alerts.get("cpu"):
        svcs = ",".join(sorted(s for s, _ in alerts["cpu"]))
        parts.append(f"cpu:{svcs}")
    if alerts.get("memory"):
        svcs = ",".join(sorted(s for s, _ in alerts["memory"]))
        parts.append(f"mem:{svcs}")
    if alerts.get("error_rate"):
        svcs = ",".join(sorted(s for s, _ in alerts["error_rate"]))
        parts.append(f"5xx:{svcs}")
    if alerts.get("latency"):
        svcs = ",".join(sorted(s for s, _ in alerts["latency"]))
        parts.append(f"p90:{svcs}")
    if alerts.get("pod_health"):
        svcs = ",".join(sorted(s for s, _ in alerts["pod_health"]))
        parts.append(f"pod:{svcs}")
    return "|".join(parts) if parts else None


def print_status(alerts: Dict[str, List], cooldown: int):
    ts = datetime.now().strftime("%H:%M:%S")

    def flag(lst):
        return "[ALERT]" if lst else "[OK]"

    total = sum(len(v) for v in alerts.values())
    cd = f"cooldown:{cooldown}s" if cooldown > 0 else "ready"
    print(
        f"[{ts}] CPU{flag(alerts['cpu'])} "
        f"Mem{flag(alerts['memory'])} "
        f"5xx{flag(alerts['error_rate'])} "
        f"P90{flag(alerts['latency'])} "
        f"Pod{flag(alerts.get('pod_health', []))} "
        f"| {cd} | anomalies:{total}"
    )


# 主循环
def main():
    api_key = os.environ.get("OPENAI_API_KEY", "")
    base_url = os.environ.get("OPENAI_BASE_URL", None)
    model = os.environ.get("OPENAI_MODEL", "gpt-4o")

    import argparse

    p = argparse.ArgumentParser(description="AIOps Daemon")
    p.add_argument("--api-key", default=api_key, help="OpenAI API Key")
    p.add_argument("--base-url", default=base_url, help="OpenAI Base URL")
    p.add_argument("--model", default=model, help="Model name")
    p.add_argument("--no-agent", action="store_true", help="Monitor only, no agent")
    args = p.parse_args()

    if not args.api_key and not args.no_agent:
        print("=" * 60)
        print("[WARN] OPENAI_API_KEY not set!")
        print("  Please set env vars in this terminal first:")
        print("  PS> $env:OPENAI_API_KEY=" + '"sk-your-key"')
        print("  PS> $env:OPENAI_BASE_URL=" + '"https://api.deepseek.com"')
        print("  Then re-run:")
        print(
            "  PS> python aiops_agent_daemon.py --base-url "
            + '"https://api.deepseek.com"'
            + " --model "
            + '"deepseek-v4-pro"'
        )
        print("  Or run in monitor-only mode:")
        print("  PS> python aiops_agent_daemon.py --no-agent")
        print("  Falling back to --no-agent mode")
        print("=" * 60)
        args.no_agent = True

    agent = None
    if not args.no_agent:
        agent = AIOpsAgent(
            api_key=args.api_key, base_url=args.base_url, model=args.model
        )

    print("=" * 60)
    print("  AIOps Intelligent Monitoring Daemon")
    print(f"  Namespace : {NAMESPACE}")
    print(f"  Services  : {len(SERVICES)}")
    print(f"  Prometheus: {PROMETHEUS_URL}")
    print(f"  Agent     : {args.model if agent else 'monitor-only'}")
    print(f"  API Base  : {args.base_url or 'default'}")
    print(
        f"  Thresholds: CPU>{THRESHOLDS['cpu'] * 100}% | "
        f"Mem>{THRESHOLDS['memory_mb']}MiB | "
        f"5xx>{THRESHOLDS['error_rate'] * 100}% | "
        f"P90>{THRESHOLDS['latency_p90_ms']}ms"
    )
    print("=" * 60)

    cooldown = 0
    diagnosed = {}

    while True:
        try:
            alerts = comprehensive_check()
            alert_msg = format_alert(alerts)
            print_status(alerts, cooldown)

            if alert_msg and cooldown <= 0:
                alert_key = format_alert_key(alerts)
                if alert_key not in diagnosed:
                    print(f"\n[!] NEW Anomaly detected: {alert_msg}")
                    if agent:
                        try:
                            result = agent.run_diagnosis(alert_msg)
                            print(f"[RESULT] {result}")
                        except Exception as e:
                            print(f"[ERROR] Diagnosis failed: {e}")
                    else:
                        print("[INFO] Agent disabled. Anomaly data:")
                        print(json.dumps(alerts, ensure_ascii=False, indent=2))
                    diagnosed[alert_key] = time.time()
                    cooldown = DIAGNOSIS_COOLDOWN
                else:
                    print(
                        f"[INFO] Same anomaly already diagnosed "
                        f"(cooldown, first seen {time.time() - diagnosed.get(alert_key, 0):.0f}s ago)"
                    )

            cooldown = max(0, cooldown - POLL_INTERVAL)

            if cooldown == 0 and diagnosed:
                stale_keys = [
                    k
                    for k, ts in diagnosed.items()
                    if time.time() - ts > DIAGNOSIS_STALE_TIMEOUT
                ]
                if stale_keys:
                    for k in stale_keys:
                        del diagnosed[k]
                    print(f"[INFO] Cleared {len(stale_keys)} stale diagnosis records")
                if not alert_msg:
                    diagnosed.clear()
                    print("[INFO] All anomalies resolved, reset diagnosis state")
            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            print("\n[EXIT] Daemon stopped.")
            break
        except Exception as e:
            print(f"[ERROR] Main loop: {e}")
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
