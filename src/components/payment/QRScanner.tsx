import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, X, QrCode } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  // Simulate QR scan after 3 seconds of camera being on
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        // Simulate successful scan
        const simulatedData = JSON.stringify({
          userId: "demo-user-id",
          walletAddress: "RLX" + Math.random().toString(36).substring(2, 15).toUpperCase(),
          timestamp: Date.now(),
        });
        stopCamera();
        onScan(simulatedData);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isScanning, onScan]);

  return (
    <Card className="w-full max-w-md mx-auto animate-scale-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Scan QR Code
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isScanning ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-square object-cover rounded-lg bg-muted"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse" />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2 animate-pulse">
              Scanning for QR code...
            </p>
            <Button 
              variant="outline" 
              onClick={stopCamera} 
              className="w-full mt-2"
            >
              Cancel Scan
            </Button>
          </div>
        ) : (
          <>
            <Button 
              onClick={startCamera} 
              className="w-full bg-primary hover:bg-primary/90 btn-hover"
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Camera Scan
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or enter manually
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualCode">Wallet Address / Code</Label>
              <Input
                id="manualCode"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter citizen wallet address"
                className="font-mono"
              />
            </div>

            <Button 
              onClick={handleManualSubmit} 
              variant="outline"
              className="w-full btn-hover"
              disabled={!manualCode.trim()}
            >
              Submit Code
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
