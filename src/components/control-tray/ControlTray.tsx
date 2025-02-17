import cn from 'classnames'

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { useLiveAPIContext } from '../../contexts/LiveAPIContext'
import { UseMediaStreamResult } from '../../hooks/use-media-stream-mux'
import { useScreenCapture } from '../../hooks/use-screen-capture'
import { useWebcam } from '../../hooks/use-webcam'
import { AudioRecorder } from '../../lib/audio-recorder'
import AudioPulse from '../audio-pulse/AudioPulse'
import './control-tray.scss'

export type ControlTrayProps = {
    videoRef: RefObject<HTMLVideoElement>
    children?: ReactNode
    supportsVideo: boolean
    onVideoStreamChange?: (stream: MediaStream | null) => void
}

type MediaStreamButtonProps = {
    isStreaming: boolean
    onIcon: string
    offIcon: string
    start: () => Promise<any>
    stop: () => any
}

/**
 * button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
        <button className="action-button" onClick={stop}>
            <span className="material-symbols-outlined">{onIcon}</span>
        </button>
    ) : (
        <button className="action-button" onClick={start}>
            <span className="material-symbols-outlined">{offIcon}</span>
        </button>
    )
)

function ControlTray({ videoRef, children, onVideoStreamChange = () => {}, supportsVideo }: ControlTrayProps) {
    const videoStreams = [useWebcam(), useScreenCapture()]
    const [activeVideoStream, setActiveVideoStream] = useState<MediaStream | null>(null)
    const [webcam, screenCapture] = videoStreams
    const [inVolume, setInVolume] = useState(0)
    const [audioRecorder] = useState(() => new AudioRecorder())
    const [muted, setMuted] = useState(false)
    const renderCanvasRef = useRef<HTMLCanvasElement>(null)
    const connectButtonRef = useRef<HTMLButtonElement>(null)

    const { client, connected, connect, disconnect, volume } = useLiveAPIContext()

    // 新增连接状态
    const [isConnecting, setIsConnecting] = useState(false)

    useEffect(() => {
        if (!connected && connectButtonRef.current) {
            connectButtonRef.current.focus()
        }
    }, [connected])

    useEffect(() => {
        document.documentElement.style.setProperty('--volume', `${Math.max(5, Math.min(inVolume * 200, 8))}px`)
    }, [inVolume])

    useEffect(() => {
        const onData = (base64: string) => {
            client.sendRealtimeInput([
                {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64
                }
            ])
        }
        if (connected && !muted && audioRecorder) {
            audioRecorder.on('data', onData).on('volume', setInVolume).start()
        } else {
            audioRecorder.stop()
        }
        return () => {
            audioRecorder.off('data', onData).off('volume', setInVolume)
        }
    }, [connected, client, muted, audioRecorder])

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = activeVideoStream
        }

        let timeoutId = -1

        function sendVideoFrame() {
            const video = videoRef.current
            const canvas = renderCanvasRef.current

            if (!video || !canvas) {
                return
            }

            const ctx = canvas.getContext('2d')!
            canvas.width = video.videoWidth * 0.25
            canvas.height = video.videoHeight * 0.25
            if (canvas.width + canvas.height > 0) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
                const base64 = canvas.toDataURL('image/jpeg', 1.0)
                const data = base64.slice(base64.indexOf(',') + 1, Infinity)
                client.sendRealtimeInput([{ mimeType: 'image/jpeg', data }])
            }
            if (connected) {
                timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5)
            }
        }
        if (connected && activeVideoStream !== null) {
            requestAnimationFrame(sendVideoFrame)
        }
        return () => {
            clearTimeout(timeoutId)
        }
    }, [connected, activeVideoStream, client, videoRef])

    //handler for swapping from one video-stream to the next
    const changeStreams = (next?: UseMediaStreamResult) => async () => {
        if (next) {
            const mediaStream = await next.start()
            setActiveVideoStream(mediaStream)
            onVideoStreamChange(mediaStream)
        } else {
            setActiveVideoStream(null)
            onVideoStreamChange(null)
        }

        videoStreams.filter(msr => msr !== next).forEach(msr => msr.stop())
    }

    // 连接按钮点击时，设置连接状态
    const handleConnect = async () => {
        setIsConnecting(true) // 开始连接
        await connect()
        setIsConnecting(false) // 连接完成
    }

    return (
        <section className="control-tray">
            <canvas style={{ display: 'none' }} ref={renderCanvasRef} />
            <nav className={cn('actions-nav', { disabled: !connected })}>
                <button className={cn('action-button mic-button')} onClick={() => setMuted(!muted)}>
                    {!muted ? <span className="material-symbols-outlined filled">mic</span> : <span className="material-symbols-outlined filled">mic_off</span>}
                </button>

                <div className="action-button no-action outlined">
                    <AudioPulse volume={volume} active={connected} hover={false} />
                </div>

                {supportsVideo && (
                    <>
                        <MediaStreamButton
                            isStreaming={screenCapture.isStreaming}
                            start={changeStreams(screenCapture)}
                            stop={changeStreams()}
                            onIcon="cancel_presentation"
                            offIcon="present_to_all"
                        />
                        <MediaStreamButton isStreaming={webcam.isStreaming} start={changeStreams(webcam)} stop={changeStreams()} onIcon="videocam_off" offIcon="videocam" />
                    </>
                )}
                {children}
            </nav>

            {/* 连接按钮及提示 */}
            <div className={cn('connection-container', { connected })}>
                <div className="connection-button-container">
                    <button ref={connectButtonRef} className={cn('action-button connect-toggle', { connected })} onClick={connected ? disconnect : handleConnect}>
                        <span className="material-symbols-outlined filled">{isConnecting ? 'hourglass_empty' : connected ? 'pause' : 'play_arrow'}</span>
                    </button>
                </div>
                <span className="text-indicator">{isConnecting ? '正在连接...' : connected ? '已连接' : '未连接'}</span>
            </div>
        </section>
    )
}

export default memo(ControlTray)
