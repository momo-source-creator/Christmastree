
import React, { useRef, useEffect, useState } from 'react';
import { HandData } from '../types';

interface HandTrackerProps {
  onUpdate: (data: HandData) => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hands: any = null;
    let camera: any = null;

    const script1 = document.createElement('script');
    script1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    script1.async = true;

    const script2 = document.createElement('script');
    script2.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
    script2.async = true;

    const script3 = document.createElement('script');
    script3.src = "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js";
    script3.async = true;

    document.body.appendChild(script1);
    document.body.appendChild(script2);
    document.body.appendChild(script3);

    const initTracking = () => {
      // @ts-ignore
      if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined' || typeof window.drawConnectors === 'undefined') {
        setTimeout(initTracking, 200);
        return;
      }

      // @ts-ignore
      hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: any) => {
        const canvasCtx = canvasRef.current?.getContext('2d');
        if (!canvasCtx || !canvasRef.current || !videoRef.current) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          
          // @ts-ignore
          window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF7F', lineWidth: 2 });
          // @ts-ignore
          window.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 2 });

          const wrist = landmarks[0];
          const middleMCP = landmarks[9];
          const x = (wrist.x + middleMCP.x) / 2;
          const y = (wrist.y + middleMCP.y) / 2;
          const z = wrist.z;

          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];
          
          const handSize = Math.hypot(wrist.x - middleMCP.x, wrist.y - middleMCP.y);
          
          // Gesture: Open Palm
          const spread = Math.hypot(thumbTip.x - pinkyTip.x, thumbTip.y - pinkyTip.y);
          const isOpen = spread > handSize * 1.5;

          // Gesture: Pinch
          const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
          const isPinching = pinchDist < 0.05;

          // Gesture: Pointing
          const indexPIP = landmarks[6];
          const isPointing = !isPinching && (indexTip.y < indexPIP.y) && (middleTip.y > landmarks[10].y);

          // Gesture: Fist (Clenched hand)
          // Detected when all finger tips are near the palm center/wrist
          const tips = [indexTip, middleTip, ringTip, pinkyTip];
          const isFist = !isOpen && !isPointing && tips.every(tip => Math.hypot(tip.x - middleMCP.x, tip.y - middleMCP.y) < handSize * 0.8);

          onUpdate({
            x,
            y,
            z: Math.abs(z),
            isOpen,
            isPointing,
            isPinching,
            isFist,
            indexTip: { x: indexTip.x, y: indexTip.y, z: indexTip.z },
            detected: true,
          });
        } else {
          onUpdate({
            x: 0.5, y: 0.5, z: 0.5,
            isOpen: false, isPointing: false, isPinching: false, isFist: false,
            indexTip: null, detected: false,
          });
        }
        canvasCtx.restore();
      });

      if (videoRef.current) {
        try {
          // @ts-ignore
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (hands) await hands.send({ image: videoRef.current! });
            },
            width: 640,
            height: 480,
          });
          camera.start();
        } catch (e) {
          console.error("Camera error:", e);
          setError("Tracker failed.");
        }
      }
    };

    initTracking();

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
      document.body.removeChild(script1);
      document.body.removeChild(script2);
      document.body.removeChild(script3);
    };
  }, [onUpdate]);

  return (
    <div className="relative w-full h-full bg-black">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover scale-x-[-1]" width={320} height={240} />
      {error && <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-[10px] text-center p-2">{error}</div>}
    </div>
  );
};
