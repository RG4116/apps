/// <reference types="vite/client" />

// Declare base64 imports for TTF files
declare module '*.ttf?base64' {
  const content: string
  export default content
}

// Declare URL imports for TTF files
declare module '*.ttf?url' {
  const content: string
  export default content
}
