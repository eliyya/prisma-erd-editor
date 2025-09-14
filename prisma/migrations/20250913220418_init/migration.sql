-- CreateEnum
CREATE TYPE "public"."LABORATORY_TYPE" AS ENUM ('COMPUTER_CENTER', 'LABORATORY');

-- CreateEnum
CREATE TYPE "public"."MACHINE_STATUS" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'IN_USE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "public"."STATUS" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "name" TEXT NOT NULL,
    "permissions" BIGINT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "status" "public"."STATUS" NOT NULL DEFAULT 'ACTIVE',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "display_username" TEXT,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subjects" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "practice_hours" INTEGER NOT NULL,
    "theory_hours" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "public"."STATUS" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."classes" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "career_id" TEXT NOT NULL,
    "group" INTEGER NOT NULL DEFAULT 0,
    "semester" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."STATUS" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."laboratories" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "open_hour" INTEGER NOT NULL,
    "close_hour" INTEGER NOT NULL,
    "type" "public"."LABORATORY_TYPE" NOT NULL DEFAULT 'LABORATORY',
    "status" "public"."STATUS" NOT NULL DEFAULT 'ACTIVE',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."practices" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "teacher_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "students" INTEGER,
    "registered_by" TEXT NOT NULL,
    "laboratory_id" TEXT NOT NULL,
    "observations" TEXT,
    "class_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."software" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "name" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "software_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."software_practices" (
    "software_id" TEXT NOT NULL,
    "practice_id" TEXT NOT NULL,

    CONSTRAINT "software_practices_pkey" PRIMARY KEY ("software_id","practice_id")
);

-- CreateTable
CREATE TABLE "public"."careers" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "public"."STATUS" NOT NULL DEFAULT 'ACTIVE',
    "alias" TEXT,

    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "nc" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "group" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "career_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "public"."STATUS" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "students_pkey" PRIMARY KEY ("nc")
);

-- CreateTable
CREATE TABLE "public"."visits" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_at" TIMESTAMP(3),
    "student_nc" TEXT NOT NULL,
    "laboratory_id" TEXT NOT NULL,
    "machine_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."machines" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "number" INTEGER NOT NULL,
    "status" "public"."MACHINE_STATUS" NOT NULL DEFAULT 'AVAILABLE',
    "processor" TEXT NOT NULL,
    "ram" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "laboratory_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serie" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."software_machines" (
    "software_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,

    CONSTRAINT "software_machines_pkey" PRIMARY KEY ("software_id","machine_id")
);

-- CreateTable
CREATE TABLE "public"."issue" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "closed_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comment" (
    "id" TEXT NOT NULL DEFAULT snowflake(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_classes" (
    "student_nc" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,

    CONSTRAINT "student_classes_pkey" PRIMARY KEY ("student_nc","class_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "public"."subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "classes_subject_id_teacher_id_group_semester_career_id_key" ON "public"."classes"("subject_id", "teacher_id", "group", "semester", "career_id");

-- CreateIndex
CREATE UNIQUE INDEX "laboratories_name_key" ON "public"."laboratories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "careers_name_key" ON "public"."careers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "machines_serie_key" ON "public"."machines"("serie");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."practices" ADD CONSTRAINT "practices_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."practices" ADD CONSTRAINT "practices_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."practices" ADD CONSTRAINT "practices_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."practices" ADD CONSTRAINT "practices_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."software_practices" ADD CONSTRAINT "software_practices_software_id_fkey" FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."software_practices" ADD CONSTRAINT "software_practices_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_student_nc_fkey" FOREIGN KEY ("student_nc") REFERENCES "public"."students"("nc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."machines" ADD CONSTRAINT "machines_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."software_machines" ADD CONSTRAINT "software_machines_software_id_fkey" FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."software_machines" ADD CONSTRAINT "software_machines_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue" ADD CONSTRAINT "issue_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue" ADD CONSTRAINT "issue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_classes" ADD CONSTRAINT "student_classes_student_nc_fkey" FOREIGN KEY ("student_nc") REFERENCES "public"."students"("nc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_classes" ADD CONSTRAINT "student_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
