# 아트와 사운드 기록

- `terminus-night-v03.webp`: 사용자가 제공한 눈 내리는 종착역 콘셉트 이미지의 게임용 변환본.
- `rize-sd-v03.webp`: 사용자 참고 이미지에서 생성하고 승인받은 리제 SD 시안.
- `platform-stone-v03.webp`: 게임용으로 생성한 설야 석재 바닥 텍스처.
- `rize-walk-v09.webp`: 승인 SD를 기준으로 생성한 정면/오른쪽/뒤/왼쪽과 3개 동작 프레임. 144px 셀 4×3 아틀라스. 다리 움직임·머리카락의 프레임 일관성은 실기 아트 검수 대상.
- `enemies-v09.webp`: 생성한 적/보스 아틀라스. 144px 셀 3×4. 일반 6종·보스 3종·정예 2종과 장식 가방.
- `icon-*.png`: 리제 SD로 제작한 홈 화면 아이콘. maskable 버전은 여백을 확장.
- BGM·효과음: `js/audio.js`에서 오실레이터로 합성하는 프로젝트 오리지널 패턴. 외부 음원·외부 웹 폰트 없음.

생성 원본 이미지는 대화의 생성 이미지 기록으로 보관됩니다. 이 저장소에는 실행에 필요한 압축본을 포함했습니다. 정식 상업 공개 전 참고 이미지 출처와 사용 조건을 재확인합니다.
## v0.10 환경 에셋

- `assets/station-props-v010.webp`: ChatGPT 내장 이미지 생성으로 만든 투명 2×2 환경 아틀라스. 1254×1254 RGBA 원본을 WebP로 압축했으며 실제 알파를 유지했다. 파일 크기 248,246바이트.
- 셀 순서: 왼쪽 위 눈 쌓인 철제 벤치, 오른쪽 위 시계 가로등, 왼쪽 아래 여행 가방, 오른쪽 아래 철도 신호기.
- 실제 게임의 `js/render.js`에서 사용하며, `sw.js`의 오프라인 묶음에 포함한다.
- 생성 원본은 대화의 이미지 기록에 보관. 아래가 사용한 최종 프롬프트이며 CLI/API 대체 생성은 사용하지 않았다.

```text
Use case: stylized-concept. Asset type: game environment sprite atlas for Terminus Girl, dark gothic railway anime survival game in snow. Generate a production-ready 2 by 2 sprite atlas on genuinely transparent background, four equal square cells, no borders or labels. Fixed layout: TOP LEFT one elegant snow-covered dark wrought-iron station bench; TOP RIGHT one tall Victorian railway clock and warm amber lantern on a single pole; BOTTOM LEFT one compact pile of three old leather trunks and a small suitcase with snow; BOTTOM RIGHT one narrow gothic railway signal pillar with a muted blue-green glass light and brass fittings. Slight elevated 3/4 view suitable for top-down game sprites. Painterly detailed anime game art, muted midnight navy, slate silver, aged brass and restrained warm amber, matching a silver-haired navy-uniformed conductor in a moonlit snowy gothic station. Every whole object completely contained and isolated inside its own cell with generous 12 percent transparent margins; bases line up consistently toward bottom of cells. No characters, no scenery ground plane, no words, no cast shadows outside the object, no checkerboard, no watermark. Readable silhouettes at small mobile scale, soft cool highlights, no bright white outline.
```

v0.11의 보스 2단계 오라·예고·불씨 표시는 기존 아트와 `js/render.js`의 Canvas 도형으로 구현했다. 새 외부 음원/이미지 의존성은 없다.

## v0.13 기억 등불

- `assets/memory-lantern-v013.webp`: 선택형 전투 목표를 위한 프로젝트용 생성 아트. 내장 이미지 생성으로 제작했다. 새벽 남색 금속·오래된 황동·호박빛 불꽃·푸른 기억의 결을 기존 리제/역의 분위기와 맞췄다.
- 1199×1312 투명 PNG 원본을 비율과 알파를 유지해 234×256 WebP로 축소/압축했다. 13,574바이트. 게임에 직접 로드하며 PWA 오프라인 묶음에 포함한다. 원본은 대화의 생성 기록에 보관한다.
- 복원 링·카운트다운·화면 밖 방향 표시는 Canvas로 그린다. 이미지 로드 전에도 간단한 등불 도형으로 위치와 상호작용을 읽을 수 있다. 이펙트 감소/저화질에서도 필수 진행 표시는 유지한다.
- 최종 프롬프트(내장 도구 사용, 외부 CLI/API 생성 미사용):

