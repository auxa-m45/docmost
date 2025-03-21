import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

export interface SpotifyEmbedOptions {
  view: any;
  HTMLAttributes: Record<string, any>;
}

export interface SpotifyEmbedAttributes {
  url?: string;        // Regular Spotify URL (https://open.spotify.com/...)
  uri?: string;        // Spotify URI (spotify:track:...)
  embedType?: string;  // 'track', 'album', 'playlist', 'artist' etc.
  embedId?: string;    // Spotify ID part
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    spotifyEmbed: {
      setSpotifyEmbed: (attributes?: SpotifyEmbedAttributes) => ReturnType;
    };
  }
}

export const SpotifyEmbedExtension = Node.create<SpotifyEmbedOptions>({
  name: "spotifyEmbed",
  inline: false,
  group: "block",
  isolating: true,
  atom: true,
  defining: true,
  draggable: true,

  addOptions() {
    return {
      view: null,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      url: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-url"),
        renderHTML: (attributes) => ({ "data-url": attributes.url }),
      },
      uri: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-uri"),
        renderHTML: (attributes) => ({ "data-uri": attributes.uri }),
      },
      embedType: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-embed-type"),
        renderHTML: (attributes) => ({ "data-embed-type": attributes.embedType }),
      },
      embedId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-embed-id"),
        renderHTML: (attributes) => ({ "data-embed-id": attributes.embedId }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const url = HTMLAttributes["data-url"] || "";
    const uri = HTMLAttributes["data-uri"] || "";
    const displayUrl = url || uri || "";
    
    return [
      "div",
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      [
        "a",
        {
          href: displayUrl,
          target: "blank",
        },
        `${displayUrl}`,
      ],
    ];
  },

  addCommands() {
    return {
      setSpotifyEmbed:
        (attrs: SpotifyEmbedAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attrs,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(this.options.view);
  },
});
