// 音频播放状态枚举
export enum AudioPlaybackState {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  LOADING = 'loading',
  ERROR = 'error'
}

// 音频可视化属性接口
export interface AudioVisualizerProps {
  audioElement: HTMLAudioElement;
  audio?: HTMLAudioElement;
  className?: string;
}

// 视频播放器属性接口
export interface VideoPlayerProps {
  url: string;
  fileName: string;
  type?: string;
  onError?: (error: Error) => void;
}

// 媒体播放器控制接口
export interface MediaPlayerControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

// 媒体播放进度接口
export interface MediaProgress {
  currentTime: number;
  duration: number;
  buffered: number;
  percentage: number;
}

// 音频频谱数据点接口
export interface AudioSpectrumPoint {
  x: number;
  y: number;
  value: number;
}

// 音频频谱分析配置接口
export interface AudioSpectrumConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  barCount?: number;
  barSpacing?: number;
  barWidth?: number;
  colors?: string[];
}

// 音频文件格式枚举
export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
  FLAC = 'flac',
  AAC = 'aac',
  M4A = 'm4a'
}

// 视频文件格式枚举
export enum VideoFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  MOV = 'mov',
  AVI = 'avi',
  MKV = 'mkv',
  FLV = 'flv'
} 