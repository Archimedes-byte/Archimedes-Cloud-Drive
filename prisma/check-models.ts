// 这是一个临时文件，用于检查生成的Prisma客户端模型
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 输出prisma对象的所有键
console.log('Prisma client models:')
console.log(Object.keys(prisma))

// 检查userProfile模型
const hasUserProfile = 'userProfile' in prisma
const hasUserProfileCap = 'UserProfile' in prisma
console.log('Has userProfile model:', hasUserProfile)
console.log('Has UserProfile model:', hasUserProfileCap)

// 直接访问所有模型
try {
  console.log('Available models:')
  // @ts-ignore
  const userModelKeys = Object.keys(prisma.$dmmf.datamodel.models).join(', ')
  console.log(userModelKeys)
} catch (error) {
  console.error('Error accessing model metadata:', error)
}

// 尝试不同的访问方式
try {
  // @ts-ignore
  const models = prisma._dmmf.modelMap
  console.log('Models from _dmmf:', Object.keys(models))
} catch (error) {
  console.error('Error accessing _dmmf:', error)
} 