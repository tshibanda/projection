export type SlidePosition = "top" | "center" | "bottom";

export interface Slide {
  id: string;
  reference: string;
  text: string;
  version: string;
}

export type BandWidth = "full" | "fit";

export interface ShowStyle {
  fontFamily: "sans" | "serif";
  fontSize: number; // in vw units
  textColor: string;
  showOutline: boolean;
  showShadow: boolean;
  versePosition: SlidePosition;
  referencePosition: SlidePosition;
  overlayOpacity: number; // 0-90, dims the background video/image
  showReference: boolean;
  fadeTransition: boolean;
  transparentBg: boolean; // no video/gradient, transparent page background (e.g. OBS Browser Source)
  bandEnabled: boolean; // colored/image band behind the verse text
  bandColor: string;
  bandOpacity: number; // 0-100
  bandWidth: BandWidth;
  bandImage: string | null; // data URL
}

export type VideoSource =
  | { type: "file"; name: string }
  | { type: "url"; url: string }
  | { type: "none" };

export interface Show {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  slides: Slide[];
  style: ShowStyle;
  video: VideoSource;
}

export interface ServerLiveState {
  show: Show | null;
  slideIndex: number;
  blackout: boolean;
  updatedAt: number;
}

export const defaultStyle: ShowStyle = {
  fontFamily: "serif",
  fontSize: 4.2,
  textColor: "#ffffff",
  showOutline: true,
  showShadow: true,
  versePosition: "center",
  referencePosition: "bottom",
  overlayOpacity: 45,
  showReference: true,
  fadeTransition: true,
  transparentBg: true,
  bandEnabled: false,
  bandColor: "#000000",
  bandOpacity: 55,
  bandWidth: "fit",
  bandImage: null,
};
