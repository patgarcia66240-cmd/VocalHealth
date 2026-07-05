import { useState, useRef } from "react";
import { Upload, Camera, Download, Loader } from "lucide-react";
import Drawer from "./Drawer";

interface ExtractedRecord {
  timestamp: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  spo2?: number;
  notes?: string;
}

interface ScanOCRDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecords?: (records: ExtractedRecord[]) => void;
}

type AiVisionProvider = "gemini" | "openai" | "mistral";

const MAX_ENHANCED_IMAGE_SIDE = 1800;

function loadImage(imageData: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger l'image à améliorer."));
    image.src = imageData;
  });
}

async function enhanceImageForAi(imageData: string): Promise<string> {
  const image = await loadImage(imageData);
  const scale = Math.min(
    MAX_ENHANCED_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
    2
  );
  const width = Math.max(1, Math.round(image.naturalWidth * Math.max(scale, 1)));
  const height = Math.max(1, Math.round(image.naturalHeight * Math.max(scale, 1)));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return imageData;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.filter = "contrast(1.18) brightness(1.04) saturate(0.9)";
  context.drawImage(image, 0, 0, width, height);

  const imagePixels = context.getImageData(0, 0, width, height);
  const source = imagePixels.data;
  const sharpened = new Uint8ClampedArray(source);
  const strength = 0.45;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel++) {
        const current = source[index + channel];
        const average =
          (source[index - 4 + channel] +
            source[index + 4 + channel] +
            source[index - width * 4 + channel] +
            source[index + width * 4 + channel]) /
          4;

        sharpened[index + channel] = Math.max(0, Math.min(255, current + (current - average) * strength));
      }
    }
  }

  imagePixels.data.set(sharpened);
  context.putImageData(imagePixels, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function ScanOCRDrawer({ isOpen, onClose, onImportRecords }: ScanOCRDrawerProps) {
  const [mode, setMode] = useState<"select" | "camera" | "upload" | "processing" | "result">("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecord[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AiVisionProvider>(() => {
    const saved = localStorage.getItem("vocalhealth_vision_provider");
    if (saved === "gemini" || saved === "openai" || saved === "mistral") {
      return saved;
    }
    return "gemini";
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Démarre la caméra
  const startCamera = async () => {
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Erreur accès caméra :", error);
      alert("Impossible d'accéder à la caméra");
      setMode("select");
    }
  };

  // Capture photo depuis la caméra
  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        // Arrêter la caméra
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setMode("processing");
        const enhancedImageData = await enhanceImageForAi(imageData);
        setCapturedImage(enhancedImageData);
        processImage(enhancedImageData);
      }
    }
  };

  // Gère l'upload d'image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        setMode("processing");
        const enhancedImageData = await enhanceImageForAi(imageData);
        setCapturedImage(enhancedImageData);
        processImage(enhancedImageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Traite l'image avec l'IA vision côté serveur
  const processImage = async (imageData: string) => {
    try {
      const analysisTimestamp = new Date().toISOString();
      const response = await fetch("/api/parse-measurements-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, provider: selectedProvider, analysisTimestamp })
      });

      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : null;
      if (!response.ok || !result.success) {
        throw new Error(
          result?.error ||
            "Route d'analyse IA indisponible. Redémarrez le serveur de développement pour charger la nouvelle API."
        );
      }

      setExtractedText(result.extractedText || "Analyse IA terminée.");
      setExtractedRecords(result.records || []);
      setMode("result");
    } catch (error) {
      console.error("Erreur analyse IA image :", error);
      alert(error instanceof Error ? error.message : "Erreur lors de l'analyse du document");
      setMode("select");
    }
  };

  // Exporte en CSV
  const exportCSV = () => {
    if (extractedRecords.length === 0) {
      alert("Aucune mesure trouvée");
      return;
    }

    const headers = ["timestamp", "systolic", "diastolic", "pulse", "spo2"];
    const rows = extractedRecords.map(r => [
      r.timestamp,
      r.systolic,
      r.diastolic,
      r.pulse || "",
      r.spo2 || ""
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan-ia-${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importe les records extraits
  const handleImport = () => {
    if (onImportRecords) {
      onImportRecords(extractedRecords);
      alert(`${extractedRecords.length} mesure(s) importée(s)`);
      onClose();
    }
  };

  const handleClose = () => {
    // Arrêter la caméra si active
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setMode("select");
    setCapturedImage(null);
    setExtractedText("");
    setExtractedRecords([]);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Scan IA - Importer des mesures">
      <div className="p-4 space-y-4">
        {/* Mode Sélection */}
        {mode === "select" && (
          <div className="space-y-3">
            <p className="text-sm text-natural-secondary">
              Scannez un document ou une photo contenant vos mesures de tension. L'IA lit l'image et extrait les valeurs automatiquement.
            </p>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-natural-secondary">Moteur d'analyse image</span>
              <select
                value={selectedProvider}
                onChange={(e) => {
                  const provider = e.target.value as AiVisionProvider;
                  setSelectedProvider(provider);
                  localStorage.setItem("vocalhealth_vision_provider", provider);
                }}
                className="h-11 w-full rounded-2xl border border-natural-border/60 bg-natural-card px-3 text-sm font-bold text-natural-dark outline-none transition-all focus:border-natural-primary focus:ring-2 focus:ring-natural-primary/15"
              >
                <option value="gemini">Gemini Vision</option>
                <option value="openai">OpenAI Vision</option>
                <option value="mistral">Mistral Vision</option>
              </select>
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startCamera}
                className="flex flex-col items-center gap-2 p-4 border-2 border-natural-border rounded-lg hover:bg-natural-primary/5 transition-colors"
              >
                <Camera className="h-6 w-6 text-natural-primary" />
                <span className="text-sm font-medium">Caméra</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 border-2 border-natural-border rounded-lg hover:bg-natural-primary/5 transition-colors"
              >
                <Upload className="h-6 w-6 text-natural-primary" />
                <span className="text-sm font-medium">Importer</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Mode Caméra */}
        {mode === "camera" && (
          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <canvas ref={canvasRef} className="hidden" width={640} height={480} />
            
            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                className="flex-1 py-2 px-3 bg-natural-primary text-white rounded-lg font-medium hover:bg-natural-primary/90 transition-colors"
              >
                Capturer
              </button>
              <button
                onClick={() => {
                  if (videoRef.current?.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                  }
                  setMode("select");
                }}
                className="flex-1 py-2 px-3 border border-natural-border rounded-lg font-medium hover:bg-natural-primary/5 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Mode Traitement */}
        {mode === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader className="h-8 w-8 text-natural-primary animate-spin" />
            <p className="text-sm text-natural-secondary">Amélioration de l'image puis analyse IA...</p>
          </div>
        )}

        {/* Mode Résultat */}
        {mode === "result" && (
          <div className="space-y-4">
            {capturedImage && (
              <img src={capturedImage} alt="Scanned" className="w-full rounded-lg" />
            )}

            <div className="bg-natural-bg rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-xs text-natural-secondary whitespace-pre-wrap font-mono">
                {extractedText}
              </p>
            </div>

            {extractedRecords.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-natural-primary/5 border border-natural-primary/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-natural-primary">
                    ✓ {extractedRecords.length} mesure(s) détectée(s)
                  </p>
                  {extractedRecords.map((record, i) => (
                    <div key={i} className="text-xs text-natural-secondary mt-2">
                      <p>Tension : {record.systolic}/{record.diastolic} mmHg</p>
                      {record.pulse && <p>Pouls : {record.pulse} bpm</p>}
                      {record.spo2 && <p>SpO₂ : {record.spo2}%</p>}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleImport}
                    className="flex-1 py-2 px-3 bg-natural-primary text-white rounded-lg font-medium hover:bg-natural-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Importer
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex-1 py-2 px-3 border border-natural-border rounded-lg font-medium hover:bg-natural-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exporter CSV
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <p className="text-sm text-rose-700 font-medium">
                  ⚠️ Aucune mesure trouvée. Vérifiez que le document est lisible.
                </p>
              </div>
            )}

            <button
              onClick={() => setMode("select")}
              className="w-full py-2 px-3 border border-natural-border rounded-lg font-medium hover:bg-natural-primary/5 transition-colors"
            >
              Essayer une autre image
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
