-- CreateTable
CREATE TABLE "public"."NavItem" (
    "key" VARCHAR(64) NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "iconKey" TEXT,
    "group" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."UserNavItem" (
    "userId" TEXT NOT NULL,
    "navKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER,
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserNavItem_pkey" PRIMARY KEY ("userId","navKey")
);

-- CreateIndex
CREATE INDEX "NavItem_group_position_idx" ON "public"."NavItem"("group", "position");

-- CreateIndex
CREATE INDEX "NavItem_isActive_position_idx" ON "public"."NavItem"("isActive", "position");

-- CreateIndex
CREATE INDEX "UserNavItem_userId_position_idx" ON "public"."UserNavItem"("userId", "position");

-- AddForeignKey
ALTER TABLE "public"."UserNavItem" ADD CONSTRAINT "UserNavItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNavItem" ADD CONSTRAINT "UserNavItem_navKey_fkey" FOREIGN KEY ("navKey") REFERENCES "public"."NavItem"("key") ON DELETE CASCADE ON UPDATE CASCADE;
