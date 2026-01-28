/**
 * Geolocation Service
 * Handles capturing and reverse geocoding GPS coordinates
 */

import { GeoLocation } from '@shared/types';
import { logger } from './logger';

/**
 * Get current geolocation
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Promise<GeoLocation | null>
 */
export async function getCurrentLocation(timeoutMs: number = 10000): Promise<GeoLocation | null> {
  if (!navigator.geolocation) {
    logger.error('Geolocation not supported', undefined, { component: 'Geolocation' });
    return null;
  }

  return new Promise((resolve) => {
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 60000, // Cache for 1 minute
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: GeoLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Try to get address via reverse geocoding (optional, non-blocking)
        try {
          const address = await reverseGeocode(location.lat, location.lng);
          if (address) {
            location.address = address;
          }
        } catch (error) {
          // Silently fail - address is optional
          logger.error('Reverse geocoding failed', error as Error, { component: 'Geolocation' });
        }

        logger.activeSession('Location captured successfully', {
          lat: location.lat,
          lng: location.lng,
          hasAddress: !!location.address,
        });

        resolve(location);
      },
      (error) => {
        // Handle errors gracefully - don't block meeting start
        logger.error('Geolocation error', error, {
          component: 'Geolocation',
          code: error.code,
          message: error.message,
        });
        resolve(null);
      },
      options
    );
  });
}

/**
 * Reverse geocode coordinates to get address
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AI-Remote-Work-App/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.address) {
      // Build readable address from components
      const parts: string[] = [];
      if (data.address.road) parts.push(data.address.road);
      if (data.address.city || data.address.town || data.address.village) {
        parts.push(data.address.city || data.address.town || data.address.village);
      }
      if (data.address.state) parts.push(data.address.state);
      if (data.address.country) parts.push(data.address.country);

      return parts.length > 0 ? parts.join(', ') : null;
    }

    return null;
  } catch (error) {
    return null;
  }
}
