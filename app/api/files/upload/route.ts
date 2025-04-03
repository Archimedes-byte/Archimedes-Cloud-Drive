import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { join, basename, dirname } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// 定义上传文件结果类型，包括成功和错误情况
interface UploadedFileResult {
  // 成功时包含的标准File字段
  id?: string;
  name: string;
  filename?: string;
  path?: string;
  type?: string;
  size?: number;
  url?: string;
  
  // 错误相关字段
  error?: boolean; 
  errorMessage?: string;
}

// 添加创建文件夹的辅助函数
async function createOrGetFolder(
  name: string, 
  parentId: string | null, 
  uploaderId: string, 
  path: string
): Promise<string> {
  try {
    console.log(`尝试创建或获取文件夹: 名称=${name}, 父ID=${parentId || 'root'}`);
    
    // 检查文件夹是否已存在
    const existingFolder = await prisma.file.findFirst({
      where: {
        name,
        parentId,
        uploaderId,
        isFolder: true,
        isDeleted: false,
      },
    });

    if (existingFolder) {
      console.log(`文件夹已存在: ${name}, ID: ${existingFolder.id}`);
      return existingFolder.id;
    }

    // 创建新文件夹
    const folderId = uuidv4();
    
    // 确保物理路径存在
    await mkdir(path, { recursive: true });
    
    const folder = await prisma.file.create({
      data: {
        id: folderId,
        name,
        filename: name,
        path,
        type: 'folder',
        size: 0,
        isFolder: true,
        uploaderId,
        parentId,
        tags: [],
        url: `/api/folders/${folderId}/content`,
      },
    });

    console.log(`创建文件夹成功: ${name}, ID: ${folder.id}, 父ID: ${parentId || 'root'}`);
    return folder.id;
  } catch (error) {
    console.error(`创建文件夹失败: ${name}`, error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('开始处理文件上传请求');
    
    // 验证用户会话
    const session = await getServerSession(authOptions);
    console.log('会话信息:', JSON.stringify({
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null
    }));
    
    if (!session?.user) {
      console.log('未授权访问: 没有用户会话');
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 获取用户ID - 优先使用session.user.id，如果不存在则通过email查询
    let userId = session.user.id;
    if (!userId && session.user.email) {
      console.log('通过Email查询用户:', session.user.email);
      const userByEmail = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (!userByEmail) {
        console.log('未找到用户:', session.user.email);
        return NextResponse.json({ error: '用户不存在' }, { status: 401 });
      }
      
      userId = userByEmail.id;
    }
    
    if (!userId) {
      console.log('无法获取用户ID');
      return NextResponse.json({ error: '用户ID不存在' }, { status: 401 });
    }
    
    console.log('用户ID:', userId);

    // 获取表单数据
    const formData = await req.formData();
    console.log('表单字段:', Array.from(formData.keys()));
    
    const folderId = formData.get('folderId') as string | null;
    const withTags = formData.get('withTags') === 'true';
    const tagsString = formData.get('tags') as string | null;
    const isFolderUpload = formData.get('isFolderUpload') === 'true';
    
    console.log('文件夹ID:', folderId);
    console.log('包含标签:', withTags);
    console.log('标签字符串:', tagsString);
    console.log('文件夹上传:', isFolderUpload);
    
    // 处理标签
    let tags: string[] = [];
    if (withTags && tagsString) {
      tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
      console.log('处理后的标签:', tags);
    }

    // 处理上传的文件
    const files = formData.getAll('file').filter(item => item instanceof File) as File[];
    console.log('上传的文件数量:', files.length);

    if (files.length === 0) {
      console.log('没有找到文件，检查表单数据是否包含file字段');
      return NextResponse.json({ 
        error: '未找到文件', 
        details: '服务器未收到任何文件数据，请检查文件上传控件' 
      }, { status: 400 });
    }

    // 确保上传根目录存在
    const baseUploadDir = join(process.cwd(), 'uploads');
    console.log('基础上传目录:', baseUploadDir);
    await mkdir(baseUploadDir, { recursive: true });

    // 为此次上传创建一个唯一的子目录，避免文件名冲突
    const sessionUploadId = `upload_${Date.now()}`;
    const sessionUploadDir = join(baseUploadDir, sessionUploadId);
    await mkdir(sessionUploadDir, { recursive: true });
    console.log('会话上传目录:', sessionUploadDir);

    // 收集文件路径映射
    const pathMap = new Map<number, string>();
    if (isFolderUpload) {
      // 收集所有路径信息
      console.log('收集文件路径信息');
      const pathKeys = Array.from(formData.keys()).filter(key => key.startsWith('path_'));
      for (const key of pathKeys) {
        const indexStr = key.split('_')[1];
        const index = parseInt(indexStr, 10);
        const path = formData.get(key) as string;
        pathMap.set(index, path);
        console.log(`文件 ${index} 路径: ${path}`);
      }
    }

    // 处理所有上传的文件
    const uploadedFiles = [];
    
    // 如果是文件夹上传，先创建文件夹结构
    const folderPathMap = new Map<string, string>(); // 路径 -> 文件夹ID 映射
    
    if (isFolderUpload) {
      console.log('开始创建文件夹结构');
      
      // 收集所有需要创建的文件夹路径
      const allFolderPaths = new Set<string>();
      
      // 从每个文件的webkitRelativePath中提取文件夹路径
      for (const [_, webkitPath] of Array.from(pathMap.entries())) {
        const pathParts = webkitPath.split('/');
        
        // 如果有嵌套文件夹，则创建所有层级的文件夹
        if (pathParts.length > 1) {
          // 构建每一级文件夹路径，从顶级到底级
          let currentPath = '';
          for (let i = 0; i < pathParts.length - 1; i++) {
            currentPath = currentPath 
              ? `${currentPath}/${pathParts[i]}`
              : pathParts[i];
            
            allFolderPaths.add(currentPath);
          }
        }
      }
      
      // 按照路径长度排序，确保父文件夹先创建
      const sortedFolderPaths = Array.from(allFolderPaths)
        .sort((a, b) => a.split('/').length - b.split('/').length);
      
      console.log('需要创建的文件夹结构:', sortedFolderPaths);
      
      // 依次创建文件夹，保持层级结构
      for (const folderPath of sortedFolderPaths) {
        try {
          const pathParts = folderPath.split('/');
          const folderName = pathParts[pathParts.length - 1];
          
          // 获取父文件夹ID（如果有）
          let parentFolderId = folderId; // 默认使用传入的顶级文件夹ID
          if (pathParts.length > 1) {
            const parentPath = pathParts.slice(0, -1).join('/');
            parentFolderId = folderPathMap.get(parentPath) || folderId;
            console.log(`文件夹 "${folderName}" 的父路径: "${parentPath}", 父ID: ${parentFolderId || 'root'}`);
          }
          
          // 创建完整的物理路径
          const physicalPath = join(sessionUploadDir, folderPath);
          
          // 创建文件夹记录
          const createdFolderId = await createOrGetFolder(
            folderName, 
            parentFolderId, 
            userId, 
            physicalPath
          );
          
          // 保存到映射中
          folderPathMap.set(folderPath, createdFolderId);
          
          console.log(`文件夹 "${folderPath}" 映射到 ID: ${createdFolderId}`);
        } catch (error) {
          console.error(`创建文件夹 "${folderPath}" 失败:`, error);
          // 继续创建其他文件夹
        }
      }
      
      console.log('文件夹结构创建完成，文件夹映射:', Object.fromEntries(folderPathMap));
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 生成唯一文件名，但保留原始扩展名
        const fileExt = file.name.includes('.') ? file.name.split('.').pop() : '';
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const uniqueFileName = fileExt ? `${uniqueId}.${fileExt}` : uniqueId;
        
        let filePath: string;
        let relativeDirPath: string = '';
        let fileUrl: string;
        let parentFolderId: string | null = folderId; // 默认使用传入的folderId
        
        // 处理文件夹上传
        if (isFolderUpload && pathMap.has(i)) {
          // 获取相对路径
          const webkitPath = pathMap.get(i) || '';
          console.log(`处理文件夹文件 [${i}]: ${file.name}, webkitPath: ${webkitPath}`);
          
          // 提取目录部分和文件名
          const pathParts = webkitPath.split('/');
          const fileName = pathParts[pathParts.length - 1]; // 实际文件名
          
          // 如果路径有多个部分(至少有文件夹和文件名)
          if (pathParts.length > 1) {
            // 提取目录部分 (去掉最后的文件名)
            relativeDirPath = pathParts.slice(0, -1).join('/');
            console.log(`提取的相对目录路径: ${relativeDirPath}`);
            
            // 创建目标目录路径 (使用会话上传目录)
            const targetDirPath = join(sessionUploadDir, relativeDirPath);
            console.log(`完整目标目录路径: ${targetDirPath}`);
            
            // 确保目标目录存在
            await mkdir(targetDirPath, { recursive: true });
            console.log(`确保目录已创建: ${targetDirPath}`);
            
            // 设置完整文件路径
            filePath = join(targetDirPath, uniqueFileName);
            
            // 从映射中获取父文件夹ID - 这是关键步骤
            if (folderPathMap.has(relativeDirPath)) {
              parentFolderId = folderPathMap.get(relativeDirPath) || folderId;
              console.log(`文件 "${fileName}" 将关联到文件夹 "${relativeDirPath}" (ID: ${parentFolderId})`);
            } else {
              console.warn(`警告: 找不到文件 "${fileName}" 的父文件夹 "${relativeDirPath}"，将使用默认文件夹 ${folderId || 'root'}`);
            }
          } else {
            // 单个文件情况，没有目录结构
            filePath = join(sessionUploadDir, uniqueFileName);
          }
          
          // URL 包含路径信息，以便后续访问
          fileUrl = `/api/files/${uniqueFileName}/content?path=${encodeURIComponent(relativeDirPath)}`;
          console.log(`文件URL: ${fileUrl}`);
        } else {
          // 普通文件上传
          filePath = join(sessionUploadDir, uniqueFileName);
          fileUrl = `/api/files/${uniqueFileName}/content`;
        }
        
        console.log(`准备保存文件到: ${filePath}`);
        
        // 读取文件内容并保存
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 确保目标目录存在，即使在前面已经创建过
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, buffer);
        
        console.log(`文件 ${i+1}/${files.length} 已成功保存: ${filePath}`);
        
        // 创建数据库记录
        const dbData = {
          name: isFolderUpload ? basename(file.name) : file.name, // 只使用文件名，不包含路径
          filename: basename(filePath),
          path: filePath,
          type: file.type,
          size: file.size,
          url: fileUrl,
          uploaderId: userId,
          parentId: parentFolderId, // 使用上面设置的父文件夹ID
          isFolder: false, // 明确标记为文件而非文件夹
          // 确保tags是一个字符串数组
          tags: withTags && tags.length > 0 ? tags : [],
        };
        
        if (isFolderUpload && relativeDirPath) {
          // 对于文件夹上传，添加额外的路径信息到tags中
          // 但现在不再需要特殊的"__folder"标签，因为我们已经创建了正确的文件夹结构
          console.log(`文件 "${basename(file.name)}" 属于文件夹路径: ${relativeDirPath}`);
        }
        
        console.log(`准备创建数据库记录:`, dbData);
        const fileRecord = await prisma.file.create({ data: dbData });
        
        console.log(`文件记录已创建: ${fileRecord.id}`);
        uploadedFiles.push(fileRecord);
      } catch (error) {
        // 打印更详细的错误信息，以便调试
        console.error(`处理文件 [${i}/${files.length}] "${file.name}" 时出错:`, error);
        
        // 记录错误详情，文件路径和大小等关键信息
        if (error instanceof Error) {
          console.error(`错误类型: ${error.name}, 信息: ${error.message}, 堆栈: ${error.stack}`);
        }
        
        // 继续处理其他文件，而不是立即失败整个上传过程
        console.error(`文件 "${file.name}" 处理失败，但其他文件将继续处理`);
        
        // 创建错误记录
        uploadedFiles.push({
          error: true,
          name: file.name,
          errorMessage: error instanceof Error ? error.message : String(error)
        } as UploadedFileResult);
        
        // 不抛出异常，继续处理下一个文件
        continue;
      }
    }

    // 检查是否有成功上传的文件
    const successFiles = uploadedFiles.filter(file => !('error' in file && file.error === true)) as UploadedFileResult[];
    console.log(`上传完成，成功处理 ${successFiles.length}/${files.length} 个文件`);
    
    if (successFiles.length === 0 && files.length > 0) {
      // 如果所有文件都失败了，返回错误
      return NextResponse.json({
        success: false,
        error: '所有文件上传失败',
        files: uploadedFiles
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      filesProcessed: files.length,
      filesSuccessful: successFiles.length,
      files: uploadedFiles,
      file: successFiles[0] // 为了兼容旧版接口
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json(
      { error: '文件上传失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 配置API路由以支持大文件上传
export const config = {
  api: {
    bodyParser: false, // 禁用默认的bodyParser以处理文件上传
    responseLimit: '8mb',
  },
}; 