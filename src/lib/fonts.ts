import localFont from "next/font/local";

export const fontBestermind = localFont({
  src: "../fonts/Bestermind.ttf.ttf",
  variable: "--font-bestermind",
  display: "swap",
});

export const fontAleo = localFont({
  src: [
    { path: "../fonts/Aleo-Regular.ttf.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Aleo-Italic.ttf.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-aleo",
  display: "swap",
});

export const fontTimeburner = localFont({
  src: "../fonts/Timeburner.ttf.ttf",
  variable: "--font-timeburner",
  display: "swap",
});
