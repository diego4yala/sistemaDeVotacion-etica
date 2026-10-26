-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ALUMNO', 'COORDINADOR');

-- CreateEnum
CREATE TYPE "TipoCurso" AS ENUM ('OBLIGATORIO', 'ELECTIVO', 'ELECTIVO_GENERALES', 'ELECTIVO_LIBRE');

-- CreateEnum
CREATE TYPE "TipoRequisito" AS ENUM ('APROBADO', 'CURSADO_NOTA_MIN_8', 'APROBADO_O_SIMULTANEO', 'CURSADO_O_SIMULTANEO', 'CREDITOS_MIN');

-- CreateEnum
CREATE TYPE "EstadoProceso" AS ENUM ('BORRADOR', 'ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "Aptitud" AS ENUM ('CONFIRMADO', 'CONDICIONAL', 'NO_APTO');

-- CreateEnum
CREATE TYPE "Franja" AS ENUM ('MANANA', 'MEDIA_MANANA', 'MEDIODIA', 'TARDE', 'NOCHE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "creditos" DECIMAL(4,2) NOT NULL,
    "tipo" "TipoCurso" NOT NULL,
    "ciclo" INTEGER,
    "grupo" TEXT,
    "requisitosTexto" TEXT,
    "descripcion" TEXT,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "Requisito" (
    "id" TEXT NOT NULL,
    "cursoCodigo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "texto" TEXT NOT NULL,
    "tipo" "TipoRequisito" NOT NULL,
    "cursoRequerido" TEXT,
    "creditosMinimos" INTEGER,

    CONSTRAINT "Requisito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcesoVotacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cicloObjetivo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "maxCursos" INTEGER NOT NULL DEFAULT 5,
    "maxFranjas" INTEGER NOT NULL DEFAULT 2,
    "estado" "EstadoProceso" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcesoVotacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PadronAlumno" (
    "procesoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "PadronAlumno_pkey" PRIMARY KEY ("procesoId","usuarioId")
);

-- CreateTable
CREATE TABLE "HistorialItem" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cursoCodigo" TEXT NOT NULL,
    "nota" INTEGER,

    CONSTRAINT "HistorialItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AceptacionTerminos" (
    "procesoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "aceptadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AceptacionTerminos_pkey" PRIMARY KEY ("procesoId","usuarioId")
);

-- CreateTable
CREATE TABLE "Voto" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cursoCodigo" TEXT NOT NULL,
    "aptitud" "Aptitud" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotoFranja" (
    "votoId" TEXT NOT NULL,
    "franja" "Franja" NOT NULL,

    CONSTRAINT "VotoFranja_pkey" PRIMARY KEY ("votoId","franja")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "detalle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_codigo_key" ON "Usuario"("codigo");

-- CreateIndex
CREATE INDEX "Requisito_cursoCodigo_idx" ON "Requisito"("cursoCodigo");

-- CreateIndex
CREATE INDEX "HistorialItem_procesoId_usuarioId_idx" ON "HistorialItem"("procesoId", "usuarioId");

-- CreateIndex
CREATE INDEX "Voto_procesoId_cursoCodigo_idx" ON "Voto"("procesoId", "cursoCodigo");

-- CreateIndex
CREATE UNIQUE INDEX "Voto_procesoId_usuarioId_cursoCodigo_key" ON "Voto"("procesoId", "usuarioId", "cursoCodigo");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Requisito" ADD CONSTRAINT "Requisito_cursoCodigo_fkey" FOREIGN KEY ("cursoCodigo") REFERENCES "Curso"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PadronAlumno" ADD CONSTRAINT "PadronAlumno_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "ProcesoVotacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PadronAlumno" ADD CONSTRAINT "PadronAlumno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialItem" ADD CONSTRAINT "HistorialItem_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "ProcesoVotacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialItem" ADD CONSTRAINT "HistorialItem_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AceptacionTerminos" ADD CONSTRAINT "AceptacionTerminos_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "ProcesoVotacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AceptacionTerminos" ADD CONSTRAINT "AceptacionTerminos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "ProcesoVotacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_cursoCodigo_fkey" FOREIGN KEY ("cursoCodigo") REFERENCES "Curso"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotoFranja" ADD CONSTRAINT "VotoFranja_votoId_fkey" FOREIGN KEY ("votoId") REFERENCES "Voto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
