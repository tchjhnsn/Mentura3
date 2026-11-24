---
type: preserved
status: preserved, not reconciled
source: project-files/mentura-discovery/mentura/research/ on branch preserve/sources-2026-11-03 at acfb232 (Claude export of 2026-11-03), 119 files
sha256: per file in the table below, each equal to its line in SHA256SUMS.txt on that branch
ledger: N-037 (Claude audit id C-S3-research) and N-006 (one of its sources is research-areas/self.json)
recorded-on: 2026-11-04
---

# Mentura's research studies, preserved

Each file under this folder except this one is a verbatim copy of a file under `project-files/mentura-discovery/mentura/research/` in Claude's export of 2026-11-03, taken with `git show` from `preserve/sources-2026-11-03` and not edited. The folder layout is the source's. There are 116 JSON files (references, relationships, research areas, supplier searches and venture studies) and 3 Markdown files, including the source's own `README.md`.

Merged ledger row N-037 records these studies as deliberately kept out of repos and held only in the private store. Row N-006, a confidential positioning row, names `research-areas/self.json` among its sources; its other sources are Claude's artifacts and memory notes. This copy is the first one in a repo.

Row N-037 names six of these files and then "(+113 more)", and gives this folder as its location, so the table lists N-037 on all 119 files.

The files are preserved and not reconciled. They are records of the studies as of 2026-11-03, not live records. `schema/data-model.json` ignores `docs/design/preserved/**/*.json`, so no checker loads the JSON files. `scripts/architecture-inventory.ts` reads them like every text file under 400 KB outside `docs/reviews/`. The copied `README.md` is scanned by `schema/check-docs-claims.mjs`, like every README, and passes. Stage 2 of the ontology program reconciles them.

`FLAGS.tsv` on the preserve branch flags all 119 files, on its lines 130 to 248 (`mentura-confidential`, `names-polity` and `founder-personal`). Torian decided gate G14, on Nov 3, that every source is preserved as-is, confidential files included, each flagged file with a `FLAGS.tsv` row. Each file's `FLAGS.tsv` line is in the table, and that row's cleanup rule still applies before any public mirror.

The files use the retired name `foundation` 13 times, as written. EE-091 decided that `foundation/` moves to `identity/` (not built yet). None contains an em dash.

