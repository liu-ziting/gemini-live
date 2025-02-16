import { useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { IoClose } from "react-icons/io5"; // 引入关闭图标

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

  // 关闭弹出层
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="App">
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <div className="streaming-console">
          <main>
            <div className="main-app-area">
              <Altair />
              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
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
              {/* put your own buttons here */}
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