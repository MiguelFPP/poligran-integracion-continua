#!/usr/bin/env groovy

/*
 * Pipeline de integración continua del POS — Entregable 2 (Escenario 5).
 *
 * Integra los tres componentes del entregable:
 *   GitHub  → `checkout scm` sobre el repositorio + polling `H/5 * * * *`
 *             y webhook `/github-webhook/`.
 *   Docker  → compila y ejecuta las MISMAS imágenes de la Entrega 1
 *             (`apps/api/Dockerfile`, `apps/web/Dockerfile`).
 *   Jenkins → orquesta las etapas y publica reportes JUnit y de cobertura.
 *
 * El controlador no compila: cada etapa corre dentro de un contenedor del
 * proyecto con `docker compose run`, así el entorno de CI es idéntico al de
 * desarrollo. Los reportes se extraen con `docker cp` porque el daemon corre
 * en el host y no ve el bind mount de `$WORKSPACE` (Docker-outside-of-Docker).
 */

// Proyecto Compose propio del stack de la aplicación dentro del pipeline.
// Es distinto de `pos-ci-server` (el servidor Jenkins) a propósito: el `down`
// del post destruye este stack y no debe tocar a Jenkins.
//
// Nota sobre Groovy CPS: las variables `def` de nivel superior NO son visibles
// dentro de los métodos del Jenkinsfile. Por eso la configuración compartida
// vive en un mapa `@Field`.
import groovy.transform.Field

@Field def CFG = [
  project: 'pos-stack-ci',
  files  : '-f docker-compose.yml -f ci/docker-compose.ci.yml',
]

@Field def COMPOSE = "docker compose -p ${CFG.project} ${CFG.files}"

// Base que consumen los e2e (la crea el pipeline en cada ejecución).
@Field def TEST_DB_URL = 'postgresql://pos:pos@db:5432/pos_test'
@Field def APP_DB_URL = 'postgresql://pos:pos@db:5432/pos'

// Secretos de prueba: `validateEnv` exige 32+ caracteres en los JWT.
@Field def TEST_SECRETS = [
  'JWT_ACCESS_SECRET' : 'ci-access-secret-000000000000000000000000',
  'JWT_REFRESH_SECRET': 'ci-refresh-secret-00000000000000000000000',
  'WEB_ORIGIN'        : 'http://localhost:3000',
]

@Field def ENV_ARGS = TEST_SECRETS.collect { k, v -> "-e ${k}=${v}" }.join(' ')

/**
 * Ejecuta un comando en un servicio del stack y extrae sus artefactos.
 * `copies` es una lista de pares "origenEnContenedor:destinoEnWorkspace".
 */
def runInContainer(Map args) {
  def envOpts = (args.env ?: []).collect { "--env ${it}" }.join(' ')
  def copyOpts = (args.copies ?: []).collect { "--copy ${it}" }.join(' ')

  sh label: "Contenedor · ${args.service} (${args.label})", script: """
    COMPOSE_CMD="${COMPOSE}" \\
    ./ci/scripts/run-with-reports.sh \\
      --name "jenkins-${env.BUILD_NUMBER}-${args.service}-${args.label}" \\
      --service ${args.service} \\
      ${envOpts} \\
      ${copyOpts} \\
      -- ${args.command}
  """
}

pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
    timeout(time: 45, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '5'))
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  environment {
    DOCKER_CLI_HINTS  = 'false'
    BUILDKIT_PROGRESS = 'plain'
    CI                = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        cleanWs()
        checkout scm
        script {
          sh label: 'Commit en construcción', script: '''
            set -e
            git log -1 --pretty=format:'commit %H%nAutor:    %an <%ae>%nFecha:    %ad%nAsunto:   %s%n'
          '''
        }
      }
    }

    stage('Preparar red y stack') {
      steps {
        // Red externa compartida con Jenkins: así alcanza api y web por
        // nombre de servicio cuando el pipeline los levanta, sin publicar
        // puertos al host.
        sh label: 'Red pos-ci-net', script: '''
          docker network inspect pos-ci-net >/dev/null 2>&1 \
            || docker network create pos-ci-net
        '''
        sh label: 'Limpiar ejecuciones previas', script: """
          ${COMPOSE} down --remove-orphans --volumes || true
        """
      }
    }

    stage('Docker · Construir imágenes') {
      steps {
        sh label: 'docker compose build api web', script: """
          ${COMPOSE} build api web
        """
      }
    }

    stage('Calidad · Lint y tipos') {
      parallel {
        stage('Lint') {
          steps {
            sh label: 'ESLint (api + web)', script: """
              ${COMPOSE} run --rm --no-deps api pnpm lint
              ${COMPOSE} run --rm --no-deps web pnpm lint
            """
          }
        }
        stage('Typecheck') {
          steps {
            sh label: 'tsc --noEmit (api + web)', script: """
              ${COMPOSE} run --rm --no-deps api pnpm typecheck
              ${COMPOSE} run --rm --no-deps web pnpm typecheck
            """
          }
        }
      }
    }

    stage('Pruebas unitarias · API') {
      steps {
        script {
          runInContainer(
            label   : 'unit',
            service : 'api',
            copies  : [
              '/app/apps/api/reports:reports/api-unit',
              '/app/apps/api/coverage/unit:coverage/api-unit',
            ],
            command : 'pnpm test:cov',
          )
        }
      }
      post {
        always {
          junit testResults: 'reports/api-unit/junit.xml',
                allowEmptyResults: true,
                skipPublishingChecks: true
        }
      }
    }

    stage('Pruebas unitarias · Web') {
      steps {
        script {
          runInContainer(
            label   : 'unit',
            service : 'web',
            copies  : [
              '/app/apps/web/reports:reports/web',
              '/app/apps/web/coverage:coverage/web',
            ],
            command : 'pnpm test:cov',
          )
        }
      }
      post {
        always {
          junit testResults: 'reports/web/junit.xml',
                allowEmptyResults: true,
                skipPublishingChecks: true
        }
      }
    }

    stage('Pruebas e2e · API + PostgreSQL') {
      steps {
        sh label: 'Base de datos efímera', script: """
          ${COMPOSE} up -d db
          for i in \$(seq 1 60); do
            health=\$(${COMPOSE} ps --format json db | sed -n 's/.*"Health":"\\([a-z]*\\)".*/\\1/p')
            [ "\$health" = "healthy" ] && break
            sleep 2
          done
          # Base limpia en cada ejecución: los e2e no arrastran estado.
          ${COMPOSE} exec -T db psql -U pos -d postgres \\
            -c 'DROP DATABASE IF EXISTS pos_test;' \\
            -c 'CREATE DATABASE pos_test OWNER pos;'
        """
        script {
          runInContainer(
            label   : 'migrate',
            service : 'api',
            env     : ["DATABASE_URL=${TEST_DB_URL}"],
            command : 'pnpm migrate:test',
          )
          runInContainer(
            label   : 'e2e',
            service : 'api',
            env     : ["DATABASE_URL=${TEST_DB_URL}"],
            copies  : ['/app/apps/api/reports:reports/api-e2e'],
            command : 'pnpm test:e2e',
          )
        }
      }
      post {
        always {
          junit testResults: 'reports/api-e2e/junit-e2e.xml',
                allowEmptyResults: true,
                skipPublishingChecks: true
        }
      }
    }

    stage('Docker · Imágenes de producción') {
      steps {
        sh label: 'build de los stages prod', script: """
          ${COMPOSE} build api web
        """
      }
    }

    stage('Despliegue y humo') {
      steps {
        sh label: 'Levantar stack y esperar salud', script: """
          ${COMPOSE} up -d --wait db api web
        """
        sh label: 'Migrar y sembrar pos', script: """
          ${COMPOSE} run --rm --no-deps \\
            -e DATABASE_URL=${APP_DB_URL} \\
            ${ENV_ARGS} \\
            api pnpm migrate:deploy
          ${COMPOSE} run --rm --no-deps \\
            -e DATABASE_URL=${APP_DB_URL} \\
            ${ENV_ARGS} \\
            api pnpm seed
        """
        sh label: 'Comunicación entre contenedores', script: """
          ${COMPOSE} ps --format 'table {{.Name}}\\t{{.Service}}\\t{{.Status}}'
          # La web resuelve `api` por DNS de la red, igual que en producción.
          ${COMPOSE} exec -T web node -e "
            fetch('http://api:3001/api/v1/health')
              .then((r) => r.json())
              .then((body) => { console.log('web → api/health:', body.status); process.exit(body.status === 'ok' ? 0 : 1); })
              .catch((error) => { console.error(error.message); process.exit(1); });
          "
        """
        // Jenkins comparte `pos-ci-net`: verifica el despliegue por nombre de
        // servicio, sin depender de puertos publicados en el host.
        sh label: 'Smoke desde Jenkins', script: '''
          set -e
          curl -fsS http://api:3001/api/v1/health | grep -q '"status":"ok"'
          echo "smoke: api/health → ok"
          curl -fsS -o /dev/null -w 'smoke: web/login → %{http_code}\\n' http://web:3000/login
        '''
      }
    }
  }

  post {
    always {
      junit testResults: 'reports/**/*.xml',
            allowEmptyResults: true,
            skipPublishingChecks: true
      publishHTML(target: [
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'coverage/api-unit/lcov-report',
        reportFiles: 'index.html',
        reportName: 'Cobertura API (unitarias)',
      ])
      publishHTML(target: [
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'coverage/web/lcov-report',
        reportFiles: 'index.html',
        reportName: 'Cobertura Web',
      ])
      sh label: 'Detener el stack del pipeline', script: """
        ${COMPOSE} down --remove-orphans --volumes || true
      """
    }
    success {
      archiveArtifacts artifacts: 'reports/**/*.xml, coverage/**/lcov.info',
                       allowEmptyArchive: true,
                       fingerprint: false
    }
    failure {
      sh label: 'Diagnóstico de fallo', script: """
        ${COMPOSE} ps -a || true
        ${COMPOSE} logs --tail=80 || true
      """
    }
  }
}
