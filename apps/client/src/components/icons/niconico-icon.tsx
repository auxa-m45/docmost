import { rem } from "@mantine/core";

interface Props {
  size?: number | string;
}

export function NicovideoIcon({ size }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="#252525"
      style={{ width: rem(size), height: rem(size) }}
    >
      <g id="g4">
        <path
          id="path851"
          className="st0"
          d="M25.6,8.6h-6.9l2.9-2.7c0.4-0.4,0.5-1,0.1-1.4c-0.4-0.4-1-0.5-1.4-0.1l-4.4,4.2l-4.4-4.2
		c-0.4-0.4-1-0.4-1.4,0.1c-0.4,0.4-0.4,1,0.1,1.4l2.9,2.7H6.1c-1.2,0-2.2,1-2.2,2.2v12.9c0,1.2,1,2.2,2.2,2.2h2.7l1.6,1.9
		c0.3,0.3,0.7,0.3,1,0l1.6-1.9h5.9l1.6,1.9c0.3,0.3,0.7,0.3,1,0l1.6-1.9h2.7c1.2,0,2.2-1,2.2-2.2V10.8c0-1.2-1-2.2-2.2-2.2"
        />
      </g>
    </svg>
  );
}
