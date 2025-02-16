import { useState, useEffect } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

interface ExtendedUseMediaStreamResult extends UseMediaStreamResult {
  toggleCamera: () => void;
}

export function useWebcam(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" 为后置，"user" 为前置

  const start = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
    });
    setStream(mediaStream);
    setIsStreaming(true);
    return mediaStream;
  };

  const stop = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  // 切换摄像头
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    stop(); // 停止当前流
    start(); // 重新启动流
  };

  // 确保返回的对象中包含 toggleCamera 方法
  return {
    type: "webcam",
    start,
    stop,
    isStreaming,
    stream,
    toggleCamera, // 添加 toggleCamera
  };
}
