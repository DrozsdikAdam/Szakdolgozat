#!/usr/bin/env bash
set -euo pipefail

STRATEGY="${1:-canary}"
IMAGE_TAG="${2:-latest}"
TIMEOUT="${3:-300s}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PIPELINE_ENV="$REPO_ROOT/devops/ci/pipeline.env"

if [ -f "$PIPELINE_ENV" ]; then
  set -a
  source "$PIPELINE_ENV"
  set +a
fi

APP_NAME="${APP_NAME:-${BACKEND_IMAGE:-mes-backend}}"
APP_NAMESPACE="${APP_NAMESPACE:-app-mes}"
FRONTEND_APP="${FRONTEND_IMAGE:-mes-frontend}"

if [ "$STRATEGY" = "blue-green" ] || [ "$STRATEGY" = "bluegreen" ]; then
  OVERLAY_DIR="$REPO_ROOT/devops/k8s/overlays/production-bluegreen"
  ROLLOUT_NAME="${APP_NAME}-bluegreen"
else
  OVERLAY_DIR="$REPO_ROOT/devops/k8s/overlays/production"
  ROLLOUT_NAME="${APP_NAME}-canary"
fi

cd "$OVERLAY_DIR"
kustomize edit set image mes-backend="${APP_NAME}:${IMAGE_TAG}" || true
kustomize edit set image mes-frontend="${FRONTEND_APP}:${IMAGE_TAG}" || true
cd - > /dev/null

kustomize build "$OVERLAY_DIR" --load-restrictor LoadRestrictionsNone > /dev/null

if [ "$APP_NAME" != "mes-backend" ]; then
  kustomize build "$OVERLAY_DIR" --load-restrictor LoadRestrictionsNone \
    | sed "s/mes-backend/${APP_NAME}/g" \
    | kubectl apply -f -
else
  kubectl apply -k "$OVERLAY_DIR" --load-restrictor LoadRestrictionsNone
fi

if kubectl argo rollouts version >/dev/null 2>&1; then
  if ! kubectl argo rollouts status rollout/"$ROLLOUT_NAME" -n "$APP_NAMESPACE" --timeout="$TIMEOUT"; then
    echo "::error::Rollout failed or timed out for $ROLLOUT_NAME in $APP_NAMESPACE! Triggering automatic rollback..."
    kubectl argo rollouts abort rollout/"$ROLLOUT_NAME" -n "$APP_NAMESPACE" || true
    kubectl argo rollouts undo rollout/"$ROLLOUT_NAME" -n "$APP_NAMESPACE" || true
    exit 1
  fi
else
  echo "Argo Rollouts CLI plugin nincs telepítve, natív kubectl-lel kérdezzük le az állapotot..."
  kubectl get rollout "$ROLLOUT_NAME" -n "$APP_NAMESPACE"
fi
