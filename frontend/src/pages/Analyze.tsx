import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  UploadCloud, 
  X, 
  Settings, 
  Eye, 
  FileSearch, 
  ShieldCheck, 
  FileText, 
  Loader2, 
  ScanSearch, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Info,
  Check,
  Zap,
  Clock,
  Camera,
  SwitchCamera,
  Package
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import type { DemoLiveSample } from '../types';

type SlotKey = 'front' | 'back' | 'side1' | 'side2';

const CANONICAL_SLOT_LABELS: Record<SlotKey, string> = {
  front: 'Front',
  back: 'Back',
  side1: 'Side 1',
  side2: 'Side 2'
};

interface SlotDefinition {
  key: SlotKey;
  requirement: 'required' | 'recommended' | 'optional';
}

const BASE_SLOTS: SlotDefinition[] = [
  { key: 'front', requirement: 'required' },
  { key: 'back', requirement: 'recommended' },
  { key: 'side1', requirement: 'optional' },
  { key: 'side2', requirement: 'optional' }
];

interface UploadedSlotItem {
  key: SlotKey;
  label: string;
  file: File;
  preview: string;
}

const MAX_IMAGES = 4;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const STATIC_DEMO_SAMPLES: DemoLiveSample[] = [
  {
    id: 'alpino_oats',
    name: 'Alpino Super Oats (400g)',
    badge: 'COMPLIANT',
    category: 'Food & Cereals',
    compliance_summary: 'Dual-panel verified reference packaging with standard declarations.',
    description: 'Compliant packaged oats with clear MRP, standardized Net Quantity (400g), FSSAI license, and manufacturer details.',
    panels: [
      { slot: 'front', label: 'Front Panel', filename: 'alpino_front.png', url: '/demo-samples/alpino_front.png' },
      { slot: 'back', label: 'Back Panel', filename: 'alpino_back.png', url: '/demo-samples/alpino_back.png' }
    ]
  },
  {
    id: 'takatak_snacks',
    name: 'Tak-a-Tak Snacks',
    badge: 'DEFICIENT',
    category: 'Snack Foods',
    compliance_summary: 'Demonstrates missing statutory net quantity and contact declaration.',
    description: 'Packaged snack label with deficient net weight declaration and missing mandatory consumer grievance contact.',
    panels: [
      { slot: 'front', label: 'Front Panel', filename: 'takatak_front.jpeg', url: '/demo-samples/takatak_front.jpeg' },
      { slot: 'back', label: 'Back Panel', filename: 'takatak_back.jpeg', url: '/demo-samples/takatak_back.jpeg' }
    ]
  }
];

