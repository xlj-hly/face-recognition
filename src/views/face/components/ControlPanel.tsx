/**
 * 控制面板组件
 * 负责摄像头和检测的控制按钮
 */

import React from 'react';
import type { ControlPanelProps } from '../types';

const ControlPanel: React.FC<ControlPanelProps> = ({
  isModelLoaded,
  isDetecting,
  statusMsg,
  onStartCamera,
  onStopCamera,
  onStartDetection,
  onStopDetection,
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 12, 
      alignItems: 'center', 
      flexWrap: 'wrap', 
      marginBottom: 8 
    }}>
      {/* 摄像头控制按钮 */}
      <button
        onClick={onStartCamera}
        style={{ padding: '6px 12px' }}
      >
        启动摄像头
      </button>
      <button
        onClick={onStopCamera}
        style={{ padding: '6px 12px' }}
      >
        停止摄像头
      </button>
      
      {/* 检测控制按钮：根据当前状态显示不同文本和颜色 */}
      <button
        onClick={isDetecting ? onStopDetection : onStartDetection}
        style={{ 
          padding: '6px 12px', 
          backgroundColor: isDetecting ? '#ff6b6b' : '#4CAF50', // 检测中显示红色，未检测显示绿色
          color: 'white' 
        }}
        disabled={!isModelLoaded} // 模型未加载时禁用按钮
      >
        {isDetecting ? '停止检测' : '开始检测'}
      </button>
      
      {/* 状态消息显示 */}
      <span style={{ fontSize: 12, color: '#333' }}>{statusMsg}</span>
    </div>
  );
};

export default ControlPanel;
