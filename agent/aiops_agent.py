"""AIOps 智能体：基于 GPT function calling，集成 Prometheus、Jaeger、kubectl 和 Nezha"""

import os, sys, json, time, subprocess, tempfile
from datetime import datetime, timedelta
from typing import Optional

import yaml

# requests / urllib 回退
try:
    import requests as _requests

    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

import urllib.request
import urllib.error
import urllib.parse
import ssl

# openai（可选）
try:
    from openai import OpenAI as _OpenAI

    _HAS_OPENAI = True
except ImportError:
    _HAS_OPENAI = False


# HTTP 请求工具
def _http_get(url: str, params: dict = None, timeout: int = 15) -> dict:
    """HTTP GET，优先 requests，失败回退 urllib"""
    if params:
        qs = urllib.parse.urlencode(params)
        url = f"{url}?{qs}"
    if _HAS_REQUESTS:
        resp = _requests.get(url, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    else:
        ctx = ssl.create_default_context()
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)


# 路径与常量
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
NEZHA_DIR = os.path.join(PROJECT_ROOT, "..", "algorithm", "Nezha-main")
CONFIG_PATH = os.path.join(PROJECT_ROOT, "config.yaml")


def _load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


_cfg = _load_config()

PROMETHEUS_URL = _cfg.get("prometheus", {}).get("url", "http://127.0.0.1:30090")
JAEGER_URL = _cfg.get("jaeger", {}).get("url", "http://127.0.0.1:16686")
NAMESPACE = _cfg.get("target", {}).get("namespace", "hipster")
SERVICES = _cfg.get("target", {}).get("services", [])
GSPAN_MIN_SUPPORT = _cfg.get("gspan", {}).get("min_support", 0.3)
TOPK = _cfg.get("ranker", {}).get("top_k", 5)
SCORE_MIN = _cfg.get("ranker", {}).get("score_min", 0.6)

FAULT_TYPES = [
    "cpu_contention",
    "cpu_consumed",
    "network_delay",
    "memory_leak",
    "pod_kill",
    "exception",
    "return",
    "return_error",
]