export default function Analyze() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const initialProductId = (searchParams.get('productId') || (location.state as any)?.productId || '').trim();
  const initialProductName = ((location.state as any)?.productName || '').trim();

  const [productId, setProductId] = useState<string>(initialProductId);
  const [productName, setProductName] = useState<string>(initialProductName);

  useEffect(() => {
    if (productId && !productName) {
      let isMounted = true;
      api.getProduct(productId).then(prod => {
        if (isMounted && prod?.product_name) {
          setProductName(prod.product_name);
        }
      }).catch(() => {
        // Non-fatal if product not found or unauthorized
      });
      return () => { isMounted = false; };
    }
  }, [productId, productName]);

  // Dynamic slot localized definitions
  const SLOTS = useMemo(() => [
    {
      key: 'front' as SlotKey,
      label: t('analysis.slots.front_label'),
      requirement: 'required' as const,
      badgeText: t('analysis.slots.required'),
      description: t('analysis.slots.front_desc'),
      hints: t('analysis.slots.front_hints')
    },
    {
      key: 'back' as SlotKey,
      label: t('analysis.slots.back_label'),
      requirement: 'recommended' as const,
      badgeText: t('analysis.slots.recommended'),
      description: t('analysis.slots.back_desc'),
      hints: t('analysis.slots.back_hints')
    },
    {
      key: 'side1' as SlotKey,
      label: t('analysis.slots.side1_label'),
      requirement: 'optional' as const,
      badgeText: t('analysis.slots.optional'),
      description: t('analysis.slots.side1_desc'),
      hints: t('analysis.slots.side1_hints')
    },
    {
      key: 'side2' as SlotKey,
      label: t('analysis.slots.side2_label'),
      requirement: 'optional' as const,
      badgeText: t('analysis.slots.optional'),
      description: t('analysis.slots.side2_desc'),
      hints: t('analysis.slots.side2_hints')
    }
  ], [t]);

  // Dynamic localized conceptual pipeline stages
  const CONCEPTUAL_STAGES = useMemo(() => [
    {
      id: 'images_received',
      title: t('analysis.stages.images_received_title'),
      explanation: t('analysis.stages.images_received_desc'),
      icon: UploadCloud
    },
    {
      id: 'quality_check',
      title: t('analysis.stages.quality_check_title'),
      explanation: t('analysis.stages.quality_check_desc'),
      icon: Eye
    },
    {
      id: 'ocr_extraction',
      title: t('analysis.stages.ocr_extraction_title'),
      explanation: t('analysis.stages.ocr_extraction_desc'),
      icon: ScanSearch
    },
    {
      id: 'declaration_extraction',
      title: t('analysis.stages.declaration_extraction_title'),
      explanation: t('analysis.stages.declaration_extraction_desc'),
      icon: FileSearch
    },
    {
      id: 'rules_evaluation',
      title: t('analysis.stages.rules_evaluation_title'),
      explanation: t('analysis.stages.rules_evaluation_desc'),
      icon: Settings
    },
    {
      id: 'compliance_screening',
      title: t('analysis.stages.compliance_screening_title'),
      explanation: t('analysis.stages.compliance_screening_desc'),
      icon: ShieldCheck
    },
    {
      id: 'preparing_results',
      title: t('analysis.stages.preparing_results_title'),
      explanation: t('analysis.stages.preparing_results_desc'),
      icon: FileText
    }
  ], [t]);

  // Dedicated file inputs for each slot (Gallery & Native Camera)
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const side1InputRef = useRef<HTMLInputElement>(null);
  const side2InputRef = useRef<HTMLInputElement>(null);

  const slotInputRefs: Record<SlotKey, React.RefObject<HTMLInputElement | null>> = {
    front: frontInputRef,
    back: backInputRef,
    side1: side1InputRef,
    side2: side2InputRef
  };

  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);
  const side1CameraInputRef = useRef<HTMLInputElement>(null);
  const side2CameraInputRef = useRef<HTMLInputElement>(null);

  const slotCameraInputRefs: Record<SlotKey, React.RefObject<HTMLInputElement | null>> = {
    front: frontCameraInputRef,
    back: backCameraInputRef,
    side1: side1CameraInputRef,
    side2: side2CameraInputRef
  };

  // General multi-file input for bulk drag & drop
  const generalFileInputRef = useRef<HTMLInputElement>(null);

  const [slotItems, setSlotItems] = useState<Record<SlotKey, UploadedSlotItem | null>>({
    front: null,
    back: null,
    side1: null,
    side2: null
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<SlotKey | 'general' | null>(null);
  const [demoActiveCase, setDemoActiveCase] = useState<number | null>(null);

  // Demo Samples Quick-Loading State (Sprint 3 Task 2)
  const [demoSamples, setDemoSamples] = useState<DemoLiveSample[]>(STATIC_DEMO_SAMPLES);
  const [isLoadingSampleId, setIsLoadingSampleId] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<DemoLiveSample | null>(null);
  const [sampleLoadError, setSampleLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getDemoSamples()
      .then(samples => {
        if (isMounted && Array.isArray(samples) && samples.length > 0) {
          setDemoSamples(samples);
        }
      })
      .catch(() => {
        // Fallback to STATIC_DEMO_SAMPLES seamlessly
      });
    return () => { isMounted = false; };
  }, []);

  // Live Camera Scanner State & Handlers
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeCameraSlot, setActiveCameraSlot] = useState<SlotKey>('front');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async (slot: SlotKey) => {
    setActiveCameraSlot(slot);
    setCameraError(null);
    setIsCameraReady(false);
    setIsCameraOpen(true);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch {
      setCameraError("Camera access denied or unavailable. Please enable camera permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  // Close live camera on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCameraOpen) {
        stopCamera();
      }
    };
    if (isCameraOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCameraOpen, cameraStream]);

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `${activeCameraSlot}_live_snapshot.jpg`, { type: 'image/jpeg' });
      handleSlotFileSelected(activeCameraSlot, file);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const toggleFacingMode = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch {
      // Fallback
    }
  };

  const stageIntervalRef = useRef<number | null>(null);
  const slotItemsRef = useRef(slotItems);
  useEffect(() => {
    slotItemsRef.current = slotItems;
  }, [slotItems]);

  // Clean up object URLs and timers on unmount
  useEffect(() => {
    return () => {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      Object.values(slotItemsRef.current).forEach(item => {
        if (item?.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  const stagedItems = BASE_SLOTS
    .map(slot => slotItems[slot.key])
    .filter((item): item is UploadedSlotItem => item !== null);

  const stagedCount = stagedItems.length;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      return `"${file.name}" is not a supported format. Please upload JPG, PNG, or WEBP images.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" exceeds the 10MB file size limit.`;
    }
    return null;
  };

  const handleSlotFileSelected = (slotKey: SlotKey, file: File) => {
    setError(null);
    setSelectedSample(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (slotItems[slotKey]?.preview) {
      URL.revokeObjectURL(slotItems[slotKey]!.preview);
    }

    const slotDef = SLOTS.find(s => s.key === slotKey)!;
    const previewUrl = URL.createObjectURL(file);

    setSlotItems(prev => ({
      ...prev,
      [slotKey]: {
        key: slotKey,
        label: slotDef.label,
        file,
        preview: previewUrl
      }
    }));
  };

  const handleBulkFiles = (files: FileList | File[]) => {
    setError(null);
    setSelectedSample(null);
    const fileArray = Array.from(files);

    if (fileArray.length > MAX_IMAGES) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images per package.`);
      return;
    }

    const emptySlotKeys = BASE_SLOTS
      .map(s => s.key)
      .filter(key => slotItems[key] === null);

    if (emptySlotKeys.length === 0 && fileArray.length > 0) {
      setError('All 4 image slots are already occupied. Remove or replace existing images to add new ones.');
      return;
    }

    const newSlots = { ...slotItems };
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const targetKey = emptySlotKeys[i] || (BASE_SLOTS[i] ? BASE_SLOTS[i].key : null);
      if (targetKey) {
        if (newSlots[targetKey]?.preview) {
          URL.revokeObjectURL(newSlots[targetKey]!.preview);
        }
        const slotDef = SLOTS.find(s => s.key === targetKey)!;
        newSlots[targetKey] = {
          key: targetKey,
          label: slotDef.label,
          file,
          preview: URL.createObjectURL(file)
        };
      }
    }

    setSlotItems(newSlots);
  };

  const handleSlotInputChange = (slotKey: SlotKey, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSlotFileSelected(slotKey, e.target.files[0]);
      e.target.value = '';
    }
  };

  const removeSlotItem = (slotKey: SlotKey) => {
    setSlotItems(prev => {
      const current = prev[slotKey];
      if (current?.preview) {
        URL.revokeObjectURL(current.preview);
      }
      return {
        ...prev,
        [slotKey]: null
      };
    });
    setSelectedSample(null);
  };

  const clearAll = () => {
    Object.values(slotItems).forEach(item => {
      if (item?.preview) URL.revokeObjectURL(item.preview);
    });
    setSlotItems({
      front: null,
      back: null,
      side1: null,
      side2: null
    });
    setSelectedSample(null);
    setSampleLoadError(null);
    setError(null);
  };

  const handleSelectSample = async (sample: DemoLiveSample) => {
    if (isProcessing || isLoadingSampleId) return;
    setIsLoadingSampleId(sample.id);
    setSampleLoadError(null);
    setError(null);

    try {
      // Revoke any previous preview URLs
      Object.values(slotItems).forEach(item => {
        if (item?.preview) URL.revokeObjectURL(item.preview);
      });

      const newSlots: Record<SlotKey, UploadedSlotItem | null> = {
        front: null,
        back: null,
        side1: null,
        side2: null
      };

      for (const panel of sample.panels) {
        const slotKey = panel.slot as SlotKey;
        let blob: Blob | null = null;

        // 1. Try backend static endpoint first
        try {
          const backendUrl = api.getDemoSampleImageUrl(panel.filename);
          const resp = await fetch(backendUrl);
          if (resp.ok) {
            blob = await resp.blob();
          }
        } catch {
          // Fallback to local static asset
        }

        // 2. Fallback to /demo-samples/{filename}
        if (!blob) {
          const fallbackUrl = `/demo-samples/${panel.filename}`;
          const resp = await fetch(fallbackUrl);
          if (!resp.ok) {
            throw new Error(`Failed to load demo fixture "${panel.filename}" (${resp.status})`);
          }
          blob = await resp.blob();
        }

        const mimeType = blob.type || (panel.filename.endsWith('.png') ? 'image/png' : 'image/jpeg');
        const file = new File([blob], panel.filename, { type: mimeType });
        const previewUrl = URL.createObjectURL(file);
        const slotDef = SLOTS.find(s => s.key === slotKey);

        newSlots[slotKey] = {
          key: slotKey,
          label: slotDef?.label || CANONICAL_SLOT_LABELS[slotKey],
          file,
          preview: previewUrl
        };
      }

      setSlotItems(newSlots);
      setSelectedSample(sample);
    } catch (err: any) {
      console.error('Failed to load demo sample images:', err);
      setSampleLoadError(err?.message || 'Could not load demo sample images. Please try again or upload files manually.');
    } finally {
      setIsLoadingSampleId(null);
    }
  };

  // Drag and drop handlers for specific slots
  const handleSlotDragOver = (slotKey: SlotKey, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(slotKey);
  };

  const handleSlotDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
  };

  const handleSlotDrop = (slotKey: SlotKey, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length === 1) {
        handleSlotFileSelected(slotKey, e.dataTransfer.files[0]);
      } else {
        handleBulkFiles(e.dataTransfer.files);
      }
    }
  };

  const startPipelineAnimation = (isDemo = false) => {
    if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
    
    setActiveStageIndex(1);
    setIsComplete(false);

    const stepDuration = isDemo ? 220 : 650;

    stageIntervalRef.current = window.setInterval(() => {
      setActiveStageIndex(prev => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, stepDuration);
  };

  const finishPipelineAndNavigate = async (result: any, isDemo = false, caseNum?: number) => {
    if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);

    setActiveStageIndex(6);
    setIsComplete(true);

    await new Promise(resolve => setTimeout(resolve, isDemo ? 250 : 450));

    navigate(`/results/${result.id}`, { 
      state: { 
        analysisData: result,
        isDemo,
        demoCaseId: caseNum 
      } 
    });
  };

  const startAnalysis = async () => {
    if (stagedCount === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    setDemoActiveCase(null);
    startPipelineAnimation(false);

    try {
      const payload = stagedItems.map(item => ({
        file: item.file,
        label: CANONICAL_SLOT_LABELS[item.key] || 'Front'
      }));
      const result = await api.analyzeProducts(payload, productId.trim() ? productId.trim() : undefined);
      await finishPipelineAndNavigate(result, false);
    } catch (err: any) {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      console.error('Analysis submission error:', err);
      const serverMsg = err?.message || 'Analysis could not be completed. Something went wrong while processing the package. Please try again.';
      setError(serverMsg);
      setIsProcessing(false);
    }
  };

  const runDemo = async (caseNum: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);
    setDemoActiveCase(caseNum);
    startPipelineAnimation(true);

    try {
      const result = await api.getDemoCase(caseNum);
      await finishPipelineAndNavigate(result, true, caseNum);
    } catch (err: any) {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      console.error('Demo analysis error:', err);
      const errorMsg = err?.message || 'Benchmark demonstration could not be loaded. Please try again.';
      setError(errorMsg);
      setIsProcessing(false);
    }
  };

  const handleBackToAnalyze = () => {
    if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
    setIsProcessing(false);
    setError(null);
    setIsComplete(false);
    setActiveStageIndex(0);
  };

  const currentStage = CONCEPTUAL_STAGES[activeStageIndex] || CONCEPTUAL_STAGES[0];
  const ActiveIcon = currentStage.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hidden File & Camera Inputs */}
      {SLOTS.map(slot => (
        <React.Fragment key={slot.key}>
          {/* Standard Gallery / File Picker */}
          <input 
            type="file" 
            ref={slotInputRefs[slot.key]} 
            onChange={(e) => handleSlotInputChange(slot.key, e)} 
            accept="image/jpeg,image/png,image/webp" 
            className="hidden" 
            aria-label={`Upload ${slot.label} Image from Files`}
          />
          {/* Native Mobile Camera Snap */}
          <input 
            type="file" 
            ref={slotCameraInputRefs[slot.key]} 
            onChange={(e) => handleSlotInputChange(slot.key, e)} 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            aria-label={`Take live photo with camera for ${slot.label}`}
          />
        </React.Fragment>
      ))}
      <input 
        type="file" 
        ref={generalFileInputRef} 
        onChange={(e) => {
          if (e.target.files) handleBulkFiles(e.target.files);
          e.target.value = '';
        }} 
        accept="image/jpeg,image/png,image/webp" 
        multiple
        className="hidden" 
        aria-label="Upload multiple packaging images"
      />

      {/* Error Alert Banner when not on processing screen */}
      {!isProcessing && error && (
        <div 
          role="alert"
          className="p-4 rounded-xl bg-red-50/95 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-900 dark:text-red-200 flex items-start gap-3 text-sm shadow-2xs"
        >
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-red-950 dark:text-red-100">{t('common.error')}</p>
            <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">{error}</p>
          </div>
          {stagedCount > 0 && (
            <button
              onClick={startAnalysis}
              className="px-2.5 py-1 bg-red-100 dark:bg-red-900/60 hover:bg-red-200 dark:hover:bg-red-800/60 text-red-900 dark:text-red-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('common.retry')}</span>
            </button>
          )}
          <button 
            onClick={() => setError(null)} 
            className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isProcessing ? (
        <>
          {/* Main Hero & Upload Workflow Section */}
          <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
            {/* Header / Hero */}
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/10 bg-gradient-to-b from-slate-50/70 dark:from-white/[0.03] to-white dark:to-[#101A2C] text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/70 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{t('analysis.ai_badge')}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{t('analysis.mode_live_scanner')}</span>
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('analysis.analyze_package')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t('analysis.upload_instruction')}
                  </p>
                </div>

                {/* Clear All Action */}
                {stagedCount > 0 && (
                  <div className="flex items-center justify-center sm:justify-end shrink-0">
                    <button 
                      onClick={clearAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                      aria-label="Clear all uploaded images"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t('analysis.clear_all')} ({stagedCount})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Linked SKU Context Banner if productId is present */}
            {productId && (
              <div className="px-6 py-3 bg-teal-50/80 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {t('sku_workflow.screening_for_sku')}:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {productName || productId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProductId('');
                    setProductName('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 font-medium transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>{t('sku_workflow.unlink')}</span>
                </button>
              </div>
            )}

            {/* Upload Instructions Banner */}
            <div className="px-6 py-4 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">{t('analysis.banner_upload_guide')}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 text-[11px] font-semibold">
                  {t('analysis.banner_front_required')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 text-[11px] font-semibold">
                  {t('analysis.banner_back_recommended')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 text-[11px]">
                  {t('analysis.banner_side1_optional')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 text-[11px]">
                  {t('analysis.banner_side2_optional')}
                </span>
              </div>
            </div>

            {/* Quick-Load Live Demo Packaging Samples Section */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-50/90 via-teal-50/30 to-slate-50/90 dark:from-[#101A2C] dark:via-[#173B57]/20 dark:to-[#101A2C] border-b border-slate-100 dark:border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      {t('analysis.demo_samples.title')}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('analysis.demo_samples.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live AI OCR Handoff</span>
                  </span>
                </div>
              </div>

              {/* Sample Loading Error Alert */}
              {sampleLoadError && (
                <div 
                  role="alert"
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span>{sampleLoadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSampleLoadError(null)}
                    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Sample Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {demoSamples.map((sample) => {
                  const isSelected = selectedSample?.id === sample.id;
                  const isLoadingThis = isLoadingSampleId === sample.id;
                  const isCompliant = sample.badge === 'COMPLIANT';

                  return (
                    <div
                      key={sample.id}
                      className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between text-left ${
                        isSelected
                          ? 'border-teal-500/80 bg-white dark:bg-[#173B57]/30 shadow-xs ring-2 ring-teal-500/20'
                          : 'border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] hover:border-teal-300 dark:hover:border-teal-500/50 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCompliant
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80'
                          }`}>
                            {isCompliant ? t('analysis.demo_samples.alpino_type') : t('analysis.demo_samples.takatak_type')}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 font-mono">
                            {sample.panels.length} Panels (Front + Back)
                          </span>
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {sample.name}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {sample.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {isCompliant ? 'Verified Reference SKU' : 'Rule Violation Scenario'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSelectSample(sample)}
                          disabled={isLoadingThis || isProcessing}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-[#173B57] hover:bg-[#101A2C] dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-[#101A2C] text-white shadow-2xs active:scale-95'
                          } ${isLoadingThis || isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{t('analysis.demo_samples.loading')}</span>
                            </>
                          ) : isSelected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t('analysis.demo_samples.loaded_badge')}</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>{t('analysis.demo_samples.load_sample')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Staged Sample Notice */}
              {selectedSample && (
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/90 dark:border-teal-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-teal-950 dark:text-teal-200 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>
                      Staged <strong>{selectedSample.panels.length} panels</strong> for <strong>{selectedSample.name}</strong>. Inspect preview thumbnails below, then click <strong>Run Live AI Analysis</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:text-red-600 dark:hover:text-red-400 self-end sm:self-auto cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Unload Sample</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4-Slot Upload Grid */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {SLOTS.map((slot) => {
                  const item = slotItems[slot.key];
                  const isHovered = dragOverSlot === slot.key;

                  return (
                    <div
                      key={slot.key}
                      onDragOver={(e) => handleSlotDragOver(slot.key, e)}
                      onDragLeave={handleSlotDragLeave}
                      onDrop={(e) => handleSlotDrop(slot.key, e)}
                      className={`relative rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                        item 
                          ? 'border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#101A2C] shadow-2xs hover:border-teal-300 dark:hover:border-teal-500/50' 
                          : isHovered
                            ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm scale-[0.99]'
                            : 'border-dashed border-slate-300 dark:border-white/15 bg-slate-50/40 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-teal-300 dark:hover:border-teal-400/50'
                      }`}
                    >
                      {/* Slot Header */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {slot.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            slot.requirement === 'required'
                              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80'
                              : slot.requirement === 'recommended'
                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80'
                                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                          }`}>
                            {slot.badgeText}
                          </span>
                        </div>

                        {/* Status badge when uploaded */}
                        {item && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/80">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{t('analysis.image_added')}</span>
                          </span>
                        )}
                      </div>

                      {/* Slot Content Body */}
                      <div className="p-4 flex-1 flex flex-col justify-center">
                        {item ? (
                          /* Uploaded State: Image Preview & Details */
                          <div className="space-y-3">
                            <div className="relative w-full h-44 bg-slate-950/5 dark:bg-black/40 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden flex items-center justify-center">
                              <img 
                                src={item.preview} 
                                alt={`${slot.label} label preview`}
                                className="w-full h-full object-contain p-1"
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={item.file.name}>
                                  {item.file.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                                      slotCameraInputRefs[slot.key].current?.click();
                                    } else {
                                      startCamera(slot.key);
                                    }
                                  }}
                                  className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                                  title={t('analysis.retake_camera_title')}
                                >
                                  <Camera className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => slotInputRefs[slot.key].current?.click()}
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-lg transition-colors cursor-pointer"
                                  aria-label={`Replace ${slot.label} from Gallery`}
                                >
                                  {t('analysis.gallery')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSlotItem(slot.key)}
                                  className="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/60 border border-slate-200 dark:border-white/10 rounded-lg transition-colors cursor-pointer"
                                  aria-label={`Remove ${slot.label} image`}
                                >
                                  {t('analysis.remove')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Empty State: Dropzone & Choose Button */
                          <div 
                            onClick={() => slotInputRefs[slot.key].current?.click()}
                            className="py-6 px-4 text-center cursor-pointer flex flex-col items-center justify-center space-y-2.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
                            tabIndex={0}
                            role="button"
                            aria-label={`Upload ${slot.label} image: ${slot.description}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                slotInputRefs[slot.key].current?.click();
                              }
                            }}
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
                              <UploadCloud className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                            </div>

                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {slot.description}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight max-w-xs mx-auto">
                                {slot.hints}
                              </p>
                            </div>

                            <div className="mt-3 flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs justify-center" onClick={(e) => e.stopPropagation()}>
                              {/* Option 1: Live Camera Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                                    slotCameraInputRefs[slot.key].current?.click();
                                  } else {
                                    startCamera(slot.key);
                                  }
                                }}
                                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#173B57] hover:bg-[#101A2C] dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-[#101A2C] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                                title={`Take live photo with camera for ${slot.label}`}
                              >
                                <Camera className="w-4 h-4" />
                                <span>{t('analysis.live_camera')}</span>
                              </button>

                              {/* Option 2: Gallery / Files Picker */}
                              <button
                                type="button"
                                onClick={() => slotInputRefs[slot.key].current?.click()}
                                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-300 dark:border-white/15 rounded-xl transition-colors cursor-pointer"
                                title="Choose photo from phone gallery or files"
                              >
                                <UploadCloud className="w-4 h-4 text-slate-500" />
                                <span>{t('analysis.gallery_files')}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action / CTA Bar */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Validation / Helper Status with Mode Indicator */}
                <div className="text-xs">
                  {stagedCount === 0 ? (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span>{t('analysis.validation_add_image')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{t('analysis.mode_ready_to_analyze')}</span>
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {stagedCount === 1 
                          ? t('analysis.staged_count_single') 
                          : t('analysis.staged_count_multiple', { count: stagedCount })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary CTA Button */}
                <button 
                  type="button"
                  onClick={startAnalysis}
                  disabled={stagedCount === 0 || isProcessing}
                  className={`px-8 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    stagedCount === 0 || isProcessing
                      ? 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none border border-transparent dark:border-white/5'
                      : 'bg-[#173B57] hover:bg-[#101A2C] dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-[#101A2C] text-white shadow-md active:scale-98'
                  }`}
                  aria-label="Run Live AI Analysis"
                >
                  <ScanSearch className="w-4 h-4" />
                  <span>
                    Run Live AI Analysis {stagedCount > 0 ? `(${stagedCount} ${stagedCount === 1 ? 'Panel' : 'Panels'})` : ''}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Guidance & Specifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Quality Guidance */}
            <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{t('analysis.accuracy_title')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.03] p-2 rounded-lg border border-slate-100 dark:border-white/5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('analysis.accuracy_flat')}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.03] p-2 rounded-lg border border-slate-100 dark:border-white/5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('analysis.accuracy_lighting')}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.03] p-2 rounded-lg border border-slate-100 dark:border-white/5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('analysis.accuracy_glare')}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.03] p-2 rounded-lg border border-slate-100 dark:border-white/5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('analysis.accuracy_complete')}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                {t('analysis.accuracy_footer')}
              </p>
            </div>

            {/* Supported Formats & Guidelines */}
            <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider mb-3">
                  <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>{t('analysis.specs_title')}</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p><strong className="text-slate-900 dark:text-slate-100">{t('analysis.specs_formats_label')}</strong> JPG, JPEG, PNG, WEBP</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">{t('analysis.specs_size_label')}</strong> {t('analysis.specs_size_val')}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">{t('analysis.specs_capacity_label')}</strong> {t('analysis.specs_capacity_val')}</p>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-white/10">
                {t('analysis.statutory_footer')}
              </div>
            </div>
          </div>

          {/* Precomputed Demonstration Benchmarks */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('analysis.benchmarks_title')}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                    Precomputed Demo Result
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/demo')}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>{t('analysis.benchmarks_full_guide')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div 
                onClick={() => runDemo(1)} 
                className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-[#101A2C] hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-all text-left flex flex-col justify-between shadow-2xs group cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      {t('status.compliant')} (95.5%)
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {t('analysis.benchmarks_case1_title')}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('analysis.benchmarks_case1_desc')}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Load Precomputed Result</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => runDemo(2)} 
                className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-[#101A2C] hover:bg-amber-50/40 dark:hover:bg-amber-950/30 transition-all text-left flex flex-col justify-between shadow-2xs group cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                      {t('status.needs_review')} (76.9%)
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {t('analysis.benchmarks_case2_title')}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('analysis.benchmarks_case2_desc')}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span>Load Precomputed Result</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => runDemo(3)} 
                className="p-4 rounded-xl border border-red-200 dark:border-red-800/60 bg-white dark:bg-[#101A2C] hover:bg-red-50/40 dark:hover:bg-red-950/30 transition-all text-left flex flex-col justify-between shadow-2xs group cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300">
                      {t('status.fail')} (37.9%)
                    </span>
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {t('analysis.benchmarks_case3_title')}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('analysis.benchmarks_case3_desc')}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-red-700 dark:text-red-400">
                  <span>Load Precomputed Result</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* PHASE 2: PROCESSING / SCANNING SCREEN                                     */
        /* ========================================================================= */
        <div className="bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden animate-in fade-in zoom-in-98 duration-200">
          {/* Top Processing Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/10 bg-gradient-to-b from-slate-50/50 dark:from-white/[0.03] to-white dark:to-[#101A2C]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 mb-1 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{t('analysis.ai_badge')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                  <span>{error ? t('analysis.processing_paused') : isComplete ? t('analysis.processing_complete') : t('analysis.processing_active')}</span>
                  {!error && !isComplete && (
                    <Loader2 className="w-6 h-6 text-teal-600 dark:text-teal-400 animate-spin shrink-0" />
                  )}
                  {isComplete && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {error 
                    ? t('analysis.processing_err_desc') 
                    : isComplete 
                      ? t('analysis.processing_complete_desc') 
                      : t('analysis.processing_active_desc')}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>
                    LIVE AI PIPELINE &bull; {stagedCount} {stagedCount === 1 ? 'image' : 'images'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Processing Screen Content or Error Card */}
          {error ? (
            /* Error State */
            <div className="p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t('analysis.error_failed_title')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {error}
                </p>
                {stagedCount > 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {stagedCount === 1 
                      ? t('analysis.staged_count_single') 
                      : t('analysis.staged_count_multiple', { count: stagedCount })}
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={demoActiveCase ? () => runDemo(demoActiveCase) : startAnalysis}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold bg-[#173B57] hover:bg-[#101A2C] dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-[#101A2C] text-white text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-98 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('analysis.try_again')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleBackToAnalyze}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('analysis.back_to_analyze')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Main 2-Column Processing View */
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* Left Column: Package Previews & Dynamic Stage Explanation */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/90 dark:border-white/10 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {t('analysis.package_being_analyzed')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                        {demoActiveCase ? 'Demo Benchmark' : `${stagedCount} Panel${stagedCount > 1 ? 's' : ''}`}
                      </span>
                    </div>

                    {/* Previews Grid */}
                    <div className={`grid gap-2.5 ${stagedCount === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {stagedCount > 0 ? (
                        stagedItems.map((item) => (
                          <div 
                            key={item.key} 
                            className="relative rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-950/5 dark:bg-black/40 overflow-hidden flex items-center justify-center group"
                            style={{ height: stagedCount === 1 ? '220px' : '130px' }}
                          >
                            <img 
                              src={item.preview} 
                              alt={`${item.label} packaging panel`}
                              className="w-full h-full object-contain p-1"
                            />
                            {/* Panel Label Pill */}
                            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/85 text-white backdrop-blur-xs">
                              {item.label}
                            </span>
                            {/* Scanning Light Line Overlay */}
                            <div 
                              className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_rgba(53,198,176,0.8)] motion-reduce:hidden animate-pulse pointer-events-none"
                              style={{ top: `${((activeStageIndex + 1) * 14) % 90}%` }}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="h-36 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.02] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-1">
                          <ScanSearch className="w-8 h-8 text-teal-500 animate-pulse" />
                          <span className="text-xs font-semibold">Benchmark Package Panels</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Stage Callout Card */}
                  <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/90 dark:border-teal-800/80 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
                      <div className="w-6 h-6 rounded-lg bg-[#173B57] dark:bg-teal-500 text-white dark:text-[#101A2C] flex items-center justify-center shrink-0">
                        {isComplete ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <ActiveIcon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {isComplete ? t('analysis.processing_complete') : currentStage.title}
                      </span>
                    </div>
                    <p className="text-xs text-teal-950 dark:text-teal-200 font-medium leading-relaxed">
                      {isComplete 
                        ? t('analysis.stages.preparing_results_desc') 
                        : currentStage.explanation}
                    </p>
                  </div>
                </div>

                {/* Right Column: Conceptual Processing Pipeline Timeline */}
                <div className="lg:col-span-7 bg-white dark:bg-[#101A2C] rounded-2xl border border-slate-200/90 dark:border-white/10 p-5 sm:p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {t('analysis.pipeline_title')}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                      {t('analysis.stage_progress', { current: activeStageIndex + 1, total: CONCEPTUAL_STAGES.length })}
                    </span>
                  </div>

                  {/* Vertical Timeline */}
                  <div className="space-y-3 relative" role="status" aria-live="polite" aria-label="Analysis progress status">
                    {CONCEPTUAL_STAGES.map((stage, idx) => {
                      const StageIcon = stage.icon;
                      const isPast = idx < activeStageIndex;
                      const isCurrent = idx === activeStageIndex;

                      return (
                        <div 
                          key={stage.id} 
                          className="flex items-start gap-3.5 relative"
                          aria-label={`${stage.title} — ${isPast ? 'completed' : isCurrent ? 'currently processing' : 'waiting'}`}
                        >
                          {/* Connector Line */}
                          {idx < CONCEPTUAL_STAGES.length - 1 && (
                            <div 
                              className={`absolute left-4 top-8 w-0.5 h-7 -ml-[1px] transition-colors duration-300 ${
                                isPast ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-slate-200 dark:border-white/10 dark:bg-white/10'
                              }`} 
                            />
                          )}

                          {/* Stage Status Icon Indicator */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 z-10 ${
                            isPast 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs' 
                              : isCurrent 
                                ? 'bg-teal-500 border-teal-500 text-[#101A2C] shadow-sm ring-4 ring-teal-100 dark:ring-teal-900/60 animate-pulse' 
                                : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-600'
                          }`}>
                            {isPast ? (
                              <Check className="w-4 h-4" />
                            ) : isCurrent ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <StageIcon className="w-4 h-4" />
                            )}
                          </div>

                          {/* Stage Information */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`text-xs transition-colors ${
                                isCurrent 
                                  ? 'font-bold text-teal-950 dark:text-teal-300 text-sm' 
                                  : isPast 
                                    ? 'font-semibold text-slate-900 dark:text-slate-100' 
                                    : 'font-medium text-slate-400 dark:text-slate-500'
                              }`}>
                                {stage.title}
                              </h4>

                              {/* Stage Status Tag */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                isPast 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80' 
                                  : isCurrent 
                                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/80' 
                                    : 'bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10'
                              }`}>
                                {isPast ? t('analysis.stage_completed') : isCurrent ? t('analysis.stage_in_progress') : t('analysis.stage_pending')}
                              </span>
                            </div>

                            <p className={`text-[11px] mt-0.5 transition-colors ${
                              isCurrent ? 'text-teal-800 dark:text-teal-300 font-medium' : isPast ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {stage.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Informational Privacy & System Pipeline Footer */}
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('analysis.privacy_pipeline_notice')}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  Legal Metrology Rules 2011 &amp; FSSAI
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Camera Scanner Modal */}
      {isCameraOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label={t('analysis.camera_title')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          <div className="bg-[#101A2C] rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 border border-white/15 flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{t('analysis.camera_title')}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                      {t('analysis.camera_target', { panel: SLOTS.find(s => s.key === activeCameraSlot)?.label || '' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{t('analysis.camera_instruction')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close camera scanner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Slot Selector within Camera */}
            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 self-center">
              {SLOTS.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveCameraSlot(s.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCameraSlot === s.key 
                      ? 'bg-teal-500 text-[#101A2C] shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Video Viewfinder Container */}
            <div className="relative w-full aspect-[4/3] max-h-[55vh] bg-black rounded-2xl overflow-hidden border border-white/15 shadow-inner flex items-center justify-center">
              {cameraError ? (
                <div className="p-6 text-center text-red-400 text-xs space-y-2 max-w-sm">
                  <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
                  <p className="font-bold text-white">Camera Error</p>
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCamera(activeCameraSlot)}
                    className="mt-2 px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-200 rounded-lg text-xs font-bold"
                  >
                    Retry Permission
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Packaging Guide Overlay Frame */}
                  <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-teal-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-t-4 border-l-4 border-teal-400 -mt-1 -ml-1" />
                      <div className="w-5 h-5 border-t-4 border-r-4 border-teal-400 -mt-1 -mr-1" />
                    </div>
                    <div className="text-center">
                      <span className="bg-slate-900/80 backdrop-blur-xs text-teal-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-teal-500/40">
                        {t('analysis.camera_align_guide')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-b-4 border-l-4 border-teal-400 -mb-1 -ml-1" />
                      <div className="w-5 h-5 border-b-4 border-r-4 border-teal-400 -mb-1 -mr-1" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Controls Bar */}
            <div className="w-full flex items-center justify-between px-4 pt-1">
              <button
                type="button"
                onClick={toggleFacingMode}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold border border-white/10 transition cursor-pointer"
                title="Switch between front and back camera"
                aria-label="Switch between front and back camera"
              >
                <SwitchCamera className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">{t('analysis.camera_flip')}</span>
              </button>

              {/* Big Shutter Capture Button */}
              <button
                type="button"
                onClick={captureSnapshot}
                disabled={!isCameraReady && !cameraStream}
                className="w-14 h-14 rounded-full bg-white border-4 border-teal-500 hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
                title="Capture Frame"
                aria-label="Capture snapshot from camera"
              >
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-[#101A2C]">
                  <Camera className="w-5 h-5" />
                </div>
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold border border-white/10 transition cursor-pointer"
                aria-label="Cancel and close camera"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
