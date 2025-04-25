/**
 * Ant Design组件集合导出
 * 统一导出基于Ant Design的UI组件
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
export { default as AntButton } from '../atoms/button/AntButton';
export { default as AntLayout } from '../../features/file-management/layout/AntLayout';
export { AntFileList } from '../../features/file-management/file-list/AntFileList';

// 导出类型
export type { AntButtonProps } from '../atoms/button/AntButton'; 