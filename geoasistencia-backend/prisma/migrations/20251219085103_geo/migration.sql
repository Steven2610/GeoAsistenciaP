-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'empleado');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "FuenteRegistro" AS ENUM ('ONLINE', 'OFFLINE_SYNC');

-- CreateEnum
CREATE TYPE "TipoConsent" AS ENUM ('LOCATION');

-- CreateTable
CREATE TABLE "sede" (
    "id_sede" TEXT NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "latitud" DECIMAL(10,7) NOT NULL,
    "longitud" DECIMAL(10,7) NOT NULL,
    "radio_metros" INTEGER NOT NULL,
    "direccion" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sede_pkey" PRIMARY KEY ("id_sede")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" TEXT NOT NULL,
    "public_id" VARCHAR(30) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'empleado',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'activo',
    "id_sede_asignada" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "usuario_identidad" (
    "id_usuario" TEXT NOT NULL,
    "nombres" VARCHAR(120),
    "apellidos" VARCHAR(120),
    "cedula" VARCHAR(30),
    "telefono" VARCHAR(30),
    "fecha_nacimiento" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_identidad_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "registro_asistencia" (
    "id_registro" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "id_sede" TEXT NOT NULL,
    "tipo" "TipoRegistro" NOT NULL,
    "ts_servidor" TIMESTAMP(3) NOT NULL,
    "latitud" DECIMAL(10,7) NOT NULL,
    "longitud" DECIMAL(10,7) NOT NULL,
    "dentro_geocerca" BOOLEAN NOT NULL,
    "fuente" "FuenteRegistro" NOT NULL DEFAULT 'ONLINE',
    "device_id" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_asistencia_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id_audit" TEXT NOT NULL,
    "actor_id_usuario" TEXT NOT NULL,
    "accion" VARCHAR(60) NOT NULL,
    "target_tipo" VARCHAR(30) NOT NULL,
    "target_id" VARCHAR(60) NOT NULL,
    "motivo" VARCHAR(255),
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id_audit")
);

-- CreateTable
CREATE TABLE "consentimiento" (
    "id_consent" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "tipo" "TipoConsent" NOT NULL DEFAULT 'LOCATION',
    "otorgado" BOOLEAN NOT NULL DEFAULT false,
    "otorgado_en" TIMESTAMP(3),
    "revocado_en" TIMESTAMP(3),

    CONSTRAINT "consentimiento_pkey" PRIMARY KEY ("id_consent")
);

-- CreateIndex
CREATE INDEX "sede_nombre_idx" ON "sede"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_public_id_key" ON "usuario"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_id_sede_asignada_idx" ON "usuario"("id_sede_asignada");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_identidad_cedula_key" ON "usuario_identidad"("cedula");

-- CreateIndex
CREATE INDEX "registro_asistencia_id_usuario_ts_servidor_idx" ON "registro_asistencia"("id_usuario", "ts_servidor");

-- CreateIndex
CREATE INDEX "registro_asistencia_id_sede_ts_servidor_idx" ON "registro_asistencia"("id_sede", "ts_servidor");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_usuario_created_at_idx" ON "audit_log"("actor_id_usuario", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_accion_created_at_idx" ON "audit_log"("accion", "created_at");

-- CreateIndex
CREATE INDEX "consentimiento_id_usuario_idx" ON "consentimiento"("id_usuario");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_sede_asignada_fkey" FOREIGN KEY ("id_sede_asignada") REFERENCES "sede"("id_sede") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_identidad" ADD CONSTRAINT "usuario_identidad_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_asistencia" ADD CONSTRAINT "registro_asistencia_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_asistencia" ADD CONSTRAINT "registro_asistencia_id_sede_fkey" FOREIGN KEY ("id_sede") REFERENCES "sede"("id_sede") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_usuario_fkey" FOREIGN KEY ("actor_id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimiento" ADD CONSTRAINT "consentimiento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