# 工具 1：query_prometheus
def query_prometheus(
    query: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
    step: str = "15s",
) -> dict:
    """执行 PromQL 查询"""
    try:
        if start and end:
            params = {"query": query, "start": start, "end": end, "step": step}
            endpoint = f"{PROMETHEUS_URL}/api/v1/query_range"
        else:
            params = {"query": query}
            endpoint = f"{PROMETHEUS_URL}/api/v1/query"
        data = _http_get(endpoint, params)
        results = data.get("data", {}).get("result", [])
        simplified = []
        for r in results:
            metric = r.get("metric", {})
            if "values" in r:
                simplified.append({"metric": metric, "values": r["values"][-10:]})
            else:
                simplified.append(
                    {"metric": metric, "value": r.get("value", [None, None])}
                )
        return {
            "status": "success",
            "result_count": len(simplified),
            "data": simplified,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# 工具 2：query_traces
def query_traces(service: str, limit: int = 10, lookback: str = "5m") -> dict:
    """查询 Jaeger 中某服务的调用链"""
    try:
        end_ts = int(time.time() * 1_000_000)
        unit = lookback[-1]
        val = int(lookback[:-1])
        mul = {"s": 1_000_000, "m": 60_000_000, "h": 3_600_000_000}
        start_ts = end_ts - val * mul.get(unit, 60_000_000)

        # Istio 中服务注册为 "frontend.hipster" 格式，不是 "frontend"
        jaeger_service = service if "." in service else f"{service}.{NAMESPACE}"
        params = {
            "service": jaeger_service,
            "limit": limit,
            "start": start_ts,
            "end": end_ts,
        }
        data = _http_get(f"{JAEGER_URL}/jaeger/api/traces", params)
        traces = data.get("data", [])
        simplified = []
        for t in traces:
            spans = t.get("spans", [])
            services_set = {s.get("process", {}).get("serviceName", "?") for s in spans}
            duration_us = max((s.get("duration", 0) for s in spans), default=0)
            simplified.append(
                {
                    "traceID": t.get("traceID", ""),
                    "services": list(services_set),
                    "span_count": len(spans),
                    "duration_ms": round(duration_us / 1000, 2),
                }
            )
        return {
            "status": "success",
            "trace_count": len(simplified),
            "traces": simplified,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# 工具 3：query_logs
def query_logs(service: str, tail_lines: int = 100, container: str = "server") -> dict:
    """通过 kubectl 获取 K8s 部署的近期日志"""
    try:
        cmd = [
            "kubectl",
            "logs",
            f"deployment/{service}",
            "-n",
            NAMESPACE,
            "-c",
            container,
            f"--tail={tail_lines}",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        if result.returncode != 0:
            cmd2 = [
                "kubectl",
                "logs",
                f"deployment/{service}",
                "-n",
                NAMESPACE,
                f"--tail={tail_lines}",
            ]
            result = subprocess.run(cmd2, capture_output=True, text=True, timeout=20)
        lines = result.stdout.strip().split("\n") if result.stdout.strip() else []
        return {
            "status": "success" if result.returncode == 0 else "error",
            "service": service,
            "lines_returned": len(lines),
            "logs": lines[-50:],
            "stderr": result.stderr.strip()[:500] if result.stderr else "",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# 工具 4：run_nezha_analysis
def run_nezha_analysis(
    fault_start: str, fault_end: str, level: str = "service"
) -> dict:
    """运行 Nezha 多模态根因分析（gSpan 频繁子图挖掘）"""
    try:
        cmd = [
            "conda",
            "run",
            "-n",
            "nezha",
            "--no-capture-output",
            "python",
            os.path.join(NEZHA_DIR, "main.py"),
            "--ns",
            NAMESPACE,
            "--level",
            level,
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120, cwd=NEZHA_DIR
        )
        top_results = _parse_nezha_output(result.stdout)
        result_files = _find_result_files()
        return {
            "status": "success" if result.returncode == 0 else "error",
            "fault_window": f"{fault_start} ~ {fault_end}",
            "level": level,
            "top_results": top_results,
            "result_files": result_files,
            "stdout_tail": result.stdout[-2000:] if result.stdout else "",
            "stderr_tail": result.stderr[-500:] if result.stderr else "",
        }
    except subprocess.TimeoutExpired:
        return {"status": "error", "message": "Nezha analysis timeout (>120s)"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def _parse_nezha_output(stdout: str) -> list:
    results = []
    for line in stdout.split("\n"):
        low = line.lower()
        if any(kw in low for kw in ["rank", "score", "root_cause"]):
            results.append(line.strip())
    return results[-20:]


def _find_result_files() -> list:
    results = []
    today = datetime.now().strftime("%Y-%m-%d")
    for p in [
        os.path.join(NEZHA_DIR, "output", "results"),
        os.path.join(NEZHA_DIR, "log"),
        os.path.join(NEZHA_DIR, "rca_data", today),
    ]:
        if os.path.isdir(p):
            for f in sorted(os.listdir(p)):
                fpath = os.path.join(p, f)
                if os.path.isfile(fpath) and f.endswith((".json", ".log", ".txt")):
                    results.append({"file": f, "path": fpath})
    return results[-10:]


# PromQL 模板
PROMQL_TEMPLATES = {
    "cpu_per_service": (
        f"sum(rate(container_cpu_usage_seconds_total{{"
        f'namespace="{NAMESPACE}"'
        f', container!="istio-proxy"'
        f"}}[1m])) by (pod)"
    ),
    "memory_per_service": (
        f"sum(container_memory_working_set_bytes{{"
        f'namespace="{NAMESPACE}"'
        f', container!="istio-proxy"'
        f"}}) by (pod) / 1024 / 1024"
    ),
    "error_rate": (
        f"sum(rate(istio_requests_total{{"
        f'destination_workload_namespace="{NAMESPACE}", '
        f'response_code=~"5..", '
        f'reporter="source"'
        f"}}[1m])) by (destination_service_name)"
    ),
    "latency_p90": (
        f"histogram_quantile(0.90, sum(rate(istio_request_duration_milliseconds_bucket{{"
        f'destination_workload_namespace="{NAMESPACE}", '
        f'reporter="source"'
        f"}}[1m])) by (destination_service_name, le))"
    ),
    "request_rate": (
        f"sum(rate(istio_requests_total{{"
        f'destination_workload_namespace="{NAMESPACE}"'
        f"}}[1m])) by (destination_service_name)"
    ),
}

# Function Calling 定义
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "query_prometheus",
            "description": "Execute PromQL to retrieve metrics. Templates: cpu_per_service, memory_per_service, error_rate, latency_p90, request_rate.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "PromQL query string or template name",
                    },
                    "start": {
                        "type": "string",
                        "description": "Range start (ISO 8601), optional",
                    },
                    "end": {
                        "type": "string",
                        "description": "Range end (ISO 8601), optional",
                    },
                    "step": {
                        "type": "string",
                        "description": "Step interval, default 15s",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_traces",
            "description": "Query Jaeger for recent traces of a microservice.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service": {
                        "type": "string",
                        "description": "Service name e.g. frontend",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max traces, default 10",
                    },
                    "lookback": {
                        "type": "string",
                        "description": "Lookback window e.g. 5m, 10m, 1h",
                    },
                },
                "required": ["service"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_logs",
            "description": "Get recent container logs from a Kubernetes deployment via kubectl.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service": {"type": "string", "description": "K8s deployment name"},
                    "tail_lines": {
                        "type": "integer",
                        "description": "Recent N lines, default 100",
                    },
                    "container": {
                        "type": "string",
                        "description": "Container name, default server",
                    },
                },
                "required": ["service"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_nezha_analysis",
            "description": "Run Nezha multi-modal RCA algorithm (metrics+traces+logs) using event graphs and gSpan frequent subgraph mining. Returns Top-K root causes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "fault_start": {
                        "type": "string",
                        "description": "Fault start time (YYYY-MM-DD HH:MM or ISO 8601)",
                    },
                    "fault_end": {
                        "type": "string",
                        "description": "Fault end time (YYYY-MM-DD HH:MM or ISO 8601)",
                    },
                    "level": {
                        "type": "string",
                        "enum": ["service", "inner_service"],
                        "description": "Granularity: service or inner_service",
                    },
                },
                "required": ["fault_start", "fault_end"],
            },
        },
    },
]

