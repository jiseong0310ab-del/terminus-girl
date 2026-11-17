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
