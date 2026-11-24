---
type: research-note
source: Mac session read of arXiv 2610.40564, Zanette's and Song's X threads, project blog (2026-10-31/11-01)
created: 2026-11-01
tags: [reinforcement-learning, verifiable-rewards, calibration, typesafe]
---
# Training Foundation Models with a Single Algorithm: paper and X thread

Sources: [paper](https://arxiv.org/abs/2610.40564), [Zanette's post](https://x.com/zanette_ai/status/2116201481686671704), [Song's thread](https://x.com/yus167/status/2116181394175185393), [blog](https://yudasong.github.io/unified-training).

- **Claim:** RL can be written as maximum likelihood on the model's successful generations, so pretraining, midtraining, SFT and RL fit one loss and one trainer. The design problem becomes which data, in what proportions, when. Staged training is a special case.
- **Evidence:** small scale (124M and 0.76B parameters), mostly one RL task, RL results average two seeds, staged baselines also use MaxRL. Unified forgets less; coding accuracy falls as midtraining mix rises; staged wins accuracy at intermediate compute.
- **Thread:** Zanette frames it as optimizing data instead of algorithms. Song notes simpler infrastructure and calls optimization preliminary (cites Wen et al.: best data placement flips with learning-rate schedule). Pushback: will depue (stages differ in time scale, resources, infrastructure); Milanfar (maximum likelihood is no panacea). An alignment question went unanswered.
- **Authors:** CMU (Song lead, Tajwar, Arora, Schneider, Salakhutdinov, Singh, Zanette), JHU (Zhang, Khashabi), Bagnell (CMU, Aurora).
- **Verification:** a verifier marks each completion right or wrong; correct ones weighted 1/(pass rate). **Calibration is absent** from paper and threads.
- **Inference (untested, not in the paper):** with a uniform generator over a closed set of options and a pass/fail signal, the target becomes each option's normalized pass probability, close to a calibrated typed decision. Calibrated decision data could be one more source in the mixture.
- **TypeSafe/Jev:** not mentioned anywhere read. Jev is trained with "Reinforcement Learning for Calibrated Decisions" (RLCD); no public objective, so fit with this framework can't be judged. CEO Diogo Almeida, ex-OpenAI; TypeSafe exited stealth 2026-09-16 with $40M (SiliconANGLE).
- **Not read:** X was logged out; about 7 replies read, no quote-posts. Appendices by keyword only; GitHub and Hugging Face not opened.
