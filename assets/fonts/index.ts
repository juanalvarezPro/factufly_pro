import { Roboto, Poppins } from "next/font/google";

export const fontSans = Roboto({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700", "900"],
})

export const fontUrban = Poppins({
  subsets: ["latin"],
  variable: "--font-urban",
  weight: ["400", "500", "600", "700", "900"],
})
