/**
 * 人脸数据面板组件
 * 负责显示人脸分析结果
 */

import React from 'react';
import type { FaceDataPanelProps } from '../types';
import { translateEmotionName } from '../utils';

const FaceDataPanel: React.FC<FaceDataPanelProps> = ({ faceData }) => {
  return (
    <div style={{ 
      width: 300, 
      height: 486, 
      background: '#f5f5f5', 
      padding: 16, 
      borderRadius: 8,
      overflow: 'auto', // 内容过多时显示滚动条
      flexShrink: 0, // 防止被压缩
      border: '1px solid #ddd'
    }}>
      <h4 style={{ margin: '0 0 16px', color: '#333' }}>人脸分析数据</h4>
      
      {/* 人脸数据展示区域 */}
      {faceData ? (
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          {/* 基础检测信息 */}
          <div style={{ marginBottom: 12 }}>
            <strong>检测置信度：</strong> {faceData.confidence}%
          </div>
          
          {/* 年龄信息 */}
          {faceData.age != null && (
            <div style={{ marginBottom: 12 }}>
              <strong>年龄：</strong> {faceData.age} 岁
            </div>
          )}
          
          {/* 性别信息 */}
          {faceData.gender && (
            <div style={{ marginBottom: 12 }}>
              <strong>性别：</strong> {faceData.gender === 'female' ? '女' : '男'}
              {faceData.genderScore != null && `（${faceData.genderScore}%）`}
            </div>
          )}
          
          {/* 距离信息 */}
          {faceData.distance != null && (
            <div style={{ marginBottom: 12 }}>
              <strong>距离：</strong> {faceData.distance} cm
            </div>
          )}
          
          {/* 真实度检测 */}
          {faceData.real != null && (
            <div style={{ marginBottom: 12 }}>
              <strong>真实度：</strong> {faceData.real}%
            </div>
          )}
          
          {/* 活体检测 */}
          {faceData.live != null && (
            <div style={{ marginBottom: 12 }}>
              <strong>活体：</strong> {faceData.live}%
            </div>
          )}
          
          {/* 人脸旋转角度信息 */}
          {faceData.rotation && (
            <div style={{ marginBottom: 12 }}>
              <div><strong>翻滚角：</strong> {faceData.rotation.angle?.roll || 0}°</div>
              <div><strong>偏航角：</strong> {faceData.rotation.angle?.yaw || 0}°</div>
              <div><strong>俯仰角：</strong> {faceData.rotation.angle?.pitch || 0}°</div>
              {faceData.rotation.gaze && (
                <div><strong>视线方向：</strong> {faceData.rotation.gaze.bearing || 0}°</div>
              )}
            </div>
          )}

          {/* 情绪分析结果 */}
          {faceData.emotion && (
            <div style={{ marginBottom: 12 }}>
              <strong>情绪：</strong> {translateEmotionName(faceData.emotion.name)}（{faceData.emotion.score}%）
            </div>
          )}
          
          {/* 技术信息区域 */}
          <div style={{ marginTop: 16, padding: 8, background: '#e8f4fd', borderRadius: 4 }}>
            <div><strong>人脸质量分：</strong> {faceData.faceScore}%</div>
            {faceData.box && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                检测框：[{Math.round(faceData.box[0])}, {Math.round(faceData.box[1])}, {Math.round(faceData.box[2])}, {Math.round(faceData.box[3])}]
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 未检测到人脸时的提示信息 */
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          等待检测到人脸...
        </div>
      )}
    </div>
  );
};

export default FaceDataPanel;
