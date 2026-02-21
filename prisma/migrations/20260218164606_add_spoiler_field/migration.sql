-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "isSpoiler" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isSpoiler" BOOLEAN NOT NULL DEFAULT false;