TOOLS_MAP = {
    "query_prometheus": query_prometheus,
    "query_traces": query_traces,
    "query_logs": query_logs,
    "run_nezha_analysis": run_nezha_analysis,
}


# AIOpsAgent 类
class AIOpsAgent:
    """基于 GPT function calling 的微服务根因分析智能体"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: str = "gpt-4o",
    ):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.base_url = base_url or os.environ.get("OPENAI_BASE_URL", None)
        self.model = model
        self.tools_map = TOOLS_MAP

        self.system_prompt = f"""你是微服务智能运维专家，负责在 Online Boutique 系统上进行异常检测与根因分析。

## 环境信息
- K8s namespace: {NAMESPACE}
- 15 个微服务: {json.dumps(SERVICES, ensure_ascii=False)}
- Prometheus: {PROMETHEUS_URL}
- Jaeger: {JAEGER_URL}
- Nezha 可检测故障类型: {json.dumps(FAULT_TYPES, ensure_ascii=False)}

## 可用工具
1. query_prometheus — PromQL 指标查询（CPU/内存/错误率/延迟）
2. query_traces — Jaeger trace 查询，分析调用链路
3. query_logs — kubectl 容器日志，发现错误堆栈
4. run_nezha_analysis — Nezha 多模态根因分析（gSpan 频繁子图挖掘）

## 诊断流程（必须严格按顺序执行，禁止跳过任何步骤）
第1步：使用 query_prometheus 查询 cpu_per_service / memory_per_service / error_rate / latency_p90
第2步：根据第1步结果，对异常服务使用 query_traces 查询调用链路
第3步：对异常服务使用 query_logs 查询容器日志
第4步：使用 run_nezha_analysis 进行系统级根因定位
第5步：综合以上所有结果，中文输出诊断结论：
   - **根因服务**: <service-name>
   - **故障资源类型**: <type>
   - **根因描述**: <描述>
   - **修复建议**: <建议>

