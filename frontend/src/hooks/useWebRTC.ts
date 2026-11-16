'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

interface UseWebRTCOptions {
  onRemoteStream?: (stream: MediaStream) => void
  onSignalingMessage?: (message: any) => void
}

export function useWebRTC(options: UseWebRTCOptions = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const peerRef = useRef<RTCPeerConnection | null>(null)

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      return stream
    } catch (err) {
      console.error('Failed to get media:', err)
      return null
    }
  }, [])

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    pc.onicecandidate = (event) => {
      if (event.candidate && options.onSignalingMessage) {
        options.onSignalingMessage({ type: 'candidate', candidate: event.candidate })
      }
    }

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0])
        options.onRemoteStream?.(event.streams[0])
      }
    }

    peerRef.current = pc
    return pc
  }, [options])

  const createOffer = useCallback(async () => {
    const pc = peerRef.current || createPeerConnection()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    return pc.localDescription
  }, [createPeerConnection])

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = peerRef.current || createPeerConnection()
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return pc.localDescription
  }, [createPeerConnection])

  const setRemoteDescription = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (peerRef.current) {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }, [])

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (peerRef.current) {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }, [])

  const addLocalStream = useCallback((stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      peerRef.current?.addTrack(track, stream)
    })
  }, [])

  const toggleMic = useCallback(() => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMicOn(prev => !prev)
  }, [localStream])

  const toggleCamera = useCallback(() => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setIsCameraOn(prev => !prev)
  }, [localStream])

  const cleanup = useCallback(() => {
    localStream?.getTracks().forEach(t => t.stop())
    peerRef.current?.close()
    peerRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
  }, [localStream])

  useEffect(() => {
    return () => { cleanup() }
  }, [cleanup])

  return {
    localStream, remoteStream, isMicOn, isCameraOn,
    startLocalStream, createOffer, createAnswer, setRemoteDescription,
    addIceCandidate, addLocalStream, toggleMic, toggleCamera, cleanup
  }
}
