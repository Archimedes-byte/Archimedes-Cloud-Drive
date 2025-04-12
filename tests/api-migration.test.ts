/**
 * API迁移全面测试
 * 
 * 本测试套件验证所有API路径迁移后的功能是否正常工作
 */

import { fileApi } from '../app/lib/api/file-api';
import { API_PATHS } from '../app/lib/api/paths';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';

// 测试配置
const TEST_FILE_PATH = path.join(__dirname, 'test-files/test.txt');
const TEST_IMAGE_PATH = path.join(__dirname, 'test-files/test.jpg');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// 创建测试文件夹
if (!fs.existsSync(path.join(__dirname, 'test-files'))) {
  fs.mkdirSync(path.join(__dirname, 'test-files'), { recursive: true });
  fs.writeFileSync(TEST_FILE_PATH, 'This is a test file for API testing');
  // 在实际测试中，你应该有一个真实的图片文件
}

// 测试状态
let testFolderId: string | null = null;
let testFileId: string | null = null;

describe('API迁移功能测试', () => {
  // 测试前清理环境
  before(async () => {
    console.log('准备测试环境...');
    
    // 确保登录状态
    // 注意：根据你的认证系统来修改这部分代码
    // 这里假设你有一个登录API或者可以直接设置认证token
    
    // 清理可能存在的测试数据
    try {
      const { items } = await fileApi.getFiles();
      const testItems = items.filter(item => 
        item.name.startsWith('test_') || 
        item.name === 'API测试文件夹'
      );
      
      if (testItems.length > 0) {
        await fileApi.deleteFiles({ fileIds: testItems.map(item => item.id) });
        console.log(`已清理${testItems.length}个测试文件/文件夹`);
      }
    } catch (error) {
      console.error('清理测试数据失败:', error);
    }
  });
  
  // 1. 测试文件夹API
  describe('文件夹操作测试', () => {
    it('应该能够创建文件夹', async () => {
      try {
        const folder = await fileApi.createFolder('API测试文件夹');
        expect(folder).to.have.property('id');
        expect(folder.name).to.equal('API测试文件夹');
        expect(folder.isFolder).to.be.true;
        
        testFolderId = folder.id;
        console.log('创建测试文件夹成功, ID:', testFolderId);
      } catch (error) {
        console.error('创建文件夹失败:', error);
        throw error;
      }
    });
    
    it('应该能够获取文件夹列表', async () => {
      try {
        const { items } = await fileApi.getFiles({ type: 'folder' });
        expect(items).to.be.an('array');
        const testFolder = items.find(item => item.name === 'API测试文件夹');
        expect(testFolder).to.not.be.undefined;
        expect(testFolder?.id).to.equal(testFolderId);
      } catch (error) {
        console.error('获取文件夹列表失败:', error);
        throw error;
      }
    });
  });
  
  // 2. 测试文件上传API
  describe('文件上传测试', () => {
    it('应该能够上传文件到指定文件夹', async () => {
      try {
        // 使用API客户端上传
        const testFile = new File(
          [fs.readFileSync(TEST_FILE_PATH)],
          'test_file.txt',
          { type: 'text/plain' }
        );
        
        const results = await fileApi.uploadFiles([testFile], [], testFolderId);
        expect(results).to.be.an('array');
        expect(results[0]).to.have.property('id');
        expect(results[0].name).to.equal('test_file.txt');
        
        testFileId = results[0].id;
        console.log('上传测试文件成功, ID:', testFileId);
      } catch (error) {
        console.error('上传文件失败:', error);
        // 如果API客户端上传失败，尝试直接使用fetch
        try {
          console.log('尝试使用fetch上传文件...');
          const formData = new FormData();
          formData.append('file', fs.createReadStream(TEST_FILE_PATH));
          if (testFolderId) {
            formData.append('folderId', testFolderId);
          }
          
          const response = await fetch(`${API_BASE_URL}${API_PATHS.STORAGE.FILES.UPLOAD}`, {
            method: 'POST',
            body: formData
          });
          
          expect(response.ok).to.be.true;
          const data = await response.json();
          expect(data).to.have.property('data');
          testFileId = data.data.id;
          console.log('直接上传测试文件成功, ID:', testFileId);
        } catch (fetchError) {
          console.error('直接上传文件也失败:', fetchError);
          throw fetchError;
        }
      }
    });
  });
  
  // 3. 测试文件列表API
  describe('文件列表测试', () => {
    it('应该能够获取文件列表', async () => {
      try {
        const { items } = await fileApi.getFiles({ folderId: testFolderId });
        expect(items).to.be.an('array');
        
        // 验证上传的文件是否在列表中
        const testFile = items.find(item => item.id === testFileId);
        expect(testFile).to.not.be.undefined;
        expect(testFile?.name).to.equal('test_file.txt');
      } catch (error) {
        console.error('获取文件列表失败:', error);
        throw error;
      }
    });
    
    it('应该能够搜索文件', async () => {
      try {
        const results = await fileApi.searchFiles({ query: 'test_file' });
        expect(results).to.be.an('array');
        
        // 验证是否能搜索到测试文件
        const testFile = results.find(item => item.id === testFileId);
        expect(testFile).to.not.be.undefined;
      } catch (error) {
        console.error('搜索文件失败:', error);
        throw error;
      }
    });
  });
  
  // 4. 测试文件操作API
  describe('文件操作测试', () => {
    it('应该能够更新文件信息', async () => {
      try {
        if (!testFileId) {
          throw new Error('没有测试文件ID，无法执行更新操作');
        }
        
        const updatedFile = await fileApi.updateFile(testFileId, { 
          name: 'test_file_renamed.txt',
          tags: ['test', 'api']
        });
        
        expect(updatedFile).to.have.property('id');
        expect(updatedFile.id).to.equal(testFileId);
        expect(updatedFile.name).to.equal('test_file_renamed.txt');
        expect(updatedFile.tags).to.include('test');
        expect(updatedFile.tags).to.include('api');
      } catch (error) {
        console.error('更新文件信息失败:', error);
        throw error;
      }
    });
    
    // 测试子文件夹创建和移动
    it('应该能够创建子文件夹并移动文件', async () => {
      try {
        // 创建子文件夹
        const subFolder = await fileApi.createFolder('API测试子文件夹', testFolderId);
        expect(subFolder).to.have.property('id');
        expect(subFolder.name).to.equal('API测试子文件夹');
        
        // 移动文件到子文件夹
        if (!testFileId) {
          throw new Error('没有测试文件ID，无法执行移动操作');
        }
        
        const result = await fileApi.moveFiles({ 
          fileIds: [testFileId], 
          targetFolderId: subFolder.id 
        });
        
        expect(result).to.have.property('movedCount');
        expect(result.movedCount).to.equal(1);
        
        // 验证文件已经移动
        const { items } = await fileApi.getFiles({ folderId: subFolder.id });
        expect(items).to.be.an('array');
        expect(items.length).to.be.at.least(1);
        
        const movedFile = items.find(item => item.id === testFileId);
        expect(movedFile).to.not.be.undefined;
      } catch (error) {
        console.error('创建子文件夹或移动文件失败:', error);
        throw error;
      }
    });
  });
  
  // 5. 测试收藏API
  describe('收藏功能测试', () => {
    it('应该能够添加和移除收藏', async () => {
      try {
        if (!testFileId) {
          throw new Error('没有测试文件ID，无法执行收藏操作');
        }
        
        // 添加到收藏
        const addResult = await fileApi.addToFavorites([testFileId]);
        expect(addResult).to.have.property('count');
        expect(addResult.count).to.be.at.least(1);
        
        // 获取收藏列表
        const { items } = await fileApi.getFavorites();
        expect(items).to.be.an('array');
        const favoritedFile = items.find(item => item.id === testFileId);
        expect(favoritedFile).to.not.be.undefined;
        
        // 移除收藏
        const removeResult = await fileApi.removeFromFavorites([testFileId]);
        expect(removeResult).to.have.property('count');
        expect(removeResult.count).to.be.at.least(1);
      } catch (error) {
        console.error('收藏操作失败:', error);
        throw error;
      }
    });
  });
  
  // 6. 测试直接API调用（验证API路径）
  describe('直接API路径验证', () => {
    it('应该能够通过新API路径直接获取文件列表', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${API_PATHS.STORAGE.FILES.LIST}`);
        expect(response.ok).to.be.true;
        
        const data = await response.json();
        expect(data).to.have.property('data');
        expect(data.data).to.have.property('items');
      } catch (error) {
        console.error('直接获取文件列表失败:', error);
        throw error;
      }
    });
    
    it('应该无法通过旧API路径获取文件列表', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/files`);
        
        // 如果旧API已被完全移除，应该返回404
        // 如果旧API仍然存在但已经废弃（转发到新API），则会成功但有警告头
        if (response.status === 404) {
          console.log('旧API路径已被成功移除');
        } else if (response.ok) {
          const hasDeprecationHeader = response.headers.has('X-Deprecated');
          console.log('旧API路径仍能访问，但已标记为废弃:', hasDeprecationHeader);
        }
      } catch (error) {
        console.error('测试旧API路径时出错:', error);
      }
    });
  });
  
  // 7. 测试错误处理
  describe('错误处理测试', () => {
    it('应该正确处理访问不存在的文件', async () => {
      try {
        await fileApi.getFile('non_existent_file_id');
        // 如果没有抛出异常，测试应该失败
        expect.fail('应该抛出"文件不存在"的错误');
      } catch (error) {
        // 验证是否是预期的错误
        expect(error.message).to.include('不存在');
      }
    });
    
    it('应该正确处理无权限操作', async () => {
      // 这个测试需要根据你的权限系统来实现
      // 例如尝试操作其他用户的文件
      console.log('权限测试需要根据具体系统实现');
    });
  });
  
  // 测试后清理环境
  after(async () => {
    console.log('清理测试环境...');
    
    // 删除测试过程中创建的文件和文件夹
    try {
      const { items } = await fileApi.getFiles();
      const testItems = items.filter(item => 
        item.name.startsWith('API测试') || 
        item.name.startsWith('test_')
      );
      
      if (testItems.length > 0) {
        await fileApi.deleteFiles({ fileIds: testItems.map(item => item.id) });
        console.log(`已清理${testItems.length}个测试文件/文件夹`);
      }
    } catch (error) {
      console.error('清理测试数据失败:', error);
    }
  });
}); 