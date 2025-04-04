import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserModel() {
  try {
    // 查找一个用户作为示例，并输出可用字段
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        storageUsed: true,
        storageLimit: true
        // 尝试打印所有关系字段
        // files: true,
        // sharedFiles: true,
        // receivedFiles: true,
        // folders: true,
        // accounts: true,
        // sessions: true,
        // profile: true
      }
    })

    console.log('用户字段:')
    console.log(JSON.stringify(user, null, 2))

    // 检查模型定义
    const { dmmf } = prisma._baseDmmf
    if (dmmf && dmmf.datamodel) {
      const userModel = dmmf.datamodel.models.find(m => m.name === 'User')
      if (userModel) {
        console.log('User 模型定义:')
        console.log(JSON.stringify({
          name: userModel.name,
          fields: userModel.fields.map(f => ({
            name: f.name,
            type: f.type,
            kind: f.kind,
            relationName: f.relationName
          }))
        }, null, 2))
      }
    }
  } catch (error) {
    console.error('查询用户时出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserModel() 