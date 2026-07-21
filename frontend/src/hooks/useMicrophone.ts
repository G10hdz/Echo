// Hook for browser microphone recording

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseMicrophoneReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
  /**
   * Starts recording and resolves with the active MediaStream.
   * Accepts an existing stream to share a single getUserMedia capture
   * (e.g. pitch extraction + recorder on the same mic stream).
   */
  startRecording: (existingStream?: MediaStream) => Promise<MediaStream>;
  stopRecording: () => void;
  resetRecording: () => void;
  waveformRef: React.RefObject<HTMLCanvasElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
}

export function useMicrophone(): UseMicrophoneReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const closeAudioContext = useCallback(() => {
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    analyserRef.current = null;
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !waveformCanvasRef.current) return;

    const canvas = waveformCanvasRef.current;
    // Sync intrinsic size to CSS layout size so drawing coords match rendered pixels
    canvas.width = canvas.offsetWidth || 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-container-low').trim() || '#f5f2eb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--teal').trim() || '#1a7a6b';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, []);

  const startRecording = useCallback(async (existingStream?: MediaStream): Promise<MediaStream> => {
    try {
      const stream = existingStream ?? await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Setup audio analysis for waveform
      closeAudioContext();
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the real MediaRecorder MIME (webm/opus, mp4, …), never a fake wav
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stopTracks();
        closeAudioContext();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start duration timer
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Start waveform visualization
      drawWaveform();

      return stream;
    } catch (error) {
      // Leave no dangling capture behind on failure (F4)
      stopTracks();
      closeAudioContext();
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }, [drawWaveform, closeAudioContext, stopTracks]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    stopTracks();
    closeAudioContext();
  }, [stopTracks, closeAudioContext]);

  // Release mic stream, AudioContext, timer and rAF on unmount (F4)
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
    waveformRef: waveformCanvasRef,
    analyserRef,
  };
}
