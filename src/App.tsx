import { useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { IoClose, IoArrowRedo } from "react-icons/io5"; // 引入关闭图标和翻转图标
import { Zenitho } from "uvcanvas"; // 导入 Lumiflex 组件

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "liuziting-gemini-play-98-58acmhtr50hp.deno.dev";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [showModal, setShowModal] = useState(true); // 控制弹出层显示
  const [isFlipped, setIsFlipped] = useState(false); // 控制视频翻转状态

  // 关闭弹出层
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // 切换视频翻转状态
  const handleFlipToggle = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="App">
      {/* 使用 Lumiflex 作为背景 */}
      <div className="background-container">
        <Zenitho />
      </div>

      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <div className="streaming-console">
          <main>
            <div className="main-app-area">
              <Altair />
              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
                  flipped: isFlipped, // 应用翻转状态
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>

            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
            >
              {/* 添加一个图标按钮用于切换视频翻转 */}
              <button onClick={handleFlipToggle} className="control-button">
                <IoArrowRedo size={24} color="white" />
              </button>
            </ControlTray>
          </main>
        </div>
      </LiveAPIProvider>

      {/* 弹出层 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={handleCloseModal}>
              <IoClose size={24} />
            </button>
            <p>
              <div className="notification">
                <p><strong>温馨提示</strong></p>
                <p>为了确保您获得最佳体验，请在浏览器中打开本页面！</p>
                <p>当系统弹出音视频权限请求时，请点击<strong>“允许”</strong>。</p>
                <p>目前系统<strong>暂不支持中文</strong>沟通！</p>
              </div>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;