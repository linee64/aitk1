interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

declare module '*.geojson' {
  const value: Record<string, unknown>;
  export default value;
}