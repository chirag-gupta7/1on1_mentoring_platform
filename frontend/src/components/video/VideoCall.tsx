'use client'
import { useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface VideoCallProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMicOn: boolean
  isCameraOn: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
}

export default function VideoCall({ localStream, remoteStream, isMicOn, isCameraOn, onToggleMic, onToggleCamera }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  return (
    <div className="flex flex-col h-full bg-[#0a0a14]">
      <div className="flex-1 relative">
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Video size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Waiting for participant...</p>
            </div>
          </div>
        )}
        {localStream && (
          <div className="absolute bottom-3 right-3 w-40 h-28 rounded-lg overflow-hidden border-2 border-[#1e293b] shadow-lg">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 py-3 bg-[#1a1a2e] border-t border-[#1e293b]">
        <button
          onClick={onToggleMic}
          className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-[#1e293b] hover:bg-[#334155] text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
        >
          {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button
          onClick={onToggleCamera}
          className={`p-3 rounded-full transition-colors ${isCameraOn ? 'bg-[#1e293b] hover:bg-[#334155] text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
        >
          {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
      </div>
    </div>
  )
}
