/**
 * 人脸检测自定义 Hook
 * 
 * 功能说明：
 * 1. 封装人脸检测的核心逻辑，包括模型初始化、摄像头控制、检测循环等
 * 2. 提供时序平滑算法，减少检测结果的抖动
 * 3. 支持年龄、性别、情绪识别和角度检测
 * 4. 实时绘制人脸检测框和关键点
 * 
 * 技术特点：
 * - 基于 @vladmandic/human 库的 AI 模型推理
 * - WebGL 加速的实时人脸检测
 * - 滑动窗口平滑算法提高结果稳定性
 * - 置信度阈值过滤提高数据可靠性
 * - 弧度到角度的自动转换
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Human } from '@vladmandic/human';
import type { 
  FaceData, 
  SmoothConfig, 
  HistoryBuffers
} from '../types';
import { 
  pushWithLimit, 
  getSmoothedEmotion, 
  getSmoothedGender, 
  getSmoothedAge,
  createHistoryBuffers
} from '../utils';

// ==================== 默认配置 ====================
/**
 * 默认平滑算法配置
 * - windowSize: 滑动窗口大小，保留最近 N 帧数据
 * - minConfidence: 最小置信度阈值，低于此值的数据会被过滤
 */
const DEFAULT_CONFIG: SmoothConfig = {
  windowSize: 1, // 窗口大小：保留最近 1 帧数据
  minConfidence: 0.3, // 最小置信度阈值：30%，让更多数据通过
};

/**
 * 人脸检测自定义 Hook
 * 
 * @param config 平滑算法配置，可选参数，默认使用 DEFAULT_CONFIG
 * @returns 人脸检测状态和方法
 * 
 * 返回值包括：
 * - 状态：statusMsg, isModelLoaded, isDetecting, faceData
 * - DOM 引用：videoRef, canvasRef
 * - 方法：startCamera, stopCamera, startDetection, stopDetection
 */
