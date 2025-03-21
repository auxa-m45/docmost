import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { 
  Card, 
  AspectRatio, 
  Text,
  ActionIcon,
  Popover,
  Button,
  TextInput,
  Group,
  FocusTrap
} from '@mantine/core';
import clsx from 'clsx';
import { IconBrandSpotify } from '@tabler/icons-react';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import i18n from 'i18next';

// Direct iframe creation function
function createDirectIframe(container, spotifyUri) {
  // Extract the proper ID and type from the URI
  const parts = spotifyUri.split(':');
  if (parts.length !== 3) return false;
  
  const embedType = parts[1]; // e.g., 'track', 'album', 'playlist'
  const embedId = parts[2];   // The ID
  
  // Create the iframe directly
  const iframe = document.createElement('iframe');
  iframe.style.borderRadius = '12px';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  iframe.title = 'Spotify Embed';
  iframe.loading = 'lazy';
  
  // Set the appropriate source URL
  iframe.src = `https://open.spotify.com/embed/${embedType}/${embedId}?utm_source=generator`;
  
  // Clear the container and append the iframe
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(iframe);
  
  return true;
}

const schema = z.object({
  url: z
    .string()
    .trim()
    .regex(
      /spotify\.com(?:\/[^/]+)*\/([^/]+)\/([a-zA-Z0-9]+)/,
      { message: i18n.t("Please enter a valid Spotify URL") }
    )
});

export default function SpotifyView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, selected } = props;
  const { url, uri, embedType, embedId } = node.attrs;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Calculate Spotify URI
  const spotifyUri = useMemo(() => {
    // Use URI if available
    if (uri) return uri;
    
    // Build URI from URL
    if (url) {
      const regex = /spotify\.com(?:\/[^/]+)*\/([^/]+)\/([a-zA-Z0-9]+)/;
      const match = url.match(regex);
      if (match) {
        return `spotify:${match[1]}:${match[2]}`;
      }
    }
    
    // Build URI from embedType and embedId
    if (embedType && embedId) {
      return `spotify:${embedType}:${embedId}`;
    }
    
    return null;
  }, [uri, url, embedType, embedId]);

  // Check if we have valid Spotify embed information
  const isValid = useMemo(() => {
    return !!spotifyUri;
  }, [spotifyUri]);

  // Create the embed
  useEffect(() => {
    if (!isValid || !containerRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    // Simply use the direct iframe approach
    const success = createDirectIframe(containerRef.current, spotifyUri);
    
    if (success) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setError(new Error("Failed to create Spotify embed"));
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [isValid, spotifyUri]);

  const spotifyForm = useForm<{ url: string }>({
    initialValues: {
      url: url || '',
    },
    validate: zodResolver(schema),
  });

  async function onSubmit(data: { url: string }) {
    try {
      // Extract embedding information from URL
      const regex = /spotify\.com(?:\/[^/]+)*\/([^/]+)\/([a-zA-Z0-9]+)/;
      const match = data.url.match(regex);
      
      if (match) {
        const newEmbedType = match[1];
        const newEmbedId = match[2];
        const newUri = `spotify:${newEmbedType}:${newEmbedId}`;
        
        updateAttributes({
          url: data.url,
          uri: newUri,
          embedType: newEmbedType,
          embedId: newEmbedId
        });
        
        setIsEditing(false);
      } else {
        notifications.show({
          message: t("Invalid Spotify link"),
          position: "top-right",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        message: t("Failed to embed Spotify content"),
        position: "top-right",
        color: "red",
      });
    }
  }

  return (
    <NodeViewWrapper className="spotify-embed">
      {isValid ? (
        <div className={clsx("spotify-embed-container", selected ? "ProseMirror-selectednode" : "")}>
          <AspectRatio ratio={4 / 1}>
            <div 
              ref={containerRef} 
              className="spotify-iframe-container"
              style={{ width: '100%', height: '100%' }}
            >
              {isLoading && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  backgroundColor: '#f0f0f0'
                }}>
                  <Text>Loading Spotify content...</Text>
                </div>
              )}
              
              {error && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  backgroundColor: '#fff0f0',
                  padding: '10px'
                }}>
                  <Text mb="xs" color="red">Failed to load Spotify content</Text>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    color="red" 
                    mt="sm"
                    onClick={() => {
                      setIsLoading(true);
                      setError(null);
                      setTimeout(() => {
                        if (containerRef.current) {
                          createDirectIframe(containerRef.current, spotifyUri);
                        }
                        setIsLoading(false);
                      }, 500);
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </AspectRatio>
        </div>
      ) : (
        <Popover 
          width={300} 
          position="bottom" 
          withArrow 
          shadow="md"
          opened={isEditing}
          onChange={setIsEditing}
        >
          <Popover.Target>
            <Card
              radius="md"
              p="xs"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              withBorder
              className={clsx(selected ? "ProseMirror-selectednode" : "")}
              onClick={() => setIsEditing(true)}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <ActionIcon variant="transparent" color="gray">
                  <IconBrandSpotify size={18} />
                </ActionIcon>

                <Text component="span" size="lg" c="dimmed">
                  {t("Embed Spotify")}
                </Text>
              </div>
            </Card>
          </Popover.Target>
          <Popover.Dropdown bg="var(--mantine-color-body)">
            <form onSubmit={spotifyForm.onSubmit(onSubmit)}>
              <FocusTrap active={true}>
                <TextInput
                  placeholder={t("Enter Spotify link to embed")}
                  key={spotifyForm.key("url")}
                  {...spotifyForm.getInputProps("url")}
                  data-autofocus
                />
              </FocusTrap>

              <Group justify="center" mt="xs">
                <Button type="submit">{t("Embed Spotify")}</Button>
              </Group>
            </form>
          </Popover.Dropdown>
        </Popover>
      )}
    </NodeViewWrapper>
  );
}