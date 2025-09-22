/**
 * 视频显示组件
 * 负责显示摄像头视频流和绘制检测结果
 */

import React from 'react';
import type { VideoDisplayProps } from '../types';

const VideoDisplay: React.FC<VideoDisplayProps> = ({ videoRef, canvasRef }) => {
  return (
    <div style={{ 
      position: 'relative', 
      width: 864, 
      height: 486, 
      background: '#000', // 黑色背景，视频未加载时显示
      flexShrink: 0 // 防止被压缩
    }}>
      {/* 摄像头视频流 */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1, // 底层：显示视频
          objectFit: 'cover' // 保持宽高比，裁剪多余部分
        }} 
      />
      {/* 检测结果绘制画布 */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2, // 顶层：绘制检测框和关键点
          pointerEvents: 'none' // 不拦截鼠标事件，确保视频可以正常操作
        }}
      />
    </div>
  );
};

export default VideoDisplay;
