import { DEFAULT_ASSET_SIZE } from "@/types/assets";
import { useAssetProps } from "@/hooks/useAssetProps";

// Custom interface for template assets (no highlight required)
interface TemplateAssetProps {
  size?: number;
  outline?: string;
  fill?: string;
}

// Replace 'Template' with your asset name
const defaultProps: Required<TemplateAssetProps> = {
  outline: "#000000", // Replace with your default outline color
  fill: "#ffffff", // Replace with your default fill color
  size: DEFAULT_ASSET_SIZE,
};

// Replace 'Template' with your asset name and extend the appropriate interface
export default function Template(props: TemplateAssetProps) {
  const { outline, fill, finalSize } = useAssetProps(props, defaultProps);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width={`${finalSize}px`}
      height={`${finalSize}px`}
      viewBox="0 0 512 512" // Adjust viewBox to match your SVG's coordinate system
    >
      {/* Replace with your SVG content */}
      <g>
        <path
          fill={outline}
          d="M 0,0 L 512,0 L 512,512 L 0,512 Z" // Replace with your path data
        />
      </g>
      <g>
        <path
          fill={fill}
          d="M 64,64 L 448,64 L 448,448 L 64,448 Z" // Replace with your fill path data
        />
      </g>
    </svg>
  );
}

/*
USAGE PATTERNS:

1. Basic usage:
   <Template />

2. Custom size:
   <Template size={256} />

3. Custom colors:
   <Template outline="#ff0000" fill="#00ff00" />

4. In Sprite component (automatically sized):
   <Sprite characterId="template" size="medium" />

5. In other components:
   <Template size={128} outline="#333" />
*/
