# Reflect's Python engine

The memory-graph reasoning engine that Reflect began as, with its Django backend in [`../api/`](../api/README.md). It belongs to Reflect, a separate product, and Mentura does not use it. The package keeps the name `thrivesight_core` so that imports do not break.

| File | Holds |
|---|---|
| `signal_engine.py` | Signal generation |
| `cluster_engine.py` | Clustering |
| `coordinate_system.py` | The coordinate system |
| `context_assembly.py` | Context assembly |
| `graph_agent.py`, `run_graph_agent.py` | The graph agent |
| `insight_engine.py` | The insight engine |
| `llm_prompts.py`, `persona_config.py` | The model prompts and the persona configuration |
| `test_signal_pipeline.py` | The signal pipeline's test |

## Install

```bash
pip install -e .
```

Run it from the repository root. The engine needs Python 3.11 or later. `pyproject.toml` declares its dependencies (`anthropic`, `neomodel`, `neo4j`, `jsonschema`).

## Origin

Torian Johnson built this engine and the backend at the Data Portability Hackathon, sponsored by the AI Collective, AITX, the Data Transfer Initiative, and the University of Texas at Austin School of Law and Innovation. It grew from his earlier work on NTS (Number Theory of the Soul) and Journey. It is a harness around existing models: the user's inputs and the harness's outputs are stored together in a persistent knowledge graph.

He built it with [@clarkmyfancy](https://github.com/clarkmyfancy), who kept the **ThriveSight** name and the front end and develops them independently. The reasoning engine, the Django backend and the research corpus are Torian's portion of the work. The `api/` folder was imported on 2026-04-22 from the archived tchjhnsn/reflect-api, which keeps its full commit history.
