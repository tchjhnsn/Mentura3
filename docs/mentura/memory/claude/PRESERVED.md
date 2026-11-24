---
type: preserved
status: preserved, not reconciled
source: memory/*.md on branch preserve/sources-2026-11-03 at acfb232 (Claude project memory export, which the plan names as chunks 2 to 6), 78 files
sha256: per file in the table below, each equal to its memory/ line in SHA256SUMS.txt on that branch
ledger: per file in the table below (merged ledger rows that name the file)
recorded-on: 2026-11-04
---

# Claude's project memory notes, preserved

Each `.md` file in this folder except this one is a verbatim copy of a `memory/*.md` file from Claude's project memory export, taken with `git show` from `preserve/sources-2026-11-03` and not edited. The folder is `docs/memory/claude/`, the default of gate G13. The notes are records of what Claude remembered on 2026-11-03. They are not in force, and nothing reads them. Stage 2 of the ontology program reconciles them.

`FLAGS.tsv` on the preserve branch flags 61 of the 78 files (`mentura-confidential`, `names-polity`, `investor-relations` and others). Torian decided gate G14, on Nov 3, that every source is preserved as-is, confidential files included, each flagged file with a `FLAGS.tsv` row, and this unit's plan section says to copy confidential files unchanged; each flagged file's `FLAGS.tsv` line is in the table, and the cleanup rule in that row still applies before any public mirror. The ledger rows column also reads the full ledger, `grok-store/merged-ledger.full.md` on the preserve branch, because the public ledger shows confidential rows as pointers only. A confidential row is listed only once every source it names is on main, so a row that also names a source still off main is left out until that source lands. 23 files show `none`.

The notes use the retired name `foundation` 52 times and five of them contain em dashes, as they were written. EE-091 decided that `foundation/` moves to `identity/` (not built yet).

| File | sha256 | Ledger rows | FLAGS.tsv line and flags |
|---|---|---|---|
| `MEMORY.md` | `38e18eebff885442e99d869c4015d09badeca8a64701ee6db63b45635574c971` | N-005, N-046, N-091, N-152, N-178, N-182, N-184, N-188, N-196, N-197 | line 31: mentura-confidential,investor-relations |
| `ai-labs-anatomy.md` | `8d2837ffc4119a25556461c601e42f7f6b5e19b21387fc9ccaeec22a51f411e9` | N-019, N-020, N-031, N-097, N-111, N-144 | line 32: names-polity,mentura-confidential |
| `ai-never-speaks-for-human.md` | `c78de8e462254b30792b0edf2658f931c80b362e3695868ff10c100e1b5242a5` | N-098 | line 33: mentura-confidential |
| `anthropic-directory-overlap.md` | `5008e626242afedd72149e6d4f60526a52de807152588ee8f50647ecd239a9fc` | none | line 34: mentura-confidential,investor-relations |
| `anthropic-s1-study.md` | `9ab248af72c72cfd9530d7837e431f734f76e4ba4279c1f07c1abe4c776325d0` | none | line 35: names-polity,mentura-confidential |
| `architecture-record.md` | `c1a0f400c95936337ae63da916cf6f62a697715948182ffd68b6d507d2f7667b` | N-003, N-036, N-096 | line 36: mentura-confidential |
| `blog-posts.md` | `78ef8ebd53c74e30f77936e16e736c1969476e6328260c410ba78d52390de7a3` | none | line 37: mentura-confidential |
| `core-product-framework.md` | `887dfe6b8f90addfe5ec00ba29ee1011ff935c51b3d9ac9157a79ba84dea6d9c` | N-218 | line 38: names-polity |
| `ee-decision-library.md` | `c9412df883d4f7ff8fc49e92bd4a660fa96aa2700230c918698fc2ff5fe9a01c` | N-134, N-135, N-183, N-203 | line 39: mentura-confidential,investor-relations |
| `ee-decisions-file-type.md` | `468c2984552f7955c3a7d41ce0f1936435e05db0ba1909571b21bc903f344b84` | N-166, N-167, N-200 | line 40: mentura-confidential,investor-relations |
| `ee-demo-plan.md` | `c099d73c1c62929687da60dbf5135ce23f8a31c653c6d0a883e10c9c2e3d7ed7` | N-092, N-201, N-202 | line 41: mentura-confidential |
| `ee-demo-scope-four-pages.md` | `342ed0f31af68f6fbc5b1310c24ec0287c22cf325bc3588f80c6b603de88dde0` | N-030, N-101 | line 42: mentura-confidential |
| `ee-founder-interviews.md` | `aa902304b0aaf9fb789d60b45010446a851d71e04745b31a10e2b5c47a70a0e1` | N-032 | line 43: mentura-confidential |
| `ee-framework-platform-split.md` | `b6b7edff238c55625e5451b67d00343bf0c64d743f108b97ad43e35b56246a98` | N-095, N-151, N-155, N-173, N-177, N-194, N-213 | line 44: mentura-confidential |
| `ee-hackathon-aitx-2026.md` | `a5f1d4f2b228ff06c2ff0f7e2e10add691dd4fed4b8740ac001eb937536ac332` | N-181 | line 45: investor-relations |
| `ee-icp.md` | `dc3f1a249b901477a774fc7d50ee2570d102aa33a73a3d0179d78e210881b8a8` | none | line 46: mentura-confidential |
| `ee-ideas-raw.md` | `05b863f98a63280992b4d56337dcbe58af99ca339674e6a4f18d529e1797a70d` | N-210 | line 47: mentura-confidential |
| `ee-interfaces.md` | `1449260d81a6318f7c819bdefc746d5a7643bcf0ee91a37813805f4c5efd2f49` | N-180 | line 48: mentura-confidential |
| `ee-investor-relations.md` | `97174623798325503307039777a5af63a6bcd9df8bffdf717e4d9f84f4451ef6` | N-033 | line 49: mentura-confidential,investor-relations,founder-personal |
| `ee-knowledge-connectors.md` | `ee6c32a38b55075173892651b2757555dccb9b5ff6ebc976d5bb0a045a4dc8c6` | none | line 50: mentura-confidential |
| `ee-merge-queue.md` | `909f20f77fba81c9b73bf13d0f481be2ba6d6651054d87d847de3bbc416c77d7` | none | line 51: mentura-confidential |
| `ee-nextjs-translation.md` | `8cc31a1799ff608520f7f4b9c4e1028cf56dc979c2822539d82dfc00309aac17` | N-145 | not flagged |
| `ee-observations-evidence.md` | `26fca4262ad223edb737d63d08cc47a51ed74b53f7560ba707a6b527a6dd10ba` | N-171 | line 52: investor-relations |
| `ee-packages-kits-clock.md` | `fec2c67825923a87aebb619b848843d34173c778142157476a2bd428b625e8b2` | N-092, N-094, N-106 | line 53: mentura-confidential |
| `ee-publication-gate.md` | `00a6a9bd26d4ab4d0be796cb395e04347eea1caaba73c02238d9cb8870921fa2` | N-179 | not flagged |
| `ee-records-vs-artifacts.md` | `1c62349932256a061adc187de220a52da6de9d197a75904e0c09e317a7de8731` | N-029 | not flagged |
| `ee-scope-solo-founders.md` | `2332e2858150a45fc8b5d67a0fd2a421d74cf0cd323478a6b04012a87f6e542a` | none | not flagged |
| `ee-self-validation.md` | `0290347d6a1e6e8bee92d56014ecf7928d7d28f4eef9fdf49d9adfa3a80de09b` | N-093, N-168, N-169, N-195, N-204, N-205, N-206, N-207, N-208, N-209, N-218 | line 54: mentura-confidential,investor-relations |
| `ee-setup-roles-venture-type.md` | `e21df794b4545c95cba65be409ced52063740f2545c24d509a7c1a1c7e218b2e` | N-176 | line 55: investor-relations |
| `ee-setup-sources-of-truth.md` | `ae2b1613f1c3b8359f2921e409136a7fab732798c8c0184457947ec0d200d797` | N-212 | line 56: mentura-confidential |
| `ee-spheres-model.md` | `000728415e27b094089430b5de95afbb2a92ac041163831665e24617ab6ec828` | N-153, N-156 | line 57: names-polity |
| `ee-system1-pipeline.md` | `3d034a40d2958757b4692701634ac05d3a36cc8a4bbfc05052f985bdee943f8c` | N-015 | line 58: mentura-confidential |
| `ee-telos-vision.md` | `728d5bce96e1e88a02ea10948de0513d8515975361503e1b682c7662ccc465da` | none | line 59: mentura-confidential,investor-relations |
| `ee-venture-calendar.md` | `ccaf246e815092191426c608066190dadab26b4eeeff4ad5d69d22f0b5153d84` | N-016 | line 60: mentura-confidential |
| `ee-venture-package.md` | `0c1bda0ae89ea1ec1d60cbe9cee37b4ce433afb6e7729720c23c0ed4737872bd` | none | line 61: mentura-confidential |
| `ee-venture-pipeline.md` | `fc3dbc0e35339eb3ef577ec3f017ae562ff1a7ffab7178ffc3ed2c180f226dca` | N-094, N-172 | line 62: mentura-confidential,investor-relations |
| `ee-venture-structure.md` | `bf8cfac313d23542f729bdabc7e3ec3ac81312630923a6d048044a424a355948` | N-145, N-170, N-216 | line 63: mentura-confidential,investor-relations |
| `ee-venture-top-level.md` | `bbabcf563746cbc1ecd65da668f65a3a3ac7c8e597da62a78d6bc4f6a4229697` | N-008, N-106, N-140, N-154, N-159, N-174, N-175, N-211 | line 64: mentura-confidential |
| `feedback-decision-docket.md` | `39c52b2cc1a36a2acd8dc30b3fff6f9aa3d50ed8c72ca3e035c2ea6cd4cc5073` | none | not flagged |
| `feedback-decisions-as-cards.md` | `30672fbd8f995fb2a46d2db7240b190f1a15c61b5839f9ee83b6c7de40ae2337` | none | line 65: mentura-confidential |
| `feedback-demo-emphasis-decisions.md` | `7298b17bdd5b52d2cf32759bda2821bffad043f99a0673b14321cb18f7636113` | N-201 | not flagged |
| `feedback-one-session-voice.md` | `fce50326014eaa80bc24652efd64977b3630a7478078d1e24e8eb4afd76b6685` | none | not flagged |
| `feedback-seed-cases.md` | `58812ad94fc6e3abe4ad84be9bb8d009bab472239b9b98e9858e3ba28b0281e4` | N-136 | line 66: names-polity,mentura-confidential |
| `feedback-standard-nouns.md` | `8d832fdc174260af52f795e449e1e2e4cd3b9bfb91f872f66913105ae6024ab5` | none | not flagged |
| `feedback-views-are-platform.md` | `1176e82ffa2d14cdd81d1455a254a1a2e3e60ce3d22b64c7d4a6001635c758ab` | N-100 | line 67: mentura-confidential |
| `foundation-retired.md` | `f06f1f2719245d336350d9191ea3eb8e82dc0ee80a627db0bd7bfac3f7fc9a40` | N-161, N-204 | not flagged |
| `founder-is-own-icp.md` | `37398c68e2e583fc55ccd7e232bcbd0f54cab85d810694de17962b5ecffd8ec5` | none | line 68: mentura-confidential |
| `founder-puzzle-skill.md` | `a42e8a7bd33e5b9353abd95ca9d859b669424f31662e29ba70a7ed2f6674a4f6` | N-107 | line 69: mentura-confidential |
| `founder-suite.md` | `b6ca3f8b2470151c8b43b61c98258314f245b24c34079d04cbd519928f650eff` | N-023, N-188, N-214 | line 70: mentura-confidential |
| `grokbot-owns-prs.md` | `c6128cbbf485b029ae8f43d1181d758b2dc510685cb18cc10accd3d9a7965b72` | N-138 | not flagged |
| `idea-decision-stream.md` | `af02b83a29730216cdb8960dc0582ddd1e3278f8bae268cc5771ab907b190db5` | N-099 | not flagged |
| `industry-as-one-venture.md` | `5feed8bb56e0a7a979b82e76d2dea4bf8d6452ba43abe20fa4666dbf168139f1` | N-031, N-164 | line 71: mentura-confidential |
| `km-roles-sad-mad.md` | `272b023f762566a727bf3a8a5990917be92c0edfb9cedbd4a8163f3a9901a397` | none | line 72: names-polity |
| `knowledge-convention-code.md` | `0ef4c25100416a8118d17c64f4e4f1f1a68eeda752142604ae095aa36577df88` | N-001, N-007, N-044, N-142, N-146, N-158, N-165, N-185 | not flagged |
| `mad-maturity.md` | `10525c9c0790b3d1786ca6b72dd23769918f2ef8b2e06d5f0eb73ad315088601` | N-141, N-217 | not flagged |
| `master-architecture.md` | `fcf13d7de5f24d1f7199e6d42b958e24d9aaba3f6a174f6c35bbfa55ec9c9c0b` | N-003, N-004, N-017, N-018, N-029, N-046, N-104, N-143, N-152, N-184, N-187 | line 73: mentura-confidential |
| `mentor-coach-definitions.md` | `f96655dc33356537a302f139e544f05761dcc0e6cae2e6674f294acfa823e50e` | N-024, N-025 | line 74: names-polity,mentura-confidential,investor-relations |
| `mentura-discovery-strategy.md` | `2ea88fe84620cd0e01755fa3afaae152beb3ff6e32a5c2f155883848cca4fcc5` | N-027, N-091, N-103 | line 75: mentura-confidential,investor-relations |
| `mentura-discovery-workflow.md` | `3e676a983469ec2b80a987c260fff9a4994bdc54cd372eaa2c7b68d0679487ca` | none | line 76: mentura-confidential |
| `mentura-market-research.md` | `a1a821ab7a5bc5c5f0390c8738921731c28680d1d2df3f684173829813a67b7b` | N-088, N-205 | line 77: mentura-confidential,investor-relations |
| `methodology-consultancy.md` | `8450579808bf36ee1260a6ebbdb405082dbdf1e0d04a745925ad07d1a73abdcb` | none | not flagged |
| `naive-docs-handoff.md` | `90a9f341b9b9170ec765fe7bc60642d27c0e0de061e4809413a36dfd3d4b5ee9` | N-180 | line 78: mentura-confidential |
| `naive-docs-not-public.md` | `b7880651afe8acdd8602cabb45f32ab1a7f963ba45c2af3c618bca54c116cae7` | N-087, N-198 | not flagged |
| `naive-phases-functions.md` | `858a7701fdf5ac31a7fc6ccdbb9e7f246d0f4b8608b47dbd23a0e29ebc515970` | N-010, N-011, N-012, N-013, N-014, N-034, N-045, N-087, N-089, N-090, N-102, N-105, N-110, N-157, N-160, N-161, N-162, N-163 | line 79: mentura-confidential,investor-relations |
| `naive-plugins-and-proving.md` | `810ecd45dd8d58c10596b5baffcb7e2883deb5093809020ffceef4ee06d2fa5f` | N-189 | line 80: mentura-confidential |
| `naive-systems-doc.md` | `5480b0d07850d6bb7c21f370ffe4d24e183f3754d5fcf5ff70388e46ef5ddb5e` | none | line 81: mentura-confidential |
| `polity-vision-and-roadmap-draft.md` | `0dd4b61cc1edd4d8932ec6a60528e0fa51a9223eb7eee31334c6f6dd8acfa2e0` | none | line 82: names-polity |
| `precog.md` | `73eda53852c2973680b596e684af6b59ff39f0b60ff4fadbcaaa8c9520e1c294` | N-035 | line 83: mentura-confidential |
| `problem-loop.md` | `aeaa805c2b6cc5894b2678cbc84cbbf74a437e098fdda6b4421d0eb87c16e223` | N-021 | line 84: mentura-confidential,personal-data-third-party |
| `pstack-default.md` | `a1a0694b21fe18781634a0b5d2c1b999468a0b1854a54973ca1cdd98e0390f13` | N-139 | not flagged |
| `readmes-docs-as-code.md` | `6d1180ab88db8f55367f9d92bea8fb466de8fa3c2be2730e2450891d4269fa9a` | N-132, N-180, N-199 | not flagged |
| `research-engine-andtruth.md` | `8fe46f5f253eb1d531b8797d6bf250d29c2e8375a7c597763c241d98d8e9d9f1` | none | line 85: mentura-confidential |
| `talent-lead-rohith.md` | `b4214a31359944e37b3e233d9bb5833bfadda06d47273c00f33400fec0d8f4c3` | none | line 86: mentura-confidential,personal-data-third-party |
| `venture-console-plan.md` | `e44cbedb2e5ec3b87f8d49e6e3700662fca548e03f174071cc8eb8dd0d494502` | N-215 | line 87: mentura-confidential |
| `venture-folder-knowledge-beside-code.md` | `3161c38fd11457ac8b89fbd981cdf895180a6a8f7528fea1ecf1cb19f0743746` | none | line 88: mentura-confidential |
| `venture-identity-legal-entity.md` | `f10d78c6845514067188c9eff6cd3d411c8e09c679766fa11605f3d83820feb2` | N-009 | line 89: mentura-confidential |
| `workflow-review-2026-10-26.md` | `c6474098f10e91c0eade98f95d0cb0d30727118aa0efabb6b42684dd4b39e257` | none | line 90: names-polity |
| `workspace-owned-conversations.md` | `3e6d5d8beae7be32558ce49f71b039f80b40cfe59535333508cf7e02132657b5` | N-022 | line 91: mentura-confidential |
