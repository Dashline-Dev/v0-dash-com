"use client"

import { APIProvider } from "@vis.gl/react-google-maps"

interface GoogleMapsProviderProps {
  children: React.ReactNode
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return <>{children}</>
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places", "marker"]}>
      {children}
    </APIProvider>
  )
}
