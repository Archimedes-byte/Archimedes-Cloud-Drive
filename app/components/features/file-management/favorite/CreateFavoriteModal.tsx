'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, message } from 'antd';
import { FolderPlus } from 'lucide-react';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';

interface CreateFavoriteModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateFavoriteModal: React.FC<CreateFavoriteModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [existingFolders, setExistingFolders] = useState<FavoriteFolderInfo[]>([]);

  // 当模态窗口打开时，获取现有收藏夹列表
  useEffect(() => {
    if (visible) {
      fetchExistingFolders();
    }
  }, [visible]);

  // 获取现有收藏夹列表
  const fetchExistingFolders = async () => {
    try {
      const response = await fileApi.getFavoriteFolders();
      setExistingFolders(response.folders || []);
    } catch (error) {
      console.error('获取收藏夹列表失败:', error);
    }
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      // 表单验证
      const values = await form.validateFields();
      const { name, description, isDefault } = values;

      // 检查收藏夹名称是否已存在
      const trimmedName = name.trim();
      const nameExists = existingFolders.some(
        folder => folder.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (nameExists) {
        message.error(`收藏夹"${trimmedName}"已存在，请使用其他名称`);
        return;
      }

      setLoading(true);
      
      // 调用API创建收藏夹
      const response = await fileApi.createFavoriteFolder(trimmedName, description, isDefault);
      
      message.success('收藏夹创建成功');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        message.error(`创建收藏夹失败: ${error.message}`);
      } else {
        message.error('创建收藏夹失败，请重试');
      }
      console.error('创建收藏夹出错:', error);
    } finally {
      setLoading(false);
    }
  };

  // 取消并重置表单
  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderPlus size={18} style={{ color: '#3b82f6' }} />
          <span>新建收藏夹</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      maskClosable={false}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        name="createFavoriteForm"
        initialValues={{ isDefault: false }}
      >
        <Form.Item
          name="name"
          label="收藏夹名称"
          rules={[
            { required: true, message: '请输入收藏夹名称' },
            { max: 50, message: '名称不能超过50个字符' }
          ]}
        >
          <Input placeholder="请输入收藏夹名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
          rules={[
            { max: 200, message: '描述不能超过200个字符' }
          ]}
        >
          <Input.TextArea 
            placeholder="收藏夹描述（可选）" 
            rows={3}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="isDefault"
          valuePropName="checked"
        >
          <input type="checkbox" id="isDefault" />
          <label htmlFor="isDefault" style={{ marginLeft: '8px' }}>设为默认收藏夹</label>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={handleCancel}>
                取消
              </Button>
              <Button 
                type="primary" 
                onClick={handleSubmit} 
                loading={loading}
              >
                创建收藏夹
              </Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateFavoriteModal; 