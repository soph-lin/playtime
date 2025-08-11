// Base interface for all SVG assets
export interface BaseAssetProps {
  size?: number;
  outline?: string;
  fill?: string;
  highlight?: string;
}

// Interface for character assets that have blush/cheek coloring
export interface CharacterAssetProps extends BaseAssetProps {
  blush?: string;
}

// Union type for all possible asset props
export type AssetProps = BaseAssetProps | CharacterAssetProps;

// Default size for all assets (512px base)
export const DEFAULT_ASSET_SIZE = 512;
