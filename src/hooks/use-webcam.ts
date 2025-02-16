import { useState, useEffect } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";



export function useWebcam(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // 默认后置摄像头

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
            track.removeEventListener("ended", handleStreamEnded)
          );
      };
    }
  }, [stream]);

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

  // 切换前后摄像头
  const toggleCamera = async () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    stop();
    await start();
  };

  const result: UseMediaStreamResult = {
    type: "webcam",
    start,
    stop,
    isStreaming,
    stream,
    toggleCamera, // 保持 toggleCamera
  };

  return result;
}

