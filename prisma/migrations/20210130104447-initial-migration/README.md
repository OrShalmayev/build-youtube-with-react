# Migration `20210130104447-initial-migration`

This migration has been generated by Or Shalmayev at 1/30/2021, 12:44:48 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT E'https://reedbarger.nyc3.digitaloceanspaces.com/default-avatar.png',
    "cover" TEXT NOT NULL DEFAULT E'https://reedbarger.nyc3.digitaloceanspaces.com/default-cover-banner.png',
    "about" TEXT NOT NULL DEFAULT E'',

    PRIMARY KEY ("id")
)

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,

    PRIMARY KEY ("id")
)

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriberId" TEXT NOT NULL,
    "subscribedToId" TEXT NOT NULL,

    PRIMARY KEY ("id")
)

CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("id")
)

CREATE TABLE "VideoLike" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "like" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,

    PRIMARY KEY ("id")
)

CREATE TABLE "View" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "videoId" TEXT NOT NULL,

    PRIMARY KEY ("id")
)

CREATE UNIQUE INDEX "User.email_unique" ON "User"("email")

ALTER TABLE "Comment" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "Comment" ADD FOREIGN KEY("videoId")REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "Subscription" ADD FOREIGN KEY("subscriberId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "Subscription" ADD FOREIGN KEY("subscribedToId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "Video" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "VideoLike" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "VideoLike" ADD FOREIGN KEY("videoId")REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "View" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE

ALTER TABLE "View" ADD FOREIGN KEY("videoId")REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration ..20210130104447-initial-migration
--- datamodel.dml
+++ datamodel.dml
@@ -1,0 +1,76 @@
+datasource db {
+  provider = "postgresql"
+  url = "***"
+}
+
+generator client {
+  provider = "prisma-client-js"
+}
+
+model User {
+  id           String         @id @default(uuid())
+  createdAt    DateTime       @default(now())
+  username     String
+  email        String         @unique
+  avatar       String         @default("https://reedbarger.nyc3.digitaloceanspaces.com/default-avatar.png")
+  cover        String         @default("https://reedbarger.nyc3.digitaloceanspaces.com/default-cover-banner.png")
+  about        String         @default("")
+  videos       Video[]
+  videoLikes   VideoLike[]
+  comments     Comment[]
+  subscribers  Subscription[] @relation("subscriber")
+  subscribedTo Subscription[] @relation("subscribedTo")
+  views        View[]
+}
+
+model Comment {
+  id        String   @id @default(uuid())
+  createdAt DateTime @default(now())
+  text      String
+  userId    String
+  videoId   String
+  user      User     @relation(fields: [userId], references: [id])
+  video     Video    @relation(fields: [videoId], references: [id])
+}
+
+model Subscription {
+  id             String   @id @default(uuid())
+  createdAt      DateTime @default(now())
+  subscriberId   String
+  subscribedToId String
+  subscriber     User     @relation("subscriber", fields: [subscriberId], references: [id])
+  subscribedTo   User     @relation("subscribedTo", fields: [subscribedToId], references: [id])
+}
+
+model Video {
+  id          String      @id @default(uuid())
+  createdAt   DateTime    @default(now())
+  title       String
+  description String?
+  url         String
+  thumbnail   String
+  userId      String
+  user        User        @relation(fields: [userId], references: [id])
+  videoLikes  VideoLike[]
+  comments    Comment[]
+  views       View[]
+}
+
+model VideoLike {
+  id        String   @id @default(uuid())
+  createdAt DateTime @default(now())
+  like      Int      @default(0)
+  userId    String
+  videoId   String
+  user      User     @relation(fields: [userId], references: [id])
+  video     Video    @relation(fields: [videoId], references: [id])
+}
+
+model View {
+  id        String   @id @default(uuid())
+  createdAt DateTime @default(now())
+  userId    String?
+  videoId   String
+  user      User?    @relation(fields: [userId], references: [id])
+  video     Video    @relation(fields: [videoId], references: [id])
+}
```

