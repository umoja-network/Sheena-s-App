
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Upload, Download, MapPin, RefreshCw, X, ChevronRight, Plus } from 'lucide-react';
import { GeoLocationData, ImageState } from './types';
import { getGeocodingInfo } from './services/geminiService';
import { drawTaggedImage } from './utils/imageUtils';

const FIXED_LAT = -26.354340;
const FIXED_LONG = 27.834484;

const App: React.FC = () => {
  const [image, setImage] = useState<ImageState>({ file: null, previewUrl: null, dimensions: null });
  const [location, setLocation] = useState<GeoLocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const updateLocationInfo = useCallback(async () => {
    setIsLoading(true);
    const now = new Date();
    
    // Formatting: 07/01/26 08:42
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const timestamp = `${day}/${month}/${year} ${hours}:${minutes}`;
    const timezone = `UTC+02:00`;

    try {
      const details = await getGeocodingInfo(FIXED_LAT, FIXED_LONG);
      setLocation({
        latitude: FIXED_LAT,
        longitude: FIXED_LONG,
        city: details?.city || 'Lenasia',
        province: details?.province || 'Gauteng',
        country: details?.country || 'South Africa',
        address: details?.full_address || 'Anchorville, , 1827, Gauteng, South Africa',
        timestamp,
        timezone
      });
    } catch (error) {
      setLocation({
        latitude: FIXED_LAT,
        longitude: FIXED_LONG,
        city: 'Lenasia',
        province: 'Gauteng',
        country: 'South Africa',
        address: 'Anchorville, , 1827, Gauteng, South Africa',
        timestamp,
        timezone
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    updateLocationInfo();
  }, [updateLocationInfo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage({ file, previewUrl: url, dimensions: null });
      setFinalImageUrl(null);
    }
  };

  const generateTaggedImage = async () => {
    if (!location || !imgRef.current || !canvasRef.current) return;
    setIsRendering(true);
    try {
      const url = await drawTaggedImage(canvasRef.current, imgRef.current, location);
      setFinalImageUrl(url);
    } catch (err) {
      console.error(err);
      alert("Failed to render image.");
    } finally {
      setIsRendering(false);
    }
  };

  const reset = () => {
    setImage({ file: null, previewUrl: null, dimensions: null });
    setFinalImageUrl(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-xl shadow-blue-500/20">
            <img src="https://thabisot33.github.io/maps/icon.png" className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/1042/1042339.png')} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tagofy <span className="text-blue-400">Cam</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={updateLocationInfo}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Point
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {!image.previewUrl ? (
            <div className="aspect-[4/3] bg-slate-800 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 text-center hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden group">
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="bg-slate-700/50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-blue-400 w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Photo</h3>
              <p className="text-slate-400 text-sm">Professional Geotagging System</p>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 group">
              <img ref={imgRef} src={finalImageUrl || image.previewUrl} alt="Upload preview" className="w-full h-auto block" />
              
              <button onClick={reset} className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 backdrop-blur-md p-2 rounded-full text-white transition-all z-20 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                <X className="w-5 h-5" />
              </button>

              {!finalImageUrl && location && (
                 <div className="absolute inset-x-5 bottom-5 pointer-events-none flex flex-col gap-[2px]">
                    {/* 1. Branding Bubble with Custom Icon */}
                    <div className="bg-black/45 backdrop-blur-md self-start px-3 py-2 rounded-xl flex items-center gap-2 border border-white/5">
                        <div className="w-6 h-6 bg-blue-500/50 rounded-md flex items-center justify-center overflow-hidden">
                           <img src="https://thabisot33.github.io/maps/icon.png" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[12px] text-white font-bold tracking-tight">Tagofy - Geotag Map Camera</span>
                    </div>
                    
                    <div className="flex items-stretch gap-[2px] h-56">
                        {/* 2. Info Bubble */}
                        <div className="flex-1 bg-black/45 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                            <div className="space-y-1.5">
                                <h2 className="text-2xl font-bold text-white leading-tight">
                                    Lenasia, Gauteng, South Afri...
                                </h2>
                                <p className="text-xs text-white/95">{location.address}</p>
                                <p className="text-xs text-white/80 font-medium">Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}</p>
                            </div>
                            <p className="text-xs text-white/80 font-medium">{location.timestamp} {location.timezone}</p>
                        </div>

                        {/* 3. Map Bubble (Satellite) */}
                        <div className="w-56 bg-black/45 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden relative shadow-inner">
                            <img 
                                src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/18/76824/75670" 
                                className="absolute inset-0 w-full h-full object-cover opacity-70"
                                alt="Satellite preview"
                            />
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/40 rounded-full blur-[2px]" />
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-5 flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-white rounded-full opacity-100 shadow-md" />
                                <span className="text-[12px] font-bold text-white">Maps</span>
                            </div>
                        </div>
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="text-blue-500 w-5 h-5" />
              Tagofy Editor
            </h2>

            {location ? (
              <div className="space-y-4">
                <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-inner">
                   <p className="text-white font-bold text-lg">Lenasia, Anchorville</p>
                   <p className="text-sm text-slate-400 mt-1">Satellite Mapping: Active</p>
                   <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500 font-mono">
                     <span>{location.latitude}</span>
                     <span>{location.longitude}</span>
                   </div>
                </div>
                
                {image.previewUrl && !finalImageUrl && (
                  <button onClick={generateTaggedImage} disabled={isRendering} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 text-lg">
                    {isRendering ? <RefreshCw className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                    Apply Watermark
                  </button>
                )}

                {finalImageUrl && (
                   <div className="space-y-3">
                      <a href={finalImageUrl} download={`tagofy_photo_${Date.now()}.jpg`} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 text-lg">
                        <Download className="w-6 h-6" />
                        Download JPG
                      </a>
                      
                      <button onClick={reset} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3">
                        <Plus className="w-5 h-5" />
                        Upload Another Photo
                      </button>
                   </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 italic flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <p>Establishing Satellite Connection...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <canvas ref={canvasRef} className="hidden" />
      
      <footer className="mt-auto py-10 text-slate-600 text-xs font-medium tracking-wide">
        &copy; 2024 TAGOFY CAM. POWERED BY ESRI WORLD IMAGERY.
      </footer>
    </div>
  );
};

export default App;
