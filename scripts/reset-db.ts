import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('开始清空数据库...')

    // 按照关系依赖的顺序删除数据
    await prisma.verificationToken.deleteMany()
    console.log('✓ 已清空 VerificationToken')

    await prisma.session.deleteMany()
    console.log('✓ 已清空 Session')

    await prisma.account.deleteMany()
    console.log('✓ 已清空 Account')

    await prisma.maintenanceLog.deleteMany()
    console.log('✓ 已清空 MaintenanceLog')

    await prisma.share.deleteMany()
    console.log('✓ 已清空 Share')

    await prisma.file.deleteMany()
    console.log('✓ 已清空 File')

    await prisma.folder.deleteMany()
    console.log('✓ 已清空 Folder')

    await prisma.user.deleteMany()
    console.log('✓ 已清空 User')

    console.log('数据库清空完成！')
  } catch (error) {
    console.error('清空数据库时出错:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 