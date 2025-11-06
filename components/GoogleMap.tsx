import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon } from './icons/XIcon';

// Assume GOOGLE_MAPS_API_KEY is available in the environment, similar to the Gemini API_KEY.
const GOOGLE_MAPS_API_KEY = "AIzaSyDxl-AMHUtgszJU7ASnDscV-RA4iY-4TbU";

if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API Key is not configured. The map will not load.");
}

// Fix: Declare google on the window object to satisfy TypeScript, as types are not available.
declare global {
    interface Window {
        google: any;
    }
}

const NYC_CENTER = { lat: 40.7128, lng: -74.0060 };
const DEFAULT_ZOOM = 12;

// Utility to load the Google Maps script
const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            return resolve();
        }

        const existingScript = document.getElementById('google-maps-script');
        if (existingScript) {
             existingScript.addEventListener('load', () => resolve());
             existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')));
             return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker,places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps script.'));
        document.head.appendChild(script);
    });
};

interface GoogleMapProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    onClose: () => void;
    initialLocation: { lat: number; lng: number } | null;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({ onLocationSelect, onClose, initialLocation }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    // Fix: Use 'any' for map instance ref since google.maps types are not available.
    const mapInstanceRef = useRef<any | null>(null);
    // Fix: Use 'any' for marker instance ref since google.maps types are not available.
    const markerInstanceRef = useRef<any | null>(null);

    const [isScriptLoaded, setIsScriptLoaded] = useState(window.google && window.google.maps ? true : false);
    const [scriptError, setScriptError] = useState<string | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(initialLocation);
    
    const [latInput, setLatInput] = useState(initialLocation ? initialLocation.lat.toString() : '');
    const [lngInput, setLngInput] = useState(initialLocation ? initialLocation.lng.toString() : '');

    useEffect(() => {
        if(!GOOGLE_MAPS_API_KEY) {
            setScriptError("Google Maps API Key is not configured.");
            return;
        }
        loadGoogleMapsScript()
            .then(() => setIsScriptLoaded(true))
            .catch(err => setScriptError(err.message));
    }, []);

    const updateMarkerPosition = useCallback((coords: { lat: number; lng: number } | null) => {
        if (!mapInstanceRef.current || !window.google) return;
        
        if (coords) {
            if (markerInstanceRef.current) {
                markerInstanceRef.current.position = coords;
            } else {
                 markerInstanceRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                    position: coords,
                    map: mapInstanceRef.current,
                });
            }
            setSelectedCoords(coords);
            setLatInput(coords.lat.toFixed(6));
            setLngInput(coords.lng.toFixed(6));
        } else {
            if (markerInstanceRef.current) {
                markerInstanceRef.current.map = null;
                markerInstanceRef.current = null;
            }
            setSelectedCoords(null);
            setLatInput('');
            setLngInput('');
        }
    }, []);

    useEffect(() => {
        if (!isScriptLoaded || !mapRef.current) return;

        const initMap = async () => {
             // Fix: Use window.google to access maps library and remove unknown type cast.
             const { Map } = await window.google.maps.importLibrary("maps");
             // Fix: Use window.google to access marker library and remove unknown type cast.
             const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

            const map = new Map(mapRef.current!, {
                center: initialLocation || NYC_CENTER,
                zoom: DEFAULT_ZOOM,
                mapId: 'NYC_COMMUNITY_MAP', // Required for advanced markers
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            });
            mapInstanceRef.current = map;

            if (initialLocation) {
                 if (markerInstanceRef.current) {
                    markerInstanceRef.current.position = initialLocation;
                } else {
                    markerInstanceRef.current = new AdvancedMarkerElement({
                        position: initialLocation,
                        map: mapInstanceRef.current,
                    });
                }
            }

            // Fix: Use 'any' for event type as google.maps types are not available.
            map.addListener('click', (e: any) => {
                if (e.latLng) {
                    const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                    updateMarkerPosition(coords);
                }
            });
        }
        initMap();

    }, [isScriptLoaded, initialLocation, updateMarkerPosition]);


    const handleSetFromCoordinates = () => {
        const lat = parseFloat(latInput);
        const lng = parseFloat(lngInput);

        if (!isNaN(lat) && !isNaN(lng)) {
            const newCoords = { lat, lng };
            updateMarkerPosition(newCoords);
            if(mapInstanceRef.current) {
                mapInstanceRef.current.panTo(newCoords);
                mapInstanceRef.current.setZoom(15);
            }
        } else {
            alert('Please enter valid numeric latitude and longitude.');
        }
    };

    const handleConfirm = () => {
        if (selectedCoords) {
            onLocationSelect(selectedCoords);
        }
        onClose();
    };
    
    if (scriptError) {
        return (
             <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-semibold text-red-400">Map Error</h3>
                    <p className="text-slate-300 mt-2">{scriptError}</p>
                     <p className="text-slate-400 text-sm mt-1">Please check your internet connection or API key configuration.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-600 rounded-md">Close</button>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700 transform transition-all animate-slide-up flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-white">Pinpoint the Issue Location</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:bg-slate-700 transition-colors"
                        aria-label="Close map"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-4">
                    <p className="text-sm text-slate-400 mb-4 text-center">
                        Click the map to place a pin, or enter coordinates below.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                        <input
                            type="number"
                            step="0.000001"
                            value={latInput}
                            onChange={(e) => setLatInput(e.target.value)}
                            placeholder="Latitude (e.g., 40.7128)"
                            aria-label="Latitude"
                            className="w-full sm:w-1/2 bg-slate-700 text-white placeholder-slate-400 rounded-md px-3 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                        />
                        <input
                            type="number"
                            step="0.000001"
                            value={lngInput}
                            onChange={(e) => setLngInput(e.target.value)}
                            placeholder="Longitude (e.g., -74.0060)"
                            aria-label="Longitude"
                            className="w-full sm:w-1/2 bg-slate-700 text-white placeholder-slate-400 rounded-md px-3 py-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                        />
                        <button
                            onClick={handleSetFromCoordinates}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-700 transition-colors flex-shrink-0"
                        >
                            Set
                        </button>
                    </div>
                    <div
                        ref={mapRef}
                        className="w-full aspect-[16/10] bg-slate-900 rounded-md border border-slate-600"
                    >
                       {(!isScriptLoaded && !scriptError) && <div className="flex items-center justify-center h-full text-slate-400">Loading Map...</div>}
                    </div>
                </main>

                <footer className="bg-slate-800/50 border-t border-slate-700 px-6 py-4 rounded-b-lg flex justify-end items-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedCoords}
                        className="px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-500"
                    >
                        Confirm Location
                    </button>
                </footer>
            </div>
        </div>
    );
};
