/**
 * Ant Design组件集合导出
 * 
 * 项目统一使用Ant Design组件库，所有组件必须从此文件导入
 * 使用规范：
 * 1. 直接导入: import { Button, Table } from '@/app/components/ui/ant'
 * 2. 不要从antd直接导入组件，以确保样式和主题的一致性
 * 3. 如需扩展组件，请在相应目录创建封装后在此处导出
 */

// 重新导出原始Ant Design组件
export { 
  // 布局组件
  Layout,
  Space,
  Grid,
  Flex,
  Divider,
  
  // 表单组件
  Form,
  Input,
  Checkbox,
  Radio,
  Select,
  Switch,
  Slider,
  DatePicker,
  TimePicker,
  InputNumber,
  Cascader,
  
  // 数据展示
  Table,
  Tabs,
  Card,
  List,
  Avatar,
  Badge,
  Tag,
  // Typography组件会单独导出
  
  // 反馈组件
  Modal,
  Drawer,
  Tooltip,
  Popover,
  Popconfirm,
  message,
  notification,
  Progress,
  Spin,
  Alert,
  
  // 导航组件
  Menu,
  Pagination,
  Breadcrumb,
  Dropdown,
  Steps,
  Affix,
  
  // 其他
  ConfigProvider,
  theme,
} from 'antd';

// 导出Grid中的组件
export { Row, Col } from 'antd';

// 单独导出Typography组件，防止重复导出
import { Typography } from 'antd';
export { Typography };
export const { Title, Text, Paragraph, Link } = Typography;

// 导出自定义组件
export { default as Button } from '../atoms/button/AntButton'; // 统一导出按钮
export { default as AntLayout } from '../../features/file-management/layout/AntLayout';
export { AntFileList } from '../../features/file-management/file-list/AntFileList';

// 导出图标
export { 
  SearchOutlined, 
  UserOutlined,
  FileOutlined,
  FolderOutlined,
  HomeOutlined,
  SettingOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MenuOutlined,
  CloseOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  MinusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  CalendarOutlined,
  StarOutlined,
} from '@ant-design/icons';

// 导出类型
export type { AntButtonProps } from '../atoms/button/AntButton';
export type { FormProps, InputProps, SelectProps, CheckboxProps, RadioProps } from 'antd'; 