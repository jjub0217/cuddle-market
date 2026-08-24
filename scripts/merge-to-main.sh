#!/usr/bin/env bash
#
# develop 을 main 에 올린다. **사람이 손으로 친다** — 어디서도 자동으로 부르지 마라.
#
# ⚠️ 왜 이 스크립트가 있나
#    같은 곳에서 두 번 데었다. `git merge develop` 이라고 쓰면 **로컬** develop 을 본다.
#    `git fetch` 는 `origin/develop` 만 갱신하므로, 로컬이 뒤처져 있으면 머지가
#    **조용히 커밋을 빠뜨린다. 오류도 안 난다** — Fast-forward 로 성공해 버린다.
#
#      2026-08-01   23커밋을 빠뜨렸다 (푸시 전에 알아채 피해는 없었다)
#      2026-08-07   65커밋을 빠뜨린 채 「완료」로 보고하고 푸시까지 했다
#
#    그래서 여기서는 `origin/develop` 을 박아 두고, **푸시 전에 해시를 대조**해
#    다르면 멈춘다. 눈으로 확인하던 것을 기계가 대신 본다.
#
# ⚠️ 푸시는 물어보고 한다. 전역 규칙이 「머지는 사용자가 직접」이라, 이 스크립트가
#    대신 밀어붙이면 그 규칙을 어기는 셈이 된다.
#
# 쓰는 법:  ./scripts/merge-to-main.sh
set -euo pipefail

# ⚠️ 변수 이름은 반드시 영문이다. **bash 는 한글 변수 이름을 못 쓴다**(zsh 는 된다).
#    한글로 지었다가 `command not found` 로 죽었다(2026-08-24). 문구만 한국어로 둔다.

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; OFF=$'\033[0m'

die() { echo "${RED}✖ $1${OFF}" >&2; exit 1; }

# 0) 작업 트리가 깨끗해야 한다 — 브랜치를 옮기므로
[ -z "$(git status --porcelain)" ] || die "커밋 안 된 변경이 있다. 먼저 정리해라."

orig_branch=$(git branch --show-current)

echo "${YELLOW}① origin 을 받는다${OFF}"
git fetch origin --quiet

echo "${YELLOW}② main 으로 옮겨 최신으로 맞춘다${OFF}"
git checkout --quiet main
git pull --ff-only origin main

missing=$(git rev-list --count main..origin/develop)
if [ "$missing" = "0" ]; then
  echo "${GREEN}✔ main 이 이미 origin/develop 과 같다. 할 일이 없다.${OFF}"
  git checkout --quiet "$orig_branch"
  exit 0
fi
echo "   main 에 없는 커밋 ${missing}개:"
git log --oneline main..origin/develop | sed 's/^/     /'

echo "${YELLOW}③ origin/develop 을 머지한다${OFF}"
# ⚠️ 여기를 `git merge develop` 으로 바꾸지 마라. 로컬 이름을 쓰면 위 두 사고가 되풀이된다.
git merge origin/develop --no-edit

# ④ 푸시 전에 해시를 대조한다 — 이게 이 스크립트의 핵심이다
main_sha=$(git rev-parse main)
remote_sha=$(git rev-parse origin/develop)
if [ "$main_sha" != "$remote_sha" ]; then
  echo "   main           $main_sha"
  echo "   origin/develop $remote_sha"
  die "해시가 다르다. 푸시하지 않는다 — 무언가 빠졌을 수 있다."
fi
echo "${GREEN}✔ 해시가 같다 — ${main_sha:0:8}${OFF}"

# ⑤ 푸시는 물어본다
# ⚠️ `read -r -p` 는 **맥 기본 bash 3.2 에서도 된다.** 2026-08-24 에 확인했다
#    (GNU bash 3.2.57 · arm64-apple-darwin25). `-p` 는 bash 내장이라 readline 유무와 무관하다.
#    스크립트 전체를 끝까지 돌려 이 줄까지 오는 것도 확인했다.
# ⚠️ 터미널이 아닌 곳(CI 등)에서는 여기서 멈춰 선다. **그러라고 둔 것이다** —
#    이 스크립트는 사람이 손으로 치는 것이지 자동으로 부를 것이 아니다.
echo
read -r -p "main 을 origin 에 푸시할까? (y/N) " answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
  git push origin main
  echo "${GREEN}✔ 푸시했다.${OFF}"
else
  echo "${YELLOW}푸시는 안 했다. 로컬 main 에는 머지돼 있다.${OFF}"
fi

git checkout --quiet "$orig_branch"
echo "${GREEN}✔ 원래 브랜치(${orig_branch})로 돌아왔다.${OFF}"
