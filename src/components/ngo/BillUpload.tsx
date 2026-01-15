import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Eye
} from "lucide-react";

interface BillUploadProps {
  transactionId?: string;
  amount: number;
  onValidationComplete?: (result: ValidationResult) => void;
}

interface ValidationResult {
  isValid: boolean;
  status: "pending" | "valid" | "invalid" | "requires_review";
  confidenceScore: number;
  notes: string;
}

export function BillUpload({ transactionId, amount, onValidationComplete }: BillUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload JPG, PNG, WebP, or PDF.");
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10MB.");
        return;
      }

      setSelectedFile(file);
      setValidationResult(null);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const uploadAndValidate = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get NGO ID
      const { data: ngo } = await supabase
        .from("ngos")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ngo) {
        toast.error("NGO profile not found");
        return;
      }

      // Upload file to storage
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `${user.id}/${fileName}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("ngo-bills")
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload file");
        return;
      }

      setUploadProgress(60);

      // Get signed URL for AI validation
      const { data: signedUrlData } = await supabase.storage
        .from("ngo-bills")
        .createSignedUrl(filePath, 3600);

      if (!signedUrlData?.signedUrl) {
        toast.error("Failed to get file URL");
        return;
      }

      // Create bill validation record
      const { data: billValidation, error: insertError } = await supabase
        .from("bill_validations")
        .insert({
          ngo_id: ngo.id,
          transaction_id: transactionId || null,
          file_path: filePath,
          file_name: selectedFile.name,
          amount: amount,
          vendor_name: vendorName || null,
          ai_validation_status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error("Failed to create validation record");
        return;
      }

      setUploadProgress(80);
      setIsUploading(false);
      setIsValidating(true);

      // Call AI validation edge function
      const { data: validationData, error: validationError } = await supabase.functions.invoke(
        "validate-bill",
        {
          body: {
            billValidationId: billValidation.id,
            fileUrl: signedUrlData.signedUrl,
            claimedAmount: amount,
            vendorName: vendorName,
          },
        }
      );

      if (validationError) {
        console.error("Validation error:", validationError);
        toast.error("AI validation failed");
        setValidationResult({
          isValid: false,
          status: "requires_review",
          confidenceScore: 0,
          notes: "Validation failed. Manual review required.",
        });
        return;
      }

      const result: ValidationResult = {
        isValid: validationData.validation.isValid,
        status: validationData.validation.status,
        confidenceScore: validationData.validation.confidenceScore,
        notes: validationData.validation.notes,
      };

      setValidationResult(result);
      onValidationComplete?.(result);

      if (result.status === "valid") {
        toast.success("Bill validated successfully!");
      } else if (result.status === "invalid") {
        toast.error("Bill validation failed. Please check the details.");
      } else {
        toast.warning("Bill requires manual review.");
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred during upload/validation");
    } finally {
      setIsUploading(false);
      setIsValidating(false);
      setUploadProgress(100);
    }
  };

  const getStatusIcon = () => {
    if (!validationResult) return null;
    switch (validationResult.status) {
      case "valid":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "invalid":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "requires_review":
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (!validationResult) return null;
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      valid: "default",
      invalid: "destructive",
      requires_review: "secondary",
    };
    return (
      <Badge variant={variants[validationResult.status] || "secondary"}>
        {validationResult.status === "valid" && "Validated"}
        {validationResult.status === "invalid" && "Invalid"}
        {validationResult.status === "requires_review" && "Requires Review"}
      </Badge>
    );
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Bill Upload & AI Validation
        </CardTitle>
        <CardDescription>
          Upload bills for transactions above ₹50,000 for AI-powered validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Display */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Transaction Amount</p>
          <p className="text-2xl font-bold text-primary">
            ₹{amount.toLocaleString("en-IN")}
          </p>
          {amount >= 50000 && (
            <p className="text-xs text-amber-600 mt-1">
              Bill upload required for amounts ≥ ₹50,000
            </p>
          )}
        </div>

        {/* Vendor Name Input */}
        <div className="space-y-2">
          <Label htmlFor="vendorName">Vendor Name (Optional)</Label>
          <Input
            id="vendorName"
            placeholder="Enter vendor/supplier name"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            disabled={isUploading || isValidating}
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>Upload Bill/Invoice</Label>
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileSelect}
              disabled={isUploading || isValidating}
            />
            {selectedFile ? (
              <div className="space-y-2">
                {previewUrl && (
                  <div className="mx-auto w-32 h-32 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={previewUrl} 
                      alt="Bill preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, or PDF (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {(isUploading || isValidating) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{isValidating ? "AI Validating..." : "Uploading..."}</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">Validation Result</span>
              </div>
              {getStatusBadge()}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence Score</span>
                <span className="font-medium">
                  {(validationResult.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={validationResult.confidenceScore * 100} 
                className="h-2"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {validationResult.notes}
            </p>
          </div>
        )}

        {/* Upload Button */}
        <Button
          className="w-full btn-hover"
          onClick={uploadAndValidate}
          disabled={!selectedFile || isUploading || isValidating}
        >
          {isUploading || isValidating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isValidating ? "Validating with AI..." : "Uploading..."}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Validate Bill
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
