import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFileUrl } from "@/lib/config";
import { ActionIcon, Box, Group, Paper, Progress, Slider, Space, Text, Tooltip, Loader } from "@mantine/core";
import { IconPlayerPause, IconPlayerPlay, IconVolume, IconVolume2, IconVolume3, IconVolumeOff, IconDownload } from "@tabler/icons-react";
import classes from "./audio-view.module.css";

export default function AudioView(props: NodeViewProps) {
  const { node, selected } = props;
  const { src, align, attachmentId, previewUrl, workerStatus } = node.attrs;
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const audioSource = useMemo(() => {
    if (previewUrl && workerStatus === 'done') {
      return previewUrl;
    }
    return src;
  }, [src, previewUrl, workerStatus]);
  
  const prevWorkerStatusRef = useRef(workerStatus);
  const prevSrcRef = useRef(src);
  const prevPreviewUrlRef = useRef(previewUrl);

  useEffect(() => {
    const workerStatusChanged = prevWorkerStatusRef.current !== workerStatus;
    const srcChanged = prevSrcRef.current !== src;
    const previewUrlChanged = prevPreviewUrlRef.current !== previewUrl;
    
    // ステータスが変わったことを記録
    prevWorkerStatusRef.current = workerStatus;
    prevSrcRef.current = src;
    prevPreviewUrlRef.current = previewUrl;
    
    // 関連する属性のいずれかが変更された場合
    if (workerStatusChanged || srcChanged || previewUrlChanged) {
      // ステータスがリセットされた場合、エラーもリセット
      if (workerStatusChanged) {
        setError(null);
      }
      
      // オーディオソースの更新が必要な場合は更新
      if (audioRef.current && audioRef.current.src !== audioSource) {
        audioRef.current.src = audioSource;
        setLoadingState('loading');
      }
    }
  }, [workerStatus, src, previewUrl, audioSource]);

  const alignClass = useMemo(() => {
    if (align === "left") return "alignLeft";
    if (align === "right") return "alignRight";
    if (align === "center") return "alignCenter";
    return "alignCenter";
  }, [align]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderProcessingIndicator = () => {
    if (workerStatus !== 'pending' && workerStatus !== 'converting') {
      return null;
    }
    
    return (
      <Box 
        className={alignClass} 
        style={{ 
          maxWidth: '480px',
          width: '100%',
        }}
        data-selected={selected}
      >
        <Paper p="xs" withBorder>
          <div className={classes.processingContainer}>
            <Loader size="sm" />
            <Text color="dimmed" className={classes.processingText}>
              {workerStatus === 'pending' ? '音声ファイルをアップロードしています...' : '音声ファイルを最適化しています...'}
            </Text>
          </div>
        </Paper>
      </Box>
    );
  };

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleVolumeClick = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const handleVolumeChange = useCallback((value: number) => {
    if (audioRef.current) {
      audioRef.current.volume = value;
      setVolume(value);
      if (value > 0 && isMuted) {
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration && progressRef.current) {
      // Use progressRef.current to reference the Progress element specific to this component
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setProgress(percentage * 100);
    }
  }, [duration]);

  const handleDownload = useCallback(() => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.setAttribute('download', src.split('/').pop() || 'audio');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    const handleCanPlay = () => {
      setLoadingState('ready');
    };
    
    const handleError = () => {
      setLoadingState('error');
      setError('オーディオファイルの読み込みに失敗しました');
      
      // Fallback to the original source if the preview URL fails to load
      if (audioSource !== src && audioRef.current) {
        audioRef.current.src = src;
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <NodeViewWrapper>
      {workerStatus === 'pending' || workerStatus === 'converting' ? (
        renderProcessingIndicator()
      ) : (
        <Box 
          className={alignClass} 
          style={{ 
            maxWidth: '480px',
            width: '100%',
          }} 
          data-selected={selected}
        >
          <Paper p="xs" withBorder>
            <audio
              ref={audioRef}
              preload="metadata"
              src={audioSource}
              style={{ display: 'none' }}
            >
              <track kind="captions" src="" />
            </audio>
            {error ? (
              <Text color="red" size="sm">{error}</Text>
            ) : (
              <>
                <Group justify="space-between" mb="sm">
                  <Group gap="xs">
                    <Tooltip label={isPlaying ? "一時停止" : "再生"}>
                      <ActionIcon
                        onClick={handlePlayPause}
                        variant="light"
                        aria-label={isPlaying ? "一時停止" : "再生"}
                      >
                        {isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                      </ActionIcon>
                    </Tooltip>
                    <Group gap="xs" align="center">
                      <Tooltip label={isMuted ? "ミュート解除" : "ミュート"}>
                        <ActionIcon
                          onClick={handleVolumeClick}
                          variant="light"
                          aria-label={isMuted ? "ミュート解除" : "ミュート"}
                        >
                          {isMuted ? (
                            <IconVolumeOff size={16} />
                          ) : volume > 0.60 ? (
                            <IconVolume size={16} />
                          ) : volume > 0.05 ? (
                            <IconVolume2 size={16} />
                          ) :  (<IconVolume3 size={16} />)}
                        </ActionIcon>
                      </Tooltip>
                      <Box w={100}>
                        <Slider
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          min={0}
                          max={1}
                          step={0.01}
                          size="xs"
                          aria-label="音量調整"
                        />
                      </Box>
                    </Group>
                    <Text size="sm" color="dimmed">
                      {audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"} / {formatTime(duration)}
                    </Text>
                  </Group>
                  <Space />
                  <Tooltip label="ダウンロード">
                    <ActionIcon
                      onClick={handleDownload}
                      variant="light"
                      aria-label="ダウンロード"
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <Progress
                  ref={progressRef}
                  value={progress}
                  onClick={handleProgressClick}
                  size="sm"
                  radius="xl"
                  style={{ cursor: "pointer" }}
                  aria-label="オーディオの進行状況"
                  role="slider"
                  transitionDuration={200}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  mb="xs"
                />
              </>
            )}
          </Paper>
        </Box>
      )}
    </NodeViewWrapper>
  );
}