| File | sha256 | Ledger rows | FLAGS.tsv line and flags |
|---|---|---|---|
| `README.md` | `32d4bba8e99a2a132016365a9be4b2bed93e4ed853c8bfce09bd3a33fadb228e` | N-037 | line 130: mentura-confidential |
| `notes/unified-training-paper-and-thread-2026-11-01.md` | `74656a03319edcfbb6f7875af4270b01c9b33aa091959891b4e7c48f502b8072` | N-037 | line 131: mentura-confidential |
| `references/anthropic-2025-12-09-aaif.json` | `d2863e413bd55e5940e62f16aaf49762323638bb1326d241750da35f03e3f57d` | N-037 | line 132: mentura-confidential |
| `references/anthropic-2026-06-23-claude-tag.json` | `71edce2b6cd8a005de8b6ac48a8be0f559f5e3580a01d258c1384611e62a8c49` | N-037 | line 133: mentura-confidential |
| `references/archimate-3-2-capability.json` | `4c86079de1ddcc378cdba334f1420c03314fa16c078c05a161a85783972bd546` | N-037 | line 134: mentura-confidential |
| `references/arxiv-2305-00813.json` | `12787837ebecb0b6eb535c330d1dd9e6746646bc5b78d3206ccb81bfb5c7a8da` | N-037 | line 135: mentura-confidential |
| `references/arxiv-2502-17419.json` | `4b37484608f1930b57a8373bcfcef12ed77b4e73e6a600e364dc16a1c4a043e6` | N-037 | line 136: mentura-confidential |
| `references/arxiv-2610-40564.json` | `90e0c87e6ce9b9bce6b8927bab44a4f535816bc7426899dcad9d77c7a3ea9f13` | N-037 | line 137: mentura-confidential |
| `references/axios-2026-09-29-openai-run-rate.json` | `f27a127ca9dda86b7821a04187890fa5f008d66b4218319d5d0d8919d719880c` | N-037 | line 138: mentura-confidential |
| `references/bartlett-1932-remembering.json` | `8dbcae7608d53b0f3edf1a772fe9e4f5c6567aae1e34d309c055ba9be4c24b2b` | N-037 | line 139: mentura-confidential |
| `references/bgov-2026-10-08-openai-run-rate.json` | `caaf58da59eaeb9ac28deea6c54c651fcbc68a2bbdfe886afabfd13ed419a2a5` | N-037 | line 140: mentura-confidential |
| `references/claude-2026-10-21-duet.json` | `7e1350d549434dbcb6657353da3360f1025cbb5087725f3ed67f387b1db8238c` | N-037 | line 141: mentura-confidential |
| `references/claude-docs-agent-sdk-overview.json` | `24af03bfa16e55b00ecdac56e35000807d93efb222948b633a808a8c91d5fcce` | N-037 | line 142: mentura-confidential |
| `references/claude-docs-desktop.json` | `8503db70e99ce6893c1c797d20a9c0935e8b94425a2da1b95289637db792e1c8` | N-037 | line 143: mentura-confidential |
| `references/claude-docs-managed-agents.json` | `5893e04db5756ea8eed93b8133399125f4cd37b11d1aa4367a59f76ac48aa101` | N-037 | line 144: mentura-confidential |
| `references/cnbc-2026-03-31-openai-round.json` | `4ea6bd46daba0b951c17a2343c5f82f40bf02f07a287ddfd4cbef9009366c097` | N-037 | line 145: mentura-confidential |
| `references/dataconomy-2026-02-04-elevenlabs-series-d.json` | `7f7b0cb1b11da404bc47a0495956426ce11f26f2d637225c21115eb44782fd01` | N-037 | line 146: mentura-confidential |
| `references/dealroom-elevenlabs-22b-secondary.json` | `fef87ffc183b37ec4c5dd852d47975405702c9a7dfbe3286126c95a5805880e9` | N-037 | line 147: mentura-confidential |
| `references/decoder-2025-05-31-claude-elevenlabs.json` | `2367dc9d4162503f60afa7d03c549761daf4b41c8cddf06d60283f984b3aca6a` | N-037 | line 148: mentura-confidential |
| `references/elevenlabs-docs-agents-llm.json` | `8b8f6c789a923f1f5079e7cc7271faac91ccc4cb31f5657b08471e270a7653b4` | N-037 | line 149: mentura-confidential |
| `references/elevenlabs-docs-agents-overview.json` | `ffc93e9dc4d7bcc74c7548e1e61ac9930b205a06613c1023152d7a2842b786f6` | N-037 | line 150: mentura-confidential |
| `references/evans-2003-ddd.json` | `683dfb89246090edf21ed2c7d04ba1e0d10bf8b1f786bf0537c3a7d9664825e5` | N-037 | line 151: mentura-confidential |
| `references/iso-1087-2019.json` | `5d3fc05826c5af2f80dda140213a413ccbac28230b7f57e3e24d08dce21bc45f` | N-037 | line 152: mentura-confidential |
| `references/iso-29148-traceability.json` | `a17218e0daa428627a4a14265230feb8adb7301f89d0dfaefcf744d1443c93f8` | N-037 | line 153: mentura-confidential |
| `references/iso-42010-concern.json` | `0d0ebe0beb5157a9d0794916079595bb24083078bcae99bae826c7ad6a334bae` | N-037 | line 154: mentura-confidential |
| `references/iso-iec-11179.json` | `4dd2eac67c07e995cbe2f1012f95061a1893fe07a2dc6fa268a3a92d8dc61c82` | N-037 | line 155: mentura-confidential |
| `references/json-schema-2020-12.json` | `65f246118dd8fd2e67da2084baf239659af215f2bb370c39dd9b8e7a61e4417b` | N-037 | line 156: mentura-confidential |
| `references/kautz-2022-third-ai-summer.json` | `0dcda4940b11a1ffacd03ad2a299786724b896d13c6f416a5a46e6f8c8bade92` | N-037 | line 157: mentura-confidential |
| `references/kunz-rittel-1970-ibis.json` | `70f976457c82c821b60414473ca02c935cfa88753c269d487ba4de6991a575ab` | N-037 | line 158: mentura-confidential |
| `references/langchain-2025-10-20-series-b.json` | `c508d5c9126a18868cdc98e6ee593bdfaf51c8a1839a16e2d007cb5dc47ef77b` | N-037 | line 159: mentura-confidential |
| `references/latent-space-jev.json` | `8352a43ad69d47624052545145a104da53866bd9752879cb49cef77a89ebc8cd` | N-037 | line 160: mentura-confidential |
| `references/maclean-1991-qoc.json` | `f2318f594838c90856685c05050203087e9a5c0d115da355996aadea91e6e5bd` | N-037 | line 161: mentura-confidential |
| `references/macrumors-2026-10-21-duet.json` | `8b0c800b45df5f7e8d1b2e9a0cc563f4ea4e800ce97ed811c2dda0977fe73e80` | N-037 | line 162: mentura-confidential |
| `references/minsky-1974-frames.json` | `154e6a168f75a76261f79d09435488060a7b59933b0d113789d8da1e8672c1ba` | N-037 | line 163: mentura-confidential |
| `references/newell-simon-1972-hps.json` | `ed8a270655c443165d0fa3169d0e6f6e7dea4b77c2fbfcd046468f908302b535` | N-037 | line 164: mentura-confidential |
| `references/openai-blog-2026-06-08-draft-s1.json` | `42a719c06299de2787742ad0a9be98657014301e7d030944354fc418c6741fe5` | N-037 | line 165: mentura-confidential |
| `references/quillian-1968-semantic-memory.json` | `58532e27028aebef0a0a68d48d9602065c684c7155af25099f1e3cca80eb6a11` | N-037 | line 166: mentura-confidential |
| `references/raid-log.json` | `d492913966cd44a1f1828fbb9e3ccfa2dc09154a2196877ed6f9d08673463b8c` | N-037 | line 167: mentura-confidential |
| `references/reuters-2026-02-04-elevenlabs.json` | `8bdac2b0716e54a3f5677d972eec1b9ce9d5d7680596f47ca525bdb8d1d57c82` | N-037 | line 168: mentura-confidential |
| `references/schank-1972-cd.json` | `9c3c3e0e3664e80fe3c0b9e07e48bc3e88dd4247c6a6146b68a28fc852c61313` | N-037 | line 169: mentura-confidential |
| `references/schank-abelson-1977-scripts.json` | `3cc10ea46cff284824532aaf14a931c84268fe362ab8af955746c73af950c97a` | N-037 | line 170: mentura-confidential |
| `references/sciencebuddies-edp.json` | `b58aed9e2d76bc2944ec6793277c95cf195defed030055439d4f59e044261432` | N-037 | line 171: mentura-confidential |
| `references/techcrunch-2025-05-27-claude-voice.json` | `79ce991bec9c01ef9b25e8441a012c566ea964d077d5e6d9bb9f0d09c3d45bb4` | N-037 | line 172: mentura-confidential |
| `references/techcrunch-2025-07-08-langchain.json` | `498e0d96a1efb72bcd6e0ab2fb30e133d2ba9f3f4513e26a965f783259429475` | N-037 | line 173: mentura-confidential |
| `references/techcrunch-2025-10-28-openai-recap.json` | `185f36ae7a9121fa4c2826af19600fa0cb9299f7c3194ef5aa1bb07bec346e82` | N-037 | line 174: mentura-confidential |
| `references/torian-google-2026-11-01-0759.json` | `d95a6d7dfd9c40e525b33f19ba1651fe50979f318e65e1cefbdd5a3a2d568f04` | N-037 | line 175: mentura-confidential,founder-personal |
| `references/typesafe-2026-09-15-jev-launch.json` | `fe44ab9221577cc60de02228816491ddfd77ae14591bb509ca396bec9e1116cd` | N-037 | line 176: mentura-confidential |
| `references/typesafe-manifesto.json` | `5f7a050ed168e9de9801b38a3d08c7a4b187d6f2b0b2eb591a449cab09a13026` | N-037 | line 177: mentura-confidential |
| `references/w3c-prov-dm-2013.json` | `4a754c510b9b6a10e3984ac5dfdfde557828b352e4cd116ab0f8b2c8d23517ec` | N-037 | line 178: mentura-confidential |
| `references/w3c-skos-2009.json` | `1dd84f0ec258557469ea57ee7ade8a374390f68f1b41b657b61cb6f39be20e48` | N-037 | line 179: mentura-confidential |
| `references/wikipedia-openai-2026-11-01.json` | `a78ee900524c70c014ca9c04d2055e10577bb192c11149b72abd0741e3261cf3` | N-037 | line 180: mentura-confidential |
| `relationships/anthropic-supplies-elevenlabs.json` | `68964e608ec199d532b5b45517a702ada80478c2433c4070cd178bf6a8bb397e` | N-037 | line 181: mentura-confidential |
| `relationships/anthropic-supplies-us.json` | `60ab66835e5e8b29efec9986437bb417b35527d5023ab68360adc4ef1b7edad1` | N-037 | line 182: mentura-confidential |
| `relationships/competitor-check-2026-11-01.json` | `060ae1105af6fe1eb95585a6e717e263dbb95c8edfc64bae1144c98c4e353358` | N-037 | line 183: mentura-confidential |
| `relationships/elevenlabs-supplies-anthropic.json` | `501f4fef80c07b00167ec146c957c9e0026855a1aaf009d0a64bbbbb9469691a` | N-037 | line 184: mentura-confidential |
| `relationships/langchain-supplies-us.json` | `a9e44d6f004005ac7869670ab8b6b322ff159ed284b7c5e707e0e7bc590114d3` | N-037 | line 185: mentura-confidential |
| `relationships/spacexai-supplies-us.json` | `885a1d2701e39c18acba1521b8906701e5c7620c9d5e6313a46e28c00db74ee0` | N-037 | line 186: mentura-confidential |
| `relationships/typesafe-supplies-us.json` | `4dddaf79463f1987f6dda85ef55e51d6513f4526d45dbf5a4c062efbc0232268` | N-037 | line 187: mentura-confidential |
| `research-areas/areas.json` | `0a4782376609a4d0f26063f54edb1d51be5dc7f04e06a5efcb44f641c32f120c` | N-037 | line 188: mentura-confidential |
| `research-areas/memberships.json` | `9993ce5ca20ec98695ab5a8d2e2cb9e94aadb2aa4daf9d4197a8f0c08920a698` | N-037 | line 189: mentura-confidential |
| `research-areas/self.json` | `9a137d99683b182653cce5ab9780f6eaf61636aa3b63c7b93ab11798ebd713e4` | N-006, N-037 | line 190: names-polity,mentura-confidential |
| `supplier-searches/rl-environment/candidates/build-own.json` | `a0d26adf0e4b27939be4d7aff90c463ef687f8f4b6b746118fc1b34cad6dd7ee` | N-037 | line 191: mentura-confidential |
| `supplier-searches/rl-environment/candidates/gymnasium.json` | `8cf7d1b41ec318940dde6e369dcc3285b7c58e5237c3701dd9ea9130ff549970` | N-037 | line 192: mentura-confidential |
| `supplier-searches/rl-environment/candidates/mechanize.json` | `4510f343ed9f85821c4c3cc521995064977fadd72dd63eb06323f9336b604d46` | N-037 | line 193: mentura-confidential |
| `supplier-searches/rl-environment/candidates/prime-intellect-verifiers.json` | `2d683d44915953c718a58b329d3ea456300d8bb719e894bfcc336aba817b8ecd` | N-037 | line 194: mentura-confidential |
| `supplier-searches/rl-environment/finance-inquiry.json` | `f66348ef719103fb04c7cac1b235121052fa506def3db4049d36a66ad8ca78dc` | N-037 | line 195: mentura-confidential |
| `supplier-searches/rl-environment/identity.json` | `a744a162a9492c3d951aeeee0e666b0600cdf0ce95bb6d99b52d7d406d909453` | N-037 | line 196: mentura-confidential |
| `supplier-searches/rl-environment/ranking.json` | `c2dddc9fc2846d0c2a67f5218fdbc8d42f7ebdbd3c28f951c7a5ed3bec47e45d` | N-037 | line 197: mentura-confidential |
| `ventures/ami-labs/research.json` | `6dceba7963b08888ab55ccdb98ea445c84c513daa8cb51ce751e4860dfc1d0f1` | N-037 | line 198: mentura-confidential |
| `ventures/ami-labs/venture.json` | `2ba4cf43a6f54326e7a69d85974b3ddadc1a7bccea0df562c05bfad27c0fe21c` | N-037 | line 199: mentura-confidential |
| `ventures/anthropic/anatomy.json` | `2dfb4df857224eec6e49448ebc4c8bf0e370e46edbff3ac62d567148c605584c` | N-037 | line 200: mentura-confidential |
| `ventures/anthropic/capabilities.json` | `7ef5fc8ee97b926c1fe90f79e9c8b1c22d360c893c396b45678830a72b4e9df9` | N-037 | line 201: mentura-confidential |
| `ventures/anthropic/product-anatomy/answers.reasoned.json` | `cfaa1cbbdcfb9f65046dd84e481144a60ebcc1244ff7569522994b372c1704a2` | N-037 | line 202: mentura-confidential |
| `ventures/anthropic/product-anatomy/input.json` | `809ef0c54267429f2ebdfb2720e09cdfb7bf32b5fa061ce88b44cb37aa4b4bfd` | N-037 | line 203: mentura-confidential |
| `ventures/anthropic/product-anatomy/matrix.json` | `ab6d32ed4d5d2142d7be17418bda391177d5293dce7baed1f15268cc975a7649` | N-037 | line 204: mentura-confidential |
| `ventures/anthropic/product-anatomy/matrix.md` | `c9dd0e64d3b02d7c4d0f96e9f4123d7da7829e120e832514aa593d69876532c4` | N-037 | line 205: mentura-confidential |
| `ventures/anthropic/products/agent-sdk.json` | `fed7239a12a976fa80ca2778ed3fce2245295e07216fcdf0470da9f8f1be1f58` | N-037 | line 206: mentura-confidential |
| `ventures/anthropic/products/applied-ai.json` | `c3e394b3c87b631ef1c9f53bb95a366061b1782f1d4708e19cad721c299c7b2c` | N-037 | line 207: mentura-confidential |
| `ventures/anthropic/products/claude-app.json` | `d713f22cb91cb6a744dc6a13df71b2a74aa9b49cfd409ecfca1aea18642537c6` | N-037 | line 208: mentura-confidential |
| `ventures/anthropic/products/code.json` | `0eb478efd5596e0ee289748b61c338dc1bac77498a788b0d5a932883b7bd93b7` | N-037 | line 209: mentura-confidential |
| `ventures/anthropic/products/console.json` | `18d442166fa1945f08915fda0b1b3bc4f61ab9d99f3880206beb9bb546411a65` | N-037 | line 210: mentura-confidential |
| `ventures/anthropic/products/cowork.json` | `f3de8a2b843f65cc7ab2830cd57bba7a160b4521c94b117ec3d673b2141638b5` | N-037 | line 211: mentura-confidential |
| `ventures/anthropic/products/duet.json` | `c7cfc7bbd4432a9b4c6b72382a54d057fa969c025c3cc5c487f09cdf87c409ed` | N-037 | line 212: mentura-confidential |
| `ventures/anthropic/products/harnesses.json` | `cb78c78a2badce3278a06ff6acfc55b06fd82ba8b7ace69ae071c8087b3f7de3` | N-037 | line 213: mentura-confidential |
| `ventures/anthropic/products/model-hardware-standard.json` | `6de518d3b331a966a7be71f51bb02535c2c60a75f051f8779251be01669451fc` | N-037 | line 214: mentura-confidential |
| `ventures/anthropic/products/models.json` | `a8a655540931b7dcb491d73bfe00894f95bb15b0346b303bf4e46bd68e4af534` | N-037 | line 215: mentura-confidential |
| `ventures/anthropic/products/platform.json` | `5633b2c7929d0c6bc2ce9290cb61aad06d8fa33f97baa77599aa7fcc5e1b1a63` | N-037 | line 216: mentura-confidential |
| `ventures/anthropic/products/tag.json` | `699527259616c902f5173066ed0c8372a251691c59b94b6eca5e004c16941715` | N-037 | line 217: mentura-confidential |
| `ventures/anthropic/research.json` | `fb29ce3ee15ec86bd0b5f7992e8f24ed3e5113c7f69e30cd28c655fddec925fe` | N-037 | line 218: mentura-confidential |
| `ventures/anthropic/safety.json` | `af961d8d25124669b354ef7beaf30e3120dd8a0d3522d582676ec807a391de19` | N-037 | line 219: mentura-confidential |
| `ventures/anthropic/venture.json` | `df54941ba6d4a0dce4ca4d793ed4bdabe281512d008a3ec319a7149b531c4e04` | N-037 | line 220: mentura-confidential |
| `ventures/elevenlabs/anatomy.json` | `328a89d9b83c9d6c530741fe0b92780962881c12eb5fee0a8f8bce7c8cc66959` | N-037 | line 221: mentura-confidential |
| `ventures/elevenlabs/capabilities.json` | `d4d5d5b4dfbafbb15f8a691290de36b3777261b42eac74c9e3301466cea8016f` | N-037 | line 222: mentura-confidential |
| `ventures/elevenlabs/research.json` | `042f1370abd418b9cd93a9069133e655bf8f3c864924e1ea923ba62be1dedf90` | N-037 | line 223: mentura-confidential |
| `ventures/elevenlabs/venture.json` | `19869b9fe2bc8c824ca73b8ffc21b55ffbc94f20fd78bf2846646af4ae987aa0` | N-037 | line 224: mentura-confidential |
| `ventures/google-deepmind/research.json` | `5621f43b2c0ffb4d25418db6759d98c8b19d2a7f5610fc8367c34d4f2a0e54ce` | N-037 | line 225: mentura-confidential |
| `ventures/google-deepmind/venture.json` | `d9c8c1dd22320f8acf93b7ea0a435ec56f99802fd791f46fcf96921075cad20d` | N-037 | line 226: mentura-confidential |
| `ventures/langchain/anatomy.json` | `914305671f8fd9440cfb4367976492ab68f650cc1f43defa33179d6d3dc657aa` | N-037 | line 227: mentura-confidential |
| `ventures/langchain/products/langsmith.json` | `65645d18e04305bff8a71d4147bed0fb78ca522b59e1162d1a2684e01077903c` | N-037 | line 228: mentura-confidential |
| `ventures/langchain/venture.json` | `5377462aa44d8d7f7bc5cdb3fa7e8f453f2cccd043f019b24cb550c22e85091d` | N-037 | line 229: mentura-confidential |
| `ventures/nvidia/research.json` | `16fec62ee626675430ccb2ce26bc5ea790c419969cd9934774523786bd42cc0d` | N-037 | line 230: mentura-confidential |
| `ventures/nvidia/venture.json` | `fd62bc2e344333eface5688ed9ce29f8fcd2ab7175da657bb88be166860cd130` | N-037 | line 231: mentura-confidential |
| `ventures/openai/anatomy.json` | `29e630993fec7a1c18d5949c43a0c54ab9baed126df99c6e760ca9a67d7dfff0` | N-037 | line 232: mentura-confidential |
| `ventures/openai/products/api.json` | `df997c984ded96a064a6b531f65fad66c9123cdf40a242df23c6e0f2b54d2cbf` | N-037 | line 233: mentura-confidential |
| `ventures/openai/products/atlas.json` | `3d9a58e2b60483ed51a8a20a3f78742f94d3053fabdaf5bb846c8def2ea9d34d` | N-037 | line 234: mentura-confidential |
| `ventures/openai/products/chatgpt.json` | `8b984d46cdf2944e1896a7490603c2fb29d967904d593d1be592cd1cd2ca29c5` | N-037 | line 235: mentura-confidential |
| `ventures/openai/products/codex.json` | `22d823677b16890045957be14607485d42afcca0450673c14bbd87f348161ebc` | N-037 | line 236: mentura-confidential |
| `ventures/openai/products/devices.json` | `ddc3590cc38acf90357c66ef7b5d56639ec1a3c55969ae734ef7bfea396f6282` | N-037 | line 237: mentura-confidential |
| `ventures/openai/research.json` | `a62747b9fe066fe20f94e6cfbf1acd85f163bc08a69df2da60bdb2d2f568f076` | N-037 | line 238: mentura-confidential |
| `ventures/openai/venture.json` | `3253036a824cbbfa8196f26560f7316bf243d4e657082359fe85967bee45ba2c` | N-037 | line 239: mentura-confidential |
| `ventures/spacexai/research.json` | `9b16ef1817dcf76c9aeaa089423068326beb01f4932b273762da26912e67d704` | N-037 | line 240: mentura-confidential |
| `ventures/spacexai/venture.json` | `cbe1cd6c48994744d6016c244b729f8b09e920bc668cc63e019d344acb62f7ac` | N-037 | line 241: mentura-confidential |
| `ventures/thinking-machines/research.json` | `360eaf304f39a6c7a360f8394e53d27f03fc3272f1e904d925194ea5d8cf4500` | N-037 | line 242: mentura-confidential |
| `ventures/thinking-machines/venture.json` | `1d97e19cb1a026a8daf949f5c158f2c72ae40c0e236f7d53eabbb4f92af02951` | N-037 | line 243: mentura-confidential |
| `ventures/typesafe/products/jev.json` | `2e0c3fe1832ae94069c5b80d1dcca7e4fc079083e7c20caa8f7b8d29e02c852e` | N-037 | line 244: mentura-confidential |
| `ventures/typesafe/research.json` | `93cd6d656066378283a459a38336cf005966d65136edcc5ccdc8c8a792d15b43` | N-037 | line 245: mentura-confidential |
| `ventures/typesafe/venture.json` | `91811af8897f472f52ac23bf9532edccd723856c317d5b09acd64cf217f1800f` | N-037 | line 246: mentura-confidential |
| `ventures/world-labs/research.json` | `4e5cc1b03da12c1a74b1f72dff1b2a4ace882b2dac9b2e0e7a95fdd6ec0c2d48` | N-037 | line 247: mentura-confidential |
| `ventures/world-labs/venture.json` | `73cd69f9b4f456e753b77be6d39de33c704e1ce22482f7dbcfc4b9bad271c789` | N-037 | line 248: mentura-confidential |
