-- 移除DownloadHistory表的唯一约束
DROP INDEX IF EXISTS "DownloadHistory_userId_fileId_key"; 