```text
Use case: stylized-concept. Asset type: single transparent sprite for the gothic fantasy mobile game Terminus Girl. A beautiful small antique railway memory lantern, isolated on a genuinely transparent background. Dark midnight navy iron frame, aged brass fine gothic ornament, delicate arched carrying handle, clear tall glass panes containing a calm warm amber flame and a very subtle pale blue memory wisp. Three-quarter front view seen slightly from above, matching polished Japanese fantasy RPG painted environment props. Quiet melancholy snowy railway mood, silver blue reflected edge light, ornate but readable strong silhouette at 60 pixels. One lantern only, centered, complete intact object, approximately 70 percent of canvas height with transparent margin around it. Crisp opaque metal edges and glass detail, contained interior glow only, no large bloom, no ground, no shadow platform, no background, no text, no UI circle, no frame, no watermark.
```

## v0.14 마레 SD

- `assets/mare-walk-v014.webp`: 첫 동료 마레의 프로젝트용 신규 AI 생성 아틀라스. 청회색 단발·베레모·아이보리 목도리·남색 짧은 코트로 현 리제의 긴 은발/차장 모자와 구분했다.
- 열: 정면/오른쪽/뒤/왼쪽, 행: 대기/걷기 좌/걷기 우. 원본 투명 PNG를768×576(192px셀4×3) WebP로 최적화했다. 실제 알파 유지, 101,594바이트. Canvas 동료와 대화 화면에서 사용하며 PWA 묶음에 포함한다. 실제 동작 일관성과 작은 화면 가독성은 실기 아트 검수 대상이다.
- 내장 이미지 생성 사용, 원본은 대화의 생성 이미지 기록. 최종 프롬프트:

```text
Use case: stylized-concept. Asset type: production transparent character sprite sheet for gothic railway anime RPG Terminus Girl. Create ONE consistent new original companion named Mare, a kind but resolute young adult woman with a neat short icy blue bob haircut, blue eyes, a small pale blue beret without conductor visor, navy blue short travelling coat, ivory scarf, dark knee length pleated skirt, brown lace-up boots, brass buttons and a small blue protective crystal brooch. No lantern, no weapons. Cute detailed chibi proportions about 3 heads tall, delicate painterly anime fantasy art, cool midnight blue and soft brass palette, clear silhouette. STRICT sprite sheet of 4 columns and 3 rows, TWELVE equal cells, exactly one complete full-body Mare in each cell, no other objects. Column order from left to right: facing camera/front; facing right profile; facing away/back; facing left profile. Row 1: neutral standing idle, feet together. Row 2: walking with left foot forward. Row 3: walking with right foot forward. Each column retains its facing direction across all three rows. Same clothes, haircut, proportions, body scale in every cell. Feet at same baseline inside each cell, generous transparent padding around each sprite, whole hat and boots contained in its own cell, no overlap. Transparent background with real alpha. No ground, no shadows outside sprite, no lettering, no numbers, no cell borders, no UI, no watermark. This is a clean game animation atlas, not a concept page.
```

- `assets/party-portraits-v017.webp`: 2026-11-18 프로젝트용으로 신규 생성한 3열 × 2행 동료 초상화 아틀라스. 배치: 상단 마레/아스터/노아, 하단 벨라/이리스/크로우. 288×192 WebP (7,320바이트), iPhone 모바일 선택 화면에 맞춘 시험용 압축본. 기존 마레의 청회색 단발·하얀 목도리를 유지하되 6명 전원의 고딕 철도 일러스트를 시각적으로 통일했다. 캐릭터 전신 SD는 대체하지 않으며 정식 원화 교체 가능. CSS `background-size: 300% 200%`와 x 0/50/100%, y 0/100%로 잘라 재사용.

- `assets/companions-sd-v018.webp`: 아스터(기록)/노아(신호)/벨라(의무)의 생성형 원작 SD 3×3 애니메이션 아틀라스. 행 순서 아스터·노아·벨라, 열 순서 대기·왼발·오른발. 2026-11-18 생성 후 배경 연결 영역만 투명 처리하고 192×192, 12,784B WebP로 압축. 컨셉 인물은 `party-portraits-v017.webp`와 동일하며, 정면 중심 3자세이므로 4방향 완성 스프라이트 아님. 기존 마레 보행 아틀라스는 유지.

- `assets/companions-sd-v019.avif`: 2026-11-18 실제 플레이 스크린샷에서 이전 SD 손상 확인 후 생성 원본 PNG(1254×1254)에서 다시 배경/인물 분리. 3×3 atlas, 384×384, 128×128 per-frame, 23,020 bytes. 원본의 밝은 머리카락·베일·의복이 기존 흰색 임계값 방식에서 함께 지워진 것을 방지하기 위해 각 셀 외곽에 연결된 근백색 배경만 투명 처리하고 가장자리 알파를 보정. AVIF 우선 사용, WebP v018은 fallback 전용. 앱 로직에서 완전한 방향별 스프라이트로 간주하면 안 됨.
