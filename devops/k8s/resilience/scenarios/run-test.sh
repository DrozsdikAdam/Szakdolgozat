#!/bin/bash
    set -e
    SCENARIO="${1:-baseline}"
    TARGET_HOST="${TARGET_HOST:-paas-portal-backend.platform-infra.svc.cluster.local}"
    TARGET_PORT="${TARGET_PORT:-3000}"
    DURATION="${DURATION:-60}"
    THREADS="${THREADS:-10}"
    mkdir -p /results
    echo "=== JMeter Terhelésteszt Indul: ${SCENARIO} ==="
    echo "Célpont: http://${TARGET_HOST}:${TARGET_PORT}, Időtartam: ${DURATION}s, Szálak: ${THREADS}"
    jmeter -n \
      -t "/scenarios/${SCENARIO}-test.jmx" \
      -JTARGET_HOST="${TARGET_HOST}" \
      -JTARGET_PORT="${TARGET_PORT}" \
      -JDURATION="${DURATION}" \
      -JTHREADS="${THREADS}" \
      -l "/results/${SCENARIO}-result.jtl"
    echo "=== Teszt Sikeresen Befejeződött! ==="