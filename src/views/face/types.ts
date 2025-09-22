/**
 * 人脸识别组件类型定义
 * 
 * 本文件定义了人脸识别系统中使用的所有 TypeScript 接口和类型
 * 包括数据结构、组件属性、配置参数等
 */

// ==================== 数据结构定义 ====================

/**
 * 情绪数据结构
 * 用于存储情绪识别的结果
 */
export interface EmotionData {
  name: string; // 情绪名称（如：neutral, happy, sad 等）
  score: number; // 情绪置信度分数（0-1 之间的小数）
}

/**
 * 性别数据结构
 * 用于存储性别识别的结果
 */
export interface GenderData {
  gender: string; // 性别标识（male 或 female）
  score: number; // 性别识别置信度分数（0-1 之间的小数）
}

/**
 * 人脸旋转角度数据结构
 * 用于存储人脸的三维旋转角度和视线方向信息
 */
export interface RotationData {
  angle?: {
    roll?: number; // 翻滚角（绕 Z 轴旋转，单位：度）
    yaw?: number; // 偏航角（绕 Y 轴旋转，单位：度）
    pitch?: number; // 俯仰角（绕 X 轴旋转，单位：度）
  };
  gaze?: {
    bearing?: number; // 视线方向角度（单位：度）
    strength?: number; // 视线强度（0-1 之间的小数）
  };
}

/**
 * 人脸分析数据主结构
 * 包含单张人脸的完整分析结果，是系统核心数据结构
 */
export interface FaceData {
  confidence: number; // 人脸检测置信度（0-100 的整数）
  faceScore: number; // 人脸质量评分（0-100 的整数）
  age: number | null; // 年龄估计（岁，可能为 null）
  gender: string | null; // 性别识别结果（'male' 或 'female'，可能为 null）
  genderScore: number | null; // 性别识别置信度（0-100 的整数，可能为 null）
  distance: number | null; // 人脸距离摄像头的距离（厘米，可能为 null）
  real: number | null; // 真实度评分（0-100 的整数，可能为 null）
  live: number | null; // 活体检测评分（0-100 的整数，可能为 null）
  emotion: EmotionData | null; // 情绪分析结果（可能为 null）
  rotation: RotationData | null; // 人脸旋转角度信息（可能为 null）
  box: number[] | null; // 人脸检测框坐标 [x, y, width, height]（可能为 null）
  size: number | null; // 人脸尺寸（像素，可能为 null）
}

// ==================== 组件属性定义 ====================

/**
 * 控制面板组件属性
 * 定义控制面板组件接收的 props 类型
 */
export interface ControlPanelProps {
  isModelLoaded: boolean; // 模型是否已加载完成
  isDetecting: boolean; // 是否正在进行人脸检测
  statusMsg: string; // 当前状态消息
  onStartCamera: () => void; // 启动摄像头回调函数
  onStopCamera: () => void; // 停止摄像头回调函数
  onStartDetection: () => void; // 开始检测回调函数
  onStopDetection: () => void; // 停止检测回调函数
}

/**
 * 视频显示组件属性
 * 定义视频显示组件接收的 props 类型
 */
export interface VideoDisplayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>; // 视频元素引用
  canvasRef: React.RefObject<HTMLCanvasElement | null>; // 画布元素引用
}

/**
 * 人脸数据面板组件属性
 * 定义数据面板组件接收的 props 类型
 */
export interface FaceDataPanelProps {
  faceData: FaceData | null; // 人脸分析数据（可能为 null）
}

// ==================== 配置和工具类型定义 ====================

/**
 * 时序平滑算法配置
 * 用于配置人脸检测数据的平滑处理参数
 */
export interface SmoothConfig {
  windowSize: number; // 滑动窗口大小，控制保留最近多少帧的历史数据
  minConfidence: number; // 最小置信度阈值，低于此值的数据会被过滤掉
}

/**
 * 历史数据缓冲区
 * 用于存储时序平滑算法所需的历史检测数据
 */
export interface HistoryBuffers {
  emotion: EmotionData[]; // 情绪检测历史数据数组
  gender: GenderData[]; // 性别检测历史数据数组
  age: number[]; // 年龄检测历史数据数组
}
