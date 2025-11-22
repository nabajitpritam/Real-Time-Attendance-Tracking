import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import jsQR from 'jsqr';

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let animationId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }, // Better support for iOS + Android
          },
          audio: false, // Needed for autoplay policies
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true; // Required for autoplay on mobile
          await videoRef.current.play().catch(() => {}); // Prevent autoplay rejection
          setScanning(true);
          setError(null);
          scan();
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please use manual entry or check permissions.');
      }
    };

    const scan = () => {
      if (videoRef.current && canvasRef.current && scanning) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
              onScan(code.data);
              stopCamera();
              return;
            }
          }
        }

        animationId = requestAnimationFrame(scan);
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      setScanning(false);
    };

    startCamera(); // <- REQUIRED FIX

    return () => {
      stopCamera();
    };
  }, [onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="space-y-4">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-square">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover z-10"
              playsInline
              autoPlay
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4">
                <p className="text-white text-center">{error}</p>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-64 h-64 border-4 border-white border-opacity-50 rounded-lg">
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600">Position the QR code within the frame</p>
        </TabsContent>

        <TabsContent value="manual">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Enter QR Code Data</Label>
              <Input
                id="code"
                placeholder="Paste QR code data here"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <p className="text-gray-500">For demo: Copy the session data from the teacher's QR code</p>
            </div>
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <Button variant="outline" onClick={onClose} className="w-full">
        Cancel
      </Button>
    </div>
  );
}
