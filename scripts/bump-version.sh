#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
CURRENT=${LATEST_TAG#v}

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

BUMP_TYPE="${1:-}"

if [ -z "$BUMP_TYPE" ]; then
  echo "Current version: $LATEST_TAG"
  echo ""
  echo "Usage: ./scripts/bump-version.sh [patch|minor|major]"
  echo ""
  echo "  patch  -> v$MAJOR.$MINOR.$((PATCH + 1))   (bugfixes, small changes)"
  echo "  minor  -> v$MAJOR.$((MINOR + 1)).0         (new features, backwards compatible)"
  echo "  major  -> v$((MAJOR + 1)).0.0              (breaking changes)"
  exit 0
fi

case "$BUMP_TYPE" in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  *)
    echo "Error: unknown bump type '$BUMP_TYPE'"
    echo "Use: patch, minor, or major"
    exit 1
    ;;
esac

NEW_TAG="v$MAJOR.$MINOR.$PATCH"

echo "Bumping: $LATEST_TAG -> $NEW_TAG"

git tag -a "$NEW_TAG" -m "Release $NEW_TAG"

echo ""
echo "Tagged. Push with:"
echo "  git push origin $NEW_TAG"
echo ""
read -rp "Push now? [y/N] " confirm
if [[ "$confirm" =~ ^[yY]$ ]]; then
  git push origin "$NEW_TAG"
  echo "Pushed. GitHub Actions will build the image."
else
  echo "Skipped push. Run: git push origin $NEW_TAG"
fi
