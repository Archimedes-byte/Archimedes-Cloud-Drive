// 1. 设置加载状态
setIsLoading(true);
setError(null);

// 2. 发送API请求
const response = await fetch(endpoint, {
  method: 'METHOD',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

// 3. 处理响应
const data = await response.json();

// 4. 验证响应状态
if (!response.ok) {
  throw new Error(data.error || '操作失败');
}

// 5. 处理成功响应
if (data.success) {
  message.success('操作成功');
  return true/结果;
} else {
  throw new Error(data.error || '操作失败');
} 