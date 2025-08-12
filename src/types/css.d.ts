import "react";

declare module "react" {
  interface CSSProperties {
    "--outline-color"?: string;
  }
}

declare module "*.css" {
  const content: string;
  export default content;
}