export const useFaceDetection = (config: SmoothConfig = DEFAULT_CONFIG) => {
  // ==================== DOM 引用 ====================
  const videoRef = useRef<HTMLVideoElement | null>(null); // 视频元素引用，用于显示摄像头画面
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 画布元素引用，用于绘制检测框和关键点
  const humanRef = useRef<Human | null>(null); // Human 实例引用，核心 AI 推理引擎
  const detectionActiveRef = useRef<boolean>(false); // 检测循环控制标志，避免状态更新导致的闭包问题

  // ==================== 组件状态 ====================
  const [statusMsg, setStatusMsg] = useState<string>(''); // 状态消息，显示当前操作状态
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false); // 模型加载状态
  const [isDetecting, setIsDetecting] = useState<boolean>(false); // 检测运行状态
  const [faceData, setFaceData] = useState<FaceData | null>(null); // 人脸分析数据，包含年龄、性别、情绪等信息

  // ==================== 时序平滑缓冲区 ====================
  // 这些缓冲区用于存储历史检测结果，实现时序平滑算法
  const historyBuffersRef = useRef<HistoryBuffers>(createHistoryBuffers());

  // ==================== 模型初始化 ====================
  /**
   * 初始化 Human 实例并加载 AI 模型
   * 在组件挂载时执行，负责：
   * 1. 创建 Human 实例并配置功能模块
   * 2. 加载人脸检测、情绪识别等 AI 模型
   * 3. 执行模型预热，提升首帧检测性能
   */
  useEffect(() => {
    const initHuman = async () => {
      // Human 库配置：启用人脸相关功能，禁用其他功能以提升性能
      const humanConfig = {
        backend: 'webgl' as const, // 使用 WebGL 后端进行 GPU 加速推理
        modelBasePath: '/human-models/', // 设置模型文件基础路径
        face: {
          enabled: true, // 启用人脸检测
          detector: { 
            enabled: true, 
            rotation: true, // 支持人脸旋转检测
            maxDetected: 5 // 最大检测人脸数量
          },
          mesh: { enabled: true }, // 启用人脸网格检测（关键点）
          iris: { enabled: true }, // 启用眼部检测
          description: { enabled: true }, // 启用人脸描述符
          embedding: { enabled: true, modelPath: 'mobilefacenet.json' }, // 人脸特征提取
          emotion: { enabled: true, modelPath: 'emotion.json' }, // 情绪识别
        },
        // 禁用其他功能以节省资源
        body: { enabled: false }, // 人体检测
        hand: { enabled: false }, // 手势检测
        gesture: { enabled: false }, // 姿态检测
        segmentation: { enabled: false }, // 图像分割
      };
      
      // 创建 Human 实例
      humanRef.current = new Human(humanConfig);
      console.log('Human 实例已创建，配置：', humanConfig);
      
      try {
        console.log('开始加载模型...');
        // 加载所有配置的 AI 模型
        await humanRef.current.load();
        
        // 模型预热：执行一次推理以优化后续性能
        try {
          await humanRef.current.warmup();
        } catch (warmupError) {
          // 预热失败不影响正常使用，仅记录日志
          console.warn('模型预热失败，但不影响正常使用：', warmupError);
        }
        
        console.log('模型加载完成！');
        console.log('已加载的模型:', Object.keys(humanRef.current.models));
        setIsModelLoaded(true);
        setStatusMsg('模型加载完成');
      } catch (e) {
        console.error('模型加载失败：', e);
        setStatusMsg(`模型加载失败：${(e as Error).message}`);
      }
    };
    
    // 执行初始化
    initHuman();
    
    // 组件卸载时的清理工作
    return () => {
      if (humanRef.current) {
        humanRef.current.webcam.stop(); // 停止摄像头流
      }
    };
  }, []); // 空依赖数组，确保只在组件挂载时执行一次

  // ==================== 摄像头控制 ====================
  
  /**
   * 启动摄像头
   * 请求用户摄像头权限并开始视频流
   * 注意：需要在 HTTPS 或 localhost 环境下才能正常工作
   */
  const startCamera = useCallback(async () => {
    try {
      setStatusMsg('正在启动摄像头...');
      
      // 请求摄像头权限，设置视频分辨率
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 864, height: 486 } // 设置视频分辨率
      });
      
      // 将视频流绑定到 video 元素
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play(); // 开始播放视频
        setStatusMsg('摄像头已启动');
      }
    } catch (e) {
      console.error('启动摄像头失败：', e);
      setStatusMsg(`启动失败：${(e as Error).message}`);
    }
  }, []);

  /**
   * 停止摄像头
   * 停止所有视频轨道并清理资源
   */
  const stopCamera = useCallback(() => {
    // 先停止人脸检测循环
    detectionActiveRef.current = false;
    setIsDetecting(false);
    
    // 停止视频流并清理资源
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      // 停止所有视频轨道
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStatusMsg('摄像头已停止');
    }
  }, []);

  // ==================== 人脸检测控制 ====================
  
  /**
   * 开始人脸检测
   * 启动连续的人脸检测和分析流程
   */
  const startDetection = useCallback(async () => {
    // 检查前置条件
    if (!humanRef.current || !videoRef.current) {
      setStatusMsg('模型或摄像头未就绪');
      return;
    }

    if (!isModelLoaded) {
      setStatusMsg('模型未加载完成');
      return;
    }

    try {
      setStatusMsg('正在启动人脸检测...');
      
      // 将视频元素绑定到 Human 实例，开始连续检测
      humanRef.current.video(videoRef.current);
      
      // 更新检测状态
      setIsDetecting(true);
      setStatusMsg('人脸检测已启动');
      
      // 设置画布尺寸与视频实际分辨率一致，确保绘制坐标正确
      if (canvasRef.current && videoRef.current) {
        const vw = (videoRef.current as HTMLVideoElement).videoWidth || 864;
        const vh = (videoRef.current as HTMLVideoElement).videoHeight || 486;
        canvasRef.current.width = vw;
        canvasRef.current.height = vh;
      }

      // 延迟启动检测循环，确保摄像头和模型都完全准备好
      setTimeout(() => {
        detectionActiveRef.current = true;
        requestAnimationFrame(detectionLoop); // 开始检测循环
      }, 500); // 延迟500ms，给系统充分的准备时间
    } catch (e) {
      console.error('启动检测失败：', e);
      setStatusMsg(`启动检测失败：${(e as Error).message}`);
    }
  }, [isModelLoaded]);

  /**
   * 停止人脸检测
   * 停止检测循环并清理相关状态
   */
  const stopDetection = useCallback(() => {
    detectionActiveRef.current = false; // 停止检测循环
    setIsDetecting(false); // 更新检测状态
    setStatusMsg('人脸检测已停止');
  }, []);

  // ==================== 检测循环核心逻辑 ====================
  
  /**
   * 人脸检测循环
   * 这是整个系统的核心函数，负责：
   * 1. 获取 AI 模型的检测结果
   * 2. 应用时序平滑算法处理数据
   * 3. 更新 UI 显示
   * 4. 绘制检测框和关键点
   * 5. 调度下一帧检测
   * 
   * 使用 useCallback 避免闭包陷阱，确保函数引用稳定
   */
  const detectionLoop = useCallback(() => {
    // 检查检测是否应该继续
    if (!detectionActiveRef.current || !humanRef.current) {
      return;
    }
    
    try {
      // 获取当前帧的 AI 检测结果
      const result = humanRef.current.result;
      
      if (result && result.face && result.face.length > 0) {
        console.log(`检测到 ${result.face.length} 张人脸`);
        
        // 处理第一张人脸的数据（通常是最主要的人脸）
        const firstFace = result.face[0];
        
        // ========== 数据预处理和时序平滑 ==========
        
        // 情绪检测：选择置信度最高的情绪，应用阈值过滤
        if (Array.isArray(firstFace.emotion)) {
          const top = firstFace.emotion
            .slice() // 创建副本避免修改原数组
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]; // 按置信度降序排列
          if (top && (top.score ?? 0) >= config.minConfidence) {
            pushWithLimit(
              historyBuffersRef.current.emotion, 
              { name: top.emotion, score: top.score as number }, 
              config.windowSize
            );
          }
        }

        // 性别检测：应用置信度阈值过滤
        if (firstFace.gender && typeof firstFace.genderScore === 'number' && firstFace.genderScore >= config.minConfidence) {
          pushWithLimit(
            historyBuffersRef.current.gender, 
            { gender: firstFace.gender, score: firstFace.genderScore }, 
            config.windowSize
          );
        }

        // 年龄检测：直接使用（年龄模型通常不提供置信度）
        if (typeof firstFace.age === 'number') {
          pushWithLimit(historyBuffersRef.current.age, firstFace.age, config.windowSize);
        }

        // ========== 应用平滑算法 ==========
        const smoothedEmotion = getSmoothedEmotion(historyBuffersRef.current.emotion);
        const smoothedGender = getSmoothedGender(historyBuffersRef.current.gender);
        const smoothedAge = getSmoothedAge(historyBuffersRef.current.age);

        // ========== 更新组件状态 ==========
        setFaceData({
          // 基础检测信息
          confidence: Math.round(((firstFace.score ?? 0) as number) * 100), // 人脸检测置信度
          faceScore: Math.round(((firstFace.faceScore ?? 0) as number) * 100), // 人脸质量评分
          
          // 平滑后的分析结果
          age: smoothedAge, // 年龄
          gender: smoothedGender.gender, // 性别
          genderScore: smoothedGender.score, // 性别置信度
          
          // 距离和活体检测
          distance: typeof firstFace.distance === 'number' ? Math.round(firstFace.distance * 100) : null, // 距离（厘米）
          real: typeof firstFace.real === 'number' ? Math.round(firstFace.real * 100) : null, // 真实度评分
          live: typeof firstFace.live === 'number' ? Math.round(firstFace.live * 100) : null, // 活体检测评分
          
          // 情绪分析
          emotion: smoothedEmotion ? { name: smoothedEmotion.name, score: smoothedEmotion.score } : null,
          
          // 几何信息（转换角度从弧度到度）
          rotation: firstFace.rotation ? {
            angle: firstFace.rotation.angle ? {
              roll: firstFace.rotation.angle.roll ? Math.round(firstFace.rotation.angle.roll * 180 / Math.PI * 10) / 10 : undefined,
              yaw: firstFace.rotation.angle.yaw ? Math.round(firstFace.rotation.angle.yaw * 180 / Math.PI * 10) / 10 : undefined,
              pitch: firstFace.rotation.angle.pitch ? Math.round(firstFace.rotation.angle.pitch * 180 / Math.PI * 10) / 10 : undefined,
            } : undefined,
            gaze: firstFace.rotation.gaze ? {
              bearing: firstFace.rotation.gaze.bearing ? Math.round(firstFace.rotation.gaze.bearing * 180 / Math.PI * 10) / 10 : undefined,
              strength: firstFace.rotation.gaze.strength
            } : undefined
          } : null,
          box: firstFace.box || null, // 检测框坐标 [x, y, width, height]
          size: typeof firstFace.size === 'number' ? firstFace.size : null // 人脸尺寸
        });
        
        // ========== 绘制检测结果 ==========
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // 清空画布
          try {
            // 使用插值后的结果绘制更平滑的检测框和关键点
            const interp = humanRef.current.next();
            humanRef.current.draw.face(canvasRef.current, interp.face ?? result.face);
          } catch (drawError) {
            // 绘制失败不影响检测功能，仅记录日志
            console.warn('绘制检测框失败：', drawError);
          }
        }
        
        setStatusMsg(`检测到 ${result.face.length} 张人脸`);
      } else {
        // 未检测到人脸的处理
        console.log('未检测到人脸');
        setFaceData(null); // 清空人脸数据
        
        // 清空画布
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setStatusMsg('未检测到人脸');
      }
    } catch (e) {
      console.error('检测循环错误:', e);
    }
    
    // 调度下一帧检测，保持实时性
    requestAnimationFrame(detectionLoop);
  }, [config.minConfidence, config.windowSize]); // 依赖配置参数，确保配置变化时重新创建函数

  // ==================== 返回状态和方法 ====================
  /**
   * 返回 Hook 的状态和方法
   * 供组件使用，提供完整的人脸检测功能
   */
  return {
    // 状态数据
    statusMsg, // 状态消息
    isModelLoaded, // 模型加载状态
    isDetecting, // 检测运行状态
    faceData, // 人脸分析数据
    
    // DOM 引用
    videoRef, // 视频元素引用
    canvasRef, // 画布元素引用
    
    // 控制方法
    startCamera, // 启动摄像头
    stopCamera, // 停止摄像头
    startDetection, // 开始人脸检测
    stopDetection, // 停止人脸检测
  };
};
