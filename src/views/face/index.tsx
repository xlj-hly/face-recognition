/**
 * 人脸识别主组件
 * 
 * 功能说明：
 * 1. 使用 @vladmandic/human 库进行实时人脸检测和分析
 * 2. 支持年龄、性别、情绪识别
 * 3. 提供活体检测和真实度评估
 * 4. 实现时序平滑算法，提高检测结果稳定性
 * 5. 实时绘制人脸检测框和关键点
 * 
 * 技术特点：
 * - 基于 WebGL 加速的 AI 模型推理
 * - 滑动窗口平滑算法减少检测抖动
 * - 置信度阈值过滤提高结果可靠性
 * - 响应式设计，支持不同屏幕尺寸
 * - 模块化组件设计，便于维护和扩展
 */

import React from 'react';
import { useFaceDetection } from './hooks/useFaceDetection';
import ControlPanel from './components/ControlPanel';
import VideoDisplay from './components/VideoDisplay';
import FaceDataPanel from './components/FaceDataPanel';

const Face: React.FC = () => {
  // 使用自定义 Hook 管理人脸检测逻辑
  const {
    statusMsg,
    isModelLoaded,
    isDetecting,
    faceData,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  } = useFaceDetection();

  return (
    <div style={{ 
      maxWidth: '880px', 
      margin: '12px auto', 
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' 
    }}>
      {/* 页面标题和说明 */}
      <h3 style={{ margin: '0 0 8px' }}>人脸识别 - 第二步：人脸检测</h3>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
        需在 HTTPS 或 localhost 下访问以启用摄像头权限。
      </div>

      {/* 控制面板组件 */}
      <ControlPanel
        isModelLoaded={isModelLoaded}
        isDetecting={isDetecting}
        statusMsg={statusMsg}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onStartDetection={startDetection}
        onStopDetection={stopDetection}
      />

      {/* 主要内容区域：视频显示 + 数据分析面板 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* 视频显示组件 */}
        <VideoDisplay
          videoRef={videoRef}
          canvasRef={canvasRef}
        />

        {/* 人脸数据面板组件 */}
        <FaceDataPanel faceData={faceData} />
      </div>
    </div>
  );
};

export default Face;