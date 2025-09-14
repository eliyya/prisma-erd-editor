-- CreateTable
CREATE TABLE "public"."Example" (
    "id" TEXT NOT NULL,
    "stringField" TEXT NOT NULL,
    "intField" INTEGER NOT NULL,
    "bigIntField" BIGINT NOT NULL,
    "floatField" DOUBLE PRECISION NOT NULL,
    "decimalField" DECIMAL(65,30) NOT NULL,
    "booleanField" BOOLEAN NOT NULL,
    "bytesField" BYTEA NOT NULL,
    "dateTimeField" TIMESTAMP(3) NOT NULL,
    "jsonField" JSONB NOT NULL,

    CONSTRAINT "Example_pkey" PRIMARY KEY ("id")
);
