export type SlidePosition = "top" | "center" | "bottom";

export interface Point {
  x: number; // percentage, 0-100
  y: number; // percentage, 0-100
}

export interface Slide {
  id: string;
  reference: string;
  text: string;
  version: string;
}

export type BandWidth = "full" | "fit";
export type TextAlign = "left" | "center" | "right";

export interface ShowStyle {
  fontFamily: "sans" | "serif" | "custom";
  customFontName: string | null; // font-family name registered via FontFace, when fontFamily === "custom"
  customFontData: string | null; // data URL of the imported font file
  fontSize: number; // in vw units
  textColor: string;
  referenceColor: string;
  showOutline: boolean;
  showShadow: boolean;
  versePos: Point;
  referencePos: Point;
  verseTextAlign: TextAlign;
  verseBoxWidth: number; // max-width, percentage of canvas (left/right room)
  referenceBoxWidth: number;
  versePaddingY: number; // extra vertical breathing room, in cqw units (top/bottom room)
  referencePaddingY: number;
  overlayOpacity: number; // 0-90, dims the background video/image
  showReference: boolean;
  fadeTransition: boolean;
  transparentBg: boolean; // no video/gradient, transparent page background (e.g. OBS Browser Source)
  bandEnabled: boolean; // colored/image band behind the verse text
  bandColor: string;
  bandOpacity: number; // 0-100
  bandWidth: BandWidth;
  bandImage: string | null; // data URL
  imagePos: Point; // background image placement, when background is an image
  imageScale: number; // background image width, percentage of canvas width
}

export type BackgroundSource =
  | { type: "videoFile"; name: string }
  | { type: "videoUrl"; url: string }
  | { type: "imageFile"; name: string }
  | { type: "imageUrl"; url: string }
  | { type: "none" };

export interface Show {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  slides: Slide[];
  style: ShowStyle;
  background: BackgroundSource;
}

export interface ServerLiveState {
  show: Show | null;
  slideIndex: number;
  blackout: boolean;
  updatedAt: number;
}

export const defaultStyle: ShowStyle = {
  fontFamily: "serif",
  customFontName: null,
  customFontData: null,
  fontSize: 4.2,
  textColor: "#ffffff",
  referenceColor: "#22d3ee",
  showOutline: true,
  showShadow: true,
  versePos: { x: 50, y: 50 },
  referencePos: { x: 50, y: 88 },
  verseTextAlign: "left",
  verseBoxWidth: 88,
  referenceBoxWidth: 88,
  versePaddingY: 0,
  referencePaddingY: 0,
  overlayOpacity: 45,
  showReference: true,
  fadeTransition: true,
  transparentBg: true,
  bandEnabled: false,
  bandColor: "#000000",
  bandOpacity: 55,
  bandWidth: "fit",
  bandImage: null,
  imagePos: { x: 50, y: 50 },
  imageScale: 100,
};
