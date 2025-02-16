import { useState, useEffect, useCallback } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";
export function useWebcam(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  // 用 useCallback 包裹 start 函数
  const start = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode,
      },
    });
    setStream(mediaStream);
    setIsStreaming(true);
    return mediaStream;
  }, [facingMode]);
  // 用 useCallback 包裹 stop 函数
  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);
  // 用 useCallback 包裹 toggleCamera 函数
  const toggleCamera = useCallback(async () => {
    stop(); // 先停止当前摄像头
    setFacingMode(facingMode === "environment" ? "user" : "environment"); // 切换摄像头
    await start(); // 重新启动摄像头
  }, [facingMode, start, stop]);
  useEffect(() => {
    const handleStreamEnded = () => {
      setIsStreaming(false);
      setStream(null);
    };
    if (stream) {
      stream
        .getTracks()
        .forEach((track) => track.addEventListener("ended", handleStreamEnded));
      return () => {
        stream
          .getTracks()
          .forEach((track) =>
            track.removeEventListener("ended", handleStreamEnded),
          );
      };
    }
  }, [stream]);
  useEffect(() => {
    const handleDoubleClick = () => {
      toggleCamera();
    };
    document.addEventListener("dblclick", handleDoubleClick);
    return () => {
      document.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [toggleCamera]);
  const result: UseMediaStreamResult = {
    type: "webcam",
    start,
    stop,
    isStreaming,
    stream,
  };
  return result;
}
