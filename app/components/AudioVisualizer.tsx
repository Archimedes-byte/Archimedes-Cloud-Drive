import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioElement }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioElement) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0.75;
    
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!canvas || !ctx) return;
      
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;
      
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      // 创建渐变背景
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, 'rgba(8, 8, 24, 0.2)');
      bgGradient.addColorStop(0.5, 'rgba(8, 8, 24, 0.3)');
      bgGradient.addColorStop(1, 'rgba(8, 8, 24, 0.2)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
      
      // 计算中心点和最大条形数（减少数量以增加间距）
      const centerX = width / 2;
      const maxBars = Math.min(bufferLength / 4, 180); // 减少条形数量
      const barWidth = Math.max(2, (width / 2 / maxBars) * 0.5); // 减小条形宽度
      const barGap = barWidth * 0.8; // 添加间距
      
      // 创建渐变对象
      const gradient = ctx.createLinearGradient(0, height / 2 - 150, 0, height / 2 + 150);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');   // 亮青色
      gradient.addColorStop(0.3, 'rgba(0, 200, 255, 0.7)'); // 天蓝色
      gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.5)'); // 蓝色
      gradient.addColorStop(0.7, 'rgba(0, 200, 255, 0.7)'); // 天蓝色
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0.9)');   // 亮青色
      
      // 平滑处理数组
      const smoothedData = new Float32Array(maxBars);
      for (let i = 0; i < maxBars; i++) {
        const dataIndex = Math.floor(i * (bufferLength / maxBars));
        // 使用周围数据的平均值来平滑
        let sum = 0;
        const range = 2;
        for (let j = -range; j <= range; j++) {
          const index = Math.max(0, Math.min(bufferLength - 1, dataIndex + j));
          sum += dataArray[index];
        }
        smoothedData[i] = sum / (range * 2 + 1);
      }
      
      for (let i = 0; i < maxBars; i++) {
        const percent = smoothedData[i] / 255;
        
        // 使用对数计算高度，并增加幅度
        const baseHeight = Math.log(percent + 1) * height * 0.45; // 增加高度系数
        const time = Date.now() * 0.0005;
        const wave = Math.sin(time + i * 0.05) * 0.2; // 增加波动幅度
        const barHeight = baseHeight * (1 + wave);
        
        // 增加发光效果的强度
        const alpha = 0.65 + percent * 0.35;
        const glowSize = 15 + percent * 25;
        
        // 设置发光效果
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = `rgba(0, 255, 255, ${alpha * 0.7})`;
        
        // 计算条形位置
        const leftX = centerX - (i + 1) * (barWidth + barGap);
        const rightX = centerX + i * (barWidth + barGap);
        const y = height / 2;
        
        // 绘制主体条形
        ctx.fillStyle = gradient;
        
        // 左侧条形
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(leftX + barWidth, y);
        ctx.lineTo(leftX + barWidth, y - barHeight);
        ctx.lineTo(leftX, y - barHeight);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(leftX + barWidth, y);
        ctx.lineTo(leftX + barWidth, y + barHeight);
        ctx.lineTo(leftX, y + barHeight);
        ctx.closePath();
        ctx.fill();
        
        // 右侧条形
        ctx.beginPath();
        ctx.moveTo(rightX, y);
        ctx.lineTo(rightX + barWidth, y);
        ctx.lineTo(rightX + barWidth, y - barHeight);
        ctx.lineTo(rightX, y - barHeight);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(rightX, y);
        ctx.lineTo(rightX + barWidth, y);
        ctx.lineTo(rightX + barWidth, y + barHeight);
        ctx.lineTo(rightX, y + barHeight);
        ctx.closePath();
        ctx.fill();
        
        // 添加高亮效果
        if (percent > 0.7) {
          const highlightAlpha = (percent - 0.7) * 3;
          ctx.fillStyle = `rgba(255, 255, 255, ${highlightAlpha})`;
          
          // 左侧高亮
          ctx.fillRect(leftX, y - barHeight, barWidth, 2);
          ctx.fillRect(leftX, y + barHeight, barWidth, 2);
          
          // 右侧高亮
          ctx.fillRect(rightX, y - barHeight, barWidth, 2);
          ctx.fillRect(rightX, y + barHeight, barWidth, 2);
        }
      }
    };
    
    draw();
    
    return () => {
      audioContext.close();
    };
  }, [audioElement]);

  return (
    <canvas
      ref={canvasRef}
      className="audio-visualizer"
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
};

export default AudioVisualizer; 