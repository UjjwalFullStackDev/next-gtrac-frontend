import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Rakshak | On Time, Every Time, For Life",
  description: "Learn more about Rakshak",
};

export default function Home() {
  return (
    redirect("/dashboard")
  );
}
