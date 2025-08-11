import { useMemo } from "react";
import { BaseAssetProps, DEFAULT_ASSET_SIZE } from "@/types/assets";

export function useAssetProps<T extends BaseAssetProps>(props: T, defaultProps: Required<T>) {
  return useMemo(() => {
    const mergedProps = { ...defaultProps, ...props };
    const finalSize = mergedProps.size ?? DEFAULT_ASSET_SIZE;

    return {
      ...mergedProps,
      finalSize,
      // Add any computed values here if needed in the future
    };
  }, [props, defaultProps]);
}
