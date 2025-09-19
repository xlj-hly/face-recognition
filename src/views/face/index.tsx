import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Human } from '@vladmandic/human';

const Face: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const humanRef = useRef<Human | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const detectionActiveRef = useRef<boolean>(false);

  // 初始化 Human 实例并加载模型
  useEffect(() => {
    const initHuman = async () => {
      const config = {
        backend: 'webgl' as const,
        face: {
          enabled: true,
          detector: { enabled: true, rotation: true, maxDetected: 5 },
          mesh: { enabled: true },
          iris: { enabled: true },
          description: { enabled: true },
          embedding: { enabled: true },
          emotion: { enabled: false },
        },
        body: { enabled: false },
        hand: { enabled: false },
        gesture: { enabled: false },
        segmentation: { enabled: false },
      };
      
      humanRef.current = new Human(config);
      console.log('Human 实例已创建，配置：', config);
      
      try {
        console.log('开始加载模型...');
        await humanRef.current.load();
        console.log('模型加载完成！');
        console.log('已加载的模型:', Object.keys(humanRef.current.models));
        setIsModelLoaded(true);
        setStatusMsg('模型加载完成');
      } catch (e) {
        console.error('模型加载失败：', e);
        setStatusMsg(`模型加载失败：${(e as Error).message}`);
      }
    };
    
    initHuman();
    
    return () => {
      if (humanRef.current) {
        humanRef.current.webcam.stop();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setStatusMsg('正在启动摄像头...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 864, height: 486 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatusMsg('摄像头已启动');
      }
    } catch (e) {
      console.error('启动摄像头失败：', e);
      setStatusMsg(`启动失败：${(e as Error).message}`);
    }
  };

  const stopCamera = () => {
    // 先停止检测
    detectionActiveRef.current = false;
    setIsDetecting(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStatusMsg('摄像头已停止');
    }
  };

  // 开始人脸检测
  const startDetection = async () => {
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
      
      // 启动连续检测
      humanRef.current.video(videoRef.current);
      
      // 设置检测状态
      setIsDetecting(true);
      setStatusMsg('人脸检测已启动');
      
      // 设置绘制画布尺寸与视频一致
      if (canvasRef.current) {
        canvasRef.current.width = 864;
        canvasRef.current.height = 486;
      }

      // 延迟启动检测循环，确保摄像头和模型都准备好
      setTimeout(() => {
        detectionActiveRef.current = true;
        requestAnimationFrame(detectionLoop);
      }, 1000); // 延迟1秒
    } catch (e) {
      console.error('启动检测失败：', e);
      setStatusMsg(`启动检测失败：${(e as Error).message}`);
    }
  };

  // 停止人脸检测
  const stopDetection = () => {
    detectionActiveRef.current = false;
    setIsDetecting(false);
    setStatusMsg('人脸检测已停止');
  };

  // 检测循环 - 使用 useCallback 避免闭包陷阱
  const detectionLoop = useCallback(() => {
    if (!detectionActiveRef.current || !humanRef.current) {
      return;
    }
    
    try {
      // 获取检测结果
      const result = humanRef.current.result;
      
      if (result && result.face && result.face.length > 0) {
        console.log(`检测到 ${result.face.length} 张人脸`);
        // 绘制检测框到画布
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          try {
            humanRef.current.draw.face(canvasRef.current, result.face);
          } catch {}
        }
        
        // 打印每张人脸的详细信息
        result.face.forEach((face, index) => {
          console.log(`人脸 ${index + 1}:`, {
            id: face.id,
            box: face.box, // [x, y, width, height]
            score: face.score, // 检测置信度
            faceScore: face.faceScore, // 人脸质量分数
            embedding: face.embedding ? `[${face.embedding.length} 维向量]` : '无',
            size: face.size // [width, height]
          });
        });
        
        setStatusMsg(`检测到 ${result.face.length} 张人脸`);
      } else {
        console.log('未检测到人脸');
        // 未检测到时清空画布
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setStatusMsg('未检测到人脸');
      }
    } catch (e) {
      console.error('检测循环错误:', e);
    }
    
    // 继续下一帧检测
    requestAnimationFrame(detectionLoop);
  }, []); // 空依赖数组，确保函数引用稳定

  return (
    <div style={{ maxWidth: '880px', margin: '12px auto', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
      <h3 style={{ margin: '0 0 8px' }}>人脸识别 - 第二步：人脸检测</h3>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>需在 HTTPS 或 localhost 下访问以启用摄像头权限。</div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <button
          onClick={startCamera}
          style={{ padding: '6px 12px' }}
        >
          启动摄像头
        </button>
        <button
          onClick={stopCamera}
          style={{ padding: '6px 12px' }}
        >
          停止摄像头
        </button>
        <button
          onClick={isDetecting ? stopDetection : startDetection}
          style={{ 
            padding: '6px 12px', 
            backgroundColor: isDetecting ? '#ff6b6b' : '#4CAF50', 
            color: 'white' 
          }}
          disabled={!isModelLoaded}
        >
          {isDetecting ? '停止检测' : '开始检测'}
        </button>
        <span style={{ fontSize: 12, color: '#333' }}>{statusMsg}</span>
      </div>

      <div style={{ position: 'relative', width: 864, height: 486, background: '#000' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ 
            width: 864, 
            height: 486,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }} 
        />
        <canvas
          ref={canvasRef}
          style={{
            width: 864,
            height: 486,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
};

export default Face;