⚠️ 关键规则：
- 完成第1-4步之前，绝对不要输出最终诊断结论
- 每一步都必须真正调用工具获取数据，不要跳过
- 只基于实际工具返回的数据得出结论，不要编造"""

    def run_diagnosis(self, alert_context: str, max_steps: int = 20) -> str:
        """多轮 function calling 诊断循环。"""
        if not _HAS_OPENAI:
            return self._fallback_diagnosis(alert_context)

        client_kwargs = {"api_key": self.api_key, "timeout": 120.0}
        if self.base_url:
            client_kwargs["base_url"] = self.base_url
        client = _OpenAI(**client_kwargs)

        messages = [
            {"role": "system", "content": self.system_prompt},
            {
                "role": "user",
                "content": (
                    f"系统异常：{alert_context}。请按照诊断流程严格逐步排查并给出根因定位和修复建议。"
                    f"注意：必须完成第1-4步全部工具调用后才能输出结论。"
                    f"当前时间：{datetime.now().isoformat()}"
                ),
            },
        ]

        used_tools = set()
        min_required = {"query_traces", "query_logs", "run_nezha_analysis"}

        for step in range(max_steps):
            print(f"\n[Agent 推理 - 第{step + 1}步]")
            try:
                response = client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=TOOLS_SCHEMA,
                    tool_choice="auto",
                    temperature=0.3,
                )
            except Exception as e:
                print(f"  API 调用失败: {e}")
                import traceback

                traceback.print_exc()
                return f"诊断中断：API 异常 - {e}"

            msg = response.choices[0].message
            finish = response.choices[0].finish_reason
            print(f"  [finish_reason={finish}]")

            has_tools = bool(msg.tool_calls)
            has_content = bool(msg.content and msg.content.strip())

            if not has_tools and not has_content:
                print(
                    f"  ⚠️  Empty response (finish_reason={finish}), injecting continuation prompt"
                )
                missing = min_required - used_tools
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            f"你的上一条回复是空的。请继续诊断流程。"
                            f"还需调用的工具：{missing or '无（可输出结论）'}。"
                            f"如果已收集足够数据，请输出中文诊断结论；否则请继续调用工具。"
                        ),
                    }
                )
                continue

            messages.append(msg)

            if has_tools:
                for tc in msg.tool_calls:
                    fn_name = tc.function.name
                    try:
                        fn_args = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        fn_args = {}
                    print(
                        f"  → 调用工具: {fn_name}({json.dumps(fn_args, ensure_ascii=False)})"
                    )
                    try:
                        result = self.tools_map[fn_name](**fn_args)
                    except Exception as e:
                        result = {"status": "error", "message": str(e)}
                    used_tools.add(fn_name)
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": json.dumps(result, ensure_ascii=False),
                        }
                    )

                step_label = step + 1
                if step_label >= max_steps - 2:
                    print(
                        f"  ⚠️  Approaching step limit, injecting force-conclude prompt"
                    )
                    messages.append(
                        {
                            "role": "user",
                            "content": "\n".join(
                                [
                                    f"你已进行 {step_label} 轮工具调用，已达到诊断流程的最大步数限制。",
                                    f"请**立即**基于已收集的所有数据输出最终中文诊断结论，格式如下：",
                                    f"- **根因服务**: <service-name>",
                                    f"- **故障资源类型**: <type>",
                                    f"- **根因描述**: <描述>",
                                    f"- **修复建议**: <建议>",
                                    f"不要再调用任何工具，直接输出结论。",
                                ]
                            ),
                        }
                    )
                elif step >= max_steps - 6:
                    print(
                        f"  ⚠️  Step {step_label}/{max_steps}, nudging toward next phase"
                    )
                    messages.append(
                        {
                            "role": "user",
                            "content": "\n".join(
                                [
                                    f"Prometheus 数据已足够。请**停止** query_prometheus 调用，",
                                    f"立即进入第2步（query_traces）、第3步（query_logs）、第4步（run_nezha_analysis），",
                                    f"限时 {max_steps - step_label} 步内完成诊断。",
                                ]
                            ),
                        }
                    )
            else:
                missing = min_required - used_tools
                if missing and step < max_steps - 2:
                    print(f"  ⚠️  Premature conclusion, missing tools: {missing}")
                    messages.append(
                        {
                            "role": "user",
                            "content": (
                                f"诊断流程尚未完成！以下工具未调用：{missing}。"
                                f"请立即调用这些工具获取数据，完成全部诊断步骤后再输出最终结论。"
                            ),
                        }
                    )
                    continue
                conclusion = msg.content or "(no text)"
                print(
                    f"\n{'=' * 50}\n[Diagnosis Result] (tools used: {used_tools})\n{'=' * 50}\n{conclusion}"
                )
                return conclusion
        print(
            f"\n{'=' * 50}\n[Diagnosis Result] (truncated: max steps {max_steps} reached, tools used: {used_tools})\n{'=' * 50}"
        )
        print("诊断未完成：达到最大步数限制，模型未能在允许步数内输出结论。")
        return f"Diagnosis incomplete (max steps={max_steps} reached, tools used: {used_tools})"

    def _fallback_diagnosis(self, alert_context: str) -> str:
        """openai 未安装时的本地回退模式"""
        print("\n[Fallback] openai not installed, running tools directly...")
        results = {}

        print("  → query_prometheus(cpu_per_service)")
        results["cpu"] = query_prometheus(PROMQL_TEMPLATES["cpu_per_service"])

        print("  → query_prometheus(error_rate)")
        results["errors"] = query_prometheus(PROMQL_TEMPLATES["error_rate"])

        print("  → query_prometheus(latency_p90)")
        results["latency"] = query_prometheus(PROMQL_TEMPLATES["latency_p90"])

        print("  → run_nezha_analysis")
        now = datetime.now()
        results["nezha"] = run_nezha_analysis(
            fault_start=(now - timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M"),
            fault_end=now.strftime("%Y-%m-%d %H:%M"),
        )

        print(f"\n{'=' * 50}")
        print(f"[Fallback Diagnosis for: {alert_context}]")
        print(f"{'=' * 50}")
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return json.dumps(results, ensure_ascii=False, indent=2)


# 命令行入口
if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser(description="AIOps Agent")
    p.add_argument("--alert", required=True, help="Alert description")
    p.add_argument("--api-key", default=None, help="OpenAI API key")
    p.add_argument("--base-url", default=None, help="OpenAI base URL")
    p.add_argument("--model", default="gpt-4o", help="Model name")
    args = p.parse_args()
    agent = AIOpsAgent(api_key=args.api_key, base_url=args.base_url, model=args.model)
    agent.run_diagnosis(args.alert)
