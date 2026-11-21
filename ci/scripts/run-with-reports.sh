#!/usr/bin/env bash
#
# Ejecuta un comando dentro de un contenedor del proyecto y conserva los
# archivos que produce (reportes y cobertura).
#
# ¿Por qué existe?
#   El controlador de Jenkins comparte el socket del daemon del host
#   (Docker-outside-of-Docker). Un bind mount que apunte a `$WORKSPACE` no
#   funciona: esa ruta vive dentro del contenedor de Jenkins y el daemon del
#   host no la ve. Por eso los artefactos se extraen con `docker cp`, que deja
#   los archivos con el UID de quien invoca el CLI (el usuario `jenkins`).
#
# Uso:
#   COMPOSE_CMD="docker compose -p pos-stack-ci -f docker-compose.yml -f ci/docker-compose.ci.yml" \
#   ./ci/scripts/run-with-reports.sh \
#     --name pos-ci-api-unit --service api \
#     --env DATABASE_URL=postgresql://pos:pos@db:5432/pos_test \
#     --copy /app/apps/api/reports:reports/api-unit \
#     --copy /app/apps/api/coverage:coverage/api-unit \
#     -- pnpm test:cov
#
# Salida: el código de salida del comando ejecutado en el contenedor.
set -uo pipefail

usage() {
  cat <<'EOF'
Uso: run-with-reports.sh --name NOMBRE --service SERVICIO \
       [--env CLAVE=VALOR]... [--copy ORIGEN:DESTINO]... -- COMANDO...

  --name     Nombre del contenedor temporal (se elimina al terminar)
  --service  Servicio de docker compose que ejecuta el comando
  --env      Variable de entorno para el contenedor (repetible)
  --copy     Directorio a extraer, en formato ORIGEN:DESTINO (repetible).
             ORIGEN es una ruta dentro del contenedor; DESTINO, una ruta
             relativa al directorio actual.
  -h, --help Muestra esta ayuda

Variable de entorno:
  COMPOSE_CMD  Prefijo de docker compose con proyecto y archivos
EOF
}

COMPOSE_CMD="${COMPOSE_CMD:-docker compose}"
name=""
service=""
envs=()
copies=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      name="${2:-}"
      shift 2
      ;;
    --service)
      service="${2:-}"
      shift 2
      ;;
    --env)
      envs+=("${2:-}")
      shift 2
      ;;
    --copy)
      copies+=("${2:-}")
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Argumento desconocido: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$name" || -z "$service" || $# -eq 0 ]]; then
  echo "Faltan argumentos obligatorios." >&2
  usage >&2
  exit 2
fi

cleanup() {
  docker rm --force "$name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Un contenedor con el mismo nombre de una ejecución anterior impediría el run.
cleanup

run_args=(run --name "$name" --no-deps)
for env_pair in "${envs[@]:-}"; do
  [[ -n "$env_pair" ]] && run_args+=(--env "$env_pair")
done

# shellcheck disable=SC2086  # COMPOSE_CMD se expande en palabras a propósito
$COMPOSE_CMD "${run_args[@]}" "$service" "$@"
status=$?

for entry in "${copies[@]:-}"; do
  [[ -z "$entry" ]] && continue
  src="${entry%%:*}"
  dest="${entry#*:}"

  if [[ "$src" == "$entry" || -z "$dest" ]]; then
    echo "==> Aviso: --copy requiere el formato ORIGEN:DESTINO ($entry)" >&2
    continue
  fi

  mkdir -p "$dest"
  if docker cp "${name}:${src}/." "${dest}/" 2>/dev/null; then
    echo "==> Copiado ${src} → ${dest}"
  else
    echo "==> Aviso: el contenedor no generó ${src}" >&2
  fi
done

exit "$status"
